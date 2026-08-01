export interface TourDailyDriverDTO {
    id?: string;
    tour_id?: string;
    tour_itinerary_id?: string;
    day_number: number;
    driver_id: string;

    // Contracted Cost (buying cost)
    per_day_rate: number;
    accommodation_cost: number;
    meal_cost: number;
    other_allowance: number;

    contracted_per_day_rate?: number;
    contracted_accommodation_cost?: number;
    contracted_meal_cost?: number;
    contracted_other_allowance?: number;

    // Charged Price (selling price for tourist invoice & PDF)
    charged_per_day_rate?: number;
    charged_accommodation_cost?: number;
    charged_meal_cost?: number;
    charged_other_allowance?: number;

    notes?: string;
    applyScope?: 'current' | 'all';
    created_at?: string;
    updated_at?: string;
}

export interface TourDailyDriverTotalDTO {
    tour_id: string;
    total_days: number;
    total_driver_rate: number;
    total_accommodation_cost: number;
    total_meal_cost: number;
    total_other_allowance: number;
    grand_total_driver_cost: number;

    total_charged_driver_rate?: number;
    total_charged_accommodation_cost?: number;
    total_charged_meal_cost?: number;
    total_charged_other_allowance?: number;
    grand_total_charged_driver_cost?: number;
}
