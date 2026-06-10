import { TrackType, BasicStep, PrepareBasicSubStep, FinalStep, TravelStyle, Gender, RequestType, RequestStatus } from '../types/types';

export interface ItineraryElements {
    hotel: boolean;
    activity: boolean;
    restaurant: boolean;
    transport: boolean;
    security: boolean;
    guide: boolean;
    driver: boolean;
}

export interface WizardState {
    track: TrackType;
    activeBasicStep: BasicStep;
    activePrepareSubStep: PrepareBasicSubStep;
    activeFinalStep: FinalStep;
    selectedElements: ItineraryElements;
    completedSteps: string[];
}

export interface TouristProfile {
    id: string; // UUID references users(id)
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    country: string | null;
    passport_number: string | null;
    address: string | null;
    adults: number;
    children: number;
    infants: number;
    arrival_date?: string | null;
    departure_date?: string | null;
    duration_days: number;
    budget_total: number;
    budget_per_person: number;
    travel_style: TravelStyle;
    departure_country: string | null;
    dietary_requirements?: string | null;
    medical_conditions?: string | null;
    accessibility_requirements?: string | null;
    language_preference: string;
    special_notes?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface TouristTeamMember {
    id: string; // UUID
    tour_id: string; // UUID
    tourist_id: string; // UUID references users(id)
    full_name: string;
    passport_number?: string | null;
    nationality?: string | null;
    date_of_birth?: string | null;
    gender?: Gender | null;
    dietary_preferences?: string | null;
    meal_preference: string;
    room_preference: string;
    shared_with_ids: string[]; // UUID[]
    medical_notes?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface TripRequest {
    id: string; // UUID
    tourist_id: string | null; // UUID references users(id)
    email: string | null;
    request_type: RequestType;
    status: RequestStatus;
    admin_assigned_to?: string | null; // UUID references users(id)
    created_at?: string;
    updated_at?: string;
}

export interface DBActivity {
  id: number;
  category: string;
  activity_name: string;
  location_name: string;
  district: string;
  lat: number | null;
  lng: number | null;
  description: string;
  duration_hours: number;
  optimal_start_time: string | null;
  optimal_end_time: string | null;
  time_flexible: boolean;
  images: string[] | null;
}

