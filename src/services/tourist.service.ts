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

        const { data: { user } } = await supabase.auth.getUser();

        let query = supabase
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
            .eq('id', tourId);

        if (user) {
            const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
            if (userData && userData.role === 'tourist') {
                query = query.eq('tourist_id', user.id);
            }
        }

        const { data, error } = await query.maybeSingle();

        if (error || !data) {
            console.error("Error fetching tour in getTourDetails:", error);
            throw new Error("Tour not found or access denied");
        }

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

        // Fetch real financial summary data (preview breakdown, invoices, and payments)
        const adminSupabase = createAdminClient();
        
        let previewItems: { description: string; amount: number }[] = [];
        try {
            const { CustomerInvoiceService } = await import('./customer-invoice.service');
            previewItems = await CustomerInvoiceService.previewInvoiceItems(tourId, {});
        } catch (e) {
            console.warn("Could not preview invoice items for tourist portal:", e);
        }

        let customerInvoices: any[] = [];
        try {
            const { CustomerInvoiceService } = await import('./customer-invoice.service');
            customerInvoices = await CustomerInvoiceService.getCustomerInvoices(tourId);
        } catch (e) {
            console.warn("Could not fetch customer invoices for tourist portal:", e);
        }

        const { data: paymentsData } = await adminSupabase
            .from('customer_payments')
            .select('*')
            .eq('tour_id', tourId)
            .order('payment_date', { ascending: false });

        const tourBuyingRate = Number(data.usd_lkr_buying_rate) || 300;
        const paymentsList = paymentsData || [];
        const totalPaidUSD = paymentsList.reduce((sum: number, p: any) => {
            const amt = Number(p.amount) || 0;
            if (amt === 0) return sum;
            if (!p.currency || p.currency === 'USD') return sum + amt;
            const rate = Number(p.exchange_rate);
            const effRate = (rate && rate > 1.0) ? rate : tourBuyingRate;
            return sum + (effRate > 0 ? amt / effRate : amt);
        }, 0);

        const expectedBudgetTotal = Number(tripData.profile?.budgetTotal || tripData.financials?.sellingPrice || 0);
        const paxCount = Math.max(1, (tripData.profile?.adults || 0) + (tripData.profile?.children || 0));
        const expectedBudgetPerPerson = Number(tripData.profile?.budgetPerPerson || (expectedBudgetTotal > 0 ? expectedBudgetTotal / paxCount : 0));

        const rawDraftCosts = tripData.financials?.draftCosts || [];
        const costBreakdown = (rawDraftCosts && rawDraftCosts.length > 0)
            ? rawDraftCosts.map((item: any) => ({
                category: item.category,
                vendorName: item.vendorName,
                serviceName: item.serviceName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                description: `${item.category ? `[${item.category}] ` : ''}${item.vendorName ? item.vendorName + ' – ' : ''}${item.serviceName}`,
                amount: Number(item.totalPrice) || 0
              }))
            : previewItems;

        const draftTotal = costBreakdown.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
        const officialTotal = (customerInvoices || []).reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0);
        const totalAmount = officialTotal > 0 ? officialTotal : (draftTotal > 0 ? draftTotal : (expectedBudgetTotal > 0 ? expectedBudgetTotal : 0));
        const balanceDue = Math.max(0, totalAmount - totalPaidUSD);

        return {
            title: data.title,
            status: data.status,
            destinations: [], // TripProfile does not have destinations
            startDate: data.start_date,
            durationDays: tripData.profile?.durationDays || sortedItineraries.length || 0,
            travelers: `${tripData.profile?.adults || 0} Adults${tripData.profile?.children > 0 ? `, ${tripData.profile.children} Children` : ''}`,
            expectedBudget: expectedBudgetTotal > 0 ? `$${expectedBudgetTotal.toFixed(2)} USD` : undefined,
            expectedBudgetNum: expectedBudgetTotal,
            expectedBudgetPerPersonNum: expectedBudgetPerPerson,
            totalPrice: `$${totalAmount.toFixed(2)} USD`,
            totalPriceNum: totalAmount,
            paidAmount: `$${totalPaidUSD.toFixed(2)} USD`,
            paidAmountNum: totalPaidUSD,
            balanceDueNum: balanceDue,
            costBreakdown: costBreakdown,
            agent: {
                name: agentProfile.first_name ? `${agentProfile.first_name} ${agentProfile.last_name || ''}`.trim() : (agentData?.email ? agentData.email.split('@')[0].charAt(0).toUpperCase() + agentData.email.split('@')[0].slice(1).replace(/[^a-zA-Z]/g, ' ') : 'Assigned Agent'),
                phone: agentProfile.phone || 'N/A',
                email: agentData?.email || 'N/A',
                photoInitials: agentProfile.first_name ? agentProfile.first_name.charAt(0) : (agentData?.email ? agentData.email.charAt(0).toUpperCase() : 'A')
            },
            invoices: (customerInvoices || []).map((inv: any) => ({
                id: inv.invoice_number || inv.id,
                date: inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'N/A',
                amount: `$${Number(inv.amount || 0).toFixed(2)} USD`,
                amountNum: Number(inv.amount || 0),
                status: inv.status || 'Pending'
            })),
            payments: paymentsList.map((p: any) => ({
                id: p.id,
                date: p.payment_date ? new Date(p.payment_date).toLocaleDateString() : 'N/A',
                amount: `${p.currency || 'USD'} ${Number(p.amount || 0).toFixed(2)}`,
                method: p.payment_method || 'Bank Transfer',
                reference: p.reference_number || 'N/A'
            })),
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
        return TouristDataDTO.pull(tourId);
    }

    static async saveTouristData(tourId: string, data: TouristDataDTO) {
        await TouristDataDTO.save(tourId, data);
    }
}
