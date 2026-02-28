export interface CreateTourDTO {
    request_id: string; // UUID
    tourist_id: string; // UUID
    agent_id?: string; // UUID
    title: string;
    start_date?: string; // ISO format
    end_date?: string; // ISO format
}

export interface UpdateTourDTO {
    title?: string;
    status?: 'Pending' | 'Assigned' | 'Active' | 'Completed' | 'Cancelled';
    start_date?: string; // ISO format
    end_date?: string; // ISO format
}

export interface AddActivityDTO {
    itinerary_id: string; // UUID
    title: string;
    description?: string;
    time_start?: string; // HH:mm format
    time_end?: string; // HH:mm format
    vendor_id?: string; // UUID
    transport_id?: string; // UUID
    driver_id?: string; // UUID
    guide_id?: string; // UUID
}

export interface UpdateActivityDTO extends Partial<Omit<AddActivityDTO, 'itinerary_id'>> { }

export interface AddItineraryDayDTO {
    tour_id: string; // UUID
    day_number: number;
    date?: string; // ISO format
    title?: string;
    description?: string;
    hotel_id?: string; // UUID
}
