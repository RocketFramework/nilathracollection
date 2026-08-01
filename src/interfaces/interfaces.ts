import { ItineraryBlockType } from '../types/types';

export interface POBlock {
    id: string;
    tour_id: string;
    name: string;
    block_type: 'accommodation' | 'sleep' | 'travel' | 'meal' | 'restaurant' | 'activity' | 'guide' | 'driver';
    block_number: number;
    has_finalized?: boolean;
    created_at?: string;
    updated_at?: string;
    // Client-side joins
    daily_activities?: any[];
    daily_activity_vendors?: any[];
    transport_requirement_id?: string;
    transport_requirement?: any;
}

export interface POBlockDailyActivity {
    id: string;
    po_block_id: string;
    daily_activity_id: string;
    created_at?: string;
    updated_at?: string;
}

export interface TourDailyDriver {
    id?: string;
    tour_id?: string;
    tour_itinerary_id?: string;
    day_number: number;
    driver_id: string;
    per_day_rate: number;
    accommodation_cost: number;
    meal_cost: number;
    other_allowance: number;

    contracted_per_day_rate?: number;
    contracted_accommodation_cost?: number;
    contracted_meal_cost?: number;
    contracted_other_allowance?: number;

    charged_per_day_rate?: number;
    charged_accommodation_cost?: number;
    charged_meal_cost?: number;
    charged_other_allowance?: number;

    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface TourDailyVehicle {
    id?: string;
    tour_id?: string;
    tour_itinerary_id?: string;
    day_number: number;
    vehicle_id: string;

    contracted_per_day_rate?: number;
    contracted_excess_mileage_cost?: number;
    contracted_other_allowance?: number;

    charged_per_day_rate?: number;
    charged_excess_mileage_cost?: number;
    charged_other_allowance?: number;

    route_path?: string;
    distance_km?: number;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}
