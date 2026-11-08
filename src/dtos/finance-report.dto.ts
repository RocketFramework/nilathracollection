/**
 * Line item on a Purchase Order (`purchase_order_items`).
 * Values come strictly from the saved columns; NULL stays NULL.
 */
export interface FinancePoLineItemDTO {
    id: string;
    purchase_order_id: string;
    day_number: number | null;
    service_date: string | null;
    description: string;
    quantity: number;
    unit_price: number | null;
    total_price: number | null;
    fx_rate: number | null;
    unit_price_lkr: number | null;
    total_price_lkr: number | null;
    service_details: Record<string, any> | null;
    special_notes: string | null;
}

/**
 * Line item on a Supplier Invoice (`supplier_invoice_items`).
 */
export interface FinanceSupplierInvoiceLineItemDTO {
    id: string;
    supplier_invoice_id: string;
    purchase_order_item_id: string | null;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

/**
 * Full Supplier Invoice header + line items (`supplier_invoices`).
 */
export interface FinanceSupplierInvoiceDetailDTO {
    id: string;
    purchase_order_id: string;
    invoice_number: string;
    invoice_type: string | null;
    invoice_date: string | null;
    due_date: string | null;
    currency: string;
    exchange_rate: number | null;
    amount: number;
    amount_lkr: number | null;
    status: string | null;
    attachment_url: string | null;
    is_tallied: boolean;
    discrepancy_amount: number | null;
    approved_by: string | null;
    approved_at: string | null;
    items: FinanceSupplierInvoiceLineItemDTO[];
}

/**
 * Full Supplier Payment / Refund voucher record (`supplier_payments`).
 */
export interface FinanceSupplierPaymentDetailDTO {
    id: string;
    purchase_order_id: string | null;
    supplier_invoice_id: string | null;
    invoice_number: string | null;
    payment_date: string | null;
    amount: number;
    currency: string;
    exchange_rate: number | null;
    amount_lkr: number | null;
    payment_method: string | null;
    payment_reference: string | null;
    notes: string | null;
    attachment_url: string | null;
    is_refund: boolean;
    refund_reason: string | null;
    refund_description: string | null;
}

/**
 * One row of the read-only `v_finance_po_report` view (one row per purchase order),
 * enriched with full PO line items, supplier invoices (with line items & attachment copies),
 * and supplier payment vouchers.
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

    // Enriched PO header, document & drill-down line items for tax/accounting filing
    vendor_address?: string | null;
    vendor_phone?: string | null;
    vendor_email?: string | null;
    payment_terms?: string | null;
    subtotal?: number | null;
    discount?: number | null;
    tax?: number | null;
    signed_document_url?: string | null;
    internal_notes?: string | null;
    vendor_notes?: string | null;
    settled_by_name?: string | null;
    settled_date?: string | null;
    settlement_notes?: string | null;
    items?: FinancePoLineItemDTO[];
    supplier_invoices?: FinanceSupplierInvoiceDetailDTO[];
    supplier_payments?: FinanceSupplierPaymentDetailDTO[];
}

/**
 * Line item on a Customer Invoice (`customer_invoice_items`).
 */
export interface FinanceCustomerInvoiceLineItemDTO {
    id: string;
    invoice_id: string;
    description: string;
    amount: number;
}

/**
 * Customer Payment receipt voucher record (`customer_payments`).
 */
export interface FinanceCustomerPaymentDetailDTO {
    id: string;
    invoice_id: string | null;
    invoice_number?: string | null;
    tour_id: string | null;
    tour_code?: string | null;
    payment_date: string | null;
    amount: number;
    currency: string;
    exchange_rate: number | null;
    amount_usd: number | null;
    amount_lkr: number | null;
    payment_method: string | null;
    payment_status: string | null;
    transaction_id: string | null;
    attachment_url: string | null;
    is_advance: boolean;
}

/**
 * Miscellaneous / Petty Cash Tour Expense (`tour_expenses`).
 */
export interface FinanceTourExpenseDetailDTO {
    id: string;
    tour_id: string | null;
    tour_code: string | null;
    category: string | null;
    description: string | null;
    paid_to: string | null;
    amount: number;
    currency: string;
    exchange_rate: number | null;
    amount_usd: number | null;
    amount_lkr: number | null;
    expense_date: string | null;
    payment_method: string | null;
    payment_reference: string | null;
    receipt_url: string | null;
    notes: string | null;
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

    // Enriched voucher & document metadata for accountant drill-down
    attachment_url?: string | null;
    doc_number?: string | null;
    po_number?: string | null;
    invoice_number?: string | null;
    notes?: string | null;
    refund_reason?: string | null;
    category?: string | null;
    line_items?: { description: string; quantity?: number; unit_price?: number | null; amount: number; currency: string }[];
}

export interface FinanceLedgerInvoiceDTO {
    id: string;
    tour_id: string | null;
    tour_code: string | null;
    invoice_number: string | null;
    currency: string;
    amount: number;
    status: string | null;

    // Enriched Customer Invoice fields + line items + linked payments for tax/accounting filing
    tourist_id?: string | null;
    client_name?: string | null;
    billing_details?: {
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
    } | null;
    created_at?: string | null;
    due_date?: string | null;
    subtotal?: number;
    discount_amount?: number;
    tax_amount?: number;
    service_fee_percentage?: number | null;
    agency_note?: string | null;
    tour_usd_buying_rate?: number | null;
    amount_lkr?: number | null;
    paid_usd?: number;
    paid_lkr?: number;
    balance_usd?: number;
    items?: FinanceCustomerInvoiceLineItemDTO[];
    payments?: FinanceCustomerPaymentDetailDTO[];
}

/**
 * Complete per-tour accounting dossier for tax filing & audit review.
 */
export interface FinanceTourDossierDTO {
    tour_id: string;
    tour_code: string;
    title: string | null;
    status: string | null;
    travel_style: string | null;
    start_date: string | null;
    end_date: string | null;
    client_name: string | null;
    client_country: string | null;
    pax_count: number;
    usd_lkr_buying_rate: number | null;
    customer_invoices: FinanceLedgerInvoiceDTO[];
    unassigned_customer_payments: FinanceCustomerPaymentDetailDTO[];
    purchase_orders: FinancePoReportRowDTO[];
    tour_expenses: FinanceTourExpenseDetailDTO[];
}

export interface FinanceLedgerDTO {
    rows: FinanceLedgerRowDTO[];
    invoices: FinanceLedgerInvoiceDTO[];
    expenses?: FinanceTourExpenseDetailDTO[];
    tours?: FinanceTourDossierDTO[];
}
