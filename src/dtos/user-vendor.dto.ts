export interface UserProfileDTO {
    id: string; // UUID
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    photo_url?: string;
    country?: string;
    role?: 'tourist' | 'agent' | 'admin';
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
