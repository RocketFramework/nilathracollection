import { createAdminClient } from '@/utils/supabase/admin';

export class AppStateService {
    /**
     * Saves or updates a generic state key-value pair in the database.
     */
    static async saveState(stateKey: string, stateData: any) {
        const supabaseAdmin = createAdminClient();

        const { data, error } = await supabaseAdmin
            .from('app_states')
            .upsert(
                { state_key: stateKey, state_data: stateData, updated_at: new Date().toISOString() },
                { onConflict: 'state_key' }
            )
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Fetches a generic state value by its key.
     */
    static async getState(stateKey: string) {
        const supabaseAdmin = createAdminClient();
        const { data, error } = await supabaseAdmin
            .from('app_states')
            .select('state_data')
            .eq('state_key', stateKey)
            .maybeSingle();

        if (error) throw error;
        return data?.state_data || null;
    }
}
