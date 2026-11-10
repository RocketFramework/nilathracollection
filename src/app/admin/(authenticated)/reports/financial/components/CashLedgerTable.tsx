"use client";

import React, { useMemo, useState } from "react";
import { FinanceLedgerDTO } from "@/dtos/finance-report.dto";
import AccountingDocumentModal, { AccountingDocModalData } from "./AccountingDocumentModal";
import { viewStoredAttachment, downloadStoredAttachment } from "@/utils/accounting-documents-client";

const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dash = <span className="text-[#9CA3AF]">&mdash;</span>;

const csvEscape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return /[,"\n]/.test(s) ? `"${s}"` : s;
};

export default function CashLedgerTable({ ledger }: { ledger: FinanceLedgerDTO }) {
    const [tour, setTour] = useState("All");
    const [direction, setDirection] = useState("All");
    const [attachmentFilter, setAttachmentFilter] = useState("All");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [search, setSearch] = useState("");
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
    const [modalDoc, setModalDoc] = useState<AccountingDocModalData | null>(null);

    const tours = useMemo(() => {
        const codes = new Set<string>();
        ledger.rows.forEach(r => r.tour_code && codes.add(r.tour_code));
        ledger.invoices.forEach(i => i.tour_code && codes.add(i.tour_code));
        return ["All", ...Array.from(codes).sort()];
    }, [ledger]);

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return ledger.rows.filter(r => {
            if (tour !== "All" && r.tour_code !== tour) return false;
            if (direction === "customer" && r.kind !== "customer") return false;
            if (direction === "supplier" && r.kind !== "supplier") return false;
            if (direction === "expense" && r.kind !== "expense") return false;
            if (attachmentFilter === "with" && !r.attachment_url) return false;
            if (attachmentFilter === "missing" && !!r.attachment_url) return false;
            const dStr = (r.payment_date || "").slice(0, 10);
            if (dateFrom && dStr < dateFrom) return false;
            if (dateTo && dStr > dateTo) return false;
            if (!q) return true;
            return [
                r.tour_code,
                r.party,
                r.reference,
                r.method,
                r.notes,
                ...(r.line_items || []).map(li => li.description),
            ].some(v => (v || "").toLowerCase().includes(q));
        });
    }, [ledger, tour, direction, attachmentFilter, dateFrom, dateTo, search]);

    const invoices = useMemo(
        () => ledger.invoices.filter(i => i.status !== "Cancelled" && (tour === "All" || i.tour_code === tour)),
        [ledger, tour]
    );

    const totals = useMemo(() => {
        const side = (kind: "customer" | "supplier") => {
            const r = rows.filter(x => (kind === "customer" ? x.kind === "customer" : x.kind !== "customer"));
            return {
                count: r.length,
                usd: r.reduce((s, x) => s + (x.amount_usd ?? 0), 0),
                lkr: r.reduce((s, x) => s + (x.amount_lkr ?? 0), 0),
                noUsd: r.filter(x => x.amount_usd === null).length,
                noLkr: r.filter(x => x.amount_lkr === null).length,
            };
        };
        const invUsd = invoices.filter(i => i.currency === "USD").reduce((s, i) => s + i.amount, 0);
        const invOther = invoices.filter(i => i.currency !== "USD").length;
        return { customer: side("customer"), supplier: side("supplier"), invUsd, invOther };
    }, [rows, invoices]);

    const netUsd = totals.customer.usd - totals.supplier.usd;
    const netLkr = totals.customer.lkr - totals.supplier.lkr;

    const toggleExpand = (key: string) => {
        setExpandedIds(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleExportCashBookCsv = () => {
        const lines: string[][] = [
            [
                "Date",
                "Direction",
                "Tour Code",
                "Invoice / PO / Party",
                "Method",
                "Bank / Transaction Ref",
                "Currency",
                "Amount",
                "FX Rate",
                "USD Equivalent",
                "LKR Equivalent",
                "Notes / Refund Reason",
                "Underlying Line Items",
            ],
        ];

        for (const r of rows) {
            const dirLabel =
                r.kind === "customer"
                    ? "Received from Customer"
                    : r.kind === "expense"
                    ? "Misc Tour Expense"
                    : r.is_refund
                    ? "Supplier Refund"
                    : "Paid to Supplier";
            const lineSummary = (r.line_items || [])
                .map(li => `${li.description} (${li.currency} ${li.amount})`)
                .join(" | ");
            lines.push([
                (r.payment_date || "").slice(0, 10),
                dirLabel,
                r.tour_code || "",
                r.party || "",
                r.method || "",
                r.reference || "",
                r.currency,
                String(r.amount),
                String(r.exchange_rate ?? ""),
                r.amount_usd != null ? String(r.amount_usd) : "",
                r.amount_lkr != null ? String(r.amount_lkr) : "",
                r.notes || r.refund_reason || "",
                lineSummary,
            ]);
        }

        const csvContent = lines.map(row => row.map(csvEscape).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cash-book-vouchers-${tour.toLowerCase()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
                <div className="space-y-1">
                    <label htmlFor="cash-ledger-tour" className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Tour</label>
                    <select id="cash-ledger-tour" value={tour} onChange={e => setTour(e.target.value)} className="border border-[#E5E7EB] rounded-xl p-2 text-sm outline-none">
                        {tours.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label htmlFor="cash-ledger-direction" className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Direction</label>
                    <select id="cash-ledger-direction" value={direction} onChange={e => setDirection(e.target.value)} className="border border-[#E5E7EB] rounded-xl p-2 text-sm outline-none">
                        <option value="All">All Movements</option>
                        <option value="customer">Customer Receipts Only</option>
                        <option value="supplier">Supplier Payments Only</option>
                        <option value="expense">Misc Tour Expenses Only</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label htmlFor="cash-ledger-attachment" className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Bank Slip / Receipt</label>
                    <select id="cash-ledger-attachment" value={attachmentFilter} onChange={e => setAttachmentFilter(e.target.value)} className="border border-[#E5E7EB] rounded-xl p-2 text-sm outline-none">
                        <option value="All">All</option>
                        <option value="with">With Slip / Receipt</option>
                        <option value="missing">Missing Slip / Receipt</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label htmlFor="cash-ledger-from" className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Date From</label>
                    <input id="cash-ledger-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-[#E5E7EB] rounded-xl p-2 text-sm outline-none" />
                </div>
                <div className="space-y-1">
                    <label htmlFor="cash-ledger-to" className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Date To</label>
                    <input id="cash-ledger-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-[#E5E7EB] rounded-xl p-2 text-sm outline-none" />
                </div>
                <div className="space-y-1">
                    <label htmlFor="cash-ledger-search" className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Search</label>
                    <input
                        id="cash-ledger-search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Ref, party, method, item..."
                        className="w-52 border border-[#E5E7EB] rounded-xl p-2 text-sm outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
                </div>
                <div className="flex items-center gap-3 ml-auto pb-1">
                    <span className="text-xs text-[#6B7280]">{rows.length} payments &middot; {invoices.length} customer invoices</span>
                    <button
                        type="button"
                        onClick={handleExportCashBookCsv}
                        className="px-3.5 py-2 rounded-xl bg-[#2B2B2B] text-white text-xs font-semibold hover:bg-black shadow-sm print:hidden"
                    >
                        Export Cash Book CSV
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div id="cash-ledger-customer-total" className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-800 font-bold block">Collected from customers</span>
                    <span className="text-xl font-bold font-mono text-emerald-900 block mt-1">USD {fmt(totals.customer.usd)}</span>
                    <span className="text-sm font-bold font-mono text-emerald-800 block">LKR {fmt(totals.customer.lkr)}</span>
                    <span className="text-[10px] text-emerald-700 block mt-1">
                        Invoiced to customers: USD {fmt(totals.invUsd)}{totals.invOther > 0 ? ` (+${totals.invOther} non-USD invoice(s) not summed)` : ""}
                    </span>
                    <span className="text-[10px] text-emerald-700 block">Outstanding vs invoiced: USD {fmt(totals.invUsd - totals.customer.usd)}</span>
                </div>
                <div id="cash-ledger-supplier-total" className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
                    <span className="text-[10px] uppercase tracking-wider text-amber-800 font-bold block">Paid out: suppliers (net of refunds) + misc expenses</span>
                    <span className="text-xl font-bold font-mono text-amber-900 block mt-1">USD {fmt(totals.supplier.usd)}</span>
                    <span className="text-sm font-bold font-mono text-amber-800 block">LKR {fmt(totals.supplier.lkr)}</span>
                    <span className="text-[10px] text-amber-700 block mt-1">{totals.supplier.count} payments / expenses ({rows.filter(x => x.kind === "expense").length} misc)</span>
                </div>
                <div id="cash-ledger-net" className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
                    <span className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Net (collected &minus; paid)</span>
                    <span className={`text-xl font-bold font-mono block mt-1 ${netUsd >= 0 ? "text-emerald-800" : "text-red-700"}`}>USD {fmt(netUsd)}</span>
                    <span className={`text-sm font-bold font-mono block ${netLkr >= 0 ? "text-emerald-800" : "text-red-700"}`}>LKR {fmt(netLkr)}</span>
                    <span className="text-[10px] text-[#9CA3AF] block mt-1">
                        Only amounts convertible from saved currency/rate are summed. Not in USD: {totals.customer.noUsd} customer, {totals.supplier.noUsd} supplier. Not in LKR: {totals.customer.noLkr} customer, {totals.supplier.noLkr} supplier.
                    </span>
                </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full text-xs">
                    <thead className="bg-[#F5F3EF] text-[#6B7280] uppercase tracking-wider text-[10px]">
                        <tr>
                            <th className="p-3 text-left w-8"></th>
                            <th className="p-3 text-left">Date</th>
                            <th className="p-3 text-left">Direction</th>
                            <th className="p-3 text-left">Tour</th>
                            <th className="p-3 text-left">Invoice / PO</th>
                            <th className="p-3 text-left">Method / Ref</th>
                            <th className="p-3 text-right">Amount</th>
                            <th className="p-3 text-right">Rate</th>
                            <th className="p-3 text-right">USD</th>
                            <th className="p-3 text-right">LKR</th>
                            <th className="p-3 text-right print:hidden">Bank Slip &amp; Voucher</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && <tr><td colSpan={11} className="p-8 text-center text-[#9CA3AF]">No payments for this selection.</td></tr>}
                        {rows.map(r => {
                            const cust = r.kind === "customer";
                            const isExpense = r.kind === "expense";
                            const rowKey = `${r.kind}-${r.id}`;
                            const isOpen = !!expandedIds[rowKey];

                            return (
                                <React.Fragment key={rowKey}>
                                    <tr
                                        onClick={() => toggleExpand(rowKey)}
                                        className={`border-t cursor-pointer ${cust ? "bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-100 text-emerald-950" : "bg-amber-50/70 hover:bg-amber-100/70 border-amber-100 text-amber-950"}`}
                                    >
                                        <td className="p-3 font-mono text-[#6B7280]">{isOpen ? "▼" : "▶"}</td>
                                        <td className="p-3 whitespace-nowrap">{r.payment_date ? new Date(r.payment_date).toLocaleDateString() : dash}</td>
                                        <td className="p-3 font-bold whitespace-nowrap">{cust ? "Received" : isExpense ? "Misc expense" : r.is_refund ? "Supplier refund" : "Paid"}</td>
                                        <td className="p-3 font-mono">{r.tour_code || dash}</td>
                                        <td className="p-3">
                                            {r.party || dash}
                                            {(r.line_items?.length || 0) > 0 && (
                                                <span className="block text-[10px] opacity-75">
                                                    {r.line_items!.length} line item(s)
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">{r.method}{r.reference && <span className="block text-[10px] opacity-70 font-mono">{r.reference}</span>}</td>
                                        <td className="p-3 text-right font-mono whitespace-nowrap">{r.currency} {fmt(r.amount)}</td>
                                        <td className="p-3 text-right font-mono">{r.exchange_rate !== null && r.currency !== "LKR" || (cust && r.currency === "LKR" && r.exchange_rate !== null) ? r.exchange_rate : dash}</td>
                                        <td className="p-3 text-right font-mono">{r.amount_usd === null ? dash : fmt(r.amount_usd)}</td>
                                        <td className="p-3 text-right font-mono">{r.amount_lkr === null ? dash : fmt(r.amount_lkr)}</td>
                                        <td className="p-3 text-right whitespace-nowrap space-x-1 print:hidden" onClick={e => e.stopPropagation()}>
                                            {r.attachment_url ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => viewStoredAttachment(r.attachment_url)}
                                                        className="px-2 py-1 rounded bg-white/90 border border-current text-[10px] font-semibold hover:bg-white"
                                                    >
                                                        View Slip ↗
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => downloadStoredAttachment(r.attachment_url, `Bank_Slip_${r.tour_code || "Tour"}_${r.reference || r.id.slice(0, 6)}`)}
                                                        className="px-2 py-1 rounded bg-emerald-800 text-white text-[10px] font-semibold hover:bg-emerald-950"
                                                    >
                                                        Download Slip ↓
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-[10px] opacity-60">No Slip</span>
                                            )}
                                        </td>
                                    </tr>

                                    {isOpen && (
                                        <tr className="bg-[#FAF9F6] border-t border-[#E5E7EB]">
                                            <td colSpan={11} className="p-4">
                                                <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 space-y-2">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <span className="text-[10px] uppercase tracking-wider font-bold text-[#6B7280]">
                                                            Underlying Invoice / PO / Expense Line Items ({(r.line_items || []).length})
                                                        </span>
                                                        {(r.notes || r.refund_reason) && (
                                                            <span className="text-xs text-[#4B5563]">
                                                                Note / Reason: <strong>{r.notes || r.refund_reason}</strong>
                                                            </span>
                                                        )}
                                                    </div>
                                                    {(r.line_items || []).length > 0 ? (
                                                        <table className="w-full text-xs">
                                                            <thead className="bg-[#F5F3EF] text-[#6B7280] uppercase text-[9px]">
                                                                <tr>
                                                                    <th className="p-1.5 text-left">#</th>
                                                                    <th className="p-1.5 text-left">Description</th>
                                                                    <th className="p-1.5 text-right">Qty</th>
                                                                    <th className="p-1.5 text-right">Amount</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-[#F3F4F6]">
                                                                {r.line_items!.map((li, idx) => (
                                                                    <tr key={idx}>
                                                                        <td className="p-1.5 font-mono text-[#6B7280]">{idx + 1}</td>
                                                                        <td className="p-1.5">{li.description}</td>
                                                                        <td className="p-1.5 text-right font-mono">{li.quantity ?? 1}</td>
                                                                        <td className="p-1.5 text-right font-mono">{li.currency} {fmt(li.amount)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        <p className="text-xs text-[#9CA3AF]">No itemized lines attached to this payment record.</p>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                    <tfoot className="font-bold font-mono">
                        <tr className="bg-emerald-100 text-emerald-900 border-t-2 border-emerald-300">
                            <td colSpan={8} className="p-3 text-right font-sans uppercase tracking-wider text-[10px]">Total received from customers</td>
                            <td className="p-3 text-right">{fmt(totals.customer.usd)}</td>
                            <td className="p-3 text-right">{fmt(totals.customer.lkr)}</td>
                            <td className="print:hidden"></td>
                        </tr>
                        <tr className="bg-amber-100 text-amber-900 border-t border-amber-300">
                            <td colSpan={8} className="p-3 text-right font-sans uppercase tracking-wider text-[10px]">Total paid to suppliers + misc expenses</td>
                            <td className="p-3 text-right">{fmt(totals.supplier.usd)}</td>
                            <td className="p-3 text-right">{fmt(totals.supplier.lkr)}</td>
                            <td className="print:hidden"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <AccountingDocumentModal doc={modalDoc} onClose={() => setModalDoc(null)} />
        </div>
    );
}
