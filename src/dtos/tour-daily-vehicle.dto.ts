export interface TourDailyVehicleDTO {
    id?: string;
    tour_id?: string;
    tour_itinerary_id?: string;
    day_number: number;
    vehicle_id: string;

    // Contracted Cost (buying cost)
    per_day_rate: number;
    excess_mileage_cost: number;
    other_allowance: number;

    contracted_per_day_rate?: number;
    contracted_excess_mileage_cost?: number;
    contracted_other_allowance?: number;

    // Charged Price (selling price for tourist invoice & PDF)
    charged_per_day_rate?: number;
    charged_excess_mileage_cost?: number;
    charged_other_allowance?: number;

    route_path?: string;
    distance_km?: number;
    notes?: string;
    applyScope?: 'current' | 'all';
    created_at?: string;
    updated_at?: string;
}

export interface TourDailyVehicleTotalDTO {
    tour_id: string;
    total_days: number;
    total_vehicle_rate: number;
    total_excess_mileage_cost: number;
    total_other_allowance: number;
    grand_total_vehicle_cost: number;

    total_charged_vehicle_rate?: number;
    total_charged_excess_mileage_cost?: number;
    total_charged_other_allowance?: number;
    grand_total_charged_vehicle_cost?: number;
}
