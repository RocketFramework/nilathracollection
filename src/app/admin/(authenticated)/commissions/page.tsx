"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    Award,
    Briefcase,
    Calculator,
    CheckCircle2,
    Clock,
    DollarSign,
    FileCheck,
    Filter,
    History,
    Layers,
    Plus,
    RefreshCw,
    Save,
    Settings,
    ShieldCheck,
    Sliders,
    Trash2,
    TrendingUp,
    Users,
    AlertTriangle
} from "lucide-react";
import {
    getCommissionWorkspaceInitialDataAction,
    publishNewCommissionRuleVersionAction,
    saveTourCommissionAction
} from "@/actions/commission.actions";
import { CommissionSimulationService } from "@/services/commission-simulation.service";
import { CommissionService } from "@/services/commission.service";
import {
    ICommissionContributorInput,
    ICommissionLeaderInput,
    ICommissionRuleConfig,
    ICommissionRuleVersionRecord,
    IEmployeeHierarchyNode,
    ITourCommissionRecord,
    ITourFinancialReference
} from "@/other/interfaces";
import { CommissionStatus, PerformanceRatingTier } from "@/types/types";

const ROLE_DISPLAY_NAMES: Record<string, string> = {
    agent: "Agent",
    senior_agent: "Senior Agent",
    executive_agent: "Executive Agent",
    agent_supervisor: "Supervisor",
    senior_supervisor: "Senior Supervisor",
    executive_supervisor: "Executive Supervisor",
    principal_supervisor: "Principal SPOC",
    admin: "Admin",
    finance: "Finance Staff"
};

const ROLE_OPTIONS = [
    { value: "agent", label: "Level 1: Agent" },
    { value: "senior_agent", label: "Level 2: Senior Agent" },
    { value: "executive_agent", label: "Level 3: Executive Agent" },
    { value: "agent_supervisor", label: "Level 4: Supervisor" },
    { value: "senior_supervisor", label: "Level 5: Senior Supervisor" },
    { value: "executive_supervisor", label: "Level 6: Executive Supervisor" },
    { value: "principal_supervisor", label: "Level 7: Principal SPOC" }
];

const STATUS_OPTIONS: CommissionStatus[] = [
    "Not Eligible",
    "Calculated",
    "Pending Approval",
    "Approved",
    "Paid",
    "Disputed",
    "Cancelled"
];

export default function CommissionManagementPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [activeTab, setActiveTab] = useState<"workspace" | "employee" | "management" | "rules">("employee");

    // Workspace State
    const [currentUser, setCurrentUser] = useState<{
        id: string;
        name: string;
        email: string;
        role: string;
        roleLabel: string;
        isAdminOrFinance: boolean;
    } | null>(null);

    const [activeRuleVersion, setActiveRuleVersion] = useState<ICommissionRuleVersionRecord>(
        CommissionService.getDefaultInitialRuleVersion()
    );
    const [allRuleVersions, setAllRuleVersions] = useState<ICommissionRuleVersionRecord[]>([]);
    const [employees, setEmployees] = useState<IEmployeeHierarchyNode[]>([]);
    const [toursRefs, setToursRefs] = useState<ITourFinancialReference[]>([]);
    const [tourCommissions, setTourCommissions] = useState<ITourCommissionRecord[]>([]);

    // Tab 1: Selected Tour & Commission Calculation State
    const [selectedTourId, setSelectedTourId] = useState<string>("");
    const [declaredGrossProfitUsd, setDeclaredGrossProfitUsd] = useState<number>(0);
    const [declaredGrossProfitNotes, setDeclaredGrossProfitNotes] = useState<string>("");
    const [exchangeRateLkr, setExchangeRateLkr] = useState<number>(300);
    const [commissionStatus, setCommissionStatus] = useState<CommissionStatus>("Calculated");
    const [directContributors, setDirectContributors] = useState<ICommissionContributorInput[]>([]);
    const [leadershipChain, setLeadershipChain] = useState<ICommissionLeaderInput[]>([]);
    const [auditJustification, setAuditJustification] = useState<string>("");
    const [paymentReference, setPaymentReference] = useState<string>("");

    // Tab 2: Employee Dashboard Selector
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

    // Tab 3: Management Filters
    const [mgmtRoleFilter, setMgmtRoleFilter] = useState<string>("all");
    const [mgmtStatusFilter, setMgmtStatusFilter] = useState<string>("all");
    const [mgmtEmployeeFilter, setMgmtEmployeeFilter] = useState<string>("all");

    // Tab 4: Rule Version Draft Editor
    const [draftRules, setDraftRules] = useState<ICommissionRuleConfig>(
        CommissionSimulationService.getDefaultRules()
    );
    const [draftVersionName, setDraftVersionName] = useState<string>("");
    const [draftVersionNotes, setDraftVersionNotes] = useState<string>("");

    const loadAllData = async () => {
        setLoading(true);
        const res = await getCommissionWorkspaceInitialDataAction();
        if (res.success && res.data) {
            setCurrentUser(res.data.currentUser);
            setActiveRuleVersion(res.data.activeRuleVersion);
            setAllRuleVersions(res.data.allRuleVersions);
            setEmployees(res.data.employees);
            setToursRefs(res.data.toursFinancialReferences);
            setTourCommissions(res.data.tourCommissions);
            setDraftRules(res.data.activeRuleVersion.rules);
            setDraftVersionName(
                `v${res.data.activeRuleVersion.versionNumber + 1}.0 — Updated Commission & Cap Policy`
            );

            if (res.data.currentUser.role === "admin") {
                setActiveTab((prev) => prev || "workspace");
                if (!selectedEmployeeId) {
                    const defaultEmp =
                        res.data.employees.find((e) => e.userId === res.data!.currentUser.id)?.userId ||
                        res.data.employees[0]?.userId ||
                        "";
                    setSelectedEmployeeId(defaultEmp);
                }
            } else {
                setActiveTab("employee");
                setSelectedEmployeeId(res.data.currentUser.id);
            }

            if (!selectedTourId && res.data.toursFinancialReferences.length > 0) {
                handleSelectTourForWorkspace(
                    res.data.toursFinancialReferences[0].tourId,
                    res.data.toursFinancialReferences,
                    res.data.tourCommissions,
                    res.data.employees
                );
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        loadAllData();
    }, []);

    const handleSelectTourForWorkspace = (
        tourId: string,
        refsList = toursRefs,
        commList = tourCommissions,
        empList = employees
    ) => {
        setSelectedTourId(tourId);
        const tourRef = refsList.find((t) => t.tourId === tourId);
        const existingComm = commList.find((c) => c.tourId === tourId);

        if (existingComm) {
            setDeclaredGrossProfitUsd(existingComm.declaredGrossProfitUsd);
            setDeclaredGrossProfitNotes(existingComm.declaredGrossProfitNotes);
            setExchangeRateLkr(existingComm.exchangeRateLkr || 300);
            setCommissionStatus(existingComm.status);
            setPaymentReference(existingComm.paymentReference || "");
            setAuditJustification("");

            const savedDirect = existingComm.allocations
                .filter((a) => a.allocationType === "DIRECT")
                .map((a) => ({
                    id: a.userId || a.id,
                    name: a.recipientName,
                    role: a.roleAtTime,
                    roleLabel: a.roleLabel,
                    sharePercentage: a.sharePercentage,
                    ratingTier: a.ratingTier,
                    maxCapUsd: a.customMaxCapUsd ?? null
                }));

            const savedLeaders = existingComm.allocations
                .filter((a) => a.allocationType.startsWith("LEADERSHIP_TIER_"))
                .map((a) => ({
                    id: a.userId || a.id,
                    name: a.recipientName,
                    role: a.roleAtTime,
                    roleLabel: a.roleLabel,
                    tier: (a.leadershipTier || 1) as 1 | 2 | 3,
                    hasActiveContribution: a.hasActiveContribution,
                    contributionEvidence: a.eligibilityNotes,
                    ratingTier: a.ratingTier,
                    maxCapUsd: a.customMaxCapUsd ?? null
                }));

            setDirectContributors(
                savedDirect.length > 0
                    ? savedDirect
                    : [
                          {
                              id: tourRef?.agentId || "lead-agent",
                              name: tourRef?.agentName || "Assigned Agent",
                              role: tourRef?.agentRole || "agent",
                              roleLabel: ROLE_DISPLAY_NAMES[tourRef?.agentRole || "agent"] || "Agent",
                              sharePercentage: 100,
                              ratingTier: "meets",
                              maxCapUsd: null
                          }
                      ]
            );
            setLeadershipChain(savedLeaders);
        } else if (tourRef) {
            const defaultGp =
                tourRef.systemReconciledGrossProfitUsd > 0
                    ? tourRef.systemReconciledGrossProfitUsd
                    : Math.max(0, tourRef.systemAgreedGrossProfitUsd);

            setDeclaredGrossProfitUsd(defaultGp);
            setDeclaredGrossProfitNotes(
                "Entered by Admin/Finance from tour P&L after deducting all direct & offline costs"
            );
            setExchangeRateLkr(tourRef.exchangeRateLkr || 300);
            setCommissionStatus("Calculated");
            setPaymentReference("");
            setAuditJustification("");

            setDirectContributors([
                {
                    id: tourRef.agentId || "lead-agent",
                    name: tourRef.agentName || "Assigned Agent",
                    role: tourRef.agentRole || "agent",
                    roleLabel: ROLE_DISPLAY_NAMES[tourRef.agentRole || "agent"] || "Agent",
                    sharePercentage: 100,
                    ratingTier: "meets",
                    maxCapUsd: null
                }
            ]);

            const autoChain = CommissionService.buildReportingChainForEmployee(
                tourRef.agentId,
                empList
            );
            setLeadershipChain(autoChain);
        }
    };

    const selectedTourRef = useMemo(
        () => toursRefs.find((t) => t.tourId === selectedTourId) || null,
        [toursRefs, selectedTourId]
    );

    const existingTourCommission = useMemo(
        () => tourCommissions.find((c) => c.tourId === selectedTourId) || null,
        [tourCommissions, selectedTourId]
    );

    // Effective rules for the selected tour (frozen snapshot if Approved/Paid, otherwise activeRuleVersion)
    const effectiveTourRules = useMemo(() => {
        if (
            existingTourCommission &&
            (existingTourCommission.status === "Approved" || existingTourCommission.status === "Paid")
        ) {
            return existingTourCommission.ruleSnapshot;
        }
        return activeRuleVersion.rules;
    }, [existingTourCommission, activeRuleVersion]);

    // Live simulation preview for Tab 1
    const liveCalculationPreview = useMemo(() => {
        return CommissionSimulationService.simulateTourCommission({
            tourLabel: selectedTourRef?.title || "Selected Tour",
            tourId: selectedTourId,
            customerRevenueUsd: selectedTourRef?.systemAgreedRevenueUsd || 0,
            systemDirectExpensesUsd: selectedTourRef?.systemAgreedCostUsd || 0,
            declaredGrossProfitUsd,
            useDeclaredGrossProfit: true,
            declaredGrossProfitNotes,
            exchangeRateLkr,
            isTourCompleted:
                commissionStatus !== "Not Eligible" && commissionStatus !== "Cancelled",
            isCancelled: commissionStatus === "Cancelled",
            rules: effectiveTourRules,
            directContributors,
            leadershipChain,
            teamDevRecipient: null
        });
    }, [
        selectedTourRef,
        selectedTourId,
        declaredGrossProfitUsd,
        declaredGrossProfitNotes,
        exchangeRateLkr,
        commissionStatus,
        effectiveTourRules,
        directContributors,
        leadershipChain
    ]);

    // Tab 2: Selected Employee Dashboard Computed Live
    const selectedEmployeeDashboard = useMemo(() => {
        const targetId = selectedEmployeeId || currentUser?.id || "";
        return CommissionService.buildEmployeeDashboard(
            targetId,
            employees,
            tourCommissions,
            toursRefs,
            activeRuleVersion.progressionCriteria
        );
    }, [selectedEmployeeId, currentUser, employees, tourCommissions, toursRefs, activeRuleVersion]);

    // Tab 3: Filtered Management Dashboard
    const filteredTourCommissions = useMemo(() => {
        return tourCommissions.filter((tc) => {
            if (mgmtStatusFilter !== "all" && tc.status !== mgmtStatusFilter) return false;
            if (mgmtEmployeeFilter !== "all") {
                const hasEmp = tc.allocations.some((a) => a.userId === mgmtEmployeeFilter);
                if (!hasEmp) return false;
            }
            return true;
        });
    }, [tourCommissions, mgmtStatusFilter, mgmtEmployeeFilter]);

    const managementDashboardData = useMemo(() => {
        const filteredEmps =
            mgmtRoleFilter === "all"
                ? employees
                : employees.filter((e) => e.role === mgmtRoleFilter);
        return CommissionService.buildManagementDashboard(
            filteredEmps,
            filteredTourCommissions,
            toursRefs
        );
    }, [employees, mgmtRoleFilter, filteredTourCommissions, toursRefs]);

    const handleSaveTourCommission = async () => {
        if (!selectedTourId) return;
        setSaving(true);
        setFeedbackMsg(null);

        const res = await saveTourCommissionAction({
            tourId: selectedTourId,
            declaredGrossProfitUsd,
            declaredGrossProfitNotes,
            exchangeRateLkr,
            status: commissionStatus,
            directContributors,
            leadershipChain,
            justification:
                auditJustification.trim() ||
                `Saved tour commission (${commissionStatus}) on Declared Gross Profit of $${declaredGrossProfitUsd.toLocaleString()}`,
            paymentReference: paymentReference.trim() || undefined
        });

        setSaving(false);
        if (res.success && res.data) {
            setFeedbackMsg({
                type: "success",
                text: `Commission saved (${res.data.status}) with frozen Rule Snapshot v${res.data.ruleVersionNumber}.`
            });
            setTourCommissions((prev) => [
                res.data!,
                ...prev.filter((c) => c.tourId !== selectedTourId)
            ]);
            setAuditJustification("");
        } else {
            setFeedbackMsg({
                type: "error",
                text: res.error || "Failed to save tour commission."
            });
        }
    };

    const handlePublishNewRuleVersion = async () => {
        setSaving(true);
        setFeedbackMsg(null);
        const res = await publishNewCommissionRuleVersionAction({
            versionName: draftVersionName,
            rules: draftRules,
            progressionCriteria: activeRuleVersion.progressionCriteria,
            notes:
                draftVersionNotes.trim() ||
                `Published new commission rule version (${draftRules.poolPercentage}% Pool, ${draftRules.directSharePercentage}/${draftRules.leadershipSharePercentage}/${draftRules.teamDevSharePercentage} Split).`
        });
        setSaving(false);

        if (res.success && res.data) {
            setActiveRuleVersion(res.data);
            setAllRuleVersions((prev) => [
                res.data!,
                ...prev.map((v) => ({ ...v, isActive: false }))
            ]);
            setDraftVersionName(`v${res.data.versionNumber + 1}.0 — Updated Commission Policy`);
            setDraftVersionNotes("");
            setFeedbackMsg({
                type: "success",
                text: `Published ${res.data.versionName} as the new active rule version. Existing Approved/Paid tour commissions retain their historical rule snapshot.`
            });
        } else {
            setFeedbackMsg({
                type: "error",
                text: res.error || "Failed to publish rule version."
            });
        }
    };

    const isAdmin = currentUser?.role === "admin";

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-10 flex items-center justify-center text-neutral-500 gap-2 text-sm">
                <RefreshCw size={16} className="animate-spin text-brand-gold" />
                Loading Employee Hierarchy &amp; Tour Commission Management System...
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-6 animate-in fade-in duration-300">
            {/* Page Header */}
            <div className="bg-brand-charcoal text-white rounded-2xl p-6 shadow-md border border-neutral-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-brand-gold/20 text-brand-gold border border-brand-gold/40">
                            {isAdmin
                                ? `Active Policy: v${activeRuleVersion.versionNumber}.0 (${activeRuleVersion.rules.poolPercentage}% GP Pool)`
                                : `Active Commission Policy: v${activeRuleVersion.versionNumber}.0`}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Performance &amp; Career Incentive Program
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold font-playfair tracking-tight">
                        {isAdmin
                            ? "Employee Hierarchy & Tour Commission Management"
                            : "Employee Personal Commission & Career Progression Dashboard"}
                    </h1>
                    <p className="text-xs text-neutral-300 max-w-3xl">
                        {isAdmin
                            ? "Calculate, approve, and audit profit-based tour commissions from Admin-Entered Declared Gross Profit, track 7-level career progression, and manage versioned commission policies."
                            : "Track your current designation, reporting line, team members, tour commission earnings, and progress towards your next career level."}
                    </p>
                </div>

                {isAdmin && (
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href="/admin/commission-simulator"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-white/20 transition-all"
                        >
                            <Calculator size={14} className="text-brand-gold" />
                            Open Sandbox Simulator
                        </Link>
                    </div>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-neutral-200 shadow-xs">
                <button
                    onClick={() => setActiveTab("employee")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === "employee"
                            ? "bg-brand-charcoal text-white shadow-xs"
                            : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                >
                    <Award size={15} className={activeTab === "employee" ? "text-brand-gold" : ""} />
                    Employee Personal Commission &amp; Career Progression Dashboard
                </button>

                {isAdmin && (
                    <>
                        <button
                            onClick={() => setActiveTab("workspace")}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                activeTab === "workspace"
                                    ? "bg-brand-charcoal text-white shadow-xs"
                                    : "text-neutral-600 hover:bg-neutral-100"
                            }`}
                        >
                            <DollarSign size={15} className={activeTab === "workspace" ? "text-brand-gold" : ""} />
                            Tour Commission Calculation &amp; Approval
                        </button>
                        <button
                            onClick={() => setActiveTab("management")}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                activeTab === "management"
                                    ? "bg-brand-charcoal text-white shadow-xs"
                                    : "text-neutral-600 hover:bg-neutral-100"
                            }`}
                        >
                            <TrendingUp size={15} className={activeTab === "management" ? "text-brand-gold" : ""} />
                            Management &amp; Liability Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab("rules")}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                activeTab === "rules"
                                    ? "bg-brand-charcoal text-white shadow-xs"
                                    : "text-neutral-600 hover:bg-neutral-100"
                            }`}
                        >
                            <Settings size={15} className={activeTab === "rules" ? "text-brand-gold" : ""} />
                            Versioned Rules &amp; Role Caps Admin
                        </button>
                    </>
                )}
            </div>

            {feedbackMsg && (
                <div
                    className={`p-4 rounded-xl border text-xs font-bold flex items-center justify-between ${
                        feedbackMsg.type === "success"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                            : "bg-red-50 border-red-200 text-red-800"
                    }`}
                >
                    <span>{feedbackMsg.text}</span>
                    <button
                        onClick={() => setFeedbackMsg(null)}
                        className="text-[11px] underline opacity-75 hover:opacity-100"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* ===================================================================
                TAB 1: TOUR COMMISSION CALCULATION & APPROVAL WORKSPACE (Admin Only)
               =================================================================== */}
            {isAdmin && activeTab === "workspace" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Tour Selection, Declared Gross Profit & Contributors (5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-5">
                            <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-brand-charcoal flex items-center gap-2">
                                    <Briefcase size={16} className="text-brand-gold" />
                                    Select Tour &amp; Enter Declared Gross Profit
                                </h3>
                                {existingTourCommission && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                        Saved: {existingTourCommission.status} (v{existingTourCommission.ruleVersionNumber})
                                    </span>
                                )}
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                                    Select Nilathra Tour
                                </label>
                                <select
                                    value={selectedTourId}
                                    onChange={(e) => handleSelectTourForWorkspace(e.target.value)}
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-xs font-bold text-brand-charcoal outline-none focus:border-brand-gold"
                                >
                                    {toursRefs.map((t) => {
                                        const saved = tourCommissions.find((c) => c.tourId === t.tourId);
                                        return (
                                            <option key={t.tourId} value={t.tourId}>
                                                {t.tourCode ? `[${t.tourCode}] ` : ""}
                                                {t.title} — Agent: {t.agentName}{" "}
                                                {saved ? `• [${saved.status}]` : "• [Not Calculated Yet]"}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {selectedTourRef && (
                                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs space-y-1.5 font-mono">
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500">System Invoiced Revenue / Costs:</span>
                                        <span className="font-bold text-brand-charcoal">
                                            Rev ${selectedTourRef.systemAgreedRevenueUsd.toLocaleString()} − POs $
                                            {selectedTourRef.systemAgreedCostUsd.toLocaleString()} ={" "}
                                            <span className="text-emerald-700">
                                                ${selectedTourRef.systemAgreedGrossProfitUsd.toLocaleString()}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500">System Reconciled Cash Margin:</span>
                                        <span className="font-bold text-emerald-800">
                                            ${selectedTourRef.systemReconciledGrossProfitUsd.toLocaleString()} (In $
                                            {selectedTourRef.systemReconciledPaidRevenueUsd.toLocaleString()} − Out $
                                            {(
                                                selectedTourRef.systemReconciledPaidCostUsd +
                                                selectedTourRef.systemReconciledMiscExpensesUsd
                                            ).toLocaleString()}
                                            )
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Declared Gross Profit Input */}
                            <div className="p-4 rounded-2xl bg-emerald-50/60 border-2 border-emerald-600/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 block">
                                            Declared Gross Profit for Commission (USD)
                                        </span>
                                        <span className="text-[10px] text-emerald-700">
                                            Authoritative entered figure after all offline/direct expenses
                                        </span>
                                    </div>
                                    {selectedTourRef && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setDeclaredGrossProfitUsd(
                                                    Math.max(0, selectedTourRef.systemAgreedGrossProfitUsd)
                                                )
                                            }
                                            className="text-[10px] font-bold text-emerald-800 bg-white border border-emerald-300 px-2.5 py-1 rounded-lg hover:bg-emerald-100"
                                        >
                                            Use System Margin ($
                                            {selectedTourRef.systemAgreedGrossProfitUsd.toLocaleString()})
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-3 items-center">
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            value={declaredGrossProfitUsd}
                                            onChange={(e) => setDeclaredGrossProfitUsd(Number(e.target.value))}
                                            className="w-full bg-white border-2 border-emerald-600/40 rounded-xl px-3 py-2 text-lg font-mono font-extrabold text-emerald-950"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-neutral-500 block font-mono text-right">
                                            FX (LKR/USD)
                                        </span>
                                        <input
                                            type="number"
                                            value={exchangeRateLkr}
                                            onChange={(e) => setExchangeRateLkr(Number(e.target.value))}
                                            className="w-full bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-right"
                                        />
                                    </div>
                                </div>

                                <input
                                    type="text"
                                    value={declaredGrossProfitNotes}
                                    onChange={(e) => setDeclaredGrossProfitNotes(e.target.value)}
                                    placeholder="Finance note on Declared Gross Profit (e.g. bank charges / offline costs deducted)..."
                                    className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-1.5 text-xs text-neutral-700"
                                />
                            </div>

                            {/* Direct Contributors Editor */}
                            <div className="space-y-3 pt-2 border-t border-neutral-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                                        Direct Tour Contributors (Total = 100%)
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const firstEmp = employees[0];
                                            setDirectContributors((prev) => [
                                                ...prev,
                                                {
                                                    id: firstEmp?.userId || `custom-${Date.now()}`,
                                                    name: firstEmp?.name || "Supporting Agent",
                                                    role: firstEmp?.role || "agent",
                                                    roleLabel: firstEmp?.roleLabel || "Agent",
                                                    sharePercentage: 0,
                                                    ratingTier: "meets",
                                                    maxCapUsd: null
                                                }
                                            ]);
                                        }}
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
                                            <select
                                                value={c.id}
                                                onChange={(e) => {
                                                    const emp = employees.find(
                                                        (item) => item.userId === e.target.value
                                                    );
                                                    if (emp) {
                                                        setDirectContributors((prev) =>
                                                            prev.map((item, i) =>
                                                                i === idx
                                                                    ? {
                                                                          ...item,
                                                                          id: emp.userId,
                                                                          name: emp.name,
                                                                          role: emp.role,
                                                                          roleLabel: emp.roleLabel
                                                                      }
                                                                    : item
                                                            )
                                                        );
                                                    }
                                                }}
                                                className="bg-white border border-neutral-200 rounded-lg px-2.5 py-1 text-xs font-bold text-brand-charcoal flex-1"
                                            >
                                                <option value={c.id}>
                                                    {c.name} ({c.roleLabel})
                                                </option>
                                                {employees
                                                    .filter((emp) => emp.userId !== c.id)
                                                    .map((emp) => (
                                                        <option key={emp.userId} value={emp.userId}>
                                                            {emp.name} ({emp.roleLabel})
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
                                            <div className="flex items-center gap-1">
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
                                                <span className="text-[10px] font-bold text-neutral-500">Cap $:</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step={25}
                                                    placeholder={String(
                                                        effectiveTourRules.roleMaxCapUsd[c.role] ?? ""
                                                    )}
                                                    value={c.maxCapUsd ?? ""}
                                                    onChange={(e) => {
                                                        const raw = e.target.value;
                                                        setDirectContributors((prev) =>
                                                            prev.map((item, i) =>
                                                                i === idx
                                                                    ? {
                                                                          ...item,
                                                                          maxCapUsd: raw === "" ? null : Number(raw)
                                                                      }
                                                                    : item
                                                            )
                                                        );
                                                    }}
                                                    className="w-16 bg-white border border-neutral-200 rounded px-1.5 py-1 font-mono font-bold text-right"
                                                />
                                            </div>
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
                                                    Below ({effectiveTourRules.performanceMultipliers.below}x)
                                                </option>
                                                <option value="meets">
                                                    Meets ({effectiveTourRules.performanceMultipliers.meets}x)
                                                </option>
                                                <option value="exceeds">
                                                    Exceeds ({effectiveTourRules.performanceMultipliers.exceeds}x)
                                                </option>
                                                <option value="exceptional">
                                                    Exceptional ({effectiveTourRules.performanceMultipliers.exceptional}x)
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Leadership Chain Editor */}
                            <div className="space-y-3 pt-2 border-t border-neutral-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                                        Reporting Chain / Leadership Allocation
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const sup = employees.find((e) => e.role !== "agent") || employees[0];
                                            setLeadershipChain((prev) => [
                                                ...prev,
                                                {
                                                    id: sup?.userId || `leader-${Date.now()}`,
                                                    name: sup?.name || "Supervisor",
                                                    role: sup?.role || "agent_supervisor",
                                                    roleLabel: sup?.roleLabel || "Supervisor",
                                                    tier: Math.min(3, prev.length + 1) as 1 | 2 | 3,
                                                    hasActiveContribution: true,
                                                    contributionEvidence: "Active supervision & tour QA sign-off",
                                                    ratingTier: "meets",
                                                    maxCapUsd: null
                                                }
                                            ]);
                                        }}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900"
                                    >
                                        <Plus size={12} /> Add Reporting Leader
                                    </button>
                                </div>

                                {leadershipChain.length === 0 ? (
                                    <div className="p-3 rounded-xl bg-neutral-50 border border-dashed border-neutral-200 text-xs text-neutral-500 text-center">
                                        No reporting leaders assigned — 100% of Leadership Pool returns to Nilathra Collection.
                                    </div>
                                ) : (
                                    leadershipChain.map((leader, idx) => (
                                        <div
                                            key={leader.id + idx}
                                            className="p-3 rounded-xl bg-blue-50/40 border border-blue-200/70 space-y-2"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <select
                                                    value={leader.id}
                                                    onChange={(e) => {
                                                        const emp = employees.find(
                                                            (item) => item.userId === e.target.value
                                                        );
                                                        if (emp) {
                                                            setLeadershipChain((prev) =>
                                                                prev.map((item, i) =>
                                                                    i === idx
                                                                        ? {
                                                                              ...item,
                                                                              id: emp.userId,
                                                                              name: emp.name,
                                                                              role: emp.role,
                                                                              roleLabel: emp.roleLabel
                                                                          }
                                                                        : item
                                                                )
                                                            );
                                                        }
                                                    }}
                                                    className="bg-white border border-neutral-200 rounded-lg px-2 py-1 text-xs font-bold text-brand-charcoal flex-1"
                                                >
                                                    <option value={leader.id}>
                                                        {leader.name} ({leader.roleLabel})
                                                    </option>
                                                    {employees
                                                        .filter((emp) => emp.userId !== leader.id)
                                                        .map((emp) => (
                                                            <option key={emp.userId} value={emp.userId}>
                                                                {emp.name} ({emp.roleLabel})
                                                            </option>
                                                        ))}
                                                </select>

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
                                                        Tier 1 ({effectiveTourRules.leadershipTierWeights.tier1}%)
                                                    </option>
                                                    <option value={2}>
                                                        Tier 2 ({effectiveTourRules.leadershipTierWeights.tier2}%)
                                                    </option>
                                                    <option value={3}>
                                                        Tier 3 ({effectiveTourRules.leadershipTierWeights.tier3}%)
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
                                                    <span className="text-[11px]">Active Sign-Off / Mentoring</span>
                                                </label>

                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] font-bold text-neutral-500">
                                                            Cap $:
                                                        </span>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            step={25}
                                                            placeholder={String(
                                                                effectiveTourRules.roleMaxCapUsd[leader.role] ?? ""
                                                            )}
                                                            value={leader.maxCapUsd ?? ""}
                                                            onChange={(e) => {
                                                                const raw = e.target.value;
                                                                setLeadershipChain((prev) =>
                                                                    prev.map((item, i) =>
                                                                        i === idx
                                                                            ? {
                                                                                  ...item,
                                                                                  maxCapUsd:
                                                                                      raw === "" ? null : Number(raw)
                                                                              }
                                                                            : item
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
                                                        <option value="below">Below</option>
                                                        <option value="meets">Meets</option>
                                                        <option value="exceeds">Exceeds</option>
                                                        <option value="exceptional">Exceptional</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Approval & Status Gate Controls */}
                            <div className="pt-3 border-t border-neutral-200 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                                            Commission Workflow Status
                                        </label>
                                        <select
                                            value={commissionStatus}
                                            onChange={(e) =>
                                                setCommissionStatus(e.target.value as CommissionStatus)
                                            }
                                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-extrabold text-brand-charcoal"
                                        >
                                            {STATUS_OPTIONS.map((st) => (
                                                <option key={st} value={st}>
                                                    {st}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                                            Payment Ref (If Paid)
                                        </label>
                                        <input
                                            type="text"
                                            value={paymentReference}
                                            onChange={(e) => setPaymentReference(e.target.value)}
                                            placeholder="e.g. PAY-2026-11-01"
                                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                                        Audit Trail Justification / Approval Note
                                    </label>
                                    <input
                                        type="text"
                                        value={auditJustification}
                                        onChange={(e) => setAuditJustification(e.target.value)}
                                        placeholder="Enter reason for calculation, approval, or cap override..."
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
                                    />
                                </div>

                                <button
                                    type="button"
                                    disabled={saving || !selectedTourId}
                                    onClick={handleSaveTourCommission}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-brand-charcoal hover:bg-neutral-800 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    <Save size={15} className="text-brand-gold" />
                                    {saving
                                        ? "Saving & Recording Audit Snapshot..."
                                        : `Save & Lock Tour Commission (${commissionStatus})`}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Live Calculation Breakdown & Audit History (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                                    Declared Gross Profit
                                </span>
                                <span className="text-2xl font-extrabold font-mono text-brand-charcoal mt-1 block">
                                    ${liveCalculationPreview.effectiveGrossProfitUsd.toLocaleString()}
                                </span>
                                <span className="text-[11px] text-neutral-500 font-mono">
                                    LKR{" "}
                                    {(
                                        liveCalculationPreview.effectiveGrossProfitUsd *
                                        liveCalculationPreview.exchangeRateLkr
                                    ).toLocaleString()}
                                </span>
                            </div>

                            <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                                    Commission Pool ({effectiveTourRules.poolPercentage}%)
                                </span>
                                <span className="text-2xl font-extrabold font-mono text-brand-gold mt-1 block">
                                    ${liveCalculationPreview.baseCommissionPoolUsd.toLocaleString()}
                                </span>
                                <span className="text-[11px] text-neutral-500 font-mono block">
                                    Direct: ${liveCalculationPreview.directSubPoolUsd.toLocaleString()} · Lead: $
                                    {liveCalculationPreview.leadershipSubPoolUsd.toLocaleString()}
                                </span>
                            </div>

                            <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                                    Total Employee Payout
                                </span>
                                <span className="text-2xl font-extrabold font-mono text-emerald-700 mt-1 block">
                                    ${liveCalculationPreview.totalCommissionDistributedUsd.toLocaleString()}
                                </span>
                                <span className="text-[11px] text-neutral-500 font-mono block">
                                    LKR {liveCalculationPreview.totalCommissionDistributedLkr.toLocaleString()}
                                </span>
                            </div>

                            <div className="bg-brand-charcoal text-white rounded-2xl p-4 shadow-xs">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold block">
                                    Nilathra Retained GP ({liveCalculationPreview.companyRetainedShareOfGpPct}%)
                                </span>
                                <span className="text-2xl font-extrabold font-mono text-white mt-1 block">
                                    ${liveCalculationPreview.companyRetainedGrossProfitUsd.toLocaleString()}
                                </span>
                                <span className="text-[11px] text-neutral-300 font-mono block">
                                    +${liveCalculationPreview.unallocatedPoolReturnedToCompanyUsd.toLocaleString()}{" "}
                                    returned
                                </span>
                            </div>
                        </div>

                        {/* Individual Employee Allocation Breakdown */}
                        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
                            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-brand-charcoal">
                                        Tour Commission Allocation Breakdown
                                    </h3>
                                    <p className="text-[11px] text-neutral-400">
                                        Shows exact base share, performance multiplier, role/person USD cap, and final payout.
                                    </p>
                                </div>
                                <span className="text-xs font-mono font-bold text-neutral-500">
                                    Status: {commissionStatus}
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
                                            <th className="px-5 py-3">Eligibility &amp; Audit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {liveCalculationPreview.allocations.map((alloc, i) => (
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
                                                <td className="px-4 py-3.5 text-right font-mono">
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
                                                <td className="px-5 py-3.5 max-w-xs text-[11px] text-neutral-500">
                                                    {alloc.notes}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Audit Trail & Adjustments History for Selected Tour */}
                        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
                            <h3 className="text-sm font-bold text-brand-charcoal flex items-center gap-2">
                                <History size={16} className="text-brand-gold" />
                                Tour Commission Audit Trail &amp; Snapshot History
                            </h3>
                            {!existingTourCommission || existingTourCommission.adjustments.length === 0 ? (
                                <p className="text-xs text-neutral-400">
                                    No saved commission audit records for this tour yet. Click &ldquo;Save &amp; Lock Tour Commission&rdquo; to record the initial calculation and rule snapshot.
                                </p>
                            ) : (
                                <div className="space-y-2.5">
                                    {existingTourCommission.adjustments.map((adj) => (
                                        <div
                                            key={adj.id}
                                            className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                                        >
                                            <div>
                                                <span className="font-bold text-brand-charcoal mr-2">
                                                    [{adj.actionType}]
                                                </span>
                                                <span className="text-neutral-700">{adj.justification}</span>
                                                <p className="text-[10px] text-neutral-400 mt-0.5">
                                                    By {adj.performedByName} on{" "}
                                                    {new Date(adj.createdAt).toLocaleString()}
                                                    {adj.newStatus ? ` • Status -> ${adj.newStatus}` : ""}
                                                </p>
                                            </div>
                                            <span className="font-mono font-bold text-emerald-800">
                                                Pool Paid: ${adj.adjustmentAmountUsd.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===================================================================
                TAB 2: EMPLOYEE PERSONAL & CAREER PROGRESSION DASHBOARD (Section 8)
               =================================================================== */}
            {activeTab === "employee" && (
                <div className="space-y-6">
                    {/* Employee Selector Bar */}
                    <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Users size={18} className="text-brand-gold" />
                            <div>
                                <h3 className="text-sm font-bold text-brand-charcoal">
                                    Employee Personal Commission &amp; Career Progression Dashboard
                                </h3>
                                <p className="text-xs text-neutral-400">
                                    View designation, reporting manager, team members, earnings breakdown, and progression to the next level.
                                </p>
                            </div>
                        </div>

                        {isAdmin && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-neutral-500">Inspect Employee:</span>
                                <select
                                    value={selectedEmployeeId}
                                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                    className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-brand-charcoal"
                                >
                                    {employees.map((emp) => (
                                        <option key={emp.userId} value={emp.userId}>
                                            {emp.name} — {emp.roleLabel}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Top Profile + Career Progress Banner */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-5 bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold block">
                                        Current Designation
                                    </span>
                                    <h2 className="text-xl font-bold font-playfair text-brand-charcoal mt-0.5">
                                        {selectedEmployeeDashboard.employee.name}
                                    </h2>
                                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-charcoal text-brand-gold">
                                        {selectedEmployeeDashboard.employee.roleLabel}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                                        Performance Rating
                                    </span>
                                    <span className="text-sm font-extrabold text-emerald-700">
                                        {selectedEmployeeDashboard.currentRatingLabel}
                                    </span>
                                    <span className="text-[11px] font-mono text-neutral-500 block">
                                        Max Tour Cap: $
                                        {activeRuleVersion.rules.roleMaxCapUsd[
                                            selectedEmployeeDashboard.employee.role
                                        ] ?? 350}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-neutral-500 font-medium">Reporting Manager:</span>
                                    <span className="font-bold text-brand-charcoal">
                                        {selectedEmployeeDashboard.employee.supervisorName
                                            ? `${selectedEmployeeDashboard.employee.supervisorName} (${selectedEmployeeDashboard.employee.supervisorRoleLabel})`
                                            : "Reports Directly to Management / Admin"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-500 font-medium">Team Members Under Employee:</span>
                                    <span className="font-bold text-brand-charcoal">
                                        {selectedEmployeeDashboard.teamMembers.length} member(s)
                                    </span>
                                </div>
                                {selectedEmployeeDashboard.teamMembers.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {selectedEmployeeDashboard.teamMembers.map((tm) => (
                                            <span
                                                key={tm.userId}
                                                className="px-2 py-0.5 rounded-lg bg-neutral-100 text-[11px] font-medium text-neutral-700"
                                            >
                                                {tm.name} ({tm.roleLabel})
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Progression Towards Next Designation */}
                        <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 block">
                                        Career Progression Eligibility
                                    </span>
                                    <h3 className="text-lg font-bold font-playfair text-brand-charcoal mt-0.5">
                                        {selectedEmployeeDashboard.progression.currentRoleLabel} &rarr;{" "}
                                        {selectedEmployeeDashboard.progression.nextRoleLabel}
                                    </h3>
                                </div>
                                <span className="text-3xl font-extrabold font-mono text-emerald-700">
                                    {selectedEmployeeDashboard.progression.overallProgressPct}%
                                </span>
                            </div>

                            <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-brand-gold to-emerald-600 transition-all duration-300"
                                    style={{
                                        width: `${Math.min(
                                            100,
                                            selectedEmployeeDashboard.progression.overallProgressPct
                                        )}%`
                                    }}
                                />
                            </div>

                            <div className={`grid ${isAdmin ? "grid-cols-3" : "grid-cols-2"} gap-3 text-xs pt-1`}>
                                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                                        Tours Managed
                                    </span>
                                    <span className="font-mono font-bold text-sm text-brand-charcoal">
                                        {selectedEmployeeDashboard.progression.toursCompleted} /{" "}
                                        {selectedEmployeeDashboard.progression.targetTours}
                                    </span>
                                </div>
                                {isAdmin && (
                                    <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                                        <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                                            Declared GP Generated
                                        </span>
                                        <span className="font-mono font-bold text-sm text-brand-charcoal">
                                            ${selectedEmployeeDashboard.progression.grossProfitUsd.toLocaleString()} / $
                                            {selectedEmployeeDashboard.progression.targetGrossProfitUsd.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                                        Mentored Active Agents
                                    </span>
                                    <span className="font-mono font-bold text-sm text-brand-charcoal">
                                        {selectedEmployeeDashboard.progression.qualifiedMenteesCount} /{" "}
                                        {selectedEmployeeDashboard.progression.targetMenteesCount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial KPIs for Employee */}
                    <div
                        className={`grid grid-cols-2 sm:grid-cols-3 ${
                            isAdmin ? "lg:grid-cols-7" : "lg:grid-cols-6"
                        } gap-4`}
                    >
                        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
                            <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                                Tours Managed / Supported
                            </span>
                            <span className="text-xl font-extrabold font-mono text-brand-charcoal mt-1 block">
                                {selectedEmployeeDashboard.toursManagedCount} /{" "}
                                {selectedEmployeeDashboard.toursSupportedCount}
                            </span>
                        </div>
                        {isAdmin && (
                            <>
                                <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
                                    <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                                        Revenue Contributed
                                    </span>
                                    <span className="text-xl font-extrabold font-mono text-brand-charcoal mt-1 block">
                                        ${selectedEmployeeDashboard.totalTourRevenueContributedUsd.toLocaleString()}
                                    </span>
                                </div>
                                <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
                                    <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                                        Gross Profit Generated
                                    </span>
                                    <span className="text-xl font-extrabold font-mono text-emerald-800 mt-1 block">
                                        ${selectedEmployeeDashboard.totalDeclaredGrossProfitGeneratedUsd.toLocaleString()}
                                    </span>
                                </div>
                            </>
                        )}
                        <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-xs">
                            <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                                Personal Direct Commission
                            </span>
                            <span className="text-xl font-extrabold font-mono text-emerald-800 mt-1 block">
                                ${selectedEmployeeDashboard.directCommissionEarnedUsd.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-neutral-400 block">
                                From own managed tours
                            </span>
                        </div>
                        <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-xs">
                            <span className="text-[10px] font-bold uppercase text-blue-700 block">
                                Subordinate Commission
                            </span>
                            <span className="text-xl font-extrabold font-mono text-blue-800 mt-1 block">
                                $
                                {(
                                    selectedEmployeeDashboard.leadershipCommissionEarnedUsd +
                                    selectedEmployeeDashboard.teamDevCommissionEarnedUsd
                                ).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-neutral-400 block">
                                Via mentoring &amp; supervision
                            </span>
                        </div>
                        {!isAdmin && (
                            <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
                                <span className="text-[10px] font-bold uppercase text-brand-charcoal block">
                                    Total Commission Earned
                                </span>
                                <span className="text-xl font-extrabold font-mono text-brand-charcoal mt-1 block">
                                    ${selectedEmployeeDashboard.totalCommissionEarnedUsd.toLocaleString()}
                                </span>
                                <span className="text-[10px] font-mono text-neutral-500 block">
                                    LKR {selectedEmployeeDashboard.totalCommissionEarnedLkr.toLocaleString()}
                                </span>
                            </div>
                        )}
                        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
                            <span className="text-[10px] font-bold uppercase text-amber-700 block">
                                Pending / Approved
                            </span>
                            <span className="text-xl font-extrabold font-mono text-amber-700 mt-1 block">
                                $
                                {(
                                    selectedEmployeeDashboard.pendingCommissionUsd +
                                    selectedEmployeeDashboard.approvedCommissionUsd
                                ).toLocaleString()}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-400 block">
                                Approved: ${selectedEmployeeDashboard.approvedCommissionUsd.toLocaleString()}
                            </span>
                        </div>
                        <div className="bg-brand-charcoal text-white rounded-2xl p-4 shadow-xs">
                            <span className="text-[10px] font-bold uppercase text-brand-gold block">
                                Paid Commission
                            </span>
                            <span className="text-xl font-extrabold font-mono text-white mt-1 block">
                                ${selectedEmployeeDashboard.paidCommissionUsd.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Employee's Transparent Per-Tour Commission History */}
                    <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
                        <div className="px-6 py-4 border-b border-neutral-100">
                            <h3 className="text-sm font-bold text-brand-charcoal">
                                Commission Calculation History (Personal &amp; Subordinate Tours)
                            </h3>
                            <p className="text-xs text-neutral-400">
                                Shows both personal direct tour commissions and leadership commissions earned through subordinates for {selectedEmployeeDashboard.employee.name}.
                            </p>
                        </div>

                        {selectedEmployeeDashboard.allocationsHistory.length === 0 ? (
                            <div className="p-8 text-center text-xs text-neutral-400">
                                No commission allocations recorded for this employee yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-neutral-50 text-neutral-500 uppercase text-[10px] font-bold border-b border-neutral-200">
                                        <tr>
                                            <th className="px-5 py-3">Tour</th>
                                            <th className="px-4 py-3">Source / Subordinate</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Reward Type</th>
                                            {isAdmin && <th className="px-4 py-3 text-right">Declared GP</th>}
                                            <th className="px-4 py-3 text-right">Share %</th>
                                            <th className="px-4 py-3 text-center">Multiplier</th>
                                            <th className="px-4 py-3 text-right">Cap Applied</th>
                                            <th className="px-4 py-3 text-right">Final Earned (USD)</th>
                                            <th className="px-4 py-3 text-right">Final Earned (LKR)</th>
                                            <th className="px-5 py-3">Calculation Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {selectedEmployeeDashboard.allocationsHistory.map((item, idx) => {
                                            const isDirect = item.allocation.allocationType === "DIRECT";
                                            return (
                                                <tr key={item.allocation.id + idx} className="hover:bg-neutral-50/70">
                                                    <td className="px-5 py-3 font-bold text-brand-charcoal">
                                                        {item.tourCode ? `[${item.tourCode}] ` : ""}
                                                        {item.tourTitle}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {isDirect ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                                Personal Tour
                                                            </span>
                                                        ) : (
                                                            <div>
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                                                    Subordinate: {item.leadAgentName}
                                                                </span>
                                                                <span className="block text-[10px] text-neutral-400 mt-0.5">
                                                                    {item.leadAgentRoleLabel}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-800">
                                                            {item.tourCommissionStatus}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-[11px]">
                                                        {item.allocation.allocationType.replace(/_/g, " ")}
                                                    </td>
                                                    {isAdmin && (
                                                        <td className="px-4 py-3 text-right font-mono">
                                                            ${item.declaredGrossProfitUsd.toLocaleString()}
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-3 text-right font-mono font-bold">
                                                        {item.allocation.sharePercentage}%
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-mono">
                                                        {item.allocation.appliedMultiplier.toFixed(2)}x
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono">
                                                        {item.allocation.appliedCapUsd !== null &&
                                                        item.allocation.appliedCapUsd !== undefined
                                                            ? `$${item.allocation.appliedCapUsd}`
                                                            : "Uncapped"}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono font-extrabold text-emerald-800">
                                                        ${item.allocation.finalAmountUsd.toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono text-neutral-600">
                                                        LKR {item.allocation.finalAmountLkr.toLocaleString()}
                                                    </td>
                                                    <td className="px-5 py-3 text-[11px] text-neutral-500">
                                                        {item.allocation.eligibilityNotes}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===================================================================
                TAB 3: MANAGEMENT & LIABILITY DASHBOARD (Section 9 — Admin Only)
               =================================================================== */}
            {isAdmin && activeTab === "management" && (
                <div className="space-y-6">
                    {/* Filter Bar */}
                    <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Filter size={16} className="text-brand-gold" />
                            <span className="text-sm font-bold text-brand-charcoal">
                                Management Commission &amp; Team Profitability Filters
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs">
                            <select
                                value={mgmtRoleFilter}
                                onChange={(e) => setMgmtRoleFilter(e.target.value)}
                                className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 font-bold"
                            >
                                <option value="all">All Designations</option>
                                {ROLE_OPTIONS.map((ro) => (
                                    <option key={ro.value} value={ro.value}>
                                        {ro.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={mgmtEmployeeFilter}
                                onChange={(e) => setMgmtEmployeeFilter(e.target.value)}
                                className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 font-bold"
                            >
                                <option value="all">All Employees</option>
                                {employees.map((emp) => (
                                    <option key={emp.userId} value={emp.userId}>
                                        {emp.name} ({emp.roleLabel})
                                    </option>
                                ))}
                            </select>

                            <select
                                value={mgmtStatusFilter}
                                onChange={(e) => setMgmtStatusFilter(e.target.value)}
                                className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 font-bold"
                            >
                                <option value="all">All Commission Statuses</option>
                                {STATUS_OPTIONS.map((st) => (
                                    <option key={st} value={st}>
                                        {st}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Management KPI Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
                            <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                                Commissioned Tours / Total Active
                            </span>
                            <span className="text-2xl font-extrabold font-mono text-brand-charcoal mt-1 block">
                                {managementDashboardData.totalCommissionedTours} /{" "}
                                {managementDashboardData.totalCompletedTours}
                            </span>
                            <span className="text-xs text-neutral-500 font-mono">
                                Revenue: ${managementDashboardData.totalTourRevenueUsd.toLocaleString()}
                            </span>
                        </div>

                        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
                            <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                                Total Declared Gross Profit
                            </span>
                            <span className="text-2xl font-extrabold font-mono text-brand-charcoal mt-1 block">
                                ${managementDashboardData.totalDeclaredGrossProfitUsd.toLocaleString()}
                            </span>
                            <span className="text-xs text-emerald-700 font-mono">
                                Retained by Nilathra: $
                                {managementDashboardData.totalCompanyRetainedGrossProfitUsd.toLocaleString()}
                            </span>
                        </div>

                        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
                            <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                                Total Commission Liability
                            </span>
                            <span className="text-2xl font-extrabold font-mono text-emerald-700 mt-1 block">
                                ${managementDashboardData.totalCommissionLiabilityUsd.toLocaleString()}
                            </span>
                            <span className="text-xs text-neutral-500 font-mono">
                                Direct: ${managementDashboardData.directPoolTotalUsd.toLocaleString()} · Lead: $
                                {managementDashboardData.leadershipPoolTotalUsd.toLocaleString()}
                            </span>
                        </div>

                        <div className="bg-brand-charcoal text-white rounded-2xl p-5 shadow-xs">
                            <span className="text-[10px] font-bold uppercase text-brand-gold block">
                                Paid vs. Pending Liability
                            </span>
                            <span className="text-2xl font-extrabold font-mono text-white mt-1 block">
                                Paid: ${managementDashboardData.totalCommissionPaidUsd.toLocaleString()}
                            </span>
                            <span className="text-xs text-neutral-300 font-mono">
                                Approved: ${managementDashboardData.totalCommissionApprovedUsd.toLocaleString()} · Pending: $
                                {managementDashboardData.totalCommissionPendingUsd.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Employee Performance & Commission Rankings Table */}
                    <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
                        <div className="px-6 py-4 border-b border-neutral-100">
                            <h3 className="text-sm font-bold text-brand-charcoal">
                                Employee Performance, Direct Contribution &amp; Leadership Reward Rankings
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-neutral-50 text-neutral-500 uppercase text-[10px] font-bold border-b border-neutral-200">
                                    <tr>
                                        <th className="px-5 py-3">Employee</th>
                                        <th className="px-4 py-3">Designation</th>
                                        <th className="px-4 py-3">Reports To</th>
                                        <th className="px-4 py-3 text-center">Tours (Managed / Supp.)</th>
                                        <th className="px-4 py-3 text-right">Declared GP</th>
                                        <th className="px-4 py-3 text-right">Direct Earned</th>
                                        <th className="px-4 py-3 text-right">Leadership Earned</th>
                                        <th className="px-4 py-3 text-right">Total Commission</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {managementDashboardData.employeeRankings.map((row) => (
                                        <tr key={row.userId} className="hover:bg-neutral-50/70">
                                            <td className="px-5 py-3.5 font-bold text-brand-charcoal">
                                                {row.name}
                                            </td>
                                            <td className="px-4 py-3.5">{row.roleLabel}</td>
                                            <td className="px-4 py-3.5 text-neutral-500">
                                                {row.supervisorName || "—"}
                                            </td>
                                            <td className="px-4 py-3.5 text-center font-mono">
                                                {row.toursManaged} / {row.toursSupported}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono font-bold">
                                                ${row.declaredGpGeneratedUsd.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono text-emerald-700">
                                                ${row.directCommissionUsd.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono text-blue-700">
                                                ${row.leadershipCommissionUsd.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono font-extrabold text-brand-charcoal">
                                                ${row.totalCommissionUsd.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ===================================================================
                TAB 4: VERSIONED COMMISSION RULES & ROLE CAPS ADMIN (Section 10 — Admin Only)
               =================================================================== */}
            {isAdmin && activeTab === "rules" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-6">
                        <div className="border-b border-neutral-100 pb-4">
                            <h3 className="text-base font-bold text-brand-charcoal flex items-center gap-2">
                                <Sliders size={18} className="text-brand-gold" />
                                Configure &amp; Publish New Commission Rule Version
                            </h3>
                            <p className="text-xs text-neutral-500 mt-0.5">
                                Changes are saved as a new immutable version. Previously Approved or Paid tour commissions retain their frozen rule snapshot and are never silently recalculated.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold uppercase text-neutral-500 mb-1">
                                    New Version Label
                                </label>
                                <input
                                    type="text"
                                    value={draftVersionName}
                                    onChange={(e) => setDraftVersionName(e.target.value)}
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold uppercase text-neutral-500 mb-1">
                                    Commission Pool % of Declared Gross Profit
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={40}
                                    step={0.5}
                                    value={draftRules.poolPercentage}
                                    onChange={(e) =>
                                        setDraftRules((prev) => ({
                                            ...prev,
                                            poolPercentage: Number(e.target.value)
                                        }))
                                    }
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm font-mono font-extrabold text-brand-gold"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">
                                    Direct Share %
                                </label>
                                <input
                                    type="number"
                                    value={draftRules.directSharePercentage}
                                    onChange={(e) =>
                                        setDraftRules((prev) => ({
                                            ...prev,
                                            directSharePercentage: Number(e.target.value)
                                        }))
                                    }
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">
                                    Leadership Share %
                                </label>
                                <input
                                    type="number"
                                    value={draftRules.leadershipSharePercentage}
                                    onChange={(e) =>
                                        setDraftRules((prev) => ({
                                            ...prev,
                                            leadershipSharePercentage: Number(e.target.value)
                                        }))
                                    }
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">
                                    Team Dev Share %
                                </label>
                                <input
                                    type="number"
                                    value={draftRules.teamDevSharePercentage}
                                    onChange={(e) =>
                                        setDraftRules((prev) => ({
                                            ...prev,
                                            teamDevSharePercentage: Number(e.target.value)
                                        }))
                                    }
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                                />
                            </div>
                        </div>

                        {/* Per-Role Maximum USD Caps */}
                        <div className="space-y-3 pt-3 border-t border-neutral-100">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-xs font-bold text-brand-charcoal cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={draftRules.enablePerEmployeeCap}
                                        onChange={(e) =>
                                            setDraftRules((prev) => ({
                                                ...prev,
                                                enablePerEmployeeCap: e.target.checked
                                            }))
                                        }
                                        className="accent-brand-gold w-4 h-4"
                                    />
                                    Enforce Per-Role Maximum Commission Cap (USD per Tour)
                                </label>
                            </div>

                            {draftRules.enablePerEmployeeCap && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {ROLE_OPTIONS.map((ro) => (
                                        <div
                                            key={ro.value}
                                            className="p-3 rounded-xl bg-neutral-50 border border-neutral-200"
                                        >
                                            <span className="text-[10px] font-bold uppercase text-neutral-500 block truncate">
                                                {ro.label}
                                            </span>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-xs font-mono text-neutral-400">$</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step={25}
                                                    value={draftRules.roleMaxCapUsd[ro.value] ?? 0}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        setDraftRules((prev) => ({
                                                            ...prev,
                                                            roleMaxCapUsd: {
                                                                ...prev.roleMaxCapUsd,
                                                                [ro.value]: val
                                                            }
                                                        }));
                                                    }}
                                                    className="w-20 bg-white border border-neutral-200 rounded px-2 py-1 text-right font-mono text-xs font-extrabold"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold uppercase text-neutral-500 mb-1">
                                Version Release &amp; Audit Notes
                            </label>
                            <input
                                type="text"
                                value={draftVersionNotes}
                                onChange={(e) => setDraftVersionNotes(e.target.value)}
                                placeholder="Describe why this rule version is being published..."
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
                            />
                        </div>

                        <button
                            type="button"
                            disabled={saving}
                            onClick={handlePublishNewRuleVersion}
                            className="w-full bg-brand-charcoal hover:bg-neutral-800 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all cursor-pointer"
                        >
                            {saving
                                ? "Publishing New Version..."
                                : "Publish as New Active Commission Rule Version"}
                        </button>
                    </div>

                    {/* Version History List */}
                    <div className="lg:col-span-5 bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
                        <h3 className="text-sm font-bold text-brand-charcoal flex items-center gap-2 border-b border-neutral-100 pb-3">
                            <History size={16} className="text-brand-gold" />
                            Immutable Rule Version History
                        </h3>

                        <div className="space-y-3">
                            {allRuleVersions.map((ver) => (
                                <div
                                    key={ver.id}
                                    className={`p-4 rounded-xl border space-y-1.5 ${
                                        ver.isActive
                                            ? "bg-emerald-50/50 border-emerald-300"
                                            : "bg-neutral-50 border-neutral-200"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-extrabold text-brand-charcoal">
                                            {ver.versionName}
                                        </span>
                                        {ver.isActive && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white">
                                                ACTIVE
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] font-mono text-neutral-600">
                                        Pool: {ver.rules.poolPercentage}% GP • Direct: {ver.rules.directSharePercentage}% •
                                        Leadership: {ver.rules.leadershipSharePercentage}% • Team Dev:{" "}
                                        {ver.rules.teamDevSharePercentage}%
                                    </p>
                                    <p className="text-[11px] text-neutral-500">{ver.notes}</p>
                                    <p className="text-[10px] text-neutral-400">
                                        Created: {new Date(ver.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

