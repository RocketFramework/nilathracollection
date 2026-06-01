export interface VendorBooking {
    id: string;
    tour_id: string;
    quotation_request_id?: string | null;
    purchase_order_id?: string | null;
    vendor_type: 'hotel' | 'vendor' | 'transport_provider' | 'tour_guide' | 'driver' | 'restaurant';
    vendor_id: string;
    vendor_name: string;
    booking_reference?: string | null;
    status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Went Ahead';
    agreed_price: number;
    currency: string;
    cancellation_deadline?: string | null;
    cancellation_policy?: string | null;
    notes?: string | null;
    created_at: string;
    updated_at: string;
}

export interface VendorBookedActivity {
    id: string;
    vendor_booking_id: string;
    daily_activity_id: string;
    created_at: string;
}
