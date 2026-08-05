export interface TourConciergeDTO {
    id?: string;
    tour_id: string;
    tour_itinerary_id?: string | null;
    concierge_cost_item_id: string;
    quantity: number;
    cost: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface SaveTourConciergeItemDTO {
    concierge_cost_item_id: string;
    quantity: number;
    cost: number;
    tour_itinerary_id?: string | null;
}

export interface SaveTourConciergesDTO {
    tour_id: string;
    items: SaveTourConciergeItemDTO[];
}
