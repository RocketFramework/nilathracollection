import { createAdminClient } from '@/utils/supabase/admin';

export type NotificationStatus = 'unread' | 'read';

export interface NotificationPayload {
    action_owner_id: string;
    action_description: string;
    action_waiting?: string;
    action_duration?: number;
    action_page?: string;
    reference_type?: string;
    reference_id?: string;
    status?: NotificationStatus;
}

export interface NotificationRecord extends NotificationPayload {
    id: string;
    action_date: string;
}

export class NotificationService {
    
    static async createNotification(payload: NotificationPayload) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('notifications')
            .insert([{
                ...payload,
                status: payload.status || 'unread'
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating notification:', error);
            throw new Error(error.message);
        }
        return data as NotificationRecord;
    }

    static async logQuoteRequest(userId: string, vendorName: string, vendorEmail: string, pageUrl: string, referenceId?: string, referenceType?: string) {
        return this.createNotification({
            action_owner_id: userId,
            action_description: `Quotation request sent to ${vendorName}`,
            action_waiting: `Awaiting email response from ${vendorEmail}`,
            action_duration: 3,
            action_page: pageUrl,
            reference_type: referenceType,
            reference_id: referenceId,
            status: 'unread'
        });
    }

    static async getMyNotifications(userId: string) {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('action_owner_id', userId)
            .order('action_date', { ascending: false });

        if (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
        return data as NotificationRecord[];
    }

    static async markAsRead(id: string, userId: string) {
        const supabase = createAdminClient();

        const { error } = await supabase
            .from('notifications')
            .update({ status: 'read' })
            .eq('id', id)
            .eq('action_owner_id', userId);

        if (error) throw new Error(error.message);
        return true;
    }

    static async deleteNotification(id: string, userId: string) {
        const supabase = createAdminClient();

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('action_owner_id', userId);

        if (error) throw new Error(error.message);
        return true;
    }
}
