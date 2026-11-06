import { createClient } from '@supabase/supabase-js';
import { UserProfileDTO, CreateUserDTO, UpdateUserDTO, ResetPasswordDTO, UserRoleType } from '../dtos/user-vendor.dto';
import { createAdminClient } from '../utils/supabase/admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const AGENT_ROLES = new Set<string>(['agent', 'senior_agent', 'executive_agent']);
export const SUPERVISOR_ROLES = new Set<string>([
    'agent_supervisor',
    'senior_supervisor',
    'executive_supervisor',
    'principal_supervisor'
]);

export const HIERARCHY_ROLE_RANK: Record<string, number> = {
    agent: 1,
    senior_agent: 2,
    executive_agent: 3,
    agent_supervisor: 4,
    senior_supervisor: 5,
    executive_supervisor: 6,
    principal_supervisor: 7,
    admin: 8
};

export const ROLE_LABELS: Record<string, string> = {
    agent: 'Agent',
    senior_agent: 'Senior Agent',
    executive_agent: 'Executive Agent',
    agent_supervisor: 'Supervisor',
    senior_supervisor: 'Senior Supervisor',
    executive_supervisor: 'Executive Supervisor',
    principal_supervisor: 'Principal Supervisor',
    admin: 'Admin',
    finance: 'Finance Staff',
    tourist: 'Tourist'
};

function getProfileTableForRole(role: string): string {
    if (AGENT_ROLES.has(role)) return 'agent_profiles';
    if (SUPERVISOR_ROLES.has(role)) return 'agent_supervisor_profiles';
    return `${role}_profiles`;
}

function buildUserIdToRoleMap(allRoles: any[] | null, allUserRoles: any[] | null): Map<string, string> {
    const roleIdToName = new Map<string, string>((allRoles || []).map((r: any) => [r.id, r.name]));
    const userIdToRoleName = new Map<string, string>();
    (allUserRoles || []).forEach((ur: any) => {
        const rName = roleIdToName.get(ur.role_id);
        if (!rName) return;
        const existing = userIdToRoleName.get(ur.user_id);
        if (!existing) {
            userIdToRoleName.set(ur.user_id, rName);
            return;
        }
        const existingRank = HIERARCHY_ROLE_RANK[existing] || (existing === 'finance' ? 1 : 0);
        const newRank = HIERARCHY_ROLE_RANK[rName] || (rName === 'finance' ? 1 : 0);
        if (newRank >= existingRank) {
            userIdToRoleName.set(ur.user_id, rName);
        }
    });
    return userIdToRoleName;
}

export class UserService {
    static async resolveUserEffectiveRole(userId: string): Promise<UserRoleType> {
        const adminClient = createAdminClient();
        const { data: userRoleRows } = await adminClient
            .from('user_roles')
            .select('roles(name)')
            .eq('user_id', userId);

        let assignedRoleName: UserRoleType | undefined;
        let highestRank = -1;
        for (const row of (userRoleRows || [])) {
            const rName = (row as any)?.roles?.name as UserRoleType | undefined;
            if (!rName) continue;
            const rank = HIERARCHY_ROLE_RANK[rName] ?? (rName === 'finance' ? 1 : 0);
            if (rank > highestRank) {
                highestRank = rank;
                assignedRoleName = rName;
            }
        }

        const { data: admin } = await adminClient.from('admin_profiles').select('id').eq('id', userId).maybeSingle();
        if (admin) return (assignedRoleName && assignedRoleName !== 'tourist') ? assignedRoleName : 'admin';

        const { data: supervisor } = await adminClient.from('agent_supervisor_profiles').select('id').eq('id', userId).maybeSingle();
        if (supervisor) return (assignedRoleName && SUPERVISOR_ROLES.has(assignedRoleName)) ? assignedRoleName : 'agent_supervisor';

        const { data: agent } = await adminClient.from('agent_profiles').select('id').eq('id', userId).maybeSingle();
        if (agent) return (assignedRoleName && AGENT_ROLES.has(assignedRoleName)) ? assignedRoleName : 'agent';

        const { data: finance } = await adminClient.from('finance_profiles').select('id').eq('id', userId).maybeSingle();
        if (finance) return 'finance';

        return assignedRoleName || 'tourist';
    }

    static async getCurrentUserProfile(): Promise<UserProfileDTO | null> {
        const { createClient: createServerClient } = await import('../utils/supabase/server');
        const serverSupabase = await createServerClient();
        const { data: { user }, error: authError } = await serverSupabase.auth.getUser();
        if (authError || !user) return null;

        const adminClient = createAdminClient();
        const assignedRoleName = await this.resolveUserEffectiveRole(user.id);

        // Check admin profile
        const { data: admin } = await adminClient.from('admin_profiles').select('*').eq('id', user.id).maybeSingle();
        if (admin) return { ...admin, role: assignedRoleName || 'admin' };

        // Check agent supervisor profile
        const { data: supervisor } = await adminClient.from('agent_supervisor_profiles').select('*').eq('id', user.id).maybeSingle();
        if (supervisor) return { ...supervisor, role: assignedRoleName || 'agent_supervisor' };

        // Check agent profile
        const { data: agent } = await adminClient.from('agent_profiles').select('*').eq('id', user.id).maybeSingle();
        if (agent) return { ...agent, role: assignedRoleName || 'agent' };

        // Check finance profile
        const { data: finance } = await adminClient.from('finance_profiles').select('*').eq('id', user.id).maybeSingle();
        if (finance) return { ...finance, role: assignedRoleName || 'finance' };

        // Check tourist profile
        const { data: tourist } = await adminClient.from('tourist_profiles').select('*').eq('id', user.id).maybeSingle();
        if (tourist) return { ...tourist, role: assignedRoleName || 'tourist' };

        return { id: user.id, role: assignedRoleName };
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
    /**
     * Returns the given user's ID along with all user IDs operating under them
     * (both direct and indirect/transitive subordinates down the hierarchy).
     */
    static async getUserAndSubordinateIds(userId: string): Promise<string[]> {
        const supabaseAdmin = createAdminClient();
        const [{ data: agents }, { data: supervisors }, hierarchyMap] = await Promise.all([
            supabaseAdmin.from('agent_profiles').select('id, supervisor_id'),
            supabaseAdmin.from('agent_supervisor_profiles').select('id, supervisor_id'),
            this.getHierarchyMap()
        ]);

        const childrenBySupervisor = new Map<string, Set<string>>();
        const registerLink = (childId: string, supId: string | null | undefined) => {
            const effectiveSup = supId || hierarchyMap[childId];
            if (!effectiveSup || effectiveSup === childId) return;
            if (!childrenBySupervisor.has(effectiveSup)) {
                childrenBySupervisor.set(effectiveSup, new Set());
            }
            childrenBySupervisor.get(effectiveSup)!.add(childId);
        };

        (agents || []).forEach((a: any) => registerLink(a.id, a.supervisor_id));
        (supervisors || []).forEach((s: any) => registerLink(s.id, s.supervisor_id));
        Object.entries(hierarchyMap).forEach(([childId, supId]) => registerLink(childId, supId));

        const visited = new Set<string>([userId]);
        const queue: string[] = [userId];

        while (queue.length > 0) {
            const current = queue.shift()!;
            const children = childrenBySupervisor.get(current);
            if (!children) continue;
            for (const childId of children) {
                if (!visited.has(childId)) {
                    visited.add(childId);
                    queue.push(childId);
                }
            }
        }

        return Array.from(visited);
    }

    static async getAllAgents(callerRole?: string) {
        const supabaseAdmin = createAdminClient();
        let effectiveRole = callerRole;
        if (!effectiveRole) {
            const currentProfile = await UserService.getCurrentUserProfile();
            effectiveRole = currentProfile?.role || 'admin';
        }

        const callerRank = HIERARCHY_ROLE_RANK[effectiveRole] ?? 8;

        const [{ data: allRoles }, { data: allUserRoles }, { data: agents, error: agentsError }, { data: supervisors, error: supError }] = await Promise.all([
            supabaseAdmin.from('roles').select('id, name'),
            supabaseAdmin.from('user_roles').select('user_id, role_id'),
            supabaseAdmin.from('agent_profiles').select('id, first_name, last_name, is_active').eq('is_active', true),
            supabaseAdmin.from('agent_supervisor_profiles').select('id, first_name, last_name, is_active').eq('is_active', true)
        ]);

        if (agentsError) throw agentsError;
        if (supError) throw supError;

        const userIdToRoleName = buildUserIdToRoleMap(allRoles, allUserRoles);
        const candidates: Array<{
            id: string;
            first_name: string;
            last_name: string;
            is_active: boolean;
            role: string;
            role_label: string;
            rank: number;
        }> = [];

        (agents || []).forEach((item: any) => {
            const rName = userIdToRoleName.get(item.id) || 'agent';
            const rank = HIERARCHY_ROLE_RANK[rName] || 1;
            if (rank < callerRank) {
                candidates.push({
                    id: item.id,
                    first_name: item.first_name || '',
                    last_name: item.last_name || '',
                    is_active: item.is_active,
                    role: rName,
                    role_label: ROLE_LABELS[rName] || 'Agent',
                    rank
                });
            }
        });

        (supervisors || []).forEach((item: any) => {
            const rName = userIdToRoleName.get(item.id) || 'agent_supervisor';
            const rank = HIERARCHY_ROLE_RANK[rName] || 4;
            if (rank < callerRank) {
                candidates.push({
                    id: item.id,
                    first_name: item.first_name || '',
                    last_name: item.last_name || '',
                    is_active: item.is_active,
                    role: rName,
                    role_label: ROLE_LABELS[rName] || 'Supervisor',
                    rank
                });
            }
        });

        return candidates.sort((a, b) => a.rank - b.rank || `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));
    }

    static async assignAgentToRequest(requestId: string, agentId: string) {
        const supabaseAdmin = createAdminClient();

        // Fetch request and agent details for email
        const { data: request, error: fetchError } = await supabaseAdmin
            .from('requests')
            .select(`
                *,
                tourist:users!requests_tourist_id_fkey(
                    email,
                    tourist_profile:tourist_profiles(first_name, last_name)
                )
            `)
            .eq('id', requestId)
            .single();

        if (fetchError) throw fetchError;

        let assignee: { first_name?: string; last_name?: string } | null = null;
        const { data: agentProfile } = await supabaseAdmin
            .from('agent_profiles')
            .select('first_name, last_name')
            .eq('id', agentId)
            .maybeSingle();

        if (agentProfile) {
            assignee = agentProfile;
        } else {
            const { data: supProfile } = await supabaseAdmin
                .from('agent_supervisor_profiles')
                .select('first_name, last_name')
                .eq('id', agentId)
                .maybeSingle();
            assignee = supProfile;
        }

        if (!assignee) {
            throw new Error("Selected assignee profile was not found.");
        }

        const { data, error } = await supabaseAdmin
            .from('requests')
            .update({ admin_assigned_to: agentId, status: 'Assigned' })
            .eq('id', requestId)
            .select()
            .single();

        if (error) throw error;

        // Send email notification
        try {
            const tpRaw = request.tourist?.tourist_profile;
            const touristProfile = Array.isArray(tpRaw) ? tpRaw[0] : tpRaw;
            const customerName = touristProfile?.first_name
                ? `${touristProfile.first_name} ${touristProfile.last_name || ''}`.trim()
                : request.name || 'Client';

            const customerEmail = request.email || request.tourist?.email;
            const agentName = `${assignee.first_name || ''} ${assignee.last_name || ''}`.trim();
            const packageName = request.request_type;

            if (customerEmail) {
                const { emailService } = await import('./email.service');
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

        // Ensure public.users record exists before assigning roles or profiles (handles missing triggers)
        const { error: usersError } = await supabaseAdmin.from('users').upsert([
            { id: newUserId, email: dto.email }
        ], { onConflict: 'id' });

        if (usersError) {
            throw new Error(`Auth user created, but failed to create public user record: ${usersError.message || JSON.stringify(usersError)}`);
        }

        // 2. Fetch the requested role ID
        const { data: roleData, error: roleError } = await supabaseAdmin
            .from("roles")
            .select("id")
            .eq("name", dto.role)
            .single();

        if (roleError || !roleData) throw new Error(`Failed to locate ${dto.role} role. Did you create it?`);

        // 3. Assign User Role (remove any auto-created tourist role first if creating a staff user)
        if (dto.role !== 'tourist') {
            await supabaseAdmin.from("user_roles").delete().eq("user_id", newUserId);
        }
        const { error: assignError } = await supabaseAdmin
            .from("user_roles")
            .upsert([{ user_id: newUserId, role_id: roleData.id }], { onConflict: 'user_id, role_id' });

        if (assignError) throw new Error(`Account created, but role assignment failed: ${assignError.message || JSON.stringify(assignError)}`);

        // 4. Create Profile
        const profileTable = getProfileTableForRole(dto.role);
        const profilePayload: any = {
            id: newUserId,
            first_name: dto.first_name,
            last_name: dto.last_name,
            phone: dto.phone || null,
            is_active: true
        };

        if ((AGENT_ROLES.has(dto.role) || SUPERVISOR_ROLES.has(dto.role)) && dto.supervisor_id) {
            profilePayload.supervisor_id = dto.supervisor_id;
        }

        let { error: profileError } = await supabaseAdmin
            .from(profileTable)
            .upsert([profilePayload], { onConflict: 'id' });

        if (profileError && dto.supervisor_id && (profileError.code === '23503' || profileError.code === '42703' || profileError.message?.includes('supervisor_id'))) {
            const { supervisor_id: _sup, ...baseProfilePayload } = profilePayload;
            const retry = await supabaseAdmin.from(profileTable).upsert([baseProfilePayload], { onConflict: 'id' });
            profileError = retry.error;
        }

        if (profileError) throw new Error(`Role assigned, but ${dto.role} profile creation failed: ${profileError.message || JSON.stringify(profileError)}`);

        // Persist reporting relationship in app_states as a schema-safe fallback if migration hasn't been run yet
        if (dto.supervisor_id) {
            await this.saveHierarchySupervisorFallback(newUserId, dto.supervisor_id);
        }

        return { id: newUserId, ...dto };
    }

    private static async getHierarchyMap(): Promise<Record<string, string | null>> {
        try {
            const supabaseAdmin = createAdminClient();
            const { data } = await supabaseAdmin
                .from('app_states')
                .select('state_data')
                .eq('state_key', 'nilathra_user_hierarchy_map')
                .maybeSingle();
            return (data?.state_data && typeof data.state_data === 'object') ? data.state_data : {};
        } catch {
            return {};
        }
    }

    private static async saveHierarchySupervisorFallback(userId: string, supervisorId: string | null) {
        try {
            const supabaseAdmin = createAdminClient();
            const map = await this.getHierarchyMap();
            if (supervisorId) {
                map[userId] = supervisorId;
            } else {
                delete map[userId];
            }
            await supabaseAdmin
                .from('app_states')
                .upsert(
                    { state_key: 'nilathra_user_hierarchy_map', state_data: map, updated_at: new Date().toISOString() },
                    { onConflict: 'state_key' }
                );
        } catch (e) {
            console.warn('Failed to save hierarchy fallback map:', e);
        }
    }

    static async updateUser(userId: string, role: string, dto: UpdateUserDTO) {
        const supabaseAdmin = createAdminClient();
        const profileTable = getProfileTableForRole(role);
        const supportsHierarchy = AGENT_ROLES.has(role) || SUPERVISOR_ROLES.has(role);

        const baseUpdate: any = {
            ...(dto.first_name !== undefined && { first_name: dto.first_name }),
            ...(dto.last_name !== undefined && { last_name: dto.last_name }),
            ...(dto.phone !== undefined && { phone: dto.phone }),
            ...(dto.is_active !== undefined && { is_active: dto.is_active }),
        };

        const fullUpdate: any = {
            ...baseUpdate,
            ...(supportsHierarchy && dto.supervisor_id !== undefined && { supervisor_id: dto.supervisor_id || null }),
        };

        let { error } = await supabaseAdmin
            .from(profileTable)
            .update(fullUpdate)
            .eq('id', userId);

        // If the DB migration (add_multi_layer_user_hierarchy.sql) hasn't been executed yet,
        // update the base fields and store the supervisor_id in the hierarchy map so it still works immediately.
        if (error && dto.supervisor_id !== undefined && (error.code === '23503' || error.code === '42703' || error.message?.includes('supervisor_id'))) {
            if (Object.keys(baseUpdate).length > 0) {
                const retry = await supabaseAdmin.from(profileTable).update(baseUpdate).eq('id', userId);
                error = retry.error;
            } else {
                error = null;
            }
        }

        if (error) throw new Error(`Failed to update ${role} profile: ${error.message}`);

        if (supportsHierarchy && dto.supervisor_id !== undefined) {
            await this.saveHierarchySupervisorFallback(userId, dto.supervisor_id || null);
        }

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

    static async getUsersByRole(role: UserRoleType) {
        const supabaseAdmin = createAdminClient();
        const profileTable = getProfileTableForRole(role);

        // Fetch all roles and user_roles to resolve exact hierarchy roles and superior profiles
        const [{ data: allRoles }, { data: allUserRoles }, { data: allAgents }, { data: allSupervisors }, hierarchyMap] = await Promise.all([
            supabaseAdmin.from('roles').select('id, name'),
            supabaseAdmin.from('user_roles').select('user_id, role_id'),
            supabaseAdmin.from('agent_profiles').select('id, first_name, last_name, is_active'),
            supabaseAdmin.from('agent_supervisor_profiles').select('id, first_name, last_name, is_active'),
            this.getHierarchyMap()
        ]);

        const userIdToRoleName = buildUserIdToRoleMap(allRoles, allUserRoles);

        const personLookup = new Map<string, { first_name: string; last_name: string; role: string; role_label: string }>();
        (allAgents || []).forEach((a: any) => {
            const rName = userIdToRoleName.get(a.id) || 'agent';
            personLookup.set(a.id, {
                first_name: a.first_name || '',
                last_name: a.last_name || '',
                role: rName,
                role_label: ROLE_LABELS[rName] || rName
            });
        });
        (allSupervisors || []).forEach((s: any) => {
            const rName = userIdToRoleName.get(s.id) || 'agent_supervisor';
            personLookup.set(s.id, {
                first_name: s.first_name || '',
                last_name: s.last_name || '',
                role: rName,
                role_label: ROLE_LABELS[rName] || rName
            });
        });

        const { data, error } = await supabaseAdmin
            .from(profileTable)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch ${role}s: ${error.message}`);

        const isHierarchyRole = AGENT_ROLES.has(role) || SUPERVISOR_ROLES.has(role);
        const filteredProfiles = (data || []).filter((profile: any) => {
            if (!isHierarchyRole) return true;
            const assignedRole = userIdToRoleName.get(profile.id);
            if (role === 'agent') {
                return !assignedRole || assignedRole === 'agent';
            }
            if (role === 'agent_supervisor') {
                return !assignedRole || assignedRole === 'agent_supervisor';
            }
            return assignedRole === role;
        });

        // Get emails from auth.users (requires service role)
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        if (usersError) throw new Error(`Failed to fetch auth users: ${usersError.message}`);

        // Merge profile with auth user email and resolved superior profile
        return filteredProfiles.map((profile: any) => {
            const authUser = usersData.users.find(u => u.id === profile.id);
            const effectiveSupervisorId = profile.supervisor_id || hierarchyMap[profile.id] || undefined;
            const supInfo = effectiveSupervisorId ? personLookup.get(effectiveSupervisorId) : undefined;
            return {
                ...profile,
                supervisor_id: effectiveSupervisorId,
                supervisor: supInfo,
                email: authUser?.email || 'N/A',
                role
            };
        });
    }

    static async deactivateUser(userId: string, role: UserRoleType) {
        return this.updateUser(userId, role, { is_active: false });
    }

    static async getAllSupervisors(forRole?: UserRoleType) {
        const supabaseAdmin = createAdminClient();
        const targetRank = forRole ? (HIERARCHY_ROLE_RANK[forRole] || 1) : 1;

        const [{ data: allRoles }, { data: allUserRoles }, { data: agents }, { data: supervisors }] = await Promise.all([
            supabaseAdmin.from('roles').select('id, name'),
            supabaseAdmin.from('user_roles').select('user_id, role_id'),
            supabaseAdmin.from('agent_profiles').select('id, first_name, last_name, is_active').eq('is_active', true),
            supabaseAdmin.from('agent_supervisor_profiles').select('id, first_name, last_name, is_active').eq('is_active', true)
        ]);

        const userIdToRoleName = buildUserIdToRoleMap(allRoles, allUserRoles);

        const candidates: Array<{ id: string; first_name: string; last_name: string; role: string; roleLabel: string; rank: number; name: string }> = [];

        (agents || []).forEach((item: any) => {
            const rName = userIdToRoleName.get(item.id) || 'agent';
            const rank = HIERARCHY_ROLE_RANK[rName] || 1;
            if (rank > targetRank) {
                const roleLabel = ROLE_LABELS[rName] || 'Agent';
                const fullName = `${item.first_name || ''} ${item.last_name || ''}`.trim();
                candidates.push({
                    id: item.id,
                    first_name: item.first_name,
                    last_name: item.last_name,
                    role: rName,
                    roleLabel,
                    rank,
                    name: `${fullName} (${roleLabel})`
                });
            }
        });

        (supervisors || []).forEach((item: any) => {
            const rName = userIdToRoleName.get(item.id) || 'agent_supervisor';
            const rank = HIERARCHY_ROLE_RANK[rName] || 4;
            if (rank > targetRank) {
                const roleLabel = ROLE_LABELS[rName] || 'Supervisor';
                const fullName = `${item.first_name || ''} ${item.last_name || ''}`.trim();
                candidates.push({
                    id: item.id,
                    first_name: item.first_name,
                    last_name: item.last_name,
                    role: rName,
                    roleLabel,
                    rank,
                    name: `${fullName} (${roleLabel})`
                });
            }
        });

        return candidates.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
    }
}
