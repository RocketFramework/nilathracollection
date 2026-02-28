export interface CreateInvoiceDTO {
    tour_id: string; // UUID
    tourist_id: string; // UUID
    amount: number;
    currency?: string;
    due_date?: string; // ISO format
    items: InvoiceItemDTO[];
}

export interface InvoiceItemDTO {
    description: string;
    amount: number;
}

export interface PaymentDTO {
    invoice_id: string; // UUID
    amount: number;
    payment_method?: string;
    transaction_id?: string;
}
