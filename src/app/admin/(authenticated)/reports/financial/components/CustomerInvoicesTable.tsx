"use client";

import React, { useMemo, useState } from "react";
import { FinanceLedgerInvoiceDTO } from "@/dtos/finance-report.dto";
import AccountingDocumentModal, { AccountingDocModalData } from "./AccountingDocumentModal";

const fmt = (n: number | null | undefined) =>
    n === null || n === undefined
        ? "—"
        : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: string | null | undefined) => {
    if (!d) return "—";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const csvEscape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return /[,"\n]/.test(s) ? `"${s}"` : s;
};

export default function CustomerInvoicesTable({ invoices }: { invoices: FinanceLedgerInvoiceDTO[] }) {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("All");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
    const [modalDoc, setModalDoc] = useState<AccountingDocModalData | null>(null);

    const statuses = useMemo(
        () => ["All", ...Array.from(new Set(invoices.map(i => i.status).filter(Boolean) as string[]))],
        [invoices]
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return invoices.filter(inv => {
            if (status !== "All" && inv.status !== status) return false;
            const dateStr = (inv.created_at || "").slice(0, 10);
            if (dateFrom && dateStr < dateFrom) return false;
            if (dateTo && dateStr > dateTo) return false;
            if (!q) return true;
            return [
                inv.invoice_number,
                inv.tour_code,
                inv.client_name,
                inv.billing_details?.name,
                inv.billing_details?.email,
                ...(inv.items || []).map(it => it.description),
            ].some(v => (v || "").toLowerCase().includes(q));
        });
    }, [invoices, search, status, dateFrom, dateTo]);

    const totals = useMemo(() => {
        const active = filtered.filter(i => i.status !== "Cancelled");
        const usdSubtotal = active.filter(i => i.currency === "USD").reduce((s, i) => s + (i.subtotal || i.amount), 0);
        const usdDiscount = active.filter(i => i.currency === "USD").reduce((s, i) => s + (i.discount_amount || 0), 0);
        const usdTax = active.filter(i => i.currency === "USD").reduce((s, i) => s + (i.tax_amount || 0), 0);
        const usdTotal = active.filter(i => i.currency === "USD").reduce((s, i) => s + i.amount, 0);
        const lkrTotal = active.reduce((s, i) => s + (i.amount_lkr ?? 0), 0);
        const paidUsd = active.reduce((s, i) => s + (i.paid_usd ?? 0), 0);
        const paidLkr = active.reduce((s, i) => s + (i.paid_lkr ?? 0), 0);
        return {
            usdSubtotal,
            usdDiscount,
            usdTax,
            usdTotal,
            lkrTotal,
            paidUsd,
            paidLkr,
            balanceUsd: Math.max(0, usdTotal - paidUsd),
        };
    }, [filtered]);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const expandAll = () => {
        const allOpen = filtered.every(i => expandedIds[i.id]);
        if (allOpen) {
            setExpandedIds({});
        } else {
            const next: Record<string, boolean> = {};
            filtered.forEach(i => {
                next[i.id] = true;
            });
            setExpandedIds(next);
        }
    };

    const handleExportSalesCsv = () => {
        const lines: string[][] = [
            [
                "Invoice Number",
                "Issue Date",
                "Due Date",
                "Tour Code",
                "Status",
                "Customer Name",
                "Customer Email",
                "Customer Address",
                "Currency",
                "Tour USD Buying Rate",
                "Service Fee %",
                "Line #",
                "Line Item Description",
                "Line Amount",
                "Invoice Subtotal",
                "Invoice Discount",
                "Invoice Tax",
                "Invoice Net Total",
                "Invoice Total (LKR)",
                "Collected (USD)",
                "Collected (LKR)",
                "Balance Due (USD)",
            ],
        ];

        for (const inv of filtered) {
            const items = inv.items && inv.items.length > 0 ? inv.items : [{ id: "", invoice_id: inv.id, description: "Consolidated Tour Package", amount: inv.amount }];
            items.forEach((it, idx) => {
                lines.push([
                    inv.invoice_number || inv.id,
                    (inv.created_at || "").slice(0, 10),
                    (inv.due_date || "").slice(0, 10),
                    inv.tour_code || "",
                    inv.status || "",
                    inv.billing_details?.name || inv.client_name || "",
                    inv.billing_details?.email || "",
                    inv.billing_details?.address || "",
                    inv.currency,
                    String(inv.tour_usd_buying_rate ?? ""),
                    String(inv.service_fee_percentage ?? ""),
                    String(idx + 1),
                    it.description,
                    String(it.amount),
                    idx === 0 ? String(inv.subtotal ?? inv.amount) : "",
                    idx === 0 ? String(inv.discount_amount ?? 0) : "",
                    idx === 0 ? String(inv.tax_amount ?? 0) : "",
                    idx === 0 ? String(inv.amount) : "",
                    idx === 0 ? String(inv.amount_lkr ?? "") : "",
                    idx === 0 ? String(inv.paid_usd ?? 0) : "",
                    idx === 0 ? String(inv.paid_lkr ?? 0) : "",
                    idx === 0 ? String(inv.balance_usd ?? 0) : "",
                ]);
            });
        }

        const csvContent = lines.map(r => r.map(csvEscape).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sales-register-customer-invoices.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-playfair text-[#2B2B2B]">
                        Sales Register &mdash; Customer Tax Invoices &amp; Line Items
                    </h2>
                    <p className="text-sm text-[#6B7280] mt-1">
                        Every customer invoice with expandable line items (<span className="font-mono">customer_invoice_items</span>), tax, discount, service fee, printable invoice copies, and linked receipt vouchers.
                    </p>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                    <button
                        type="button"
                        onClick={expandAll}
                        className="px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-[#2B2B2B] hover:bg-[#FAF9F6] shadow-sm"
                    >
                        {filtered.every(i => expandedIds[i.id]) && filtered.length > 0 ? "Collapse All Line Items" : "Expand All Line Items"}
                    </button>
                    <button
                        type="button"
                        onClick={handleExportSalesCsv}
                        className="px-4 py-2 rounded-xl bg-[#2B2B2B] text-white text-xs font-semibold hover:bg-black shadow-sm"
                    >
                        Export Sales Register CSV (with Line Items)
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
                    <span className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Gross Billed Subtotal</span>
                    <span className="text-xl font-bold font-mono text-[#2B2B2B] block mt-1">USD {fmt(totals.usdSubtotal)}</span>
                    <span className="text-[10px] text-[#9CA3AF] block mt-1">Before discounts &amp; tax</span>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
                    <span className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Discounts &amp; Tax</span>
                    <span className="text-sm font-bold font-mono text-emerald-700 block mt-1">Disc: - USD {fmt(totals.usdDiscount)}</span>
                    <span className="text-sm font-bold font-mono text-[#2B2B2B] block">Tax: + USD {fmt(totals.usdTax)}</span>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
                    <span className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Net Invoiced (USD &amp; LKR)</span>
                    <span className="text-xl font-bold font-mono text-[#2B2B2B] block mt-1">USD {fmt(totals.usdTotal)}</span>
                    <span className="text-xs font-mono text-[#6B7280] block">LKR {fmt(totals.lkrTotal)}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-800 font-bold block">Receipts Collected</span>
                    <span className="text-xl font-bold font-mono text-emerald-950 block mt-1">USD {fmt(totals.paidUsd)}</span>
                    <span className="text-xs font-mono text-emerald-800 block">LKR {fmt(totals.paidLkr)}</span>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
                    <span className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">AR Balance Due</span>
                    <span className="text-xl font-bold font-mono text-amber-800 block mt-1">USD {fmt(totals.balanceUsd)}</span>
                    <span className="text-[10px] text-[#9CA3AF] block mt-1">Active invoices minus receipts</span>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-end gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
                <div className="space-y-1">
                    <label htmlFor="sales-reg-search" className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">
                        Search Invoice / Client / Line Item
                    </label>
                    <input
                        id="sales-reg-search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="INV #, tour code, client, line item..."
                        className="w-64 border border-[#E5E7EB] rounded-xl p-2 text-sm outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                </div>
                <div className="space-y-1">
                    <label htmlFor="sales-reg-status" className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">
                        Status
                    </label>
                    <select
                        id="sales-reg-status"
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="border border-[#E5E7EB] rounded-xl p-2 text-sm outline-none"
                    >
                        {statuses.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label htmlFor="sales-reg-from" className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">
                        Issue Date From
                    </label>
                    <input
                        id="sales-reg-from"
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="border border-[#E5E7EB] rounded-xl p-2 text-sm outline-none"
                    />
                </div>
                <div className="space-y-1">
                    <label htmlFor="sales-reg-to" className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">
                        Issue Date To
                    </label>
                    <input
                        id="sales-reg-to"
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="border border-[#E5E7EB] rounded-xl p-2 text-sm outline-none"
                    />
                </div>
                <span className="text-xs text-[#6B7280] ml-auto pb-2">
                    {filtered.length} of {invoices.length} invoices
                </span>
            </div>

            {/* Invoices Table with Expandable Line Items */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full text-xs">
                    <thead className="bg-[#F5F3EF] text-[#6B7280] uppercase tracking-wider text-[10px]">
                        <tr>
                            <th className="p-3 text-left w-8"></th>
                            <th className="p-3 text-left">Invoice #</th>
                            <th className="p-3 text-left">Tour</th>
                            <th className="p-3 text-left">Customer</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-right">Subtotal</th>
                            <th className="p-3 text-right">Disc / Tax</th>
                            <th className="p-3 text-right">Invoice Total</th>
                            <th className="p-3 text-right">LKR (at Tour Rate)</th>
                            <th className="p-3 text-right">Paid (USD)</th>
                            <th className="p-3 text-right">Balance (USD)</th>
                            <th className="p-3 text-right print:hidden">Invoice Copy</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={12} className="p-8 text-center text-[#9CA3AF]">
                                    No customer invoices match the current filters.
                                </td>
                            </tr>
                        )}
                        {filtered.map(inv => {
                            const isOpen = !!expandedIds[inv.id];
                            return (
                                <React.Fragment key={inv.id}>
                                    <tr
                                        className="hover:bg-[#FAF9F6] cursor-pointer"
                                        onClick={() => toggleExpand(inv.id)}
                                    >
                                        <td className="p-3 font-mono text-[#6B7280]">{isOpen ? "▼" : "▶"}</td>
                                        <td className="p-3 font-mono font-bold text-[#2B2B2B] whitespace-nowrap">
                                            {inv.invoice_number || inv.id.slice(0, 8)}
                                            <span className="block text-[10px] font-normal text-[#9CA3AF]">
                                                {fmtDate(inv.created_at)}
                                            </span>
                                        </td>
                                        <td className="p-3 font-mono">{inv.tour_code || "—"}</td>
                                        <td className="p-3">
                                            <span className="font-medium text-[#2B2B2B]">{inv.billing_details?.name || inv.client_name || "—"}</span>
                                            {inv.billing_details?.email && (
                                                <span className="block text-[10px] text-[#9CA3AF]">{inv.billing_details.email}</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${inv.status === "Paid" ? "bg-emerald-100 text-emerald-800" : inv.status === "Cancelled" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
                                                {inv.status || "—"}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right font-mono">{inv.currency} {fmt(inv.subtotal)}</td>
                                        <td className="p-3 text-right font-mono text-[11px]">
                                            {(inv.discount_amount || 0) > 0 && <span className="text-emerald-700 block">-{fmt(inv.discount_amount)}</span>}
                                            {(inv.tax_amount || 0) > 0 && <span className="text-[#4B5563] block">+{fmt(inv.tax_amount)}</span>}
                                            {!(inv.discount_amount || 0) && !(inv.tax_amount || 0) && "—"}
                                        </td>
                                        <td className="p-3 text-right font-mono font-bold">{inv.currency} {fmt(inv.amount)}</td>
                                        <td className="p-3 text-right font-mono">
                                            {fmt(inv.amount_lkr)}
                                            {inv.tour_usd_buying_rate && <span className="block text-[10px] text-[#9CA3AF]">@ {inv.tour_usd_buying_rate}</span>}
                                        </td>
                                        <td className="p-3 text-right font-mono text-emerald-800">{fmt(inv.paid_usd)}</td>
                                        <td className="p-3 text-right font-mono font-bold text-amber-800">{fmt(inv.balance_usd)}</td>
                                        <td className="p-3 text-right print:hidden" onClick={e => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={() => setModalDoc({ type: "customer_invoice", invoice: inv })}
                                                className="px-2.5 py-1 rounded-lg bg-[#2B2B2B] text-white text-[11px] font-semibold hover:bg-black"
                                            >
                                                Invoice Copy
                                            </button>
                                        </td>
                                    </tr>

                                    {isOpen && (
                                        <tr className="bg-[#FAF9F6]">
                                            <td colSpan={12} className="p-4 border-t border-[#E5E7EB]">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    {/* Line Items */}
                                                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-3">
                                                        <h5 className="text-[10px] uppercase tracking-wider font-bold text-[#6B7280] mb-2">
                                                            Invoice Line Items ({inv.items?.length || 0})
                                                            {inv.service_fee_percentage != null ? ` · Service Fee: ${inv.service_fee_percentage}%` : ""}
                                                        </h5>
                                                        <table className="w-full text-xs">
                                                            <thead className="bg-[#F5F3EF] text-[#6B7280] uppercase text-[9px]">
                                                                <tr>
                                                                    <th className="p-1.5 text-left">#</th>
                                                                    <th className="p-1.5 text-left">Description</th>
                                                                    <th className="p-1.5 text-right">Amount ({inv.currency})</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-[#F3F4F6]">
                                                                {(inv.items || []).map((it, idx) => (
                                                                    <tr key={it.id}>
                                                                        <td className="p-1.5 font-mono text-[#6B7280]">{idx + 1}</td>
                                                                        <td className="p-1.5">{it.description}</td>
                                                                        <td className="p-1.5 text-right font-mono">{fmt(it.amount)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* Linked Receipts */}
                                                    <div className="bg-white border border-emerald-200 rounded-xl p-3">
                                                        <h5 className="text-[10px] uppercase tracking-wider font-bold text-emerald-800 mb-2">
                                                            Linked Customer Receipt Vouchers ({inv.payments?.length || 0})
                                                        </h5>
                                                        <table className="w-full text-xs">
                                                            <thead className="bg-emerald-50 text-emerald-900 uppercase text-[9px]">
                                                                <tr>
                                                                    <th className="p-1.5 text-left">Date</th>
                                                                    <th className="p-1.5 text-left">Method / Ref</th>
                                                                    <th className="p-1.5 text-right">Amount</th>
                                                                    <th className="p-1.5 text-right">LKR</th>
                                                                    <th className="p-1.5 text-right print:hidden">Slip / Voucher</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-emerald-100">
                                                                {(inv.payments || []).map(p => (
                                                                    <tr key={p.id}>
                                                                        <td className="p-1.5">{fmtDate(p.payment_date)}</td>
                                                                        <td className="p-1.5">
                                                                            {p.payment_method || "—"}
                                                                            {p.transaction_id && <span className="block text-[10px] font-mono text-[#6B7280]">{p.transaction_id}</span>}
                                                                        </td>
                                                                        <td className="p-1.5 text-right font-mono">{p.currency} {fmt(p.amount)}</td>
                                                                        <td className="p-1.5 text-right font-mono">{fmt(p.amount_lkr)}</td>
                                                                        <td className="p-1.5 text-right space-x-1.5 print:hidden">
                                                                            {p.attachment_url && (
                                                                                <a href={p.attachment_url} target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">
                                                                                    Slip ↗
                                                                                </a>
                                                                            )}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setModalDoc({ type: "customer_payment", payment: p, invoice: inv })}
                                                                                className="px-2 py-0.5 rounded border border-emerald-300 text-emerald-900 text-[10px] font-semibold"
                                                                            >
                                                                                Voucher
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                {(!inv.payments || inv.payments.length === 0) && (
                                                                    <tr>
                                                                        <td colSpan={5} className="p-3 text-center text-[#9CA3AF]">No receipts recorded yet.</td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <AccountingDocumentModal doc={modalDoc} onClose={() => setModalDoc(null)} />
        </div>
    );
}

