import { createClient } from '@supabase/supabase-js';
import { UserProfileDTO, CreateUserDTO, UpdateUserDTO, ResetPasswordDTO } from '../dtos/user-vendor.dto';
import { createAdminClient } from '../utils/supabase/admin';
import { emailService } from './email.service';

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
    static async getAllAgents() {
        const supabaseAdmin = createAdminClient();
        const { data, error } = await supabaseAdmin
            .from('agent_profiles')
            .select('id, first_name, last_name, is_active')
            .eq('is_active', true)
            .order('first_name', { ascending: true });

        if (error) throw error;
        return data;
    }

    static async assignAgentToRequest(requestId: string, agentId: string) {
        const supabaseAdmin = createAdminClient();
        
        // Fetch request and agent details for email
        const { data: request, error: fetchError } = await supabaseAdmin
            .from('requests')
            .select(`
                *,
                details:request_details(*),
                tourist:users!requests_tourist_id_fkey(
                    email,
                    tourist_profile:tourist_profiles(first_name, last_name)
                )
            `)
            .eq('id', requestId)
            .single();

        if (fetchError) throw fetchError;

        const { data: agent, error: agentError } = await supabaseAdmin
            .from('agent_profiles')
            .select('first_name, last_name')
            .eq('id', agentId)
            .single();

        if (agentError) throw agentError;

        const { data, error } = await supabaseAdmin
            .from('requests')
            .update({ admin_assigned_to: agentId, status: 'Assigned' })
            .eq('id', requestId)
            .select()
            .single();

        if (error) throw error;

        // Send email notification
        try {
            const touristProfile = request.tourist?.tourist_profile?.[0];
            const customerName = touristProfile?.first_name 
                ? `${touristProfile.first_name} ${touristProfile.last_name || ''}`.trim()
                : request.name || 'Client';
            
            const customerEmail = request.email || request.tourist?.email;
            const agentName = `${agent.first_name} ${agent.last_name || ''}`.trim();
            const packageName = request.details?.[0]?.package_name || request.request_type;

            if (customerEmail) {
                await emailService.sendAgentAssignedEmail({
                    customerEmail,
                    customerName,
                    agentName,
                    requestId,
                    packageName: packageName !== 'inquiry' ? packageName : undefined
                });
            }
        } catch (emailErr) {
            console.error("Failed to send assignment email:", emailErr);
        }

        return data;
    }

    static async createUser(dto: CreateUserDTO) {
        if (!dto.first_name || !dto.last_name || !dto.email || !dto.password) {
            throw new Error("First Name, Last Name, Email, and Password are required.");
        }

        const supabaseAdmin = createAdminClient();

        // 1. Create user in Supabase Auth via Admin API
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: dto.email,
            password: dto.password,
            email_confirm: true,
            user_metadata: {
                first_name: dto.first_name,
                last_name: dto.last_name,
                phone: dto.phone || ''
            }
        });

        if (authError) throw new Error(`Auth creation failed: ${authError.message}`);
        if (!authUser.user) throw new Error("User creation failed, no user returned.");

        const newUserId = authUser.user.id;

        // 2. Fetch the role ID
        const { data: roleData, error: roleError } = await supabaseAdmin
            .from("roles")
            .select("id")
            .eq("name", dto.role)
            .single();

        if (roleError || !roleData) throw new Error(`Failed to locate ${dto.role} role. Did you create it?`);

        // 3. Assign User Role
        const { error: assignError } = await supabaseAdmin
            .from("user_roles")
            .insert([{ user_id: newUserId, role_id: roleData.id }]);

        if (assignError) throw new Error("Account created, but role assignment failed.");

        // 4. Create Profile
        const profileTable = `${dto.role}_profiles`;
        const { error: profileError } = await supabaseAdmin
            .from(profileTable)
            .insert([{
                id: newUserId,
                first_name: dto.first_name,
                last_name: dto.last_name,
                phone: dto.phone || null,
                is_active: true
            }]);

        if (profileError) throw new Error(`Role assigned, but ${dto.role} profile creation failed.`);

        return { id: newUserId, ...dto };
    }

    static async updateUser(userId: string, role: string, dto: UpdateUserDTO) {
        const supabaseAdmin = createAdminClient();
        const profileTable = `${role}_profiles`;

        const { error } = await supabaseAdmin
            .from(profileTable)
            .update({
                ...(dto.first_name !== undefined && { first_name: dto.first_name }),
                ...(dto.last_name !== undefined && { last_name: dto.last_name }),
                ...(dto.phone !== undefined && { phone: dto.phone }),
                ...(dto.is_active !== undefined && { is_active: dto.is_active }),
            })
            .eq('id', userId);

        if (error) throw new Error(`Failed to update ${role} profile: ${error.message}`);

        // Also update auth user metadata if name/phone changed
        if (dto.first_name !== undefined || dto.last_name !== undefined || dto.phone !== undefined) {
            const updates: any = {};
            if (dto.first_name !== undefined) updates.first_name = dto.first_name;
            if (dto.last_name !== undefined) updates.last_name = dto.last_name;
            if (dto.phone !== undefined) updates.phone = dto.phone;
            await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: updates });
        }
        return true;
    }

    static async resetUserPassword(dto: ResetPasswordDTO) {
        if (!dto.newPassword) throw new Error("New password is required.");

        const supabaseAdmin = createAdminClient();
        const { error } = await supabaseAdmin.auth.admin.updateUserById(dto.userId, {
            password: dto.newPassword
        });

        if (error) throw new Error(`Failed to reset password: ${error.message}`);
        return true;
    }

    static async getUsersByRole(role: 'tourist' | 'agent' | 'admin') {
        const supabaseAdmin = createAdminClient();
        const profileTable = `${role}_profiles`;

        const { data, error } = await supabaseAdmin
            .from(profileTable)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch ${role}s: ${error.message}`);

        // Get emails from auth.users (requires service role)
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        if (usersError) throw new Error(`Failed to fetch auth users: ${usersError.message}`);

        // Merge profile with auth user email
        return data.map(profile => {
            const authUser = usersData.users.find(u => u.id === profile.id);
            return {
                ...profile,
                email: authUser?.email || 'N/A',
                role
            };
        });
    }

    static async deactivateUser(userId: string, role: 'tourist' | 'agent' | 'admin') {
        return this.updateUser(userId, role, { is_active: false });
    }
}
