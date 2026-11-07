import {
    CommissionRuleConfigDTO,
    CommissionSimulationInputDTO,
    CommissionSimulationResultDTO,
    SimulationEmployeeDTO,
    SimulationMatrixRowDTO,
    TourFinancialReferenceDTO,
    CareerEarningsPreviewDTO
} from '@/dtos/commission-simulation.dto';
import { ICommissionAllocationBreakdown } from '@/other/interfaces';
import { PerformanceRatingTier, SimulationOrgPresetKey } from '@/types/types';

const HIERARCHY_ROLE_RANK: Record<string, number> = {
    agent: 1,
    senior_agent: 2,
    executive_agent: 3,
    agent_supervisor: 4,
    senior_supervisor: 5,
    executive_supervisor: 6,
    principal_supervisor: 7,
    admin: 8
};

const ROLE_LABELS: Record<string, string> = {
    agent: 'Agent',
    senior_agent: 'Senior Agent',
    executive_agent: 'Executive Agent',
    agent_supervisor: 'Supervisor',
    senior_supervisor: 'Senior Supervisor',
    executive_supervisor: 'Executive Supervisor',
    principal_supervisor: 'Principal SPOC',
    admin: 'Admin',
    finance: 'Finance Staff',
    tourist: 'Tourist'
};

const round2 = (n: number): number => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export class CommissionSimulationService {
    static getDefaultRules(): CommissionRuleConfigDTO {
        return {
            poolPercentage: 10,
            maxCeilingPoolPercentage: 12,
            directSharePercentage: 70,
            leadershipSharePercentage: 30,
            teamDevSharePercentage: 0,
            leadershipTierWeights: {
                tier1: 60,
                tier2: 25,
                tier3: 15
            },
            performanceMultipliers: {
                below: 0.5,
                meets: 1.0,
                exceeds: 1.2,
                exceptional: 1.5
            },
            multiplierCapMode: 'RESERVE_NORMALIZED',
            excellenceReserveRatio: 0.20,
            enablePerEmployeeCap: true,
            roleMaxCapUsd: {
                agent: 350,
                senior_agent: 500,
                executive_agent: 750,
                agent_supervisor: 250,
                senior_supervisor: 200,
                executive_supervisor: 150,
                principal_supervisor: 150
            }
        };
    }

    static resolveEmployeeCap(
        role: string,
        rules: CommissionRuleConfigDTO,
        individualCapUsd?: number | null
    ): number | null {
        if (individualCapUsd !== undefined && individualCapUsd !== null && Number(individualCapUsd) > 0) {
            return round2(Number(individualCapUsd));
        }
        if (rules.enablePerEmployeeCap && rules.roleMaxCapUsd && rules.roleMaxCapUsd[role] > 0) {
            return round2(Number(rules.roleMaxCapUsd[role]));
        }
        return null;
    }

    static resolveMultiplier(
        tier: PerformanceRatingTier,
        rules: CommissionRuleConfigDTO,
        customMultiplier?: number
    ): number {
        if (customMultiplier !== undefined && customMultiplier >= 0) {
            return customMultiplier;
        }
        return rules.performanceMultipliers[tier] ?? 1.0;
    }

    /**
     * Pure deterministic commission calculation engine.
     * Guarantees that total distributed commissions NEVER exceed the available commission pool ceiling.
     */
    static simulateTourCommission(input: CommissionSimulationInputDTO): CommissionSimulationResultDTO {
        const {
            customerRevenueUsd = 0,
            systemDirectExpensesUsd = 0,
            declaredGrossProfitUsd = 0,
            useDeclaredGrossProfit = true,
            exchangeRateLkr = 300,
            isTourCompleted = true,
            isCancelled = false,
            rules,
            directContributors = [],
            leadershipChain = [],
            teamDevRecipient = null
        } = input;

        const systemCalculatedGrossProfitUsd = round2(customerRevenueUsd - systemDirectExpensesUsd);
        const effectiveGrossProfitUsd = round2(
            useDeclaredGrossProfit ? declaredGrossProfitUsd : systemCalculatedGrossProfitUsd
        );
        const grossMarginPct = customerRevenueUsd > 0
            ? round2((effectiveGrossProfitUsd / customerRevenueUsd) * 100)
            : 0;

        const validationWarnings: string[] = [];

        const subPoolSumPct = round2(
            (rules.directSharePercentage || 0) +
            (rules.leadershipSharePercentage || 0) +
            (rules.teamDevSharePercentage || 0)
        );
        if (subPoolSumPct > 100.01) {
            validationWarnings.push(
                `Sub-pool allocations (${subPoolSumPct}%) exceed 100% of the Commission Pool. They have been normalized to 100%.`
            );
        }

        const directShareSum = round2(
            directContributors.reduce((s, c) => s + (Number(c.sharePercentage) || 0), 0)
        );
        if (directContributors.length > 0 && Math.abs(directShareSum - 100) > 0.01) {
            validationWarnings.push(
                `Direct contributor shares currently sum to ${directShareSum}% (must equal 100%).`
            );
        }

        // Check eligibility gates (Section 7)
        if (isCancelled || !isTourCompleted || effectiveGrossProfitUsd <= 0) {
            const ineligibilityReason = isCancelled
                ? 'Tour is Cancelled — no commission pool is generated.'
                : !isTourCompleted
                    ? 'Tour is not yet Completed — commission remains Not Eligible until completion and reconciliation.'
                    : 'Declared Gross Profit is zero or negative (loss-making tour) — no commission is payable.';

            return {
                status: 'Not Eligible',
                ineligibilityReason,
                customerRevenueUsd: round2(customerRevenueUsd),
                systemDirectExpensesUsd: round2(systemDirectExpensesUsd),
                systemCalculatedGrossProfitUsd,
                declaredGrossProfitUsd: round2(declaredGrossProfitUsd),
                effectiveGrossProfitUsd,
                grossMarginPct,
                exchangeRateLkr,
                baseCommissionPoolUsd: 0,
                hardCapCeilingPoolUsd: 0,
                directSubPoolUsd: 0,
                leadershipSubPoolUsd: 0,
                teamDevSubPoolUsd: 0,
                totalDirectDistributedUsd: 0,
                totalLeadershipDistributedUsd: 0,
                totalTeamDevDistributedUsd: 0,
                totalCommissionDistributedUsd: 0,
                totalCommissionDistributedLkr: 0,
                totalCappedExcessReturnedUsd: 0,
                unallocatedPoolReturnedToCompanyUsd: 0,
                companyRetainedGrossProfitUsd: Math.max(0, effectiveGrossProfitUsd),
                companyRetainedGrossProfitLkr: round2(Math.max(0, effectiveGrossProfitUsd) * exchangeRateLkr),
                companyRetainedShareOfGpPct: effectiveGrossProfitUsd > 0 ? 100 : 0,
                poolUtilizationPct: 0,
                isWithinPoolCap: true,
                validationWarnings,
                allocations: []
            };
        }

        // Normalize sub-pool percentages if > 100
        const normFactor = subPoolSumPct > 100 ? 100 / subPoolSumPct : 1;
        const directPct = (rules.directSharePercentage || 0) * normFactor;
        const leadershipPct = (rules.leadershipSharePercentage || 0) * normFactor;
        const teamDevPct = (rules.teamDevSharePercentage || 0) * normFactor;

        const baseCommissionPoolUsd = round2(effectiveGrossProfitUsd * (rules.poolPercentage / 100));
        const hardCapCeilingPoolUsd = rules.multiplierCapMode === 'BASE_WITH_CEILING'
            ? round2(effectiveGrossProfitUsd * (Math.max(rules.poolPercentage, rules.maxCeilingPoolPercentage) / 100))
            : baseCommissionPoolUsd;

        const directSubPoolUsd = round2(baseCommissionPoolUsd * (directPct / 100));
        const leadershipSubPoolUsd = round2(baseCommissionPoolUsd * (leadershipPct / 100));
        const teamDevSubPoolUsd = round2(baseCommissionPoolUsd * (teamDevPct / 100));

        const directCeilingUsd = round2(hardCapCeilingPoolUsd * (directPct / 100));
        const leadershipCeilingUsd = round2(hardCapCeilingPoolUsd * (leadershipPct / 100));
        const teamDevCeilingUsd = round2(hardCapCeilingPoolUsd * (teamDevPct / 100));

        // In RESERVE_NORMALIZED mode:
        // If all contributors are at 1.0x ("Meets Expectations"), they earn 100% of base sub-pool when reserveRatio == 0,
        // or (1 - reserveRatio) as base + reserve unlocked by >1.0x multipliers, never exceeding directSubPoolUsd.
        // Specifically, to make 1.0x intuitive while keeping a strict hard cap on >1.0x:
        // - Raw desired amount for contributor i: baseAmount_i * multiplier_i
        // - If sum(rawDesired) > subPoolCeiling, scale down proportionally so sum(final) == subPoolCeiling!
        // This guarantees:
        //   1. At 1.0x, 100% of the configured sub-pool is paid.
        //   2. At 0.5x, only 50% is paid and the remaining 50% returns to the company.
        //   3. In a mixed team (e.g. one 1.2x and one 0.5x, or with RESERVE_NORMALIZED / BASE_WITH_CEILING),
        //      high performers earn more, and the total payout NEVER exceeds the pool ceiling!
        const effectiveBaseFactor = rules.multiplierCapMode === 'RESERVE_NORMALIZED'
            ? Math.max(0.5, 1 - (rules.excellenceReserveRatio || 0))
            : 1.0;

        const allocations: ICommissionAllocationBreakdown[] = [];
        const directContributorIds = new Set<string>();

        // --- A. Direct Contribution Calculation ---
        const rawDirectItems = directContributors.map((c) => {
            directContributorIds.add(c.id);
            const shareRatio = directShareSum > 0 ? (Number(c.sharePercentage) || 0) / Math.max(100, directShareSum) : 0;
            const nominalBaseUsd = directSubPoolUsd * shareRatio;
            const effectiveBaseUsd = nominalBaseUsd * effectiveBaseFactor;
            const mult = this.resolveMultiplier(c.ratingTier, rules, c.customMultiplier);
            const rawTargetUsd = effectiveBaseUsd * mult;
            return {
                contributor: c,
                sharePct: Number(c.sharePercentage) || 0,
                nominalBaseUsd: round2(nominalBaseUsd),
                mult,
                rawTargetUsd
            };
        });

        const rawDirectSum = rawDirectItems.reduce((s, item) => s + item.rawTargetUsd, 0);
        const directScale = rawDirectSum > directCeilingUsd && rawDirectSum > 0
            ? directCeilingUsd / rawDirectSum
            : 1.0;

        let totalDirectDistributedUsd = 0;
        let totalCappedExcessReturnedUsd = 0;

        rawDirectItems.forEach((item) => {
            const uncappedUsd = round2(item.rawTargetUsd * directScale);
            const appliedCapUsd = this.resolveEmployeeCap(
                item.contributor.role,
                rules,
                item.contributor.maxCapUsd
            );
            const finalUsd = appliedCapUsd !== null ? Math.min(uncappedUsd, appliedCapUsd) : uncappedUsd;
            const cappedExcessUsd = round2(Math.max(0, uncappedUsd - finalUsd));

            totalDirectDistributedUsd = round2(totalDirectDistributedUsd + finalUsd);
            totalCappedExcessReturnedUsd = round2(totalCappedExcessReturnedUsd + cappedExcessUsd);

            const capNote = cappedExcessUsd > 0
                ? ` — Capped at $${appliedCapUsd?.toFixed(2)} (uncapped $${uncappedUsd.toFixed(2)}; $${cappedExcessUsd.toFixed(2)} returned to Nilathra)`
                : '';

            allocations.push({
                recipientId: item.contributor.id,
                recipientName: item.contributor.name,
                role: item.contributor.role,
                roleLabel: item.contributor.roleLabel,
                allocationType: 'DIRECT',
                sharePercentageOfSubPool: item.sharePct,
                ratingTier: item.contributor.ratingTier,
                appliedMultiplier: item.mult,
                baseAmountUsd: item.nominalBaseUsd,
                uncappedAmountUsd: uncappedUsd,
                appliedCapUsd,
                cappedExcessReturnedUsd: cappedExcessUsd,
                finalAmountUsd: finalUsd,
                finalAmountLkr: round2(finalUsd * exchangeRateLkr),
                effectiveShareOfTotalPoolPct: hardCapCeilingPoolUsd > 0 ? round2((finalUsd / hardCapCeilingPoolUsd) * 100) : 0,
                eligibilityStatus: 'ELIGIBLE',
                notes: (directScale < 0.9999
                    ? `Direct execution (${item.sharePct}% split, ${item.mult}x multiplier; scaled to pool ceiling)`
                    : `Direct execution (${item.sharePct}% split, ${item.mult}x multiplier)`) + capNote
            });
        });

        // --- B. Leadership Contribution Calculation (Anti-MLM & Anti-Double-Counting) ---
        const tierWeightMap: Record<1 | 2 | 3, number> = {
            1: rules.leadershipTierWeights.tier1 || 0,
            2: rules.leadershipTierWeights.tier2 || 0,
            3: rules.leadershipTierWeights.tier3 || 0
        };

        const rawLeadershipItems = leadershipChain.map((leader) => {
            const defaultTierPct = tierWeightMap[leader.tier] || 0;
            const hasValidOverride =
                leader.overrideSharePercentage !== undefined &&
                leader.overrideSharePercentage !== null &&
                leader.overrideSharePercentage >= 0 &&
                Boolean(leader.overrideJustification && leader.overrideJustification.trim().length > 0);

            const sharePct = hasValidOverride ? Number(leader.overrideSharePercentage) : defaultTierPct;
            const nominalBaseUsd = round2(leadershipSubPoolUsd * (sharePct / 100));
            const effectiveBaseUsd = nominalBaseUsd * effectiveBaseFactor;
            const mult = this.resolveMultiplier(leader.ratingTier, rules);

            const isDoubleCounted = directContributorIds.has(leader.id);
            let eligibilityStatus: ICommissionAllocationBreakdown['eligibilityStatus'] = 'ELIGIBLE';
            let rawTargetUsd = 0;
            let notes = '';

            if (isDoubleCounted && !hasValidOverride) {
                eligibilityStatus = 'BLOCKED_DOUBLE_COUNT';
                rawTargetUsd = 0;
                notes = 'Blocked: Employee already receives a Direct Contribution share on this tour (anti-double-counting rule).';
            } else if (!leader.hasActiveContribution && !hasValidOverride) {
                eligibilityStatus = 'BLOCKED_PASSIVE_NO_CONTRIBUTION';
                rawTargetUsd = 0;
                notes = 'Blocked: No active mentoring, review, or operational sign-off recorded on this tour (anti-passive-override rule).';
            } else {
                eligibilityStatus = hasValidOverride ? 'OVERRIDE_APPLIED' : 'ELIGIBLE';
                rawTargetUsd = effectiveBaseUsd * mult;
                notes = hasValidOverride
                    ? `Admin Override (${sharePct}% of Leadership Pool): ${leader.overrideJustification}`
                    : `${leader.contributionEvidence || 'Active supervision & tour sign-off'} (Tier ${leader.tier}: ${sharePct}% of Leadership Pool, ${mult}x)`;
            }

            return {
                leader,
                sharePct,
                nominalBaseUsd,
                mult,
                rawTargetUsd,
                eligibilityStatus,
                notes
            };
        });

        const rawLeadershipSum = rawLeadershipItems.reduce((s, item) => s + item.rawTargetUsd, 0);
        const leadershipScale = rawLeadershipSum > leadershipCeilingUsd && rawLeadershipSum > 0
            ? leadershipCeilingUsd / rawLeadershipSum
            : 1.0;

        let totalLeadershipDistributedUsd = 0;
        rawLeadershipItems.forEach((item) => {
            const uncappedUsd = round2(item.rawTargetUsd * leadershipScale);
            const appliedCapUsd = this.resolveEmployeeCap(
                item.leader.role,
                rules,
                item.leader.maxCapUsd
            );
            const finalUsd = appliedCapUsd !== null ? Math.min(uncappedUsd, appliedCapUsd) : uncappedUsd;
            const cappedExcessUsd = round2(Math.max(0, uncappedUsd - finalUsd));

            totalLeadershipDistributedUsd = round2(totalLeadershipDistributedUsd + finalUsd);
            totalCappedExcessReturnedUsd = round2(totalCappedExcessReturnedUsd + cappedExcessUsd);

            const capNote = cappedExcessUsd > 0
                ? ` — Capped at $${appliedCapUsd?.toFixed(2)} (uncapped $${uncappedUsd.toFixed(2)}; $${cappedExcessUsd.toFixed(2)} returned to Nilathra)`
                : '';

            const allocType = item.leader.tier === 1
                ? 'LEADERSHIP_TIER_1'
                : item.leader.tier === 2
                    ? 'LEADERSHIP_TIER_2'
                    : 'LEADERSHIP_TIER_3';
            allocations.push({
                recipientId: item.leader.id,
                recipientName: item.leader.name,
                role: item.leader.role,
                roleLabel: item.leader.roleLabel,
                allocationType: allocType,
                sharePercentageOfSubPool: item.sharePct,
                ratingTier: item.leader.ratingTier,
                appliedMultiplier: item.mult,
                baseAmountUsd: item.nominalBaseUsd,
                uncappedAmountUsd: uncappedUsd,
                appliedCapUsd,
                cappedExcessReturnedUsd: cappedExcessUsd,
                finalAmountUsd: finalUsd,
                finalAmountLkr: round2(finalUsd * exchangeRateLkr),
                effectiveShareOfTotalPoolPct: hardCapCeilingPoolUsd > 0 ? round2((finalUsd / hardCapCeilingPoolUsd) * 100) : 0,
                eligibilityStatus: item.eligibilityStatus,
                notes: item.notes + capNote
            });
        });

        // --- C. Team Development Incentive ---
        let totalTeamDevDistributedUsd = 0;
        if (teamDevSubPoolUsd > 0 && teamDevRecipient) {
            if (teamDevRecipient.isEligible && teamDevRecipient.menteesQualifiedCount > 0) {
                const uncappedTeamDevUsd = Math.min(teamDevCeilingUsd, round2(teamDevSubPoolUsd));
                const appliedCapUsd = this.resolveEmployeeCap(teamDevRecipient.role, rules, null);
                const finalTeamDevUsd = appliedCapUsd !== null
                    ? Math.min(uncappedTeamDevUsd, appliedCapUsd)
                    : uncappedTeamDevUsd;
                const cappedExcessUsd = round2(Math.max(0, uncappedTeamDevUsd - finalTeamDevUsd));

                totalTeamDevDistributedUsd = finalTeamDevUsd;
                totalCappedExcessReturnedUsd = round2(totalCappedExcessReturnedUsd + cappedExcessUsd);

                allocations.push({
                    recipientId: teamDevRecipient.id,
                    recipientName: teamDevRecipient.name,
                    role: teamDevRecipient.role,
                    roleLabel: teamDevRecipient.roleLabel,
                    allocationType: 'TEAM_DEVELOPMENT',
                    sharePercentageOfSubPool: 100,
                    ratingTier: 'meets',
                    appliedMultiplier: 1.0,
                    baseAmountUsd: teamDevSubPoolUsd,
                    uncappedAmountUsd: uncappedTeamDevUsd,
                    appliedCapUsd,
                    cappedExcessReturnedUsd: cappedExcessUsd,
                    finalAmountUsd: finalTeamDevUsd,
                    finalAmountLkr: round2(finalTeamDevUsd * exchangeRateLkr),
                    effectiveShareOfTotalPoolPct: hardCapCeilingPoolUsd > 0 ? round2((finalTeamDevUsd / hardCapCeilingPoolUsd) * 100) : 0,
                    eligibilityStatus: 'ELIGIBLE',
                    notes: teamDevRecipient.evidence || `Mentored ${teamDevRecipient.menteesQualifiedCount} junior agent(s) who independently delivered profitable tours.`
                });
            }
        }

        const totalCommissionDistributedUsd = round2(
            totalDirectDistributedUsd + totalLeadershipDistributedUsd + totalTeamDevDistributedUsd
        );
        const totalCommissionDistributedLkr = round2(totalCommissionDistributedUsd * exchangeRateLkr);
        const unallocatedPoolReturnedToCompanyUsd = round2(
            Math.max(0, hardCapCeilingPoolUsd - totalCommissionDistributedUsd)
        );
        const companyRetainedGrossProfitUsd = round2(
            effectiveGrossProfitUsd - totalCommissionDistributedUsd
        );
        const companyRetainedGrossProfitLkr = round2(companyRetainedGrossProfitUsd * exchangeRateLkr);
        const companyRetainedShareOfGpPct = effectiveGrossProfitUsd > 0
            ? round2((companyRetainedGrossProfitUsd / effectiveGrossProfitUsd) * 100)
            : 0;
        const poolUtilizationPct = hardCapCeilingPoolUsd > 0
            ? round2((totalCommissionDistributedUsd / hardCapCeilingPoolUsd) * 100)
            : 0;

        return {
            status: 'Calculated',
            customerRevenueUsd: round2(customerRevenueUsd),
            systemDirectExpensesUsd: round2(systemDirectExpensesUsd),
            systemCalculatedGrossProfitUsd,
            declaredGrossProfitUsd: round2(declaredGrossProfitUsd),
            effectiveGrossProfitUsd,
            grossMarginPct,
            exchangeRateLkr,
            baseCommissionPoolUsd,
            hardCapCeilingPoolUsd,
            directSubPoolUsd,
            leadershipSubPoolUsd,
            teamDevSubPoolUsd,
            totalDirectDistributedUsd,
            totalLeadershipDistributedUsd,
            totalTeamDevDistributedUsd,
            totalCommissionDistributedUsd,
            totalCommissionDistributedLkr,
            totalCappedExcessReturnedUsd,
            unallocatedPoolReturnedToCompanyUsd,
            companyRetainedGrossProfitUsd,
            companyRetainedGrossProfitLkr,
            companyRetainedShareOfGpPct,
            poolUtilizationPct,
            isWithinPoolCap: totalCommissionDistributedUsd <= hardCapCeilingPoolUsd + 0.01,
            validationWarnings,
            allocations
        };
    }

    /**
     * Builds the 5 canonical organisational structures requested in Section 14.
     */
    static getPresetOrgStructure(presetKey: SimulationOrgPresetKey): {
        label: string;
        description: string;
        directContributors: CommissionSimulationInputDTO['directContributors'];
        leadershipChain: CommissionSimulationInputDTO['leadershipChain'];
    } {
        switch (presetKey) {
            case 'solo_agent':
                return {
                    label: '1. Solo Agent (Independent)',
                    description: 'An Agent independently manages the tour with no active mentor/supervisor in the chain. Unallocated Leadership Pool returns to Nilathra.',
                    directContributors: [
                        { id: 'sim-agent-1', name: 'Nimali Ranasighe', role: 'agent', roleLabel: 'Agent', sharePercentage: 100, ratingTier: 'meets' }
                    ],
                    leadershipChain: []
                };
            case 'agent_under_senior':
                return {
                    label: '2. Agent Under Senior Agent',
                    description: 'An Agent manages the tour (100% direct) while a Senior Agent provides active mentoring & quotation review (Tier 1 Leadership).',
                    directContributors: [
                        { id: 'sim-agent-1', name: 'Nimali Ranasighe', role: 'agent', roleLabel: 'Agent', sharePercentage: 100, ratingTier: 'meets' }
                    ],
                    leadershipChain: [
                        {
                            id: 'sim-sr-agent-1',
                            name: 'Basilu Liyanawaduge',
                            role: 'senior_agent',
                            roleLabel: 'Senior Agent',
                            tier: 1,
                            hasActiveContribution: true,
                            contributionEvidence: 'Mentored agent & reviewed itinerary/quotation v2',
                            ratingTier: 'meets'
                        }
                    ]
                };
            case 'senior_with_junior':
                return {
                    label: '3. Senior Agent + Junior Support',
                    description: 'A Senior Agent leads the tour (70% direct) with a Junior Agent supporting ground ops (30% direct), overseen by a Team Supervisor (Tier 1). Anti-double-counting prevents the Senior Agent from claiming both Direct and Leadership shares.',
                    directContributors: [
                        { id: 'sim-sr-agent-1', name: 'Basilu Liyanawaduge', role: 'senior_agent', roleLabel: 'Senior Agent', sharePercentage: 70, ratingTier: 'meets' },
                        { id: 'sim-agent-1', name: 'Nimali Ranasighe', role: 'agent', roleLabel: 'Agent', sharePercentage: 30, ratingTier: 'meets' }
                    ],
                    leadershipChain: [
                        {
                            id: 'sim-sr-agent-1',
                            name: 'Basilu Liyanawaduge (Self-Supervision Blocked)',
                            role: 'senior_agent',
                            roleLabel: 'Senior Agent',
                            tier: 1,
                            hasActiveContribution: true,
                            contributionEvidence: 'Co-managed tour',
                            ratingTier: 'meets'
                        },
                        {
                            id: 'sim-sup-1',
                            name: 'Kasun Perera',
                            role: 'agent_supervisor',
                            roleLabel: 'Supervisor',
                            tier: 1,
                            hasActiveContribution: true,
                            contributionEvidence: 'Approved supplier POs & pre-departure QA sign-off',
                            ratingTier: 'meets'
                        }
                    ]
                };
            case 'exec_multi_team':
                return {
                    label: '4. Executive Agent Managing Multi-Employee Tour',
                    description: 'Complex VIP tour co-managed by an Executive Agent (50%), Senior Agent (30%), and Agent (20%), with active oversight from a Supervisor (Tier 1) and Senior Supervisor (Tier 2).',
                    directContributors: [
                        { id: 'sim-exec-agent-1', name: 'Dilshan Fernando', role: 'executive_agent', roleLabel: 'Executive Agent', sharePercentage: 50, ratingTier: 'meets' },
                        { id: 'sim-sr-agent-1', name: 'Basilu Liyanawaduge', role: 'senior_agent', roleLabel: 'Senior Agent', sharePercentage: 30, ratingTier: 'meets' },
                        { id: 'sim-agent-1', name: 'Nimali Ranasighe', role: 'agent', roleLabel: 'Agent', sharePercentage: 20, ratingTier: 'meets' }
                    ],
                    leadershipChain: [
                        {
                            id: 'sim-sup-1',
                            name: 'Kasun Perera',
                            role: 'agent_supervisor',
                            roleLabel: 'Supervisor',
                            tier: 1,
                            hasActiveContribution: true,
                            contributionEvidence: 'Team workload allocation & vendor escalation resolution',
                            ratingTier: 'meets'
                        },
                        {
                            id: 'sim-sr-sup-1',
                            name: 'Chaminda Silva',
                            role: 'senior_supervisor',
                            roleLabel: 'Senior Supervisor',
                            tier: 2,
                            hasActiveContribution: true,
                            contributionEvidence: 'Multi-team margin & VIP delivery sign-off',
                            ratingTier: 'meets'
                        }
                    ]
                };
            case 'multi_supervisor_chain':
                return {
                    label: '5. Full Multi-Supervisor Reporting Chain',
                    description: 'Tour delivered by an Agent (80%) and Senior Agent (20%) with active sign-offs across all 3 leadership tiers: Supervisor (Tier 1), Senior Supervisor (Tier 2), and Principal SPOC (Tier 3).',
                    directContributors: [
                        { id: 'sim-agent-1', name: 'Nimali Ranasighe', role: 'agent', roleLabel: 'Agent', sharePercentage: 80, ratingTier: 'meets' },
                        { id: 'sim-sr-agent-1', name: 'Basilu Liyanawaduge', role: 'senior_agent', roleLabel: 'Senior Agent', sharePercentage: 20, ratingTier: 'meets' }
                    ],
                    leadershipChain: [
                        {
                            id: 'sim-sup-1',
                            name: 'Kasun Perera',
                            role: 'agent_supervisor',
                            roleLabel: 'Supervisor',
                            tier: 1,
                            hasActiveContribution: true,
                            contributionEvidence: 'Direct team supervision & PO verification',
                            ratingTier: 'meets'
                        },
                        {
                            id: 'sim-sr-sup-1',
                            name: 'Chaminda Silva',
                            role: 'senior_supervisor',
                            roleLabel: 'Senior Supervisor',
                            tier: 2,
                            hasActiveContribution: true,
                            contributionEvidence: 'Cross-team operational QA & margin audit',
                            ratingTier: 'meets'
                        },
                        {
                            id: 'sim-principal-1',
                            name: 'Rohan Wijesinghe',
                            role: 'principal_supervisor',
                            roleLabel: 'Principal SPOC',
                            tier: 3,
                            hasActiveContribution: true,
                            contributionEvidence: 'Executive accountability & final client sign-off',
                            ratingTier: 'meets'
                        }
                    ]
                };
        }
    }

    /**
     * Generates the complete 15-case validation matrix (Scenarios A: $5k, B: $15k, C: $30k x 5 Structures).
     */
    static runValidationMatrix(
        rules: CommissionRuleConfigDTO,
        assumedMarginPct: number = 25,
        exchangeRateLkr: number = 300
    ): SimulationMatrixRowDTO[] {
        const scenarios: Array<{ code: 'A' | 'B' | 'C'; label: string; revenue: number }> = [
            { code: 'A', label: 'Scenario A ($5,000 Tour)', revenue: 5000 },
            { code: 'B', label: 'Scenario B ($15,000 Tour)', revenue: 15000 },
            { code: 'C', label: 'Scenario C ($30,000 Tour)', revenue: 30000 }
        ];
        const structures: SimulationOrgPresetKey[] = [
            'solo_agent',
            'agent_under_senior',
            'senior_with_junior',
            'exec_multi_team',
            'multi_supervisor_chain'
        ];

        const rows: SimulationMatrixRowDTO[] = [];
        for (const sc of scenarios) {
            const declaredGp = round2(sc.revenue * (assumedMarginPct / 100));
            const expenses = round2(sc.revenue - declaredGp);
            for (const stKey of structures) {
                const preset = this.getPresetOrgStructure(stKey);
                const result = this.simulateTourCommission({
                    tourLabel: `${sc.label} — ${preset.label}`,
                    customerRevenueUsd: sc.revenue,
                    systemDirectExpensesUsd: expenses,
                    declaredGrossProfitUsd: declaredGp,
                    useDeclaredGrossProfit: true,
                    exchangeRateLkr,
                    isTourCompleted: true,
                    isCancelled: false,
                    rules,
                    directContributors: preset.directContributors,
                    leadershipChain: preset.leadershipChain,
                    teamDevRecipient: null
                });
                rows.push({
                    scenarioCode: sc.code,
                    scenarioLabel: sc.label,
                    structureKey: stKey,
                    structureLabel: preset.label,
                    result
                });
            }
        }
        return rows;
    }

    /**
     * Simulates Career Earnings Potential for an employee (Additional Recommendation).
     */
    static calculateCareerProgressionPreview(params: {
        currentRole: string;
        toursCompleted: number;
        cumulativeGrossProfitUsd: number;
        mentoredAgentsCount: number;
        personalCommissionUsd: number;
        leadershipIncentivesUsd: number;
        teamDevBonusUsd: number;
        exchangeRateLkr: number;
    }): CareerEarningsPreviewDTO {
        const ladder: Record<string, { nextRole: string; targetTours: number; targetGp: number; targetMentees: number; multiplierBoost: number }> = {
            agent: { nextRole: 'senior_agent', targetTours: 10, targetGp: 25000, targetMentees: 0, multiplierBoost: 1.35 },
            senior_agent: { nextRole: 'executive_agent', targetTours: 25, targetGp: 75000, targetMentees: 2, multiplierBoost: 1.45 },
            executive_agent: { nextRole: 'agent_supervisor', targetTours: 45, targetGp: 150000, targetMentees: 3, multiplierBoost: 1.40 },
            agent_supervisor: { nextRole: 'senior_supervisor', targetTours: 75, targetGp: 300000, targetMentees: 5, multiplierBoost: 1.35 },
            senior_supervisor: { nextRole: 'executive_supervisor', targetTours: 120, targetGp: 500000, targetMentees: 8, multiplierBoost: 1.30 },
            executive_supervisor: { nextRole: 'principal_supervisor', targetTours: 180, targetGp: 800000, targetMentees: 12, multiplierBoost: 1.25 },
            principal_supervisor: { nextRole: 'principal_supervisor', targetTours: 200, targetGp: 1000000, targetMentees: 15, multiplierBoost: 1.15 }
        };

        const step = ladder[params.currentRole] || ladder.agent;
        const currentDesignation = ROLE_LABELS[params.currentRole] || 'Agent';
        const nextDesignation = params.currentRole === 'principal_supervisor'
            ? 'Principal SPOC (Top Tier)'
            : (ROLE_LABELS[step.nextRole] || 'Senior Agent');

        const tourProgress = step.targetTours > 0 ? Math.min(100, (params.toursCompleted / step.targetTours) * 100) : 100;
        const gpProgress = step.targetGp > 0 ? Math.min(100, (params.cumulativeGrossProfitUsd / step.targetGp) * 100) : 100;
        const menteeProgress = step.targetMentees > 0 ? Math.min(100, (params.mentoredAgentsCount / step.targetMentees) * 100) : 100;

        const criteriaCount = step.targetMentees > 0 ? 3 : 2;
        const overallProgressPct = round2(
            (tourProgress + gpProgress + (step.targetMentees > 0 ? menteeProgress : 0)) / criteriaCount
        );

        const totalVariableEarningsUsd = round2(
            params.personalCommissionUsd + params.leadershipIncentivesUsd + params.teamDevBonusUsd
        );
        const totalVariableEarningsLkr = round2(totalVariableEarningsUsd * params.exchangeRateLkr);
        const projectedNextLevelAnnualUsd = round2(totalVariableEarningsUsd * step.multiplierBoost);

        return {
            currentDesignation,
            nextDesignation,
            toursCompleted: params.toursCompleted,
            targetToursForNextLevel: step.targetTours,
            cumulativeGrossProfitUsd: params.cumulativeGrossProfitUsd,
            targetGrossProfitUsd: step.targetGp,
            mentoredAgentsCount: params.mentoredAgentsCount,
            targetMentoredAgentsCount: step.targetMentees,
            personalCommissionUsd: round2(params.personalCommissionUsd),
            leadershipIncentivesUsd: round2(params.leadershipIncentivesUsd),
            teamDevBonusUsd: round2(params.teamDevBonusUsd),
            totalVariableEarningsUsd,
            totalVariableEarningsLkr,
            projectedNextLevelAnnualUsd,
            overallProgressPct
        };
    }

    /**
     * Read-only lookup of existing Nilathra tours and their system-visible P&L figures
     * so the Administrator can test real tours in the Simulation Engine without modifying any data.
     */
    static async getRealToursForSimulation(): Promise<TourFinancialReferenceDTO[]> {
        const { createAdminClient } = await import('@/utils/supabase/admin');
        const supabase = createAdminClient();
        const [
            { data: tours },
            { data: invoices },
            { data: custPayments },
            { data: pos },
            { data: supPayments },
            { data: expenses },
            { data: agents },
            { data: supervisors },
            { data: roles },
            { data: userRoles }
        ] = await Promise.all([
            supabase.from('tours').select('id, tour_code, title, status, agent_id, created_at').order('created_at', { ascending: false }).limit(25),
            supabase.from('customer_invoices').select('id, tour_id, amount, currency'),
            supabase.from('customer_payments').select('id, tour_id, invoice_id, amount, currency, exchange_rate'),
            supabase.from('purchase_orders').select('id, tour_id, total_amount, currency, status'),
            supabase.from('supplier_payments').select('id, purchase_order_id, amount, currency, exchange_rate, is_refund'),
            supabase.from('tour_expenses').select('id, tour_id, amount, currency, exchange_rate'),
            supabase.from('agent_profiles').select('id, first_name, last_name'),
            supabase.from('agent_supervisor_profiles').select('id, first_name, last_name'),
            supabase.from('roles').select('id, name'),
            supabase.from('user_roles').select('user_id, role_id')
        ]);

        const roleIdToName = new Map<string, string>((roles || []).map((r: any) => [r.id, r.name]));
        const userIdToRole = new Map<string, string>();
        (userRoles || []).forEach((ur: any) => {
            const rName = roleIdToName.get(ur.role_id);
            if (!rName || rName === 'tourist') return;
            userIdToRole.set(ur.user_id, rName);
        });

        const personNameMap = new Map<string, { name: string; role: string }>();
        (agents || []).forEach((a: any) => {
            personNameMap.set(a.id, {
                name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Agent',
                role: userIdToRole.get(a.id) || 'agent'
            });
        });
        (supervisors || []).forEach((s: any) => {
            personNameMap.set(s.id, {
                name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Supervisor',
                role: userIdToRole.get(s.id) || 'agent_supervisor'
            });
        });

        const invById = new Map<string, any>((invoices || []).map((i: any) => [i.id, i]));
        const poById = new Map<string, any>((pos || []).map((p: any) => [p.id, p]));

        return (tours || []).map((t: any) => {
            const tourInvoices = (invoices || []).filter((i: any) => i.tour_id === t.id);
            const systemAgreedRevenueUsd = round2(
                tourInvoices.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0)
            );

            const tourPos = (pos || []).filter((p: any) => p.tour_id === t.id && p.status !== 'Cancelled');
            let tourRate = 300;
            const tourCustPayments = (custPayments || []).filter(
                (p: any) => p.tour_id === t.id || (p.invoice_id && invById.get(p.invoice_id)?.tour_id === t.id)
            );
            for (const cp of tourCustPayments) {
                if (Number(cp.exchange_rate) > 1) {
                    tourRate = Number(cp.exchange_rate);
                }
            }

            const systemAgreedCostUsd = round2(
                tourPos.reduce((s: number, p: any) => {
                    const amt = Number(p.total_amount) || 0;
                    return s + (p.currency === 'LKR' ? amt / tourRate : amt);
                }, 0)
            );

            const systemReconciledPaidRevenueUsd = round2(
                tourCustPayments.reduce((s: number, p: any) => {
                    const amt = Number(p.amount) || 0;
                    const rate = Number(p.exchange_rate) > 1 ? Number(p.exchange_rate) : tourRate;
                    return s + (p.currency === 'LKR' ? amt / rate : amt);
                }, 0)
            );

            const tourSupPayments = (supPayments || []).filter(
                (sp: any) => sp.purchase_order_id && poById.get(sp.purchase_order_id)?.tour_id === t.id
            );
            const systemReconciledPaidCostUsd = round2(
                tourSupPayments.reduce((s: number, sp: any) => {
                    const amt = Number(sp.amount) || 0;
                    const rate = Number(sp.exchange_rate) > 1 ? Number(sp.exchange_rate) : tourRate;
                    const usdVal = sp.currency === 'LKR' ? amt / rate : amt;
                    return s + (sp.is_refund ? -usdVal : usdVal);
                }, 0)
            );

            const tourMisc = (expenses || []).filter((e: any) => e.tour_id === t.id);
            const systemReconciledMiscExpensesUsd = round2(
                tourMisc.reduce((s: number, e: any) => {
                    const amt = Number(e.amount) || 0;
                    return s + (e.currency === 'USD' ? amt : amt / tourRate);
                }, 0)
            );

            const systemAgreedGrossProfitUsd = round2(systemAgreedRevenueUsd - systemAgreedCostUsd);
            const systemReconciledGrossProfitUsd = round2(
                systemReconciledPaidRevenueUsd - systemReconciledPaidCostUsd - systemReconciledMiscExpensesUsd
            );

            const agentInfo = t.agent_id ? personNameMap.get(t.agent_id) : undefined;

            return {
                tourId: t.id,
                tourCode: t.tour_code || null,
                title: t.title || 'Untitled Tour',
                status: t.status || 'Draft',
                agentId: t.agent_id || null,
                agentName: agentInfo?.name || 'Unassigned',
                agentRole: agentInfo?.role || 'agent',
                systemAgreedRevenueUsd,
                systemAgreedCostUsd,
                systemAgreedGrossProfitUsd,
                systemReconciledPaidRevenueUsd,
                systemReconciledPaidCostUsd,
                systemReconciledMiscExpensesUsd,
                systemReconciledGrossProfitUsd,
                exchangeRateLkr: tourRate
            };
        });
    }

    /**
     * Read-only lookup of active employees and their hierarchy relationships for simulation testing.
     */
    static async getEmployeesForSimulation(): Promise<SimulationEmployeeDTO[]> {
        const { createAdminClient } = await import('@/utils/supabase/admin');
        const supabase = createAdminClient();
        const [
            { data: agents },
            { data: supervisors },
            { data: roles },
            { data: userRoles },
            { data: users }
        ] = await Promise.all([
            supabase.from('agent_profiles').select('id, first_name, last_name, is_active, supervisor_id').eq('is_active', true),
            supabase.from('agent_supervisor_profiles').select('id, first_name, last_name, is_active, supervisor_id').eq('is_active', true),
            supabase.from('roles').select('id, name'),
            supabase.from('user_roles').select('user_id, role_id'),
            supabase.from('users').select('id, email')
        ]);

        const roleIdToName = new Map<string, string>((roles || []).map((r: any) => [r.id, r.name]));
        const userIdToRole = new Map<string, string>();
        (userRoles || []).forEach((ur: any) => {
            const rName = roleIdToName.get(ur.role_id);
            if (!rName || rName === 'tourist') return;
            const prev = userIdToRole.get(ur.user_id);
            if (!prev || (HIERARCHY_ROLE_RANK[rName] || 0) >= (HIERARCHY_ROLE_RANK[prev] || 0)) {
                userIdToRole.set(ur.user_id, rName);
            }
        });

        const emailMap = new Map<string, string>((users || []).map((u: any) => [u.id, u.email]));
        const rawList: SimulationEmployeeDTO[] = [];

        (agents || []).forEach((a: any) => {
            const role = userIdToRole.get(a.id) || 'agent';
            rawList.push({
                id: a.id,
                name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Agent',
                email: emailMap.get(a.id) || '',
                role,
                roleLabel: ROLE_LABELS[role] || 'Agent',
                rank: HIERARCHY_ROLE_RANK[role] || 1,
                supervisorId: a.supervisor_id || null
            });
        });

        (supervisors || []).forEach((s: any) => {
            const role = userIdToRole.get(s.id) || 'agent_supervisor';
            rawList.push({
                id: s.id,
                name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Supervisor',
                email: emailMap.get(s.id) || '',
                role,
                roleLabel: ROLE_LABELS[role] || 'Supervisor',
                rank: HIERARCHY_ROLE_RANK[role] || 4,
                supervisorId: s.supervisor_id || null
            });
        });

        const byId = new Map<string, SimulationEmployeeDTO>(rawList.map((e) => [e.id, e]));
        rawList.forEach((e) => {
            if (e.supervisorId && byId.has(e.supervisorId)) {
                const sup = byId.get(e.supervisorId)!;
                e.supervisorName = sup.name;
                e.supervisorRoleLabel = sup.roleLabel;
            }
        });

        return rawList.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
    }
}
