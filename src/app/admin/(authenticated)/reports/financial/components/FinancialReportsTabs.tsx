"use client";

import { useState } from "react";
import { FinanceLedgerDTO, FinancePoReportRowDTO } from "@/dtos/finance-report.dto";
import FinancialReportTable from "./FinancialReportTable";
import CashLedgerTable from "./CashLedgerTable";

export default function FinancialReportsTabs({ rows, ledger, errorMessage }: { rows: FinancePoReportRowDTO[]; ledger: FinanceLedgerDTO; errorMessage: string | null }) {
    const [tab, setTab] = useState<"po" | "cash">("po");
    const tabCls = (active: boolean) =>
        `px-4 py-2 text-sm font-semibold rounded-t-xl border-b-2 transition-colors ${active ? "border-[#D4AF37] text-[#2B2B2B]" : "border-transparent text-[#6B7280] hover:text-[#2B2B2B]"}`;

    return (
        <div>
            <div className="px-8 pt-6 flex gap-2 border-b border-[#E5E7EB]">
                <button id="finance-tab-po" type="button" className={tabCls(tab === "po")} onClick={() => setTab("po")}>Purchase Orders</button>
                <button id="finance-tab-cash" type="button" className={tabCls(tab === "cash")} onClick={() => setTab("cash")}>Customer vs Supplier Payments</button>
            </div>
            {tab === "po" ? (
                <FinancialReportTable rows={rows} errorMessage={errorMessage} />
            ) : (
                <div className="p-8 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold font-playfair text-[#2B2B2B]">Customer Collections vs Supplier Payments</h2>
                        <p className="text-sm text-[#6B7280] mt-1">Every payment received from customers (green) and made to suppliers (amber), summed separately. A dash means the amount cannot be converted from the saved currency and rate.</p>
                    </div>
                    {errorMessage && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{errorMessage}</div>}
                    <CashLedgerTable ledger={ledger} />
                </div>
            )}
        </div>
    );
}
