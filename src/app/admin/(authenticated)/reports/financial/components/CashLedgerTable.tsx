"use client";

import { useMemo, useState } from "react";
import { FinanceLedgerDTO } from "@/dtos/finance-report.dto";

const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dash = <span className="text-[#9CA3AF]">&mdash;</span>;

export default function CashLedgerTable({ ledger }: { ledger: FinanceLedgerDTO }) {
    const [tour, setTour] = useState("All");

    const tours = useMemo(() => {
        const codes = new Set<string>();
        ledger.rows.forEach(r => r.tour_code && codes.add(r.tour_code));
        ledger.invoices.forEach(i => i.tour_code && codes.add(i.tour_code));
        return ["All", ...Array.from(codes).sort()];
    }, [ledger]);

    const rows = useMemo(() => ledger.rows.filter(r => tour === "All" || r.tour_code === tour), [ledger, tour]);
    const invoices = useMemo(
        () => ledger.invoices.filter(i => i.status !== "Cancelled" && (tour === "All" || i.tour_code === tour)),
        [ledger, tour]
    );

    const totals = useMemo(() => {
        const side = (kind: "customer" | "supplier") => {
            // "supplier" side = money paid out: supplier payments plus miscellaneous tour expenses
            const r = rows.filter(x => kind === "customer" ? x.kind === "customer" : x.kind !== "customer");
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

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
                <div className="space-y-1">
                    <label htmlFor="cash-ledger-tour" className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Tour</label>
                    <select id="cash-ledger-tour" value={tour} onChange={e => setTour(e.target.value)} className="border border-[#E5E7EB] rounded-xl p-2 text-sm outline-none">
                        {tours.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <span className="text-xs text-[#6B7280] pb-2">{rows.length} payments &middot; {invoices.length} customer invoices</span>
                <div className="flex items-center gap-4 text-xs ml-auto pb-2">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-400" /> Received from customers</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-200 border border-amber-400" /> Paid to suppliers &amp; misc expenses</span>
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
                            <th className="p-3 text-left">Date</th>
                            <th className="p-3 text-left">Direction</th>
                            <th className="p-3 text-left">Tour</th>
                            <th className="p-3 text-left">Invoice / PO</th>
                            <th className="p-3 text-left">Method / Ref</th>
                            <th className="p-3 text-right">Amount</th>
                            <th className="p-3 text-right">Rate</th>
                            <th className="p-3 text-right">USD</th>
                            <th className="p-3 text-right">LKR</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-[#9CA3AF]">No payments for this selection.</td></tr>}
                        {rows.map(r => {
                            const cust = r.kind === "customer";
                            const isExpense = r.kind === "expense";
                            return (
                                <tr key={`${r.kind}-${r.id}`} className={`border-t ${cust ? "bg-emerald-50/70 border-emerald-100 text-emerald-950" : "bg-amber-50/70 border-amber-100 text-amber-950"}`}>
                                    <td className="p-3 whitespace-nowrap">{r.payment_date ? new Date(r.payment_date).toLocaleDateString() : dash}</td>
                                    <td className="p-3 font-bold whitespace-nowrap">{cust ? "Received" : isExpense ? "Misc expense" : r.is_refund ? "Supplier refund" : "Paid"}</td>
                                    <td className="p-3 font-mono">{r.tour_code || dash}</td>
                                    <td className="p-3">{r.party || dash}</td>
                                    <td className="p-3">{r.method}{r.reference && <span className="block text-[10px] opacity-70 font-mono">{r.reference}</span>}</td>
                                    <td className="p-3 text-right font-mono whitespace-nowrap">{r.currency} {fmt(r.amount)}</td>
                                    <td className="p-3 text-right font-mono">{r.exchange_rate !== null && r.currency !== "LKR" || (cust && r.currency === "LKR" && r.exchange_rate !== null) ? r.exchange_rate : dash}</td>
                                    <td className="p-3 text-right font-mono">{r.amount_usd === null ? dash : fmt(r.amount_usd)}</td>
                                    <td className="p-3 text-right font-mono">{r.amount_lkr === null ? dash : fmt(r.amount_lkr)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="font-bold font-mono">
                        <tr className="bg-emerald-100 text-emerald-900 border-t-2 border-emerald-300">
                            <td colSpan={7} className="p-3 text-right font-sans uppercase tracking-wider text-[10px]">Total received from customers</td>
                            <td className="p-3 text-right">{fmt(totals.customer.usd)}</td>
                            <td className="p-3 text-right">{fmt(totals.customer.lkr)}</td>
                        </tr>
                        <tr className="bg-amber-100 text-amber-900 border-t border-amber-300">
                            <td colSpan={7} className="p-3 text-right font-sans uppercase tracking-wider text-[10px]">Total paid to suppliers + misc expenses</td>
                            <td className="p-3 text-right">{fmt(totals.supplier.usd)}</td>
                            <td className="p-3 text-right">{fmt(totals.supplier.lkr)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
