export interface DBPurchaseOrderItem {
    id: string;
    purchase_order_id: string;
    tour_itinerary_id?: string;
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
    service_charge: number;
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
    invoices?: DBVendorInvoice[];

    created_at: string;
    updated_at: string;
}

export interface DBVendorInvoice {
    id: string;
    purchase_order_id: string;
    invoice_number: string;
    invoice_date?: string;
    due_date?: string;
    amount: number;
    status: 'Pending' | 'Received' | 'Partial Paid' | 'Paid' | 'Confirmed';
    attachment_url?: string;
    payments?: DBVendorPayment[];
    created_at: string;
    updated_at: string;
}

export interface DBVendorPayment {
    id: string;
    vendor_invoice_id: string;
    payment_date: string;
    amount: number;
    payment_method: string;
    payment_reference?: string;
    notes?: string;
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
    /** @deprecated Use relational vendor_invoices table */
    supplierInvoices: any[];
    sellingPrice: number;
    draftCosts?: DraftCostItem[];
}
