import {
    ICommissionRuleConfig,
    ICommissionRuleVersionRecord,
    ITourCommissionRecord,
    ITourCommissionAllocationRecord,
    ICommissionAdjustmentRecord,
    IEmployeeCommissionDashboardData,
    IManagementCommissionDashboardData,
    IEmployeeHierarchyNode,
    ITourFinancialReference,
    IProgressionCriterion
} from "@/other/interfaces";

export class CommissionRuleVersionDTO implements ICommissionRuleVersionRecord {
    id: string;
    versionNumber: number;
    versionName: string;
    isActive: boolean;
    rules: ICommissionRuleConfig;
    progressionCriteria: Record<string, IProgressionCriterion>;
    notes: string;
    createdBy?: string | null;
    createdAt: string;

    constructor(data: ICommissionRuleVersionRecord) {
        this.id = data.id;
        this.versionNumber = data.versionNumber;
        this.versionName = data.versionName;
        this.isActive = data.isActive;
        this.rules = data.rules;
        this.progressionCriteria = data.progressionCriteria;
        this.notes = data.notes;
        this.createdBy = data.createdBy ?? null;
        this.createdAt = data.createdAt;
    }

    toPlainObject(): ICommissionRuleVersionRecord {
        return { ...this };
    }
}

export class TourCommissionDTO implements ITourCommissionRecord {
    id: string;
    tourId: string;
    tourCode: string | null;
    tourTitle: string;
    tourStatus: string;
    tourStartDate?: string | null;
    leadAgentId: string | null;
    leadAgentName: string;
    leadAgentRole: string;
    ruleVersionId: string | null;
    ruleVersionNumber: number;
    ruleVersionName: string;
    ruleSnapshot: ICommissionRuleConfig;
    status: 'Not Eligible' | 'Calculated' | 'Pending Approval' | 'Approved' | 'Paid' | 'Disputed' | 'Cancelled';
    customerRevenueUsd: number;
    systemDirectExpensesUsd: number;
    declaredGrossProfitUsd: number;
    declaredGrossProfitNotes: string;
    exchangeRateLkr: number;
    baseCommissionPoolUsd: number;
    hardCapCeilingPoolUsd: number;
    directSubPoolUsd: number;
    leadershipSubPoolUsd: number;
    teamDevSubPoolUsd: number;
    totalDirectDistributedUsd: number;
    totalLeadershipDistributedUsd: number;
    totalTeamDevDistributedUsd: number;
    totalCommissionDistributedUsd: number;
    totalCommissionDistributedLkr: number;
    totalCappedExcessReturnedUsd: number;
    unallocatedPoolReturnedUsd: number;
    companyRetainedGrossProfitUsd: number;
    allocations: ITourCommissionAllocationRecord[];
    adjustments: ICommissionAdjustmentRecord[];
    calculatedAt: string;
    approvedBy?: string | null;
    approvedAt?: string | null;
    paidBy?: string | null;
    paidAt?: string | null;
    paymentReference?: string | null;
    updatedAt: string;

    constructor(data: ITourCommissionRecord) {
        this.id = data.id;
        this.tourId = data.tourId;
        this.tourCode = data.tourCode;
        this.tourTitle = data.tourTitle;
        this.tourStatus = data.tourStatus;
        this.tourStartDate = data.tourStartDate;
        this.leadAgentId = data.leadAgentId;
        this.leadAgentName = data.leadAgentName;
        this.leadAgentRole = data.leadAgentRole;
        this.ruleVersionId = data.ruleVersionId;
        this.ruleVersionNumber = data.ruleVersionNumber;
        this.ruleVersionName = data.ruleVersionName;
        this.ruleSnapshot = data.ruleSnapshot;
        this.status = data.status;
        this.customerRevenueUsd = data.customerRevenueUsd;
        this.systemDirectExpensesUsd = data.systemDirectExpensesUsd;
        this.declaredGrossProfitUsd = data.declaredGrossProfitUsd;
        this.declaredGrossProfitNotes = data.declaredGrossProfitNotes;
        this.exchangeRateLkr = data.exchangeRateLkr;
        this.baseCommissionPoolUsd = data.baseCommissionPoolUsd;
        this.hardCapCeilingPoolUsd = data.hardCapCeilingPoolUsd;
        this.directSubPoolUsd = data.directSubPoolUsd;
        this.leadershipSubPoolUsd = data.leadershipSubPoolUsd;
        this.teamDevSubPoolUsd = data.teamDevSubPoolUsd;
        this.totalDirectDistributedUsd = data.totalDirectDistributedUsd;
        this.totalLeadershipDistributedUsd = data.totalLeadershipDistributedUsd;
        this.totalTeamDevDistributedUsd = data.totalTeamDevDistributedUsd;
        this.totalCommissionDistributedUsd = data.totalCommissionDistributedUsd;
        this.totalCommissionDistributedLkr = data.totalCommissionDistributedLkr;
        this.totalCappedExcessReturnedUsd = data.totalCappedExcessReturnedUsd;
        this.unallocatedPoolReturnedUsd = data.unallocatedPoolReturnedUsd;
        this.companyRetainedGrossProfitUsd = data.companyRetainedGrossProfitUsd;
        this.allocations = data.allocations;
        this.adjustments = data.adjustments;
        this.calculatedAt = data.calculatedAt;
        this.approvedBy = data.approvedBy;
        this.approvedAt = data.approvedAt;
        this.paidBy = data.paidBy;
        this.paidAt = data.paidAt;
        this.paymentReference = data.paymentReference;
        this.updatedAt = data.updatedAt;
    }

    toPlainObject(): ITourCommissionRecord {
        return { ...this };
    }
}

export class CommissionWorkspaceInitialDataDTO {
    currentUser: {
        id: string;
        name: string;
        email: string;
        role: string;
        roleLabel: string;
        isAdminOrFinance: boolean;
    };
    activeRuleVersion: ICommissionRuleVersionRecord;
    allRuleVersions: ICommissionRuleVersionRecord[];
    employees: IEmployeeHierarchyNode[];
    toursFinancialReferences: ITourFinancialReference[];
    tourCommissions: ITourCommissionRecord[];
    myDashboard: IEmployeeCommissionDashboardData;
    managementDashboard: IManagementCommissionDashboardData;

    constructor(data: {
        currentUser: {
            id: string;
            name: string;
            email: string;
            role: string;
            roleLabel: string;
            isAdminOrFinance: boolean;
        };
        activeRuleVersion: ICommissionRuleVersionRecord;
        allRuleVersions: ICommissionRuleVersionRecord[];
        employees: IEmployeeHierarchyNode[];
        toursFinancialReferences: ITourFinancialReference[];
        tourCommissions: ITourCommissionRecord[];
        myDashboard: IEmployeeCommissionDashboardData;
        managementDashboard: IManagementCommissionDashboardData;
    }) {
        this.currentUser = data.currentUser;
        this.activeRuleVersion = data.activeRuleVersion;
        this.allRuleVersions = data.allRuleVersions;
        this.employees = data.employees;
        this.toursFinancialReferences = data.toursFinancialReferences;
        this.tourCommissions = data.tourCommissions;
        this.myDashboard = data.myDashboard;
        this.managementDashboard = data.managementDashboard;
    }

    toPlainObject() {
        return {
            currentUser: this.currentUser,
            activeRuleVersion: this.activeRuleVersion,
            allRuleVersions: this.allRuleVersions,
            employees: this.employees,
            toursFinancialReferences: this.toursFinancialReferences,
            tourCommissions: this.tourCommissions,
            myDashboard: this.myDashboard,
            managementDashboard: this.managementDashboard
        };
    }
}

