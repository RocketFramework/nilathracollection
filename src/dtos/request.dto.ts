export interface CreateRequestDTO {
    email: string;
    request_type: 'package' | 'custom-plan' | 'inquiry' | 'ultra-vip';
    name?: string;
    phone_number?: string;
    package_name?: string;
    nights?: number;
    estimated_price?: number;
    destinations?: string[];
    start_date?: string; // ISO format
    end_date?: string; // ISO format
    adults?: number;
    children?: number;
    budget_tier?: string;
    special_requirements?: string;
    note?: string;
    departure_country?: string;
    budget?: number;
    duration_nights?: number;
    infants?: number;
}

export interface UpdateRequestDTO {
    status?: 'Pending' | 'Assigned' | 'Active' | 'Completed' | 'Cancelled';
}

export interface AssignAgentDTO {
    agent_id: string; // UUID
}
