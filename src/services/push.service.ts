import webpush from 'web-push';
import { createAdminClient } from '@/utils/supabase/admin';

export interface PushPayload { title: string; body: string; url?: string }

export class PushService {
    private static configured = false;

    private static configure(): boolean {
        if (this.configured) return true;
        const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        const priv = process.env.VAPID_PRIVATE_KEY;
        if (!pub || !priv) return false;
        webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@nilathra.com', pub, priv);
        this.configured = true;
        return true;
    }

    static async saveSubscription(userId: string, sub: { endpoint: string; p256dh: string; auth: string }, userAgent?: string): Promise<void> {
        const { error } = await createAdminClient().from('push_subscriptions').upsert(
            { user_id: userId, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth, user_agent: userAgent ?? null },
            { onConflict: 'endpoint' });
        if (error) throw new Error(error.message);
    }

    /** Best-effort: never throws, prunes expired subscriptions. */
    static async sendToUser(userId: string, payload: PushPayload): Promise<void> {
        if (!this.configure()) return;
        const db = createAdminClient();
        const { data } = await db.from('push_subscriptions').select('*').eq('user_id', userId);
        await Promise.all((data || []).map(async (s: any) => {
            try {
                await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload));
            } catch (e: any) {
                if (e?.statusCode === 404 || e?.statusCode === 410) await db.from('push_subscriptions').delete().eq('id', s.id);
            }
        }));
    }

    /** Morning digest + overdue alerts. Returns number of users notified. */
    static async sendDigests(): Promise<number> {
        const db = createAdminClient();
        const { data } = await db.from('tour_tasks').select('assigned_to, due_at, status').not('status', 'in', '(completed,cancelled)');
        const per: Record<string, { open: number; overdue: number }> = {};
        const now = Date.now();
        (data || []).forEach((t: any) => {
            const p = (per[t.assigned_to] ||= { open: 0, overdue: 0 });
            p.open++;
            if (t.due_at && new Date(t.due_at).getTime() < now) p.overdue++;
        });
        const ids = Object.keys(per);
        await Promise.all(ids.map(id => this.sendToUser(id, {
            title: 'Your tasks today',
            body: `${per[id].open} open${per[id].overdue ? `, ${per[id].overdue} overdue` : ''}`,
            url: '/admin/m-tasks',
        })));
        return ids.length;
    }
}
