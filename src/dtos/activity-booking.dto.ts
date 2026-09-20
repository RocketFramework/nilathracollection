export interface CreateActivityBookingItemDTO {
    activity_id: number;
    booking_date: string;
    preferred_time_slot?: string;
    adults: number;
    children: number;
    infants: number;
}

export interface CreateActivityBookingDTO {
    items: CreateActivityBookingItemDTO[];
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    country?: string;
    passport_number?: string;
    departure_country?: string;
    arrival_date?: string;
    departure_date?: string;
    medical_conditions?: string;
    language_preference?: string;
    special_notes?: string;
}

export interface AssignItemVendorDTO {
    item_id: string;
    vendor_id: string;
    item_price?: number;
    agreed_vendor_price?: number;
}

export interface ConfirmActivityBookingDTO {
    booking_id: string;
    total_price?: number;
    item_assignments: AssignItemVendorDTO[];
    admin_notes?: string;
}

export interface UpdateActivityBookingStatusDTO {
    booking_id: string;
    status: 'Pending Assignment' | 'Assigned' | 'Confirmed' | 'Completed' | 'Cancelled';
    admin_notes?: string;
}
