import { FinanceReportService } from "@/services/finance-report.service";
import FinancialReportsTabs from "./components/FinancialReportsTabs";
import { FinanceLedgerDTO, FinancePoReportRowDTO } from "@/dtos/finance-report.dto";

export const metadata = {
    title: "Financial Reports | Nilathra Admin",
    description: "Purchase order finance report and customer vs supplier payments",
};

export const dynamic = "force-dynamic";

export default async function FinancialReportsPage() {
    let rows: FinancePoReportRowDTO[] = [];
    let ledger: FinanceLedgerDTO = { rows: [], invoices: [] };
    const errors: string[] = [];
    try {
        rows = await FinanceReportService.getPoReport();
    } catch (e: any) {
        errors.push(e?.message || "Failed to load the PO finance report.");
    }
    try {
        ledger = await FinanceReportService.getCashLedger();
    } catch (e: any) {
        errors.push(e?.message || "Failed to load the payments ledger.");
    }

    return <FinancialReportsTabs rows={rows} ledger={ledger} errorMessage={errors.length ? errors.join(" / ") : null} />;
}
