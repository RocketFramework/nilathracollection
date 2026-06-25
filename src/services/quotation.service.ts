import { createAdminClient } from '@/utils/supabase/admin';
import { CreateQuotationRequestDTO, UpdateQuotationDTO } from '../dtos/quotation.dto';

export class QuotationService {
    /**
     * Creates a new quotation request in the DB and links it to a daily activity.
     */
    static async createQuotationRequest(dto: CreateQuotationRequestDTO, createdBy: string) {
        const adminSupabase = createAdminClient();

        // 1. Insert into daily_activity_vendors table (replaces quotation_request)
        const { data: quote, error: qError } = await adminSupabase
            .from('daily_activity_vendors')
            .insert([{
                vendor_id: dto.vendor_id || null,
                vendor_name: dto.vendor_name,
                to_email: dto.to_email,
                from_email: dto.from_email,
                subject: dto.subject,
                email_content: dto.email_content,
                status: 'Sent',
                created_by: createdBy,
                vendor_type: dto.activity_type || null,
                tour_id: dto.tour_id || null,
                po_block_id: dto.po_block_id || null
            }])
            .select()
            .single();

        if (qError) throw qError;

        // 2. Fetch daily activities to get the correct tour_id and itinerary_id from the database
        let activityIds = dto.daily_activity_ids && dto.daily_activity_ids.length > 0
            ? dto.daily_activity_ids
            : [dto.daily_activity_id].filter(Boolean) as string[];

        if (dto.po_block_id && activityIds.length === 0) {
            const { data: blockActs } = await adminSupabase
                .from('po_block_daily_activities')
                .select('daily_activity_id')
                .eq('po_block_id', dto.po_block_id);
            if (blockActs) {
                activityIds = blockActs.map(ba => ba.daily_activity_id);
            }
        }

        let dbActivities: { id: string; tour_id: string | null; itinerary_id: string | null }[] = [];
        if (activityIds.length > 0) {
            const { data: acts, error: actsErr } = await adminSupabase
                .from('daily_activities')
                .select('id, tour_id, itinerary_id')
                .in('id', activityIds);
            if (!actsErr && acts) {
                dbActivities = acts;
            }
        }

        // Dynamically resolve tour_id
        let resolvedTourId = dto.tour_id;
        if (!resolvedTourId) {
            const foundTourId = dbActivities.find(a => a.tour_id)?.tour_id;
            if (foundTourId) {
                resolvedTourId = foundTourId;
            }
        }
        if (!resolvedTourId && dto.itinerary_id) {
            const { data: itin } = await adminSupabase
                .from('tour_itineraries')
                .select('tour_id')
                .eq('id', dto.itinerary_id)
                .single();
            if (itin && itin.tour_id) {
                resolvedTourId = itin.tour_id;
            }
        }

        // If tour_id was resolved but not set in step 1, backfill it on the vendor record
        if (resolvedTourId && !quote.tour_id) {
            await adminSupabase
                .from('daily_activity_vendors')
                .update({ tour_id: resolvedTourId })
                .eq('id', quote.id);
            quote.tour_id = resolvedTourId;
        }

        const mappings = activityIds.map(actId => {
            const dbAct = dbActivities.find(a => a.id === actId);
            const resolvedItinId = dbAct?.itinerary_id || dto.itinerary_id;
            const resolvedActTourId = dbAct?.tour_id || resolvedTourId || null;
            return {
                daily_activity_id: actId,
                tour_id: resolvedActTourId,
                itinerary_id: resolvedItinId,
                activity_type: dto.activity_type,
                daily_activity_vendor_id: quote.id
            };
        });

        if (mappings.length > 0) {
            const { error: mError } = await adminSupabase
                .from('daily_activity_vendor_links')
                .insert(mappings);

            if (mError) {
                // Rollback the quotation request insert if mapping fails
                await adminSupabase.from('daily_activity_vendors').delete().eq('id', quote.id);
                throw mError;
            }
        }

        return quote;
    }

    /**
     * Fetches all quotation requests sent for a specific daily activity.
     */
    static async getQuotationRequestsForActivity(dailyActivityId: string) {
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
            .from('daily_activity_vendor_links')
            .select(`
                *,
                quotation:daily_activity_vendor_id (
                    *
                )
            `)
            .eq('daily_activity_id', dailyActivityId);

        if (error) throw error;
        if (!data) return [];
        return data.map((m: any) => m.quotation).filter(Boolean);
    }

    /**
     * Updates details (e.g. status, quoted price, replied date, notes) on an existing quotation request.
     */
    static async updateQuotation(id: string, updates: UpdateQuotationDTO) {
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
            .from('daily_activity_vendors')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Selects a single vendor quotation for an activity. 
     * This marks the selected quotation as 'Selected' and all other quotations for the activity as 'Sent'.
     */
    static async selectQuotation(quoteId: string, dailyActivityId: string) {
        const adminSupabase = createAdminClient();

        // 1. Fetch all daily activities mapped to this quotation request
        const { data: quoteMappings, error: quoteMapErr } = await adminSupabase
            .from('daily_activity_vendor_links')
            .select('daily_activity_id')
            .eq('daily_activity_vendor_id', quoteId);
            
        if (quoteMapErr) throw quoteMapErr;
        
        const activityIds = quoteMappings ? quoteMappings.map((m: any) => m.daily_activity_id).filter(Boolean) : [];
        if (!activityIds.includes(dailyActivityId)) {
            activityIds.push(dailyActivityId);
        }

        // 2. Fetch all other quotation request mappings for all these daily activities
        const { data: allMappings, error: allMapErr } = await adminSupabase
            .from('daily_activity_vendor_links')
            .select('daily_activity_vendor_id')
            .in('daily_activity_id', activityIds);
        
        if (allMapErr) throw allMapErr;

        const allQuoteIds = allMappings ? allMappings.map((m: any) => m.daily_activity_vendor_id).filter(Boolean) : [];
        
        // 3. Mark all as non-selected / Sent status first
        if (allQuoteIds.length > 0) {
            const { error: resetErr } = await adminSupabase
                .from('daily_activity_vendors')
                .update({ selected_vendor: false, status: 'Sent' })
                .in('id', allQuoteIds);
            if (resetErr) throw resetErr;
        }

        // 4. Mark the target quote as Selected
        const { data: quote, error: selectErr } = await adminSupabase
            .from('daily_activity_vendors')
            .update({ selected_vendor: true, status: 'Selected' })
            .eq('id', quoteId)
            .select()
            .single();

        if (selectErr) throw selectErr;
        return quote;
    }

    /**
     * Fetches all quotation requests sent for a specific tour.
     */
    static async getQuotationRequestsForTour(tourId: string) {
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
            .from('daily_activity_vendor_links')
            .select(`
                daily_activity_id,
                quotation:daily_activity_vendor_id (
                    *
                )
            `)
            .eq('tour_id', tourId);

        if (error) throw error;
        if (!data) return [];
        return data.filter((m: any) => m.quotation).map((m: any) => ({
            daily_activity_id: m.daily_activity_id,
            quotation: m.quotation
        }));
    }
}
