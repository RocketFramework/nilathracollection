export interface CreateRequestDTO {
    email: string;
    request_type: 'package' | 'custom-plan';
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
}

export interface UpdateRequestDTO {
    status?: 'Pending' | 'Assigned' | 'Active' | 'Completed' | 'Cancelled';
}

export interface AssignAgentDTO {
    agent_id: string; // UUID
}
