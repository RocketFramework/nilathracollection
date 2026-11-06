export type UserRoleType =
    | 'tourist'
    | 'agent'
    | 'senior_agent'
    | 'executive_agent'
    | 'agent_supervisor'
    | 'senior_supervisor'
    | 'executive_supervisor'
    | 'principal_supervisor'
    | 'admin'
    | 'finance';

export interface CreateUserDTO {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    password?: string; // Only for initial creation
    role: UserRoleType;
    supervisor_id?: string; // Links agent to supervisor
}

export interface UpdateUserDTO {
    first_name?: string;
    last_name?: string;
    phone?: string;
    is_active?: boolean;
    supervisor_id?: string; // Can change agent's supervisor
}

export interface ResetPasswordDTO {
    userId: string;
    newPassword?: string; // Optional if you decide to send a link instead, but we need it for direct reset.
}

export interface UserProfileDTO {
    id: string; // UUID
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    photo_url?: string;
    country?: string;
    role?: UserRoleType;
    supervisor_id?: string; // Links user to their superior (Senior Agent, Executive Agent, Supervisor, etc.)
    is_active?: boolean;
    supervisor?: {
        first_name: string;
        last_name: string;
        role?: string;
        role_label?: string;
    };
}

export interface VendorDTO {
    id?: string; // UUID, optional for creation
    name: string;
    location?: string;
    description?: string;
    type: 'hotel' | 'activity_vendor' | 'transport_provider' | 'driver' | 'guide';
}

export interface RatingDTO {
    tour_id: string; // UUID
    vendor_type: 'hotel' | 'activity_vendor' | 'transport_provider' | 'driver' | 'guide';
    entity_id: string; // UUID
    rating: number; // 1-5
    review?: string;
}

export interface SuspensionRecommendationDTO {
    vendor_type: 'hotel' | 'activity_vendor' | 'transport_provider' | 'driver' | 'guide';
    entity_id: string; // UUID
    reason: string;
}
