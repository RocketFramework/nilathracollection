import { createAdminClient } from '@/utils/supabase/admin';
import type { TaskDTO } from '@/dtos/task.dto';

const TEXT_LK_ENDPOINT = 'https://app.text.lk/api/v3/sms/send';

export class SmsService {
    /**
     * Normalizes a phone number into Text.lk's expected international format without '+' (e.g. 94771234567).
     */
    static normalizePhone(raw?: string | null): string | null {
        if (!raw) return null;
        const digits = String(raw).replace(/[^\d+]/g, '').replace(/^\+/, '');
        if (!digits) return null;

        // 07XXXXXXXX (10 digits starting with 0) -> 947XXXXXXXX
        if (digits.length === 10 && digits.startsWith('0')) {
            return '94' + digits.slice(1);
        }
        // 7XXXXXXXX (9 digits starting with 7) -> 947XXXXXXXX
        if (digits.length === 9 && digits.startsWith('7')) {
            return '94' + digits;
        }
        return digits;
    }

    /**
     * Resolves a user's phone number across staff profile tables and Supabase Auth metadata.
     */
    static async getUserPhone(userId: string): Promise<string | null> {
        if (!userId) return null;
        const db = createAdminClient();

        const [
            { data: agent },
            { data: supervisor },
            { data: admin },
            { data: finance },
        ] = await Promise.all([
            db.from('agent_profiles').select('phone').eq('id', userId).maybeSingle(),
            db.from('agent_supervisor_profiles').select('phone').eq('id', userId).maybeSingle(),
            db.from('admin_profiles').select('phone').eq('id', userId).maybeSingle(),
            db.from('finance_profiles').select('phone').eq('id', userId).maybeSingle(),
        ]);

        const profilePhone =
            agent?.phone ||
            supervisor?.phone ||
            admin?.phone ||
            finance?.phone ||
            null;

        if (profilePhone) {
            return this.normalizePhone(profilePhone);
        }

        try {
            const { data: authData } = await db.auth.admin.getUserById(userId);
            const metaPhone =
                authData?.user?.user_metadata?.phone ||
                authData?.user?.phone ||
                null;
            return this.normalizePhone(metaPhone);
        } catch {
            return null;
        }
    }

    /**
     * Sends a plain-text SMS via Text.lk API v3.
     * Best-effort: logs warnings/errors without throwing so caller workflows are not blocked.
     */
    static async sendSms(recipientPhone: string, message: string): Promise<boolean> {
        const apiToken = process.env.TEXT_LK_API_TOKEN || process.env.TEXTLK_API_KEY;
        const senderId = process.env.TEXT_LK_SENDER_ID || 'Nilathra';

        if (!apiToken) {
            console.warn('[SmsService] TEXT_LK_API_TOKEN is not configured. Skipping SMS send.');
            return false;
        }

        const normalizedRecipient = this.normalizePhone(recipientPhone);
        if (!normalizedRecipient) {
            console.warn('[SmsService] Invalid recipient phone number:', recipientPhone);
            return false;
        }

        try {
            const res = await fetch(TEXT_LK_ENDPOINT, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    recipient: normalizedRecipient,
                    sender_id: senderId,
                    type: 'plain',
                    message,
                }),
            });

            if (!res.ok) {
                const errText = await res.text().catch(() => '');
                console.error(`[SmsService] Text.lk error (${res.status}):`, errText);
                return false;
            }

            return true;
        } catch (err) {
            console.error('[SmsService] Failed to send SMS via Text.lk:', err);
            return false;
        }
    }

    /**
     * Sends an SMS notification to the assignee when a new task is created.
     */
    static async sendTaskAssignedSms(task: TaskDTO): Promise<boolean> {
        const phone = await this.getUserPhone(task.assignedTo);
        if (!phone) {
            console.warn(`[SmsService] No phone number found for assigned user ${task.assignedTo} (${task.assignedToName}).`);
            return false;
        }

        const tourPart = task.tourCode ? ` [${task.tourCode}]` : '';
        const duePart = task.dueAt
            ? ` | Due: ${new Date(task.dueAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
            : '';
        const priorityLabel = (task.priority || 'medium').toUpperCase();

        const message =
            `Nilathra Task Assigned${tourPart}: "${task.title}"` +
            ` | Priority: ${priorityLabel}${duePart}` +
            ` | Assigned by: ${task.assignedByName}.`;

        return this.sendSms(phone, message);
    }
}

