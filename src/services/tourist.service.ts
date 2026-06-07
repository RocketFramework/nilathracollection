import { createClient } from '@/utils/supabase/client';
import { createAdminClient } from '@/utils/supabase/admin';
import { TripData } from '@/app/admin/(authenticated)/planner/types';
import { TouristDataDTO, TouristTeamMemberDTO } from '@/dtos/tourist-data.dto';
import { Gender, TravelStyle } from '@/types/types';

const isUuid = (val: any) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export class TouristService {
    /**
     * Gets all tours for the currently authenticated tourist that are marked as 'Review Ready', 'Active', or 'Completed'.
     * Draft tours are hidden.
     */
    static async getMyTours() {
        const supabase = createClient();

        // 1. Get current user
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) throw new Error("Not authenticated");

        // 2. Fetch tours where status is NOT 'Draft' or 'Pending' (depending on exact naming conventions, let's assume 'Review Ready', 'Active', 'Completed')
        const { data, error } = await supabase
            .from('tours')
            .select(`
                id,
                title,
                status,
                start_date,
                end_date,
                planner_data,
                agent:users!tours_agent_id_fkey(
                    email,
                    admin_profile:admin_profiles(first_name, last_name),
                    agent_profile:agent_profiles(first_name, last_name, phone)
                )
            `)
            .eq('tourist_id', user.id)
            .in('status', ['Draft', 'Review Ready', 'Active', 'Completed'])
            .order('start_date', { ascending: true });

        if (error) throw error;

        // Map to UI friendly format
        return data.map(tour => {
            const agentData = Array.isArray(tour.agent) ? tour.agent[0] : tour.agent;
            
            const agentProfRaw = agentData?.agent_profile;
            const adminProfRaw = agentData?.admin_profile;
            
            const agentProfile = (Array.isArray(agentProfRaw) ? agentProfRaw[0] : agentProfRaw) || 
                                 (Array.isArray(adminProfRaw) ? adminProfRaw[0] : adminProfRaw) || {};
                                 
            const tripData = tour.planner_data as unknown as TripData || {};

            // Extract locations from planner data or fallback
            // We assume the tripData.itinerary has destinations or we use the profile
            const locations: string[] = []; // TripProfile does not have destinations

            return {
                id: tour.id,
                title: tour.title,
                status: tour.status,
                startDate: tour.start_date,
                endDate: tour.end_date,
                locations: locations, // Will need refinement based on exact TripData structure
                agent: {
                    name: agentProfile.first_name ? `${agentProfile.first_name} ${agentProfile.last_name}` : 'Assigned Agent',
                    phone: agentProfile.phone || 'N/A',
                    email: agentData?.email || 'N/A'
                },
                // Mocking invoices for now until financials table is fully integrated
                invoicesSummary: { pendingCount: 0, totalValue: tripData.financials?.sellingPrice || 0 }
            };
        });
    }

    /**
     * Get a specific tour details for the tourist.
     */
    static async getTourDetails(tourId: string) {
        const supabase = createClient();

        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) throw new Error("Not authenticated");

        const { data, error } = await supabase
            .from('tours')
            .select(`
                *,
                agent:users!tours_agent_id_fkey(
                    email,
                    admin_profile:admin_profiles(first_name, last_name),
                    agent_profile:agent_profiles(first_name, last_name, phone)
                ),
                itineraries:tour_itineraries(
                    day_number,
                    title,
                    daily_activities(title, time_start)
                )
            `)
            .eq('id', tourId)
            .eq('tourist_id', user.id)
            .single();

        if (error) throw error;

        // Map data to match the UI expectations
        const agentData = Array.isArray(data.agent) ? data.agent[0] : data.agent;
        
        const agentProfRaw = agentData?.agent_profile;
        const adminProfRaw = agentData?.admin_profile;
        
        const agentProfile = (Array.isArray(agentProfRaw) ? agentProfRaw[0] : agentProfRaw) || 
                             (Array.isArray(adminProfRaw) ? adminProfRaw[0] : adminProfRaw) || {};
                             
        const tripData = data.planner_data as unknown as TripData || {};

        // Sort itineraries by day
        const sortedItineraries = (data.itineraries || []).sort((a: any, b: any) => a.day_number - b.day_number);

        const summary = sortedItineraries.map((itin: any) => {
            // Try to find the hotel for the day from the planner data if available, or just use the first activity
            const activities = itin.daily_activities || [];
            const firstActivity = activities[0]?.title || 'Day Activities';

            return {
                day: itin.day_number,
                title: itin.title || `Day ${itin.day_number}`,
                hotel: 'See detailed itinerary' // Could extract from tripData
            };
        });

        return {
            title: data.title,
            status: data.status,
            destinations: [], // TripProfile does not have destinations
            startDate: data.start_date,
            durationDays: tripData.profile?.durationDays || 0,
            travelers: `${tripData.profile?.adults || 0} Adults${tripData.profile?.children > 0 ? `, ${tripData.profile.children} Children` : ''}`,
            totalPrice: `$${tripData.financials?.sellingPrice || 0} USD`,
            paidAmount: "$0 USD", // Requires financials integration
            agent: {
                name: agentProfile.first_name ? `${agentProfile.first_name} ${agentProfile.last_name || ''}`.trim() : (agentData?.email ? agentData.email.split('@')[0].charAt(0).toUpperCase() + agentData.email.split('@')[0].slice(1).replace(/[^a-zA-Z]/g, ' ') : 'Assigned Agent'),
                phone: agentProfile.phone || 'N/A',
                email: agentData?.email || 'N/A',
                photoInitials: agentProfile.first_name ? agentProfile.first_name.charAt(0) : (agentData?.email ? agentData.email.charAt(0).toUpperCase() : 'A')
            },
            invoices: [], // Requires invoices integration
            itinerarySummary: summary,
            detailedItinerary: tripData.itinerary || [],
            accommodations: tripData.accommodations || [],
            rawPlannerData: tripData
        };
    }
    static async addCommentToBlock(tourId: string, blockId: string, role: 'agent' | 'tourist', text: string) {
        const supabase = createClient();
        
        // Ensure user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Fetch current tour planner_data
        let query = supabase.from('tours').select('planner_data').eq('id', tourId);
        
        // If tourist, ensure they own it. Admin/Agent policies handle the rest automatically in RLS but we can be safe.
        if (role === 'tourist') {
            query = query.eq('tourist_id', user.id);
        }

        const { data: tour, error: fetchErr } = await query.single();

        if (fetchErr || !tour) throw new Error("Tour not found or access denied");

        const plannerData = tour.planner_data as unknown as TripData;
        if (!plannerData || !plannerData.itinerary) throw new Error("Itinerary not found in tour");

        // Update the block
        let blockFound = false;
        plannerData.itinerary = plannerData.itinerary.map(block => {
            if (block.id === blockId) {
                blockFound = true;
                const newComment = {
                    id: crypto.randomUUID(),
                    role,
                    text,
                    timestamp: new Date().toISOString()
                };
                const comments = block.comments ? [...block.comments, newComment] : [newComment];
                return { ...block, comments };
            }
            return block;
        });

        if (!blockFound) throw new Error("Block not found in itinerary");

        // Save back to DB
        const { error: updateErr } = await supabase
            .from('tours')
            .update({ planner_data: plannerData as any })
            .eq('id', tourId);

        if (updateErr) throw updateErr;
        return true;
    }

    static async getTouristData(tourId: string): Promise<TouristDataDTO> {
        const supabaseAdmin = createAdminClient();

        // 1. Fetch the tour info to get request_id and tourist_id
        const { data: tour, error: tourErr } = await supabaseAdmin
            .from('tours')
            .select('request_id, tourist_id, start_date, end_date')
            .eq('id', tourId)
            .single();

        if (tourErr) throw tourErr;
        if (!tour) throw new Error("Tour not found");

        // 2. Fetch the tourist profile
        const { data: profile, error: profileErr } = await supabaseAdmin
            .from('tourist_profiles')
            .select('*')
            .eq('id', tour.tourist_id)
            .single();

        // Note: if profileErr because it doesn't exist, we fallback to empty profile
        const activeProfile = profile || {};

        // 3. Fetch the request details
        const { data: requestMsg, error: reqError } = await supabaseAdmin
            .from('requests')
            .select(`
                *,
                details:request_details(*)
            `)
            .eq('id', tour.request_id)
            .single();

        const reqDetails = requestMsg?.details?.[0] || {};

        // 4. Fetch the tourist team members
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

        // 5. Construct TouristDataDTO
        return {
            profile: {
                first_name: activeProfile.first_name || '',
                last_name: activeProfile.last_name || '',
                email: requestMsg?.email || '',
                phone: activeProfile.phone || '',
                country: activeProfile.country || '',
                passport_number: activeProfile.passport_number || '',
                address: activeProfile.address || ''
            },
            preferences: {
                travel_style: (activeProfile.travel_style || 'Luxury') as TravelStyle,
                budget_total: Number(activeProfile.budget_total) || 0,
                budget_per_person: Number(activeProfile.budget_per_person) || 0,
                arrival_date: activeProfile.arrival_date || tour.start_date || reqDetails.start_date || '',
                departure_date: activeProfile.departure_date || tour.end_date || reqDetails.end_date || '',
                duration_days: Number(activeProfile.duration_days) || 0,
                adults: activeProfile.adults !== null && activeProfile.adults !== undefined ? activeProfile.adults : (requestMsg?.adults || reqDetails.adults || 2),
                children: activeProfile.children !== null && activeProfile.children !== undefined ? activeProfile.children : (requestMsg?.children || reqDetails.children || 0),
                infants: activeProfile.infants !== null && activeProfile.infants !== undefined ? activeProfile.infants : 0,
                departure_country: activeProfile.departure_country || '',
                language_preference: activeProfile.language_preference || 'English',
                dietary_requirements: activeProfile.dietary_requirements || '',
                medical_conditions: activeProfile.medical_conditions || '',
                accessibility_requirements: activeProfile.accessibility_requirements || '',
                special_notes: activeProfile.special_notes || ''
            },
            request: {
                id: tour.request_id,
                request_type: requestMsg?.request_type || 'custom-plan',
                status: requestMsg?.status || 'Pending',
                package_name: reqDetails.package_name || requestMsg?.name || '',
                nights: reqDetails.nights || requestMsg?.duration_nights || 0,
                estimated_price: Number(reqDetails.estimated_price) || Number(requestMsg?.budget) || 0,
                destinations: reqDetails.destinations || [],
                special_requirements: reqDetails.special_requirements || requestMsg?.note || '',
                budget_tier: reqDetails.budget_tier || ''
            },
            team
        };
    }

    static async saveTouristData(tourId: string, data: TouristDataDTO) {
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

        // 4. Update request_details table (linked through request_id)
        if (tour.request_id) {
            const { error: reqDetailsErr } = await supabaseAdmin
                .from('request_details')
                .update({
                    package_name: data.request.package_name || null,
                    nights: data.request.nights || null,
                    estimated_price: data.request.estimated_price || null,
                    destinations: data.request.destinations || [],
                    special_requirements: data.request.special_requirements || null,
                    budget_tier: data.request.budget_tier || null,
                    start_date: data.preferences.arrival_date || null,
                    end_date: data.preferences.departure_date || null,
                    adults: data.preferences.adults || null,
                    children: data.preferences.children || null,
                    updated_at: new Date().toISOString()
                })
                .eq('request_id', tour.request_id);

            if (reqDetailsErr) {
                console.error("Failed to save request details:", reqDetailsErr);
            }
        }

        // 5. Sync tourist_team table
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
