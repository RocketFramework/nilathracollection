import { createAdminClient } from '@/utils/supabase/admin';
import { TourSharedEmail } from '@/other/interfaces';
import { LogSharedEmailDTO } from '@/dtos/email-history.dto';

export class TourSharedEmailService {
    static async logSharedEmail(data: LogSharedEmailDTO, client?: any): Promise<string> {
        const db = client || createAdminClient();
        const { data: inserted, error } = await db
            .from('tour_shared_emails')
            .insert([{
                tour_id: data.tour_id,
                recipient_email: data.recipient_email,
                sender_email: data.sender_email,
                subject: data.subject,
                body_html: data.body_html,
                attachments: data.attachments,
                sent_by: data.sent_by || null,
                type: data.type || 'share-tourist'
            }])
            .select('id')
            .single();

        if (error) throw error;
        return inserted.id;
    }

    static async getSharedEmailsByTourId(tourId: string, client?: any): Promise<TourSharedEmail[]> {
        const db = client || createAdminClient();
        const { data, error } = await db
            .from('tour_shared_emails')
            .select('*')
            .eq('tour_id', tourId)
            .order('shared_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
}

