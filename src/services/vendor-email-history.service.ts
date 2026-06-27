import { createAdminClient } from '@/utils/supabase/admin';
import { TourRfqEmail, TourRfpEmail } from '@/other/interfaces';
import { LogRfqEmailDTO, LogRfpEmailDTO } from '@/dtos/email-history.dto';

export class VendorEmailHistoryService {
    static async logRfqEmail(data: LogRfqEmailDTO, client?: any): Promise<string> {
        const db = client || createAdminClient();
        const rfqId = (data as any).daily_activity_vendor_id || (data as any).quotation_request_id;

        if (rfqId) {
            const { data: updated, error } = await db
                .from('tour_rfq_emails')
                .update({
                    subject: data.subject,
                    body_html: (data as any).body_html,
                    attachments: data.attachments || [],
                    sent_by: data.sent_by || null,
                    po_block_id: data.po_block_id || null
                })
                .eq('id', rfqId)
                .select('id')
                .maybeSingle();

            if (!error && updated) {
                return updated.id;
            }
        }

        const insertData: any = {
            tour_id: data.tour_id,
            vendor_id: data.vendor_id || null,
            vendor_name: (data as any).vendor_name || null,
            vendor_type: (data as any).vendor_type || null,
            recipient_email: data.recipient_email,
            sender_email: data.sender_email,
            subject: data.subject,
            body_html: (data as any).body_html,
            attachments: data.attachments || [],
            sent_by: data.sent_by || null,
            daily_activity_vendor_id: rfqId || null,
            po_block_id: data.po_block_id || null,
            status: 'Sent'
        };

        const { data: inserted, error } = await db
            .from('tour_rfq_emails')
            .insert([insertData])
            .select('id')
            .single();

        if (error) throw error;
        return inserted.id;
    }

    static async getRfqEmailsByTourId(tourId: string, client?: any): Promise<TourRfqEmail[]> {
        const db = client || createAdminClient();
        const { data, error } = await db
            .from('tour_rfq_emails')
            .select(`
                id,
                tour_id,
                vendor_id,
                vendor_name,
                vendor_type,
                recipient_email,
                sender_email,
                subject,
                body_html,
                attachments,
                sent_at,
                sent_by,
                daily_activity_vendor_id,
                po_block_id,
                status,
                quoted_price,
                updated_at,
                notes,
                selected_vendor
            `)
            .eq('tour_id', tourId)
            .order('sent_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    static async getRfqEmailBody(emailId: string, client?: any): Promise<string> {
        const db = client || createAdminClient();
        const { data, error } = await db
            .from('tour_rfq_emails')
            .select('body_html')
            .eq('id', emailId)
            .single();

        if (error) throw error;
        return data?.body_html || '';
    }

    static async logRfpEmail(data: LogRfpEmailDTO, client?: any): Promise<string> {
        const db = client || createAdminClient();
        const { data: inserted, error } = await db
            .from('tour_rfp_emails')
            .insert([{
                tour_id: data.tour_id,
                purchase_order_id: data.purchase_order_id || null,
                vendor_id: (data as any).vendor_id || null,
                vendor_name: (data as any).vendor_name || null,
                vendor_type: (data as any).vendor_type || null,
                recipient_email: data.recipient_email,
                sender_email: data.sender_email,
                subject: data.subject,
                body_html: (data as any).body_html,
                attachments: data.attachments || [],
                sent_by: data.sent_by || null,
                po_block_id: data.po_block_id || null,
                status: 'Sent'
            }])
            .select('id')
            .single();

        if (error) throw error;
        return inserted.id;
    }

    static async getRfpEmailsByTourId(tourId: string, client?: any): Promise<TourRfpEmail[]> {
        const db = client || createAdminClient();
        const { data, error } = await db
            .from('tour_rfp_emails')
            .select(`
                id,
                tour_id,
                purchase_order_id,
                vendor_id,
                vendor_name,
                vendor_type,
                recipient_email,
                sender_email,
                subject,
                body_html,
                attachments,
                sent_at,
                sent_by,
                po_block_id,
                status,
                updated_at,
                quoted_price,
                notes,
                selected_vendor
            `)
            .eq('tour_id', tourId)
            .order('sent_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    static async getRfpEmailBody(emailId: string, client?: any): Promise<string> {
        const db = client || createAdminClient();
        const { data, error } = await db
            .from('tour_rfp_emails')
            .select('body_html')
            .eq('id', emailId)
            .single();

        if (error) throw error;
        return data?.body_html || '';
    }
}
