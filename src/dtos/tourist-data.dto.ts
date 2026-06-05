import { TravelStyle, Gender, RequestType, RequestStatus } from '../types/types';

export interface TouristProfileDTO {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    country: string;
    passport_number: string;
    address: string;
}

export interface TravelPreferencesDTO {
    travel_style: TravelStyle;
    budget_total: number;
    budget_per_person: number;
    arrival_date: string; // YYYY-MM-DD
    departure_date: string; // YYYY-MM-DD
    duration_days: number;
    adults: number;
    children: number;
    infants: number;
    departure_country: string;
    language_preference: string;
    dietary_requirements: string;
    medical_conditions: string;
    accessibility_requirements: string;
    special_notes: string;
}

export interface TouristTeamMemberDTO {
    id: string; // UUID
    full_name: string;
    passport_number: string;
    nationality: string;
    date_of_birth: string; // YYYY-MM-DD
    gender: Gender;
    dietary_preferences: string;
    meal_preference: string;
    room_preference: string;
    medical_notes: string;
}

export interface TripRequestDTO {
    id: string; // UUID
    request_type: RequestType;
    status: RequestStatus;
    package_name: string;
    nights: number;
    estimated_price: number;
    destinations: string[];
    special_requirements: string;
    budget_tier: string;
}

export interface TouristDataDTO {
    profile: TouristProfileDTO;
    preferences: TravelPreferencesDTO;
    request: TripRequestDTO;
    team: TouristTeamMemberDTO[];
}
