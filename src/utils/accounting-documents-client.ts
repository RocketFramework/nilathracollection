"use client";

import { getPayslipSignedUrlAction } from "@/actions/admin.actions";
import {
    FinanceCustomerPaymentDetailDTO,
    FinanceLedgerInvoiceDTO,
    FinancePoReportRowDTO,
    FinanceTourExpenseDetailDTO,
} from "@/dtos/finance-report.dto";
import { generatePoPdfFromReportRow } from "./po-pdf";
import { generateSettlementVoucherPdf, generateExpenseVoucherPdf } from "./settlement-voucher-pdf";
import { generateCustomerInvoicePdf } from "./customer-invoice-pdf";
import { generateCustomerPaymentReceiptPdf } from "./customer-payment-receipt-pdf";

/**
 * Opens an uploaded Bank Slip, Supplier Invoice Copy, Signed PO, or Expense Receipt
 * from the Supabase 'payslips' bucket in a new browser tab using a signed URL.
 */
export async function viewStoredAttachment(filePath: string | null | undefined) {
    if (!filePath) return;
    try {
        const res = await getPayslipSignedUrlAction(filePath);
        if (res.success && res.url) {
            window.open(res.url, "_blank", "noopener,noreferrer");
        } else {
            alert("Failed to open document: " + ((res as any).error || "Unknown error"));
        }
    } catch (err: any) {
        alert("Error opening document: " + (err?.message || err));
    }
}

/**
 * Downloads an uploaded Bank Slip, Supplier Invoice Copy, Signed PO, or Expense Receipt
 * directly to the accountant's computer with a clean accounting filename.
 */
export async function downloadStoredAttachment(
    filePath: string | null | undefined,
    filenamePrefix: string = "Document"
) {
    if (!filePath) return;
    try {
        const extMatch = filePath.split("?")[0].match(/\.([a-zA-Z0-9]+)$/);
        const ext = extMatch ? extMatch[1] : "pdf";
        const cleanPrefix = filenamePrefix.replace(/[^a-zA-Z0-9_-]/g, "_");
        const downloadName = `${cleanPrefix}.${ext}`;

        const res = await getPayslipSignedUrlAction(filePath, downloadName);
        if (res.success && res.url) {
            const a = document.createElement("a");
            a.href = res.url;
            a.download = downloadName;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            alert("Failed to download document: " + ((res as any).error || "Unknown error"));
        }
    } catch (err: any) {
        alert("Error downloading document: " + (err?.message || err));
    }
}

/**
 * Generates and downloads the official Nilathra Collection Purchase Order PDF
 * for any PO row.
 */
export async function downloadPoPdfFile(
    po: FinancePoReportRowDTO,
    clientName?: string | null
) {
    try {
        const doc = await generatePoPdfFromReportRow(po, undefined, clientName);
        if (doc) {
            const vendorSlug = (po.vendor_name || "Supplier").replace(/[^a-zA-Z0-9_-]/g, "_");
            doc.save(`${po.po_number}_${vendorSlug}.pdf`);
        }
    } catch (err: any) {
        alert("Error generating PO PDF: " + (err?.message || err));
    }
}

/**
 * Generates and downloads the official Payment Settlement Voucher PDF for a PO.
 */
export async function downloadSettlementVoucherPdfFile(
    po: FinancePoReportRowDTO,
    clientName?: string | null
) {
    try {
        const poPayload = {
            id: po.purchase_order_id,
            po_number: po.po_number,
            po_date: po.po_date,
            vendor_name: po.vendor_name,
            vendor_type: po.vendor_type,
            vendor_address: po.vendor_address,
            vendor_phone: po.vendor_phone,
            vendor_email: po.vendor_email,
            currency: po.po_currency || "USD",
            subtotal: po.subtotal ?? po.po_value_own_ccy ?? 0,
            discount: po.discount ?? 0,
            tax: po.tax ?? 0,
            total_amount: po.po_value_own_ccy ?? 0,
            settled_by_name: po.settled_by_name,
            settled_date: po.settled_date,
            settlement_notes: po.settlement_notes,
            items: po.items || [],
            advance_payments: po.supplier_payments || [],
        };
        const touristData = clientName
            ? { profile: { first_name: clientName, last_name: "" } }
            : undefined;
        const doc = await generateSettlementVoucherPdf(
            poPayload,
            undefined,
            "Nilathra Finance",
            touristData,
            po.po_rate_used ?? undefined,
            po.tour_code
        );
        if (doc) {
            const vendorSlug = (po.vendor_name || "Supplier").replace(/[^a-zA-Z0-9_-]/g, "_");
            doc.save(`VCH-${po.po_number}_${vendorSlug}.pdf`);
        }
    } catch (err: any) {
        alert("Error generating Settlement Voucher PDF: " + (err?.message || err));
    }
}

/**
 * Generates and downloads the official Customer Invoice PDF.
 */
export async function downloadCustomerInvoicePdfFile(inv: FinanceLedgerInvoiceDTO) {
    try {
        const invPayload: any = {
            id: inv.id,
            tour_id: inv.tour_id || "",
            tourist_id: inv.tourist_id || "",
            amount: inv.amount,
            currency: inv.currency,
            status: inv.status || "Pending",
            due_date: inv.due_date,
            invoice_number: inv.invoice_number,
            billing_details: inv.billing_details || (inv.client_name ? { name: inv.client_name, email: "", phone: "", address: "" } : null),
            agency_note: inv.agency_note,
            discount_amount: inv.discount_amount || 0,
            tax_amount: inv.tax_amount || 0,
            service_fee_percentage: inv.service_fee_percentage,
            created_at: inv.created_at || new Date().toISOString(),
            updated_at: inv.created_at || new Date().toISOString(),
            items: (inv.items || []).map(it => ({
                id: it.id,
                invoice_id: inv.id,
                description: it.description,
                amount: it.amount,
                created_at: inv.created_at || new Date().toISOString(),
            })),
            payments: inv.payments || [],
        };
        const doc = await generateCustomerInvoicePdf(
            invPayload,
            undefined,
            inv.client_name ? { profile: { first_name: inv.client_name, last_name: "" } } : undefined,
            { usd_lkr_buying_rate: inv.tour_usd_buying_rate },
            inv.tour_code
        );
        if (doc) {
            doc.save(`Customer_Invoice_${inv.invoice_number || inv.id.slice(0, 8)}.pdf`);
        }
    } catch (err: any) {
        alert("Error generating Customer Invoice PDF: " + (err?.message || err));
    }
}

/**
 * Generates and downloads the official Customer Payment Receipt PDF.
 */
export async function downloadCustomerReceiptPdfFile(
    payment: FinanceCustomerPaymentDetailDTO,
    inv?: FinanceLedgerInvoiceDTO
) {
    try {
        const doc = await generateCustomerPaymentReceiptPdf(
            payment,
            inv || {
                invoice_number: payment.invoice_number || "Advance",
                amount: payment.amount_usd || payment.amount,
                currency: "USD",
                billing_details: null,
            },
            undefined,
            inv?.client_name ? { profile: { first_name: inv.client_name, last_name: "" } } : undefined,
            { tour_code: payment.tour_code || inv?.tour_code, usd_lkr_buying_rate: inv?.tour_usd_buying_rate }
        );
        if (doc) {
            const receiptNo = `REC-${new Date(payment.payment_date || Date.now()).getFullYear()}-${String(payment.id || "").substring(0, 6).toUpperCase()}`;
            doc.save(`Payment_Receipt_${receiptNo}.pdf`);
        }
    } catch (err: any) {
        alert("Error generating Receipt PDF: " + (err?.message || err));
    }
}

/**
 * Generates and downloads the official Expense Voucher PDF (single item or consolidated payee voucher).
 */
export async function downloadExpenseVoucherPdfFile(
    expOrItems: FinanceTourExpenseDetailDTO | FinanceTourExpenseDetailDTO[],
    tourMeta?: {
        client_name?: string | null;
        pax_count?: number;
        start_date?: string | null;
        end_date?: string | null;
        tour_code?: string | null;
    }
) {
    try {
        const items = Array.isArray(expOrItems) ? expOrItems : [expOrItems];
        const primary = items[0];
        if (!primary) return;

        const touristData = tourMeta
            ? {
                  profile: {
                      first_name: tourMeta.client_name || "",
                      last_name: "",
                  },
                  preferences: {
                      adults: tourMeta.pax_count ?? 1,
                      children: 0,
                      infants: 0,
                      arrival_date: tourMeta.start_date || undefined,
                      departure_date: tourMeta.end_date || undefined,
                  },
              }
            : undefined;

        const doc = await generateExpenseVoucherPdf(
            items,
            undefined,
            "Nilathra Finance",
            touristData,
            tourMeta?.tour_code ?? primary.tour_code
        );
        if (doc) {
            const payeeSlug = (primary.paid_to || primary.category || "Expense").replace(/[^a-zA-Z0-9_-]/g, "_");
            doc.save(`EXP-${String(primary.id || "").slice(0, 8).toUpperCase()}_${payeeSlug}.pdf`);
        }
    } catch (err: any) {
        alert("Error generating Expense Voucher PDF: " + (err?.message || err));
    }
}
