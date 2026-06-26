import { createAdminClient } from '@/utils/supabase/admin';
import { CreateQuotationRequestDTO, UpdateQuotationDTO } from '../dtos/quotation.dto';

export class QuotationService {
    /**
     * Creates a new quotation request in the DB and links it to a daily activity / block.
     */
    static async createQuotationRequest(dto: CreateQuotationRequestDTO, createdBy: string) {
        const adminSupabase = createAdminClient();

        // Insert into tour_rfq_emails directly
        const { data: quote, error: qError } = await adminSupabase
            .from('tour_rfq_emails')
            .insert([{
                tour_id: dto.tour_id || null,
                recipient_email: dto.to_email,
                sender_email: dto.from_email || 'concierge@nilathra.com',
                subject: dto.subject,
                body_html: dto.email_content,
                attachments: [],
                po_block_id: dto.po_block_id || null,
                vendor_id: dto.vendor_id || null,
                vendor_name: dto.vendor_name,
                vendor_type: dto.activity_type || null,
                status: 'Sent',
                sent_by: createdBy,
                selected_vendor: false
            }])
            .select()
            .single();

        if (qError) throw qError;

        return quote;
    }

    /**
     * Fetches all quotation requests sent for a specific daily activity.
     */
    static async getQuotationRequestsForActivity(dailyActivityId: string) {
        const adminSupabase = createAdminClient();
        
        // 1. Get the po_block_id mapping
        const { data: mapping } = await adminSupabase
            .from('po_block_daily_activities')
            .select('po_block_id')
            .eq('daily_activity_id', dailyActivityId)
            .maybeSingle();

        if (!mapping || !mapping.po_block_id) {
            return [];
        }

        // 2. Fetch all tour_rfq_emails for this block
        const { data, error } = await adminSupabase
            .from('tour_rfq_emails')
            .select('*')
            .eq('po_block_id', mapping.po_block_id);

        if (error) throw error;
        return data || [];
    }

    /**
     * Updates details (e.g. status, quoted price, replied date, notes) on an existing quotation request.
     */
    static async updateQuotation(id: string, updates: UpdateQuotationDTO) {
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
            .from('tour_rfq_emails')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Selects a single vendor quotation for an activity. 
     * This marks the selected quotation as 'Selected' and all other quotations for the activity/block as 'Sent'.
     */
    static async selectQuotation(quoteId: string, dailyActivityId: string) {
        const adminSupabase = createAdminClient();

        // 1. Fetch the selected RFQ email record
        const { data: quote, error: quoteErr } = await adminSupabase
            .from('tour_rfq_emails')
            .select('*')
            .eq('id', quoteId)
            .single();

        if (quoteErr) throw quoteErr;
        if (!quote.po_block_id) throw new Error("This quotation is not associated with a PO Block.");

        // 2. Fetch the PO Block to determine block_type
        const { data: block, error: blockErr } = await adminSupabase
            .from('po_blocks')
            .select('*')
            .eq('id', quote.po_block_id)
            .single();

        if (blockErr) throw blockErr;

        // 3. Mark all quotation emails for this block as not selected
        const { error: resetErr } = await adminSupabase
            .from('tour_rfq_emails')
            .update({ selected_vendor: false, status: 'Sent' })
            .eq('po_block_id', quote.po_block_id);

        if (resetErr) throw resetErr;

        // 4. Mark the chosen quotation email as Selected
        const { data: updatedQuote, error: selectErr } = await adminSupabase
            .from('tour_rfq_emails')
            .update({ selected_vendor: true, status: 'Selected' })
            .eq('id', quoteId)
            .select()
            .single();

        if (selectErr) throw selectErr;

        // 5. Fetch daily activities mapped to this block
        const { data: mappings } = await adminSupabase
            .from('po_block_daily_activities')
            .select('daily_activity_id')
            .eq('po_block_id', quote.po_block_id);

        const activityIds = mappings?.map(m => m.daily_activity_id) || [];

        // 6. Update the hotel_id / restaurant_id / transport_id / vendor_id on the daily activities
        if (activityIds.length > 0) {
            const updates: any = {};
            if (block.block_type === 'sleep' || block.block_type === 'accommodation') {
                updates.hotel_id = quote.vendor_id;
            } else if (block.block_type === 'meal') {
                updates.restaurant_id = quote.vendor_id;
            } else if (block.block_type === 'travel') {
                updates.transport_id = quote.vendor_id;
            } else if (block.block_type === 'activity') {
                updates.vendor_id = quote.vendor_id;
            }

            if (Object.keys(updates).length > 0) {
                const { error: actUpdateErr } = await adminSupabase
                    .from('daily_activities')
                    .update(updates)
                    .in('id', activityIds);
                
                if (actUpdateErr) throw actUpdateErr;
            }
        }

        return updatedQuote;
    }

    /**
     * Fetches all quotation requests sent for a specific tour.
     */
    static async getQuotationRequestsForTour(tourId: string) {
        const adminSupabase = createAdminClient();

        // 1. Fetch all RFQ emails for this tour
        const { data: emails, error: emailErr } = await adminSupabase
            .from('tour_rfq_emails')
            .select('*')
            .eq('tour_id', tourId);

        if (emailErr) throw emailErr;
        if (!emails || emails.length === 0) return [];

        // 2. Fetch all mappings for blocks of this tour to map daily_activity_id
        const blockIds = emails.map(e => e.po_block_id).filter(Boolean);
        let mappings: any[] = [];
        if (blockIds.length > 0) {
            const { data: mapData } = await adminSupabase
                .from('po_block_daily_activities')
                .select('*')
                .in('po_block_id', blockIds);
            mappings = mapData || [];
        }

        const result: any[] = [];
        for (const email of emails) {
            const blockMappings = mappings.filter(m => m.po_block_id === email.po_block_id);
            if (blockMappings.length > 0) {
                blockMappings.forEach(bm => {
                    result.push({
                        daily_activity_id: bm.daily_activity_id,
                        quotation: email
                    });
                });
            } else {
                result.push({
                    daily_activity_id: null,
                    quotation: email
                });
            }
        }

        return result;
    }
}
