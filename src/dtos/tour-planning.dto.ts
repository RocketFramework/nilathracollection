export interface TourRouteStopDTO {
    id?: string;
    stop_order: number;
    location_name: string;
    tour_date: string; // YYYY-MM-DD or ''
    day_number?: number | null;
    notes?: string | null;
}

export interface TourActivitySelectionDTO {
    id?: string;
    activity_id: number;
    tour_date: string; // YYYY-MM-DD or ''
    day_number?: number | null;
    sort_order: number;
}

export interface TourProposedHotelDTO {
    id?: string;
    tour_date: string; // YYYY-MM-DD
    day_number?: number | null;
    location_name: string;
    hotel_id: string;
    option_rank: number; // 1..5
    is_selected: boolean;
    notes?: string | null;
}

export interface TourPlanningScheduleDTO {
    routeStops: TourRouteStopDTO[];
    activitySelections: TourActivitySelectionDTO[];
    proposedHotels: TourProposedHotelDTO[];
}

export interface ProposedHotelOptionDTO {
    id: string;
    name: string;
    closest_city?: string | null;
    location_address?: string | null;
    hotel_class?: string | null;
    photo_url?: string | null;
    is_suspended?: boolean | null;
}

export interface HotelImageDTO {
    id: string;
    hotel_id: string;
    image_url: string;
    is_primary: boolean;
    sort_order: number;
}
