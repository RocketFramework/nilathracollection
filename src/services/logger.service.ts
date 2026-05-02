import { createAdminClient } from '../utils/supabase/admin';

export class LoggerService {
    /**
     * Logs general system interactions
     */
    static async logInteraction(action: string, details: any = {}) {
        try {
            const supabase = createAdminClient();
            await supabase.from('system_logs').insert({
                level: 'info',
                action,
                details
            });
        } catch (error) {
            console.error('Failed to log interaction', error);
        }
    }

    /**
     * Logs application errors and database exceptions
     */
    static async logError(action: string, error: any, details: any = {}) {
        try {
            const supabase = createAdminClient();
            await supabase.from('system_logs').insert({
                level: 'error',
                action,
                error_message: error?.message || String(error),
                details
            });
        } catch (err) {
            console.error('Failed to log error', err);
        }
    }

    /**
     * Fetches logs with filtering options
     */
    static async getLogs(includePageViews: boolean = false, limit: number = 100) {
        const supabase = createAdminClient();
        let query = supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(limit);
        
        if (!includePageViews) {
            query = query.neq('action', 'contact_page_view');
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    /**
     * Deletes all page view logs
     */
    static async deletePageViewLogs() {
        const supabase = createAdminClient();
        const { error } = await supabase.from('system_logs').delete().eq('action', 'contact_page_view');
        if (error) throw error;
    }

    /**
     * Checks if page view logging is enabled
     */
    static async isPageViewLoggingEnabled(): Promise<boolean> {
        const supabase = createAdminClient();
        const { data, error } = await supabase.from('system_settings').select('value').eq('key', 'log_page_views').single();
        
        if (error || !data) {
            return true; // Default to true if not set
        }
        return data.value === true;
    }

    /**
     * Toggles page view logging
     */
    static async togglePageViewLogging(enabled: boolean) {
        const supabase = createAdminClient();
        const { error } = await supabase.from('system_settings').upsert({ key: 'log_page_views', value: enabled });
        if (error) throw error;
    }
}
