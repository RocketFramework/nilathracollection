export interface TourDailyTransportDTO {
    id?: string;
    tour_id?: string;
    tour_itinerary_id?: string;
    day_number: number;
    transport_provider_id: string;
    vehicle_id?: string | null;
    created_at?: string;
    updated_at?: string;
}
