import { createAdminClient } from '@/utils/supabase/admin';

export class AppSettingsService {
    static async getAppSettings() {
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
            .from('app_settings')
            .select('setting_key, setting_value');
        
        if (error) {
            console.error("Error fetching app settings from database:", error);
            throw error;
        }
        return data;
    }

    static async getSettingValue(settingKey: string): Promise<string | null> {
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
            .from('app_settings')
            .select('setting_value')
            .eq('setting_key', settingKey)
            .maybeSingle();

        if (error) {
            console.error(`Error fetching app setting "${settingKey}" from database:`, error);
            throw error;
        }
        return data?.setting_value ?? null;
    }

    static async saveAppSettings(updates: { setting_key: string; setting_value: string }[]) {
        const adminSupabase = createAdminClient();
        const { error } = await adminSupabase
            .from('app_settings')
            .upsert(updates);
        
        if (error) {
            console.error("Error saving app settings to database:", error);
            throw error;
        }
        return { success: true };
    }
}
