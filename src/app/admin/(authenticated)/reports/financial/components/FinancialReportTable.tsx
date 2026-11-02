"use client";

import { useMemo, useState } from "react";
import { FinancePoReportRowDTO } from "@/dtos/finance-report.dto";

const lkr = (v: number | null) =>
    v === null ? <span className="text-[#9CA3AF]">&mdash;</span> : v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const sum = (rows: FinancePoReportRowDTO[], pick: (r: FinancePoReportRowDTO) => number | null) =>
    rows.reduce((s, r) => s + (pick(r) ?? 0), 0);

const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function FinancialReportTable({ rows, errorMessage }: { rows: FinancePoReportRowDTO[]; errorMessage: string | null }) {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("All");
    const [vendorType, setVendorType] = useState("All");
    const [onlyOutstanding, setOnlyOutstanding] = useState(false);

    const statuses = useMemo(() => ["All", ...Array.from(new Set(rows.map(r => r.po_status).filter(Boolean) as string[]))], [rows]);
    const vendorTypes = useMemo(() => ["All", ...Array.from(new Set(rows.map(r => r.vendor_type).filter(Boolean) as string[]))], [rows]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter(r => {
            if (status !== "All" && r.po_status !== status) return false;
            if (vendorType !== "All" && r.vendor_type !== vendorType) return false;
            if (onlyOutstanding && !((r.invoice_balance_lkr ?? 0) > 0.01)) return false;
            if (!q) return true;
            return [r.po_number, r.vendor_name, r.tour_code, r.invoice_numbers].some(v => (v || "").toLowerCase().includes(q));
        });
    }, [rows, search, status, vendorType, onlyOutstanding]);

    const missingPoLkr = filtered.filter(r => r.po_value_lkr === null).length;

    const cards = [
        { id: "po", label: "PO Value (LKR)", value: fmt(sum(filtered, r => r.po_value_lkr)), note: missingPoLkr > 0 ? `${missingPoLkr} PO(s) without agreed LKR excluded` : "At agreed PO rates" },
        { id: "invoiced", label: "Invoiced (LKR)", value: fmt(sum(filtered, r => r.invoiced_lkr)), note: "At invoice rates" },
        { id: "paid", label: "Paid, net of refunds (LKR)", value: fmt(sum(filtered, r => r.paid_lkr_net)), note: "At each payment's rate" },
        { id: "refunded", label: "Refunded (LKR)", value: fmt(Math.abs(sum(filtered, r => r.refunded_lkr))), note: "Included in Paid above" },
        { id: "balance", label: "Invoice Balance (LKR)", value: fmt(sum(filtered, r => r.invoice_balance_lkr)), note: "Invoiced minus paid" },
    ];

    return (
        <div className="p-8 space-y-6">
            <div>
                <h2 className="text-2xl font-bold font-playfair text-[#2B2B2B]">Financial Report &mdash; Purchase Orders</h2>
                <p className="text-sm text-[#6B7280] mt-1">
                    One row per PO from <span className="font-mono">v_finance_po_report</span>. LKR values use the rate saved on the PO, invoice and each payment. A dash means the value is not available.
                </p>
            </div>

            {errorMessage && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{errorMessage}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                {cards.map(c => (
                    <div key={c.id} id={`finance-report-card-${c.id}`} className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
                        <span className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">{c.label}</span>
                        <span className="text-xl font-bold font-mono text-[#2B2B2B] block mt-1">{c.value}</span>
                        <span className="text-[10px] text-[#9CA3AF] block mt-1">{c.note}</span>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap items-end gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
                <div className="space-y-1">
                    <label htmlFor="finance-report-search" className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Search</label>
                    <input id="finance-report-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="PO, vendor, tour code, invoice"
                        className="w-64 border border-[#E5E7EB] rounded-xl p-2 text-sm outline-none focus:ring-1 focus:ring-[#D4AF37]" />
                </div>
                <div className="space-y-1">
                    <label htmlFor="finance-report-status" className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">PO Status</label>
                    <select id="finance-report-status" value={status} onChange={e => setStatus(e.target.value)} className="border border-[#E5E7EB] rounded-xl p-2 text-sm outline-none">
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label htmlFor="finance-report-vendor-type" className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Vendor Type</label>
                    <select id="finance-report-vendor-type" value={vendorType} onChange={e => setVendorType(e.target.value)} className="border border-[#E5E7EB] rounded-xl p-2 text-sm outline-none">
                        {vendorTypes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-[#4B5563] cursor-pointer pb-2">
                    <input id="finance-report-outstanding" type="checkbox" checked={onlyOutstanding} onChange={e => setOnlyOutstanding(e.target.checked)} />
                    Only with outstanding balance
                </label>
                <span className="text-xs text-[#6B7280] ml-auto pb-2">{filtered.length} of {rows.length} POs</span>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full text-xs">
                    <thead className="bg-[#F5F3EF] text-[#6B7280] uppercase tracking-wider text-[10px]">
                        <tr>
                            <th className="p-3 text-left">PO</th>
                            <th className="p-3 text-left">Tour</th>
                            <th className="p-3 text-left">Vendor</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-right">PO Value</th>
                            <th className="p-3 text-right">PO Value (LKR)</th>
                            <th className="p-3 text-left">Invoices</th>
                            <th className="p-3 text-right">Invoiced (LKR)</th>
                            <th className="p-3 text-right">Invoice vs PO (LKR)</th>
                            <th className="p-3 text-right">Paid net (LKR)</th>
                            <th className="p-3 text-right">Refunded (LKR)</th>
                            <th className="p-3 text-right">Balance (LKR)</th>
                            <th className="p-3 text-left">Last Payment</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                        {filtered.length === 0 && (
                            <tr><td colSpan={13} className="p-8 text-center text-[#9CA3AF]">No purchase orders match the current filters.</td></tr>
                        )}
                        {filtered.map(r => {
                            const gap = r.invoice_vs_po_gap_lkr;
                            const gapBad = gap !== null && Math.abs(gap) > 0.01;
                            return (
                                <tr key={r.purchase_order_id} className="hover:bg-[#FAF9F6]">
                                    <td className="p-3 font-mono font-bold text-[#2B2B2B] whitespace-nowrap">
                                        {r.po_number}
                                        {r.po_date && <span className="block text-[10px] font-normal text-[#9CA3AF]">{new Date(r.po_date).toLocaleDateString()}</span>}
                                    </td>
                                    <td className="p-3 font-mono">{r.tour_code || <span className="text-[#9CA3AF]">&mdash;</span>}</td>
                                    <td className="p-3">
                                        {r.vendor_name}
                                        <span className="block text-[10px] text-[#9CA3AF]">{r.vendor_type}</span>
                                    </td>
                                    <td className="p-3">{r.po_status}</td>
                                    <td className="p-3 text-right font-mono whitespace-nowrap">
                                        {r.po_value_own_ccy === null ? "—" : `${r.po_currency || ""} ${fmt(r.po_value_own_ccy)}`}
                                    </td>
                                    <td className="p-3 text-right font-mono">
                                        {lkr(r.po_value_lkr)}
                                        {r.po_rate_used !== null && r.po_currency !== "LKR" && <span className="block text-[10px] text-[#9CA3AF]">@ {r.po_rate_used}</span>}
                                    </td>
                                    <td className="p-3">
                                        {r.invoice_count > 0 ? (
                                            <>
                                                <span className="font-mono">{r.invoice_numbers}</span>
                                                <span className="block text-[10px] text-[#9CA3AF]">{r.invoice_currencies}{r.invoice_rates_used ? ` @ ${r.invoice_rates_used}` : ""}</span>
                                            </>
                                        ) : <span className="text-[#9CA3AF]">No invoice</span>}
                                    </td>
                                    <td className="p-3 text-right font-mono">{lkr(r.invoiced_lkr)}</td>
                                    <td className={`p-3 text-right font-mono ${gapBad ? "text-red-600 font-bold" : ""}`}>{lkr(gap)}</td>
                                    <td className="p-3 text-right font-mono">{lkr(r.paid_lkr_net)}</td>
                                    <td className="p-3 text-right font-mono text-amber-700">{lkr(r.refunded_lkr)}</td>
                                    <td className="p-3 text-right font-mono font-bold">{lkr(r.invoice_balance_lkr)}</td>
                                    <td className="p-3 whitespace-nowrap">{r.last_payment_date ? new Date(r.last_payment_date).toLocaleDateString() : <span className="text-[#9CA3AF]">&mdash;</span>}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
