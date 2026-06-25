export interface CreateVendorBookingDTO {
    tour_id: string;
    quotation_request_id?: string | null;
    vendor_type: 'hotel' | 'vendor' | 'transport_provider' | 'tour_guide' | 'driver' | 'restaurant';
    vendor_id: string;
    vendor_name: string;
    agreed_price: number;
    currency?: string;
    cancellation_deadline?: string | null;
    cancellation_policy?: string | null;
    notes?: string | null;
    daily_activity_ids: string[];
    po_number?: string;
    discount?: number;
    tax?: number;
    po_block_id?: string;
}

export interface ConfirmFinalBookingDTO {
    booking_id: string;
}

export interface CancelBookingDTO {
    booking_id: string;
    reason?: string;
}

export interface UpdateBookingStatusDTO {
    booking_id: string;
    status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Went Ahead';
    booking_reference?: string | null;
}
