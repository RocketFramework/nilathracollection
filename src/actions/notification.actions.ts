'use server'

import { NotificationService } from '@/services/notification.service';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getMyNotificationsAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        const notifications = await NotificationService.getMyNotifications(user.id);
        return { success: true, data: notifications };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function markNotificationAsReadAction(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        await NotificationService.markAsRead(id, user.id);
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function logQuoteRequestAction(vendorName: string, vendorEmail: string, pageUrl: string, referenceId?: string, referenceType?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        await NotificationService.logQuoteRequest(user.id, vendorName, vendorEmail, pageUrl, referenceId, referenceType);
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteNotificationAction(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        await NotificationService.deleteNotification(id, user.id);
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
