"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Calculator,
    Users,
    TrendingUp,
    ShieldCheck,
    AlertTriangle,
    CheckCircle2,
    Award,
    Sliders,
    Plus,
    Trash2,
    RefreshCw,
    Building2,
    Briefcase,
    ChevronRight,
    Info,
    DollarSign,
    Layers
} from "lucide-react";
import { getSimulationInitialDataAction } from "@/actions/commission-simulation.actions";
import { CommissionSimulationService } from "@/services/commission-simulation.service";
import {
    CommissionRuleConfigDTO,
    CommissionContributorInputDTO,
    CommissionLeaderInputDTO,
    TeamDevRecipientInputDTO,
    SimulationEmployeeDTO,
    TourFinancialReferenceDTO
} from "@/dtos/commission-simulation.dto";
import { PerformanceRatingTier, SimulationOrgPresetKey } from "@/types/types";

const ROLE_OPTIONS = [
    { value: "agent", label: "Agent (Level 1)" },
    { value: "senior_agent", label: "Senior Agent (Level 2)" },
    { value: "executive_agent", label: "Executive Agent (Level 3)" },
    { value: "agent_supervisor", label: "Supervisor (Level 4)" },
    { value: "senior_supervisor", label: "Senior Supervisor (Level 5)" },
    { value: "executive_supervisor", label: "Executive Supervisor (Level 6)" },
    { value: "principal_supervisor", label: "Principal SPOC (Level 7)" }
];

const ROLE_SHORT_LABELS: Record<string, string> = {
    agent: "Agent",
    senior_agent: "Senior Agent",
    executive_agent: "Executive Agent",
    agent_supervisor: "Supervisor",
    senior_supervisor: "Senior Supervisor",
    executive_supervisor: "Executive Supervisor",
    principal_supervisor: "Principal SPOC"
};

export default function CommissionSimulatorPage() {
    const [authChecking, setAuthChecking] = useState<boolean>(true);
    const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"sandbox" | "matrix" | "career">("sandbox");
    const [realTours, setRealTours] = useState<TourFinancialReferenceDTO[]>([]);
    const [employees, setEmployees] = useState<SimulationEmployeeDTO[]>([]);
    const [selectedTourId, setSelectedTourId] = useState<string>("");

    // Rule configuration state
    const [rules, setRules] = useState<CommissionRuleConfigDTO>(() =>
        CommissionSimulationService.getDefaultRules()
    );

    // Tour Financial Inputs
    const [tourLabel, setTourLabel] = useState<string>("Scenario B ($15,000 Tour)");
    const [customerRevenueUsd, setCustomerRevenueUsd] = useState<number>(15000);
    const [systemDirectExpensesUsd, setSystemDirectExpensesUsd] = useState<number>(11250);
    const [declaredGrossProfitUsd, setDeclaredGrossProfitUsd] = useState<number>(3750);
    const [useDeclaredGrossProfit, setUseDeclaredGrossProfit] = useState<boolean>(true);
    const [declaredGrossProfitNotes, setDeclaredGrossProfitNotes] = useState<string>(
        "Admin-verified commissionable Gross Profit after bank/card merchant fees and offline handling."
    );
    const [exchangeRateLkr, setExchangeRateLkr] = useState<number>(300);
    const [isTourCompleted, setIsTourCompleted] = useState<boolean>(true);
    const [isCancelled, setIsCancelled] = useState<boolean>(false);

    // Organisational Structure & Contributors
    const [selectedPreset, setSelectedPreset] = useState<SimulationOrgPresetKey>("agent_under_senior");
    const [directContributors, setDirectContributors] = useState<CommissionContributorInputDTO[]>(() =>
        CommissionSimulationService.getPresetOrgStructure("agent_under_senior").directContributors
    );
    const [leadershipChain, setLeadershipChain] = useState<CommissionLeaderInputDTO[]>(() =>
        CommissionSimulationService.getPresetOrgStructure("agent_under_senior").leadershipChain
    );
    const [teamDevRecipient, setTeamDevRecipient] = useState<TeamDevRecipientInputDTO>({
        id: "sim-sr-agent-1",
        name: "Basilu Liyanawaduge",
        role: "senior_agent",
        roleLabel: "Senior Agent",
        menteesQualifiedCount: 2,
        isEligible: true,
        evidence: "Mentored 2 Agents who each independently completed profitable tours."
    });

    // Matrix Assumed Margin %
    const [matrixMarginPct, setMatrixMarginPct] = useState<number>(25);

    // Career Progression Simulator state
    const [careerRole, setCareerRole] = useState<string>("agent");
    const [careerToursCompleted, setCareerToursCompleted] = useState<number>(8);
    const [careerCumulativeGpUsd, setCareerCumulativeGpUsd] = useState<number>(20000);
    const [careerMenteesCount, setCareerMenteesCount] = useState<number>(0);
    const [careerPersonalCommUsd, setCareerPersonalCommUsd] = useState<number>(1200);
    const [careerLeadershipCommUsd, setCareerLeadershipCommUsd] = useState<number>(150);
    const [careerTeamDevUsd, setCareerTeamDevUsd] = useState<number>(0);

    useEffect(() => {
        getSimulationInitialDataAction().then((res) => {
            if (res.unauthorized) {
                setIsAdminAuthorized(false);
                setAuthChecking(false);
                return;
            }
            setIsAdminAuthorized(true);
            setAuthChecking(false);
            if (res.success) {
                if (res.tours) setRealTours(res.tours);
                if (res.employees) setEmployees(res.employees);
            }
        });
    }, []);

    const handleSelectScenarioPreset = (code: "A" | "B" | "C") => {
        setSelectedTourId("");
        const rev = code === "A" ? 5000 : code === "B" ? 15000 : 30000;
        const exp = Math.round(rev * 0.75);
        const gp = rev - exp;
        setTourLabel(`Scenario ${code} ($${rev.toLocaleString()} Tour)`);
        setCustomerRevenueUsd(rev);
        setSystemDirectExpensesUsd(exp);
        setDeclaredGrossProfitUsd(gp);
        setIsTourCompleted(true);
        setIsCancelled(false);
    };

    const handleSelectRealTour = (tourId: string) => {
        setSelectedTourId(tourId);
        if (!tourId) return;
        const found = realTours.find((t) => t.tourId === tourId);
        if (!found) return;

        const useReconciled = found.systemReconciledPaidRevenueUsd > 0;
        const rev = useReconciled ? found.systemReconciledPaidRevenueUsd : found.systemAgreedRevenueUsd;
        const exp = useReconciled
            ? found.systemReconciledPaidCostUsd + found.systemReconciledMiscExpensesUsd
            : found.systemAgreedCostUsd;
        const gp = useReconciled ? found.systemReconciledGrossProfitUsd : found.systemAgreedGrossProfitUsd;

        setTourLabel(`${found.tourCode || "Tour"} — ${found.title}`);
        setCustomerRevenueUsd(rev);
        setSystemDirectExpensesUsd(exp);
        setDeclaredGrossProfitUsd(Math.max(0, gp));
        setExchangeRateLkr(found.exchangeRateLkr || 300);
        setIsTourCompleted(found.status === "Completed" || true);
        setIsCancelled(found.status === "Cancelled");

        // If the tour has an assigned agent in our employee list, populate the chain automatically!
        if (found.agentId && employees.length > 0) {
            const empById = new Map(employees.map((e) => [e.id, e]));
            const mainEmp = empById.get(found.agentId);
            if (mainEmp) {
                setDirectContributors([
                    {
                        id: mainEmp.id,
                        name: mainEmp.name,
                        role: mainEmp.role,
                        roleLabel: mainEmp.roleLabel,
                        sharePercentage: 100,
                        ratingTier: "meets"
                    }
                ]);

                const chain: CommissionLeaderInputDTO[] = [];
                let cursor = mainEmp.supervisorId ? empById.get(mainEmp.supervisorId) : undefined;
                let tierNum: 1 | 2 | 3 = 1;
                const seen = new Set<string>([mainEmp.id]);
                while (cursor && !seen.has(cursor.id) && tierNum <= 3) {
                    seen.add(cursor.id);
                    chain.push({
                        id: cursor.id,
                        name: cursor.name,
                        role: cursor.role,
                        roleLabel: cursor.roleLabel,
                        tier: tierNum,
                        hasActiveContribution: true,
                        contributionEvidence: "Reporting line supervision & tour review",
                        ratingTier: "meets"
                    });
                    if (tierNum < 3) tierNum = (tierNum + 1) as 1 | 2 | 3;
                    cursor = cursor.supervisorId ? empById.get(cursor.supervisorId) : undefined;
                }
                setLeadershipChain(chain);
            }
        }
    };

    const handleSelectOrgStructure = (presetKey: SimulationOrgPresetKey) => {
        setSelectedPreset(presetKey);
        const preset = CommissionSimulationService.getPresetOrgStructure(presetKey);
        setDirectContributors(preset.directContributors);
        setLeadershipChain(preset.leadershipChain);
    };

    // Run live simulation through centralized service
    const simulationResult = useMemo(() => {
        return CommissionSimulationService.simulateTourCommission({
            tourLabel,
            tourId: selectedTourId || null,
            customerRevenueUsd,
            systemDirectExpensesUsd,
            declaredGrossProfitUsd,
            useDeclaredGrossProfit,
            declaredGrossProfitNotes,
            exchangeRateLkr,
            isTourCompleted,
            isCancelled,
            rules,
            directContributors,
            leadershipChain,
            teamDevRecipient: rules.teamDevSharePercentage > 0 ? teamDevRecipient : null
        });
    }, [
        tourLabel,
        selectedTourId,
        customerRevenueUsd,
        systemDirectExpensesUsd,
        declaredGrossProfitUsd,
        useDeclaredGrossProfit,
        declaredGrossProfitNotes,
        exchangeRateLkr,
        isTourCompleted,
        isCancelled,
        rules,
        directContributors,
        leadershipChain,
        teamDevRecipient
    ]);

    const validationMatrix = useMemo(() => {
        return CommissionSimulationService.runValidationMatrix(rules, matrixMarginPct, exchangeRateLkr);
    }, [rules, matrixMarginPct, exchangeRateLkr]);

    const careerPreview = useMemo(() => {
        return CommissionSimulationService.calculateCareerProgressionPreview({
            currentRole: careerRole,
            toursCompleted: careerToursCompleted,
            cumulativeGrossProfitUsd: careerCumulativeGpUsd,
            mentoredAgentsCount: careerMenteesCount,
            personalCommissionUsd: careerPersonalCommUsd,
            leadershipIncentivesUsd: careerLeadershipCommUsd,
            teamDevBonusUsd: careerTeamDevUsd,
            exchangeRateLkr
        });
    }, [
        careerRole,
        careerToursCompleted,
        careerCumulativeGpUsd,
        careerMenteesCount,
        careerPersonalCommUsd,
        careerLeadershipCommUsd,
        careerTeamDevUsd,
        exchangeRateLkr
    ]);

    const selectedRealTourObj = useMemo(
        () => realTours.find((t) => t.tourId === selectedTourId) || null,
        [realTours, selectedTourId]
    );

    if (authChecking) {
        return (
            <div className="max-w-4xl mx-auto p-12 text-center text-sm text-neutral-500">
                Verifying Administrator permissions...
            </div>
        );
    }

    if (!isAdminAuthorized) {
        return (
            <div className="max-w-xl mx-auto mt-16 p-8 bg-white rounded-2xl border border-red-200 shadow-xs text-center space-y-3">
                <AlertTriangle size={32} className="text-red-600 mx-auto" />
                <h2 className="text-lg font-bold font-playfair text-brand-charcoal">
                    Administrator Access Only
                </h2>
                <p className="text-xs text-neutral-500">
                    The Commission &amp; Hierarchy Economic Simulator (<code>/admin/commission-simulator</code>) is restricted to Administrators only.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8 animate-in fade-in duration-300">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/15 text-brand-charcoal text-xs font-bold uppercase tracking-wider mb-2 border border-brand-gold/30">
                        <Calculator size={14} className="text-brand-gold" />
                        Phase 3 — Standalone Economic & Incentive Simulation Lab
                    </div>
                    <h1 className="text-3xl font-bold font-playfair text-brand-charcoal">
                        Employee Hierarchy & Tour Commission Simulator
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1 max-w-3xl">
                        Model commission pools from Admin-declared Gross Profit, test the 7-layer hierarchy, verify anti-MLM &amp; anti-double-counting rules, and validate company retained margins before committing to production.
                    </p>
                </div>

                {/* Top Mode Tabs */}
                <div className="flex bg-white p-1.5 rounded-xl border border-neutral-200 shadow-xs self-start">
                    <button
                        onClick={() => setActiveTab("sandbox")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                            activeTab === "sandbox"
                                ? "bg-brand-charcoal text-white shadow-xs"
                                : "text-neutral-600 hover:text-brand-charcoal"
                        }`}
                    >
                        <Sliders size={14} />
                        Interactive Tour Sandbox
                    </button>
                    <button
                        onClick={() => setActiveTab("matrix")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                            activeTab === "matrix"
                                ? "bg-brand-charcoal text-white shadow-xs"
                                : "text-neutral-600 hover:text-brand-charcoal"
                        }`}
                    >
                        <Layers size={14} />
                        15-Scenario Matrix ($5k / $15k / $30k)
                    </button>
                    <button
                        onClick={() => setActiveTab("career")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                            activeTab === "career"
                                ? "bg-brand-charcoal text-white shadow-xs"
                                : "text-neutral-600 hover:text-brand-charcoal"
                        }`}
                    >
                        <Award size={14} />
                        Career Earnings Potential
                    </button>
                </div>
            </div>

            {/* Global Commission Rule Configuration Bar */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 pb-4">
                    <div className="flex items-center gap-2.5">
                        <Sliders size={18} className="text-brand-gold" />
                        <h2 className="text-base font-bold text-brand-charcoal">
                            Configurable Commission Pool &amp; Distribution Rules
                        </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5">
                            <span className="font-bold text-neutral-500">Multiplier Cap Mode:</span>
                            <select
                                value={rules.multiplierCapMode}
                                onChange={(e) =>
                                    setRules((prev) => ({
                                        ...prev,
                                        multiplierCapMode: e.target.value as any,
                                        excellenceReserveRatio: e.target.value === "RESERVE_NORMALIZED" ? 0.0 : 0.0
                                    }))
                                }
                                className="font-bold text-brand-charcoal bg-transparent outline-none cursor-pointer"
                            >
                                <option value="RESERVE_NORMALIZED">
                                    Mode 1: Strict Hard Cap at Pool % (Never Exceeds Pool %)
                                </option>
                                <option value="BASE_WITH_CEILING">
                                    Mode 2: Base Pool % at 1.0x + Separate Max Ceiling % for 1.2x/1.5x
                                </option>
                            </select>
                        </div>
                        <button
                            onClick={() => setRules(CommissionSimulationService.getDefaultRules())}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-brand-charcoal bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <RefreshCw size={12} />
                            Reset Default Rules
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                    {/* Pool % of Gross Profit */}
                    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/80">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                                Commission Pool %
                            </label>
                            <span className="text-sm font-extrabold font-mono text-brand-charcoal">
                                {rules.poolPercentage}% of GP
                            </span>
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={30}
                            step={0.5}
                            value={rules.poolPercentage}
                            onChange={(e) =>
                                setRules((prev) => ({
                                    ...prev,
                                    poolPercentage: Number(e.target.value),
                                    maxCeilingPoolPercentage: Math.max(
                                        Number(e.target.value),
                                        prev.maxCeilingPoolPercentage
                                    )
                                }))
                            }
                            className="w-full accent-brand-gold cursor-pointer"
                        />
                        {rules.multiplierCapMode === "BASE_WITH_CEILING" && (
                            <div className="mt-2 pt-2 border-t border-neutral-200 flex items-center justify-between text-xs">
                                <span className="text-neutral-500 font-medium">1.5x Hard Ceiling %:</span>
                                <input
                                    type="number"
                                    min={rules.poolPercentage}
                                    max={40}
                                    step={0.5}
                                    value={rules.maxCeilingPoolPercentage}
                                    onChange={(e) =>
                                        setRules((prev) => ({
                                            ...prev,
                                            maxCeilingPoolPercentage: Number(e.target.value)
                                        }))
                                    }
                                    className="w-16 bg-white border border-neutral-300 rounded px-2 py-0.5 text-right font-mono font-bold"
                                />
                            </div>
                        )}
                    </div>

                    {/* Direct Contribution % */}
                    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/80">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                                Direct Share (Pool)
                            </label>
                            <span className="text-sm font-extrabold font-mono text-emerald-700">
                                {rules.directSharePercentage}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min={30}
                            max={100}
                            step={5}
                            value={rules.directSharePercentage}
                            onChange={(e) => {
                                const direct = Number(e.target.value);
                                const remaining = Math.max(0, 100 - direct - rules.teamDevSharePercentage);
                                setRules((prev) => ({
                                    ...prev,
                                    directSharePercentage: direct,
                                    leadershipSharePercentage: remaining
                                }));
                            }}
                            className="w-full accent-emerald-700 cursor-pointer"
                        />
                        <p className="text-[10px] text-neutral-400 mt-1">
                            Rewards employees directly managing &amp; delivering the tour.
                        </p>
                    </div>

                    {/* Leadership Contribution % */}
                    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/80">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                                Leadership Share
                            </label>
                            <span className="text-sm font-extrabold font-mono text-blue-700">
                                {rules.leadershipSharePercentage}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={60}
                            step={5}
                            value={rules.leadershipSharePercentage}
                            onChange={(e) => {
                                const leadership = Number(e.target.value);
                                const direct = Math.max(0, 100 - leadership - rules.teamDevSharePercentage);
                                setRules((prev) => ({
                                    ...prev,
                                    leadershipSharePercentage: leadership,
                                    directSharePercentage: direct
                                }));
                            }}
                            className="w-full accent-blue-700 cursor-pointer"
                        />
                        <div className="flex items-center justify-between text-[10px] text-neutral-500 mt-1 font-mono">
                            <span>T1: {rules.leadershipTierWeights.tier1}%</span>
                            <span>T2: {rules.leadershipTierWeights.tier2}%</span>
                            <span>T3: {rules.leadershipTierWeights.tier3}%</span>
                        </div>
                    </div>

                    {/* Team Development Share % */}
                    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/80">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                                Team Dev. Incentive
                            </label>
                            <span className="text-sm font-extrabold font-mono text-purple-700">
                                {rules.teamDevSharePercentage}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={15}
                            step={1}
                            value={rules.teamDevSharePercentage}
                            onChange={(e) => {
                                const teamDev = Number(e.target.value);
                                const leadership = Math.max(0, 100 - rules.directSharePercentage - teamDev);
                                setRules((prev) => ({
                                    ...prev,
                                    teamDevSharePercentage: teamDev,
                                    leadershipSharePercentage: leadership
                                }));
                            }}
                            className="w-full accent-purple-700 cursor-pointer"
                        />
                        <p className="text-[10px] text-neutral-400 mt-1">
                            Rewards mentors whose junior Agents run independent tours.
                        </p>
                    </div>

                    {/* Performance Multipliers */}
                    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/80">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block mb-2">
                            Performance Multipliers
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                            <div className="flex items-center justify-between bg-white px-2 py-1 rounded border border-neutral-200">
                                <span className="text-[10px] text-neutral-500">Below:</span>
                                <input
                                    type="number"
                                    step={0.1}
                                    min={0}
                                    max={1}
                                    value={rules.performanceMultipliers.below}
                                    onChange={(e) =>
                                        setRules((prev) => ({
                                            ...prev,
                                            performanceMultipliers: {
                                                ...prev.performanceMultipliers,
                                                below: Number(e.target.value)
                                            }
                                        }))
                                    }
                                    className="w-10 text-right font-bold outline-none"
                                />
                            </div>
                            <div className="flex items-center justify-between bg-white px-2 py-1 rounded border border-neutral-200">
                                <span className="text-[10px] text-neutral-500">Meets:</span>
                                <input
                                    type="number"
                                    step={0.1}
                                    min={0.5}
                                    max={1.5}
                                    value={rules.performanceMultipliers.meets}
                                    onChange={(e) =>
                                        setRules((prev) => ({
                                            ...prev,
                                            performanceMultipliers: {
                                                ...prev.performanceMultipliers,
                                                meets: Number(e.target.value)
                                            }
                                        }))
                                    }
                                    className="w-10 text-right font-bold outline-none"
                                />
                            </div>
                            <div className="flex items-center justify-between bg-white px-2 py-1 rounded border border-neutral-200">
                                <span className="text-[10px] text-neutral-500">Exceeds:</span>
                                <input
                                    type="number"
                                    step={0.1}
                                    min={1}
                                    max={2}
                                    value={rules.performanceMultipliers.exceeds}
                                    onChange={(e) =>
                                        setRules((prev) => ({
                                            ...prev,
                                            performanceMultipliers: {
                                                ...prev.performanceMultipliers,
                                                exceeds: Number(e.target.value)
                                            }
                                        }))
                                    }
                                    className="w-10 text-right font-bold outline-none"
                                />
                            </div>
                            <div className="flex items-center justify-between bg-white px-2 py-1 rounded border border-neutral-200">
                                <span className="text-[10px] text-neutral-500">Except.:</span>
                                <input
                                    type="number"
                                    step={0.1}
                                    min={1}
                                    max={2.5}
                                    value={rules.performanceMultipliers.exceptional}
                                    onChange={(e) =>
                                        setRules((prev) => ({
                                            ...prev,
                                            performanceMultipliers: {
                                                ...prev.performanceMultipliers,
                                                exceptional: Number(e.target.value)
                                            }
                                        }))
                                    }
                                    className="w-10 text-right font-bold outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Per-Role / Per-Agent Maximum Commission Cap Control Bar */}
                <div className="mt-4 pt-4 border-t border-neutral-100">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 text-xs font-bold text-brand-charcoal cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rules.enablePerEmployeeCap}
                                    onChange={(e) =>
                                        setRules((prev) => ({
                                            ...prev,
                                            enablePerEmployeeCap: e.target.checked
                                        }))
                                    }
                                    className="accent-brand-gold w-4 h-4"
                                />
                                Enforce Per-Role / Per-Agent Maximum Payout Cap (USD per Tour)
                            </label>
                            <span className="text-[11px] text-neutral-400">
                                Prevents unlimited payouts on mega-tours; any excess above an employee&apos;s cap returns to Nilathra Collection.
                            </span>
                        </div>
                    </div>

                    {rules.enablePerEmployeeCap && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                            {ROLE_OPTIONS.map((ro) => (
                                <div
                                    key={ro.value}
                                    className="bg-neutral-50 rounded-xl px-3 py-2 border border-neutral-200/80 flex flex-col justify-between"
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 truncate">
                                        {ROLE_SHORT_LABELS[ro.value] || ro.label}
                                    </span>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs font-mono text-neutral-400">$</span>
                                        <input
                                            type="number"
                                            min={0}
                                            step={25}
                                            value={rules.roleMaxCapUsd[ro.value] ?? 0}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setRules((prev) => ({
                                                    ...prev,
                                                    roleMaxCapUsd: {
                                                        ...prev.roleMaxCapUsd,
                                                        [ro.value]: val
                                                    }
                                                }));
                                            }}
                                            className="w-20 bg-white border border-neutral-200 rounded px-1.5 py-0.5 text-right font-mono text-xs font-extrabold text-brand-charcoal"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* TAB 1: SINGLE TOUR INTERACTIVE SANDBOX */}
            {activeTab === "sandbox" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Inputs (5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* 1. Tour Financial Input & Declared Gross Profit Card */}
                        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-5">
                            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                                <h3 className="text-sm font-bold text-brand-charcoal flex items-center gap-2">
                                    <DollarSign size={16} className="text-brand-gold" />
                                    1. Tour Financials &amp; Declared Gross Profit
                                </h3>
                                <div className="flex gap-1.5">
                                    {(["A", "B", "C"] as const).map((sc) => (
                                        <button
                                            key={sc}
                                            onClick={() => handleSelectScenarioPreset(sc)}
                                            className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-all ${
                                                !selectedTourId && tourLabel.includes(`Scenario ${sc}`)
                                                    ? "bg-brand-gold text-white border-brand-gold"
                                                    : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                                            }`}
                                        >
                                            Scenario {sc} ({sc === "A" ? "$5k" : sc === "B" ? "$15k" : "$30k"})
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Optional Real Tour Selector */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                                    Or Load Real Nilathra Tour (Read-Only Reference)
                                </label>
                                <select
                                    value={selectedTourId}
                                    onChange={(e) => handleSelectRealTour(e.target.value)}
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-brand-charcoal outline-none focus:border-brand-gold"
                                >
                                    <option value="">-- Using Custom / Preset Scenario --</option>
                                    {realTours.map((t) => (
                                        <option key={t.tourId} value={t.tourId}>
                                            {t.tourCode ? `[${t.tourCode}] ` : ""}
                                            {t.title} ({t.status}) — Agent: {t.agentName}
                                        </option>
                                    ))}
                                </select>
                                {selectedRealTourObj && (
                                    <div className="mt-2 p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-[11px] space-y-1 font-mono">
                                        <div className="flex justify-between">
                                            <span className="text-neutral-500">System Invoiced / Agreed Margin:</span>
                                            <span className="font-bold text-brand-charcoal">
                                                ${selectedRealTourObj.systemAgreedGrossProfitUsd.toLocaleString()} (Rev $
                                                {selectedRealTourObj.systemAgreedRevenueUsd.toLocaleString()} − POs $
                                                {selectedRealTourObj.systemAgreedCostUsd.toLocaleString()})
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-neutral-500">System Reconciled Cash Margin:</span>
                                            <span className="font-bold text-emerald-700">
                                                ${selectedRealTourObj.systemReconciledGrossProfitUsd.toLocaleString()} (Paid $
                                                {selectedRealTourObj.systemReconciledPaidRevenueUsd.toLocaleString()} − Out $
                                                {(
                                                    selectedRealTourObj.systemReconciledPaidCostUsd +
                                                    selectedRealTourObj.systemReconciledMiscExpensesUsd
                                                ).toLocaleString()}
                                                )
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Reference Revenue & System Expenses */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                                        Customer Revenue (USD)
                                    </label>
                                    <input
                                        type="number"
                                        value={customerRevenueUsd}
                                        onChange={(e) => setCustomerRevenueUsd(Number(e.target.value))}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-brand-charcoal"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                                        System-Visible Costs (USD)
                                    </label>
                                    <input
                                        type="number"
                                        value={systemDirectExpensesUsd}
                                        onChange={(e) => setSystemDirectExpensesUsd(Number(e.target.value))}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-brand-charcoal"
                                    />
                                </div>
                            </div>

                            {/* Authoritative Admin-Entered Declared Gross Profit */}
                            <div className="p-4 rounded-2xl bg-emerald-50/60 border-2 border-emerald-600/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 block">
                                            Declared Gross Profit for Commission (USD)
                                        </span>
                                        <span className="text-[10px] text-emerald-700">
                                            Admin/Finance entered value (accounts for offline/unrecorded costs)
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDeclaredGrossProfitUsd(
                                                Math.max(0, customerRevenueUsd - systemDirectExpensesUsd)
                                            )
                                        }
                                        className="text-[10px] font-bold text-emerald-800 bg-white border border-emerald-300 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
                                    >
                                        Copy System Margin ($
                                        {(customerRevenueUsd - systemDirectExpensesUsd).toLocaleString()})
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-3 items-center">
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            value={declaredGrossProfitUsd}
                                            onChange={(e) => setDeclaredGrossProfitUsd(Number(e.target.value))}
                                            className="w-full bg-white border-2 border-emerald-600/40 rounded-xl px-3 py-2.5 text-lg font-mono font-extrabold text-emerald-950 focus:outline-none focus:border-emerald-700"
                                        />
                                    </div>
                                    <div className="text-right font-mono">
                                        <span className="text-[10px] text-neutral-500 block">FX Rate (LKR/USD)</span>
                                        <input
                                            type="number"
                                            value={exchangeRateLkr}
                                            onChange={(e) => setExchangeRateLkr(Number(e.target.value))}
                                            className="w-full bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-xs font-bold text-right"
                                        />
                                    </div>
                                </div>

                                <input
                                    type="text"
                                    value={declaredGrossProfitNotes}
                                    onChange={(e) => setDeclaredGrossProfitNotes(e.target.value)}
                                    placeholder="Audit note for declared Gross Profit (e.g. bank fees / offline expenses deducted)..."
                                    className="w-full bg-white/90 border border-emerald-200 rounded-lg px-3 py-1.5 text-xs text-neutral-700 outline-none"
                                />
                            </div>

                            {/* Completion & Cancellation Status Gates */}
                            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
                                <label className="flex items-center gap-2 font-bold text-neutral-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isTourCompleted}
                                        onChange={(e) => setIsTourCompleted(e.target.checked)}
                                        className="accent-emerald-700 w-4 h-4"
                                    />
                                    Tour Completed &amp; Reconciled
                                </label>
                                <label className="flex items-center gap-2 font-bold text-red-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isCancelled}
                                        onChange={(e) => setIsCancelled(e.target.checked)}
                                        className="accent-red-600 w-4 h-4"
                                    />
                                    Tour Cancelled
                                </label>
                            </div>
                        </div>

                        {/* 2. Organisational Structure & Contributors Card */}
                        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-5">
                            <div className="border-b border-neutral-100 pb-3">
                                <h3 className="text-sm font-bold text-brand-charcoal flex items-center gap-2">
                                    <Users size={16} className="text-brand-gold" />
                                    2. Organisational Structure &amp; Contributors
                                </h3>
                                <p className="text-[11px] text-neutral-400 mt-0.5">
                                    Choose one of the 5 test structures or customize employees, shares, and active supervision gates.
                                </p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                                    Preset Organisational Structure (Section 14)
                                </label>
                                <select
                                    value={selectedPreset}
                                    onChange={(e) =>
                                        handleSelectOrgStructure(e.target.value as SimulationOrgPresetKey)
                                    }
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-brand-charcoal outline-none"
                                >
                                    <option value="solo_agent">1. Solo Agent Managing a Tour Independently</option>
                                    <option value="agent_under_senior">2. Agent Managing a Tour Under a Senior Agent</option>
                                    <option value="senior_with_junior">
                                        3. Senior Agent Managing a Tour with Junior Support
                                    </option>
                                    <option value="exec_multi_team">
                                        4. Executive Agent Managing Multiple Employees
                                    </option>
                                    <option value="multi_supervisor_chain">
                                        5. Tour Involving Multiple Supervisors (Full Chain)
                                    </option>
                                </select>
                            </div>

                            {/* Direct Contributors List */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                                        Direct Tour Contributors (Must Sum to 100%)
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDirectContributors((prev) => [
                                                ...prev,
                                                {
                                                    id: `custom-direct-${Date.now()}`,
                                                    name: "Additional Agent",
                                                    role: "agent",
                                                    roleLabel: "Agent",
                                                    sharePercentage: 0,
                                                    ratingTier: "meets"
                                                }
                                            ])
                                        }
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
                                    >
                                        <Plus size={12} /> Add Contributor
                                    </button>
                                </div>

                                {directContributors.map((c, idx) => (
                                    <div
                                        key={c.id + idx}
                                        className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <input
                                                type="text"
                                                value={c.name}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setDirectContributors((prev) =>
                                                        prev.map((item, i) =>
                                                            i === idx ? { ...item, name: val } : item
                                                        )
                                                    );
                                                }}
                                                className="bg-white border border-neutral-200 rounded-lg px-2.5 py-1 text-xs font-bold text-brand-charcoal flex-1"
                                            />
                                            <select
                                                value={c.role}
                                                onChange={(e) => {
                                                    const role = e.target.value;
                                                    setDirectContributors((prev) =>
                                                        prev.map((item, i) =>
                                                            i === idx
                                                                ? {
                                                                      ...item,
                                                                      role,
                                                                      roleLabel: ROLE_SHORT_LABELS[role] || role
                                                                  }
                                                                : item
                                                        )
                                                    );
                                                }}
                                                className="bg-white border border-neutral-200 rounded-lg px-2 py-1 text-[11px] font-medium"
                                            >
                                                {ROLE_OPTIONS.map((ro) => (
                                                    <option key={ro.value} value={ro.value}>
                                                        {ro.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {directContributors.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setDirectContributors((prev) =>
                                                            prev.filter((_, i) => i !== idx)
                                                        )
                                                    }
                                                    className="text-neutral-400 hover:text-red-600 p-1"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 items-center text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-bold text-neutral-500">Share %:</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={c.sharePercentage}
                                                    onChange={(e) => {
                                                        const pct = Number(e.target.value);
                                                        setDirectContributors((prev) =>
                                                            prev.map((item, i) =>
                                                                i === idx ? { ...item, sharePercentage: pct } : item
                                                            )
                                                        );
                                                    }}
                                                    className="w-14 bg-white border border-neutral-200 rounded px-1.5 py-1 font-mono font-bold text-right"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] font-bold text-neutral-500" title="Custom Max USD Cap for this person (leave empty to use Role Cap)">
                                                    Cap $:
                                                </span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step={25}
                                                    placeholder={
                                                        rules.enablePerEmployeeCap
                                                            ? String(rules.roleMaxCapUsd[c.role] ?? "")
                                                            : "No cap"
                                                    }
                                                    value={c.maxCapUsd ?? ""}
                                                    onChange={(e) => {
                                                        const raw = e.target.value;
                                                        const capVal = raw === "" ? null : Number(raw);
                                                        setDirectContributors((prev) =>
                                                            prev.map((item, i) =>
                                                                i === idx ? { ...item, maxCapUsd: capVal } : item
                                                            )
                                                        );
                                                    }}
                                                    className="w-16 bg-white border border-neutral-200 rounded px-1.5 py-1 font-mono font-bold text-right"
                                                />
                                            </div>
                                            <div className="flex items-center justify-end gap-1">
                                                <select
                                                    value={c.ratingTier}
                                                    onChange={(e) => {
                                                        const tier = e.target.value as PerformanceRatingTier;
                                                        setDirectContributors((prev) =>
                                                            prev.map((item, i) =>
                                                                i === idx ? { ...item, ratingTier: tier } : item
                                                            )
                                                        );
                                                    }}
                                                    className="bg-white border border-neutral-200 rounded px-1.5 py-1 text-[11px] font-bold"
                                                >
                                                    <option value="below">
                                                        Below ({rules.performanceMultipliers.below}x)
                                                    </option>
                                                    <option value="meets">
                                                        Meets ({rules.performanceMultipliers.meets}x)
                                                    </option>
                                                    <option value="exceeds">
                                                        Exceeds ({rules.performanceMultipliers.exceeds}x)
                                                    </option>
                                                    <option value="exceptional">
                                                        Exceptional ({rules.performanceMultipliers.exceptional}x)
                                                    </option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Leadership Chain List */}
                            <div className="space-y-3 pt-3 border-t border-neutral-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                                        Reporting Chain / Leadership Eligibility
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setLeadershipChain((prev) => [
                                                ...prev,
                                                {
                                                    id: `custom-leader-${Date.now()}`,
                                                    name: "Reporting Supervisor",
                                                    role: "agent_supervisor",
                                                    roleLabel: "Supervisor",
                                                    tier: (Math.min(3, prev.length + 1) as 1 | 2 | 3),
                                                    hasActiveContribution: true,
                                                    contributionEvidence: "Active team supervision & QA review",
                                                    ratingTier: "meets"
                                                }
                                            ])
                                        }
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900"
                                    >
                                        <Plus size={12} /> Add Leader
                                    </button>
                                </div>

                                {leadershipChain.length === 0 ? (
                                    <div className="p-3 rounded-xl bg-neutral-50 border border-dashed border-neutral-200 text-xs text-neutral-500 text-center">
                                        No eligible leaders in chain — 100% of the Leadership Pool returns to Nilathra Collection.
                                    </div>
                                ) : (
                                    leadershipChain.map((leader, idx) => (
                                        <div
                                            key={leader.id + idx}
                                            className="p-3 rounded-xl bg-blue-50/30 border border-blue-200/70 space-y-2"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <input
                                                    type="text"
                                                    value={leader.name}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setLeadershipChain((prev) =>
                                                            prev.map((item, i) =>
                                                                i === idx ? { ...item, name: val } : item
                                                            )
                                                        );
                                                    }}
                                                    className="bg-white border border-neutral-200 rounded-lg px-2.5 py-1 text-xs font-bold text-brand-charcoal flex-1"
                                                />
                                                <select
                                                    value={leader.tier}
                                                    onChange={(e) => {
                                                        const tier = Number(e.target.value) as 1 | 2 | 3;
                                                        setLeadershipChain((prev) =>
                                                            prev.map((item, i) =>
                                                                i === idx ? { ...item, tier } : item
                                                            )
                                                        );
                                                    }}
                                                    className="bg-white border border-neutral-200 rounded-lg px-2 py-1 text-[11px] font-bold text-blue-900"
                                                >
                                                    <option value={1}>
                                                        Tier 1 ({rules.leadershipTierWeights.tier1}%)
                                                    </option>
                                                    <option value={2}>
                                                        Tier 2 ({rules.leadershipTierWeights.tier2}%)
                                                    </option>
                                                    <option value={3}>
                                                        Tier 3 ({rules.leadershipTierWeights.tier3}%)
                                                    </option>
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setLeadershipChain((prev) =>
                                                            prev.filter((_, i) => i !== idx)
                                                        )
                                                    }
                                                    className="text-neutral-400 hover:text-red-600 p-1"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                                <label className="flex items-center gap-1.5 font-medium text-neutral-700 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={leader.hasActiveContribution}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            setLeadershipChain((prev) =>
                                                                prev.map((item, i) =>
                                                                    i === idx
                                                                        ? { ...item, hasActiveContribution: checked }
                                                                        : item
                                                                )
                                                            );
                                                        }}
                                                        className="accent-blue-700"
                                                    />
                                                    <span className="text-[11px]">
                                                        Active Mentoring / Sign-Off
                                                    </span>
                                                </label>

                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] font-bold text-neutral-500" title="Custom Max USD Cap for this leader (leave empty to use Role Cap)">
                                                            Cap $:
                                                        </span>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            step={25}
                                                            placeholder={
                                                                rules.enablePerEmployeeCap
                                                                    ? String(rules.roleMaxCapUsd[leader.role] ?? "")
                                                                    : "No cap"
                                                            }
                                                            value={leader.maxCapUsd ?? ""}
                                                            onChange={(e) => {
                                                                const raw = e.target.value;
                                                                const capVal = raw === "" ? null : Number(raw);
                                                                setLeadershipChain((prev) =>
                                                                    prev.map((item, i) =>
                                                                        i === idx ? { ...item, maxCapUsd: capVal } : item
                                                                    )
                                                                );
                                                            }}
                                                            className="w-16 bg-white border border-neutral-200 rounded px-1.5 py-0.5 font-mono font-bold text-right"
                                                        />
                                                    </div>

                                                    <select
                                                        value={leader.ratingTier}
                                                        onChange={(e) => {
                                                            const tier = e.target.value as PerformanceRatingTier;
                                                            setLeadershipChain((prev) =>
                                                                prev.map((item, i) =>
                                                                    i === idx ? { ...item, ratingTier: tier } : item
                                                                )
                                                            );
                                                        }}
                                                        className="bg-white border border-neutral-200 rounded px-2 py-0.5 text-[11px] font-bold"
                                                    >
                                                        <option value="below">
                                                            Below ({rules.performanceMultipliers.below}x)
                                                        </option>
                                                        <option value="meets">
                                                            Meets ({rules.performanceMultipliers.meets}x)
                                                        </option>
                                                        <option value="exceeds">
                                                            Exceeds ({rules.performanceMultipliers.exceeds}x)
                                                        </option>
                                                        <option value="exceptional">
                                                            Exceptional ({rules.performanceMultipliers.exceptional}x)
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Live Calculation & Distribution Output (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Status & Pool Cap Verification Banner */}
                        <div
                            className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
                                simulationResult.status === "Not Eligible"
                                    ? "bg-red-50 border-red-200 text-red-900"
                                    : simulationResult.isWithinPoolCap
                                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                                      : "bg-amber-50 border-amber-200 text-amber-900"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                {simulationResult.status === "Not Eligible" ? (
                                    <AlertTriangle className="text-red-600 shrink-0" size={22} />
                                ) : (
                                    <ShieldCheck className="text-emerald-700 shrink-0" size={22} />
                                )}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-extrabold uppercase tracking-wider">
                                            Commission Status: {simulationResult.status}
                                        </span>
                                        {simulationResult.isWithinPoolCap &&
                                            simulationResult.status === "Calculated" && (
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-bold">
                                                    Pool Ceiling Verified ({simulationResult.poolUtilizationPct}% Used)
                                                </span>
                                            )}
                                    </div>
                                    <p className="text-xs opacity-80 mt-0.5">
                                        {simulationResult.ineligibilityReason ||
                                            `Total distributed ($${simulationResult.totalCommissionDistributedUsd.toLocaleString()}) is strictly within the available Commission Pool ceiling ($${simulationResult.hardCapCeilingPoolUsd.toLocaleString()}).`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {simulationResult.validationWarnings.length > 0 && (
                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                                {simulationResult.validationWarnings.map((w, idx) => (
                                    <p key={idx} className="text-xs font-bold text-amber-800 flex items-center gap-2">
                                        <AlertTriangle size={14} /> {w}
                                    </p>
                                ))}
                            </div>
                        )}

                        {/* Top 4 Financial Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                                    Declared Gross Profit
                                </span>
                                <span className="text-2xl font-extrabold font-mono text-brand-charcoal mt-1 block">
                                    ${simulationResult.effectiveGrossProfitUsd.toLocaleString()}
                                </span>
                                <span className="text-[11px] text-neutral-500 font-mono">
                                    LKR{" "}
                                    {(
                                        simulationResult.effectiveGrossProfitUsd * simulationResult.exchangeRateLkr
                                    ).toLocaleString()}
                                </span>
                            </div>

                            <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                                    Commission Pool ({rules.poolPercentage}% GP)
                                </span>
                                <span className="text-2xl font-extrabold font-mono text-brand-gold mt-1 block">
                                    ${simulationResult.baseCommissionPoolUsd.toLocaleString()}
                                </span>
                                <span className="text-[11px] text-neutral-500 font-mono block">
                                    Direct: ${simulationResult.directSubPoolUsd.toLocaleString()} · Lead: $
                                    {simulationResult.leadershipSubPoolUsd.toLocaleString()}
                                </span>
                            </div>

                            <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                                    Total Staff Payout
                                </span>
                                <span className="text-2xl font-extrabold font-mono text-emerald-700 mt-1 block">
                                    ${simulationResult.totalCommissionDistributedUsd.toLocaleString()}
                                </span>
                                <span className="text-[11px] text-neutral-500 font-mono block">
                                    LKR {simulationResult.totalCommissionDistributedLkr.toLocaleString()}
                                </span>
                            </div>

                            <div className="bg-brand-charcoal text-white rounded-2xl p-4 shadow-xs">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold block">
                                    Nilathra Retained GP ({simulationResult.companyRetainedShareOfGpPct}%)
                                </span>
                                <span className="text-2xl font-extrabold font-mono text-white mt-1 block">
                                    ${simulationResult.companyRetainedGrossProfitUsd.toLocaleString()}
                                </span>
                                <span className="text-[11px] text-neutral-300 font-mono block">
                                    +${simulationResult.unallocatedPoolReturnedToCompanyUsd.toLocaleString()} returned
                                    {simulationResult.totalCappedExcessReturnedUsd > 0
                                        ? ` (incl. $${simulationResult.totalCappedExcessReturnedUsd.toLocaleString()} cap excess)`
                                        : ""}
                                </span>
                            </div>
                        </div>

                        {/* Individual Employee Allocation Breakdown Table */}
                        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
                            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-brand-charcoal">
                                        Individual Employee Commission Breakdown
                                    </h3>
                                    <p className="text-[11px] text-neutral-400">
                                        Transparent per-person calculation showing base share, performance multiplier, role/employee cap, and eligibility gate status.
                                    </p>
                                </div>
                                <span className="text-xs font-mono font-bold text-neutral-500">
                                    1 USD = LKR {simulationResult.exchangeRateLkr}
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider text-[10px] font-bold border-b border-neutral-200">
                                        <tr>
                                            <th className="px-5 py-3">Employee &amp; Role</th>
                                            <th className="px-4 py-3">Category</th>
                                            <th className="px-4 py-3 text-right">Sub-Pool %</th>
                                            <th className="px-4 py-3 text-center">Multiplier</th>
                                            <th className="px-4 py-3 text-right">Max Cap</th>
                                            <th className="px-4 py-3 text-right">Payout (USD)</th>
                                            <th className="px-4 py-3 text-right">Payout (LKR)</th>
                                            <th className="px-5 py-3">Audit &amp; Eligibility</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {simulationResult.allocations.map((alloc, i) => (
                                            <tr key={alloc.recipientId + i} className="hover:bg-neutral-50/60">
                                                <td className="px-5 py-3.5">
                                                    <p className="font-bold text-brand-charcoal">
                                                        {alloc.recipientName}
                                                    </p>
                                                    <span className="text-[10px] text-neutral-500">
                                                        {alloc.roleLabel}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span
                                                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            alloc.allocationType === "DIRECT"
                                                                ? "bg-emerald-100 text-emerald-800"
                                                                : alloc.allocationType === "TEAM_DEVELOPMENT"
                                                                  ? "bg-purple-100 text-purple-800"
                                                                  : "bg-blue-100 text-blue-800"
                                                        }`}
                                                    >
                                                        {alloc.allocationType.replace(/_/g, " ")}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-mono font-bold">
                                                    {alloc.sharePercentageOfSubPool}%
                                                </td>
                                                <td className="px-4 py-3.5 text-center font-mono">
                                                    <span className="px-2 py-0.5 rounded bg-neutral-100 font-bold">
                                                        {alloc.appliedMultiplier.toFixed(2)}x
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-mono text-neutral-600">
                                                    {alloc.appliedCapUsd !== null ? (
                                                        <span className="font-bold text-brand-charcoal">
                                                            ${alloc.appliedCapUsd.toFixed(0)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-neutral-400">Uncapped</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-mono font-extrabold text-brand-charcoal">
                                                    <div>${alloc.finalAmountUsd.toFixed(2)}</div>
                                                    {alloc.cappedExcessReturnedUsd > 0 && (
                                                        <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded mt-0.5">
                                                            Capped (−${alloc.cappedExcessReturnedUsd.toFixed(2)})
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-mono text-neutral-600">
                                                    LKR {alloc.finalAmountLkr.toLocaleString()}
                                                </td>
                                                <td className="px-5 py-3.5 max-w-xs">
                                                    <span
                                                        className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase mr-1.5 ${
                                                            alloc.eligibilityStatus === "ELIGIBLE"
                                                                ? "bg-green-100 text-green-800"
                                                                : alloc.eligibilityStatus === "OVERRIDE_APPLIED"
                                                                  ? "bg-amber-100 text-amber-800"
                                                                  : "bg-red-100 text-red-700"
                                                        }`}
                                                    >
                                                        {alloc.eligibilityStatus.replace(/_/g, " ")}
                                                    </span>
                                                    <span className="text-[11px] text-neutral-500">{alloc.notes}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Unallocated Leadership / Reserve Returned to Company Row */}
                                        <tr className="bg-neutral-50/80 font-medium">
                                            <td className="px-5 py-3 text-neutral-700 font-bold" colSpan={5}>
                                                Unallocated / Capped Excess Returned to Nilathra Collection
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-emerald-800">
                                                ${simulationResult.unallocatedPoolReturnedToCompanyUsd.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-emerald-800">
                                                LKR{" "}
                                                {(
                                                    simulationResult.unallocatedPoolReturnedToCompanyUsd *
                                                    simulationResult.exchangeRateLkr
                                                ).toLocaleString()}
                                            </td>
                                            <td className="px-5 py-3 text-[11px] text-neutral-500">
                                                Unclaimed leadership tiers return to the company (never paid passively).
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: 15-SCENARIO VALIDATION MATRIX */}
            {activeTab === "matrix" && (
                <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden space-y-4">
                    <div className="p-6 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold font-playfair text-brand-charcoal">
                                15-Scenario Financial Validation Matrix (Section 14)
                            </h3>
                            <p className="text-xs text-neutral-500">
                                Live comparison across Scenarios A ($5,000), B ($15,000), and C ($30,000) and all 5 Organisational Structures using your active rule sliders above.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 bg-neutral-50 px-4 py-2 rounded-xl border border-neutral-200 text-xs">
                            <span className="font-bold text-neutral-600">Assumed Declared Gross Margin %:</span>
                            <input
                                type="number"
                                min={5}
                                max={60}
                                value={matrixMarginPct}
                                onChange={(e) => setMatrixMarginPct(Number(e.target.value))}
                                className="w-16 bg-white border border-neutral-300 rounded px-2 py-1 font-mono font-bold text-right"
                            />
                            <span className="font-bold text-neutral-500">%</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider text-[10px] font-bold border-b border-neutral-200">
                                <tr>
                                    <th className="px-5 py-3.5">Scenario</th>
                                    <th className="px-4 py-3.5">Organisational Structure</th>
                                    <th className="px-4 py-3.5 text-right">Revenue</th>
                                    <th className="px-4 py-3.5 text-right">Declared GP</th>
                                    <th className="px-4 py-3.5 text-right">Pool ({rules.poolPercentage}%)</th>
                                    <th className="px-4 py-3.5 text-right">Direct Paid</th>
                                    <th className="px-4 py-3.5 text-right">Leadership Paid</th>
                                    <th className="px-4 py-3.5 text-right">Returned to Co.</th>
                                    <th className="px-4 py-3.5 text-right">Total Paid</th>
                                    <th className="px-5 py-3.5 text-right">Company Retained GP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 font-mono">
                                {validationMatrix.map((row, idx) => (
                                    <tr key={row.scenarioCode + row.structureKey + idx} className="hover:bg-neutral-50/80">
                                        <td className="px-5 py-3 font-sans font-bold text-brand-charcoal">
                                            {row.scenarioLabel}
                                        </td>
                                        <td className="px-4 py-3 font-sans font-medium text-neutral-700">
                                            {row.structureLabel}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            ${row.result.customerRevenueUsd.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-brand-charcoal">
                                            ${row.result.effectiveGrossProfitUsd.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right text-brand-gold font-bold">
                                            ${row.result.baseCommissionPoolUsd.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-emerald-700">
                                            ${row.result.totalDirectDistributedUsd.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-blue-700">
                                            ${row.result.totalLeadershipDistributedUsd.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-neutral-500">
                                            ${row.result.unallocatedPoolReturnedToCompanyUsd.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-extrabold text-emerald-800">
                                            ${row.result.totalCommissionDistributedUsd.toFixed(2)}
                                        </td>
                                        <td className="px-5 py-3 text-right font-extrabold text-brand-charcoal">
                                            ${row.result.companyRetainedGrossProfitUsd.toFixed(2)}{" "}
                                            <span className="text-[10px] text-neutral-400 font-normal">
                                                ({row.result.companyRetainedShareOfGpPct}%)
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 3: CAREER EARNINGS POTENTIAL & PROGRESSION PREVIEW */}
            {activeTab === "career" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-5 bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
                        <h3 className="text-base font-bold text-brand-charcoal flex items-center gap-2 border-b border-neutral-100 pb-3">
                            <Award size={18} className="text-brand-gold" />
                            Employee Career Progression Inputs
                        </h3>

                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                                Current Designation
                            </label>
                            <select
                                value={careerRole}
                                onChange={(e) => setCareerRole(e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-brand-charcoal"
                            >
                                {ROLE_OPTIONS.map((ro) => (
                                    <option key={ro.value} value={ro.value}>
                                        {ro.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                                    Tours Completed
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    value={careerToursCompleted}
                                    onChange={(e) => setCareerToursCompleted(Number(e.target.value))}
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                                    Cumulative GP Generated ($)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    step={500}
                                    value={careerCumulativeGpUsd}
                                    onChange={(e) => setCareerCumulativeGpUsd(Number(e.target.value))}
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                                    Personal Comm ($)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    value={careerPersonalCommUsd}
                                    onChange={(e) => setCareerPersonalCommUsd(Number(e.target.value))}
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                                    Leadership ($)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    value={careerLeadershipCommUsd}
                                    onChange={(e) => setCareerLeadershipCommUsd(Number(e.target.value))}
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                                    Mentored Agents
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    value={careerMenteesCount}
                                    onChange={(e) => setCareerMenteesCount(Number(e.target.value))}
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Employee Dashboard Preview Card */}
                    <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200 p-8 shadow-xs space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 pb-5">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold block">
                                    Employee Dashboard Preview — Career Earnings Potential
                                </span>
                                <h3 className="text-2xl font-bold font-playfair text-brand-charcoal mt-1">
                                    {careerPreview.currentDesignation} &rarr; {careerPreview.nextDesignation}
                                </h3>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-neutral-400 block">Progress to Next Designation</span>
                                <span className="text-3xl font-extrabold font-mono text-emerald-700">
                                    {careerPreview.overallProgressPct}%
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-brand-gold to-emerald-600 transition-all duration-300"
                                    style={{ width: `${Math.min(100, careerPreview.overallProgressPct)}%` }}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-xs pt-2">
                                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                                        Tours Completed
                                    </span>
                                    <span className="font-mono font-bold text-sm text-brand-charcoal">
                                        {careerPreview.toursCompleted} / {careerPreview.targetToursForNextLevel}
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                                        Gross Profit Generated
                                    </span>
                                    <span className="font-mono font-bold text-sm text-brand-charcoal">
                                        ${careerPreview.cumulativeGrossProfitUsd.toLocaleString()} / $
                                        {careerPreview.targetGrossProfitUsd.toLocaleString()}
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                                        Mentored Independent Agents
                                    </span>
                                    <span className="font-mono font-bold text-sm text-brand-charcoal">
                                        {careerPreview.mentoredAgentsCount} / {careerPreview.targetMentoredAgentsCount}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Variable Commission Earnings Summary Table */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                                    Current Variable Commission Earnings
                                </span>
                                <div className="flex justify-between text-xs">
                                    <span className="text-neutral-600">Personal Direct Commission:</span>
                                    <span className="font-mono font-bold">
                                        ${careerPreview.personalCommissionUsd.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-neutral-600">Leadership Incentives:</span>
                                    <span className="font-mono font-bold">
                                        ${careerPreview.leadershipIncentivesUsd.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm font-extrabold border-t border-neutral-200 pt-2 text-brand-charcoal">
                                    <span>Total Variable Earnings:</span>
                                    <span className="font-mono text-emerald-700">
                                        ${careerPreview.totalVariableEarningsUsd.toLocaleString()} (LKR{" "}
                                        {careerPreview.totalVariableEarningsLkr.toLocaleString()})
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-brand-charcoal text-white space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold block">
                                    Projected Earnings at {careerPreview.nextDesignation}
                                </span>
                                <p className="text-2xl font-extrabold font-mono text-white">
                                    ${careerPreview.projectedNextLevelAnnualUsd.toLocaleString()}
                                </p>
                                <p className="text-[11px] text-neutral-300">
                                    Includes higher complex-tour allocation capacity, active mentoring leadership shares, and Team Development incentives (kept strictly separate from base salary).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

