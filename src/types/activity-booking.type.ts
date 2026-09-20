export type ActivityBookingStatus = 'Pending Assignment' | 'Assigned' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface ActivityBookingItem {
    id: string;
    booking_id: string;
    activity_id: number;
    booking_date: string;
    preferred_time_slot?: string | null;
    adults: number;
    children: number;
    infants: number;
    item_price?: number | null;
    status: ActivityBookingStatus;
    assigned_vendor_id?: string | null;
    agreed_vendor_price?: number | null;
    assigned_at?: string | null;
    created_at?: string;
    updated_at?: string;

    // Joined fields
    activity?: {
        id: number;
        activity_name: string;
        category: string;
        location_name: string;
        district: string;
        duration_hours: number;
        optimal_start_time?: string | null;
        optimal_end_time?: string | null;
        description: string;
    };
    vendor?: {
        id: string;
        name: string;
        phone?: string | null;
        email?: string | null;
        address?: string | null;
    };
}

export interface ActivityBooking {
    id: string;
    booking_number: string;
    tourist_id: string;
    total_price?: number | null;
    currency: string;
    status: ActivityBookingStatus;
    admin_notes?: string | null;
    created_at?: string;
    updated_at?: string;

    // Joined fields
    items?: ActivityBookingItem[];
    tourist_profile?: {
        first_name?: string | null;
        last_name?: string | null;
        phone?: string | null;
        country?: string | null;
        passport_number?: string | null;
        departure_country?: string | null;
        arrival_date?: string | null;
        departure_date?: string | null;
        medical_conditions?: string | null;
        language_preference?: string | null;
        special_notes?: string | null;
    };
    user?: {
        id: string;
        email: string;
    };
}
