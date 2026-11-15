import {
    IEmployeeCommissionSummary,
    IEmployeeLeaveBalanceItem,
    IEmployeeLeaveRequestRecord,
    IEmployeeRecord,
    IEmployeeSalaryPaymentRecord
} from "@/other/interfaces";
import {
    EmployeeEmploymentStatus,
    EmployeeEmploymentType,
    EmployeeHalfDayPeriod,
    EmployeeLeaveStatus,
    EmployeeLeaveType,
    PerformanceRatingTier,
    SalaryPaymentMethod
} from "@/types/types";

export type EmployeeLeaveBalanceDTO = IEmployeeLeaveBalanceItem;
export type EmployeeCommissionSummaryDTO = IEmployeeCommissionSummary;
export type EmployeeHRDTO = IEmployeeRecord;
export type EmployeeLeaveRequestDTO = IEmployeeLeaveRequestRecord;
export type EmployeeSalaryPaymentDTO = IEmployeeSalaryPaymentRecord;

export interface UpdateEmployeeHRDTO {
    userId: string;
    employeeCode?: string;
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    supervisorId?: string | null;
    department?: string;
    designation?: string;
    employmentType?: EmployeeEmploymentType;
    employmentStatus?: EmployeeEmploymentStatus;
    joinDate?: string | null;
    nicOrPassport?: string | null;
    address?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    hrNotes?: string | null;

    // Compensation & Bank (Admin only, except bank/contact view)
    basicSalaryLkr?: number;
    fixedAllowancesLkr?: number;
    epfEligible?: boolean;
    epfNumber?: string | null;
    bankName?: string | null;
    bankBranch?: string | null;
    bankAccountNumber?: string | null;
    bankAccountHolder?: string | null;

    // Leave Quotas & Opening Balances (Admin only)
    annualLeaveQuota?: number;
    casualLeaveQuota?: number;
    sickLeaveQuota?: number;
    annualLeaveCarriedForward?: number;
    annualLeaveOpeningUsed?: number;
    casualLeaveOpeningUsed?: number;
    sickLeaveOpeningUsed?: number;

    // Commission Policy Settings (Admin only)
    commissionEligible?: boolean;
    defaultRatingTier?: PerformanceRatingTier;
    customCommissionCapUsd?: number | null;
    annualGpTargetUsd?: number | null;
    commissionNotes?: string | null;

    isActive?: boolean;
}

export interface CreateEmployeeLeaveRequestDTO {
    targetUserId?: string; // Optional: Admin can submit on behalf of an employee; defaults to logged-in user
    leaveType: EmployeeLeaveType;
    startDate: string;
    endDate: string;
    daysCount: number;
    isHalfDay?: boolean;
    halfDayPeriod?: EmployeeHalfDayPeriod | null;
    reason: string;
    handoverNotes?: string | null;
    coveringUserId?: string | null;
}

export interface ReviewEmployeeLeaveRequestDTO {
    leaveRequestId: string;
    decision: Extract<EmployeeLeaveStatus, "Approved" | "Rejected">;
    reviewerNotes?: string | null;
}

export interface CreateEmployeeSalaryPaymentDTO {
    targetUserId: string;
    salaryMonth: string; // 'YYYY-MM'
    paymentDate: string; // 'YYYY-MM-DD'
    basicSalaryLkr: number;
    fixedAllowancesLkr: number;
    additionsLkr?: number;
    epfEmployeeDeductionLkr?: number;
    otherDeductionsLkr?: number;
    paymentMethod: SalaryPaymentMethod;
    paymentReference?: string | null;
    bankAccountSnapshot?: string | null;
    slipStoragePath: string;
    slipFileName?: string | null;
    notes?: string | null;
    sendEmailToEmployee?: boolean;
}

export interface EmployeeHrWorkspaceDTO {
    isEligibleViewer: boolean;
    usingSqlTables: boolean;
    usingSalaryPaymentsSqlTable: boolean;
    currentYear: number;
    currentUser: {
        userId: string;
        name: string;
        email: string;
        role: string;
        roleLabel: string;
        roleRank: number;
        isAdmin: boolean;
        isFinance: boolean;
        canManagePayroll: boolean;
        canApproveJuniorLeaves: boolean;
    };
    summary: {
        totalActiveEmployees: number;
        adminsCount: number;
        supervisorsCount: number;
        agentsCount: number;
        onLeaveTodayCount: number;
        onLeaveTodayNames: string[];
        pendingApprovalsForMeCount: number;
        totalMonthlyFixedPayrollLkr: number | null; // Populated for Admin & Finance
        currentSalaryMonth: string;
        paidThisMonthCount: number;
        paidThisMonthTotalLkr: number | null;
    };
    employees: EmployeeHRDTO[];
    leaveRequests: EmployeeLeaveRequestDTO[];
    salaryPayments: EmployeeSalaryPaymentDTO[];
    supervisorOptions: Array<{
        userId: string;
        name: string;
        role: string;
        roleLabel: string;
        rank: number;
    }>;
}

