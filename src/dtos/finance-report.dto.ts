/**
 * One row of the read-only `v_finance_po_report` view (one row per purchase order).
 * LKR columns follow the view's rule: PO LKR = agreed PO rate, invoice LKR = invoice rate,
 * payment LKR = each payment's own rate. NULL means "not available" and must be shown as such.
 */
export interface FinancePoReportRowDTO {
    purchase_order_id: string;
    po_number: string;
    po_date: string | null;
    tour_id: string | null;
    tour_code: string | null;
    vendor_type: string | null;
    vendor_name: string | null;
    po_status: string | null;
    settlement_mode: string | null;
    po_currency: string | null;
    po_value_own_ccy: number | null;
    po_value_lkr: number | null;
    po_rate_used: number | null;
    invoice_count: number;
    invoice_numbers: string | null;
    invoice_currencies: string | null;
    invoice_rates_used: string | null;
    invoiced_amount_own_ccy: number | null;
    invoiced_lkr: number | null;
    invoice_vs_po_gap_lkr: number | null;
    paid_lkr_net: number | null;
    refunded_lkr: number | null;
    last_payment_date: string | null;
    invoice_balance_lkr: number | null;
}

/**
 * One cash movement for the combined ledger: money collected from a customer ('customer')
 * or money paid to a supplier ('supplier'; refunds are negative amounts), or a miscellaneous tour expense ('expense'; treated as money paid out, same as supplier payments).
 * amount_usd / amount_lkr are only set when the saved currency and saved rate allow it; never guessed.
 */
export interface FinanceLedgerRowDTO {
    id: string;
    kind: 'customer' | 'supplier' | 'expense';
    payment_date: string | null;
    tour_id: string | null;
    tour_code: string | null;
    party: string | null;
    reference: string | null;
    method: string | null;
    currency: string;
    amount: number;
    exchange_rate: number | null;
    amount_usd: number | null;
    amount_lkr: number | null;
    is_refund: boolean;
}

export interface FinanceLedgerInvoiceDTO {
    id: string;
    tour_id: string | null;
    tour_code: string | null;
    invoice_number: string | null;
    currency: string;
    amount: number;
    status: string | null;
}

export interface FinanceLedgerDTO {
    rows: FinanceLedgerRowDTO[];
    invoices: FinanceLedgerInvoiceDTO[];
}
