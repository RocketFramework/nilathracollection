"use client";

import React, { useMemo, useState } from "react";
import { FinancePoReportRowDTO } from "@/dtos/finance-report.dto";
import AccountingDocumentModal, { AccountingDocModalData } from "./AccountingDocumentModal";

const lkr = (v: number | null | undefined) =>
    v === null || v === undefined ? (
        <span className="text-[#9CA3AF]">&mdash;</span>
    ) : (
        v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );

const sum = (rows: FinancePoReportRowDTO[], pick: (r: FinancePoReportRowDTO) => number | null) =>
    rows.reduce((s, r) => s + (pick(r) ?? 0), 0);

const fmt = (n: number | null | undefined) =>
    n === null || n === undefined
        ? "—"
        : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

export default function FinancialReportTable({
    rows,
    errorMessage,
}: {
    rows: FinancePoReportRowDTO[];
    errorMessage: string | null;
}) {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("All");
    const [vendorType, setVendorType] = useState("All");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [onlyOutstanding, setOnlyOutstanding] = useState(false);
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
    const [modalDoc, setModalDoc] = useState<AccountingDocModalData | null>(null);

    const statuses = useMemo(
        () => ["All", ...Array.from(new Set(rows.map(r => r.po_status).filter(Boolean) as string[]))],
        [rows]
    );
    const vendorTypes = useMemo(
        () => ["All", ...Array.from(new Set(rows.map(r => r.vendor_type).filter(Boolean) as string[]))],
        [rows]
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter(r => {
            if (status !== "All" && r.po_status !== status) return false;
            if (vendorType !== "All" && r.vendor_type !== vendorType) return false;
            if (onlyOutstanding && !((r.invoice_balance_lkr ?? 0) > 0.01)) return false;
            const dStr = (r.po_date || "").slice(0, 10);
            if (dateFrom && dStr < dateFrom) return false;
            if (dateTo && dStr > dateTo) return false;
            if (!q) return true;
            return [
                r.po_number,
                r.vendor_name,
                r.tour_code,
                r.invoice_numbers,
                ...(r.items || []).map(it => it.description),
            ].some(v => (v || "").toLowerCase().includes(q));
        });
    }, [rows, search, status, vendorType, dateFrom, dateTo, onlyOutstanding]);

    const missingPoLkr = filtered.filter(r => r.po_value_lkr === null).length;

    const cards = [
        {
            id: "po",
            label: "PO Value (LKR)",
            value: fmt(sum(filtered, r => r.po_value_lkr)),
            note: missingPoLkr > 0 ? `${missingPoLkr} PO(s) without agreed LKR excluded` : "At agreed PO rates",
        },
        {
            id: "invoiced",
            label: "Invoiced (LKR)",
            value: fmt(sum(filtered, r => r.invoiced_lkr)),
            note: "At invoice rates",
        },
        {
            id: "paid",
            label: "Paid, net of refunds (LKR)",
            value: fmt(sum(filtered, r => r.paid_lkr_net)),
            note: "At each payment's rate",
        },
        {
            id: "refunded",
            label: "Refunded (LKR)",
            value: fmt(Math.abs(sum(filtered, r => r.refunded_lkr))),
            note: "Included in Paid above",
        },
        {
            id: "balance",
            label: "Invoice Balance (LKR)",
            value: fmt(sum(filtered, r => r.invoice_balance_lkr)),
            note: "Invoiced minus paid",
        },
    ];

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const expandAll = () => {
        const allOpen = filtered.length > 0 && filtered.every(r => expandedIds[r.purchase_order_id]);
        if (allOpen) {
            setExpandedIds({});
        } else {
            const next: Record<string, boolean> = {};
            filtered.forEach(r => {
                next[r.purchase_order_id] = true;
            });
            setExpandedIds(next);
        }
    };

    const handleExportPurchaseCsv = () => {
        const lines: string[][] = [
            [
                "PO Number",
                "PO Date",
                "Tour Code",
                "Vendor Name",
                "Vendor Type",
                "PO Status",
                "PO Currency",
                "PO FX Rate",
                "PO Total (Own CCY)",
                "PO Total (LKR)",
                "Line Day",
                "Line Service Date",
                "Line Item Description",
                "Line Qty",
                "Line Unit Price",
                "Line Total",
                "Line Total (LKR)",
                "Supplier Invoices",
                "Invoiced (LKR)",
                "Paid Net (LKR)",
                "Refunded (LKR)",
                "Balance (LKR)",
                "Signed PO URL",
            ],
        ];

        for (const r of filtered) {
            const items =
                r.items && r.items.length > 0
                    ? r.items
                    : [
                          {
                              id: "",
                              purchase_order_id: r.purchase_order_id,
                              day_number: null,
                              service_date: r.po_date,
                              description: "PO Header Summary",
                              quantity: 1,
                              unit_price: r.po_value_own_ccy,
                              total_price: r.po_value_own_ccy,
                              fx_rate: r.po_rate_used,
                              unit_price_lkr: r.po_value_lkr,
                              total_price_lkr: r.po_value_lkr,
                              service_details: null,
                              special_notes: null,
                          },
                      ];
            items.forEach((it, idx) => {
                lines.push([
                    r.po_number,
                    (r.po_date || "").slice(0, 10),
                    r.tour_code || "",
                    r.vendor_name || "",
                    r.vendor_type || "",
                    r.po_status || "",
                    r.po_currency || "",
                    String(r.po_rate_used ?? ""),
                    idx === 0 ? String(r.po_value_own_ccy ?? "") : "",
                    idx === 0 ? String(r.po_value_lkr ?? "") : "",
                    it.day_number != null ? String(it.day_number) : "",
                    (it.service_date || "").slice(0, 10),
                    it.description,
                    String(it.quantity),
                    String(it.unit_price ?? ""),
                    String(it.total_price ?? ""),
                    String(it.total_price_lkr ?? ""),
                    idx === 0 ? (r.invoice_numbers || "") : "",
                    idx === 0 ? String(r.invoiced_lkr ?? "") : "",
                    idx === 0 ? String(r.paid_lkr_net ?? "") : "",
                    idx === 0 ? String(r.refunded_lkr ?? "") : "",
                    idx === 0 ? String(r.invoice_balance_lkr ?? "") : "",
                    idx === 0 ? (r.signed_document_url || "") : "",
                ]);
            });
        }

        const csvContent = lines.map(r => r.map(csvEscape).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `purchase-register-pos-and-bills.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-playfair text-[#2B2B2B]">
                        Purchase Register &mdash; Purchase Orders, Supplier Bills &amp; Payment Vouchers
                    </h2>
                    <p className="text-sm text-[#6B7280] mt-1">
                        One row per PO from <span className="font-mono">v_finance_po_report</span>. Click any PO row (<span className="font-mono">▶</span>) to inspect every PO line item, uploaded supplier bill copy, and payment voucher.
                    </p>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                    <button
                        type="button"
                        onClick={expandAll}
                        className="px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-[#2B2B2B] hover:bg-[#FAF9F6] shadow-sm"
                    >
                        {filtered.length > 0 && filtered.every(r => expandedIds[r.purchase_order_id])
                            ? "Collapse All Details"
                            : "Expand All Line Items & Bills"}
                    </button>
                    <button
                        type="button"
                        onClick={handleExportPurchaseCsv}
                        className="px-4 py-2 rounded-xl bg-[#2B2B2B] text-white text-xs font-semibold hover:bg-black shadow-sm"
                    >
                        Export Purchase Register CSV (with Line Items)
                    </button>
                </div>
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
                    <input
                        id="finance-report-search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="PO, vendor, tour, invoice, line item"
                        className="w-64 border border-[#E5E7EB] rounded-xl p-2 text-sm outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    />
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
                <div className="space-y-1">
                    <label htmlFor="finance-report-date-from" className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">PO Date From</label>
                    <input id="finance-report-date-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-[#E5E7EB] rounded-xl p-2 text-sm outline-none" />
                </div>
                <div className="space-y-1">
                    <label htmlFor="finance-report-date-to" className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">PO Date To</label>
                    <input id="finance-report-date-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-[#E5E7EB] rounded-xl p-2 text-sm outline-none" />
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
                            <th className="p-3 text-left w-8"></th>
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
                            <th className="p-3 text-right print:hidden">Docs / Copy</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                        {filtered.length === 0 && (
                            <tr><td colSpan={15} className="p-8 text-center text-[#9CA3AF]">No purchase orders match the current filters.</td></tr>
                        )}
                        {filtered.map(r => {
                            const gap = r.invoice_vs_po_gap_lkr;
                            const gapBad = gap !== null && Math.abs(gap) > 0.01;
                            const isOpen = !!expandedIds[r.purchase_order_id];
                            const billCopiesCount = (r.supplier_invoices || []).filter(i => !!i.attachment_url).length;
                            const slipCount = (r.supplier_payments || []).filter(p => !!p.attachment_url).length;

                            return (
                                <React.Fragment key={r.purchase_order_id}>
                                    <tr
                                        className="hover:bg-[#FAF9F6] cursor-pointer"
                                        onClick={() => toggleExpand(r.purchase_order_id)}
                                    >
                                        <td className="p-3 font-mono text-[#6B7280]">{isOpen ? "▼" : "▶"}</td>
                                        <td className="p-3 font-mono font-bold text-[#2B2B2B] whitespace-nowrap">
                                            {r.po_number}
                                            {r.po_date && <span className="block text-[10px] font-normal text-[#9CA3AF]">{new Date(r.po_date).toLocaleDateString()}</span>}
                                            <span className="block text-[10px] font-normal text-[#6B7280]">
                                                {(r.items || []).length} line(s)
                                            </span>
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
                                                    <span className="block text-[10px] text-[#9CA3AF]">
                                                        {r.invoice_currencies}{r.invoice_rates_used ? ` @ ${r.invoice_rates_used}` : ""}
                                                        {billCopiesCount > 0 ? ` · ${billCopiesCount} bill scan(s)` : ""}
                                                    </span>
                                                </>
                                            ) : <span className="text-[#9CA3AF]">No invoice</span>}
                                        </td>
                                        <td className="p-3 text-right font-mono">{lkr(r.invoiced_lkr)}</td>
                                        <td className={`p-3 text-right font-mono ${gapBad ? "text-red-600 font-bold" : ""}`}>{lkr(gap)}</td>
                                        <td className="p-3 text-right font-mono">{lkr(r.paid_lkr_net)}</td>
                                        <td className="p-3 text-right font-mono text-amber-700">{lkr(r.refunded_lkr)}</td>
                                        <td className="p-3 text-right font-mono font-bold">{lkr(r.invoice_balance_lkr)}</td>
                                        <td className="p-3 whitespace-nowrap">{r.last_payment_date ? new Date(r.last_payment_date).toLocaleDateString() : <span className="text-[#9CA3AF]">&mdash;</span>}</td>
                                        <td className="p-3 text-right whitespace-nowrap space-x-1.5 print:hidden" onClick={e => e.stopPropagation()}>
                                            {r.signed_document_url && (
                                                <a
                                                    href={r.signed_document_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold inline-block"
                                                >
                                                    Signed PO ↗
                                                </a>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setModalDoc({ type: "purchase_order", po: r })}
                                                className="px-2.5 py-1 rounded-lg bg-[#2B2B2B] text-white text-[11px] font-semibold hover:bg-black"
                                            >
                                                PO Copy
                                            </button>
                                            {slipCount > 0 && (
                                                <span className="block text-[10px] text-emerald-700 mt-0.5">{slipCount} slip(s)</span>
                                            )}
                                        </td>
                                    </tr>

                                    {isOpen && (
                                        <tr className="bg-[#FAF9F6]">
                                            <td colSpan={15} className="p-5 border-t border-[#E5E7EB]">
                                                <div className="space-y-4">
                                                    {/* 1. PO Line Items */}
                                                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h5 className="text-[10px] uppercase tracking-wider font-bold text-[#6B7280]">
                                                                1. Purchase Order Line Items ({(r.items || []).length})
                                                            </h5>
                                                            <span className="text-[11px] text-[#6B7280]">
                                                                {[r.vendor_email, r.vendor_phone, r.payment_terms && `Terms: ${r.payment_terms}`].filter(Boolean).join(" · ")}
                                                            </span>
                                                        </div>
                                                        <table className="w-full text-xs">
                                                            <thead className="bg-[#F5F3EF] text-[#6B7280] uppercase text-[9px]">
                                                                <tr>
                                                                    <th className="p-1.5 text-left">Day / Date</th>
                                                                    <th className="p-1.5 text-left">Description &amp; Service Details</th>
                                                                    <th className="p-1.5 text-right">Qty</th>
                                                                    <th className="p-1.5 text-right">Unit ({r.po_currency})</th>
                                                                    <th className="p-1.5 text-right">Total ({r.po_currency})</th>
                                                                    <th className="p-1.5 text-right">FX Rate</th>
                                                                    <th className="p-1.5 text-right">Total (LKR)</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-[#F3F4F6]">
                                                                {(r.items || []).map(it => (
                                                                    <tr key={it.id}>
                                                                        <td className="p-1.5 font-mono whitespace-nowrap">
                                                                            {it.day_number != null ? `Day ${it.day_number}` : ""}
                                                                            {it.service_date && <span className="block text-[10px] text-[#6B7280]">{fmtDate(it.service_date)}</span>}
                                                                        </td>
                                                                        <td className="p-1.5">
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
                                                                        <td className="p-1.5 text-right font-mono">{it.quantity}</td>
                                                                        <td className="p-1.5 text-right font-mono">{fmt(it.unit_price)}</td>
                                                                        <td className="p-1.5 text-right font-mono">{fmt(it.total_price)}</td>
                                                                        <td className="p-1.5 text-right font-mono">{it.fx_rate ?? "—"}</td>
                                                                        <td className="p-1.5 text-right font-mono">{fmt(it.total_price_lkr)}</td>
                                                                    </tr>
                                                                ))}
                                                                {(!r.items || r.items.length === 0) && (
                                                                    <tr>
                                                                        <td colSpan={7} className="p-3 text-center text-[#9CA3AF]">No line items saved on this PO.</td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* 2. Supplier Invoices & Payment Vouchers Side-by-Side */}
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                        {/* Supplier Invoices */}
                                                        <div className="bg-white border border-blue-200 rounded-xl p-3">
                                                            <h5 className="text-[10px] uppercase tracking-wider font-bold text-blue-900 mb-2">
                                                                2. Supplier Invoices / Tax Bills ({(r.supplier_invoices || []).length})
                                                            </h5>
                                                            <table className="w-full text-xs">
                                                                <thead className="bg-blue-50 text-blue-900 uppercase text-[9px]">
                                                                    <tr>
                                                                        <th className="p-1.5 text-left">Invoice # / Date</th>
                                                                        <th className="p-1.5 text-left">Status</th>
                                                                        <th className="p-1.5 text-right">Amount</th>
                                                                        <th className="p-1.5 text-right">LKR</th>
                                                                        <th className="p-1.5 text-right print:hidden">Bill Copy</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-blue-100">
                                                                    {(r.supplier_invoices || []).map(sinv => (
                                                                        <React.Fragment key={sinv.id}>
                                                                            <tr>
                                                                                <td className="p-1.5 font-mono font-bold">
                                                                                    {sinv.invoice_number}
                                                                                    <span className="block text-[10px] font-normal text-[#6B7280]">
                                                                                        {fmtDate(sinv.invoice_date)} · {sinv.invoice_type || "Final"}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="p-1.5">{sinv.status}</td>
                                                                                <td className="p-1.5 text-right font-mono">
                                                                                    {sinv.currency} {fmt(sinv.amount)}
                                                                                    {sinv.exchange_rate && sinv.currency !== "LKR" && (
                                                                                        <span className="block text-[9px] text-[#6B7280]">@ {sinv.exchange_rate}</span>
                                                                                    )}
                                                                                </td>
                                                                                <td className="p-1.5 text-right font-mono">{fmt(sinv.amount_lkr)}</td>
                                                                                <td className="p-1.5 text-right space-x-1.5 print:hidden">
                                                                                    {sinv.attachment_url && (
                                                                                        <a
                                                                                            href={sinv.attachment_url}
                                                                                            target="_blank"
                                                                                            rel="noreferrer"
                                                                                            className="text-blue-700 underline font-semibold"
                                                                                        >
                                                                                            Bill Scan ↗
                                                                                        </a>
                                                                                    )}
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => setModalDoc({ type: "supplier_invoice", invoice: sinv, po: r })}
                                                                                        className="px-2 py-0.5 rounded border border-blue-300 text-blue-900 text-[10px] font-semibold"
                                                                                    >
                                                                                        View Bill
                                                                                    </button>
                                                                                </td>
                                                                            </tr>
                                                                            {sinv.items && sinv.items.length > 0 && (
                                                                                <tr className="bg-blue-50/30">
                                                                                    <td colSpan={5} className="p-2">
                                                                                        <div className="text-[10px] font-semibold text-blue-900 mb-1">Bill Line Items:</div>
                                                                                        {sinv.items.map(sit => (
                                                                                            <div key={sit.id} className="flex justify-between text-[11px] font-mono text-[#4B5563]">
                                                                                                <span className="font-sans">{sit.description} (x{sit.quantity})</span>
                                                                                                <span>{sinv.currency} {fmt(sit.total_price)}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </td>
                                                                                </tr>
                                                                            )}
                                                                        </React.Fragment>
                                                                    ))}
                                                                    {(!r.supplier_invoices || r.supplier_invoices.length === 0) && (
                                                                        <tr>
                                                                            <td colSpan={5} className="p-3 text-center text-[#9CA3AF]">No supplier invoices recorded.</td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        {/* Supplier Payments */}
                                                        <div className="bg-white border border-amber-200 rounded-xl p-3">
                                                            <h5 className="text-[10px] uppercase tracking-wider font-bold text-amber-900 mb-2">
                                                                3. Supplier Payment &amp; Refund Vouchers ({(r.supplier_payments || []).length})
                                                            </h5>
                                                            <table className="w-full text-xs">
                                                                <thead className="bg-amber-50 text-amber-900 uppercase text-[9px]">
                                                                    <tr>
                                                                        <th className="p-1.5 text-left">Date / Type</th>
                                                                        <th className="p-1.5 text-left">Method / Ref</th>
                                                                        <th className="p-1.5 text-right">Amount</th>
                                                                        <th className="p-1.5 text-right">LKR</th>
                                                                        <th className="p-1.5 text-right print:hidden">Slip / Voucher</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-amber-100">
                                                                    {(r.supplier_payments || []).map(spay => (
                                                                        <tr key={spay.id}>
                                                                            <td className="p-1.5">
                                                                                {fmtDate(spay.payment_date)}
                                                                                <span className={`block text-[10px] font-bold ${spay.is_refund ? "text-red-700" : "text-amber-900"}`}>
                                                                                    {spay.is_refund ? "Refund" : "Payment"}
                                                                                </span>
                                                                            </td>
                                                                            <td className="p-1.5">
                                                                                {spay.payment_method || "—"}
                                                                                {spay.payment_reference && <span className="block text-[10px] font-mono text-[#6B7280]">{spay.payment_reference}</span>}
                                                                            </td>
                                                                            <td className="p-1.5 text-right font-mono">{spay.currency} {fmt(spay.amount)}</td>
                                                                            <td className="p-1.5 text-right font-mono">{fmt(spay.amount_lkr)}</td>
                                                                            <td className="p-1.5 text-right space-x-1.5 print:hidden">
                                                                                {spay.attachment_url && (
                                                                                    <a
                                                                                        href={spay.attachment_url}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        className="text-amber-800 underline font-semibold"
                                                                                    >
                                                                                        Slip ↗
                                                                                    </a>
                                                                                )}
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setModalDoc({ type: "supplier_payment", payment: spay, po: r })}
                                                                                    className="px-2 py-0.5 rounded border border-amber-300 text-amber-950 text-[10px] font-semibold"
                                                                                >
                                                                                    Voucher
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                    {(!r.supplier_payments || r.supplier_payments.length === 0) && (
                                                                        <tr>
                                                                            <td colSpan={5} className="p-3 text-center text-[#9CA3AF]">No supplier payments recorded.</td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
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
