import { createAdminClient } from '@/utils/supabase/admin';

export interface EmailTemplate {
    id?: string;
    name: string;
    type: string;
    subject: string;
    body_html: string;
    variables?: string[];
    created_at?: string;
    updated_at?: string;
}

export class EmailTemplateService {
    static async getTemplates(client?: any): Promise<EmailTemplate[]> {
        const db = client || createAdminClient();
        const { data, error } = await db.from('email_templates').select('*').order('name', { ascending: true });
        if (error) throw error;
        return data || [];
    }

    static async getTemplateById(id: string, client?: any): Promise<EmailTemplate | null> {
        const db = client || createAdminClient();
        const { data, error } = await db.from('email_templates').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    }

    static async saveTemplate(template: EmailTemplate, client?: any): Promise<string> {
        const db = client || createAdminClient();
        const { id, ...templateData } = template;

        if (id) {
            const { error } = await db.from('email_templates').update(templateData).eq('id', id);
            if (error) throw error;
            return id;
        } else {
            const { data, error } = await db.from('email_templates').insert([templateData]).select().single();
            if (error) throw error;
            return data.id;
        }
    }

    static async deleteTemplate(id: string, client?: any): Promise<void> {
        const db = client || createAdminClient();
        const { error } = await db.from('email_templates').delete().eq('id', id);
        if (error) throw error;
    }
}
