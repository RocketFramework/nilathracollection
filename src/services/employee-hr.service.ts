import sharp from "sharp";
import { createAdminClient } from "@/utils/supabase/admin";
import { emailService } from "@/services/email.service";
import {
    AGENT_ROLES,
    AdminService,
    HIERARCHY_ROLE_RANK,
    ROLE_LABELS,
    SUPERVISOR_ROLES,
    UserService
} from "@/services/user.service";
import { CommissionService } from "@/services/commission.service";
import { CommissionSimulationService } from "@/services/commission-simulation.service";
import {
    CreateEmployeeLeaveRequestDTO,
    CreateEmployeeSalaryPaymentDTO,
    EmployeeHRDTO,
    EmployeeHrWorkspaceDTO,
    EmployeeLeaveBalanceDTO,
    EmployeeLeaveRequestDTO,
    EmployeeSalaryPaymentDTO,
    ReviewEmployeeLeaveRequestDTO,
    UpdateEmployeeHRDTO
} from "@/dtos/employee-hr.dto";
import {
    EmployeeEmploymentStatus,
    EmployeeEmploymentType,
    EmployeeHalfDayPeriod,
    EmployeeLeaveStatus,
    EmployeeLeaveType,
    PerformanceRatingTier,
    SalaryPaymentMethod
} from "@/types/types";

const HR_FALLBACK_STATE_KEY = "nilathra_employee_hr_state";
const SALARY_PAYMENTS_FALLBACK_KEY = "nilathra_employee_salary_payments";
const EXCLUDED_HR_ROLES = new Set<string>(["finance", "tourist"]);

interface RawEmployeeRow {
    id: string;
    user_id: string;
    employee_code: string | null;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    role: string;
    supervisor_id: string | null;
    department: string;
    designation: string;
    employment_type: EmployeeEmploymentType;
    employment_status: EmployeeEmploymentStatus;
    join_date: string | null;
    nic_or_passport: string | null;
    address: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    hr_notes: string | null;
    salary_currency: string;
    basic_salary_lkr: number;
    fixed_allowances_lkr: number;
    epf_eligible: boolean;
    epf_number: string | null;
    bank_name: string | null;
    bank_branch: string | null;
    bank_account_number: string | null;
    bank_account_holder: string | null;
    commission_eligible: boolean;
    default_rating_tier: PerformanceRatingTier;
    custom_commission_cap_usd: number | null;
    annual_gp_target_usd: number | null;
    commission_notes: string | null;
    annual_leave_quota: number;
    casual_leave_quota: number;
    sick_leave_quota: number;
    annual_leave_carried_forward: number;
    annual_leave_opening_used: number;
    casual_leave_opening_used: number;
    sick_leave_opening_used: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface RawLeaveRequestRow {
    id: string;
    employee_id: string | null;
    user_id: string;
    leave_type: EmployeeLeaveType;
    start_date: string;
    end_date: string;
    days_count: number;
    is_half_day: boolean;
    half_day_period: EmployeeHalfDayPeriod | null;
    reason: string;
    handover_notes: string | null;
    covering_user_id: string | null;
    covering_user_name: string | null;
    status: EmployeeLeaveStatus;
    reviewed_by: string | null;
    reviewed_by_name: string | null;
    reviewed_by_role: string | null;
    reviewed_at: string | null;
    reviewer_notes: string | null;
    created_at: string;
    updated_at: string;
}

interface FallbackHrState {
    employeesByUserId: Record<string, RawEmployeeRow>;
    leaveRequests: RawLeaveRequestRow[];
}

interface RawSalaryPaymentRow {
    id: string;
    employee_id: string | null;
    user_id: string;
    salary_month: string;
    payment_date: string;
    currency: string;
    basic_salary_lkr: number;
    fixed_allowances_lkr: number;
    additions_lkr: number;
    epf_employee_deduction_lkr: number;
    other_deductions_lkr: number;
    gross_amount_lkr: number;
    net_paid_lkr: number;
    payment_method: SalaryPaymentMethod;
    payment_reference: string | null;
    bank_account_snapshot: string | null;
    slip_storage_path: string;
    slip_file_name: string | null;
    notes: string | null;
    email_sent: boolean;
    email_sent_to: string | null;
    email_sent_at: string | null;
    email_error: string | null;
    paid_by_user_id: string | null;
    paid_by_name: string | null;
    paid_by_role: string | null;
    created_at: string;
    updated_at: string;
}

function formatSalaryMonthLabel(salaryMonth: string): string {
    const match = String(salaryMonth || "").match(/^(\d{4})-(\d{2})$/);
    if (!match) return salaryMonth;
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    const d = new Date(Date.UTC(year, monthIndex, 1));
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

function getDefaultDepartmentAndDesignation(role: string): {
    department: string;
    designation: string;
    commissionEligible: boolean;
} {
    if (role === "admin") {
        return {
            department: "Management & Administration",
            designation: "Administrator",
            commissionEligible: false
        };
    }
    if (SUPERVISOR_ROLES.has(role)) {
        return {
            department: "Operations & Concierge",
            designation: ROLE_LABELS[role] || "Operations Supervisor",
            commissionEligible: true
        };
    }
    return {
        department: "Sales & Tour Planning",
        designation: ROLE_LABELS[role] ? `${ROLE_LABELS[role]} — Travel Concierge` : "Travel Concierge Agent",
        commissionEligible: true
    };
}

function isMissingTableError(error: any): boolean {
    if (!error) return false;
    return (
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        String(error.message || "").includes("Could not find the table")
    );
}

export class EmployeeHrService {
    static isEligibleEmployeeRole(role: string | null | undefined): boolean {
        if (!role) return false;
        return !EXCLUDED_HR_ROLES.has(role);
    }

    /**
     * Approval rule:
     * 1. Any user with 'admin' role can approve/reject any leave request.
     * 2. Any non-admin user in a senior role (HIERARCHY_ROLE_RANK[approver] > HIERARCHY_ROLE_RANK[requester],
     *    e.g. Senior Agent / Executive Agent / Supervisor approving Agent leave) OR who is a direct/indirect
     *    supervisor of the requester can approve/reject, except they cannot self-approve their own leave.
     */
    static canApproveLeaveForTarget(params: {
        approverUserId: string;
        approverRole: string;
        targetUserId: string;
        targetRole: string;
        approverSubordinateIds: Set<string>;
    }): boolean {
        const { approverUserId, approverRole, targetUserId, targetRole, approverSubordinateIds } = params;
        if (approverRole === "admin") {
            return true;
        }
        if (approverUserId === targetUserId) {
            return false;
        }
        if (!this.isEligibleEmployeeRole(approverRole) || !this.isEligibleEmployeeRole(targetRole)) {
            return false;
        }
        const approverRank = HIERARCHY_ROLE_RANK[approverRole] ?? 0;
        const targetRank = HIERARCHY_ROLE_RANK[targetRole] ?? 0;

        if (approverRank > targetRank && approverRank >= 2) {
            return true;
        }
        if (approverSubordinateIds.has(targetUserId)) {
            return true;
        }
        return false;
    }

    private static async loadFallbackState(): Promise<FallbackHrState> {
        try {
            const supabase = createAdminClient();
            const { data } = await supabase
                .from("app_states")
                .select("state_data")
                .eq("state_key", HR_FALLBACK_STATE_KEY)
                .maybeSingle();

            if (data?.state_data && typeof data.state_data === "object") {
                const raw = data.state_data as Partial<FallbackHrState>;
                return {
                    employeesByUserId:
                        raw.employeesByUserId && typeof raw.employeesByUserId === "object"
                            ? raw.employeesByUserId
                            : {},
                    leaveRequests: Array.isArray(raw.leaveRequests) ? raw.leaveRequests : []
                };
            }
        } catch (err) {
            console.warn("EmployeeHrService.loadFallbackState warning:", err);
        }
        return { employeesByUserId: {}, leaveRequests: [] };
    }

    private static async saveFallbackState(state: FallbackHrState): Promise<void> {
        const supabase = createAdminClient();
        await supabase.from("app_states").upsert(
            {
                state_key: HR_FALLBACK_STATE_KEY,
                state_data: state,
                updated_at: new Date().toISOString()
            },
            { onConflict: "state_key" }
        );
    }

    /**
     * Collects all system users EXCEPT 'finance' and 'tourist' from admin_profiles,
     * agent_supervisor_profiles, and agent_profiles, resolving their exact hierarchy role.
     */
    private static async collectEligibleSystemUsers(): Promise<
        Array<{
            userId: string;
            firstName: string;
            lastName: string;
            email: string;
            phone: string | null;
            role: string;
            supervisorId: string | null;
            isActive: boolean;
            createdAt: string;
        }>
    > {
        const supabase = createAdminClient();
        const [
            { data: roles },
            { data: userRoles },
            { data: admins },
            { data: supervisors },
            { data: agents },
            { data: financeProfiles },
            { data: publicUsers },
            { data: hierarchyState }
        ] = await Promise.all([
            supabase.from("roles").select("id, name"),
            supabase.from("user_roles").select("user_id, role_id"),
            supabase.from("admin_profiles").select("*"),
            supabase.from("agent_supervisor_profiles").select("*"),
            supabase.from("agent_profiles").select("*"),
            supabase.from("finance_profiles").select("id"),
            supabase.from("users").select("id, email"),
            supabase
                .from("app_states")
                .select("state_data")
                .eq("state_key", "nilathra_user_hierarchy_map")
                .maybeSingle()
        ]);

        const roleIdToName = new Map<string, string>((roles || []).map((r: any) => [r.id, r.name]));
        const userRoleSets = new Map<string, Set<string>>();

        (userRoles || []).forEach((ur: any) => {
            const rName = roleIdToName.get(ur.role_id);
            if (!rName) return;
            if (!userRoleSets.has(ur.user_id)) {
                userRoleSets.set(ur.user_id, new Set<string>());
            }
            userRoleSets.get(ur.user_id)!.add(rName);
        });

        // Strip stray signup 'tourist' rows whenever a user holds any staff role
        userRoleSets.forEach((set) => {
            if (Array.from(set).some((r) => r !== "tourist")) {
                set.delete("tourist");
            }
        });

        const resolveBestHrRole = (uid: string, fallbackRole: string): string | null => {
            const explicit = userRoleSets.get(uid);
            if (explicit && explicit.size > 0) {
                const eligibleFromExplicit = Array.from(explicit).filter((r) => !EXCLUDED_HR_ROLES.has(r));
                if (eligibleFromExplicit.length === 0) {
                    // User holds ONLY 'finance' or 'tourist' -> excluded from HR employees table
                    return null;
                }
                if (eligibleFromExplicit.includes("admin")) return "admin";
                return eligibleFromExplicit.sort(
                    (a, b) => (HIERARCHY_ROLE_RANK[b] || 0) - (HIERARCHY_ROLE_RANK[a] || 0)
                )[0];
            }
            return EXCLUDED_HR_ROLES.has(fallbackRole) ? null : fallbackRole;
        };

        const emailById = new Map<string, string>((publicUsers || []).map((u: any) => [u.id, u.email || ""]));
        try {
            const { data: authList } = await supabase.auth.admin.listUsers();
            (authList?.users || []).forEach((u) => {
                if (u.email && !emailById.get(u.id)) {
                    emailById.set(u.id, u.email);
                }
            });
        } catch {
            // Ignore auth list fallback failure if public.users already had emails
        }

        const hierarchyMap: Record<string, string | null> =
            hierarchyState?.state_data && typeof hierarchyState.state_data === "object"
                ? (hierarchyState.state_data as Record<string, string | null>)
                : {};

        const collected = new Map<
            string,
            {
                userId: string;
                firstName: string;
                lastName: string;
                email: string;
                phone: string | null;
                role: string;
                supervisorId: string | null;
                isActive: boolean;
                createdAt: string;
            }
        >();

        // 1. Admins (including Admin + Finance or Admin + Operational dual-role staff)
        (admins || []).forEach((ap: any) => {
            const effRole = resolveBestHrRole(ap.id, "admin");
            if (!effRole) return;
            collected.set(ap.id, {
                userId: ap.id,
                firstName: ap.first_name || "",
                lastName: ap.last_name || "",
                email: emailById.get(ap.id) || "",
                phone: ap.phone || null,
                role: effRole,
                supervisorId: null,
                isActive: ap.is_active !== false,
                createdAt: ap.created_at || new Date().toISOString()
            });
        });

        // 2. Supervisors (including Finance + Supervisor dual-role staff)
        (supervisors || []).forEach((sp: any) => {
            if (collected.has(sp.id)) return;
            const effRole = resolveBestHrRole(sp.id, "agent_supervisor");
            if (!effRole) return;
            collected.set(sp.id, {
                userId: sp.id,
                firstName: sp.first_name || "",
                lastName: sp.last_name || "",
                email: emailById.get(sp.id) || "",
                phone: sp.phone || null,
                role: effRole,
                supervisorId: sp.supervisor_id || hierarchyMap[sp.id] || null,
                isActive: sp.is_active !== false,
                createdAt: sp.created_at || new Date().toISOString()
            });
        });

        // 3. Agents — Agent, Senior Agent, Executive Agent (including Finance + Senior Agent dual-role staff)
        (agents || []).forEach((ag: any) => {
            if (collected.has(ag.id)) return;
            const effRole = resolveBestHrRole(ag.id, "agent");
            if (!effRole) return;
            collected.set(ag.id, {
                userId: ag.id,
                firstName: ag.first_name || "",
                lastName: ag.last_name || "",
                email: emailById.get(ag.id) || "",
                phone: ag.phone || null,
                role: effRole,
                supervisorId: ag.supervisor_id || hierarchyMap[ag.id] || null,
                isActive: ag.is_active !== false,
                createdAt: ag.created_at || new Date().toISOString()
            });
        });

        return Array.from(collected.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }

    /**
     * Syncs all eligible system users (excluding Finance & Tourists) into the employees store
     * (SQL table `public.employees` if created, or `app_states` fallback until migration is run).
     */
    static async syncAndLoadRawData(): Promise<{
        usingSqlTables: boolean;
        employees: RawEmployeeRow[];
        leaveRequests: RawLeaveRequestRow[];
    }> {
        const supabase = createAdminClient();
        const systemUsers = await this.collectEligibleSystemUsers();
        const systemUserMap = new Map(systemUsers.map((u) => [u.userId, u]));

        // Check if SQL `public.employees` table exists
        const { data: existingSqlEmployees, error: empErr } = await supabase
            .from("employees")
            .select("*")
            .order("created_at", { ascending: true });

        if (!empErr && existingSqlEmployees) {
            const fallback = await this.loadFallbackState();
            const existingByUser = new Map<string, RawEmployeeRow>(
                (existingSqlEmployees as RawEmployeeRow[]).map((r) => [r.user_id, r])
            );

            let maxCodeNum = 0;
            for (const row of existingSqlEmployees as RawEmployeeRow[]) {
                const m = String(row.employee_code || "").match(/(\d+)$/);
                if (m) maxCodeNum = Math.max(maxCodeNum, parseInt(m[1], 10));
            }

            const toInsert: any[] = [];
            for (const sysUser of systemUsers) {
                const existing = existingByUser.get(sysUser.userId);
                if (!existing) {
                    maxCodeNum += 1;
                    const fb = fallback.employeesByUserId[sysUser.userId];
                    const defaults = getDefaultDepartmentAndDesignation(sysUser.role);
                    toInsert.push({
                        user_id: sysUser.userId,
                        employee_code: fb?.employee_code || `EMP-${String(maxCodeNum).padStart(3, "0")}`,
                        first_name: sysUser.firstName,
                        last_name: sysUser.lastName,
                        email: sysUser.email,
                        phone: fb?.phone ?? sysUser.phone,
                        role: sysUser.role,
                        supervisor_id: sysUser.supervisorId,
                        department: fb?.department || defaults.department,
                        designation: fb?.designation || defaults.designation,
                        employment_type: fb?.employment_type || "Full-Time",
                        employment_status: fb?.employment_status || (sysUser.isActive ? "Active" : "Suspended"),
                        join_date: fb?.join_date || (sysUser.createdAt ? sysUser.createdAt.split("T")[0] : null),
                        nic_or_passport: fb?.nic_or_passport || null,
                        address: fb?.address || null,
                        emergency_contact_name: fb?.emergency_contact_name || null,
                        emergency_contact_phone: fb?.emergency_contact_phone || null,
                        hr_notes: fb?.hr_notes || null,
                        salary_currency: fb?.salary_currency || "LKR",
                        basic_salary_lkr: fb?.basic_salary_lkr ?? 0,
                        fixed_allowances_lkr: fb?.fixed_allowances_lkr ?? 0,
                        epf_eligible: fb?.epf_eligible ?? true,
                        epf_number: fb?.epf_number || null,
                        bank_name: fb?.bank_name || null,
                        bank_branch: fb?.bank_branch || null,
                        bank_account_number: fb?.bank_account_number || null,
                        bank_account_holder: fb?.bank_account_holder || null,
                        commission_eligible: fb?.commission_eligible ?? defaults.commissionEligible,
                        default_rating_tier: fb?.default_rating_tier || "meets",
                        custom_commission_cap_usd: fb?.custom_commission_cap_usd ?? null,
                        annual_gp_target_usd: fb?.annual_gp_target_usd ?? null,
                        commission_notes: fb?.commission_notes || null,
                        annual_leave_quota: fb?.annual_leave_quota ?? 14,
                        casual_leave_quota: fb?.casual_leave_quota ?? 7,
                        sick_leave_quota: fb?.sick_leave_quota ?? 7,
                        annual_leave_carried_forward: fb?.annual_leave_carried_forward ?? 0,
                        annual_leave_opening_used: fb?.annual_leave_opening_used ?? 0,
                        casual_leave_opening_used: fb?.casual_leave_opening_used ?? 0,
                        sick_leave_opening_used: fb?.sick_leave_opening_used ?? 0,
                        is_active: sysUser.isActive
                    });
                } else if (
                    existing.role !== sysUser.role ||
                    existing.email !== sysUser.email ||
                    (sysUser.supervisorId !== existing.supervisor_id && sysUser.supervisorId !== null)
                ) {
                    // Keep core identity/role/hierarchy synced with User Management
                    await supabase
                        .from("employees")
                        .update({
                            role: sysUser.role,
                            email: sysUser.email || existing.email,
                            supervisor_id: sysUser.supervisorId ?? existing.supervisor_id,
                            updated_at: new Date().toISOString()
                        })
                        .eq("id", existing.id);
                }
            }

            if (toInsert.length > 0) {
                await supabase.from("employees").upsert(toInsert, { onConflict: "user_id" });
            }

            const { data: refreshedEmployees } = await supabase
                .from("employees")
                .select("*")
                .order("employee_code", { ascending: true });

            const filteredEmployees = ((refreshedEmployees || existingSqlEmployees) as RawEmployeeRow[]).filter(
                (e) => this.isEligibleEmployeeRole(e.role) && systemUserMap.has(e.user_id)
            );

            // Migrate any fallback leave requests if SQL leave table is empty
            let leaveRows: RawLeaveRequestRow[] = [];
            const { data: sqlLeaves, error: leaveErr } = await supabase
                .from("employee_leave_requests")
                .select("*")
                .order("created_at", { ascending: false });

            if (!leaveErr && sqlLeaves) {
                if (sqlLeaves.length === 0 && fallback.leaveRequests.length > 0) {
                    const empIdByUser = new Map(filteredEmployees.map((e) => [e.user_id, e.id]));
                    const migratedLeaves = fallback.leaveRequests
                        .filter((lr) => empIdByUser.has(lr.user_id))
                        .map((lr) => ({
                            ...lr,
                            employee_id: empIdByUser.get(lr.user_id) || null
                        }));
                    if (migratedLeaves.length > 0) {
                        const { data: insertedLeaves } = await supabase
                            .from("employee_leave_requests")
                            .upsert(migratedLeaves, { onConflict: "id" })
                            .select("*");
                        leaveRows = (insertedLeaves || []) as RawLeaveRequestRow[];
                    }
                } else {
                    leaveRows = sqlLeaves as RawLeaveRequestRow[];
                }
            }

            return {
                usingSqlTables: true,
                employees: filteredEmployees,
                leaveRequests: leaveRows
            };
        }

        if (!isMissingTableError(empErr)) {
            throw empErr;
        }

        // Fallback mode via app_states until SQL migration is executed
        const fallback = await this.loadFallbackState();
        let mutated = false;
        let maxCodeNum = 0;

        Object.values(fallback.employeesByUserId).forEach((row) => {
            const m = String(row.employee_code || "").match(/(\d+)$/);
            if (m) maxCodeNum = Math.max(maxCodeNum, parseInt(m[1], 10));
        });

        for (const sysUser of systemUsers) {
            const existing = fallback.employeesByUserId[sysUser.userId];
            if (!existing) {
                maxCodeNum += 1;
                const defaults = getDefaultDepartmentAndDesignation(sysUser.role);
                const nowIso = new Date().toISOString();
                fallback.employeesByUserId[sysUser.userId] = {
                    id: crypto.randomUUID(),
                    user_id: sysUser.userId,
                    employee_code: `EMP-${String(maxCodeNum).padStart(3, "0")}`,
                    first_name: sysUser.firstName,
                    last_name: sysUser.lastName,
                    email: sysUser.email,
                    phone: sysUser.phone,
                    role: sysUser.role,
                    supervisor_id: sysUser.supervisorId,
                    department: defaults.department,
                    designation: defaults.designation,
                    employment_type: "Full-Time",
                    employment_status: sysUser.isActive ? "Active" : "Suspended",
                    join_date: sysUser.createdAt ? sysUser.createdAt.split("T")[0] : null,
                    nic_or_passport: null,
                    address: null,
                    emergency_contact_name: null,
                    emergency_contact_phone: null,
                    hr_notes: null,
                    salary_currency: "LKR",
                    basic_salary_lkr: 0,
                    fixed_allowances_lkr: 0,
                    epf_eligible: true,
                    epf_number: null,
                    bank_name: null,
                    bank_branch: null,
                    bank_account_number: null,
                    bank_account_holder: null,
                    commission_eligible: defaults.commissionEligible,
                    default_rating_tier: "meets",
                    custom_commission_cap_usd: null,
                    annual_gp_target_usd: null,
                    commission_notes: null,
                    annual_leave_quota: 14,
                    casual_leave_quota: 7,
                    sick_leave_quota: 7,
                    annual_leave_carried_forward: 0,
                    annual_leave_opening_used: 0,
                    casual_leave_opening_used: 0,
                    sick_leave_opening_used: 0,
                    is_active: sysUser.isActive,
                    created_at: nowIso,
                    updated_at: nowIso
                };
                mutated = true;
            } else if (
                existing.role !== sysUser.role ||
                existing.email !== sysUser.email ||
                existing.first_name !== sysUser.firstName ||
                existing.last_name !== sysUser.lastName
            ) {
                existing.role = sysUser.role;
                existing.email = sysUser.email || existing.email;
                existing.first_name = sysUser.firstName || existing.first_name;
                existing.last_name = sysUser.lastName || existing.last_name;
                if (sysUser.supervisorId) existing.supervisor_id = sysUser.supervisorId;
                existing.updated_at = new Date().toISOString();
                mutated = true;
            }
        }

        // Remove any user whose role changed to finance or tourist
        for (const uid of Object.keys(fallback.employeesByUserId)) {
            if (!systemUserMap.has(uid)) {
                delete fallback.employeesByUserId[uid];
                mutated = true;
            }
        }

        if (mutated) {
            await this.saveFallbackState(fallback);
        }

        const activeEmployees = Object.values(fallback.employeesByUserId).sort((a, b) =>
            String(a.employee_code || "").localeCompare(String(b.employee_code || ""))
        );

        return {
            usingSqlTables: false,
            employees: activeEmployees,
            leaveRequests: [...fallback.leaveRequests].sort((a, b) =>
                b.created_at.localeCompare(a.created_at)
            )
        };
    }

    /**
     * Ensures a single non-Finance, non-Tourist user is registered in `employees`.
     * Called automatically when a staff user is created or updated in User Management.
     */
    static async ensureEmployeeForUser(userId: string, role: string): Promise<void> {
        if (!this.isEligibleEmployeeRole(role)) return;
        try {
            await this.syncAndLoadRawData();
        } catch (err) {
            console.warn("EmployeeHrService.ensureEmployeeForUser warning:", err);
        }
    }

    private static async loadFallbackSalaryPayments(): Promise<RawSalaryPaymentRow[]> {
        try {
            const supabase = createAdminClient();
            const { data } = await supabase
                .from("app_states")
                .select("state_data")
                .eq("state_key", SALARY_PAYMENTS_FALLBACK_KEY)
                .maybeSingle();

            if (data?.state_data && Array.isArray(data.state_data)) {
                return data.state_data as RawSalaryPaymentRow[];
            }
        } catch (err) {
            console.warn("EmployeeHrService.loadFallbackSalaryPayments warning:", err);
        }
        return [];
    }

    private static async saveFallbackSalaryPayments(rows: RawSalaryPaymentRow[]): Promise<void> {
        const supabase = createAdminClient();
        await supabase.from("app_states").upsert(
            {
                state_key: SALARY_PAYMENTS_FALLBACK_KEY,
                state_data: rows,
                updated_at: new Date().toISOString()
            },
            { onConflict: "state_key" }
        );
    }

    private static async loadSalaryPaymentsData(
        empByUserId: Map<string, RawEmployeeRow>
    ): Promise<{ usingSalarySqlTable: boolean; rows: RawSalaryPaymentRow[] }> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("employee_salary_payments")
            .select("*")
            .order("salary_month", { ascending: false })
            .order("payment_date", { ascending: false })
            .order("created_at", { ascending: false });

        if (error) {
            if (isMissingTableError(error)) {
                const fallbackRows = await this.loadFallbackSalaryPayments();
                return {
                    usingSalarySqlTable: false,
                    rows: fallbackRows.sort(
                        (a, b) =>
                            b.salary_month.localeCompare(a.salary_month) ||
                            b.payment_date.localeCompare(a.payment_date) ||
                            b.created_at.localeCompare(a.created_at)
                    )
                };
            }
            console.error("Failed reading employee_salary_payments:", error);
            return { usingSalarySqlTable: true, rows: [] };
        }

        let dbRows = (data || []) as RawSalaryPaymentRow[];

        // Auto-migrate any fallback salary payments if SQL table was just created
        const fallbackRows = await this.loadFallbackSalaryPayments();
        if (fallbackRows.length > 0) {
            const existingIds = new Set(dbRows.map((r) => r.id));
            const toMigrate = fallbackRows
                .filter((r) => !existingIds.has(r.id))
                .map((r) => ({
                    ...r,
                    employee_id: empByUserId.get(r.user_id)?.id || r.employee_id || null
                }));
            if (toMigrate.length > 0) {
                const { error: migErr } = await supabase
                    .from("employee_salary_payments")
                    .insert(toMigrate);
                if (!migErr) {
                    dbRows = [...toMigrate, ...dbRows].sort(
                        (a, b) =>
                            b.salary_month.localeCompare(a.salary_month) ||
                            b.payment_date.localeCompare(a.payment_date) ||
                            b.created_at.localeCompare(a.created_at)
                    );
                    await this.saveFallbackSalaryPayments([]);
                }
            } else {
                await this.saveFallbackSalaryPayments([]);
            }
        }

        return { usingSalarySqlTable: true, rows: dbRows };
    }

    private static resolveCallerHrAccess(
        caller: Awaited<ReturnType<typeof UserService.getCurrentUserProfile>>
    ): {
        isEligible: boolean;
        isAdmin: boolean;
        isFinance: boolean;
        canManagePayroll: boolean;
        isEmployeeMember: boolean;
        effectiveRole: string;
    } {
        if (!caller || !caller.id) {
            return {
                isEligible: false,
                isAdmin: false,
                isFinance: false,
                canManagePayroll: false,
                isEmployeeMember: false,
                effectiveRole: "guest"
            };
        }
        const roles =
            caller.roles && caller.roles.length > 0
                ? caller.roles
                : caller.role
                  ? [caller.role]
                  : [];
        const isAdmin = roles.includes("admin") || caller.role === "admin";
        const isFinance = roles.includes("finance") || caller.role === "finance";
        if (isAdmin) {
            return {
                isEligible: true,
                isAdmin: true,
                isFinance,
                canManagePayroll: true,
                isEmployeeMember: true,
                effectiveRole: "admin"
            };
        }
        const bestOp = roles
            .filter((r) => this.isEligibleEmployeeRole(r))
            .sort((a, b) => (HIERARCHY_ROLE_RANK[b] || 0) - (HIERARCHY_ROLE_RANK[a] || 0))[0];
        if (bestOp) {
            return {
                isEligible: true,
                isAdmin: false,
                isFinance,
                canManagePayroll: isFinance,
                isEmployeeMember: true,
                effectiveRole: bestOp
            };
        }
        if (isFinance) {
            return {
                isEligible: true,
                isAdmin: false,
                isFinance: true,
                canManagePayroll: true,
                isEmployeeMember: false,
                effectiveRole: "finance"
            };
        }
        const fallbackRole = caller.role || "guest";
        const empEligible = this.isEligibleEmployeeRole(fallbackRole);
        return {
            isEligible: empEligible,
            isAdmin: false,
            isFinance: false,
            canManagePayroll: false,
            isEmployeeMember: empEligible,
            effectiveRole: fallbackRole
        };
    }

    /**
     * Builds the complete HR, Leave & Payroll Management workspace payload,
     * applying strict role-based visibility and payroll/leave permissions.
     */
    static async getWorkspaceData(): Promise<EmployeeHrWorkspaceDTO> {
        const callerProfile = await UserService.getCurrentUserProfile();
        const callerAccess = this.resolveCallerHrAccess(callerProfile);
        const now = new Date();
        const currentSalaryMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        if (!callerProfile || !callerAccess.isEligible) {
            return {
                isEligibleViewer: false,
                usingSqlTables: false,
                usingSalaryPaymentsSqlTable: false,
                currentYear: now.getFullYear(),
                currentUser: {
                    userId: callerProfile?.id || "",
                    name: "",
                    email: callerProfile?.email || "",
                    role: callerProfile?.role || "guest",
                    roleLabel: ROLE_LABELS[callerProfile?.role || ""] || "Guest",
                    roleRank: 0,
                    isAdmin: false,
                    isFinance: false,
                    canManagePayroll: false,
                    canApproveJuniorLeaves: false
                },
                summary: {
                    totalActiveEmployees: 0,
                    adminsCount: 0,
                    supervisorsCount: 0,
                    agentsCount: 0,
                    onLeaveTodayCount: 0,
                    onLeaveTodayNames: [],
                    pendingApprovalsForMeCount: 0,
                    totalMonthlyFixedPayrollLkr: null,
                    currentSalaryMonth,
                    paidThisMonthCount: 0,
                    paidThisMonthTotalLkr: null
                },
                employees: [],
                leaveRequests: [],
                salaryPayments: [],
                supervisorOptions: []
            };
        }

        const callerRole = callerAccess.effectiveRole;
        const callerRank = callerAccess.isAdmin ? 8 : (HIERARCHY_ROLE_RANK[callerRole] ?? 0);
        const isAdmin = callerAccess.isAdmin;
        const isFinance = callerAccess.isFinance;
        const canManagePayroll = callerAccess.canManagePayroll;

        const [rawData, subordinateList, ruleVersions, tourCommissions] = await Promise.all([
            this.syncAndLoadRawData(),
            AdminService.getUserAndSubordinateIds(callerProfile.id),
            CommissionService.getRuleVersions(),
            CommissionService.getTourCommissions(new Map())
        ]);

        const subordinateIds = new Set<string>(subordinateList.filter((id) => id !== callerProfile.id));
        const activeRule =
            ruleVersions.find((v) => v.isActive)?.rules ||
            ruleVersions[0]?.rules ||
            CommissionSimulationService.getDefaultRules();

        // Build per-user commission earnings lookup from tour_commissions
        const commStatsByUser = new Map<
            string,
            {
                toursSet: Set<string>;
                earnedUsd: number;
                earnedLkr: number;
                pendingUsd: number;
            }
        >();

        for (const tc of tourCommissions) {
            if (tc.status === "Cancelled" || tc.status === "Not Eligible") continue;
            for (const alloc of tc.allocations || []) {
                if (!alloc.userId || alloc.finalAmountUsd <= 0) continue;
                let entry = commStatsByUser.get(alloc.userId);
                if (!entry) {
                    entry = { toursSet: new Set(), earnedUsd: 0, earnedLkr: 0, pendingUsd: 0 };
                    commStatsByUser.set(alloc.userId, entry);
                }
                entry.toursSet.add(tc.tourId);
                if (tc.status === "Approved" || tc.status === "Paid") {
                    entry.earnedUsd += Number(alloc.finalAmountUsd || 0);
                    entry.earnedLkr += Number(alloc.finalAmountLkr || 0);
                } else {
                    entry.pendingUsd += Number(alloc.finalAmountUsd || 0);
                }
            }
        }

        const empByUserId = new Map<string, RawEmployeeRow>(
            rawData.employees.map((e) => [e.user_id, e])
        );

        const currentYear = new Date().getFullYear();
        const todayIso = new Date().toISOString().split("T")[0];

        const computeLeaveBalance = (
            leaveType: EmployeeLeaveType,
            quota: number,
            carriedForward: number,
            openingUsed: number,
            userLeaves: RawLeaveRequestRow[]
        ): EmployeeLeaveBalanceDTO => {
            const yearPrefix = `${currentYear}-`;
            const relevant = userLeaves.filter(
                (lr) => lr.leave_type === leaveType && String(lr.start_date).startsWith(yearPrefix)
            );
            const approvedUsed = relevant
                .filter((lr) => lr.status === "Approved")
                .reduce((s, lr) => s + Number(lr.days_count || 0), 0);
            const pending = relevant
                .filter((lr) => lr.status === "Pending")
                .reduce((s, lr) => s + Number(lr.days_count || 0), 0);
            const totalUsed = Number(openingUsed || 0) + approvedUsed;
            const remaining = Math.max(0, Number(quota || 0) + Number(carriedForward || 0) - totalUsed);

            return {
                leaveType,
                quota: Number(quota || 0),
                carriedForward: Number(carriedForward || 0),
                openingUsed: Number(openingUsed || 0),
                approvedUsed,
                totalUsed,
                pending,
                remaining
            };
        };

        const allEmployeeDtos: EmployeeHRDTO[] = rawData.employees.map((row) => {
            const userLeaves = rawData.leaveRequests.filter((lr) => lr.user_id === row.user_id);
            const supRow = row.supervisor_id ? empByUserId.get(row.supervisor_id) : undefined;
            const supName = supRow
                ? `${supRow.first_name || ""} ${supRow.last_name || ""}`.trim() || supRow.email
                : null;
            const supRoleLabel = supRow ? ROLE_LABELS[supRow.role] || supRow.role : null;

            const isSelf = row.user_id === callerProfile.id;
            const canViewComp = isAdmin || canManagePayroll || isSelf;
            const canApprove = this.canApproveLeaveForTarget({
                approverUserId: callerProfile.id,
                approverRole: callerRole,
                targetUserId: row.user_id,
                targetRole: row.role,
                approverSubordinateIds: subordinateIds
            });

            const isOnLeaveToday =
                row.employment_status === "On Leave" ||
                userLeaves.some(
                    (lr) =>
                        lr.status === "Approved" &&
                        lr.start_date <= todayIso &&
                        lr.end_date >= todayIso
                );

            const ratingTier: PerformanceRatingTier = row.default_rating_tier || "meets";
            const appliedMultiplier = activeRule.performanceMultipliers[ratingTier] ?? 1.0;
            const systemRoleCapUsd =
                activeRule.enablePerEmployeeCap && activeRule.roleMaxCapUsd?.[row.role] > 0
                    ? Number(activeRule.roleMaxCapUsd[row.role])
                    : null;
            const customCapUsd =
                row.custom_commission_cap_usd !== null &&
                row.custom_commission_cap_usd !== undefined &&
                Number(row.custom_commission_cap_usd) > 0
                    ? Number(row.custom_commission_cap_usd)
                    : null;
            const commStats = commStatsByUser.get(row.user_id);

            const basicLkr = Number(row.basic_salary_lkr || 0);
            const allowLkr = Number(row.fixed_allowances_lkr || 0);

            return {
                id: row.id,
                userId: row.user_id,
                employeeCode: row.employee_code || "EMP-000",
                firstName: row.first_name || "",
                lastName: row.last_name || "",
                fullName: `${row.first_name || ""} ${row.last_name || ""}`.trim() || row.email,
                email: row.email || "",
                phone: row.phone || null,
                role: row.role,
                roleLabel: ROLE_LABELS[row.role] || row.role,
                roleRank: HIERARCHY_ROLE_RANK[row.role] ?? 1,
                supervisorId: row.supervisor_id || null,
                supervisorName: supName,
                supervisorRoleLabel: supRoleLabel,
                department: row.department || "Operations & Concierge",
                designation: row.designation || (ROLE_LABELS[row.role] || "Staff"),
                employmentType: row.employment_type || "Full-Time",
                employmentStatus: row.employment_status || "Active",
                joinDate: row.join_date || null,
                nicOrPassport: canViewComp ? row.nic_or_passport || null : null,
                address: canViewComp ? row.address || null : null,
                emergencyContactName: isAdmin || isSelf || canApprove ? row.emergency_contact_name || null : null,
                emergencyContactPhone: isAdmin || isSelf || canApprove ? row.emergency_contact_phone || null : null,
                hrNotes: isAdmin ? row.hr_notes || null : null,
                salaryCurrency: row.salary_currency || "LKR",
                basicSalaryLkr: canViewComp ? basicLkr : null,
                fixedAllowancesLkr: canViewComp ? allowLkr : null,
                totalFixedMonthlyLkr: canViewComp ? basicLkr + allowLkr : null,
                epfEligible: Boolean(row.epf_eligible),
                epfNumber: canViewComp ? row.epf_number || null : null,
                bankName: canViewComp ? row.bank_name || null : null,
                bankBranch: canViewComp ? row.bank_branch || null : null,
                bankAccountNumber: canViewComp ? row.bank_account_number || null : null,
                bankAccountHolder: canViewComp ? row.bank_account_holder || null : null,
                annualLeaveQuota: Number(row.annual_leave_quota ?? 14),
                casualLeaveQuota: Number(row.casual_leave_quota ?? 7),
                sickLeaveQuota: Number(row.sick_leave_quota ?? 7),
                annualLeaveCarriedForward: Number(row.annual_leave_carried_forward ?? 0),
                annualLeaveOpeningUsed: Number(row.annual_leave_opening_used ?? 0),
                casualLeaveOpeningUsed: Number(row.casual_leave_opening_used ?? 0),
                sickLeaveOpeningUsed: Number(row.sick_leave_opening_used ?? 0),
                leaveBalances: {
                    annual: computeLeaveBalance(
                        "Annual",
                        row.annual_leave_quota ?? 14,
                        row.annual_leave_carried_forward ?? 0,
                        row.annual_leave_opening_used ?? 0,
                        userLeaves
                    ),
                    casual: computeLeaveBalance(
                        "Casual",
                        row.casual_leave_quota ?? 7,
                        0,
                        row.casual_leave_opening_used ?? 0,
                        userLeaves
                    ),
                    sick: computeLeaveBalance(
                        "Sick",
                        row.sick_leave_quota ?? 7,
                        0,
                        row.sick_leave_opening_used ?? 0,
                        userLeaves
                    )
                },
                commission: {
                    commissionEligible: Boolean(row.commission_eligible),
                    defaultRatingTier: ratingTier,
                    appliedMultiplier,
                    systemRoleCapUsd,
                    customCapUsd,
                    effectiveCapUsd: customCapUsd ?? systemRoleCapUsd,
                    annualGpTargetUsd: canViewComp && row.annual_gp_target_usd != null ? Number(row.annual_gp_target_usd) : null,
                    toursContributedCount: commStats ? commStats.toursSet.size : 0,
                    earnedApprovedAndPaidUsd: canViewComp && commStats ? Math.round(commStats.earnedUsd * 100) / 100 : 0,
                    earnedApprovedAndPaidLkr: canViewComp && commStats ? Math.round(commStats.earnedLkr * 100) / 100 : 0,
                    pendingCommissionUsd: canViewComp && commStats ? Math.round(commStats.pendingUsd * 100) / 100 : 0,
                    commissionNotes: canViewComp ? row.commission_notes || null : null
                },
                isOnLeaveToday,
                isActive: row.is_active !== false,
                canCallerViewCompensation: canViewComp,
                canCallerEditHrMaster: isAdmin,
                canCallerApproveLeave: canApprove,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            };
        });

        // Filter visible employees for non-admins:
        // - Admin & Finance see all employees (Finance needs full roster & bank details for payroll)
        // - Senior roles see themselves + employees they can approve/supervise + office staff basic directory
        //   (compensation & private fields are already redacted for other employees!)
        const visibleEmployees =
            isAdmin || canManagePayroll
                ? allEmployeeDtos
                : allEmployeeDtos.filter(
                      (emp) =>
                          emp.userId === callerProfile.id ||
                          emp.canCallerApproveLeave ||
                          emp.isActive
                  );

        const dtoByUserId = new Map(allEmployeeDtos.map((e) => [e.userId, e]));
        const salaryPaymentsRaw = await this.loadSalaryPaymentsData(empByUserId);

        const visibleSalaryPayments: EmployeeSalaryPaymentDTO[] = salaryPaymentsRaw.rows
            .map((sp) => {
                const emp = dtoByUserId.get(sp.user_id);
                if (!emp) return null;
                if (!canManagePayroll && sp.user_id !== callerProfile.id) {
                    return null;
                }
                return {
                    id: sp.id,
                    employeeId: sp.employee_id || emp.id,
                    userId: sp.user_id,
                    employeeCode: emp.employeeCode,
                    employeeName: emp.fullName,
                    employeeEmail: emp.email,
                    employeeRole: emp.role,
                    employeeRoleLabel: emp.roleLabel,
                    department: emp.department,
                    salaryMonth: sp.salary_month,
                    paymentDate: sp.payment_date,
                    currency: sp.currency || "LKR",
                    basicSalaryLkr: Number(sp.basic_salary_lkr || 0),
                    fixedAllowancesLkr: Number(sp.fixed_allowances_lkr || 0),
                    additionsLkr: Number(sp.additions_lkr || 0),
                    epfEmployeeDeductionLkr: Number(sp.epf_employee_deduction_lkr || 0),
                    otherDeductionsLkr: Number(sp.other_deductions_lkr || 0),
                    grossAmountLkr: Number(sp.gross_amount_lkr || 0),
                    netPaidLkr: Number(sp.net_paid_lkr || 0),
                    paymentMethod: (sp.payment_method as SalaryPaymentMethod) || "Bank Transfer",
                    paymentReference: sp.payment_reference || null,
                    bankAccountSnapshot: sp.bank_account_snapshot || null,
                    slipStoragePath: sp.slip_storage_path,
                    slipFileName: sp.slip_file_name || null,
                    notes: sp.notes || null,
                    emailSent: Boolean(sp.email_sent),
                    emailSentTo: sp.email_sent_to || null,
                    emailSentAt: sp.email_sent_at || null,
                    emailError: sp.email_error || null,
                    paidByUserId: sp.paid_by_user_id || null,
                    paidByName: sp.paid_by_name || null,
                    paidByRole: sp.paid_by_role
                        ? ROLE_LABELS[sp.paid_by_role] || sp.paid_by_role
                        : null,
                    createdAt: sp.created_at,
                    updatedAt: sp.updated_at
                } as EmployeeSalaryPaymentDTO;
            })
            .filter((x): x is EmployeeSalaryPaymentDTO => x !== null);

        const visibleLeaveRequests: EmployeeLeaveRequestDTO[] = rawData.leaveRequests
            .map((lr) => {
                const emp = dtoByUserId.get(lr.user_id);
                if (!emp) return null;
                const canApproveOrReject =
                    lr.status === "Pending" &&
                    this.canApproveLeaveForTarget({
                        approverUserId: callerProfile.id,
                        approverRole: callerRole,
                        targetUserId: lr.user_id,
                        targetRole: emp.role,
                        approverSubordinateIds: subordinateIds
                    });
                const canCancel =
                    lr.status === "Pending" && (lr.user_id === callerProfile.id || isAdmin);

                // Visibility: Admin sees all; senior role sees own + junior/subordinate requests; agent sees own
                const canViewRequest =
                    isAdmin ||
                    lr.user_id === callerProfile.id ||
                    this.canApproveLeaveForTarget({
                        approverUserId: callerProfile.id,
                        approverRole: callerRole,
                        targetUserId: lr.user_id,
                        targetRole: emp.role,
                        approverSubordinateIds: subordinateIds
                    });

                if (!canViewRequest) return null;

                return {
                    id: lr.id,
                    employeeId: emp.id,
                    userId: lr.user_id,
                    employeeCode: emp.employeeCode,
                    employeeName: emp.fullName,
                    employeeRole: emp.role,
                    employeeRoleLabel: emp.roleLabel,
                    department: emp.department,
                    leaveType: lr.leave_type,
                    startDate: lr.start_date,
                    endDate: lr.end_date,
                    daysCount: Number(lr.days_count),
                    isHalfDay: Boolean(lr.is_half_day),
                    halfDayPeriod: lr.half_day_period || null,
                    reason: lr.reason,
                    handoverNotes: lr.handover_notes || null,
                    coveringUserId: lr.covering_user_id || null,
                    coveringUserName: lr.covering_user_name || null,
                    status: lr.status,
                    reviewedBy: lr.reviewed_by || null,
                    reviewedByName: lr.reviewed_by_name || null,
                    reviewedByRole: lr.reviewed_by_role
                        ? ROLE_LABELS[lr.reviewed_by_role] || lr.reviewed_by_role
                        : null,
                    reviewedAt: lr.reviewed_at || null,
                    reviewerNotes: lr.reviewer_notes || null,
                    canCallerApproveOrReject: canApproveOrReject,
                    canCallerCancel: canCancel,
                    createdAt: lr.created_at,
                    updatedAt: lr.updated_at
                } as EmployeeLeaveRequestDTO;
            })
            .filter((x): x is EmployeeLeaveRequestDTO => x !== null);

        const activeStaff = allEmployeeDtos.filter(
            (e) => e.isActive && e.employmentStatus !== "Resigned"
        );
        const onLeaveToday = activeStaff.filter((e) => e.isOnLeaveToday);
        const totalMonthlyFixedPayrollLkr =
            isAdmin || canManagePayroll
                ? activeStaff.reduce((sum, e) => sum + Number(e.totalFixedMonthlyLkr || 0), 0)
                : null;

        const paidThisMonthRows = salaryPaymentsRaw.rows.filter(
            (sp) => sp.salary_month === currentSalaryMonth
        );
        const paidThisMonthEmployeeIds = new Set(paidThisMonthRows.map((sp) => sp.user_id));
        const paidThisMonthTotalLkr =
            isAdmin || canManagePayroll
                ? paidThisMonthRows.reduce((sum, sp) => sum + Number(sp.net_paid_lkr || 0), 0)
                : null;

        const callerEmp = dtoByUserId.get(callerProfile.id);
        const callerFullName =
            callerEmp?.fullName ||
            `${callerProfile.first_name || ""} ${callerProfile.last_name || ""}`.trim() ||
            callerProfile.email ||
            "Staff";

        const supervisorOptions = activeStaff
            .filter((e) => e.roleRank >= 2)
            .map((e) => ({
                userId: e.userId,
                name: e.fullName,
                role: e.role,
                roleLabel: e.roleLabel,
                rank: e.roleRank
            }))
            .sort((a, b) => b.rank - a.rank || a.name.localeCompare(b.name));

        return {
            isEligibleViewer: true,
            usingSqlTables: rawData.usingSqlTables,
            usingSalaryPaymentsSqlTable: salaryPaymentsRaw.usingSalarySqlTable,
            currentYear,
            currentUser: {
                userId: callerProfile.id,
                name: callerFullName,
                email: callerEmp?.email || callerProfile.email || "",
                role: callerRole,
                roleLabel:
                    callerProfile.role_labels && callerProfile.role_labels.length > 0
                        ? callerProfile.role_labels.join(" • ")
                        : ROLE_LABELS[callerRole] || callerRole,
                roleRank: callerRank,
                isAdmin,
                isFinance,
                canManagePayroll,
                canApproveJuniorLeaves:
                    isAdmin || (callerAccess.isEmployeeMember && (callerRank >= 2 || subordinateIds.size > 0))
            },
            summary: {
                totalActiveEmployees: activeStaff.length,
                adminsCount: activeStaff.filter((e) => e.role === "admin").length,
                supervisorsCount: activeStaff.filter((e) => SUPERVISOR_ROLES.has(e.role)).length,
                agentsCount: activeStaff.filter((e) => AGENT_ROLES.has(e.role)).length,
                onLeaveTodayCount: onLeaveToday.length,
                onLeaveTodayNames: onLeaveToday.map((e) => e.fullName),
                pendingApprovalsForMeCount: visibleLeaveRequests.filter(
                    (lr) => lr.canCallerApproveOrReject
                ).length,
                totalMonthlyFixedPayrollLkr,
                currentSalaryMonth,
                paidThisMonthCount: paidThisMonthEmployeeIds.size,
                paidThisMonthTotalLkr
            },
            employees: visibleEmployees.sort(
                (a, b) => b.roleRank - a.roleRank || a.fullName.localeCompare(b.fullName)
            ),
            leaveRequests: visibleLeaveRequests,
            salaryPayments: visibleSalaryPayments,
            supervisorOptions
        };
    }

    /**
     * Updates an employee's HR record.
     * - Admins can update all HR, leave quota, salary, bank, and commission fields.
     * - Non-admin employees can update their own personal contact/address/emergency contact details.
     */
    static async updateEmployeeHrProfile(dto: UpdateEmployeeHRDTO): Promise<void> {
        const caller = await UserService.getCurrentUserProfile();
        const callerAccess = this.resolveCallerHrAccess(caller);
        if (!caller || !callerAccess.isEligible) {
            throw new Error("Unauthorized: Only eligible staff can access HR profiles.");
        }

        const isAdmin = callerAccess.isAdmin;
        const isSelf = caller.id === dto.userId;

        if (!isAdmin && !isSelf) {
            throw new Error("Permission denied: Only Admins can edit another employee's HR record.");
        }

        const rawData = await this.syncAndLoadRawData();
        const target = rawData.employees.find((e) => e.user_id === dto.userId);
        if (!target) {
            throw new Error("Employee record not found.");
        }

        const nowIso = new Date().toISOString();

        // Fields editable by employee themselves vs Admin-only HR master fields
        const patch: Partial<RawEmployeeRow> = {
            ...(dto.phone !== undefined && { phone: dto.phone || null }),
            ...(dto.address !== undefined && { address: dto.address || null }),
            ...(dto.emergencyContactName !== undefined && {
                emergency_contact_name: dto.emergencyContactName || null
            }),
            ...(dto.emergencyContactPhone !== undefined && {
                emergency_contact_phone: dto.emergencyContactPhone || null
            }),
            ...(dto.nicOrPassport !== undefined && {
                nic_or_passport: dto.nicOrPassport || null
            }),
            updated_at: nowIso
        };

        if (isAdmin) {
            if (dto.employeeCode !== undefined && dto.employeeCode.trim()) {
                patch.employee_code = dto.employeeCode.trim();
            }
            if (dto.firstName !== undefined) patch.first_name = dto.firstName.trim();
            if (dto.lastName !== undefined) patch.last_name = dto.lastName.trim();
            if (dto.supervisorId !== undefined) patch.supervisor_id = dto.supervisorId || null;
            if (dto.department !== undefined) patch.department = dto.department;
            if (dto.designation !== undefined) patch.designation = dto.designation;
            if (dto.employmentType !== undefined) patch.employment_type = dto.employmentType;
            if (dto.employmentStatus !== undefined) patch.employment_status = dto.employmentStatus;
            if (dto.joinDate !== undefined) patch.join_date = dto.joinDate || null;
            if (dto.hrNotes !== undefined) patch.hr_notes = dto.hrNotes || null;

            if (dto.basicSalaryLkr !== undefined) {
                patch.basic_salary_lkr = Math.max(0, Number(dto.basicSalaryLkr) || 0);
            }
            if (dto.fixedAllowancesLkr !== undefined) {
                patch.fixed_allowances_lkr = Math.max(0, Number(dto.fixedAllowancesLkr) || 0);
            }
            if (dto.epfEligible !== undefined) patch.epf_eligible = Boolean(dto.epfEligible);
            if (dto.epfNumber !== undefined) patch.epf_number = dto.epfNumber || null;
            if (dto.bankName !== undefined) patch.bank_name = dto.bankName || null;
            if (dto.bankBranch !== undefined) patch.bank_branch = dto.bankBranch || null;
            if (dto.bankAccountNumber !== undefined) {
                patch.bank_account_number = dto.bankAccountNumber || null;
            }
            if (dto.bankAccountHolder !== undefined) {
                patch.bank_account_holder = dto.bankAccountHolder || null;
            }

            if (dto.annualLeaveQuota !== undefined) {
                patch.annual_leave_quota = Math.max(0, Number(dto.annualLeaveQuota) || 0);
            }
            if (dto.casualLeaveQuota !== undefined) {
                patch.casual_leave_quota = Math.max(0, Number(dto.casualLeaveQuota) || 0);
            }
            if (dto.sickLeaveQuota !== undefined) {
                patch.sick_leave_quota = Math.max(0, Number(dto.sickLeaveQuota) || 0);
            }
            if (dto.annualLeaveCarriedForward !== undefined) {
                patch.annual_leave_carried_forward = Math.max(
                    0,
                    Number(dto.annualLeaveCarriedForward) || 0
                );
            }
            if (dto.annualLeaveOpeningUsed !== undefined) {
                patch.annual_leave_opening_used = Math.max(
                    0,
                    Number(dto.annualLeaveOpeningUsed) || 0
                );
            }
            if (dto.casualLeaveOpeningUsed !== undefined) {
                patch.casual_leave_opening_used = Math.max(
                    0,
                    Number(dto.casualLeaveOpeningUsed) || 0
                );
            }
            if (dto.sickLeaveOpeningUsed !== undefined) {
                patch.sick_leave_opening_used = Math.max(0, Number(dto.sickLeaveOpeningUsed) || 0);
            }

            if (dto.commissionEligible !== undefined) {
                patch.commission_eligible = Boolean(dto.commissionEligible);
            }
            if (dto.defaultRatingTier !== undefined) {
                patch.default_rating_tier = dto.defaultRatingTier;
            }
            if (dto.customCommissionCapUsd !== undefined) {
                patch.custom_commission_cap_usd =
                    dto.customCommissionCapUsd !== null && Number(dto.customCommissionCapUsd) > 0
                        ? Number(dto.customCommissionCapUsd)
                        : null;
            }
            if (dto.annualGpTargetUsd !== undefined) {
                patch.annual_gp_target_usd =
                    dto.annualGpTargetUsd !== null && Number(dto.annualGpTargetUsd) > 0
                        ? Number(dto.annualGpTargetUsd)
                        : null;
            }
            if (dto.commissionNotes !== undefined) {
                patch.commission_notes = dto.commissionNotes || null;
            }
            if (dto.isActive !== undefined) {
                patch.is_active = Boolean(dto.isActive);
            }
        }

        if (rawData.usingSqlTables) {
            const supabase = createAdminClient();
            const { error } = await supabase
                .from("employees")
                .update(patch)
                .eq("user_id", dto.userId);
            if (error) throw new Error(`Failed to update employee HR profile: ${error.message}`);
        } else {
            const fallback = await this.loadFallbackState();
            const row = fallback.employeesByUserId[dto.userId];
            if (!row) throw new Error("Employee record not found in HR store.");
            fallback.employeesByUserId[dto.userId] = { ...row, ...patch };
            await this.saveFallbackState(fallback);
        }

        // Keep User Management profile (name, phone, supervisor_id) synchronized
        if (
            isAdmin &&
            (dto.firstName !== undefined ||
                dto.lastName !== undefined ||
                dto.phone !== undefined ||
                dto.supervisorId !== undefined)
        ) {
            try {
                await AdminService.updateUser(dto.userId, target.role, {
                    ...(dto.firstName !== undefined && { first_name: dto.firstName }),
                    ...(dto.lastName !== undefined && { last_name: dto.lastName }),
                    ...(dto.phone !== undefined && { phone: dto.phone || "" }),
                    ...(dto.supervisorId !== undefined && { supervisor_id: dto.supervisorId || "" })
                });
            } catch (syncErr) {
                console.warn("Profile sync notice:", syncErr);
            }
        }
    }

    /**
     * Submits a new leave request (Annual, Casual, or Sick).
     */
    static async submitLeaveRequest(dto: CreateEmployeeLeaveRequestDTO): Promise<void> {
        const caller = await UserService.getCurrentUserProfile();
        const callerAccess = this.resolveCallerHrAccess(caller);
        if (!caller || !callerAccess.isEligible) {
            throw new Error("Unauthorized: Only office employees can submit leave requests.");
        }

        const isAdmin = callerAccess.isAdmin;
        const targetUserId = dto.targetUserId && isAdmin ? dto.targetUserId : caller.id;

        if (!dto.startDate || !dto.endDate) {
            throw new Error("Start date and end date are required.");
        }
        if (dto.endDate < dto.startDate) {
            throw new Error("End date cannot be earlier than start date.");
        }
        if (!dto.reason || !dto.reason.trim()) {
            throw new Error("Please provide a reason for the leave request.");
        }

        const daysCount = dto.isHalfDay ? 0.5 : Number(dto.daysCount);
        if (isNaN(daysCount) || daysCount <= 0) {
            throw new Error("Please enter a valid number of leave days.");
        }

        const rawData = await this.syncAndLoadRawData();
        const emp = rawData.employees.find((e) => e.user_id === targetUserId);
        if (!emp) {
            throw new Error("Target employee profile not found in employees table.");
        }

        let coveringName: string | null = null;
        if (dto.coveringUserId) {
            const covEmp = rawData.employees.find((e) => e.user_id === dto.coveringUserId);
            if (covEmp) {
                coveringName = `${covEmp.first_name || ""} ${covEmp.last_name || ""}`.trim() || covEmp.email;
            }
        }

        const nowIso = new Date().toISOString();
        const newLeave: RawLeaveRequestRow = {
            id: crypto.randomUUID(),
            employee_id: emp.id,
            user_id: targetUserId,
            leave_type: dto.leaveType,
            start_date: dto.startDate,
            end_date: dto.isHalfDay ? dto.startDate : dto.endDate,
            days_count: daysCount,
            is_half_day: Boolean(dto.isHalfDay),
            half_day_period: dto.isHalfDay ? dto.halfDayPeriod || "Morning" : null,
            reason: dto.reason.trim(),
            handover_notes: dto.handoverNotes?.trim() || null,
            covering_user_id: dto.coveringUserId || null,
            covering_user_name: coveringName,
            status: "Pending",
            reviewed_by: null,
            reviewed_by_name: null,
            reviewed_by_role: null,
            reviewed_at: null,
            reviewer_notes: null,
            created_at: nowIso,
            updated_at: nowIso
        };

        if (rawData.usingSqlTables) {
            const supabase = createAdminClient();
            const { error } = await supabase.from("employee_leave_requests").insert([
                {
                    id: newLeave.id,
                    employee_id: newLeave.employee_id,
                    user_id: newLeave.user_id,
                    leave_type: newLeave.leave_type,
                    start_date: newLeave.start_date,
                    end_date: newLeave.end_date,
                    days_count: newLeave.days_count,
                    is_half_day: newLeave.is_half_day,
                    half_day_period: newLeave.half_day_period,
                    reason: newLeave.reason,
                    handover_notes: newLeave.handover_notes,
                    covering_user_id: newLeave.covering_user_id,
                    covering_user_name: newLeave.covering_user_name,
                    status: "Pending"
                }
            ]);
            if (error) throw new Error(`Failed to submit leave request: ${error.message}`);
        } else {
            const fallback = await this.loadFallbackState();
            fallback.leaveRequests.unshift(newLeave);
            await this.saveFallbackState(fallback);
        }
    }

    /**
     * Approves or rejects a pending leave request.
     * Enforces:
     * - Any Admin can approve/reject any leave request.
     * - Any senior role (e.g. Senior Agent, Executive Agent, Supervisor) can approve/reject
     *   leave requests of junior roles (e.g. Agent) or direct/indirect subordinates.
     */
    static async reviewLeaveRequest(dto: ReviewEmployeeLeaveRequestDTO): Promise<void> {
        const caller = await UserService.getCurrentUserProfile();
        const callerAccess = this.resolveCallerHrAccess(caller);
        if (!caller || !callerAccess.isEligible) {
            throw new Error("Unauthorized: You do not have permission to review leave requests.");
        }

        const [rawData, subordinateList] = await Promise.all([
            this.syncAndLoadRawData(),
            AdminService.getUserAndSubordinateIds(caller.id)
        ]);

        const leaveReq = rawData.leaveRequests.find((lr) => lr.id === dto.leaveRequestId);
        if (!leaveReq) {
            throw new Error("Leave request not found.");
        }
        if (leaveReq.status !== "Pending") {
            throw new Error(`Leave request is already ${leaveReq.status}.`);
        }

        const requesterEmp = rawData.employees.find((e) => e.user_id === leaveReq.user_id);
        if (!requesterEmp) {
            throw new Error("Requester employee record not found.");
        }

        const subordinateIds = new Set<string>(subordinateList.filter((id) => id !== caller.id));
        const allowed = this.canApproveLeaveForTarget({
            approverUserId: caller.id,
            approverRole: callerAccess.effectiveRole,
            targetUserId: leaveReq.user_id,
            targetRole: requesterEmp.role,
            approverSubordinateIds: subordinateIds
        });

        if (!allowed) {
            throw new Error(
                "Permission denied: Only Admins or senior roles above the employee's role can approve or reject this leave request."
            );
        }

        const callerEmp = rawData.employees.find((e) => e.user_id === caller.id);
        const reviewerName =
            (callerEmp
                ? `${callerEmp.first_name || ""} ${callerEmp.last_name || ""}`.trim()
                : `${caller.first_name || ""} ${caller.last_name || ""}`.trim()) ||
            caller.email ||
            "Approver";
        const nowIso = new Date().toISOString();

        if (rawData.usingSqlTables) {
            const supabase = createAdminClient();
            const { error } = await supabase
                .from("employee_leave_requests")
                .update({
                    status: dto.decision,
                    reviewed_by: caller.id,
                    reviewed_by_name: reviewerName,
                    reviewed_by_role: callerAccess.effectiveRole || caller.role || null,
                    reviewed_at: nowIso,
                    reviewer_notes: dto.reviewerNotes?.trim() || null,
                    updated_at: nowIso
                })
                .eq("id", dto.leaveRequestId);

            if (error) throw new Error(`Failed to ${dto.decision.toLowerCase()} leave request: ${error.message}`);
        } else {
            const fallback = await this.loadFallbackState();
            const idx = fallback.leaveRequests.findIndex((lr) => lr.id === dto.leaveRequestId);
            if (idx === -1) throw new Error("Leave request not found.");
            fallback.leaveRequests[idx] = {
                ...fallback.leaveRequests[idx],
                status: dto.decision,
                reviewed_by: caller.id,
                reviewed_by_name: reviewerName,
                reviewed_by_role: callerAccess.effectiveRole || caller.role || null,
                reviewed_at: nowIso,
                reviewer_notes: dto.reviewerNotes?.trim() || null,
                updated_at: nowIso
            };
            await this.saveFallbackState(fallback);
        }
    }

    /**
     * Cancels a pending leave request (allowed for the requester themselves or an Admin).
     */
    static async cancelLeaveRequest(leaveRequestId: string): Promise<void> {
        const caller = await UserService.getCurrentUserProfile();
        const callerAccess = this.resolveCallerHrAccess(caller);
        if (!caller || !callerAccess.isEligible) {
            throw new Error("Unauthorized.");
        }

        const rawData = await this.syncAndLoadRawData();
        const leaveReq = rawData.leaveRequests.find((lr) => lr.id === leaveRequestId);
        if (!leaveReq) {
            throw new Error("Leave request not found.");
        }
        if (leaveReq.status !== "Pending") {
            throw new Error("Only pending leave requests can be cancelled.");
        }
        if (!callerAccess.isAdmin && caller.id !== leaveReq.user_id) {
            throw new Error("You can only cancel your own pending leave requests.");
        }

        const nowIso = new Date().toISOString();
        if (rawData.usingSqlTables) {
            const supabase = createAdminClient();
            const { error } = await supabase
                .from("employee_leave_requests")
                .update({ status: "Cancelled", updated_at: nowIso })
                .eq("id", leaveRequestId);
            if (error) throw new Error(`Failed to cancel leave request: ${error.message}`);
        } else {
            const fallback = await this.loadFallbackState();
            const idx = fallback.leaveRequests.findIndex((lr) => lr.id === leaveRequestId);
            if (idx !== -1) {
                fallback.leaveRequests[idx].status = "Cancelled";
                fallback.leaveRequests[idx].updated_at = nowIso;
                await this.saveFallbackState(fallback);
            }
        }
    }

    /**
     * Uploads an employee salary payment slip (PDF or image) to the private 'payslips' bucket.
     * Allowed ONLY for Admin and Finance users.
     */
    static async uploadSalarySlip(
        file: File
    ): Promise<{ slipStoragePath: string; slipFileName: string }> {
        const caller = await UserService.getCurrentUserProfile();
        const callerAccess = this.resolveCallerHrAccess(caller);
        if (!caller || !callerAccess.canManagePayroll) {
            throw new Error("Unauthorized: Only Admin or Finance users can upload salary slips.");
        }

        if (!file) {
            throw new Error("No salary slip file provided.");
        }
        if (file.size > 10 * 1024 * 1024) {
            throw new Error("Salary slip file is too large (max 10 MB).");
        }

        const allowedMimeTypes = new Set([
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
        ]);
        if (!allowedMimeTypes.has(file.type)) {
            throw new Error("Unsupported file type. Please upload a PDF, JPG, PNG, or WebP slip.");
        }

        const rawBuffer = Buffer.from(await file.arrayBuffer());
        const supabase = createAdminClient();
        const randSlug = `${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;

        if (file.type === "application/pdf") {
            const filePath = `salary-slips/${randSlug}.pdf`;
            const { error } = await supabase.storage.from("payslips").upload(filePath, rawBuffer, {
                contentType: "application/pdf",
                cacheControl: "3600",
                upsert: false
            });
            if (error) throw new Error(`Failed to upload PDF salary slip: ${error.message}`);
            return { slipStoragePath: filePath, slipFileName: file.name };
        }

        let uploadBuffer: Buffer = rawBuffer;
        let ext = "webp";
        let contentType = "image/webp";
        try {
            uploadBuffer = await sharp(rawBuffer).webp({ quality: 82 }).toBuffer();
        } catch {
            ext = file.name.split(".").pop()?.toLowerCase() || "png";
            contentType = file.type;
        }

        const filePath = `salary-slips/${randSlug}.${ext}`;
        const { error } = await supabase.storage.from("payslips").upload(filePath, uploadBuffer, {
            contentType,
            cacheControl: "3600",
            upsert: false
        });
        if (error) throw new Error(`Failed to upload salary slip image: ${error.message}`);

        return { slipStoragePath: filePath, slipFileName: file.name };
    }

    /**
     * Sends a Nilathra-branded Salary Payment Confirmation email to the employee
     * with the uploaded bank/payment slip attached directly.
     */
    private static async deliverSalarySlipEmail(
        payment: RawSalaryPaymentRow,
        emp: RawEmployeeRow
    ): Promise<{ sent: boolean; sentTo: string | null; error?: string }> {
        const recipientEmail = (emp.email || "").trim();
        if (!recipientEmail || !recipientEmail.includes("@")) {
            return {
                sent: false,
                sentTo: null,
                error: "Employee does not have a valid email address on record."
            };
        }

        const fmtAmt = (val: number) =>
            `LKR ${Number(val || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;

        const empFullName = `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || recipientEmail;
        const empCode = emp.employee_code || "EMP";
        const monthLabel = formatSalaryMonthLabel(payment.salary_month);
        const subject = `Salary Payment Confirmation (${monthLabel}) – Nilathra Collection`;

        const totalDeductions =
            Number(payment.epf_employee_deduction_lkr || 0) + Number(payment.other_deductions_lkr || 0);

        const contentHtml = `
            <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
              Dear <strong>${empFullName}</strong>,
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
              Your salary for <strong>${monthLabel}</strong> has been processed and recorded. Please find your official payment slip attached to this email for your records.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;border:1px solid #E5E7EB;border-left:4px solid #C9A84C;border-radius:6px;margin:0 0 24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;">
                    Salary Payment Summary · ${empCode}
                  </p>
                  <table width="100%" cellpadding="4" cellspacing="0" style="font-size:13px;color:#374151;">
                    <tr>
                      <td style="color:#6B7280;">Salary Period:</td>
                      <td align="right" style="font-weight:600;">${monthLabel} (${payment.salary_month})</td>
                    </tr>
                    <tr>
                      <td style="color:#6B7280;">Payment Date:</td>
                      <td align="right" style="font-weight:600;">${payment.payment_date}</td>
                    </tr>
                    <tr>
                      <td style="color:#6B7280;">Payment Method:</td>
                      <td align="right" style="font-weight:600;">${payment.payment_method}${payment.payment_reference ? ` · Ref: ${payment.payment_reference}` : ""}</td>
                    </tr>
                    ${
                        payment.bank_account_snapshot
                            ? `<tr>
                                 <td style="color:#6B7280;">Credited Account:</td>
                                 <td align="right" style="font-weight:600;">${payment.bank_account_snapshot}</td>
                               </tr>`
                            : ""
                    }
                    <tr><td colspan="2" style="border-bottom:1px solid #E5E7EB;padding-top:6px;"></td></tr>
                    <tr>
                      <td style="padding-top:8px;color:#4B5563;">Basic Salary:</td>
                      <td align="right" style="padding-top:8px;font-family:monospace;">${fmtAmt(payment.basic_salary_lkr)}</td>
                    </tr>
                    <tr>
                      <td style="color:#4B5563;">Fixed Allowances:</td>
                      <td align="right" style="font-family:monospace;">${fmtAmt(payment.fixed_allowances_lkr)}</td>
                    </tr>
                    ${
                        Number(payment.additions_lkr || 0) > 0
                            ? `<tr>
                                 <td style="color:#047857;">Additions / Incentives:</td>
                                 <td align="right" style="font-family:monospace;color:#047857;">+ ${fmtAmt(payment.additions_lkr)}</td>
                               </tr>`
                            : ""
                    }
                    ${
                        totalDeductions > 0
                            ? `<tr>
                                 <td style="color:#B91C1C;">Deductions${Number(payment.epf_employee_deduction_lkr || 0) > 0 ? " (incl. EPF 8%)" : ""}:</td>
                                 <td align="right" style="font-family:monospace;color:#B91C1C;">- ${fmtAmt(totalDeductions)}</td>
                               </tr>`
                            : ""
                    }
                    <tr><td colspan="2" style="border-bottom:1px solid #E5E7EB;padding-top:6px;"></td></tr>
                    <tr>
                      <td style="padding-top:10px;font-size:15px;font-weight:700;color:#1B3A2D;">Net Salary Paid:</td>
                      <td align="right" style="padding-top:10px;font-size:16px;font-weight:700;font-family:monospace;color:#1B3A2D;">${fmtAmt(payment.net_paid_lkr)}</td>
                    </tr>
                  </table>
                  ${
                      payment.notes
                          ? `<p style="margin:14px 0 0;padding-top:10px;border-top:1px dashed #E5E7EB;font-size:12px;color:#6B7280;"><strong>Remarks:</strong> ${payment.notes}</p>`
                          : ""
                  }
                </td>
              </tr>
            </table>

            <p style="margin:0 0 12px;font-size:13px;color:#6B7280;line-height:1.6;">
              You can also view and download your salary slips at any time from the <strong>Office HR</strong> section of the Nilathra Staff Portal.
            </p>
        `;

        const html = emailService.generateEmailHtml(
            "Salary Payment Confirmation",
            `Salary Payment Slip – ${monthLabel}`,
            contentHtml
        );

        try {
            const supabase = createAdminClient();
            const { data: blob, error: dlError } = await supabase.storage
                .from("payslips")
                .download(payment.slip_storage_path);
            if (dlError || !blob) {
                return {
                    sent: false,
                    sentTo: recipientEmail,
                    error: `Could not read uploaded slip for email attachment: ${dlError?.message || "file not found"}`
                };
            }

            const ext = (payment.slip_storage_path.split(".").pop() || "pdf").toLowerCase();
            const safeCode = empCode.replace(/[^a-zA-Z0-9_-]/g, "_");
            const attachmentFilename = `Salary-Slip-${safeCode}-${payment.salary_month}.${ext}`;
            const attachmentBuffer = Buffer.from(await blob.arrayBuffer());

            const resendApiKey = process.env.RESEND_API_KEY;
            const fromAddress =
                process.env.EMAIL_FROM || process.env.SMTP_USER || "concierge@nilathra.com";

            if (resendApiKey) {
                const res = await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${resendApiKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        from: fromAddress,
                        to: [recipientEmail],
                        subject,
                        html,
                        attachments: [
                            {
                                filename: attachmentFilename,
                                content: attachmentBuffer.toString("base64")
                            }
                        ]
                    })
                });
                const resJson = await res.json().catch(() => ({}));
                if (!res.ok) {
                    return {
                        sent: false,
                        sentTo: recipientEmail,
                        error: (resJson as any)?.message || "Failed to send salary email via Resend."
                    };
                }
                return { sent: true, sentTo: recipientEmail };
            }

            if (process.env.SMTP_HOST && process.env.SMTP_USER) {
                await emailService.sendEmail({
                    from: fromAddress,
                    to: recipientEmail,
                    subject,
                    html,
                    attachments: [
                        {
                            filename: attachmentFilename,
                            content: attachmentBuffer
                        }
                    ]
                });
                return { sent: true, sentTo: recipientEmail };
            }

            return {
                sent: false,
                sentTo: recipientEmail,
                error: "Email provider is not configured (set RESEND_API_KEY or SMTP_HOST in .env.local)."
            };
        } catch (err: any) {
            console.error("deliverSalarySlipEmail error:", err);
            return {
                sent: false,
                sentTo: recipientEmail,
                error: err?.message || "Failed to deliver salary slip email."
            };
        }
    }

    /**
     * Records an employee salary payment with its uploaded bank/payment slip,
     * and automatically sends the payment slip notification email to the employee.
     * Restricted strictly to Admin and Finance roles.
     */
    static async recordSalaryPayment(dto: CreateEmployeeSalaryPaymentDTO): Promise<{
        paymentId: string;
        emailSent: boolean;
        emailError?: string | null;
    }> {
        const caller = await UserService.getCurrentUserProfile();
        const callerAccess = this.resolveCallerHrAccess(caller);
        if (!caller || !callerAccess.canManagePayroll) {
            throw new Error("Unauthorized: Only Admin or Finance users can record employee salary payments.");
        }

        if (!dto.targetUserId) {
            throw new Error("Please select an employee to pay.");
        }
        if (!dto.salaryMonth || !/^\d{4}-\d{2}$/.test(dto.salaryMonth)) {
            throw new Error("Please select a valid salary period (YYYY-MM).");
        }
        if (!dto.paymentDate) {
            throw new Error("Payment date is required.");
        }
        if (!dto.slipStoragePath || !dto.slipStoragePath.trim()) {
            throw new Error("Please upload the salary payment / bank slip before saving.");
        }

        const rawData = await this.syncAndLoadRawData();
        const emp = rawData.employees.find((e) => e.user_id === dto.targetUserId);
        if (!emp) {
            throw new Error("Selected employee record was not found.");
        }

        const basic = Math.max(0, Number(dto.basicSalaryLkr) || 0);
        const allowances = Math.max(0, Number(dto.fixedAllowancesLkr) || 0);
        const additions = Math.max(0, Number(dto.additionsLkr) || 0);
        const epfDeduction = Math.max(0, Number(dto.epfEmployeeDeductionLkr) || 0);
        const otherDeductions = Math.max(0, Number(dto.otherDeductionsLkr) || 0);

        const gross = Math.round((basic + allowances + additions) * 100) / 100;
        const netPaid = Math.round((gross - epfDeduction - otherDeductions) * 100) / 100;

        if (netPaid <= 0) {
            throw new Error("Net salary paid amount must be greater than zero.");
        }

        const defaultBankSnapshot = emp.bank_name
            ? `${emp.bank_name}${emp.bank_branch ? ` (${emp.bank_branch})` : ""}${emp.bank_account_number ? ` · ${emp.bank_account_number}` : ""}`
            : null;

        const payerName =
            `${caller.first_name || ""} ${caller.last_name || ""}`.trim() ||
            caller.email ||
            "Payroll Officer";
        const payerRole = callerAccess.isAdmin ? "admin" : "finance";
        const nowIso = new Date().toISOString();

        const newPayment: RawSalaryPaymentRow = {
            id: crypto.randomUUID(),
            employee_id: emp.id,
            user_id: emp.user_id,
            salary_month: dto.salaryMonth,
            payment_date: dto.paymentDate,
            currency: emp.salary_currency || "LKR",
            basic_salary_lkr: basic,
            fixed_allowances_lkr: allowances,
            additions_lkr: additions,
            epf_employee_deduction_lkr: epfDeduction,
            other_deductions_lkr: otherDeductions,
            gross_amount_lkr: gross,
            net_paid_lkr: netPaid,
            payment_method: dto.paymentMethod || "Bank Transfer",
            payment_reference: dto.paymentReference?.trim() || null,
            bank_account_snapshot: dto.bankAccountSnapshot?.trim() || defaultBankSnapshot,
            slip_storage_path: dto.slipStoragePath.trim(),
            slip_file_name: dto.slipFileName?.trim() || null,
            notes: dto.notes?.trim() || null,
            email_sent: false,
            email_sent_to: emp.email || null,
            email_sent_at: null,
            email_error: null,
            paid_by_user_id: caller.id,
            paid_by_name: payerName,
            paid_by_role: payerRole,
            created_at: nowIso,
            updated_at: nowIso
        };

        const empByUserId = new Map<string, RawEmployeeRow>(
            rawData.employees.map((e) => [e.user_id, e])
        );
        const salaryStore = await this.loadSalaryPaymentsData(empByUserId);

        if (salaryStore.usingSalarySqlTable) {
            const supabase = createAdminClient();
            const { error } = await supabase.from("employee_salary_payments").insert([newPayment]);
            if (error) {
                throw new Error(`Failed to record salary payment: ${error.message}`);
            }
        } else {
            const fallbackRows = await this.loadFallbackSalaryPayments();
            fallbackRows.unshift(newPayment);
            await this.saveFallbackSalaryPayments(fallbackRows);
        }

        // Send automated email notification with the attached slip (default: true)
        const shouldEmail = dto.sendEmailToEmployee !== false;
        let emailSent = false;
        let emailError: string | null = null;

        if (shouldEmail) {
            const mailRes = await this.deliverSalarySlipEmail(newPayment, emp);
            emailSent = mailRes.sent;
            emailError = mailRes.sent ? null : mailRes.error || "Failed to send email.";
            const sentAt = mailRes.sent ? new Date().toISOString() : null;

            if (salaryStore.usingSalarySqlTable) {
                const supabase = createAdminClient();
                await supabase
                    .from("employee_salary_payments")
                    .update({
                        email_sent: emailSent,
                        email_sent_to: mailRes.sentTo,
                        email_sent_at: sentAt,
                        email_error: emailError,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", newPayment.id);
            } else {
                const fallbackRows = await this.loadFallbackSalaryPayments();
                const idx = fallbackRows.findIndex((r) => r.id === newPayment.id);
                if (idx !== -1) {
                    fallbackRows[idx] = {
                        ...fallbackRows[idx],
                        email_sent: emailSent,
                        email_sent_to: mailRes.sentTo,
                        email_sent_at: sentAt,
                        email_error: emailError,
                        updated_at: new Date().toISOString()
                    };
                    await this.saveFallbackSalaryPayments(fallbackRows);
                }
            }
        }

        return {
            paymentId: newPayment.id,
            emailSent,
            emailError
        };
    }

    /**
     * Sends or re-sends the salary payment confirmation & attached slip email for an existing payment record.
     */
    static async resendSalarySlipEmail(paymentId: string): Promise<{
        emailSent: boolean;
        emailError?: string | null;
    }> {
        const caller = await UserService.getCurrentUserProfile();
        const callerAccess = this.resolveCallerHrAccess(caller);
        if (!caller || !callerAccess.canManagePayroll) {
            throw new Error("Unauthorized: Only Admin or Finance users can send salary slip emails.");
        }

        const rawData = await this.syncAndLoadRawData();
        const empByUserId = new Map<string, RawEmployeeRow>(
            rawData.employees.map((e) => [e.user_id, e])
        );
        const salaryStore = await this.loadSalaryPaymentsData(empByUserId);
        const payment = salaryStore.rows.find((r) => r.id === paymentId);
        if (!payment) {
            throw new Error("Salary payment record not found.");
        }

        const emp = empByUserId.get(payment.user_id);
        if (!emp) {
            throw new Error("Employee record not found for this salary payment.");
        }

        const mailRes = await this.deliverSalarySlipEmail(payment, emp);
        const sentAt = mailRes.sent ? new Date().toISOString() : payment.email_sent_at;
        const emailError = mailRes.sent ? null : mailRes.error || "Failed to send email.";

        if (salaryStore.usingSalarySqlTable) {
            const supabase = createAdminClient();
            await supabase
                .from("employee_salary_payments")
                .update({
                    email_sent: mailRes.sent,
                    email_sent_to: mailRes.sentTo,
                    email_sent_at: sentAt,
                    email_error: emailError,
                    updated_at: new Date().toISOString()
                })
                .eq("id", paymentId);
        } else {
            const fallbackRows = await this.loadFallbackSalaryPayments();
            const idx = fallbackRows.findIndex((r) => r.id === paymentId);
            if (idx !== -1) {
                fallbackRows[idx] = {
                    ...fallbackRows[idx],
                    email_sent: mailRes.sent,
                    email_sent_to: mailRes.sentTo,
                    email_sent_at: sentAt,
                    email_error: emailError,
                    updated_at: new Date().toISOString()
                };
                await this.saveFallbackSalaryPayments(fallbackRows);
            }
        }

        return {
            emailSent: mailRes.sent,
            emailError
        };
    }
}

