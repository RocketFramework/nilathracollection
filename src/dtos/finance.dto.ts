export interface CreateCustomerInvoiceDTO {
    tour_id: string; // UUID
    tourist_id: string; // UUID
    amount: number;
    currency?: string;
    due_date?: string; // ISO format
    items: CustomerInvoiceItemDTO[];
}

export interface CustomerInvoiceItemDTO {
    description: string;
    amount: number;
}

export interface CustomerPaymentDTO {
    invoice_id: string; // UUID
    amount: number;
    payment_method?: string;
    transaction_id?: string;
}
