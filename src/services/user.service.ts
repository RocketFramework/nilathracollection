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

/**
 * Only Admin and Finance users can change roles or hold two roles simultaneously
 * (e.g. Admin <-> Finance, Admin + Finance, Finance + Senior Agent).
 * Operational hierarchy roles (Agents & Supervisors) are fixed single-role accounts,
 * and Tourists are strictly restricted to the Tourist Portal only.
 */
export const FLEXIBLE_ANCHOR_ROLES = new Set<string>(['admin', 'finance']);
export const FIXED_HIERARCHY_ROLES = new Set<string>([
    'principal_supervisor',
    'executive_supervisor',
    'senior_supervisor',
    'agent_supervisor',
    'executive_agent',
    'senior_agent',
    'agent'
]);
export const ALL_STAFF_ROLES = new Set<string>([
    'admin',
    'finance',
    ...Array.from(FIXED_HIERARCHY_ROLES)
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

function normalizeAndOrderUserRoles(rawRoles: Iterable<string>): UserRoleType[] {
    const unique = Array.from(new Set(Array.from(rawRoles).filter(Boolean)));
    const staffOnly = unique.filter(r => r !== 'tourist') as UserRoleType[];
    if (staffOnly.length === 0) {
        return ['tourist'];
    }
    return staffOnly.sort((a, b) => {
        const anchorScore = (r: string) => (r === 'admin' ? 100 : r === 'finance' ? 90 : (HIERARCHY_ROLE_RANK[r] || 0));
        return anchorScore(b) - anchorScore(a);
    });
}

function buildUserIdToRoleSetMap(allRoles: any[] | null, allUserRoles: any[] | null): Map<string, Set<UserRoleType>> {
    const roleIdToName = new Map<string, string>((allRoles || []).map((r: any) => [r.id, r.name]));
    const rawMap = new Map<string, Set<string>>();
    (allUserRoles || []).forEach((ur: any) => {
        const rName = roleIdToName.get(ur.role_id);
        if (!rName) return;
        if (!rawMap.has(ur.user_id)) {
            rawMap.set(ur.user_id, new Set<string>());
        }
        rawMap.get(ur.user_id)!.add(rName);
    });

    const cleanMap = new Map<string, Set<UserRoleType>>();
    rawMap.forEach((set, userId) => {
        const normalized = normalizeAndOrderUserRoles(set);
        cleanMap.set(userId, new Set<UserRoleType>(normalized));
    });
    return cleanMap;
}

function buildUserIdToRoleMap(allRoles: any[] | null, allUserRoles: any[] | null): Map<string, string> {
    const roleSetMap = buildUserIdToRoleSetMap(allRoles, allUserRoles);
    const userIdToRoleName = new Map<string, string>();
    roleSetMap.forEach((roleSet, userId) => {
        const arr = Array.from(roleSet);
        if (arr.includes('admin')) {
            userIdToRoleName.set(userId, 'admin');
            return;
        }
        let bestOperational: string | null = null;
        let bestRank = -1;
        for (const r of arr) {
            const rank = HIERARCHY_ROLE_RANK[r] ?? -1;
            if (rank > bestRank) {
                bestRank = rank;
                bestOperational = r;
            }
        }
        if (bestOperational) {
            userIdToRoleName.set(userId, bestOperational);
            return;
        }
        if (arr.includes('finance')) {
            userIdToRoleName.set(userId, 'finance');
            return;
        }
        userIdToRoleName.set(userId, arr[0] || 'tourist');
    });
    return userIdToRoleName;
}

function buildUserIdToOperationalRoleMap(allRoles: any[] | null, allUserRoles: any[] | null): Map<string, string> {
    const roleSetMap = buildUserIdToRoleSetMap(allRoles, allUserRoles);
    const opMap = new Map<string, string>();
    roleSetMap.forEach((roleSet, userId) => {
        let bestOp: string | null = null;
        let bestRank = -1;
        for (const r of roleSet) {
            if (AGENT_ROLES.has(r) || SUPERVISOR_ROLES.has(r)) {
                const rank = HIERARCHY_ROLE_RANK[r] ?? 0;
                if (rank > bestRank) {
                    bestRank = rank;
                    bestOp = r;
                }
            }
        }
        if (bestOp) {
            opMap.set(userId, bestOp);
        }
    });
    return opMap;
}

export function deriveRoleMetadata(roles: UserRoleType[], fallbackPrimary?: UserRoleType): {
    roles: UserRoleType[];
    role_labels: string[];
    primary_role: UserRoleType;
    secondary_role: UserRoleType | null;
    can_edit_roles: boolean;
} {
    const ordered = normalizeAndOrderUserRoles(roles.length > 0 ? roles : [fallbackPrimary || 'tourist']);
    const canEdit = ordered.some(r => FLEXIBLE_ANCHOR_ROLES.has(r));

    let primary: UserRoleType = ordered[0];
    if (canEdit) {
        if (fallbackPrimary && FLEXIBLE_ANCHOR_ROLES.has(fallbackPrimary) && ordered.includes(fallbackPrimary)) {
            primary = fallbackPrimary;
        } else if (ordered.includes('admin')) {
            primary = 'admin';
        } else if (ordered.includes('finance')) {
            primary = 'finance';
        }
    }

    const secondary = ordered.find(r => r !== primary) || null;
    const displayOrder: UserRoleType[] = secondary ? [primary, secondary] : [primary];

    return {
        roles: displayOrder,
        role_labels: displayOrder.map(r => ROLE_LABELS[r] || r),
        primary_role: primary,
        secondary_role: secondary,
        can_edit_roles: canEdit
    };
}

export class UserService {
    /**
     * Resolves all active roles held by a user.
     * - Staff accounts (Admin/Finance/Supervisors/Agents) never retain stray 'tourist' roles.
     * - Admin & Finance accounts may hold up to two roles (e.g. ['admin', 'finance'] or ['finance', 'senior_agent']).
     * - Tourists strictly hold ['tourist'].
     */
    static async resolveUserRoles(userId: string): Promise<UserRoleType[]> {
        const adminClient = createAdminClient();
        const { data: userRoleRows } = await adminClient
            .from('user_roles')
            .select('roles(name)')
            .eq('user_id', userId);

        const assignedNames: string[] = [];
        for (const row of (userRoleRows || [])) {
            const rName = (row as any)?.roles?.name as string | undefined;
            if (rName) assignedNames.push(rName);
        }

        const staffAssigned = assignedNames.filter(r => r !== 'tourist');
        if (staffAssigned.length > 0) {
            return normalizeAndOrderUserRoles(staffAssigned);
        }

        // Legacy fallback when user_roles has no staff entry yet
        const [
            { data: admin },
            { data: finance },
            { data: supervisor },
            { data: agent },
            { data: tourist }
        ] = await Promise.all([
            adminClient.from('admin_profiles').select('id').eq('id', userId).maybeSingle(),
            adminClient.from('finance_profiles').select('id').eq('id', userId).maybeSingle(),
            adminClient.from('agent_supervisor_profiles').select('id').eq('id', userId).maybeSingle(),
            adminClient.from('agent_profiles').select('id').eq('id', userId).maybeSingle(),
            adminClient.from('tourist_profiles').select('id').eq('id', userId).maybeSingle()
        ]);

        const fallbackRoles: string[] = [];
        if (admin) fallbackRoles.push('admin');
        if (finance) fallbackRoles.push('finance');
        if (supervisor) fallbackRoles.push('agent_supervisor');
        if (agent) fallbackRoles.push('agent');
        if (fallbackRoles.length > 0) {
            return normalizeAndOrderUserRoles(fallbackRoles);
        }
        if (tourist || assignedNames.includes('tourist')) {
            return ['tourist'];
        }
        return ['tourist'];
    }

    static async resolveUserEffectiveRole(userId: string): Promise<UserRoleType> {
        const roles = await this.resolveUserRoles(userId);
        if (roles.includes('admin')) return 'admin';

        let highestOpRole: UserRoleType | undefined;
        let highestRank = -1;
        for (const r of roles) {
            const rank = HIERARCHY_ROLE_RANK[r] ?? -1;
            if (rank > highestRank) {
                highestRank = rank;
                highestOpRole = r;
            }
        }
        if (highestOpRole) return highestOpRole;
        if (roles.includes('finance')) return 'finance';
        return 'tourist';
    }

    static async getCurrentUserProfile(): Promise<UserProfileDTO | null> {
        const { createClient: createServerClient } = await import('../utils/supabase/server');
        const serverSupabase = await createServerClient();
        const { data: { user }, error: authError } = await serverSupabase.auth.getUser();
        if (authError || !user) return null;

        const adminClient = createAdminClient();
        const roles = await this.resolveUserRoles(user.id);
        const effectiveRole = roles.includes('admin')
            ? 'admin'
            : roles.find(r => AGENT_ROLES.has(r) || SUPERVISOR_ROLES.has(r)) || roles[0] || 'tourist';
        const roleMeta = deriveRoleMetadata(roles);

        const [
            { data: admin },
            { data: finance },
            { data: supervisor },
            { data: agent },
            { data: tourist }
        ] = await Promise.all([
            adminClient.from('admin_profiles').select('*').eq('id', user.id).maybeSingle(),
            adminClient.from('finance_profiles').select('*').eq('id', user.id).maybeSingle(),
            adminClient.from('agent_supervisor_profiles').select('*').eq('id', user.id).maybeSingle(),
            adminClient.from('agent_profiles').select('*').eq('id', user.id).maybeSingle(),
            adminClient.from('tourist_profiles').select('*').eq('id', user.id).maybeSingle()
        ]);

        let chosenProfile: any = null;
        if (roles.includes('admin') && admin) chosenProfile = admin;
        else if (roles.includes('finance') && finance) chosenProfile = finance;
        else if (roles.some(r => SUPERVISOR_ROLES.has(r)) && supervisor) chosenProfile = supervisor;
        else if (roles.some(r => AGENT_ROLES.has(r)) && agent) chosenProfile = agent;
        else if (roles.includes('tourist') && tourist) chosenProfile = tourist;
        else chosenProfile = admin || finance || supervisor || agent || tourist;

        return {
            ...(chosenProfile || { id: user.id }),
            email: user.email,
            role: effectiveRole,
            ...roleMeta
        };
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

        const userIdToOpRole = buildUserIdToOperationalRoleMap(allRoles, allUserRoles);
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
            const rName = userIdToOpRole.get(item.id) || 'agent';
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
            const rName = userIdToOpRole.get(item.id) || 'agent_supervisor';
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

        const cleanSecondary = dto.secondary_role && dto.secondary_role !== dto.role
            ? dto.secondary_role
            : null;

        if (cleanSecondary) {
            if (!FLEXIBLE_ANCHOR_ROLES.has(dto.role)) {
                throw new Error(
                    "Dual roles are only permitted for Admin and Finance users. Agents, Supervisors, and Tourists cannot hold multiple roles."
                );
            }
            if (cleanSecondary === 'tourist' || !ALL_STAFF_ROLES.has(cleanSecondary)) {
                throw new Error(
                    "Tourist accounts only have access to the Tourist Portal and cannot be combined with staff roles."
                );
            }
        }

        const targetRoles: UserRoleType[] = cleanSecondary
            ? [dto.role, cleanSecondary]
            : [dto.role];

        const supabaseAdmin = createAdminClient();

        // 1. Create user in Supabase Auth via Admin API
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: dto.email,
            password: dto.password,
            email_confirm: true,
            user_metadata: {
                first_name: dto.first_name,
                last_name: dto.last_name,
                phone: dto.phone || '',
                role: dto.role,
                roles: targetRoles
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

        // 2. Fetch requested role IDs
        const { data: roleRows, error: roleError } = await supabaseAdmin
            .from("roles")
            .select("id, name")
            .in("name", targetRoles);

        if (roleError || !roleRows || roleRows.length === 0) {
            throw new Error(`Failed to locate role(s) ${targetRoles.join(', ')}.`);
        }

        const roleMap = new Map<string, string>(roleRows.map((r: any) => [r.name, r.id]));
        for (const r of targetRoles) {
            if (!roleMap.has(r)) {
                throw new Error(`Role '${r}' is missing from public.roles.`);
            }
        }

        // 3. Assign User Roles (remove any auto-created tourist role first if creating a staff user)
        if (dto.role !== 'tourist') {
            await supabaseAdmin.from("user_roles").delete().eq("user_id", newUserId);
        }

        const roleInserts = targetRoles.map(r => ({
            user_id: newUserId,
            role_id: roleMap.get(r)!
        }));

        const { error: assignError } = await supabaseAdmin
            .from("user_roles")
            .upsert(roleInserts, { onConflict: 'user_id, role_id' });

        if (assignError) throw new Error(`Account created, but role assignment failed: ${assignError.message || JSON.stringify(assignError)}`);

        // 4. Create Profile(s) across all target role profile tables
        const requiredTables = Array.from(new Set(targetRoles.map(r => getProfileTableForRole(r))));
        for (const profileTable of requiredTables) {
            const isHierarchyTable = profileTable === 'agent_profiles' || profileTable === 'agent_supervisor_profiles';
            const profilePayload: any = {
                id: newUserId,
                first_name: dto.first_name,
                last_name: dto.last_name,
                phone: dto.phone || null,
                is_active: true,
                ...(isHierarchyTable && dto.supervisor_id ? { supervisor_id: dto.supervisor_id } : {})
            };

            let { error: profileError } = await supabaseAdmin
                .from(profileTable)
                .upsert([profilePayload], { onConflict: 'id' });

            if (profileError && dto.supervisor_id && (profileError.code === '23503' || profileError.code === '42703' || profileError.message?.includes('supervisor_id'))) {
                const { supervisor_id: _sup, ...baseProfilePayload } = profilePayload;
                const retry = await supabaseAdmin.from(profileTable).upsert([baseProfilePayload], { onConflict: 'id' });
                profileError = retry.error;
            }

            if (profileError) {
                throw new Error(`Role assigned, but profile creation in ${profileTable} failed: ${profileError.message || JSON.stringify(profileError)}`);
            }
        }

        // Persist reporting relationship in app_states as a schema-safe fallback if migration hasn't been run yet
        if (dto.supervisor_id && targetRoles.some(r => AGENT_ROLES.has(r) || SUPERVISOR_ROLES.has(r))) {
            await this.saveHierarchySupervisorFallback(newUserId, dto.supervisor_id);
        }

        // Auto-register eligible office employees (any user holding an operational/admin HR role, i.e. not pure finance/tourist)
        const hrRole = targetRoles.find(r => r === 'admin')
            || targetRoles.find(r => AGENT_ROLES.has(r) || SUPERVISOR_ROLES.has(r));
        if (hrRole) {
            try {
                const { EmployeeHrService } = await import('./employee-hr.service');
                await EmployeeHrService.ensureEmployeeForUser(newUserId, hrRole);
            } catch (hrErr) {
                console.warn('Auto-sync to employees HR table warning:', hrErr);
            }
        }

        return { id: newUserId, ...dto, roles: targetRoles };
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
        const existingRoles = await UserService.resolveUserRoles(userId);
        let finalRoles: UserRoleType[] = [...existingRoles];

        const isRoleMutationRequested = dto.primary_role !== undefined || dto.secondary_role !== undefined;

        if (isRoleMutationRequested) {
            // Verify caller has Admin privileges before permitting any role mutation
            const caller = await UserService.getCurrentUserProfile();
            const callerRoles = caller?.roles || (caller?.role ? [caller.role] : []);
            if (!callerRoles.includes('admin')) {
                throw new Error("Only an Admin can change user roles.");
            }

            const isTargetAdminOrFinance = existingRoles.some(r => FLEXIBLE_ANCHOR_ROLES.has(r));
            if (!isTargetAdminOrFinance) {
                if (existingRoles.includes('tourist')) {
                    throw new Error(
                        "Tourist accounts only have access to the Tourist Portal and do not have staff role privileges."
                    );
                }
                throw new Error(
                    "Principal Supervisors, Executive Supervisors, Senior Supervisors, Supervisors, Executive Agents, Senior Agents, and Agents have a fixed single role and cannot switch roles or play multiple roles."
                );
            }

            const defaultPrimary: UserRoleType = existingRoles.includes('admin') ? 'admin' : 'finance';
            const nextPrimary: UserRoleType = dto.primary_role || defaultPrimary;

            if (!FLEXIBLE_ANCHOR_ROLES.has(nextPrimary)) {
                throw new Error("Primary role for flexible staff accounts must be Admin or Finance Staff.");
            }

            const rawSecondary = dto.secondary_role !== undefined
                ? (dto.secondary_role || null)
                : (existingRoles.find(r => r !== nextPrimary) || null);

            const nextSecondary: UserRoleType | null = rawSecondary && rawSecondary !== nextPrimary
                ? rawSecondary
                : null;

            if (nextSecondary) {
                if (nextSecondary === 'tourist' || !ALL_STAFF_ROLES.has(nextSecondary)) {
                    throw new Error(
                        "Tourist role cannot be combined with Admin or Finance accounts."
                    );
                }
            }

            finalRoles = nextSecondary ? [nextPrimary, nextSecondary] : [nextPrimary];

            // Safety check: prevent removing the 'admin' role from the last active Admin in the system
            if (existingRoles.includes('admin') && !finalRoles.includes('admin')) {
                const [{ data: activeAdmins }, { data: allRoles }, { data: allUserRoles }] = await Promise.all([
                    supabaseAdmin.from('admin_profiles').select('id, is_active').neq('id', userId),
                    supabaseAdmin.from('roles').select('id, name'),
                    supabaseAdmin.from('user_roles').select('user_id, role_id').neq('user_id', userId)
                ]);
                const roleSetMap = buildUserIdToRoleSetMap(allRoles, allUserRoles);
                const otherActiveAdmins = (activeAdmins || []).filter((ap: any) => {
                    if (ap.is_active === false) return false;
                    const rSet = roleSetMap.get(ap.id);
                    return !rSet || rSet.has('admin');
                });
                if (otherActiveAdmins.length === 0) {
                    throw new Error(
                        "Cannot remove the Admin role from the last active Admin account. Ensure another active Admin exists first."
                    );
                }
            }

            // Look up existing profile values across staff profile tables so we preserve identity fields during table sync
            const [
                { data: adminRow },
                { data: financeRow },
                { data: supRow },
                { data: agentRow }
            ] = await Promise.all([
                supabaseAdmin.from('admin_profiles').select('*').eq('id', userId).maybeSingle(),
                supabaseAdmin.from('finance_profiles').select('*').eq('id', userId).maybeSingle(),
                supabaseAdmin.from('agent_supervisor_profiles').select('*').eq('id', userId).maybeSingle(),
                supabaseAdmin.from('agent_profiles').select('*').eq('id', userId).maybeSingle()
            ]);
            const sourceProfile = adminRow || financeRow || supRow || agentRow || {};

            const mergedFirstName = dto.first_name !== undefined ? dto.first_name : (sourceProfile.first_name || '');
            const mergedLastName = dto.last_name !== undefined ? dto.last_name : (sourceProfile.last_name || '');
            const mergedPhone = dto.phone !== undefined ? dto.phone : (sourceProfile.phone ?? null);
            const mergedIsActive = dto.is_active !== undefined ? dto.is_active : (sourceProfile.is_active !== false);
            const mergedSupervisorId = dto.supervisor_id !== undefined
                ? (dto.supervisor_id || null)
                : (agentRow?.supervisor_id || supRow?.supervisor_id || null);

            // Replace user_roles rows with exact finalRoles (never retaining 'tourist')
            const { data: roleRows, error: roleLookupErr } = await supabaseAdmin
                .from('roles')
                .select('id, name')
                .in('name', finalRoles);
            if (roleLookupErr || !roleRows) {
                throw new Error(`Failed to resolve role IDs: ${roleLookupErr?.message || 'Unknown error'}`);
            }
            const roleNameMap = new Map<string, string>(roleRows.map((r: any) => [r.name, r.id]));
            for (const r of finalRoles) {
                if (!roleNameMap.has(r)) {
                    throw new Error(`Role '${r}' was not found in public.roles.`);
                }
            }

            await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
            const { error: insertUrErr } = await supabaseAdmin
                .from('user_roles')
                .insert(finalRoles.map(r => ({ user_id: userId, role_id: roleNameMap.get(r)! })));
            if (insertUrErr) {
                throw new Error(`Failed to save updated roles: ${insertUrErr.message}`);
            }

            // Upsert required staff profile tables and clean up unused staff profile tables
            const requiredTables = new Set<string>(finalRoles.map(r => getProfileTableForRole(r)));
            const allStaffTables = ['admin_profiles', 'finance_profiles', 'agent_supervisor_profiles', 'agent_profiles'];

            for (const tbl of allStaffTables) {
                if (requiredTables.has(tbl)) {
                    const isHierarchyTbl = tbl === 'agent_profiles' || tbl === 'agent_supervisor_profiles';
                    const upsertPayload: any = {
                        id: userId,
                        first_name: mergedFirstName,
                        last_name: mergedLastName,
                        phone: mergedPhone,
                        is_active: mergedIsActive,
                        ...(isHierarchyTbl ? { supervisor_id: mergedSupervisorId } : {})
                    };
                    let { error: upErr } = await supabaseAdmin.from(tbl).upsert([upsertPayload], { onConflict: 'id' });
                    if (upErr && isHierarchyTbl && (upErr.code === '23503' || upErr.code === '42703' || upErr.message?.includes('supervisor_id'))) {
                        const { supervisor_id: _s, ...fallbackPayload } = upsertPayload;
                        const retry = await supabaseAdmin.from(tbl).upsert([fallbackPayload], { onConflict: 'id' });
                        upErr = retry.error;
                    }
                    if (upErr) {
                        throw new Error(`Failed to sync ${tbl}: ${upErr.message}`);
                    }
                } else {
                    const { error: delErr } = await supabaseAdmin.from(tbl).delete().eq('id', userId);
                    if (delErr) {
                        await supabaseAdmin.from(tbl).update({ is_active: false }).eq('id', userId);
                    }
                }
            }

            if (finalRoles.some(r => AGENT_ROLES.has(r) || SUPERVISOR_ROLES.has(r))) {
                await this.saveHierarchySupervisorFallback(userId, mergedSupervisorId);
            } else {
                await this.saveHierarchySupervisorFallback(userId, null);
            }

            await supabaseAdmin.auth.admin.updateUserById(userId, {
                user_metadata: {
                    first_name: mergedFirstName,
                    last_name: mergedLastName,
                    phone: mergedPhone || '',
                    role: finalRoles[0],
                    roles: finalRoles
                }
            });

            const hrRole = finalRoles.find(r => r === 'admin')
                || finalRoles.find(r => AGENT_ROLES.has(r) || SUPERVISOR_ROLES.has(r));
            if (hrRole) {
                try {
                    const { EmployeeHrService } = await import('./employee-hr.service');
                    await EmployeeHrService.ensureEmployeeForUser(userId, hrRole);
                } catch (hrErr) {
                    console.warn('Employee HR sync warning after role update:', hrErr);
                }
            }

            return true;
        }

        // Standard profile field update (syncs across all profile tables held by this user)
        const targetRolesToUpdate = finalRoles.length > 0 ? finalRoles : [role as UserRoleType];
        const targetTables = Array.from(new Set(targetRolesToUpdate.map(r => getProfileTableForRole(r))));
        const supportsHierarchy = targetRolesToUpdate.some(r => AGENT_ROLES.has(r) || SUPERVISOR_ROLES.has(r));

        const baseUpdate: any = {
            ...(dto.first_name !== undefined && { first_name: dto.first_name }),
            ...(dto.last_name !== undefined && { last_name: dto.last_name }),
            ...(dto.phone !== undefined && { phone: dto.phone }),
            ...(dto.is_active !== undefined && { is_active: dto.is_active }),
        };

        for (const profileTable of targetTables) {
            const tableSupportsSup = profileTable === 'agent_profiles' || profileTable === 'agent_supervisor_profiles';
            const fullUpdate: any = {
                ...baseUpdate,
                ...(tableSupportsSup && dto.supervisor_id !== undefined && { supervisor_id: dto.supervisor_id || null }),
            };

            if (Object.keys(fullUpdate).length === 0) continue;

            let { error } = await supabaseAdmin
                .from(profileTable)
                .update(fullUpdate)
                .eq('id', userId);

            if (error && dto.supervisor_id !== undefined && (error.code === '23503' || error.code === '42703' || error.message?.includes('supervisor_id'))) {
                if (Object.keys(baseUpdate).length > 0) {
                    const retry = await supabaseAdmin.from(profileTable).update(baseUpdate).eq('id', userId);
                    error = retry.error;
                } else {
                    error = null;
                }
            }

            if (error) throw new Error(`Failed to update ${profileTable}: ${error.message}`);
        }

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

        // Fetch all roles and user_roles to resolve exact multi-role assignments and superior profiles
        const [
            { data: allRoles },
            { data: allUserRoles },
            { data: allAdmins },
            { data: allFinance },
            { data: allAgents },
            { data: allSupervisors },
            hierarchyMap
        ] = await Promise.all([
            supabaseAdmin.from('roles').select('id, name'),
            supabaseAdmin.from('user_roles').select('user_id, role_id'),
            supabaseAdmin.from('admin_profiles').select('*'),
            supabaseAdmin.from('finance_profiles').select('*'),
            supabaseAdmin.from('agent_profiles').select('*'),
            supabaseAdmin.from('agent_supervisor_profiles').select('*'),
            this.getHierarchyMap()
        ]);

        const roleSetMap = buildUserIdToRoleSetMap(allRoles, allUserRoles);
        const opRoleMap = buildUserIdToOperationalRoleMap(allRoles, allUserRoles);

        const staffProfileIds = new Set<string>();
        (allAdmins || []).forEach((p: any) => staffProfileIds.add(p.id));
        (allFinance || []).forEach((p: any) => staffProfileIds.add(p.id));
        (allAgents || []).forEach((p: any) => staffProfileIds.add(p.id));
        (allSupervisors || []).forEach((p: any) => staffProfileIds.add(p.id));

        const resolveRolesForUser = (uid: string, defaultTableRole: UserRoleType): UserRoleType[] => {
            const explicitSet = roleSetMap.get(uid);
            const explicitStaff = explicitSet ? Array.from(explicitSet).filter(r => r !== 'tourist') : [];
            if (explicitStaff.length > 0) {
                return normalizeAndOrderUserRoles(explicitStaff);
            }
            if (defaultTableRole === 'tourist') {
                return ['tourist'];
            }
            // Legacy fallback when user_roles has no staff entry yet
            const fb: UserRoleType[] = [];
            if ((allAdmins || []).some((a: any) => a.id === uid)) fb.push('admin');
            if ((allFinance || []).some((f: any) => f.id === uid)) fb.push('finance');
            if ((allSupervisors || []).some((s: any) => s.id === uid)) fb.push('agent_supervisor');
            if ((allAgents || []).some((a: any) => a.id === uid)) fb.push('agent');
            return fb.length > 0 ? normalizeAndOrderUserRoles(fb) : [defaultTableRole];
        };

        const personLookup = new Map<string, { first_name: string; last_name: string; role: string; role_label: string }>();
        (allAgents || []).forEach((a: any) => {
            const rName = opRoleMap.get(a.id) || 'agent';
            personLookup.set(a.id, {
                first_name: a.first_name || '',
                last_name: a.last_name || '',
                role: rName,
                role_label: ROLE_LABELS[rName] || rName
            });
        });
        (allSupervisors || []).forEach((s: any) => {
            const rName = opRoleMap.get(s.id) || 'agent_supervisor';
            personLookup.set(s.id, {
                first_name: s.first_name || '',
                last_name: s.last_name || '',
                role: rName,
                role_label: ROLE_LABELS[rName] || rName
            });
        });

        let tableRows: any[] = [];
        if (profileTable === 'admin_profiles') tableRows = allAdmins || [];
        else if (profileTable === 'finance_profiles') tableRows = allFinance || [];
        else if (profileTable === 'agent_profiles') tableRows = allAgents || [];
        else if (profileTable === 'agent_supervisor_profiles') tableRows = allSupervisors || [];
        else {
            const { data, error } = await supabaseAdmin
                .from(profileTable)
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw new Error(`Failed to fetch ${role}s: ${error.message}`);
            tableRows = data || [];
        }

        // Also include users assigned `role` in `user_roles` whose profile lives in another staff table
        if (role !== 'tourist') {
            const existingRowIds = new Set(tableRows.map((r: any) => r.id));
            roleSetMap.forEach((rSet, uid) => {
                if (rSet.has(role) && !existingRowIds.has(uid)) {
                    const fallbackRow =
                        (allAdmins || []).find((p: any) => p.id === uid) ||
                        (allFinance || []).find((p: any) => p.id === uid) ||
                        (allSupervisors || []).find((p: any) => p.id === uid) ||
                        (allAgents || []).find((p: any) => p.id === uid);
                    if (fallbackRow) {
                        tableRows.push(fallbackRow);
                        existingRowIds.add(uid);
                    }
                }
            });
        }

        const sortedRows = [...tableRows].sort((a, b) =>
            String(b.created_at || '').localeCompare(String(a.created_at || ''))
        );

        const filteredProfiles = sortedRows.filter((profile: any) => {
            if (role === 'tourist') {
                // Never list any staff user under Tourists
                const explicitSet = roleSetMap.get(profile.id);
                const hasStaffRole = explicitSet && Array.from(explicitSet).some(r => r !== 'tourist');
                if (hasStaffRole || staffProfileIds.has(profile.id)) return false;
                return true;
            }
            const resolvedRoles = resolveRolesForUser(profile.id, role);
            return resolvedRoles.includes(role);
        });

        // Get emails from auth.users (requires service role)
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        if (usersError) throw new Error(`Failed to fetch auth users: ${usersError.message}`);

        // Merge profile with auth user email, resolved multi-role metadata, and superior profile
        return filteredProfiles.map((profile: any) => {
            const authUser = usersData.users.find(u => u.id === profile.id);
            const resolvedRoles = resolveRolesForUser(profile.id, role);
            const roleMeta = deriveRoleMetadata(resolvedRoles, FLEXIBLE_ANCHOR_ROLES.has(role) ? role : undefined);
            const agentRow = (allAgents || []).find((a: any) => a.id === profile.id);
            const supRow = (allSupervisors || []).find((s: any) => s.id === profile.id);
            const effectiveSupervisorId =
                profile.supervisor_id ||
                agentRow?.supervisor_id ||
                supRow?.supervisor_id ||
                hierarchyMap[profile.id] ||
                undefined;
            const supInfo = effectiveSupervisorId ? personLookup.get(effectiveSupervisorId) : undefined;
            return {
                ...profile,
                supervisor_id: effectiveSupervisorId,
                supervisor: supInfo,
                email: authUser?.email || 'N/A',
                role,
                ...roleMeta
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

        const userIdToOpRole = buildUserIdToOperationalRoleMap(allRoles, allUserRoles);

        const candidates: Array<{ id: string; first_name: string; last_name: string; role: string; roleLabel: string; rank: number; name: string }> = [];

        (agents || []).forEach((item: any) => {
            const rName = userIdToOpRole.get(item.id) || 'agent';
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
            const rName = userIdToOpRole.get(item.id) || 'agent_supervisor';
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
