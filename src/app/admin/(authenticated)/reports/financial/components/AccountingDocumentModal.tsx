"use client";

import React from "react";
import {
    FinanceLedgerInvoiceDTO,
    FinancePoReportRowDTO,
    FinanceSupplierInvoiceDetailDTO,
    FinanceSupplierPaymentDetailDTO,
    FinanceCustomerPaymentDetailDTO,
    FinanceLedgerRowDTO,
} from "@/dtos/finance-report.dto";
import {
    viewStoredAttachment,
    downloadStoredAttachment,
    downloadPoPdfFile,
    downloadSettlementVoucherPdfFile,
    downloadCustomerInvoicePdfFile,
    downloadCustomerReceiptPdfFile,
} from "@/utils/accounting-documents-client";

export type AccountingDocModalData =
    | { type: "customer_invoice"; invoice: FinanceLedgerInvoiceDTO }
    | { type: "purchase_order"; po: FinancePoReportRowDTO }
    | { type: "supplier_invoice"; invoice: FinanceSupplierInvoiceDetailDTO; po: FinancePoReportRowDTO }
    | { type: "customer_payment"; payment: FinanceCustomerPaymentDetailDTO; invoice?: FinanceLedgerInvoiceDTO }
    | { type: "supplier_payment"; payment: FinanceSupplierPaymentDetailDTO; po: FinancePoReportRowDTO }
    | { type: "ledger_voucher"; row: FinanceLedgerRowDTO };

const fmt = (n: number | null | undefined) =>
    n === null || n === undefined
        ? "—"
        : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: string | null | undefined) => {
    if (!d) return "—";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export default function AccountingDocumentModal({
    doc,
    onClose,
}: {
    doc: AccountingDocModalData | null;
    onClose: () => void;
}) {
    if (!doc) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto print:bg-white print:p-0">
            <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden print:max-w-none print:max-h-none print:shadow-none print:border-none">
                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 bg-[#FAF9F6] border-b border-[#E5E7EB] print:hidden">
                    <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#2B2B2B] text-[#D4AF37]">
                            Accounting Copy
                        </span>
                        <h3 className="text-sm font-bold text-[#2B2B2B]">
                            {doc.type === "customer_invoice" && `Customer Tax Invoice — ${doc.invoice.invoice_number || doc.invoice.id.slice(0, 8)}`}
                            {doc.type === "purchase_order" && `Purchase Order — ${doc.po.po_number}`}
                            {doc.type === "supplier_invoice" && `Supplier Bill / Invoice — ${doc.invoice.invoice_number}`}
                            {doc.type === "customer_payment" && `Customer Receipt Voucher — ${doc.payment.transaction_id || doc.payment.id.slice(0, 8)}`}
                            {doc.type === "supplier_payment" && `Supplier Payment Voucher — ${doc.payment.payment_reference || doc.payment.id.slice(0, 8)}`}
                            {doc.type === "ledger_voucher" && `${doc.row.kind === "customer" ? "Customer Receipt" : doc.row.kind === "expense" ? "Expense" : "Supplier Payment"} Voucher`}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {doc.type === "customer_invoice" && (
                            <button
                                type="button"
                                onClick={() => downloadCustomerInvoicePdfFile(doc.invoice)}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-950"
                            >
                                Download Official Invoice PDF
                            </button>
                        )}
                        {doc.type === "purchase_order" && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => downloadPoPdfFile(doc.po)}
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-950"
                                >
                                    Download Official PO PDF
                                </button>
                                <button
                                    type="button"
                                    onClick={() => downloadSettlementVoucherPdfFile(doc.po)}
                                    className="px-3.5 py-1.5 rounded-xl border border-[#2B2B2B] text-xs font-semibold text-[#2B2B2B] hover:bg-gray-100"
                                >
                                    Download Settlement Voucher PDF
                                </button>
                            </>
                        )}
                        {doc.type === "customer_payment" && (
                            <button
                                type="button"
                                onClick={() => downloadCustomerReceiptPdfFile(doc.payment, doc.invoice)}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-950"
                            >
                                Download Official Receipt PDF
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="px-3.5 py-1.5 rounded-xl bg-[#2B2B2B] text-white text-xs font-semibold hover:bg-black"
                        >
                            Print
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#4B5563] hover:bg-gray-100"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Printable Document Body */}
                <div className="p-8 overflow-y-auto space-y-6 text-xs text-[#2B2B2B] print:overflow-visible">
                    <div className="flex justify-between items-start border-b border-[#E5E7EB] pb-5">
                        <div>
                            <h1 className="text-xl font-bold font-playfair tracking-tight text-[#2B2B2B]">
                                NILATHRA COLLECTION
                            </h1>
                            <p className="text-[11px] text-[#6B7280] mt-0.5">
                                Accounting &amp; Tax Audit Document Copy
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-base font-bold font-mono uppercase text-[#2B2B2B] block">
                                {doc.type === "customer_invoice" && "CUSTOMER INVOICE"}
                                {doc.type === "purchase_order" && "PURCHASE ORDER"}
                                {doc.type === "supplier_invoice" && "SUPPLIER INVOICE / BILL"}
                                {doc.type === "customer_payment" && "OFFICIAL RECEIPT VOUCHER"}
                                {doc.type === "supplier_payment" && (doc.payment.is_refund ? "SUPPLIER REFUND VOUCHER" : "PAYMENT VOUCHER")}
                                {doc.type === "ledger_voucher" && (
                                    doc.row.kind === "customer"
                                        ? "OFFICIAL RECEIPT VOUCHER"
                                        : doc.row.kind === "expense"
                                        ? "PETTY CASH / EXPENSE VOUCHER"
                                        : doc.row.is_refund
                                        ? "SUPPLIER REFUND VOUCHER"
                                        : "SUPPLIER PAYMENT VOUCHER"
                                )}
                            </span>
                            <span className="text-[11px] font-mono text-[#6B7280] block mt-0.5">
                                Generated: {new Date().toLocaleDateString("en-GB")}
                            </span>
                        </div>
                    </div>

                    {/* 1. CUSTOMER INVOICE COPY */}
                    {doc.type === "customer_invoice" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#FAF9F6] p-4 rounded-xl border border-[#E5E7EB]">
                                <div>
                                    <span className="text-[10px] uppercase text-[#6B7280] font-bold block">Invoice No</span>
                                    <span className="font-mono font-bold text-sm">{doc.invoice.invoice_number || "—"}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase text-[#6B7280] font-bold block">Tour Code</span>
                                    <span className="font-mono font-bold text-sm">{doc.invoice.tour_code || "—"}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase text-[#6B7280] font-bold block">Issue / Due Date</span>
                                    <span className="font-mono">{fmtDate(doc.invoice.created_at)} / {fmtDate(doc.invoice.due_date)}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase text-[#6B7280] font-bold block">Status</span>
                                    <span className="font-bold">{doc.invoice.status || "—"}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border border-[#E5E7EB] rounded-xl p-4">
                                    <span className="text-[10px] uppercase text-[#6B7280] font-bold block mb-1">Billed To (Customer)</span>
                                    <p className="font-bold text-sm">{doc.invoice.billing_details?.name || doc.invoice.client_name || "—"}</p>
                                    {doc.invoice.billing_details?.email && <p className="text-[#4B5563]">{doc.invoice.billing_details.email}</p>}
                                    {doc.invoice.billing_details?.phone && <p className="text-[#4B5563]">{doc.invoice.billing_details.phone}</p>}
                                    {doc.invoice.billing_details?.address && <p className="text-[#4B5563] whitespace-pre-line mt-1">{doc.invoice.billing_details.address}</p>}
                                </div>
                                <div className="border border-[#E5E7EB] rounded-xl p-4 space-y-1">
                                    <span className="text-[10px] uppercase text-[#6B7280] font-bold block mb-1">Tax &amp; FX Parameters</span>
                                    <div className="flex justify-between">
                                        <span className="text-[#6B7280]">Invoice Currency:</span>
                                        <span className="font-mono font-bold">{doc.invoice.currency}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#6B7280]">Tour Locked USD Buying Rate:</span>
                                        <span className="font-mono">{doc.invoice.tour_usd_buying_rate ? `LKR ${fmt(doc.invoice.tour_usd_buying_rate)}` : "Not locked"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#6B7280]">Service Fee Rate:</span>
                                        <span className="font-mono">{doc.invoice.service_fee_percentage != null ? `${doc.invoice.service_fee_percentage}%` : "—"}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                                    Invoice Line Items ({doc.invoice.items?.length || 0})
                                </h4>
                                <table className="w-full border border-[#E5E7EB] rounded-xl overflow-hidden">
                                    <thead className="bg-[#F5F3EF] text-[#6B7280] uppercase text-[10px]">
                                        <tr>
                                            <th className="p-2.5 text-left w-12">#</th>
                                            <th className="p-2.5 text-left">Description</th>
                                            <th className="p-2.5 text-right">Amount ({doc.invoice.currency})</th>
                                            <th className="p-2.5 text-right">LKR Equivalent (at Tour Rate)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F3F4F6]">
                                        {(doc.invoice.items || []).map((item, idx) => {
                                            const lkrVal =
                                                doc.invoice.currency === "LKR"
                                                    ? item.amount
                                                    : doc.invoice.tour_usd_buying_rate && doc.invoice.tour_usd_buying_rate > 1
                                                    ? item.amount * doc.invoice.tour_usd_buying_rate
                                                    : null;
                                            return (
                                                <tr key={item.id}>
                                                    <td className="p-2.5 font-mono text-[#6B7280]">{idx + 1}</td>
                                                    <td className="p-2.5 font-medium">{item.description}</td>
                                                    <td className="p-2.5 text-right font-mono">{fmt(item.amount)}</td>
                                                    <td className="p-2.5 text-right font-mono">{fmt(lkrVal)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-[#FAF9F6] font-mono text-xs border-t-2 border-[#E5E7EB]">
                                        <tr>
                                            <td colSpan={2} className="p-2 text-right font-sans text-[#6B7280]">Subtotal</td>
                                            <td className="p-2 text-right">{doc.invoice.currency} {fmt(doc.invoice.subtotal)}</td>
                                            <td className="p-2 text-right">
                                                {doc.invoice.tour_usd_buying_rate && doc.invoice.subtotal != null
                                                    ? fmt(doc.invoice.subtotal * doc.invoice.tour_usd_buying_rate)
                                                    : "—"}
                                            </td>
                                        </tr>
                                        {(doc.invoice.discount_amount || 0) > 0 && (
                                            <tr>
                                                <td colSpan={2} className="p-2 text-right font-sans text-emerald-700">Discount</td>
                                                <td className="p-2 text-right text-emerald-700">- {doc.invoice.currency} {fmt(doc.invoice.discount_amount)}</td>
                                                <td className="p-2 text-right text-emerald-700">
                                                    {doc.invoice.tour_usd_buying_rate
                                                        ? `- ${fmt((doc.invoice.discount_amount || 0) * doc.invoice.tour_usd_buying_rate)}`
                                                        : "—"}
                                                </td>
                                            </tr>
                                        )}
                                        {(doc.invoice.tax_amount || 0) > 0 && (
                                            <tr>
                                                <td colSpan={2} className="p-2 text-right font-sans text-[#6B7280]">Tax</td>
                                                <td className="p-2 text-right">+ {doc.invoice.currency} {fmt(doc.invoice.tax_amount)}</td>
                                                <td className="p-2 text-right">
                                                    {doc.invoice.tour_usd_buying_rate
                                                        ? fmt((doc.invoice.tax_amount || 0) * doc.invoice.tour_usd_buying_rate)
                                                        : "—"}
                                                </td>
                                            </tr>
                                        )}
                                        <tr className="font-bold text-sm border-t border-[#E5E7EB]">
                                            <td colSpan={2} className="p-2.5 text-right font-sans">Invoice Total</td>
                                            <td className="p-2.5 text-right">{doc.invoice.currency} {fmt(doc.invoice.amount)}</td>
                                            <td className="p-2.5 text-right">LKR {fmt(doc.invoice.amount_lkr)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Linked Customer Payments */}
                            <div>
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                                    Receipts / Payments Credited Against This Invoice ({doc.invoice.payments?.length || 0})
                                </h4>
                                <table className="w-full border border-[#E5E7EB] rounded-xl overflow-hidden">
                                    <thead className="bg-emerald-50 text-emerald-900 uppercase text-[10px]">
                                        <tr>
                                            <th className="p-2.5 text-left">Date</th>
                                            <th className="p-2.5 text-left">Method</th>
                                            <th className="p-2.5 text-left">Bank / Tx Ref</th>
                                            <th className="p-2.5 text-right">Original Amount</th>
                                            <th className="p-2.5 text-right">FX Rate</th>
                                            <th className="p-2.5 text-right">USD</th>
                                            <th className="p-2.5 text-right">LKR</th>
                                            <th className="p-2.5 text-right print:hidden">Bank Slip</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F3F4F6]">
                                        {(doc.invoice.payments || []).map(p => (
                                            <tr key={p.id}>
                                                <td className="p-2.5">{fmtDate(p.payment_date)}</td>
                                                <td className="p-2.5">{p.payment_method || "—"}</td>
                                                <td className="p-2.5 font-mono">{p.transaction_id || "—"}</td>
                                                <td className="p-2.5 text-right font-mono">{p.currency} {fmt(p.amount)}</td>
                                                <td className="p-2.5 text-right font-mono">{p.exchange_rate ?? "—"}</td>
                                                <td className="p-2.5 text-right font-mono">{fmt(p.amount_usd)}</td>
                                                <td className="p-2.5 text-right font-mono">{fmt(p.amount_lkr)}</td>
                                                <td className="p-2.5 text-right space-x-1.5 print:hidden">
                                                    {p.attachment_url ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => viewStoredAttachment(p.attachment_url)}
                                                                className="text-blue-600 underline font-semibold"
                                                            >
                                                                View
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => downloadStoredAttachment(p.attachment_url, `Customer_Slip_${p.transaction_id || p.id.slice(0, 8)}`)}
                                                                className="text-emerald-700 underline font-semibold"
                                                            >
                                                                Download
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-[#9CA3AF]">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 2. PURCHASE ORDER COPY */}
                    {doc.type === "purchase_order" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#FAF9F6] p-4 rounded-xl border border-[#E5E7EB]">
                                <div>
                                    <span className="text-[10px] uppercase text-[#6B7280] font-bold block">PO Number</span>
                                    <span className="font-mono font-bold text-sm">{doc.po.po_number}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase text-[#6B7280] font-bold block">Tour Code</span>
                                    <span className="font-mono font-bold text-sm">{doc.po.tour_code || "—"}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase text-[#6B7280] font-bold block">PO Date</span>
                                    <span className="font-mono">{fmtDate(doc.po.po_date)}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase text-[#6B7280] font-bold block">Status / Mode</span>
                                    <span className="font-bold">{doc.po.po_status} {doc.po.settlement_mode ? `(${doc.po.settlement_mode})` : ""}</span>
                                </div>
                            </div>

                            {doc.po.signed_document_url && (
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between print:hidden">
                                    <div>
                                        <span className="font-bold text-blue-900 block">Signed PO / Settlement Document Attached</span>
                                        <span className="text-[11px] text-blue-700">Uploaded signed document for direct settlement</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => viewStoredAttachment(doc.po.signed_document_url)}
                                            className="px-3 py-1.5 rounded-xl bg-white border border-blue-300 text-blue-900 font-semibold text-xs"
                                        >
                                            View Signed PO ↗
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => downloadStoredAttachment(doc.po.signed_document_url, `Signed_PO_${doc.po.po_number}`)}
                                            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-semibold text-xs"
                                        >
                                            Download Signed PO ↓
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                                    Purchase Order Line Items ({doc.po.items?.length || 0})
                                </h4>
                                <table className="w-full border border-[#E5E7EB] rounded-xl overflow-hidden">
                                    <thead className="bg-[#F5F3EF] text-[#6B7280] uppercase text-[10px]">
                                        <tr>
                                            <th className="p-2.5 text-left">Day / Date</th>
                                            <th className="p-2.5 text-left">Description &amp; Service Specs</th>
                                            <th className="p-2.5 text-right">Qty</th>
                                            <th className="p-2.5 text-right">Unit ({doc.po.po_currency})</th>
                                            <th className="p-2.5 text-right">Total ({doc.po.po_currency})</th>
                                            <th className="p-2.5 text-right">FX Rate</th>
                                            <th className="p-2.5 text-right">Total (LKR)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F3F4F6]">
                                        {(doc.po.items || []).map(it => (
                                            <tr key={it.id}>
                                                <td className="p-2.5 font-mono whitespace-nowrap">
                                                    {it.day_number != null ? `Day ${it.day_number}` : ""}
                                                    {it.service_date && <span className="block text-[10px] text-[#6B7280]">{fmtDate(it.service_date)}</span>}
                                                </td>
                                                <td className="p-2.5">
                                                    <div className="font-medium">{it.description}</div>
                                                </td>
                                                <td className="p-2.5 text-right font-mono">{it.quantity}</td>
                                                <td className="p-2.5 text-right font-mono">{fmt(it.unit_price)}</td>
                                                <td className="p-2.5 text-right font-mono">{fmt(it.total_price)}</td>
                                                <td className="p-2.5 text-right font-mono">{it.fx_rate ?? "—"}</td>
                                                <td className="p-2.5 text-right font-mono">{fmt(it.total_price_lkr)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-[#FAF9F6] font-mono font-bold border-t-2 border-[#E5E7EB]">
                                        <tr>
                                            <td colSpan={4} className="p-2.5 text-right font-sans">PO Total</td>
                                            <td className="p-2.5 text-right">{doc.po.po_currency} {fmt(doc.po.po_value_own_ccy)}</td>
                                            <td className="p-2.5 text-right">{doc.po.po_rate_used ?? "—"}</td>
                                            <td className="p-2.5 text-right">LKR {fmt(doc.po.po_value_lkr)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 3. SUPPLIER INVOICE / BILL COPY */}
                    {doc.type === "supplier_invoice" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#FAF9F6] p-4 rounded-xl border border-[#E5E7EB]">
                                <div>
                                    <span className="text-[10px] uppercase text-[#6B7280] font-bold block">Supplier Invoice #</span>
                                    <span className="font-mono font-bold text-sm">{doc.invoice.invoice_number}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase text-[#6B7280] font-bold block">Linked PO / Tour</span>
                                    <span className="font-mono font-bold text-sm">{doc.po.po_number} ({doc.po.tour_code || "—"})</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase text-[#6B7280] font-bold block">Invoice Date</span>
                                    <span className="font-mono">{fmtDate(doc.invoice.invoice_date)}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase text-[#6B7280] font-bold block">Status</span>
                                    <span className="font-bold">{doc.invoice.status || "—"}</span>
                                </div>
                            </div>

                            {doc.invoice.attachment_url && (
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between print:hidden">
                                    <div>
                                        <span className="font-bold text-blue-900 block">Original Supplier Invoice File Attached</span>
                                        <span className="text-[11px] text-blue-700">Uploaded scan/PDF of the supplier&apos;s bill</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => viewStoredAttachment(doc.invoice.attachment_url)}
                                            className="px-3.5 py-2 rounded-xl bg-white border border-blue-300 text-blue-900 font-semibold text-xs hover:bg-blue-100"
                                        >
                                            View Supplier Bill ↗
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => downloadStoredAttachment(doc.invoice.attachment_url, `Supplier_Invoice_${doc.invoice.invoice_number}`)}
                                            className="px-3.5 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700"
                                        >
                                            Download Supplier Bill ↓
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                                    Supplier Invoice Line Items ({doc.invoice.items?.length || 0})
                                </h4>
                                <table className="w-full border border-[#E5E7EB] rounded-xl overflow-hidden">
                                    <thead className="bg-[#F5F3EF] text-[#6B7280] uppercase text-[10px]">
                                        <tr>
                                            <th className="p-2.5 text-left">#</th>
                                            <th className="p-2.5 text-left">Description</th>
                                            <th className="p-2.5 text-right">Qty</th>
                                            <th className="p-2.5 text-right">Unit Price ({doc.invoice.currency})</th>
                                            <th className="p-2.5 text-right">Total ({doc.invoice.currency})</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F3F4F6]">
                                        {(doc.invoice.items || []).map((it, idx) => (
                                            <tr key={it.id}>
                                                <td className="p-2.5 font-mono text-[#6B7280]">{idx + 1}</td>
                                                <td className="p-2.5">{it.description}</td>
                                                <td className="p-2.5 text-right font-mono">{it.quantity}</td>
                                                <td className="p-2.5 text-right font-mono">{fmt(it.unit_price)}</td>
                                                <td className="p-2.5 text-right font-mono">{fmt(it.total_price)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-[#FAF9F6] font-mono font-bold border-t-2 border-[#E5E7EB]">
                                        <tr>
                                            <td colSpan={4} className="p-2.5 text-right font-sans">Invoice Total ({doc.invoice.currency})</td>
                                            <td className="p-2.5 text-right">{doc.invoice.currency} {fmt(doc.invoice.amount)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={4} className="p-2.5 text-right font-sans">LKR Equivalent (Rate: {doc.invoice.exchange_rate ?? "1"})</td>
                                            <td className="p-2.5 text-right">LKR {fmt(doc.invoice.amount_lkr)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 4. PAYMENT / RECEIPT VOUCHERS */}
                    {(doc.type === "customer_payment" || doc.type === "supplier_payment" || doc.type === "ledger_voucher") && (() => {
                        const isCust = doc.type === "customer_payment" || (doc.type === "ledger_voucher" && doc.row.kind === "customer");
                        const date = doc.type === "customer_payment" ? doc.payment.payment_date : doc.type === "supplier_payment" ? doc.payment.payment_date : doc.row.payment_date;
                        const method = doc.type === "customer_payment" ? doc.payment.payment_method : doc.type === "supplier_payment" ? doc.payment.payment_method : doc.row.method;
                        const ref = doc.type === "customer_payment" ? doc.payment.transaction_id : doc.type === "supplier_payment" ? doc.payment.payment_reference : doc.row.reference;
                        const ccy = doc.type === "customer_payment" ? doc.payment.currency : doc.type === "supplier_payment" ? doc.payment.currency : doc.row.currency;
                        const amt = doc.type === "customer_payment" ? doc.payment.amount : doc.type === "supplier_payment" ? doc.payment.amount : doc.row.amount;
                        const rate = doc.type === "customer_payment" ? doc.payment.exchange_rate : doc.type === "supplier_payment" ? doc.payment.exchange_rate : doc.row.exchange_rate;
                        const usd = doc.type === "customer_payment" ? doc.payment.amount_usd : doc.type === "supplier_payment" ? (doc.payment.currency === "USD" ? doc.payment.amount : null) : doc.row.amount_usd;
                        const lkr = doc.type === "customer_payment" ? doc.payment.amount_lkr : doc.type === "supplier_payment" ? doc.payment.amount_lkr : doc.row.amount_lkr;
                        const tourCode = doc.type === "customer_payment" ? (doc.payment.tour_code || doc.invoice?.tour_code) : doc.type === "supplier_payment" ? doc.po.tour_code : doc.row.tour_code;
                        const party = doc.type === "customer_payment"
                            ? (doc.invoice?.billing_details?.name || doc.invoice?.client_name || doc.payment.invoice_number || "Customer")
                            : doc.type === "supplier_payment"
                            ? `${doc.po.vendor_name || "Supplier"} (${doc.po.po_number})`
                            : doc.row.party || "—";
                        const attachmentUrl = doc.type === "customer_payment" ? doc.payment.attachment_url : doc.type === "supplier_payment" ? doc.payment.attachment_url : doc.row.attachment_url;

                        return (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#FAF9F6] p-4 rounded-xl border border-[#E5E7EB]">
                                    <div>
                                        <span className="text-[10px] uppercase text-[#6B7280] font-bold block">Voucher Date</span>
                                        <span className="font-mono font-bold text-sm">{fmtDate(date)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase text-[#6B7280] font-bold block">Tour Code</span>
                                        <span className="font-mono font-bold text-sm">{tourCode || "—"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase text-[#6B7280] font-bold block">Payment Method</span>
                                        <span className="font-bold">{method || "—"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase text-[#6B7280] font-bold block">Bank / Tx Reference</span>
                                        <span className="font-mono font-bold">{ref || "—"}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border border-[#E5E7EB] rounded-xl p-4">
                                        <span className="text-[10px] uppercase text-[#6B7280] font-bold block mb-1">
                                            {isCust ? "Received From (Customer)" : "Paid To (Vendor / PO / Expense)"}
                                        </span>
                                        <p className="font-bold text-sm">{party}</p>
                                    </div>
                                    <div className="border border-[#E5E7EB] rounded-xl p-4 space-y-1">
                                        <span className="text-[10px] uppercase text-[#6B7280] font-bold block mb-1">Voucher Amount Breakdown</span>
                                        <div className="flex justify-between">
                                            <span className="text-[#6B7280]">Transaction Amount:</span>
                                            <span className="font-mono font-bold text-sm">{ccy} {fmt(amt)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#6B7280]">Saved Exchange Rate:</span>
                                            <span className="font-mono">{rate ?? "—"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#6B7280]">USD Equivalent:</span>
                                            <span className="font-mono">USD {fmt(usd)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold border-t border-[#F3F4F6] pt-1">
                                            <span>LKR Book Value:</span>
                                            <span className="font-mono">LKR {fmt(lkr)}</span>
                                        </div>
                                    </div>
                                </div>

                                {attachmentUrl && (
                                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between print:hidden">
                                        <div>
                                            <span className="font-bold text-emerald-900 block">Supporting Bank Slip / Payment Receipt Attached</span>
                                            <span className="text-[11px] text-emerald-700">Uploaded document for audit verification</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => viewStoredAttachment(attachmentUrl)}
                                                className="px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-semibold text-xs hover:bg-emerald-100"
                                            >
                                                View Slip ↗
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => downloadStoredAttachment(attachmentUrl, `Bank_Slip_${ref || tourCode || "Payment"}`)}
                                                className="px-3.5 py-2 rounded-xl bg-emerald-700 text-white font-semibold text-xs hover:bg-emerald-800"
                                            >
                                                Download Slip ↓
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
