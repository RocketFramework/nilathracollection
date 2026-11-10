"use client";

import React, { useMemo, useState } from "react";
import { FinanceTourDossierDTO } from "@/dtos/finance-report.dto";
import AccountingDocumentModal, { AccountingDocModalData } from "./AccountingDocumentModal";
import {
    viewStoredAttachment,
    downloadStoredAttachment,
    downloadPoPdfFile,
    downloadCustomerInvoicePdfFile,
    downloadCustomerReceiptPdfFile,
    downloadExpenseVoucherPdfFile,
} from "@/utils/accounting-documents-client";

const fmt = (n: number | null | undefined) =>
    n === null || n === undefined
        ? "—"
        : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: string | null | undefined) => {
    if (!d) return "—";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const getPoAuditStatus = (po: FinanceTourDossierDTO["purchase_orders"][number]) => {
    const hasUploadedSupplierBill = (po.supplier_invoices || []).some(inv => !!inv.attachment_url);
    const hasSignedVoucher = !!po.signed_document_url;
    const hasSupplierProof = hasUploadedSupplierBill || hasSignedVoucher;
    const hasPayments =
        (po.supplier_payments || []).some(p => !p.is_refund && Number(p.amount) > 0) ||
        (po.paid_lkr_net ?? 0) > 0;

    if (!hasSupplierProof && hasPayments) {
        return {
            code: "payment_without_proof" as const,
            badge: "⚠ PO Without Proof for Payments Made",
            shortBadge: "⚠ Payment Without Supplier Proof",
            reason:
                "Accounting Audit Exception (Unvouched Disbursement): Payment(s) have been made against this PO, but neither a Supplier Invoice/Bill document nor a Signed Voucher from the supplier has been uploaded as proof.",
        };
    }
    if (!hasSupplierProof && !hasPayments) {
        return {
            code: "incomplete_po" as const,
            badge: "⚠ Incomplete PO — No Supplier Proof",
            shortBadge: "⚠ Incomplete PO",
            reason:
                "Incomplete PO (Unsubstantiated Commitment): No payment has been made and neither a Supplier Invoice/Bill document nor a Signed Voucher has been uploaded to prove supplier acceptance or authorize payment.",
        };
    }
    return {
        code: "verified" as const,
        badge: "✓ Supplier Proof Attached",
        shortBadge: "✓ Proof Attached",
        reason: "",
    };
};

const csvEscape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return /[,"\n]/.test(s) ? `"${s}"` : s;
};

export default function TourAccountingDossierTab({ tours }: { tours: FinanceTourDossierDTO[] }) {
    const [selectedTourId, setSelectedTourId] = useState<string>(tours[0]?.tour_id || "");
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [modalDoc, setModalDoc] = useState<AccountingDocModalData | null>(null);

    const filteredTours = useMemo(() => {
        const q = search.trim().toLowerCase();
        return tours.filter(t => {
            if (dateFrom && (t.start_date || "") < dateFrom) return false;
            if (dateTo && (t.start_date || "") > dateTo) return false;
            if (!q) return true;
            return [
                t.tour_code,
                t.title,
                t.client_name,
                ...t.customer_invoices.map(i => i.invoice_number),
                ...t.purchase_orders.map(p => p.po_number),
                ...t.purchase_orders.map(p => p.vendor_name),
            ].some(v => (v || "").toLowerCase().includes(q));
        });
    }, [tours, search, dateFrom, dateTo]);

    const activeTour = useMemo(
        () => filteredTours.find(t => t.tour_id === selectedTourId) || filteredTours[0] || null,
        [filteredTours, selectedTourId]
    );

    const summary = useMemo(() => {
        if (!activeTour) return null;
        const activeInvs = activeTour.customer_invoices.filter(i => i.status !== "Cancelled");
        const invUsd = activeInvs.filter(i => i.currency === "USD").reduce((s, i) => s + i.amount, 0);
        const invLkr = activeInvs.reduce((s, i) => s + (i.amount_lkr ?? 0), 0);
        const invDiscountUsd = activeInvs.filter(i => i.currency === "USD").reduce((s, i) => s + (i.discount_amount || 0), 0);
        const invTaxUsd = activeInvs.filter(i => i.currency === "USD").reduce((s, i) => s + (i.tax_amount || 0), 0);

        const allCustPays = [
            ...activeInvs.flatMap(i => i.payments || []),
            ...activeTour.unassigned_customer_payments,
        ];
        const custPaidUsd = allCustPays.reduce((s, p) => s + (p.amount_usd ?? 0), 0);
        const custPaidLkr = allCustPays.reduce((s, p) => s + (p.amount_lkr ?? 0), 0);

        const poLkr = activeTour.purchase_orders.reduce((s, p) => s + (p.po_value_lkr ?? 0), 0);
        const supInvoicedLkr = activeTour.purchase_orders.reduce((s, p) => s + (p.invoiced_lkr ?? 0), 0);
        const supPaidLkr = activeTour.purchase_orders.reduce((s, p) => s + (p.paid_lkr_net ?? 0), 0);
        const supBalanceLkr = activeTour.purchase_orders.reduce((s, p) => s + (p.invoice_balance_lkr ?? 0), 0);

        const expLkr = activeTour.tour_expenses.reduce((s, e) => s + (e.amount_lkr ?? 0), 0);
        const expUsd = activeTour.tour_expenses.reduce((s, e) => s + (e.amount_usd ?? 0), 0);

        const allSupInvs = activeTour.purchase_orders.flatMap(p => p.supplier_invoices || []);
        const supInvsWithAttachment = allSupInvs.filter(i => !!i.attachment_url).length;

        const allSupPays = activeTour.purchase_orders.flatMap(p => p.supplier_payments || []);
        const supPaysWithSlip = allSupPays.filter(p => !!p.attachment_url).length;
        const custPaysWithSlip = allCustPays.filter(p => !!p.attachment_url).length;
        const expsWithReceipt = activeTour.tour_expenses.filter(e => !!e.receipt_url).length;

        return {
            invUsd,
            invLkr,
            invDiscountUsd,
            invTaxUsd,
            custPaidUsd,
            custPaidLkr,
            arBalanceUsd: Math.max(0, invUsd - custPaidUsd),
            poLkr,
            supInvoicedLkr,
            supPaidLkr,
            supBalanceLkr,
            expLkr,
            expUsd,
            totalOutflowLkr: supPaidLkr + expLkr,
            netCashLkr: custPaidLkr - (supPaidLkr + expLkr),
            allCustPaysCount: allCustPays.length,
            custPaysWithSlip,
            allSupInvsCount: allSupInvs.length,
            supInvsWithAttachment,
            allSupPaysCount: allSupPays.length,
            supPaysWithSlip,
            expsCount: activeTour.tour_expenses.length,
            expsWithReceipt,
        };
    }, [activeTour]);

    const handleExportTourCsv = () => {
        if (!activeTour) return;
        const lines: string[][] = [
            [
                "Section",
                "Tour Code",
                "Document / Ref #",
                "Date",
                "Party / Vendor / Client",
                "Line / Item Description",
                "Qty",
                "Currency",
                "Unit Price",
                "Line Total",
                "FX Rate",
                "USD Amount",
                "LKR Amount",
                "Status / Method",
            ],
        ];

        for (const inv of activeTour.customer_invoices) {
            for (const item of inv.items || []) {
                const lkr = inv.tour_usd_buying_rate && inv.currency === "USD" ? item.amount * inv.tour_usd_buying_rate : inv.currency === "LKR" ? item.amount : "";
                lines.push([
                    "Customer Invoice Line",
                    activeTour.tour_code,
                    inv.invoice_number || inv.id,
                    inv.created_at || "",
                    inv.billing_details?.name || inv.client_name || "",
                    item.description,
                    "1",
                    inv.currency,
                    String(item.amount),
                    String(item.amount),
                    String(inv.tour_usd_buying_rate ?? ""),
                    inv.currency === "USD" ? String(item.amount) : "",
                    String(lkr),
                    inv.status || "",
                ]);
            }
            for (const pay of inv.payments || []) {
                lines.push([
                    "Customer Receipt",
                    activeTour.tour_code,
                    pay.transaction_id || pay.id,
                    pay.payment_date || "",
                    inv.billing_details?.name || inv.client_name || "",
                    `Payment for ${inv.invoice_number || "Invoice"}`,
                    "1",
                    pay.currency,
                    String(pay.amount),
                    String(pay.amount),
                    String(pay.exchange_rate ?? ""),
                    String(pay.amount_usd ?? ""),
                    String(pay.amount_lkr ?? ""),
                    pay.payment_method || "",
                ]);
            }
        }

        for (const po of activeTour.purchase_orders) {
            for (const it of po.items || []) {
                lines.push([
                    "PO Line Item",
                    activeTour.tour_code,
                    po.po_number,
                    it.service_date || po.po_date || "",
                    po.vendor_name || "",
                    it.description,
                    String(it.quantity),
                    po.po_currency || "",
                    String(it.unit_price ?? ""),
                    String(it.total_price ?? ""),
                    String(it.fx_rate ?? po.po_rate_used ?? ""),
                    po.po_currency === "USD" ? String(it.total_price ?? "") : "",
                    String(it.total_price_lkr ?? ""),
                    po.po_status || "",
                ]);
            }
            for (const sinv of po.supplier_invoices || []) {
                lines.push([
                    "Supplier Invoice",
                    activeTour.tour_code,
                    sinv.invoice_number,
                    sinv.invoice_date || "",
                    po.vendor_name || "",
                    `Supplier Bill against ${po.po_number}`,
                    "1",
                    sinv.currency,
                    String(sinv.amount),
                    String(sinv.amount),
                    String(sinv.exchange_rate ?? ""),
                    sinv.currency === "USD" ? String(sinv.amount) : "",
                    String(sinv.amount_lkr ?? ""),
                    sinv.status || "",
                ]);
            }
            for (const spay of po.supplier_payments || []) {
                lines.push([
                    spay.is_refund ? "Supplier Refund" : "Supplier Payment",
                    activeTour.tour_code,
                    spay.payment_reference || spay.id,
                    spay.payment_date || "",
                    po.vendor_name || "",
                    `${spay.is_refund ? "Refund" : "Payment"} for ${spay.invoice_number || po.po_number}`,
                    "1",
                    spay.currency,
                    String(spay.amount),
                    String(spay.amount),
                    String(spay.exchange_rate ?? ""),
                    spay.currency === "USD" ? String(spay.amount) : "",
                    String(spay.amount_lkr ?? ""),
                    spay.payment_method || "",
                ]);
            }
        }

        for (const exp of activeTour.tour_expenses) {
            lines.push([
                "Tour Misc Expense",
                activeTour.tour_code,
                exp.payment_reference || exp.id,
                exp.expense_date || "",
                exp.paid_to || "",
                `${exp.category || "Expense"}: ${exp.description || ""}`,
                "1",
                exp.currency,
                String(exp.amount),
                String(exp.amount),
                String(exp.exchange_rate ?? ""),
                String(exp.amount_usd ?? ""),
                String(exp.amount_lkr ?? ""),
                exp.payment_method || "",
            ]);
        }

        const csvContent = lines.map(row => row.map(csvEscape).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tour-accounting-dossier-${activeTour.tour_code}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-playfair text-[#2B2B2B]">
                        Tour Accounting Dossier &amp; Tax Filing Pack
                    </h2>
                    <p className="text-sm text-[#6B7280] mt-1">
                        Simple, accounting-friendly tour dataset: Customer Invoices + Receipt PDFs + Bank Slips, Purchase Order PDFs + Supplier Bills + Payment Slips, and Expense Vouchers.
                    </p>
                </div>
                {activeTour && (
                    <div className="flex items-center gap-2 print:hidden">
                        <button
                            type="button"
                            onClick={handleExportTourCsv}
                            className="px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-[#2B2B2B] hover:bg-[#FAF9F6] shadow-sm"
                        >
                            Export Tour Accounting CSV
                        </button>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="px-4 py-2 rounded-xl bg-[#2B2B2B] text-white text-xs font-semibold hover:bg-black shadow-sm"
                        >
                            Print Complete Tour Audit Pack
                        </button>
                    </div>
                )}
            </div>

            {/* Filter & Tour Selector Bar */}
            <div className="flex flex-wrap items-end gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm print:hidden">
                <div className="space-y-1">
                    <label htmlFor="dossier-tour-select" className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">
                        Select Tour Dossier
                    </label>
                    <select
                        id="dossier-tour-select"
                        value={activeTour?.tour_id || ""}
                        onChange={e => setSelectedTourId(e.target.value)}
                        className="border border-[#E5E7EB] rounded-xl p-2 text-sm font-mono font-semibold outline-none min-w-[280px]"
                    >
                        {filteredTours.map(t => (
                            <option key={t.tour_id} value={t.tour_id}>
                                {t.tour_code} — {t.client_name || t.title || "Untitled"} ({fmtDate(t.start_date)})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label htmlFor="dossier-search" className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">
                        Search Tour / Invoice / PO / Vendor
                    </label>
                    <input
                        id="dossier-search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Tour code, client, INV #, PO #, vendor..."
                        className="w-64 border border-[#E5E7EB] rounded-xl p-2 text-sm outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                </div>
                <div className="space-y-1">
                    <label htmlFor="dossier-date-from" className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">
                        Tour Start From
                    </label>
                    <input
                        id="dossier-date-from"
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="border border-[#E5E7EB] rounded-xl p-2 text-sm outline-none"
                    />
                </div>
                <div className="space-y-1">
                    <label htmlFor="dossier-date-to" className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">
                        Tour Start To
                    </label>
                    <input
                        id="dossier-date-to"
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="border border-[#E5E7EB] rounded-xl p-2 text-sm outline-none"
                    />
                </div>
                <span className="text-xs text-[#6B7280] ml-auto pb-2">
                    {filteredTours.length} tour(s) with accounting records
                </span>
            </div>

            {!activeTour || !summary ? (
                <div className="p-12 text-center bg-white border border-[#E5E7EB] rounded-2xl text-[#9CA3AF]">
                    No tours match the current filter criteria.
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Tour Master Banner & Tax Reconciliation Cards */}
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F3F4F6] pb-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 rounded-lg bg-[#2B2B2B] text-[#D4AF37] font-mono font-bold text-sm">
                                        {activeTour.tour_code}
                                    </span>
                                    <h3 className="text-lg font-bold text-[#2B2B2B]">
                                        {activeTour.title || "Custom Sri Lanka Tour"}
                                    </h3>
                                    {activeTour.status && (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F5F3EF] text-[#4B5563]">
                                            {activeTour.status}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-[#6B7280] mt-1">
                                    Client: <strong className="text-[#2B2B2B]">{activeTour.client_name || "—"}</strong>
                                    {activeTour.client_country ? ` (${activeTour.client_country})` : ""} &middot; Pax:{" "}
                                    <strong className="text-[#2B2B2B]">{activeTour.pax_count}</strong> &middot; Travel Dates:{" "}
                                    <strong className="text-[#2B2B2B]">{fmtDate(activeTour.start_date)} &rarr; {fmtDate(activeTour.end_date)}</strong> &middot; Style:{" "}
                                    <strong className="text-[#2B2B2B]">{activeTour.travel_style || "—"}</strong>
                                </p>
                            </div>
                            <div className="text-right bg-[#FAF9F6] px-4 py-2.5 rounded-xl border border-[#E5E7EB]">
                                <span className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">
                                    Locked Bank USD Buying Rate
                                </span>
                                <span className="text-base font-bold font-mono text-[#2B2B2B]">
                                    {activeTour.usd_lkr_buying_rate ? `LKR ${fmt(activeTour.usd_lkr_buying_rate)} / USD` : "Not Locked"}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
                                <span className="text-[10px] uppercase tracking-wider text-emerald-800 font-bold block">
                                    1. Customer Billed (AR)
                                </span>
                                <span className="text-lg font-bold font-mono text-emerald-950 block mt-1">
                                    USD {fmt(summary.invUsd)}
                                </span>
                                <span className="text-xs font-mono text-emerald-800 block">
                                    LKR {fmt(summary.invLkr)}
                                </span>
                                <span className="text-[10px] text-emerald-700 block mt-1">
                                    Tax: USD {fmt(summary.invTaxUsd)} &middot; Disc: USD {fmt(summary.invDiscountUsd)}
                                </span>
                            </div>

                            <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-4">
                                <span className="text-[10px] uppercase tracking-wider text-emerald-800 font-bold block">
                                    2. Customer Collected
                                </span>
                                <span className="text-lg font-bold font-mono text-emerald-950 block mt-1">
                                    USD {fmt(summary.custPaidUsd)}
                                </span>
                                <span className="text-xs font-mono text-emerald-800 block">
                                    LKR {fmt(summary.custPaidLkr)}
                                </span>
                                <span className="text-[10px] text-emerald-700 block mt-1">
                                    AR Balance Due: USD {fmt(summary.arBalanceUsd)}
                                </span>
                            </div>

                            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
                                <span className="text-[10px] uppercase tracking-wider text-amber-900 font-bold block">
                                    3. Supplier POs &amp; Bills (AP)
                                </span>
                                <span className="text-lg font-bold font-mono text-amber-950 block mt-1">
                                    LKR {fmt(summary.supInvoicedLkr)}
                                </span>
                                <span className="text-xs font-mono text-amber-800 block">
                                    PO Agreed: LKR {fmt(summary.poLkr)}
                                </span>
                                <span className="text-[10px] text-amber-700 block mt-1">
                                    AP Unpaid Balance: LKR {fmt(summary.supBalanceLkr)}
                                </span>
                            </div>

                            <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-4">
                                <span className="text-[10px] uppercase tracking-wider text-amber-900 font-bold block">
                                    4. Total Cash Disbursed
                                </span>
                                <span className="text-lg font-bold font-mono text-amber-950 block mt-1">
                                    LKR {fmt(summary.totalOutflowLkr)}
                                </span>
                                <span className="text-xs font-mono text-amber-800 block">
                                    Suppliers: LKR {fmt(summary.supPaidLkr)}
                                </span>
                                <span className="text-[10px] text-amber-700 block mt-1">
                                    Misc Expenses: LKR {fmt(summary.expLkr)}
                                </span>
                            </div>

                            <div className="bg-[#FAF9F6] border border-[#E5E7EB] rounded-xl p-4">
                                <span className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">
                                    5. Net Cash &amp; Audit Docs
                                </span>
                                <span className={`text-lg font-bold font-mono block mt-1 ${summary.netCashLkr >= 0 ? "text-emerald-800" : "text-red-700"}`}>
                                    LKR {fmt(summary.netCashLkr)}
                                </span>
                                <span className="text-[10px] text-[#4B5563] block mt-1">
                                    Supplier Bills Attached: {summary.supInvsWithAttachment}/{summary.allSupInvsCount}
                                </span>
                                <span className="text-[10px] text-[#4B5563] block">
                                    Payment Slips: {summary.custPaysWithSlip + summary.supPaysWithSlip + summary.expsWithReceipt}/
                                    {summary.allCustPaysCount + summary.allSupPaysCount + summary.expsCount}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION A: CUSTOMER INVOICES, LINE ITEMS & RECEIPTS */}
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider">
                                    Section A &mdash; Customer Invoices, Line Items, Receipt PDFs &amp; Bank Slips (AR)
                                </h3>
                                <p className="text-[11px] text-emerald-200 mt-0.5">
                                    Customer invoice line items, downloadable Invoice PDF, Customer Payment Receipt PDFs, and uploaded Bank Slips.
                                </p>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-emerald-800 text-xs font-mono">
                                {activeTour.customer_invoices.length} Invoice(s)
                            </span>
                        </div>

                        <div className="p-6 space-y-6">
                            {activeTour.customer_invoices.length === 0 && (
                                <p className="text-xs text-[#9CA3AF] text-center py-4">
                                    No customer invoices generated for this tour yet.
                                </p>
                            )}

                            {activeTour.customer_invoices.map(inv => (
                                <div key={inv.id} className="border border-[#E5E7EB] rounded-2xl overflow-hidden">
                                    <div className="bg-[#FAF9F6] px-5 py-3.5 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2.5">
                                                <span className="font-mono font-bold text-sm text-[#2B2B2B]">
                                                    {inv.invoice_number || inv.id.slice(0, 8)}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${inv.status === "Paid" ? "bg-emerald-100 text-emerald-800" : inv.status === "Cancelled" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
                                                    {inv.status}
                                                </span>
                                                <span className="text-xs text-[#6B7280]">
                                                    Issued: {fmtDate(inv.created_at)} &middot; Due: {fmtDate(inv.due_date)}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-[#4B5563] mt-1">
                                                Billed To: <strong>{inv.billing_details?.name || inv.client_name || "—"}</strong>
                                                {inv.billing_details?.email ? ` (${inv.billing_details.email})` : ""}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 print:hidden">
                                            <div className="text-right font-mono mr-2">
                                                <span className="text-sm font-bold text-[#2B2B2B] block">
                                                    {inv.currency} {fmt(inv.amount)}
                                                </span>
                                                <span className="text-[11px] text-[#6B7280] block">
                                                    LKR {fmt(inv.amount_lkr)}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => downloadCustomerInvoicePdfFile(inv)}
                                                className="px-3 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-950"
                                            >
                                                Download Invoice PDF ↓
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setModalDoc({ type: "customer_invoice", invoice: inv })}
                                                className="px-3 py-1.5 rounded-xl border border-[#2B2B2B] bg-white text-[#2B2B2B] text-xs font-semibold hover:bg-gray-100"
                                            >
                                                View Copy
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-4">
                                        {/* Customer Invoice Line Items */}
                                        <div>
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                                                Invoice Line Items ({inv.items?.length || 0})
                                            </h4>
                                            <table className="w-full text-xs border border-[#E5E7EB] rounded-xl overflow-hidden">
                                                <thead className="bg-[#F5F3EF] text-[#6B7280] uppercase text-[10px]">
                                                    <tr>
                                                        <th className="p-2 text-left w-10">#</th>
                                                        <th className="p-2 text-left">Line Item Description</th>
                                                        <th className="p-2 text-right">Amount ({inv.currency})</th>
                                                        <th className="p-2 text-right">LKR Equivalent (at {inv.tour_usd_buying_rate ?? "—"})</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#F3F4F6]">
                                                    {(inv.items || []).map((item, idx) => {
                                                        const itemLkr =
                                                            inv.currency === "LKR"
                                                                ? item.amount
                                                                : inv.tour_usd_buying_rate && inv.tour_usd_buying_rate > 1
                                                                ? item.amount * inv.tour_usd_buying_rate
                                                                : null;
                                                        return (
                                                            <tr key={item.id}>
                                                                <td className="p-2 font-mono text-[#6B7280]">{idx + 1}</td>
                                                                <td className="p-2 font-medium text-[#2B2B2B]">{item.description}</td>
                                                                <td className="p-2 text-right font-mono">{fmt(item.amount)}</td>
                                                                <td className="p-2 text-right font-mono">{fmt(itemLkr)}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot className="bg-[#FAF9F6] font-mono text-xs border-t border-[#E5E7EB]">
                                                    <tr className="font-bold">
                                                        <td colSpan={2} className="p-2 text-right font-sans">
                                                            Invoice Total
                                                            {(inv.discount_amount || 0) > 0 ? ` (after -${inv.currency} ${fmt(inv.discount_amount)} disc)` : ""}
                                                            {(inv.tax_amount || 0) > 0 ? ` (+${inv.currency} ${fmt(inv.tax_amount)} tax)` : ""}
                                                        </td>
                                                        <td className="p-2 text-right">{inv.currency} {fmt(inv.amount)}</td>
                                                        <td className="p-2 text-right">LKR {fmt(inv.amount_lkr)}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        {/* Customer Payments & Bank Slips */}
                                        <div>
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
                                                Customer Payments, Receipt PDFs &amp; Uploaded Bank Slips ({inv.payments?.length || 0})
                                            </h4>
                                            <table className="w-full text-xs border border-emerald-200 rounded-xl overflow-hidden">
                                                <thead className="bg-emerald-50 text-emerald-900 uppercase text-[10px]">
                                                    <tr>
                                                        <th className="p-2 text-left">Receipt Date</th>
                                                        <th className="p-2 text-left">Method</th>
                                                        <th className="p-2 text-left">Bank / Tx Ref</th>
                                                        <th className="p-2 text-right">Amount</th>
                                                        <th className="p-2 text-right">FX Rate</th>
                                                        <th className="p-2 text-right">USD</th>
                                                        <th className="p-2 text-right">LKR</th>
                                                        <th className="p-2 text-right print:hidden">Bank Slip &amp; Receipt PDF</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-emerald-100">
                                                    {(inv.payments || []).map(p => (
                                                        <tr key={p.id} className="bg-emerald-50/30">
                                                            <td className="p-2">{fmtDate(p.payment_date)}</td>
                                                            <td className="p-2">{p.payment_method || "—"}</td>
                                                            <td className="p-2 font-mono">{p.transaction_id || "—"}</td>
                                                            <td className="p-2 text-right font-mono">{p.currency} {fmt(p.amount)}</td>
                                                            <td className="p-2 text-right font-mono">{p.exchange_rate ?? "—"}</td>
                                                            <td className="p-2 text-right font-mono">{fmt(p.amount_usd)}</td>
                                                            <td className="p-2 text-right font-mono font-bold">{fmt(p.amount_lkr)}</td>
                                                            <td className="p-2 text-right space-x-1.5 print:hidden">
                                                                {p.attachment_url ? (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => viewStoredAttachment(p.attachment_url)}
                                                                            className="px-2 py-1 rounded-lg bg-white border border-emerald-400 text-emerald-900 text-[11px] font-semibold hover:bg-emerald-50"
                                                                        >
                                                                            View Slip ↗
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => downloadStoredAttachment(p.attachment_url, `Customer_Slip_${p.transaction_id || p.id.slice(0, 8)}`)}
                                                                            className="px-2 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-semibold hover:bg-emerald-800"
                                                                        >
                                                                            Download Slip ↓
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-[10px] text-amber-700 font-semibold">No Slip</span>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => downloadCustomerReceiptPdfFile(p, inv)}
                                                                    className="px-2 py-1 rounded-lg bg-[#2B2B2B] text-white text-[11px] font-semibold hover:bg-black"
                                                                >
                                                                    Receipt PDF ↓
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {(!inv.payments || inv.payments.length === 0) && (
                                                        <tr>
                                                            <td colSpan={8} className="p-3 text-center text-[#9CA3AF]">
                                                                No payments recorded against this invoice yet.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Unassigned Advance Payments */}
                            {activeTour.unassigned_customer_payments.length > 0 && (
                                <div className="border border-emerald-200 rounded-2xl p-4 bg-emerald-50/20">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2">
                                        Unassigned Customer Advance Receipts ({activeTour.unassigned_customer_payments.length})
                                    </h4>
                                    <table className="w-full text-xs border border-emerald-200 rounded-xl overflow-hidden bg-white">
                                        <thead className="bg-emerald-50 text-emerald-900 uppercase text-[10px]">
                                            <tr>
                                                <th className="p-2 text-left">Date</th>
                                                <th className="p-2 text-left">Method</th>
                                                <th className="p-2 text-left">Transaction Ref</th>
                                                <th className="p-2 text-right">Amount</th>
                                                <th className="p-2 text-right">FX Rate</th>
                                                <th className="p-2 text-right">USD</th>
                                                <th className="p-2 text-right">LKR</th>
                                                <th className="p-2 text-right print:hidden">Bank Slip &amp; Receipt PDF</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-emerald-100">
                                            {activeTour.unassigned_customer_payments.map(p => (
                                                <tr key={p.id}>
                                                    <td className="p-2">{fmtDate(p.payment_date)}</td>
                                                    <td className="p-2">{p.payment_method || "—"}</td>
                                                    <td className="p-2 font-mono">{p.transaction_id || "—"}</td>
                                                    <td className="p-2 text-right font-mono">{p.currency} {fmt(p.amount)}</td>
                                                    <td className="p-2 text-right font-mono">{p.exchange_rate ?? "—"}</td>
                                                    <td className="p-2 text-right font-mono">{fmt(p.amount_usd)}</td>
                                                    <td className="p-2 text-right font-mono">{fmt(p.amount_lkr)}</td>
                                                    <td className="p-2 text-right space-x-1.5 print:hidden">
                                                        {p.attachment_url && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => viewStoredAttachment(p.attachment_url)}
                                                                    className="px-2 py-1 rounded-lg border border-emerald-400 text-emerald-900 text-[11px] font-semibold"
                                                                >
                                                                    View Slip ↗
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => downloadStoredAttachment(p.attachment_url, `Advance_Slip_${p.transaction_id || p.id.slice(0, 8)}`)}
                                                                    className="px-2 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-semibold"
                                                                >
                                                                    Download Slip ↓
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => downloadCustomerReceiptPdfFile(p)}
                                                            className="px-2 py-1 rounded-lg bg-[#2B2B2B] text-white text-[11px] font-semibold"
                                                        >
                                                            Receipt PDF ↓
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION B: SUPPLIER PO PDFS, SUPPLIER INVOICES & PAYMENT SLIPS */}
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-[#2B2B2B] text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37]">
                                    Section B &mdash; Purchase Orders (PO PDF), Supplier Invoices &amp; Bank Payment Slips (AP)
                                </h3>
                                <p className="text-[11px] text-gray-300 mt-0.5">
                                    Every PO with downloadable PO PDF, contracted line items, supplier invoices received, and downloadable bank payment slips.
                                </p>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-mono">
                                {activeTour.purchase_orders.length} Purchase Order(s)
                            </span>
                        </div>

                        <div className="p-6 space-y-6">
                            {activeTour.purchase_orders.length === 0 && (
                                <p className="text-xs text-[#9CA3AF] text-center py-4">
                                    No purchase orders recorded for this tour.
                                </p>
                            )}

                            {activeTour.purchase_orders.map(po => {
                                const poAudit = getPoAuditStatus(po);
                                return (
                                <div
                                    key={po.purchase_order_id}
                                    className={`border rounded-2xl overflow-hidden ${
                                        poAudit.code === "payment_without_proof"
                                            ? "border-red-300"
                                            : poAudit.code === "incomplete_po"
                                            ? "border-amber-300"
                                            : "border-[#E5E7EB]"
                                    }`}
                                >
                                    {/* PO Header with Direct PO PDF & Signed Voucher Downloads */}
                                    <div className="bg-[#FAF9F6] px-5 py-3.5 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2.5">
                                                <span className="font-mono font-bold text-sm text-[#2B2B2B]">{po.po_number}</span>
                                                <span className="px-2 py-0.5 rounded bg-[#E5E7EB] text-[#2B2B2B] text-[10px] font-bold uppercase">
                                                    {po.po_status}
                                                </span>
                                                {poAudit.code === "payment_without_proof" && (
                                                    <span className="px-2.5 py-0.5 rounded-md bg-red-100 border border-red-300 text-red-800 text-[10px] font-bold uppercase tracking-wide">
                                                        {poAudit.badge}
                                                    </span>
                                                )}
                                                {poAudit.code === "incomplete_po" && (
                                                    <span className="px-2.5 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold uppercase tracking-wide">
                                                        {poAudit.badge}
                                                    </span>
                                                )}
                                                <span className="text-xs font-semibold text-[#2B2B2B]">
                                                    {po.vendor_name} <span className="text-[#6B7280] font-normal">({po.vendor_type})</span>
                                                </span>
                                                {po.po_date && <span className="text-xs text-[#6B7280]">&middot; {fmtDate(po.po_date)}</span>}
                                            </div>
                                            <div className="text-[11px] text-[#6B7280] mt-0.5">
                                                {[po.vendor_email, po.vendor_phone, po.settlement_mode && `Settlement: ${po.settlement_mode}`]
                                                    .filter(Boolean)
                                                    .join(" · ")}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 print:hidden">
                                            {po.signed_document_url && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => viewStoredAttachment(po.signed_document_url)}
                                                        className="px-2.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold hover:bg-blue-100"
                                                    >
                                                        View Signed Voucher ↗
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => downloadStoredAttachment(po.signed_document_url, `Signed_Voucher_${po.po_number}`)}
                                                        className="px-2.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                                                    >
                                                        Download Signed Voucher ↓
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => downloadPoPdfFile(po, activeTour.client_name)}
                                                className="px-3 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-950"
                                            >
                                                Download PO PDF ↓
                                            </button>
                                        </div>
                                    </div>

                                    {poAudit.code !== "verified" && (
                                        <div
                                            className={`px-5 py-2.5 text-xs font-medium border-b flex items-center justify-between gap-2 ${
                                                poAudit.code === "payment_without_proof"
                                                    ? "bg-red-50 border-red-200 text-red-900"
                                                    : "bg-amber-50 border-amber-200 text-amber-900"
                                            }`}
                                        >
                                            <span>{poAudit.reason}</span>
                                            <span className="text-[10px] font-mono uppercase font-bold whitespace-nowrap">
                                                No Bill Uploaded &middot; No Signed Voucher
                                            </span>
                                        </div>
                                    )}

                                    <div className="p-4 space-y-5">
                                        {/* 1. PO Line Items */}
                                        <div>
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                                                1. Purchase Order Line Items ({po.items?.length || 0})
                                            </h4>
                                            <table className="w-full text-xs border border-[#E5E7EB] rounded-xl overflow-hidden">
                                                <thead className="bg-[#F5F3EF] text-[#6B7280] uppercase text-[10px]">
                                                    <tr>
                                                        <th className="p-2 text-left">Day / Service Date</th>
                                                        <th className="p-2 text-left">Description &amp; Specifications</th>
                                                        <th className="p-2 text-right">Qty</th>
                                                        <th className="p-2 text-right">Unit ({po.po_currency})</th>
                                                        <th className="p-2 text-right">Total ({po.po_currency})</th>
                                                        <th className="p-2 text-right">FX Rate</th>
                                                        <th className="p-2 text-right">Total (LKR)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#F3F4F6]">
                                                    {(po.items || []).map(it => (
                                                        <tr key={it.id}>
                                                            <td className="p-2 font-mono whitespace-nowrap">
                                                                {it.day_number != null ? `Day ${it.day_number}` : ""}
                                                                {it.service_date && <span className="block text-[10px] text-[#6B7280]">{fmtDate(it.service_date)}</span>}
                                                            </td>
                                                            <td className="p-2">
                                                                <div className="font-medium text-[#2B2B2B]">{it.description}</div>
                                                                {it.service_details && Object.keys(it.service_details).length > 0 && (
                                                                    <div className="text-[10px] text-[#6B7280]">
                                                                        {[
                                                                            it.service_details.room_type && `Room: ${it.service_details.room_type}`,
                                                                            it.service_details.meal_plan && `Meal: ${it.service_details.meal_plan}`,
                                                                            it.service_details.number_of_nights && `Nights: ${it.service_details.number_of_nights}`,
                                                                            it.service_details.vehicle_type && `Vehicle: ${it.service_details.vehicle_type}`,
                                                                        ]
                                                                            .filter(Boolean)
                                                                            .join(" · ")}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="p-2 text-right font-mono">{it.quantity}</td>
                                                            <td className="p-2 text-right font-mono">{fmt(it.unit_price)}</td>
                                                            <td className="p-2 text-right font-mono">{fmt(it.total_price)}</td>
                                                            <td className="p-2 text-right font-mono">{it.fx_rate ?? "—"}</td>
                                                            <td className="p-2 text-right font-mono">{fmt(it.total_price_lkr)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-[#FAF9F6] font-mono font-bold text-xs border-t border-[#E5E7EB]">
                                                    <tr>
                                                        <td colSpan={4} className="p-2 text-right font-sans">PO Agreed Total</td>
                                                        <td className="p-2 text-right">{po.po_currency} {fmt(po.po_value_own_ccy)}</td>
                                                        <td className="p-2 text-right">{po.po_rate_used ?? "—"}</td>
                                                        <td className="p-2 text-right">LKR {fmt(po.po_value_lkr)}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        {/* 2. Supplier Invoices & Bill Copies */}
                                        <div>
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-900 mb-2">
                                                2. Supplier Invoices / Bills Received ({po.supplier_invoices?.length || 0})
                                            </h4>
                                            {(po.supplier_invoices || []).length === 0 ? (
                                                po.signed_document_url ? (
                                                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                                                        No separate supplier invoice recorded against {po.po_number} &mdash; substantiated by uploaded <strong>Signed Voucher</strong>.
                                                    </div>
                                                ) : poAudit.code === "payment_without_proof" ? (
                                                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
                                                        ⚠ No supplier invoice or Signed Voucher uploaded against {po.po_number} &mdash; <strong>PO Without Proof for Payments Made</strong>.
                                                    </div>
                                                ) : (
                                                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                                                        ⚠ No supplier invoice or Signed Voucher uploaded against {po.po_number} &mdash; <strong>Incomplete PO (No Supplier Proof of Acceptance)</strong>.
                                                    </div>
                                                )
                                            ) : (
                                                <div className="space-y-3">
                                                    {(po.supplier_invoices || []).map(sinv => (
                                                        <div key={sinv.id} className="border border-blue-200 rounded-xl p-3 bg-blue-50/20 space-y-2">
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono font-bold text-xs text-[#2B2B2B]">{sinv.invoice_number}</span>
                                                                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-bold">
                                                                        {sinv.invoice_type || "Final"} &middot; {sinv.status}
                                                                    </span>
                                                                    <span className="text-xs text-[#6B7280]">
                                                                        Date: {fmtDate(sinv.invoice_date)} &middot; Due: {fmtDate(sinv.due_date)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="font-mono font-bold text-xs">
                                                                        {sinv.currency} {fmt(sinv.amount)}
                                                                        {sinv.exchange_rate && sinv.currency !== "LKR" ? ` @ ${sinv.exchange_rate}` : ""} = LKR {fmt(sinv.amount_lkr)}
                                                                    </span>
                                                                    {sinv.attachment_url ? (
                                                                        <>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => viewStoredAttachment(sinv.attachment_url)}
                                                                                className="px-2.5 py-1 rounded-lg bg-white border border-blue-400 text-blue-900 text-[11px] font-semibold hover:bg-blue-50 print:hidden"
                                                                            >
                                                                                View Supplier Bill ↗
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => downloadStoredAttachment(sinv.attachment_url, `Supplier_Invoice_${sinv.invoice_number}`)}
                                                                                className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-700 print:hidden"
                                                                            >
                                                                                Download Bill ↓
                                                                            </button>
                                                                        </>
                                                                    ) : po.signed_document_url ? (
                                                                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold print:hidden">
                                                                            No Bill Scan &middot; Signed Voucher Attached ✓
                                                                        </span>
                                                                    ) : poAudit.code === "payment_without_proof" ? (
                                                                        <span className="px-2 py-0.5 rounded bg-red-100 border border-red-300 text-red-800 text-[10px] font-bold">
                                                                            ⚠ No Bill or Signed Voucher &mdash; PO Without Proof for Payments
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold">
                                                                            ⚠ No Bill or Signed Voucher &mdash; Incomplete PO
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {sinv.items && sinv.items.length > 0 && (
                                                                <table className="w-full text-[11px] border border-blue-200 rounded-lg overflow-hidden bg-white">
                                                                    <thead className="bg-blue-50 text-blue-900 uppercase text-[9px]">
                                                                        <tr>
                                                                            <th className="p-1.5 text-left">Supplier Invoice Line Description</th>
                                                                            <th className="p-1.5 text-right">Qty</th>
                                                                            <th className="p-1.5 text-right">Unit ({sinv.currency})</th>
                                                                            <th className="p-1.5 text-right">Total ({sinv.currency})</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-blue-100">
                                                                        {sinv.items.map(sit => (
                                                                            <tr key={sit.id}>
                                                                                <td className="p-1.5">{sit.description}</td>
                                                                                <td className="p-1.5 text-right font-mono">{sit.quantity}</td>
                                                                                <td className="p-1.5 text-right font-mono">{fmt(sit.unit_price)}</td>
                                                                                <td className="p-1.5 text-right font-mono">{fmt(sit.total_price)}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* 3. Supplier Payment / Refund Slips */}
                                        <div>
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-900 mb-2">
                                                3. Supplier Payments &amp; Bank Slips ({po.supplier_payments?.length || 0})
                                            </h4>
                                            <table className="w-full text-xs border border-amber-200 rounded-xl overflow-hidden">
                                                <thead className="bg-amber-50 text-amber-900 uppercase text-[10px]">
                                                    <tr>
                                                        <th className="p-2 text-left">Payment Date</th>
                                                        <th className="p-2 text-left">Type / Invoice #</th>
                                                        <th className="p-2 text-left">Method &amp; Ref</th>
                                                        <th className="p-2 text-right">Original Amount</th>
                                                        <th className="p-2 text-right">FX Rate</th>
                                                        <th className="p-2 text-right">LKR Value</th>
                                                        <th className="p-2 text-right print:hidden">Bank Slip &amp; Voucher</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-amber-100">
                                                    {(po.supplier_payments || []).map(spay => (
                                                        <tr key={spay.id} className="bg-amber-50/20">
                                                            <td className="p-2">{fmtDate(spay.payment_date)}</td>
                                                            <td className="p-2">
                                                                <span className={`font-bold ${spay.is_refund ? "text-red-700" : "text-amber-950"}`}>
                                                                    {spay.is_refund ? "Supplier Refund" : "Payment"}
                                                                </span>
                                                                {spay.invoice_number && <span className="block text-[10px] font-mono text-[#6B7280]">Inv: {spay.invoice_number}</span>}
                                                            </td>
                                                            <td className="p-2">
                                                                {spay.payment_method || "—"}
                                                                {spay.payment_reference && <span className="block text-[10px] font-mono text-[#6B7280]">{spay.payment_reference}</span>}
                                                            </td>
                                                            <td className="p-2 text-right font-mono">{spay.currency} {fmt(spay.amount)}</td>
                                                            <td className="p-2 text-right font-mono">{spay.exchange_rate ?? "—"}</td>
                                                            <td className="p-2 text-right font-mono font-bold">{fmt(spay.amount_lkr)}</td>
                                                            <td className="p-2 text-right space-x-1.5 print:hidden">
                                                                {spay.attachment_url ? (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => viewStoredAttachment(spay.attachment_url)}
                                                                            className="px-2 py-1 rounded-lg bg-white border border-amber-400 text-amber-950 text-[11px] font-semibold hover:bg-amber-50"
                                                                        >
                                                                            View Slip ↗
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => downloadStoredAttachment(spay.attachment_url, `Supplier_Slip_${po.po_number}_${spay.payment_reference || spay.id.slice(0, 6)}`)}
                                                                            className="px-2 py-1 rounded-lg bg-amber-700 text-white text-[11px] font-semibold hover:bg-amber-800"
                                                                        >
                                                                            Download Slip ↓
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-[10px] text-red-600 font-semibold">No Slip</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {(!po.supplier_payments || po.supplier_payments.length === 0) && (
                                                        <tr>
                                                            <td colSpan={7} className="p-3 text-center text-[#9CA3AF]">
                                                                No supplier payments recorded for this PO yet.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* SECTION C: PETTY CASH & MISCELLANEOUS TOUR EXPENSES */}
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-amber-900 text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider">
                                    Section C &mdash; Petty Cash &amp; Miscellaneous Tour Expenses
                                </h3>
                                <p className="text-[11px] text-amber-200 mt-0.5">
                                    Direct non-PO tour expenses with downloadable Expense Voucher PDF and uploaded receipt copies.
                                </p>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-amber-800 text-xs font-mono">
                                {activeTour.tour_expenses.length} Expense(s)
                            </span>
                        </div>

                        <div className="p-6">
                            <table className="w-full text-xs border border-[#E5E7EB] rounded-xl overflow-hidden">
                                <thead className="bg-[#F5F3EF] text-[#6B7280] uppercase text-[10px]">
                                    <tr>
                                        <th className="p-2.5 text-left">Date</th>
                                        <th className="p-2.5 text-left">Category</th>
                                        <th className="p-2.5 text-left">Description &amp; Notes</th>
                                        <th className="p-2.5 text-left">Paid To</th>
                                        <th className="p-2.5 text-left">Method / Ref</th>
                                        <th className="p-2.5 text-right">Amount</th>
                                        <th className="p-2.5 text-right">FX Rate</th>
                                        <th className="p-2.5 text-right">LKR Amount</th>
                                        <th className="p-2.5 text-right print:hidden">Receipt &amp; Voucher PDF</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F3F4F6]">
                                    {activeTour.tour_expenses.map(exp => (
                                        <tr key={exp.id}>
                                            <td className="p-2.5 whitespace-nowrap">{fmtDate(exp.expense_date)}</td>
                                            <td className="p-2.5 font-semibold">{exp.category || "—"}</td>
                                            <td className="p-2.5">
                                                <div>{exp.description || "—"}</div>
                                                {exp.notes && <div className="text-[10px] text-[#6B7280]">Note: {exp.notes}</div>}
                                            </td>
                                            <td className="p-2.5">{exp.paid_to || "—"}</td>
                                            <td className="p-2.5">
                                                {exp.payment_method || "—"}
                                                {exp.payment_reference && <span className="block text-[10px] font-mono text-[#6B7280]">{exp.payment_reference}</span>}
                                            </td>
                                            <td className="p-2.5 text-right font-mono">{exp.currency} {fmt(exp.amount)}</td>
                                            <td className="p-2.5 text-right font-mono">{exp.exchange_rate ?? "—"}</td>
                                            <td className="p-2.5 text-right font-mono font-bold">{fmt(exp.amount_lkr)}</td>
                                            <td className="p-2.5 text-right space-x-1.5 print:hidden">
                                                {exp.receipt_url ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => viewStoredAttachment(exp.receipt_url)}
                                                            className="px-2 py-1 rounded-lg bg-white border border-amber-400 text-amber-950 text-[11px] font-semibold hover:bg-amber-50"
                                                        >
                                                            View Receipt ↗
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => downloadStoredAttachment(exp.receipt_url, `Expense_Receipt_${exp.id.slice(0, 8)}`)}
                                                            className="px-2 py-1 rounded-lg bg-amber-700 text-white text-[11px] font-semibold hover:bg-amber-800"
                                                        >
                                                            Download Receipt ↓
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-[10px] text-red-600 font-semibold">No Receipt</span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => downloadExpenseVoucherPdfFile(exp)}
                                                    className="px-2 py-1 rounded-lg bg-[#2B2B2B] text-white text-[11px] font-semibold hover:bg-black"
                                                >
                                                    Voucher PDF ↓
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {activeTour.tour_expenses.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="p-6 text-center text-[#9CA3AF]">
                                                No miscellaneous tour expenses recorded for this tour.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <AccountingDocumentModal doc={modalDoc} onClose={() => setModalDoc(null)} />
        </div>
    );
}
