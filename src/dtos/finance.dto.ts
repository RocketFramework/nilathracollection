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
    invoice_id?: string | null; // UUID
    tour_id?: string | null; // UUID
    amount: number;
    payment_method?: string;
    transaction_id?: string;
    currency?: string;
    exchange_rate?: number;
    payment_date?: string; // DATE
    attachment_url?: string;
    is_advance?: boolean;
}

export interface GenerateCustomerInvoiceDTO {
    tour_id: string;
    discountAmount: number;
    taxAmount: number;
    agencyNote?: string;
    customServiceFee?: number;
    flightsQuotedSeparately?: boolean;
    flightsQuotedPrice?: number;
    billingDetails: {
        name: string;
        email: string;
        phone: string;
        address: string;
    };
    dueDate?: string;
}
