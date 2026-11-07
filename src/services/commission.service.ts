import { CommissionSimulationService } from "@/services/commission-simulation.service";
import {
    ICommissionRuleConfig,
    ICommissionRuleVersionRecord,
    ITourCommissionRecord,
    ITourCommissionAllocationRecord,
    ICommissionAdjustmentRecord,
    ISaveTourCommissionPayload,
    IEmployeeHierarchyNode,
    IEmployeeCommissionDashboardData,
    IManagementCommissionDashboardData,
    IProgressionCriterion,
    ITourFinancialReference,
    ICommissionLeaderInput
} from "@/other/interfaces";
import { CommissionWorkspaceInitialDataDTO } from "@/dtos/commission.dto";

const COMMISSION_STATE_KEY = "nilathra_commission_system_state";

const ROLE_LABELS_MAP: Record<string, string> = {
    agent: "Agent",
    senior_agent: "Senior Agent",
    executive_agent: "Executive Agent",
    agent_supervisor: "Supervisor",
    senior_supervisor: "Senior Supervisor",
    executive_supervisor: "Executive Supervisor",
    principal_supervisor: "Principal SPOC",
    admin: "Admin",
    finance: "Finance Staff",
    tourist: "Tourist"
};

interface PersistedCommissionState {
    ruleVersions: ICommissionRuleVersionRecord[];
    tourCommissions: ITourCommissionRecord[];
}

export class CommissionService {
    static getDefaultProgressionCriteria(): Record<string, IProgressionCriterion> {
        return {
            agent: {
                nextRole: "senior_agent",
                nextRoleLabel: "Senior Agent",
                minTours: 8,
                minGpUsd: 25000,
                minMentees: 0
            },
            senior_agent: {
                nextRole: "executive_agent",
                nextRoleLabel: "Executive Agent",
                minTours: 20,
                minGpUsd: 75000,
                minMentees: 2
            },
            executive_agent: {
                nextRole: "agent_supervisor",
                nextRoleLabel: "Supervisor",
                minTours: 35,
                minGpUsd: 150000,
                minMentees: 3
            },
            agent_supervisor: {
                nextRole: "senior_supervisor",
                nextRoleLabel: "Senior Supervisor",
                minTours: 50,
                minGpUsd: 300000,
                minMentees: 4
            },
            senior_supervisor: {
                nextRole: "executive_supervisor",
                nextRoleLabel: "Executive Supervisor",
                minTours: 75,
                minGpUsd: 600000,
                minMentees: 6
            },
            executive_supervisor: {
                nextRole: "principal_supervisor",
                nextRoleLabel: "Principal SPOC",
                minTours: 100,
                minGpUsd: 1000000,
                minMentees: 8
            },
            principal_supervisor: {
                nextRole: "principal_supervisor",
                nextRoleLabel: "Principal SPOC (Max Tier)",
                minTours: 100,
                minGpUsd: 1000000,
                minMentees: 10
            }
        };
    }

    static getDefaultInitialRuleVersion(): ICommissionRuleVersionRecord {
        return {
            id: "default-rule-v1",
            versionNumber: 1,
            versionName: "v1.0 — Nilathra Standard Profit-Pool & Role Cap Policy",
            isActive: true,
            rules: CommissionSimulationService.getDefaultRules(),
            progressionCriteria: this.getDefaultProgressionCriteria(),
            notes: "Initial versioned commission policy: 10% base pool of Declared Gross Profit, 70% Direct / 25% Leadership / 5% Team Development, with per-role USD caps.",
            createdBy: null,
            createdAt: new Date().toISOString()
        };
    }

    private static async loadAppStateFallback(): Promise<PersistedCommissionState> {
        try {
            const { createAdminClient } = await import("@/utils/supabase/admin");
            const supabase = createAdminClient();
            const { data } = await supabase
                .from("app_states")
                .select("state_data")
                .eq("key", COMMISSION_STATE_KEY)
                .maybeSingle();

            if (data?.state_data && typeof data.state_data === "object") {
                const raw = data.state_data as Partial<PersistedCommissionState>;
                return {
                    ruleVersions:
                        Array.isArray(raw.ruleVersions) && raw.ruleVersions.length > 0
                            ? raw.ruleVersions
                            : [this.getDefaultInitialRuleVersion()],
                    tourCommissions: Array.isArray(raw.tourCommissions) ? raw.tourCommissions : []
                };
            }
        } catch (err) {
            console.warn("CommissionService.loadAppStateFallback warning:", err);
        }
        return {
            ruleVersions: [this.getDefaultInitialRuleVersion()],
            tourCommissions: []
        };
    }

    private static async saveAppStateFallback(state: PersistedCommissionState): Promise<void> {
        try {
            const { createAdminClient } = await import("@/utils/supabase/admin");
            const supabase = createAdminClient();
            await supabase.from("app_states").upsert(
                {
                    key: COMMISSION_STATE_KEY,
                    state_data: state,
                    updated_at: new Date().toISOString()
                },
                { onConflict: "key" }
            );
        } catch (err) {
            console.warn("CommissionService.saveAppStateFallback warning:", err);
        }
    }

    /**
     * Loads all employee hierarchy nodes (Agent -> Principal SPOC) with their reporting managers.
     */
    static async getEmployeeHierarchyNodes(): Promise<IEmployeeHierarchyNode[]> {
        const simEmps = await CommissionSimulationService.getEmployeesForSimulation();
        return simEmps.map((u) => {
            const directSubordinatesCount = simEmps.filter((sub) => sub.supervisorId === u.id).length;
            return {
                userId: u.id,
                name: u.name || u.email,
                email: u.email,
                role: u.role,
                roleLabel: u.roleLabel || ROLE_LABELS_MAP[u.role] || u.role,
                supervisorId: u.supervisorId || null,
                supervisorName: u.supervisorName || null,
                supervisorRoleLabel: u.supervisorRoleLabel || null,
                directSubordinatesCount
            };
        });
    }

    /**
     * Walks up the reporting hierarchy from a given employee to build their eligible Tier 1, Tier 2, Tier 3 leadership chain.
     */
    static buildReportingChainForEmployee(
        employeeUserId: string | null,
        employees: IEmployeeHierarchyNode[]
    ): ICommissionLeaderInput[] {
        if (!employeeUserId) return [];
        const empMap = new Map(employees.map((e) => [e.userId, e]));
        const chain: ICommissionLeaderInput[] = [];
        const visited = new Set<string>([employeeUserId]);

        let current = empMap.get(employeeUserId);
        let tierCounter = 1;

        while (current?.supervisorId && tierCounter <= 3) {
            if (visited.has(current.supervisorId)) break;
            visited.add(current.supervisorId);
            const manager = empMap.get(current.supervisorId);
            if (!manager) break;

            chain.push({
                id: manager.userId,
                name: manager.name,
                role: manager.role,
                roleLabel: manager.roleLabel,
                tier: tierCounter as 1 | 2 | 3,
                hasActiveContribution: true,
                contributionEvidence:
                    tierCounter === 1
                        ? "Direct mentoring & tour quotation review"
                        : tierCounter === 2
                          ? "Operational team oversight & supplier escalation support"
                          : "Executive operational accountability & sign-off",
                ratingTier: "meets",
                maxCapUsd: null
            });

            current = manager;
            tierCounter++;
        }

        return chain;
    }

    /**
     * Loads all Rule Versions (from SQL table if available, synced with app_states fallback).
     */
    static async getRuleVersions(): Promise<ICommissionRuleVersionRecord[]> {
        const { createAdminClient } = await import("@/utils/supabase/admin");
        const supabase = createAdminClient();
        const fallback = await this.loadAppStateFallback();

        try {
            const { data, error } = await supabase
                .from("commission_rule_versions")
                .select("*")
                .order("version_number", { ascending: false });

            if (!error && data && data.length > 0) {
                const defaultRules = CommissionSimulationService.getDefaultRules();
                const defaultProg = this.getDefaultProgressionCriteria();

                return data.map((row: any) => ({
                    id: row.id,
                    versionNumber: Number(row.version_number),
                    versionName: row.version_name,
                    isActive: Boolean(row.is_active),
                    rules: {
                        poolPercentage: Number(row.pool_percentage ?? defaultRules.poolPercentage),
                        maxCeilingPoolPercentage: Number(
                            row.max_ceiling_pool_percentage ?? defaultRules.maxCeilingPoolPercentage
                        ),
                        directSharePercentage: Number(
                            row.direct_share_percentage ?? defaultRules.directSharePercentage
                        ),
                        leadershipSharePercentage: Number(
                            row.leadership_share_percentage ?? defaultRules.leadershipSharePercentage
                        ),
                        teamDevSharePercentage: Number(
                            row.team_dev_share_percentage ?? defaultRules.teamDevSharePercentage
                        ),
                        leadershipTierWeights:
                            row.leadership_tier_weights || defaultRules.leadershipTierWeights,
                        performanceMultipliers:
                            row.performance_multipliers || defaultRules.performanceMultipliers,
                        multiplierCapMode:
                            row.multiplier_cap_mode === "BASE_WITH_CEILING"
                                ? "BASE_WITH_CEILING"
                                : "RESERVE_NORMALIZED",
                        excellenceReserveRatio: defaultRules.excellenceReserveRatio,
                        enablePerEmployeeCap:
                            row.enable_per_employee_cap !== undefined
                                ? Boolean(row.enable_per_employee_cap)
                                : true,
                        roleMaxCapUsd: row.role_max_cap_usd || defaultRules.roleMaxCapUsd
                    },
                    progressionCriteria:
                        row.progression_criteria && Object.keys(row.progression_criteria).length > 0
                            ? row.progression_criteria
                            : defaultProg,
                    notes: row.notes || "",
                    createdBy: row.created_by || null,
                    createdAt: row.created_at || new Date().toISOString()
                }));
            }
        } catch {
            // Table may not be migrated yet; use fallback
        }

        return fallback.ruleVersions;
    }

    /**
     * Publishes a new versioned commission rule configuration and marks it active.
     * Never mutates historical tour_commissions snapshots.
     */
    static async createNewRuleVersion(params: {
        versionName: string;
        rules: ICommissionRuleConfig;
        progressionCriteria?: Record<string, IProgressionCriterion>;
        notes: string;
        userId?: string | null;
    }): Promise<ICommissionRuleVersionRecord> {
        const { createAdminClient } = await import("@/utils/supabase/admin");
        const supabase = createAdminClient();
        const existingVersions = await this.getRuleVersions();
        const nextVersionNumber =
            existingVersions.reduce((max, v) => Math.max(max, v.versionNumber), 0) + 1;

        const newRecord: ICommissionRuleVersionRecord = {
            id: crypto.randomUUID(),
            versionNumber: nextVersionNumber,
            versionName:
                params.versionName.trim() || `v${nextVersionNumber}.0 — Updated Commission Policy`,
            isActive: true,
            rules: params.rules,
            progressionCriteria:
                params.progressionCriteria || this.getDefaultProgressionCriteria(),
            notes: params.notes,
            createdBy: params.userId || null,
            createdAt: new Date().toISOString()
        };

        // Try SQL persistence
        try {
            await supabase
                .from("commission_rule_versions")
                .update({ is_active: false })
                .neq("id", "00000000-0000-0000-0000-000000000000");

            const { data, error } = await supabase
                .from("commission_rule_versions")
                .insert({
                    id: newRecord.id,
                    version_number: newRecord.versionNumber,
                    version_name: newRecord.versionName,
                    is_active: true,
                    pool_percentage: newRecord.rules.poolPercentage,
                    max_ceiling_pool_percentage: newRecord.rules.maxCeilingPoolPercentage,
                    multiplier_cap_mode: newRecord.rules.multiplierCapMode,
                    direct_share_percentage: newRecord.rules.directSharePercentage,
                    leadership_share_percentage: newRecord.rules.leadershipSharePercentage,
                    team_dev_share_percentage: newRecord.rules.teamDevSharePercentage,
                    leadership_tier_weights: newRecord.rules.leadershipTierWeights,
                    performance_multipliers: newRecord.rules.performanceMultipliers,
                    enable_per_employee_cap: newRecord.rules.enablePerEmployeeCap,
                    role_max_cap_usd: newRecord.rules.roleMaxCapUsd,
                    progression_criteria: newRecord.progressionCriteria,
                    notes: newRecord.notes,
                    created_by: newRecord.createdBy
                })
                .select()
                .single();

            if (!error && data) {
                newRecord.id = data.id;
            }
        } catch {
            // Fallback handled below
        }

        // Always sync to app_states fallback
        const fallback = await this.loadAppStateFallback();
        const updatedVersions = [
            newRecord,
            ...fallback.ruleVersions.map((v) => ({ ...v, isActive: false }))
        ];
        await this.saveAppStateFallback({
            ...fallback,
            ruleVersions: updatedVersions
        });

        return newRecord;
    }

    /**
     * Loads all saved Tour Commission records (with their allocations and audit adjustments).
     */
    static async getTourCommissions(
        toursRefMap?: Map<string, ITourFinancialReference>
    ): Promise<ITourCommissionRecord[]> {
        const { createAdminClient } = await import("@/utils/supabase/admin");
        const supabase = createAdminClient();
        const fallback = await this.loadAppStateFallback();

        const refs =
            toursRefMap ||
            new Map(
                (await CommissionSimulationService.getRealToursForSimulation()).map((t) => [
                    t.tourId,
                    t
                ])
            );

        try {
            const { data: commRows, error } = await supabase
                .from("tour_commissions")
                .select(
                    `
                    *,
                    tour_commission_allocations (*),
                    commission_adjustments (*)
                `
                )
                .order("updated_at", { ascending: false });

            if (!error && commRows && commRows.length > 0) {
                return commRows.map((row: any) => {
                    const tourRef = refs.get(row.tour_id);
                    const allocations: ITourCommissionAllocationRecord[] = (
                        row.tour_commission_allocations || []
                    ).map((a: any) => ({
                        id: a.id,
                        tourCommissionId: a.tour_commission_id,
                        tourId: a.tour_id,
                        userId: a.user_id,
                        recipientName: a.recipient_name,
                        roleAtTime: a.role_at_time,
                        roleLabel: a.role_label,
                        allocationType: a.allocation_type,
                        leadershipTier: a.leadership_tier,
                        hasActiveContribution: Boolean(a.has_active_contribution),
                        sharePercentage: Number(a.share_percentage),
                        ratingTier: a.rating_tier || "meets",
                        appliedMultiplier: Number(a.applied_multiplier || 1),
                        customMaxCapUsd:
                            a.custom_max_cap_usd !== null && a.custom_max_cap_usd !== undefined
                                ? Number(a.custom_max_cap_usd)
                                : null,
                        appliedCapUsd:
                            a.applied_cap_usd !== null && a.applied_cap_usd !== undefined
                                ? Number(a.applied_cap_usd)
                                : null,
                        baseAmountUsd: Number(a.base_amount_usd || 0),
                        uncappedAmountUsd: Number(a.uncapped_amount_usd || 0),
                        cappedExcessReturnedUsd: Number(a.capped_excess_returned_usd || 0),
                        finalAmountUsd: Number(a.final_amount_usd || 0),
                        finalAmountLkr: Number(a.final_amount_lkr || 0),
                        eligibilityStatus: a.eligibility_status || "ELIGIBLE",
                        eligibilityNotes: a.eligibility_notes || "",
                        isOverride: Boolean(a.is_override),
                        overrideJustification: a.override_justification || null,
                        createdAt: a.created_at
                    }));

                    const adjustments: ICommissionAdjustmentRecord[] = (
                        row.commission_adjustments || []
                    )
                        .map((adj: any) => ({
                            id: adj.id,
                            tourCommissionId: adj.tour_commission_id,
                            tourId: adj.tour_id,
                            userId: adj.user_id,
                            actionType: adj.action_type,
                            previousStatus: adj.previous_status,
                            newStatus: adj.new_status,
                            adjustmentAmountUsd: Number(adj.adjustment_amount_usd || 0),
                            justification: adj.justification,
                            performedBy: adj.performed_by,
                            performedByName: adj.performed_by_name || "Admin",
                            createdAt: adj.created_at
                        }))
                        .sort(
                            (a: ICommissionAdjustmentRecord, b: ICommissionAdjustmentRecord) =>
                                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        );

                    return {
                        id: row.id,
                        tourId: row.tour_id,
                        tourCode: tourRef?.tourCode || null,
                        tourTitle: tourRef?.title || "Tour",
                        tourStatus: tourRef?.status || "ACTIVE",
                        leadAgentId: tourRef?.agentId || null,
                        leadAgentName: tourRef?.agentName || "Unassigned",
                        leadAgentRole: tourRef?.agentRole || "agent",
                        ruleVersionId: row.rule_version_id,
                        ruleVersionNumber: Number(row.rule_snapshot?.versionNumber || 1),
                        ruleVersionName:
                            row.rule_snapshot?.versionName || "v1.0 — Commission Policy",
                        ruleSnapshot:
                            row.rule_snapshot && row.rule_snapshot.poolPercentage
                                ? row.rule_snapshot
                                : CommissionSimulationService.getDefaultRules(),
                        status: row.status,
                        customerRevenueUsd: Number(row.customer_revenue_usd || 0),
                        systemDirectExpensesUsd: Number(row.system_direct_expenses_usd || 0),
                        declaredGrossProfitUsd: Number(row.declared_gross_profit_usd || 0),
                        declaredGrossProfitNotes: row.declared_gross_profit_notes || "",
                        exchangeRateLkr: Number(row.exchange_rate_lkr || 300),
                        baseCommissionPoolUsd: Number(row.base_commission_pool_usd || 0),
                        hardCapCeilingPoolUsd: Number(row.hard_cap_ceiling_pool_usd || 0),
                        directSubPoolUsd: Number(row.direct_sub_pool_usd || 0),
                        leadershipSubPoolUsd: Number(row.leadership_sub_pool_usd || 0),
                        teamDevSubPoolUsd: Number(row.team_dev_sub_pool_usd || 0),
                        totalDirectDistributedUsd: Number(row.total_direct_distributed_usd || 0),
                        totalLeadershipDistributedUsd: Number(
                            row.total_leadership_distributed_usd || 0
                        ),
                        totalTeamDevDistributedUsd: Number(row.total_team_dev_distributed_usd || 0),
                        totalCommissionDistributedUsd: Number(
                            row.total_commission_distributed_usd || 0
                        ),
                        totalCommissionDistributedLkr: Number(
                            row.total_commission_distributed_lkr || 0
                        ),
                        totalCappedExcessReturnedUsd: Number(
                            row.total_capped_excess_returned_usd || 0
                        ),
                        unallocatedPoolReturnedUsd: Number(row.unallocated_pool_returned_usd || 0),
                        companyRetainedGrossProfitUsd: Number(
                            row.company_retained_gross_profit_usd || 0
                        ),
                        allocations,
                        adjustments,
                        calculatedAt: row.calculated_at || row.updated_at,
                        approvedBy: row.approved_by,
                        approvedAt: row.approved_at,
                        paidBy: row.paid_by,
                        paidAt: row.paid_at,
                        paymentReference: row.payment_reference,
                        updatedAt: row.updated_at
                    };
                });
            }
        } catch {
            // Table may not be migrated yet; use fallback
        }

        return fallback.tourCommissions;
    }

    /**
     * Calculates, snapshots, and saves a Tour Commission record along with all individual employee allocations and audit trail.
     */
    static async calculateAndSaveTourCommission(
        payload: ISaveTourCommissionPayload,
        actor: { id: string; name: string }
    ): Promise<ITourCommissionRecord> {
        const { createAdminClient } = await import("@/utils/supabase/admin");
        const supabase = createAdminClient();
        const ruleVersions = await this.getRuleVersions();
        const activeRuleVersion =
            ruleVersions.find((v) => v.isActive) ||
            ruleVersions[0] ||
            this.getDefaultInitialRuleVersion();

        const tourRefs = await CommissionSimulationService.getRealToursForSimulation();
        const tourRef = tourRefs.find((t) => t.tourId === payload.tourId);

        const existingCommissions = await this.getTourCommissions(
            new Map(tourRefs.map((t) => [t.tourId, t]))
        );
        const existingRecord = existingCommissions.find((c) => c.tourId === payload.tourId);

        // Preserve frozen rule snapshot if already Approved or Paid unless recalculating in Calculated/Pending Approval state
        const ruleToApply: ICommissionRuleConfig =
            existingRecord &&
            (existingRecord.status === "Approved" || existingRecord.status === "Paid")
                ? existingRecord.ruleSnapshot
                : activeRuleVersion.rules;

        const customerRevenueUsd = tourRef?.systemAgreedRevenueUsd || 0;
        const systemDirectExpensesUsd = tourRef?.systemAgreedCostUsd || 0;

        const simResult = CommissionSimulationService.simulateTourCommission({
            tourLabel: tourRef?.title || "Tour",
            tourId: payload.tourId,
            customerRevenueUsd,
            systemDirectExpensesUsd,
            declaredGrossProfitUsd: payload.declaredGrossProfitUsd,
            useDeclaredGrossProfit: true,
            declaredGrossProfitNotes: payload.declaredGrossProfitNotes,
            exchangeRateLkr: payload.exchangeRateLkr || 300,
            isTourCompleted: payload.status !== "Not Eligible" && payload.status !== "Cancelled",
            isCancelled: payload.status === "Cancelled",
            rules: ruleToApply,
            directContributors: payload.directContributors,
            leadershipChain: payload.leadershipChain,
            teamDevRecipient: payload.teamDevRecipient || null
        });

        const nowIso = new Date().toISOString();
        const commissionId = existingRecord?.id || crypto.randomUUID();

        const allocationRecords: ITourCommissionAllocationRecord[] = simResult.allocations.map(
            (alloc) => {
                const matchingDirect = payload.directContributors.find(
                    (d) => d.id === alloc.recipientId && alloc.allocationType === "DIRECT"
                );
                const matchingLeader = payload.leadershipChain.find(
                    (l) =>
                        l.id === alloc.recipientId &&
                        alloc.allocationType.startsWith("LEADERSHIP_TIER_")
                );

                return {
                    id: crypto.randomUUID(),
                    tourCommissionId: commissionId,
                    tourId: payload.tourId,
                    userId:
                        alloc.recipientId.startsWith("custom-") ||
                        alloc.recipientId.startsWith("emp-")
                            ? null
                            : alloc.recipientId,
                    recipientName: alloc.recipientName,
                    roleAtTime: alloc.role,
                    roleLabel: alloc.roleLabel,
                    allocationType: alloc.allocationType,
                    leadershipTier: matchingLeader?.tier || null,
                    hasActiveContribution: matchingLeader
                        ? matchingLeader.hasActiveContribution
                        : true,
                    sharePercentage: alloc.sharePercentageOfSubPool,
                    ratingTier: (alloc.ratingTier as any) || "meets",
                    appliedMultiplier: alloc.appliedMultiplier,
                    customMaxCapUsd:
                        matchingDirect?.maxCapUsd ?? matchingLeader?.maxCapUsd ?? null,
                    appliedCapUsd: alloc.appliedCapUsd,
                    baseAmountUsd: alloc.baseAmountUsd,
                    uncappedAmountUsd: alloc.uncappedAmountUsd,
                    cappedExcessReturnedUsd: alloc.cappedExcessReturnedUsd,
                    finalAmountUsd: alloc.finalAmountUsd,
                    finalAmountLkr: alloc.finalAmountLkr,
                    eligibilityStatus: alloc.eligibilityStatus,
                    eligibilityNotes: alloc.notes,
                    isOverride: alloc.eligibilityStatus === "OVERRIDE_APPLIED",
                    overrideJustification: matchingLeader?.overrideJustification || null,
                    createdAt: nowIso
                };
            }
        );

        const newAdjustment: ICommissionAdjustmentRecord = {
            id: crypto.randomUUID(),
            tourCommissionId: commissionId,
            tourId: payload.tourId,
            userId: actor.id,
            actionType:
                existingRecord && existingRecord.status !== payload.status
                    ? payload.status === "Paid"
                        ? "PAID"
                        : "STATUS_CHANGE"
                    : "CALCULATED",
            previousStatus: existingRecord?.status || null,
            newStatus: payload.status,
            adjustmentAmountUsd: simResult.totalCommissionDistributedUsd,
            justification:
                payload.justification?.trim() ||
                `Calculated commission on Declared Gross Profit of $${payload.declaredGrossProfitUsd.toLocaleString()} (${activeRuleVersion.versionName}).`,
            performedBy: actor.id,
            performedByName: actor.name,
            createdAt: nowIso
        };

        const fullRecord: ITourCommissionRecord = {
            id: commissionId,
            tourId: payload.tourId,
            tourCode: tourRef?.tourCode || null,
            tourTitle: tourRef?.title || "Tour",
            tourStatus: tourRef?.status || "ACTIVE",
            leadAgentId: tourRef?.agentId || null,
            leadAgentName: tourRef?.agentName || "Unassigned",
            leadAgentRole: tourRef?.agentRole || "agent",
            ruleVersionId:
                activeRuleVersion.id === "default-rule-v1" ? null : activeRuleVersion.id,
            ruleVersionNumber: activeRuleVersion.versionNumber,
            ruleVersionName: activeRuleVersion.versionName,
            ruleSnapshot: ruleToApply,
            status:
                simResult.status === "Not Eligible" && payload.status === "Calculated"
                    ? "Not Eligible"
                    : payload.status,
            customerRevenueUsd,
            systemDirectExpensesUsd,
            declaredGrossProfitUsd: payload.declaredGrossProfitUsd,
            declaredGrossProfitNotes: payload.declaredGrossProfitNotes,
            exchangeRateLkr: payload.exchangeRateLkr || 300,
            baseCommissionPoolUsd: simResult.baseCommissionPoolUsd,
            hardCapCeilingPoolUsd: simResult.hardCapCeilingPoolUsd,
            directSubPoolUsd: simResult.directSubPoolUsd,
            leadershipSubPoolUsd: simResult.leadershipSubPoolUsd,
            teamDevSubPoolUsd: simResult.teamDevSubPoolUsd,
            totalDirectDistributedUsd: simResult.totalDirectDistributedUsd,
            totalLeadershipDistributedUsd: simResult.totalLeadershipDistributedUsd,
            totalTeamDevDistributedUsd: simResult.totalTeamDevDistributedUsd,
            totalCommissionDistributedUsd: simResult.totalCommissionDistributedUsd,
            totalCommissionDistributedLkr: simResult.totalCommissionDistributedLkr,
            totalCappedExcessReturnedUsd: simResult.totalCappedExcessReturnedUsd,
            unallocatedPoolReturnedUsd: simResult.unallocatedPoolReturnedToCompanyUsd,
            companyRetainedGrossProfitUsd: simResult.companyRetainedGrossProfitUsd,
            allocations: allocationRecords,
            adjustments: [newAdjustment, ...(existingRecord?.adjustments || [])],
            calculatedAt: nowIso,
            approvedBy:
                payload.status === "Approved" || payload.status === "Paid"
                    ? existingRecord?.approvedBy || actor.id
                    : existingRecord?.approvedBy || null,
            approvedAt:
                payload.status === "Approved" || payload.status === "Paid"
                    ? existingRecord?.approvedAt || nowIso
                    : existingRecord?.approvedAt || null,
            paidBy: payload.status === "Paid" ? actor.id : existingRecord?.paidBy || null,
            paidAt: payload.status === "Paid" ? nowIso : existingRecord?.paidAt || null,
            paymentReference:
                payload.paymentReference || existingRecord?.paymentReference || null,
            updatedAt: nowIso
        };

        // Attempt SQL table persistence
        try {
            const { error: upsertErr } = await supabase.from("tour_commissions").upsert(
                {
                    id: fullRecord.id,
                    tour_id: fullRecord.tourId,
                    rule_version_id: fullRecord.ruleVersionId,
                    rule_snapshot: {
                        ...fullRecord.ruleSnapshot,
                        versionNumber: fullRecord.ruleVersionNumber,
                        versionName: fullRecord.ruleVersionName
                    },
                    status: fullRecord.status,
                    customer_revenue_usd: fullRecord.customerRevenueUsd,
                    system_direct_expenses_usd: fullRecord.systemDirectExpensesUsd,
                    declared_gross_profit_usd: fullRecord.declaredGrossProfitUsd,
                    declared_gross_profit_notes: fullRecord.declaredGrossProfitNotes,
                    exchange_rate_lkr: fullRecord.exchangeRateLkr,
                    base_commission_pool_usd: fullRecord.baseCommissionPoolUsd,
                    hard_cap_ceiling_pool_usd: fullRecord.hardCapCeilingPoolUsd,
                    direct_sub_pool_usd: fullRecord.directSubPoolUsd,
                    leadership_sub_pool_usd: fullRecord.leadershipSubPoolUsd,
                    team_dev_sub_pool_usd: fullRecord.teamDevSubPoolUsd,
                    total_direct_distributed_usd: fullRecord.totalDirectDistributedUsd,
                    total_leadership_distributed_usd: fullRecord.totalLeadershipDistributedUsd,
                    total_team_dev_distributed_usd: fullRecord.totalTeamDevDistributedUsd,
                    total_commission_distributed_usd: fullRecord.totalCommissionDistributedUsd,
                    total_commission_distributed_lkr: fullRecord.totalCommissionDistributedLkr,
                    total_capped_excess_returned_usd: fullRecord.totalCappedExcessReturnedUsd,
                    unallocated_pool_returned_usd: fullRecord.unallocatedPoolReturnedUsd,
                    company_retained_gross_profit_usd: fullRecord.companyRetainedGrossProfitUsd,
                    calculated_by: actor.id,
                    calculated_at: fullRecord.calculatedAt,
                    approved_by: fullRecord.approvedBy,
                    approved_at: fullRecord.approvedAt,
                    paid_by: fullRecord.paidBy,
                    paid_at: fullRecord.paidAt,
                    payment_reference: fullRecord.paymentReference,
                    updated_at: nowIso
                },
                { onConflict: "tour_id" }
            );

            if (!upsertErr) {
                await supabase
                    .from("tour_commission_allocations")
                    .delete()
                    .eq("tour_commission_id", fullRecord.id);

                if (allocationRecords.length > 0) {
                    await supabase.from("tour_commission_allocations").insert(
                        allocationRecords.map((a) => ({
                            id: a.id,
                            tour_commission_id: fullRecord.id,
                            tour_id: a.tourId,
                            user_id: a.userId,
                            recipient_name: a.recipientName,
                            role_at_time: a.roleAtTime,
                            role_label: a.roleLabel,
                            allocation_type: a.allocationType,
                            leadership_tier: a.leadershipTier,
                            has_active_contribution: a.hasActiveContribution,
                            share_percentage: a.sharePercentage,
                            rating_tier: a.ratingTier,
                            applied_multiplier: a.appliedMultiplier,
                            custom_max_cap_usd: a.customMaxCapUsd,
                            applied_cap_usd: a.appliedCapUsd,
                            base_amount_usd: a.baseAmountUsd,
                            multiplier_adjusted_amount_usd: a.uncappedAmountUsd,
                            uncapped_amount_usd: a.uncappedAmountUsd,
                            capped_excess_returned_usd: a.cappedExcessReturnedUsd,
                            final_amount_usd: a.finalAmountUsd,
                            final_amount_lkr: a.finalAmountLkr,
                            eligibility_status: a.eligibilityStatus,
                            eligibility_notes: a.eligibilityNotes,
                            is_override: a.isOverride,
                            override_justification: a.overrideJustification
                        }))
                    );
                }

                await supabase.from("commission_adjustments").insert({
                    id: newAdjustment.id,
                    tour_commission_id: fullRecord.id,
                    tour_id: fullRecord.tourId,
                    user_id: newAdjustment.userId,
                    action_type: newAdjustment.actionType,
                    previous_status: newAdjustment.previousStatus,
                    new_status: newAdjustment.newStatus,
                    adjustment_amount_usd: newAdjustment.adjustmentAmountUsd,
                    justification: newAdjustment.justification,
                    performed_by: newAdjustment.performedBy,
                    performed_by_name: newAdjustment.performedByName
                });
            }
        } catch {
            // Fallback synced below
        }

        // Sync to app_states fallback
        const fallback = await this.loadAppStateFallback();
        const otherCommissions = fallback.tourCommissions.filter(
            (c) => c.tourId !== payload.tourId
        );
        await this.saveAppStateFallback({
            ...fallback,
            tourCommissions: [fullRecord, ...otherCommissions]
        });

        return fullRecord;
    }

    /**
     * Builds the Personal Employee Dashboard (Section 8) for a specific employee.
     */
    static buildEmployeeDashboard(
        employeeUserId: string,
        employees: IEmployeeHierarchyNode[],
        tourCommissions: ITourCommissionRecord[],
        toursRefs: ITourFinancialReference[],
        progressionCriteria: Record<string, IProgressionCriterion>
    ): IEmployeeCommissionDashboardData {
        const empMap = new Map(employees.map((e) => [e.userId, e]));
        const employee: IEmployeeHierarchyNode = empMap.get(employeeUserId) || {
            userId: employeeUserId,
            name: "Employee",
            email: "",
            role: "agent",
            roleLabel: "Agent",
            supervisorId: null,
            supervisorName: null,
            supervisorRoleLabel: null,
            directSubordinatesCount: 0
        };

        // Direct + indirect subordinates under this employee
        const teamMembers: IEmployeeHierarchyNode[] = [];
        const queue = [employee.userId];
        const visitedTeam = new Set<string>([employee.userId]);
        while (queue.length > 0) {
            const currId = queue.shift()!;
            for (const e of employees) {
                if (e.supervisorId === currId && !visitedTeam.has(e.userId)) {
                    visitedTeam.add(e.userId);
                    teamMembers.push(e);
                    queue.push(e.userId);
                }
            }
        }

        // Reporting chain upwards
        const reportingChainUpwards: IEmployeeHierarchyNode[] = [];
        let currSupId = employee.supervisorId;
        const visitedUp = new Set<string>([employee.userId]);
        while (currSupId && !visitedUp.has(currSupId)) {
            visitedUp.add(currSupId);
            const supNode = empMap.get(currSupId);
            if (!supNode) break;
            reportingChainUpwards.push(supNode);
            currSupId = supNode.supervisorId;
        }

        let toursManagedCount = 0;
        let toursSupportedCount = 0;
        let totalTourRevenueContributedUsd = 0;
        let totalDeclaredGrossProfitGeneratedUsd = 0;
        let totalCommissionEarnedUsd = 0;
        let totalCommissionEarnedLkr = 0;
        let pendingCommissionUsd = 0;
        let approvedCommissionUsd = 0;
        let paidCommissionUsd = 0;
        let directCommissionEarnedUsd = 0;
        let leadershipCommissionEarnedUsd = 0;
        let teamDevCommissionEarnedUsd = 0;
        let multiplierSum = 0;
        let multiplierCount = 0;

        const allocationsHistory: IEmployeeCommissionDashboardData["allocationsHistory"] = [];

        for (const tc of tourCommissions) {
            const myAllocs = tc.allocations.filter(
                (a) =>
                    a.userId === employee.userId ||
                    a.recipientName.toLowerCase() === employee.name.toLowerCase()
            );
            if (myAllocs.length === 0) continue;

            const hasDirect = myAllocs.some((a) => a.allocationType === "DIRECT");
            if (hasDirect) {
                toursManagedCount++;
                const directShareRatio =
                    myAllocs
                        .filter((a) => a.allocationType === "DIRECT")
                        .reduce((acc, a) => acc + a.sharePercentage, 0) / 100;
                totalTourRevenueContributedUsd += tc.customerRevenueUsd * directShareRatio;
                totalDeclaredGrossProfitGeneratedUsd +=
                    tc.declaredGrossProfitUsd * directShareRatio;
            } else {
                toursSupportedCount++;
            }

            const primaryDirectAlloc = tc.allocations.find(
                (a) => a.allocationType === "DIRECT"
            );
            const resolvedLeadName =
                primaryDirectAlloc?.recipientName || tc.leadAgentName || "Assigned Agent";
            const resolvedLeadRoleLabel =
                primaryDirectAlloc?.roleLabel ||
                ROLE_LABELS_MAP[tc.leadAgentRole] ||
                "Agent";

            for (const alloc of myAllocs) {
                allocationsHistory.push({
                    allocation: alloc,
                    tourCode: tc.tourCode,
                    tourTitle: tc.tourTitle,
                    leadAgentName: resolvedLeadName,
                    leadAgentRoleLabel: resolvedLeadRoleLabel,
                    tourCommissionStatus: tc.status,
                    declaredGrossProfitUsd: tc.declaredGrossProfitUsd,
                    calculatedAt: tc.calculatedAt
                });

                if (tc.status === "Cancelled" || tc.status === "Not Eligible") continue;

                totalCommissionEarnedUsd += alloc.finalAmountUsd;
                totalCommissionEarnedLkr += alloc.finalAmountLkr;

                if (alloc.allocationType === "DIRECT") {
                    directCommissionEarnedUsd += alloc.finalAmountUsd;
                } else if (alloc.allocationType === "TEAM_DEVELOPMENT") {
                    teamDevCommissionEarnedUsd += alloc.finalAmountUsd;
                } else {
                    leadershipCommissionEarnedUsd += alloc.finalAmountUsd;
                }

                if (tc.status === "Paid") {
                    paidCommissionUsd += alloc.finalAmountUsd;
                } else if (tc.status === "Approved") {
                    approvedCommissionUsd += alloc.finalAmountUsd;
                } else {
                    pendingCommissionUsd += alloc.finalAmountUsd;
                }

                multiplierSum += alloc.appliedMultiplier;
                multiplierCount++;
            }
        }

        // Also count tours assigned to this employee in toursRefs if not yet in tourCommissions
        if (toursManagedCount === 0) {
            const assignedRefs = toursRefs.filter((t) => t.agentId === employee.userId);
            toursManagedCount = assignedRefs.length;
            totalTourRevenueContributedUsd = assignedRefs.reduce(
                (s, t) => s + t.systemAgreedRevenueUsd,
                0
            );
            totalDeclaredGrossProfitGeneratedUsd = assignedRefs.reduce(
                (s, t) => s + t.systemAgreedGrossProfitUsd,
                0
            );
        }

        const averageMultiplier =
            multiplierCount > 0 ? Math.round((multiplierSum / multiplierCount) * 100) / 100 : 1.0;

        const currentRatingLabel =
            averageMultiplier >= 1.4
                ? "Exceptional (1.5x)"
                : averageMultiplier >= 1.15
                  ? "Exceeds Expectations (1.2x)"
                  : averageMultiplier >= 0.95
                    ? "Meets Expectations (1.0x)"
                    : "Below Expectations (0.5x)";

        const crit =
            progressionCriteria[employee.role] ||
            this.getDefaultProgressionCriteria()[employee.role] ||
            this.getDefaultProgressionCriteria().agent;

        const qualifiedMenteesCount = teamMembers.filter((m) =>
            toursRefs.some((t) => t.agentId === m.userId)
        ).length;

        const tourProgress =
            crit.minTours > 0 ? Math.min(1, toursManagedCount / crit.minTours) : 1;
        const gpProgress =
            crit.minGpUsd > 0
                ? Math.min(1, totalDeclaredGrossProfitGeneratedUsd / crit.minGpUsd)
                : 1;
        const menteeProgress =
            crit.minMentees > 0 ? Math.min(1, qualifiedMenteesCount / crit.minMentees) : 1;

        const overallProgressPct = Math.round(
            (tourProgress * 0.4 + gpProgress * 0.4 + menteeProgress * 0.2) * 100
        );

        return {
            employee,
            teamMembers,
            reportingChainUpwards,
            toursManagedCount,
            toursSupportedCount,
            totalTourRevenueContributedUsd: Math.round(totalTourRevenueContributedUsd * 100) / 100,
            totalDeclaredGrossProfitGeneratedUsd:
                Math.round(totalDeclaredGrossProfitGeneratedUsd * 100) / 100,
            totalCommissionEarnedUsd: Math.round(totalCommissionEarnedUsd * 100) / 100,
            totalCommissionEarnedLkr: Math.round(totalCommissionEarnedLkr),
            pendingCommissionUsd: Math.round(pendingCommissionUsd * 100) / 100,
            approvedCommissionUsd: Math.round(approvedCommissionUsd * 100) / 100,
            paidCommissionUsd: Math.round(paidCommissionUsd * 100) / 100,
            directCommissionEarnedUsd: Math.round(directCommissionEarnedUsd * 100) / 100,
            leadershipCommissionEarnedUsd: Math.round(leadershipCommissionEarnedUsd * 100) / 100,
            teamDevCommissionEarnedUsd: Math.round(teamDevCommissionEarnedUsd * 100) / 100,
            averageMultiplier,
            currentRatingLabel,
            progression: {
                currentRoleLabel: employee.roleLabel,
                nextRoleLabel: crit.nextRoleLabel,
                overallProgressPct,
                toursCompleted: toursManagedCount,
                targetTours: crit.minTours,
                grossProfitUsd: Math.round(totalDeclaredGrossProfitGeneratedUsd),
                targetGrossProfitUsd: crit.minGpUsd,
                qualifiedMenteesCount,
                targetMenteesCount: crit.minMentees
            },
            allocationsHistory
        };
    }

    /**
     * Builds the Management Dashboard (Section 9) across all commissioned tours and employees.
     */
    static buildManagementDashboard(
        employees: IEmployeeHierarchyNode[],
        tourCommissions: ITourCommissionRecord[],
        toursRefs: ITourFinancialReference[]
    ): IManagementCommissionDashboardData {
        const validCommissions = tourCommissions.filter(
            (tc) => tc.status !== "Cancelled" && tc.status !== "Not Eligible"
        );

        const totalCompletedTours = toursRefs.filter(
            (t) => t.status === "COMPLETED" || t.status === "CONFIRMED" || t.status === "ACTIVE"
        ).length;

        let totalTourRevenueUsd = 0;
        let totalDeclaredGrossProfitUsd = 0;
        let totalCommissionLiabilityUsd = 0;
        let totalCommissionLiabilityLkr = 0;
        let totalCommissionPaidUsd = 0;
        let totalCommissionPendingUsd = 0;
        let totalCommissionApprovedUsd = 0;
        let totalCompanyRetainedGrossProfitUsd = 0;
        let totalUnallocatedAndCappedReturnedUsd = 0;
        let directPoolTotalUsd = 0;
        let leadershipPoolTotalUsd = 0;
        let teamDevPoolTotalUsd = 0;

        for (const tc of validCommissions) {
            totalTourRevenueUsd += tc.customerRevenueUsd;
            totalDeclaredGrossProfitUsd += tc.declaredGrossProfitUsd;
            totalCommissionLiabilityUsd += tc.totalCommissionDistributedUsd;
            totalCommissionLiabilityLkr += tc.totalCommissionDistributedLkr;
            totalCompanyRetainedGrossProfitUsd += tc.companyRetainedGrossProfitUsd;
            totalUnallocatedAndCappedReturnedUsd += tc.unallocatedPoolReturnedUsd;
            directPoolTotalUsd += tc.totalDirectDistributedUsd;
            leadershipPoolTotalUsd += tc.totalLeadershipDistributedUsd;
            teamDevPoolTotalUsd += tc.totalTeamDevDistributedUsd;

            if (tc.status === "Paid") {
                totalCommissionPaidUsd += tc.totalCommissionDistributedUsd;
            } else if (tc.status === "Approved") {
                totalCommissionApprovedUsd += tc.totalCommissionDistributedUsd;
            } else {
                totalCommissionPendingUsd += tc.totalCommissionDistributedUsd;
            }
        }

        const employeeRankings = employees
            .map((emp) => {
                let toursManaged = 0;
                let toursSupported = 0;
                let declaredGpGeneratedUsd = 0;
                let directCommissionUsd = 0;
                let leadershipCommissionUsd = 0;
                let teamDevCommissionUsd = 0;
                let totalCommissionUsd = 0;
                let totalCommissionLkr = 0;
                let paidCommissionUsd = 0;
                let pendingCommissionUsd = 0;

                for (const tc of validCommissions) {
                    const myAllocs = tc.allocations.filter(
                        (a) =>
                            a.userId === emp.userId ||
                            a.recipientName.toLowerCase() === emp.name.toLowerCase()
                    );
                    if (myAllocs.length === 0) continue;

                    const directAllocs = myAllocs.filter((a) => a.allocationType === "DIRECT");
                    if (directAllocs.length > 0) {
                        toursManaged++;
                        const share =
                            directAllocs.reduce((acc, a) => acc + a.sharePercentage, 0) / 100;
                        declaredGpGeneratedUsd += tc.declaredGrossProfitUsd * share;
                    } else {
                        toursSupported++;
                    }

                    for (const a of myAllocs) {
                        totalCommissionUsd += a.finalAmountUsd;
                        totalCommissionLkr += a.finalAmountLkr;
                        if (a.allocationType === "DIRECT") directCommissionUsd += a.finalAmountUsd;
                        else if (a.allocationType === "TEAM_DEVELOPMENT")
                            teamDevCommissionUsd += a.finalAmountUsd;
                        else leadershipCommissionUsd += a.finalAmountUsd;

                        if (tc.status === "Paid") paidCommissionUsd += a.finalAmountUsd;
                        else pendingCommissionUsd += a.finalAmountUsd;
                    }
                }

                return {
                    userId: emp.userId,
                    name: emp.name,
                    role: emp.role,
                    roleLabel: emp.roleLabel,
                    supervisorName: emp.supervisorName,
                    toursManaged,
                    toursSupported,
                    declaredGpGeneratedUsd: Math.round(declaredGpGeneratedUsd * 100) / 100,
                    directCommissionUsd: Math.round(directCommissionUsd * 100) / 100,
                    leadershipCommissionUsd: Math.round(leadershipCommissionUsd * 100) / 100,
                    teamDevCommissionUsd: Math.round(teamDevCommissionUsd * 100) / 100,
                    totalCommissionUsd: Math.round(totalCommissionUsd * 100) / 100,
                    totalCommissionLkr: Math.round(totalCommissionLkr),
                    paidCommissionUsd: Math.round(paidCommissionUsd * 100) / 100,
                    pendingCommissionUsd: Math.round(pendingCommissionUsd * 100) / 100
                };
            })
            .sort((a, b) => b.totalCommissionUsd - a.totalCommissionUsd);

        return {
            totalCompletedTours,
            totalCommissionedTours: validCommissions.length,
            totalTourRevenueUsd: Math.round(totalTourRevenueUsd * 100) / 100,
            totalDeclaredGrossProfitUsd: Math.round(totalDeclaredGrossProfitUsd * 100) / 100,
            totalCommissionLiabilityUsd: Math.round(totalCommissionLiabilityUsd * 100) / 100,
            totalCommissionLiabilityLkr: Math.round(totalCommissionLiabilityLkr),
            totalCommissionPaidUsd: Math.round(totalCommissionPaidUsd * 100) / 100,
            totalCommissionPendingUsd: Math.round(totalCommissionPendingUsd * 100) / 100,
            totalCommissionApprovedUsd: Math.round(totalCommissionApprovedUsd * 100) / 100,
            totalCompanyRetainedGrossProfitUsd:
                Math.round(totalCompanyRetainedGrossProfitUsd * 100) / 100,
            totalUnallocatedAndCappedReturnedUsd:
                Math.round(totalUnallocatedAndCappedReturnedUsd * 100) / 100,
            directPoolTotalUsd: Math.round(directPoolTotalUsd * 100) / 100,
            leadershipPoolTotalUsd: Math.round(leadershipPoolTotalUsd * 100) / 100,
            teamDevPoolTotalUsd: Math.round(teamDevPoolTotalUsd * 100) / 100,
            employeeRankings
        };
    }

    /**
     * Loads the complete initial workspace state for `/admin/commissions`.
     */
    static async getWorkspaceInitialData(
        user?: {
            id: string;
            email?: string;
            user_metadata?: any;
        } | null,
        isAdmin: boolean = false
    ): Promise<CommissionWorkspaceInitialDataDTO> {
        const [allRuleVersions, employees, toursFinancialReferences] = await Promise.all([
            this.getRuleVersions(),
            this.getEmployeeHierarchyNodes(),
            CommissionSimulationService.getRealToursForSimulation()
        ]);

        const matchedEmployee = user ? employees.find((e) => e.userId === user.id) : null;
        const role = isAdmin
            ? "admin"
            : matchedEmployee?.role || user?.user_metadata?.role || "agent";

        const currentUser = {
            id: user?.id || "admin",
            name:
                matchedEmployee?.name ||
                user?.user_metadata?.first_name ||
                user?.email ||
                "Administrator",
            email: user?.email || "",
            role,
            roleLabel: ROLE_LABELS_MAP[role] || role,
            isAdminOrFinance: isAdmin
        };

        const activeRuleVersion =
            allRuleVersions.find((v) => v.isActive) ||
            allRuleVersions[0] ||
            this.getDefaultInitialRuleVersion();

        const tourRefMap = new Map(toursFinancialReferences.map((t) => [t.tourId, t]));
        const tourCommissions = await this.getTourCommissions(tourRefMap);

        const defaultEmployeeIdForDashboard =
            employees.find((e) => e.userId === currentUser.id)?.userId ||
            employees[0]?.userId ||
            currentUser.id;

        const myDashboard = this.buildEmployeeDashboard(
            defaultEmployeeIdForDashboard,
            employees,
            tourCommissions,
            toursFinancialReferences,
            activeRuleVersion.progressionCriteria
        );

        const managementDashboard = this.buildManagementDashboard(
            employees,
            tourCommissions,
            toursFinancialReferences
        );

        return new CommissionWorkspaceInitialDataDTO({
            currentUser,
            activeRuleVersion,
            allRuleVersions,
            employees,
            toursFinancialReferences,
            tourCommissions,
            myDashboard,
            managementDashboard
        });
    }
}

