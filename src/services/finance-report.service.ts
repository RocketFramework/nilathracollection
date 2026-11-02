import { createAdminClient } from '@/utils/supabase/admin';
import { FinancePoReportRowDTO, FinanceLedgerDTO, FinanceLedgerRowDTO } from '../dtos/finance-report.dto';

export class FinanceReportService {
    /**
     * Reads the read-only v_finance_po_report view (one row per PO). Numeric columns come back
     * from PostgREST as numbers or strings, so they are normalised here; NULL stays NULL.
     */
    static async getPoReport(): Promise<FinancePoReportRowDTO[]> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('v_finance_po_report')
            .select('*')
            .order('po_date', { ascending: false, nullsFirst: false })
            .order('po_number', { ascending: false });

        if (error) throw error;

        const num = (v: any): number | null => (v === null || v === undefined ? null : Number(v));

        return (data || []).map((r: any) => ({
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
        })) as FinancePoReportRowDTO[];
    }

    /**
     * Combined cash ledger: every customer payment received and every supplier payment made.
     * Conversions use only the rate saved on each payment:
     *  - customer payments: rate = LKR per USD; USD payments have no LKR value unless a rate > 1 was saved
     *  - supplier payments: rate = LKR per unit of the payment currency; LKR payments are 1:1
     * Anything that cannot be converted from saved data stays null.
     */
    static async getCashLedger(): Promise<FinanceLedgerDTO> {
        const supabase = createAdminClient();
        const [custPay, supPay, custInv, tours, pos, supInv, expenses] = await Promise.all([
            supabase.from('customer_payments').select('id, invoice_id, tour_id, amount, currency, exchange_rate, payment_date, created_at, payment_method, transaction_id'),
            supabase.from('supplier_payments').select('id, supplier_invoice_id, purchase_order_id, amount, currency, exchange_rate, payment_date, created_at, payment_method, payment_reference, is_refund'),
            supabase.from('customer_invoices').select('id, tour_id, amount, currency, status, invoice_number'),
            supabase.from('tours').select('id, tour_code'),
            supabase.from('purchase_orders').select('id, po_number, vendor_name, tour_id'),
            supabase.from('supplier_invoices').select('id, purchase_order_id'),
            supabase.from('tour_expenses').select('id, tour_id, category, description, paid_to, amount, currency, exchange_rate, expense_date, created_at, payment_method, payment_reference'),
        ]);
        for (const r of [custPay, supPay, custInv, tours, pos, supInv, expenses]) if (r.error) throw r.error;

        const tourCode = new Map((tours.data || []).map((t: any) => [t.id, t.tour_code as string | null]));
        const invById = new Map((custInv.data || []).map((i: any) => [i.id, i]));
        const poById = new Map((pos.data || []).map((p: any) => [p.id, p]));
        const supInvPo = new Map((supInv.data || []).map((i: any) => [i.id, i.purchase_order_id as string]));

        const rows: FinanceLedgerRowDTO[] = [];

        for (const p of custPay.data || []) {
            const amount = Number(p.amount) || 0;
            const currency = p.currency || 'USD';
            const rate = p.exchange_rate != null ? Number(p.exchange_rate) : null;
            const tourId = p.tour_id || invById.get(p.invoice_id)?.tour_id || null;
            const rateOk = rate !== null && rate > 1;
            rows.push({
                id: p.id, kind: 'customer', payment_date: p.payment_date || p.created_at || null,
                tour_id: tourId, tour_code: tourId ? (tourCode.get(tourId) ?? null) : null,
                party: invById.get(p.invoice_id)?.invoice_number || 'Advance payment',
                reference: p.transaction_id || null, method: p.payment_method || null,
                currency, amount, exchange_rate: rate,
                amount_usd: currency === 'USD' ? amount : (currency === 'LKR' && rateOk ? amount / (rate as number) : null),
                amount_lkr: currency === 'LKR' ? amount : (rateOk && currency === 'USD' ? amount * (rate as number) : null),
                is_refund: false,
            });
        }

        for (const p of supPay.data || []) {
            const amount = Number(p.amount) || 0;
            const currency = p.currency || 'USD';
            const rate = p.exchange_rate != null ? Number(p.exchange_rate) : null;
            const poId = p.purchase_order_id || supInvPo.get(p.supplier_invoice_id) || null;
            const po: any = poId ? poById.get(poId) : null;
            const tourId = po?.tour_id || null;
            const rateOk = rate !== null && rate > 1;
            rows.push({
                id: p.id, kind: 'supplier', payment_date: p.payment_date || p.created_at || null,
                tour_id: tourId, tour_code: tourId ? (tourCode.get(tourId) ?? null) : null,
                party: po ? `${po.vendor_name || ''} (${po.po_number})` : null,
                reference: p.payment_reference || null, method: p.payment_method || null,
                currency, amount, exchange_rate: rate,
                amount_usd: currency === 'USD' ? amount : null,
                amount_lkr: currency === 'LKR' ? amount : (rateOk ? amount * (rate as number) : null),
                is_refund: !!p.is_refund,
            });
        }

        // Miscellaneous tour expenses: money paid out, handled the same way as supplier payments
        // (rate = LKR per unit of the expense currency; LKR is 1:1; USD value only for USD expenses).
        for (const e of expenses.data || []) {
            const amount = Number(e.amount) || 0;
            const currency = e.currency || 'LKR';
            const rate = e.exchange_rate != null ? Number(e.exchange_rate) : null;
            const rateOk = rate !== null && rate > 1;
            rows.push({
                id: e.id, kind: 'expense', payment_date: e.expense_date || e.created_at || null,
                tour_id: e.tour_id || null, tour_code: e.tour_id ? (tourCode.get(e.tour_id) ?? null) : null,
                party: [e.category, e.paid_to || e.description].filter(Boolean).join(' - ') || null,
                reference: e.payment_reference || null, method: e.payment_method || null,
                currency, amount, exchange_rate: rate,
                amount_usd: currency === 'USD' ? amount : null,
                amount_lkr: currency === 'LKR' ? amount : (rateOk ? amount * (rate as number) : null),
                is_refund: false,
            });
        }

        rows.sort((a, b) => (a.payment_date || '').localeCompare(b.payment_date || ''));

        const invoices = (custInv.data || []).map((i: any) => ({
            id: i.id, tour_id: i.tour_id || null,
            tour_code: i.tour_id ? (tourCode.get(i.tour_id) ?? null) : null,
            invoice_number: i.invoice_number || null, currency: i.currency || 'USD',
            amount: Number(i.amount) || 0, status: i.status || null,
        }));

        return { rows, invoices };
    }
}
