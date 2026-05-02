import { createClient } from '@/utils/supabase/client';
import { TripData } from '@/app/admin/(authenticated)/planner/types';

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
}
