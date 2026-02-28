import { createClient } from '@supabase/supabase-js';
import { UserProfileDTO } from '../dtos/user-vendor.dto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class UserService {
    static async getCurrentUserProfile(): Promise<UserProfileDTO | null> {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return null;

        // Check tourist profile
        const { data: tourist } = await supabase.from('tourist_profiles').select('*').eq('id', user.id).single();
        if (tourist) return { ...tourist, role: 'tourist' };

        // Check agent profile
        const { data: agent } = await supabase.from('agent_profiles').select('*').eq('id', user.id).single();
        if (agent) return { ...agent, role: 'agent' };

        // Check admin profile
        const { data: admin } = await supabase.from('admin_profiles').select('*').eq('id', user.id).single();
        if (admin) return { ...admin, role: 'admin' };

        return { id: user.id };
    }

    static async getUserRole(userId: string): Promise<string | null> {
        const { data, error } = await supabase.rpc('get_user_role', { user_id: userId });
        if (error) throw error;
        return data;
    }
}

export class TouristService {
    static async updateProfile(userId: string, profileData: Partial<UserProfileDTO>) {
        const { data, error } = await supabase
            .from('tourist_profiles')
            .update({
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                phone: profileData.phone,
                country: profileData.country
            })
            .eq('id', userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
}

export class AgentService {
    // Agent specific service methods
    static async getAssignedTours(agentId: string) {
        const { data, error } = await supabase.from('tours').select('*').eq('agent_id', agentId);
        if (error) throw error;
        return data;
    }
}

export class AdminService {
    static async assignAgentToRequest(requestId: string, agentId: string) {
        const { data, error } = await supabase
            .from('requests')
            .update({ admin_assigned_to: agentId, status: 'Assigned' })
            .eq('id', requestId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Other admin override methods...
}
