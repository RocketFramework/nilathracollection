import { createAdminClient } from '@/utils/supabase/admin';

export interface LogSupplierPaymentEmailInput {
    tour_id?: string | null;
    purchase_order_id: string;
    supplier_invoice_id?: string | null;
    supplier_payment_id?: string | null;
    recipient_email: string;
    sender_email?: string | null;
    subject: string;
    body_html: string;
    attachment_path?: string | null;
    status: 'Sent' | 'Failed';
    error_message?: string | null;
    sent_by?: string | null;
}

export class SupplierPaymentEmailService {
    static async logEmail(input: LogSupplierPaymentEmailInput): Promise<string> {
        const db = createAdminClient();
        const { data, error } = await db
            .from('supplier_payment_emails')
            .insert([{
                tour_id: input.tour_id || null,
                purchase_order_id: input.purchase_order_id,
                supplier_invoice_id: input.supplier_invoice_id || null,
                supplier_payment_id: input.supplier_payment_id || null,
                recipient_email: input.recipient_email,
                sender_email: input.sender_email || null,
                subject: input.subject,
                body_html: input.body_html,
                attachment_path: input.attachment_path || null,
                status: input.status,
                error_message: input.error_message || null,
                sent_by: input.sent_by || null
            }])
            .select('id')
            .single();
        if (error) throw error;
        return data.id;
    }

    static async getEmailsForPurchaseOrder(purchaseOrderId: string) {
        const db = createAdminClient();
        const { data, error } = await db
            .from('supplier_payment_emails')
            .select('id, supplier_payment_id, supplier_invoice_id, recipient_email, subject, status, error_message, sent_at')
            .eq('purchase_order_id', purchaseOrderId)
            .order('sent_at', { ascending: false });
        if (error) throw error;
        return data || [];
    }
}
