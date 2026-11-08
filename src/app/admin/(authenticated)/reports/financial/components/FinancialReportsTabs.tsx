"use client";

import { useState } from "react";
import { FinanceLedgerDTO, FinancePoReportRowDTO } from "@/dtos/finance-report.dto";
import FinancialReportTable from "./FinancialReportTable";
import CashLedgerTable from "./CashLedgerTable";
import TourAccountingDossierTab from "./TourAccountingDossierTab";
import CustomerInvoicesTable from "./CustomerInvoicesTable";

export default function FinancialReportsTabs({
    rows,
    ledger,
    errorMessage,
}: {
    rows: FinancePoReportRowDTO[];
    ledger: FinanceLedgerDTO;
    errorMessage: string | null;
}) {
    const [tab, setTab] = useState<"dossier" | "invoices" | "po" | "cash">("dossier");
    const tabCls = (active: boolean) =>
        `px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-colors ${
            active
                ? "border-[#D4AF37] text-[#2B2B2B] bg-white"
                : "border-transparent text-[#6B7280] hover:text-[#2B2B2B]"
        }`;

    return (
        <div>
            <div className="px-8 pt-6 flex flex-wrap gap-2 border-b border-[#E5E7EB] print:hidden">
                <button
                    id="finance-tab-dossier"
                    type="button"
                    className={tabCls(tab === "dossier")}
                    onClick={() => setTab("dossier")}
                >
                    Tour Accounting Dossier (Tax Pack)
                </button>
                <button
                    id="finance-tab-invoices"
                    type="button"
                    className={tabCls(tab === "invoices")}
                    onClick={() => setTab("invoices")}
                >
                    Customer Invoices &amp; Line Items (AR)
                </button>
                <button
                    id="finance-tab-po"
                    type="button"
                    className={tabCls(tab === "po")}
                    onClick={() => setTab("po")}
                >
                    Purchase Orders &amp; Supplier Bills (AP)
                </button>
                <button
                    id="finance-tab-cash"
                    type="button"
                    className={tabCls(tab === "cash")}
                    onClick={() => setTab("cash")}
                >
                    Customer vs Supplier Payments (Cash Book)
                </button>
            </div>

            {tab === "dossier" && (
                <TourAccountingDossierTab tours={ledger.tours || []} />
            )}

            {tab === "invoices" && (
                <CustomerInvoicesTable invoices={ledger.invoices || []} />
            )}

            {tab === "po" && (
                <FinancialReportTable rows={rows} errorMessage={errorMessage} />
            )}

            {tab === "cash" && (
                <div className="p-8 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold font-playfair text-[#2B2B2B]">
                            Cash Book &mdash; Customer Collections vs Supplier Payments &amp; Vouchers
                        </h2>
                        <p className="text-sm text-[#6B7280] mt-1">
                            Every payment received from customers (green) and made to suppliers or misc tour expenses (amber). Click any row (<span className="font-mono">▶</span>) to inspect its underlying line items, open the uploaded bank slip/receipt, or print an Official Accounting Voucher.
                        </p>
                    </div>
                    {errorMessage && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                            {errorMessage}
                        </div>
                    )}
                    <CashLedgerTable ledger={ledger} />
                </div>
            )}
        </div>
    );
}
