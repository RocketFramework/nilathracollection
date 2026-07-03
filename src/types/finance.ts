export interface DBPurchaseOrderItem {
    id: string;
    purchase_order_id: string;
    daily_activity_id?: string;
    day_number?: number | null;
    description: string;
    service_date?: string;
    quantity: number;
    unit_price: number;
    total_price: number;

    // Hotel specific
    check_in_date?: string;
    check_out_date?: string;
    room_type?: string;
    meal_plan?: string;
    number_of_nights?: number;

    // Transport specific
    vehicle_type?: string;
    pick_up_location?: string;
    drop_off_location?: string;
    driver_included?: boolean;
    fuel_included?: boolean;

    // Activity/Guide specific
    number_of_guests?: number;
    language?: string;

    // Unified service details column (JSONB)
    service_details?: {
        check_in_date?: string;
        check_out_date?: string;
        room_type?: string;
        meal_plan?: string;
        number_of_nights?: number;
        vehicle_type?: string;
        pick_up_location?: string;
        drop_off_location?: string;
        driver_included?: boolean;
        fuel_included?: boolean;
        number_of_guests?: number;
        language?: string;
        meal_type?: string;
        dining_time_start?: string;
        dining_time_end?: string;
        buffet_available?: boolean;
        cuisine_type?: string;
        exclusive_buyout?: boolean;
    };

    special_notes?: string;
    created_at?: string;
}

export type POStatus = 'Draft' | 'Pending Confirmation' | 'Sent' | 'Accepted' | 'Rejected' | 'Cancelled' | 'Completed';

export interface DBPurchaseOrder {
    id: string;
    tour_id: string;
    po_number: string;
    po_date: string;

    hotel_id?: string;
    activity_vendor_id?: string;
    transport_provider_id?: string;
    guide_id?: string;
    restaurant_id?: string;

    vendor_type: 'hotel' | 'vendor' | 'transport' | 'guide' | 'restaurant' | 'other';
    vendor_name?: string;
    vendor_address?: string;
    vendor_phone?: string;
    vendor_email?: string;

    currency: string;
    payment_terms?: string;
    status: POStatus;

    subtotal: number;
    discount: number;
    tax: number;
    total_amount: number;
    advance_paid: number;
    balance_payable: number;

    internal_notes?: string;
    vendor_notes?: string;
    cancellation_policy?: string;

    // Operational Tracking Fields
    sent_email?: string;
    sent_to_name?: string;
    sent_date?: string;
    accepted_by_name?: string;
    accepted_date?: string;

    items?: DBPurchaseOrderItem[];
    invoices?: DBSupplierInvoice[];

    created_at: string;
    updated_at: string;
}

export interface DBCustomerInvoice {
    id: string;
    tour_id: string;
    tourist_id: string;
    amount: number;
    currency?: string;
    status: 'Pending' | 'Paid' | 'Cancelled' | string;
    due_date?: string | null;
    invoice_number?: string | null;
    billing_details?: {
        name: string;
        email: string;
        phone: string;
        address: string;
    } | null;
    agency_note?: string | null;
    discount_amount?: number;
    tax_amount?: number;
    service_fee_percentage?: number | null;
    created_at: string;
    updated_at: string;
    items?: DBCustomerInvoiceItem[];
    payments?: DBCustomerPayment[];
}

export interface DBCustomerInvoiceItem {
    id: string;
    invoice_id: string;
    description: string;
    amount: number;
    created_at: string;
    daily_activity_ids?: string[];
}

export interface DBCustomerPayment {
    id: string;
    invoice_id: string;
    amount: number;
    payment_method?: string;
    payment_status?: string;
    transaction_id?: string;
    created_at: string;
}

export interface DBSupplierInvoice {
    id: string;
    purchase_order_id: string;
    invoice_number: string;
    invoice_date?: string;
    due_date?: string;
    amount: number;
    status: 'Pending' | 'Received' | 'Partial Paid' | 'Paid' | 'Confirmed';
    attachment_url?: string;
    is_tallied?: boolean;
    discrepancy_amount?: number;
    approved_by?: string | null;
    approved_at?: string | null;
    currency?: string;
    exchange_rate?: number;
    items?: DBSupplierInvoiceItem[];
    payments?: DBSupplierPayment[];
    created_at: string;
    updated_at: string;
}

export interface DBSupplierInvoiceItem {
    id: string;
    supplier_invoice_id: string;
    purchase_order_item_id?: string | null;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    created_at?: string;
}

export interface DBSupplierPayment {
    id: string;
    supplier_invoice_id: string | null;
    purchase_order_id?: string | null;
    payment_date: string;
    amount: number;
    payment_method: string;
    payment_reference?: string;
    notes?: string;
    currency?: string;
    exchange_rate?: number;
    attachment_url?: string;
    created_at: string;
}

export interface DraftCostItem {
    id: string;
    category: 'Accommodation' | 'Transportation' | 'Activities & Experiences' | 'Service and Support' | 'Other';
    vendorName: string;
    serviceName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface Financials {
    costs: {
        flights: number;
        hotels: number;
        transport: number;
        activities: number;
        guide: number;
        misc: number;
        commission: number;
        tax: number;
    };
    /** @deprecated Use relational purchase_orders table */
    purchaseOrders: any[];
    /** @deprecated Use relational supplier_invoices table */
    supplierInvoices: any[];
    sellingPrice: number;
    draftCosts?: DraftCostItem[];
}
