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
    shared_with_ids?: string[];
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

        // 2. Fetch the request record directly from requests table using request_id
        let requestMsg: any = null;
        if (requestId) {
            const { data: r } = await supabaseAdmin
                .from('requests')
                .select('*')
                .eq('id', requestId)
                .maybeSingle();
            requestMsg = r;
        }

        // If request_id wasn't set on tour, try finding the latest request by tourist_id
        if (!requestMsg && touristId) {
            const { data: r } = await supabaseAdmin
                .from('requests')
                .select('*')
                .eq('tourist_id', touristId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            requestMsg = r;
        }

        // 3. Fetch tourist profile and user email (if touristId exists)
        let activeProfile: any = {};
        let userRow: any = null;

        if (touristId) {
            const [{ data: p }, { data: u }] = await Promise.all([
                supabaseAdmin.from('tourist_profiles').select('*').eq('id', touristId).maybeSingle(),
                supabaseAdmin.from('users').select('email').eq('id', touristId).maybeSingle()
            ]);
            activeProfile = p || {};
            userRow = u;
        }

        // 4. Fetch team members for this tour
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
            medical_notes: row.medical_notes || '',
            shared_with_ids: row.shared_with_ids || []
        }));

        // Parse client name from requests table
        const nameParts = (requestMsg?.name || '').trim().split(/\s+/);
        const reqFirstName = nameParts[0] || '';
        const reqLastName = nameParts.slice(1).join(' ') || '';

        const firstName = reqFirstName || activeProfile.first_name || '';
        const lastName = reqLastName || activeProfile.last_name || '';
        const email = requestMsg?.email || userRow?.email || activeProfile.email || '';
        const phone = requestMsg?.phone_number || activeProfile.phone || '';
        const departureCountry = requestMsg?.departure_country || activeProfile.departure_country || activeProfile.country || '';

        const arrivalDate = requestMsg?.start_date || tour.start_date || activeProfile.arrival_date || '';
        const departureDate = activeProfile.departure_date || tour.end_date || (() => {
            if (requestMsg?.start_date && requestMsg?.duration_nights) {
                const d = new Date(requestMsg.start_date);
                d.setDate(d.getDate() + Number(requestMsg.duration_nights));
                return d.toISOString().split('T')[0];
            }
            return '';
        })();

        const durationDays = requestMsg?.duration_nights ? (Number(requestMsg.duration_nights) + (requestMsg.start_date ? 1 : 0)) : (Number(activeProfile.duration_days) || 0);
        const budgetTotal = Number(requestMsg?.budget) || Number(activeProfile.budget_total) || 0;
        const adults = requestMsg?.adults !== null && requestMsg?.adults !== undefined ? requestMsg.adults : (activeProfile.adults ?? 2);
        const children = requestMsg?.children !== null && requestMsg?.children !== undefined ? requestMsg.children : (activeProfile.children ?? 0);
        const infants = requestMsg?.infants !== null && requestMsg?.infants !== undefined ? requestMsg.infants : (activeProfile.infants ?? 0);
        const specialNotes = requestMsg?.note || activeProfile.special_notes || '';

        return {
            profile: {
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone,
                country: departureCountry,
                passport_number: activeProfile.passport_number || '',
                address: activeProfile.address || ''
            },
            preferences: {
                travel_style: (activeProfile.travel_style || 'Luxury') as TravelStyle,
                budget_total: budgetTotal,
                budget_per_person: Number(activeProfile.budget_per_person) || (budgetTotal && adults ? budgetTotal / adults : 0),
                arrival_date: arrivalDate,
                departure_date: departureDate,
                duration_days: durationDays,
                adults: adults,
                children: children,
                infants: infants,
                departure_country: departureCountry,
                language_preference: activeProfile.language_preference || 'English',
                dietary_requirements: activeProfile.dietary_requirements || '',
                medical_conditions: activeProfile.medical_conditions || '',
                accessibility_requirements: activeProfile.accessibility_requirements || '',
                special_notes: specialNotes
            },
            request: {
                id: requestMsg?.id || requestId || '',
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

        // 3. Upsert tourist_profiles table if touristId exists
        if (touristId) {
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

            // Update user email if provided
            if (data.profile.email) {
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
        }

        // 4. Update requests table if requestId exists
        if (requestId) {
            const fullName = `${data.profile.first_name || ''} ${data.profile.last_name || ''}`.trim();
            const { error: reqUpdateErr } = await supabaseAdmin
                .from('requests')
                .update({
                    name: fullName || null,
                    email: data.profile.email || null,
                    phone_number: data.profile.phone || null,
                    departure_country: data.preferences.departure_country || data.profile.country || null,
                    budget: data.preferences.budget_total || null,
                    start_date: data.preferences.arrival_date || null,
                    adults: data.preferences.adults ?? 2,
                    children: data.preferences.children ?? 0,
                    infants: data.preferences.infants ?? 0,
                    note: data.preferences.special_notes || null
                })
                .eq('id', requestId);

            if (reqUpdateErr) {
                console.error("Failed to update requests table:", reqUpdateErr);
            }
        }

        // 5. Sync tourist_team table
        const { error: deleteTeamErr } = await supabaseAdmin
            .from('tourist_team')
            .delete()
            .eq('tour_id', tourId);

        if (deleteTeamErr) throw deleteTeamErr;

        if (data.team && data.team.length > 0) {
            const teamRows = data.team.map(t => ({
                id: isUuid(t.id) ? t.id : crypto.randomUUID(),
                tour_id: tourId,
                tourist_id: touristId || null,
                full_name: t.full_name,
                passport_number: t.passport_number || null,
                nationality: t.nationality || null,
                date_of_birth: t.date_of_birth || null,
                gender: t.gender || null,
                dietary_preferences: t.dietary_preferences || null,
                meal_preference: t.meal_preference || 'Standard',
                room_preference: t.room_preference || 'Double',
                medical_notes: t.medical_notes || null,
                shared_with_ids: t.shared_with_ids || []
            }));

            const { error: insertTeamErr } = await supabaseAdmin
                .from('tourist_team')
                .insert(teamRows);

            if (insertTeamErr) throw insertTeamErr;
        }
    }
}
