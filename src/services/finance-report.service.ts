import { createAdminClient } from '@/utils/supabase/admin';
import {
    FinancePoReportRowDTO,
    FinancePoLineItemDTO,
    FinanceSupplierInvoiceDetailDTO,
    FinanceSupplierPaymentDetailDTO,
    FinanceLedgerDTO,
    FinanceLedgerRowDTO,
    FinanceLedgerInvoiceDTO,
    FinanceCustomerInvoiceLineItemDTO,
    FinanceCustomerPaymentDetailDTO,
    FinanceTourExpenseDetailDTO,
    FinanceTourDossierDTO,
} from '../dtos/finance-report.dto';

const num = (v: any): number | null => (v === null || v === undefined ? null : Number(v));

export class FinanceReportService {
    /**
     * Reads the read-only v_finance_po_report view (one row per PO) and enriches each row
     * with its PO header metadata, PO line items, supplier invoices (with line items & bill copies),
     * and supplier payment vouchers (with bank slips).
     * Numeric columns come back from PostgREST as numbers or strings, so they are normalised here; NULL stays NULL.
     */
    static async getPoReport(): Promise<FinancePoReportRowDTO[]> {
        const supabase = createAdminClient();
        const [
            viewRes,
            poRes,
            poItemsRes,
            supInvRes,
            supInvItemsRes,
            supPayRes,
        ] = await Promise.all([
            supabase
                .from('v_finance_po_report')
                .select('*')
                .eq('po_status', 'Accepted')
                .order('po_date', { ascending: false, nullsFirst: false })
                .order('po_number', { ascending: false }),
            supabase
                .from('purchase_orders')
                .select('id, vendor_address, vendor_phone, vendor_email, payment_terms, subtotal, discount, tax, signed_document_url, internal_notes, vendor_notes, settled_by_name, settled_date, settlement_notes'),
            supabase
                .from('purchase_order_items')
                .select('id, purchase_order_id, day_number, service_date, description, quantity, unit_price, total_price, fx_rate, unit_price_lkr, total_price_lkr, service_details, special_notes')
                .order('day_number', { ascending: true, nullsFirst: false }),
            supabase
                .from('supplier_invoices')
                .select('id, purchase_order_id, invoice_number, invoice_type, invoice_date, due_date, currency, exchange_rate, amount, status, attachment_url, is_tallied, discrepancy_amount, approved_by, approved_at')
                .order('invoice_date', { ascending: false, nullsFirst: false }),
            supabase
                .from('supplier_invoice_items')
                .select('id, supplier_invoice_id, purchase_order_item_id, description, quantity, unit_price, total_price'),
            supabase
                .from('supplier_payments')
                .select('id, purchase_order_id, supplier_invoice_id, payment_date, created_at, amount, currency, exchange_rate, payment_method, payment_reference, notes, attachment_url, is_refund, refund_reason, refund_description')
                .order('payment_date', { ascending: false, nullsFirst: false }),
        ]);

        if (viewRes.error) throw viewRes.error;
        for (const r of [poRes, poItemsRes, supInvRes, supInvItemsRes, supPayRes]) {
            if (r.error) throw r.error;
        }

        const poMetaById = new Map<string, any>((poRes.data || []).map((p: any) => [p.id, p]));

        const poItemsByPo = new Map<string, FinancePoLineItemDTO[]>();
        for (const it of poItemsRes.data || []) {
            let cleanNotes: string | null = it.special_notes || null;
            if (cleanNotes && cleanNotes.includes('BLOCK_REF:')) {
                const parts = cleanNotes.split('|| BLOCK_REF:');
                cleanNotes = parts.length > 1 ? (parts[0].trim() || null) : null;
            }
            const dto: FinancePoLineItemDTO = {
                id: it.id,
                purchase_order_id: it.purchase_order_id,
                day_number: num(it.day_number),
                service_date: it.service_date || null,
                description: it.description || '',
                quantity: Number(it.quantity) || 1,
                unit_price: num(it.unit_price),
                total_price: num(it.total_price),
                fx_rate: num(it.fx_rate),
                unit_price_lkr: num(it.unit_price_lkr),
                total_price_lkr: num(it.total_price_lkr),
                service_details: it.service_details || null,
                special_notes: cleanNotes,
            };
            const list = poItemsByPo.get(it.purchase_order_id) || [];
            list.push(dto);
            poItemsByPo.set(it.purchase_order_id, list);
        }

        const supInvItemsByInv = new Map<string, any[]>();
        for (const item of supInvItemsRes.data || []) {
            const list = supInvItemsByInv.get(item.supplier_invoice_id) || [];
            list.push({
                id: item.id,
                supplier_invoice_id: item.supplier_invoice_id,
                purchase_order_item_id: item.purchase_order_item_id || null,
                description: item.description || '',
                quantity: Number(item.quantity) || 1,
                unit_price: Number(item.unit_price) || 0,
                total_price: Number(item.total_price) || 0,
            });
            supInvItemsByInv.set(item.supplier_invoice_id, list);
        }
        for (const list of supInvItemsByInv.values()) {
            list.sort((a, b) => (a.description || '').localeCompare(b.description || '', undefined, { numeric: true, sensitivity: 'base' }));
        }

        const supInvById = new Map<string, any>();
        const supInvByPo = new Map<string, FinanceSupplierInvoiceDetailDTO[]>();
        for (const inv of supInvRes.data || []) {
            supInvById.set(inv.id, inv);
            const ccy = inv.currency || 'LKR';
            const rate = num(inv.exchange_rate);
            const amt = Number(inv.amount) || 0;
            const amtLkr = ccy === 'LKR' ? amt : (rate !== null && rate > 1 ? amt * rate : null);
            const dto: FinanceSupplierInvoiceDetailDTO = {
                id: inv.id,
                purchase_order_id: inv.purchase_order_id,
                invoice_number: inv.invoice_number || '',
                invoice_type: inv.invoice_type || null,
                invoice_date: inv.invoice_date || null,
                due_date: inv.due_date || null,
                currency: ccy,
                exchange_rate: rate,
                amount: amt,
                amount_lkr: amtLkr,
                status: inv.status || null,
                attachment_url: inv.attachment_url || null,
                is_tallied: !!inv.is_tallied,
                discrepancy_amount: num(inv.discrepancy_amount),
                approved_by: inv.approved_by || null,
                approved_at: inv.approved_at || null,
                items: supInvItemsByInv.get(inv.id) || [],
            };
            const list = supInvByPo.get(inv.purchase_order_id) || [];
            list.push(dto);
            supInvByPo.set(inv.purchase_order_id, list);
        }

        const supPayByPo = new Map<string, FinanceSupplierPaymentDetailDTO[]>();
        for (const p of supPayRes.data || []) {
            const linkedInv = p.supplier_invoice_id ? supInvById.get(p.supplier_invoice_id) : null;
            const poId = p.purchase_order_id || linkedInv?.purchase_order_id || null;
            if (!poId) continue;
            const ccy = p.currency || 'LKR';
            const rate = num(p.exchange_rate);
            const amt = Number(p.amount) || 0;
            const amtLkr = ccy === 'LKR' ? amt : (rate !== null && rate > 1 ? amt * rate : null);
            const dto: FinanceSupplierPaymentDetailDTO = {
                id: p.id,
                purchase_order_id: poId,
                supplier_invoice_id: p.supplier_invoice_id || null,
                invoice_number: linkedInv?.invoice_number || null,
                payment_date: p.payment_date || p.created_at || null,
                amount: amt,
                currency: ccy,
                exchange_rate: rate,
                amount_lkr: amtLkr,
                payment_method: p.payment_method || null,
                payment_reference: p.payment_reference || null,
                notes: p.notes || null,
                attachment_url: p.attachment_url || null,
                is_refund: !!p.is_refund,
                refund_reason: p.refund_reason || null,
                refund_description: p.refund_description || null,
            };
            const list = supPayByPo.get(poId) || [];
            list.push(dto);
            supPayByPo.set(poId, list);
        }

        return (viewRes.data || []).map((r: any) => {
            const meta = poMetaById.get(r.purchase_order_id);
            return {
                ...r,
                po_value_own_ccy: num(r.po_value_own_ccy),
                po_value_lkr: num(r.po_value_lkr),
                po_rate_used: num(r.po_rate_used),
                invoice_count: Number(r.invoice_count) || 0,
                invoiced_amount_own_ccy: num(r.invoiced_amount_own_ccy),
                invoiced_lkr: num(r.invoiced_lkr),
                invoice_vs_po_gap_lkr: num(r.invoice_vs_po_gap_lkr),
                paid_lkr_net: num(r.paid_lkr_net),
                refunded_lkr: num(r.refunded_lkr),
                invoice_balance_lkr: num(r.invoice_balance_lkr),
                vendor_address: meta?.vendor_address || null,
                vendor_phone: meta?.vendor_phone || null,
                vendor_email: meta?.vendor_email || null,
                payment_terms: meta?.payment_terms || null,
                subtotal: num(meta?.subtotal),
                discount: num(meta?.discount),
                tax: num(meta?.tax),
                signed_document_url: meta?.signed_document_url || null,
                internal_notes: meta?.internal_notes || null,
                vendor_notes: meta?.vendor_notes || null,
                settled_by_name: meta?.settled_by_name || null,
                settled_date: meta?.settled_date || null,
                settlement_notes: meta?.settlement_notes || null,
                items: poItemsByPo.get(r.purchase_order_id) || [],
                supplier_invoices: supInvByPo.get(r.purchase_order_id) || [],
                supplier_payments: supPayByPo.get(r.purchase_order_id) || [],
            };
        }) as FinancePoReportRowDTO[];
    }

    /**
     * Combined cash ledger, full customer invoice register (with line items & linked payments),
     * tour expense register (with receipts), and tour-by-tour accounting dossiers.
     * Conversions use only the rate saved on each payment/invoice:
     *  - customer payments: rate = LKR per USD; USD payments have no LKR value unless a rate > 1 was saved
     *  - supplier payments & expenses: rate = LKR per unit of the payment currency; LKR payments are 1:1
     * Anything that cannot be converted from saved data stays null.
     */
    static async getCashLedger(poReportRows?: FinancePoReportRowDTO[]): Promise<FinanceLedgerDTO> {
        const supabase = createAdminClient();
        const [
            custPay,
            supPay,
            custInv,
            custInvItems,
            tours,
            touristProfiles,
            pos,
            poItems,
            supInv,
            supInvItems,
            expenses,
        ] = await Promise.all([
            supabase.from('customer_payments').select('id, invoice_id, tour_id, amount, currency, exchange_rate, payment_date, created_at, payment_method, payment_status, transaction_id, attachment_url, is_advance'),
            supabase.from('supplier_payments').select('id, supplier_invoice_id, purchase_order_id, amount, currency, exchange_rate, payment_date, created_at, payment_method, payment_reference, notes, attachment_url, is_refund, refund_reason, refund_description'),
            supabase.from('customer_invoices').select('id, tour_id, tourist_id, amount, currency, status, invoice_number, billing_details, agency_note, discount_amount, tax_amount, service_fee_percentage, due_date, created_at').order('created_at', { ascending: false }),
            supabase.from('customer_invoice_items').select('id, invoice_id, description, amount, created_at').order('created_at', { ascending: true }),
            supabase.from('tours').select('id, tour_code, title, status, travel_style, start_date, end_date, tourist_id, usd_lkr_buying_rate, planner_data'),
            supabase.from('tourist_profiles').select('id, first_name, last_name, country, adults, children, infants'),
            supabase.from('purchase_orders').select('id, po_number, vendor_name, tour_id'),
            supabase.from('purchase_order_items').select('id, purchase_order_id, description, quantity, unit_price, total_price'),
            supabase.from('supplier_invoices').select('id, purchase_order_id, invoice_number, currency'),
            supabase.from('supplier_invoice_items').select('id, supplier_invoice_id, description, quantity, unit_price, total_price'),
            supabase.from('tour_expenses').select('*').order('expense_date', { ascending: false, nullsFirst: false }),
        ]);

        for (const r of [custPay, supPay, custInv, custInvItems, tours, touristProfiles, pos, poItems, supInv, supInvItems, expenses]) {
            if (r.error) throw r.error;
        }

        const tourById = new Map<string, any>((tours.data || []).map((t: any) => [t.id, t]));
        const tourCode = new Map<string, string | null>((tours.data || []).map((t: any) => [t.id, t.tour_code as string | null]));
        const profileById = new Map<string, any>((touristProfiles.data || []).map((tp: any) => [tp.id, tp]));
        const invById = new Map<string, any>((custInv.data || []).map((i: any) => [i.id, i]));
        const poById = new Map<string, any>((pos.data || []).map((p: any) => [p.id, p]));
        const supInvById = new Map<string, any>((supInv.data || []).map((i: any) => [i.id, i]));
        const supInvPo = new Map<string, string>((supInv.data || []).map((i: any) => [i.id, i.purchase_order_id as string]));

        // Map customer invoice items
        const custInvItemsByInv = new Map<string, FinanceCustomerInvoiceLineItemDTO[]>();
        for (const it of custInvItems.data || []) {
            const list = custInvItemsByInv.get(it.invoice_id) || [];
            list.push({
                id: it.id,
                invoice_id: it.invoice_id,
                description: it.description || '',
                amount: Number(it.amount) || 0,
            });
            custInvItemsByInv.set(it.invoice_id, list);
        }

        // Map PO items & Supplier Invoice items for ledger drill-down
        const poItemsByPo = new Map<string, any[]>();
        for (const it of poItems.data || []) {
            const list = poItemsByPo.get(it.purchase_order_id) || [];
            list.push(it);
            poItemsByPo.set(it.purchase_order_id, list);
        }
        const supInvItemsByInv = new Map<string, any[]>();
        for (const it of supInvItems.data || []) {
            const list = supInvItemsByInv.get(it.supplier_invoice_id) || [];
            list.push(it);
            supInvItemsByInv.set(it.supplier_invoice_id, list);
        }
        for (const list of supInvItemsByInv.values()) {
            list.sort((a, b) => (a.description || '').localeCompare(b.description || '', undefined, { numeric: true, sensitivity: 'base' }));
        }

        const rows: FinanceLedgerRowDTO[] = [];
        const custPayByInv = new Map<string, FinanceCustomerPaymentDetailDTO[]>();
        const unassignedCustPayByTour = new Map<string, FinanceCustomerPaymentDetailDTO[]>();

        for (const p of custPay.data || []) {
            const amount = Number(p.amount) || 0;
            const currency = p.currency || 'USD';
            const rate = p.exchange_rate != null ? Number(p.exchange_rate) : null;
            const linkedInv = p.invoice_id ? invById.get(p.invoice_id) : null;
            const tourId = p.tour_id || linkedInv?.tour_id || null;
            const tCode = tourId ? (tourCode.get(tourId) ?? null) : null;
            const rateOk = rate !== null && rate > 1;
            const amountUsd = currency === 'USD' ? amount : (currency === 'LKR' && rateOk ? amount / (rate as number) : null);
            const amountLkr = currency === 'LKR' ? amount : (rateOk && currency === 'USD' ? amount * (rate as number) : null);

            const payDetail: FinanceCustomerPaymentDetailDTO = {
                id: p.id,
                invoice_id: p.invoice_id || null,
                invoice_number: linkedInv?.invoice_number || null,
                tour_id: tourId,
                tour_code: tCode,
                payment_date: p.payment_date || p.created_at || null,
                amount,
                currency,
                exchange_rate: rate,
                amount_usd: amountUsd,
                amount_lkr: amountLkr,
                payment_method: p.payment_method || null,
                payment_status: p.payment_status || null,
                transaction_id: p.transaction_id || null,
                attachment_url: p.attachment_url || null,
                is_advance: !!p.is_advance,
            };

            if (p.invoice_id) {
                const list = custPayByInv.get(p.invoice_id) || [];
                list.push(payDetail);
                custPayByInv.set(p.invoice_id, list);
            } else if (tourId) {
                const list = unassignedCustPayByTour.get(tourId) || [];
                list.push(payDetail);
                unassignedCustPayByTour.set(tourId, list);
            }

            const invLineItems = p.invoice_id ? (custInvItemsByInv.get(p.invoice_id) || []).map(li => ({
                description: li.description,
                amount: li.amount,
                currency: linkedInv?.currency || 'USD',
            })) : [];

            rows.push({
                id: p.id,
                kind: 'customer',
                payment_date: p.payment_date || p.created_at || null,
                tour_id: tourId,
                tour_code: tCode,
                party: linkedInv?.invoice_number || 'Advance payment',
                reference: p.transaction_id || null,
                method: p.payment_method || null,
                currency,
                amount,
                exchange_rate: rate,
                amount_usd: amountUsd,
                amount_lkr: amountLkr,
                is_refund: false,
                attachment_url: p.attachment_url || null,
                doc_number: linkedInv?.invoice_number || null,
                invoice_number: linkedInv?.invoice_number || null,
                line_items: invLineItems,
            });
        }

        for (const p of supPay.data || []) {
            const amount = Number(p.amount) || 0;
            const currency = p.currency || 'USD';
            const rate = p.exchange_rate != null ? Number(p.exchange_rate) : null;
            const linkedSupInv = p.supplier_invoice_id ? supInvById.get(p.supplier_invoice_id) : null;
            const poId = p.purchase_order_id || (p.supplier_invoice_id ? supInvPo.get(p.supplier_invoice_id) : null) || null;
            const po: any = poId ? poById.get(poId) : null;
            const tourId = po?.tour_id || null;
            const rateOk = rate !== null && rate > 1;

            const sItems = p.supplier_invoice_id ? (supInvItemsByInv.get(p.supplier_invoice_id) || []) : [];
            const pItems = poId ? (poItemsByPo.get(poId) || []) : [];
            const lineItems = (sItems.length > 0 ? sItems : pItems).map((li: any) => ({
                description: li.description || '',
                quantity: Number(li.quantity) || 1,
                unit_price: num(li.unit_price),
                amount: Number(li.total_price) || 0,
                currency: linkedSupInv?.currency || currency,
            }));

            rows.push({
                id: p.id,
                kind: 'supplier',
                payment_date: p.payment_date || p.created_at || null,
                tour_id: tourId,
                tour_code: tourId ? (tourCode.get(tourId) ?? null) : null,
                party: po ? `${po.vendor_name || ''} (${po.po_number})` : null,
                reference: p.payment_reference || null,
                method: p.payment_method || null,
                currency,
                amount,
                exchange_rate: rate,
                amount_usd: currency === 'USD' ? amount : null,
                amount_lkr: currency === 'LKR' ? amount : (rateOk ? amount * (rate as number) : null),
                is_refund: !!p.is_refund,
                attachment_url: p.attachment_url || null,
                po_number: po?.po_number || null,
                invoice_number: linkedSupInv?.invoice_number || null,
                doc_number: linkedSupInv?.invoice_number || po?.po_number || null,
                notes: p.notes || null,
                refund_reason: p.refund_reason || null,
                line_items: lineItems,
            });
        }

        // Miscellaneous tour expenses: money paid out, handled the same way as supplier payments
        // (rate = LKR per unit of the expense currency; LKR is 1:1; USD value only for USD expenses).
        const expenseDtos: FinanceTourExpenseDetailDTO[] = [];
        const expensesByTour = new Map<string, FinanceTourExpenseDetailDTO[]>();

        for (const e of expenses.data || []) {
            const amount = Number(e.amount) || 0;
            const currency = e.currency || 'LKR';
            const rate = e.exchange_rate != null ? Number(e.exchange_rate) : null;
            const rateOk = rate !== null && rate > 1;
            const tCode = e.tour_id ? (tourCode.get(e.tour_id) ?? null) : null;
            const amountUsd = currency === 'USD' ? amount : null;
            const amountLkr = currency === 'LKR' ? amount : (rateOk ? amount * (rate as number) : null);

            const expDto: FinanceTourExpenseDetailDTO = {
                id: e.id,
                tour_id: e.tour_id || null,
                tour_code: tCode,
                category: e.category || null,
                description: e.description || null,
                paid_to: e.paid_to || null,
                amount,
                currency,
                exchange_rate: rate,
                amount_usd: amountUsd,
                amount_lkr: amountLkr,
                expense_date: e.expense_date || e.created_at || null,
                payment_method: e.payment_method || null,
                payment_reference: e.payment_reference || null,
                receipt_url: e.receipt_url || null,
                signed_document_url: e.signed_document_url || null,
                notes: e.notes || null,
            };
            expenseDtos.push(expDto);
            if (e.tour_id) {
                const list = expensesByTour.get(e.tour_id) || [];
                list.push(expDto);
                expensesByTour.set(e.tour_id, list);
            }

            rows.push({
                id: e.id,
                kind: 'expense',
                payment_date: e.expense_date || e.created_at || null,
                tour_id: e.tour_id || null,
                tour_code: tCode,
                party: [e.category, e.paid_to || e.description].filter(Boolean).join(' - ') || null,
                reference: e.payment_reference || null,
                method: e.payment_method || null,
                currency,
                amount,
                exchange_rate: rate,
                amount_usd: amountUsd,
                amount_lkr: amountLkr,
                is_refund: false,
                attachment_url: e.receipt_url || e.signed_document_url || null,
                category: e.category || null,
                notes: e.notes || null,
                line_items: [{
                    description: [e.category, e.description, e.paid_to ? `(Paid to: ${e.paid_to})` : ''].filter(Boolean).join(' — '),
                    quantity: 1,
                    unit_price: amount,
                    amount,
                    currency,
                }],
            });
        }

        rows.sort((a, b) => (a.payment_date || '').localeCompare(b.payment_date || ''));

        const invoicesByTour = new Map<string, FinanceLedgerInvoiceDTO[]>();
        const invoices: FinanceLedgerInvoiceDTO[] = (custInv.data || []).map((i: any) => {
            const tour = i.tour_id ? tourById.get(i.tour_id) : null;
            const profile = (i.tourist_id && profileById.get(i.tourist_id)) || (tour?.tourist_id && profileById.get(tour.tourist_id)) || null;
            const items = custInvItemsByInv.get(i.id) || [];
            const payments = custPayByInv.get(i.id) || [];
            const itemsSubtotal = items.reduce((s, it) => s + it.amount, 0);
            const discount = Number(i.discount_amount) || 0;
            const tax = Number(i.tax_amount) || 0;
            const amount = Number(i.amount) || 0;
            const subtotal = items.length > 0 ? itemsSubtotal : (amount + discount - tax);
            const tourBuyingRate = num(tour?.usd_lkr_buying_rate);
            const currency = i.currency || 'USD';
            const amountLkr = currency === 'LKR' ? amount : (currency === 'USD' && tourBuyingRate && tourBuyingRate > 1 ? amount * tourBuyingRate : null);
            const paidUsd = payments.reduce((s, p) => s + (p.amount_usd ?? 0), 0);
            const paidLkr = payments.reduce((s, p) => s + (p.amount_lkr ?? 0), 0);
            const clientName = i.billing_details?.name
                || (profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') : '')
                || tour?.planner_data?.profile?.name
                || null;

            const dto: FinanceLedgerInvoiceDTO = {
                id: i.id,
                tour_id: i.tour_id || null,
                tour_code: i.tour_id ? (tourCode.get(i.tour_id) ?? null) : null,
                tourist_id: i.tourist_id || tour?.tourist_id || null,
                client_name: clientName,
                invoice_number: i.invoice_number || null,
                currency,
                amount,
                status: i.status || null,
                billing_details: i.billing_details || null,
                created_at: i.created_at || null,
                due_date: i.due_date || null,
                subtotal,
                discount_amount: discount,
                tax_amount: tax,
                service_fee_percentage: num(i.service_fee_percentage),
                agency_note: i.agency_note || null,
                tour_usd_buying_rate: tourBuyingRate,
                amount_lkr: amountLkr,
                paid_usd: paidUsd,
                paid_lkr: paidLkr,
                balance_usd: currency === 'USD' ? Math.max(0, amount - paidUsd) : undefined,
                items,
                payments,
            };

            if (i.tour_id) {
                const list = invoicesByTour.get(i.tour_id) || [];
                list.push(dto);
                invoicesByTour.set(i.tour_id, list);
            }
            return dto;
        });

        // Build Tour Accounting Dossiers
        const poList = poReportRows || await this.getPoReport();
        const posByTour = new Map<string, FinancePoReportRowDTO[]>();
        for (const po of poList) {
            if (!po.tour_id) continue;
            const list = posByTour.get(po.tour_id) || [];
            list.push(po);
            posByTour.set(po.tour_id, list);
        }

        const tourDossiers: FinanceTourDossierDTO[] = [];
        for (const t of tours.data || []) {
            const tInvoices = invoicesByTour.get(t.id) || [];
            const tUnassignedPays = unassignedCustPayByTour.get(t.id) || [];
            const tPos = posByTour.get(t.id) || [];
            const tExpenses = expensesByTour.get(t.id) || [];

            if (tInvoices.length === 0 && tUnassignedPays.length === 0 && tPos.length === 0 && tExpenses.length === 0) {
                continue;
            }

            const profile = t.tourist_id ? profileById.get(t.tourist_id) : null;
            const clientName = tInvoices[0]?.client_name
                || (profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') : '')
                || t.planner_data?.profile?.name
                || null;
            const adults = Number(profile?.adults ?? t.planner_data?.profile?.adults ?? 0);
            const children = Number(profile?.children ?? t.planner_data?.profile?.children ?? 0);

            tourDossiers.push({
                tour_id: t.id,
                tour_code: t.tour_code || t.id.slice(0, 8).toUpperCase(),
                title: t.title || null,
                status: t.status || null,
                travel_style: t.travel_style || t.planner_data?.profile?.travelStyle || null,
                start_date: t.start_date || null,
                end_date: t.end_date || null,
                client_name: clientName,
                client_country: profile?.country || t.planner_data?.profile?.country || null,
                pax_count: (adults + children) || 1,
                usd_lkr_buying_rate: num(t.usd_lkr_buying_rate),
                customer_invoices: tInvoices,
                unassigned_customer_payments: tUnassignedPays,
                purchase_orders: tPos,
                tour_expenses: tExpenses,
            });
        }

        tourDossiers.sort((a, b) => (b.start_date || '').localeCompare(a.start_date || ''));

        return {
            rows,
            invoices,
            expenses: expenseDtos,
            tours: tourDossiers,
        };
    }
}
