import { TravelStyle, Gender, RequestType, RequestStatus } from '../types/types';
import { createAdminClient } from '@/utils/supabase/admin';

const isUuid = (val: any) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

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
}

export interface TouristDataDTO {
    profile: TouristProfileDTO;
    preferences: TravelPreferencesDTO;
    request: TripRequestDTO;
    team: TouristTeamMemberDTO[];
}

export namespace TouristDataDTO {
    export async function pull(tourId: string): Promise<TouristDataDTO> {
        const supabaseAdmin = createAdminClient();

        // 1. Fetch the tour info to get request_id and tourist_id
        const { data: tour, error: tourErr } = await supabaseAdmin
            .from('tours')
            .select('request_id, tourist_id, start_date, end_date')
            .eq('id', tourId)
            .single();

        if (tourErr) throw tourErr;
        if (!tour) throw new Error("Tour not found");

        const touristId = tour.tourist_id;
        const requestId = tour.request_id;

        // 2. Fetch the user's email from users table
        const { data: userRow } = await supabaseAdmin
            .from('users')
            .select('email')
            .eq('id', touristId)
            .single();

        // 3. Fetch the tourist profile
        const { data: profile } = await supabaseAdmin
            .from('tourist_profiles')
            .select('*')
            .eq('id', touristId)
            .single();

        const activeProfile = profile || {};

        // 4. Fetch the request info
        const { data: requestMsg } = await supabaseAdmin
            .from('requests')
            .select('*')
            .eq('id', requestId)
            .single();

        // 5. Fetch the tourist team members
        const { data: teamRows } = await supabaseAdmin
            .from('tourist_team')
            .select('*')
            .eq('tour_id', tourId);

        const team: TouristTeamMemberDTO[] = (teamRows || []).map(row => ({
            id: row.id,
            full_name: row.full_name || '',
            passport_number: row.passport_number || '',
            nationality: row.nationality || '',
            date_of_birth: row.date_of_birth || '',
            gender: row.gender as Gender || 'Male',
            dietary_preferences: row.dietary_preferences || '',
            meal_preference: row.meal_preference || 'Standard',
            room_preference: row.room_preference || 'Double',
            medical_notes: row.medical_notes || ''
        }));

        return {
            profile: {
                first_name: activeProfile.first_name || '',
                last_name: activeProfile.last_name || '',
                email: userRow?.email || requestMsg?.email || '',
                phone: activeProfile.phone || '',
                country: activeProfile.country || '',
                passport_number: activeProfile.passport_number || '',
                address: activeProfile.address || ''
            },
            preferences: {
                travel_style: (activeProfile.travel_style || 'Luxury') as TravelStyle,
                budget_total: Number(activeProfile.budget_total) || 0,
                budget_per_person: Number(activeProfile.budget_per_person) || 0,
                arrival_date: activeProfile.arrival_date || tour.start_date || requestMsg?.start_date || '',
                departure_date: activeProfile.departure_date || tour.end_date || '',
                duration_days: Number(activeProfile.duration_days) || 0,
                adults: activeProfile.adults !== null && activeProfile.adults !== undefined ? activeProfile.adults : (requestMsg?.adults || 2),
                children: activeProfile.children !== null && activeProfile.children !== undefined ? activeProfile.children : (requestMsg?.children || 0),
                infants: activeProfile.infants !== null && activeProfile.infants !== undefined ? activeProfile.infants : 0,
                departure_country: activeProfile.departure_country || '',
                language_preference: activeProfile.language_preference || 'English',
                dietary_requirements: activeProfile.dietary_requirements || '',
                medical_conditions: activeProfile.medical_conditions || '',
                accessibility_requirements: activeProfile.accessibility_requirements || '',
                special_notes: activeProfile.special_notes || ''
            },
            request: {
                id: requestId,
                request_type: requestMsg?.request_type || 'custom-plan',
                status: requestMsg?.status || 'Pending'
            },
            team
        };
    }

    export async function save(tourId: string, data: TouristDataDTO): Promise<void> {
        const supabaseAdmin = createAdminClient();

        // 1. Fetch tour to get tourist_id and request_id
        const { data: tour, error: tourErr } = await supabaseAdmin
            .from('tours')
            .select('request_id, tourist_id')
            .eq('id', tourId)
            .single();

        if (tourErr) throw tourErr;
        if (!tour) throw new Error("Tour not found");

        const touristId = tour.tourist_id;
        const requestId = tour.request_id;

        // 2. Update tours table basic start/end dates
        const { error: tourUpdateErr } = await supabaseAdmin
            .from('tours')
            .update({
                start_date: data.preferences.arrival_date || null,
                end_date: data.preferences.departure_date || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', tourId);

        if (tourUpdateErr) throw tourUpdateErr;

        // 3. Upsert tourist_profiles table
        const { error: profileErr } = await supabaseAdmin
            .from('tourist_profiles')
            .upsert({
                id: touristId,
                first_name: data.profile.first_name || null,
                last_name: data.profile.last_name || null,
                phone: data.profile.phone || null,
                country: data.profile.country || null,
                passport_number: data.profile.passport_number || null,
                address: data.profile.address || null,
                adults: data.preferences.adults ?? 2,
                children: data.preferences.children ?? 0,
                infants: data.preferences.infants ?? 0,
                arrival_date: data.preferences.arrival_date || null,
                departure_date: data.preferences.departure_date || null,
                duration_days: data.preferences.duration_days ?? 0,
                budget_total: data.preferences.budget_total ?? 0,
                budget_per_person: data.preferences.budget_per_person ?? 0,
                travel_style: data.preferences.travel_style || 'Luxury',
                departure_country: data.preferences.departure_country || null,
                dietary_requirements: data.preferences.dietary_requirements || null,
                medical_conditions: data.preferences.medical_conditions || null,
                accessibility_requirements: data.preferences.accessibility_requirements || null,
                language_preference: data.preferences.language_preference || 'English',
                special_notes: data.preferences.special_notes || null,
                updated_at: new Date().toISOString()
            });

        if (profileErr) throw profileErr;

        // 4. request_details updates removed

        // 5. Update user email if provided
        if (touristId && data.profile.email) {
            const { error: userUpdateErr } = await supabaseAdmin
                .from('users')
                .update({
                    email: data.profile.email,
                    updated_at: new Date().toISOString()
                })
                .eq('id', touristId);

            if (userUpdateErr) {
                console.error("Failed to save user email:", userUpdateErr);
            }
        }

        // 6. Sync tourist_team table
        // Delete existing team rows
        const { error: deleteTeamErr } = await supabaseAdmin
            .from('tourist_team')
            .delete()
            .eq('tour_id', tourId);

        if (deleteTeamErr) throw deleteTeamErr;

        // Insert new team rows
        if (data.team && data.team.length > 0) {
            const teamRows = data.team.map(t => ({
                id: isUuid(t.id) ? t.id : undefined,
                tour_id: tourId,
                tourist_id: touristId,
                full_name: t.full_name,
                passport_number: t.passport_number || null,
                nationality: t.nationality || null,
                date_of_birth: t.date_of_birth || null,
                gender: t.gender || null,
                dietary_preferences: t.dietary_preferences || null,
                meal_preference: t.meal_preference || 'Standard',
                room_preference: t.room_preference || 'Double',
                medical_notes: t.medical_notes || null
            }));

            const { error: insertTeamErr } = await supabaseAdmin
                .from('tourist_team')
                .insert(teamRows);

            if (insertTeamErr) throw insertTeamErr;
        }
    }
}
