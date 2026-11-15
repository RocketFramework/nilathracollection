"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    AlertCircle,
    Award,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    DollarSign,
    Download,
    Edit3,
    ExternalLink,
    FileText,
    Lock,
    Mail,
    Plus,
    RefreshCw,
    Search,
    Send,
    ShieldCheck,
    Upload,
    UserCheck,
    Users,
    X,
    XCircle
} from "lucide-react";
import {
    cancelEmployeeLeaveRequestAction,
    getEmployeeHrWorkspaceAction,
    recordEmployeeSalaryPaymentAction,
    resendEmployeeSalarySlipEmailAction,
    reviewEmployeeLeaveRequestAction,
    submitEmployeeLeaveRequestAction,
    updateEmployeeHrProfileAction,
    uploadEmployeeSalarySlipAction
} from "@/actions/employee-hr.actions";
import {
    EmployeeHRDTO,
    EmployeeHrWorkspaceDTO,
    EmployeeLeaveRequestDTO,
    EmployeeSalaryPaymentDTO,
    UpdateEmployeeHRDTO
} from "@/dtos/employee-hr.dto";
import {
    EmployeeEmploymentStatus,
    EmployeeEmploymentType,
    EmployeeHalfDayPeriod,
    EmployeeLeaveType,
    PerformanceRatingTier,
    SalaryPaymentMethod
} from "@/types/types";
import {
    downloadStoredAttachment,
    viewStoredAttachment
} from "@/utils/accounting-documents-client";

const DEPARTMENTS = [
    "Management",
    "Management & Administration",
    "Operations & Concierge",
    "Sales & Tour Planning",
    "Client Experience & VIP Relations",
    "Vendor & Partner Relations",
    "Finance & Operations"
];

const EMPLOYMENT_TYPES: EmployeeEmploymentType[] = [
    "Full-Time",
    "Part-Time",
    "Probation",
    "Contract"
];

const EMPLOYMENT_STATUSES: EmployeeEmploymentStatus[] = [
    "Active",
    "Probation",
    "On Leave",
    "Suspended",
    "Resigned"
];

const RATING_TIER_LABELS: Record<PerformanceRatingTier, string> = {
    below: "Below Expectations (0.5x)",
    meets: "Meets Expectations (1.0x)",
    exceeds: "Exceeds Expectations (1.2x)",
    exceptional: "Exceptional (1.5x)"
};

function computeWorkingDaysInclusive(startIso: string, endIso: string): number {
    if (!startIso || !endIso || endIso < startIso) return 1;
    const start = new Date(`${startIso}T00:00:00`);
    const end = new Date(`${endIso}T00:00:00`);
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) {
            count += 1;
        }
        cur.setDate(cur.getDate() + 1);
    }
    return count > 0 ? count : 1;
}

function fmtLkr(val: number | null | undefined): string {
    if (val === null || val === undefined) return "—";
    return `LKR ${Number(val).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function fmtUsd(val: number | null | undefined): string {
    if (val === null || val === undefined) return "—";
    return `$${Number(val).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function fmtSalaryMonth(ym: string | null | undefined): string {
    if (!ym) return "—";
    const m = String(ym).match(/^(\d{4})-(\d{2})$/);
    if (!m) return ym;
    const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export default function EmployeeHrWorkspace({ fullPage = false }: { fullPage?: boolean }) {
    const [workspace, setWorkspace] = useState<EmployeeHrWorkspaceDTO | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [bannerMsg, setBannerMsg] = useState<{ type: "success" | "error"; text: string } | null>(
        null
    );

    const [activeTab, setActiveTab] = useState<
        "directory" | "leaves" | "payroll" | "compensation"
    >("directory");
    const [initializedDefaultTab, setInitializedDefaultTab] = useState<boolean>(false);

    // Directory filters
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Leave filters
    const [leaveFilter, setLeaveFilter] = useState<
        "all" | "needs_my_approval" | "mine" | "Approved" | "Rejected"
    >("all");

    // Payroll & Salary Slips filters
    const [payrollMonthFilter, setPayrollMonthFilter] = useState<string>("all");
    const [payrollSearch, setPayrollSearch] = useState<string>("");

    // HR Edit / View Modal State
    const [editingEmp, setEditingEmp] = useState<EmployeeHRDTO | null>(null);
    const [empModalTab, setEmpModalTab] = useState<"general" | "leave" | "salary" | "commission">(
        "general"
    );
    const [empForm, setEmpForm] = useState<UpdateEmployeeHRDTO | null>(null);
    const [savingEmp, setSavingEmp] = useState<boolean>(false);
    const [empModalError, setEmpModalError] = useState<string | null>(null);

    // Leave Request Modal State
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false);
    const [leaveTargetUserId, setLeaveTargetUserId] = useState<string>("");
    const [leaveType, setLeaveType] = useState<EmployeeLeaveType>("Annual");
    const [leaveIsHalfDay, setLeaveIsHalfDay] = useState<boolean>(false);
    const [leaveHalfDayPeriod, setLeaveHalfDayPeriod] =
        useState<EmployeeHalfDayPeriod>("Morning");
    const [leaveStartDate, setLeaveStartDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [leaveEndDate, setLeaveEndDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [leaveDaysCount, setLeaveDaysCount] = useState<string>("1");
    const [leaveCoveringUserId, setLeaveCoveringUserId] = useState<string>("");
    const [leaveReason, setLeaveReason] = useState<string>("");
    const [leaveHandoverNotes, setLeaveHandoverNotes] = useState<string>("");
    const [submittingLeave, setSubmittingLeave] = useState<boolean>(false);

    // Leave Approval / Rejection Modal State
    const [reviewingLeave, setReviewingLeave] = useState<{
        req: EmployeeLeaveRequestDTO;
        decision: "Approved" | "Rejected";
    } | null>(null);
    const [reviewerNotes, setReviewerNotes] = useState<string>("");
    const [submittingReview, setSubmittingReview] = useState<boolean>(false);

    // Salary Payment & Slip Upload Modal State (Admin & Finance)
    const nowDefaultYm = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    };
    const [isPaySalaryModalOpen, setIsPaySalaryModalOpen] = useState<boolean>(false);
    const [payTargetUserId, setPayTargetUserId] = useState<string>("");
    const [paySalaryMonth, setPaySalaryMonth] = useState<string>(nowDefaultYm);
    const [payDate, setPayDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
    const [payMethod, setPayMethod] = useState<SalaryPaymentMethod>("Bank Transfer");
    const [payReference, setPayReference] = useState<string>("");
    const [payBasicLkr, setPayBasicLkr] = useState<string>("0");
    const [payAllowancesLkr, setPayAllowancesLkr] = useState<string>("0");
    const [payAdditionsLkr, setPayAdditionsLkr] = useState<string>("0");
    const [payEpfDeductionLkr, setPayEpfDeductionLkr] = useState<string>("0");
    const [payOtherDeductionsLkr, setPayOtherDeductionsLkr] = useState<string>("0");
    const [payBankSnapshot, setPayBankSnapshot] = useState<string>("");
    const [payNotes, setPayNotes] = useState<string>("");
    const [paySlipFile, setPaySlipFile] = useState<File | null>(null);
    const [paySendEmail, setPaySendEmail] = useState<boolean>(true);
    const [payModalError, setPayModalError] = useState<string | null>(null);
    const [submittingSalary, setSubmittingSalary] = useState<boolean>(false);
    const [resendingPaymentId, setResendingPaymentId] = useState<string | null>(null);

    const loadWorkspace = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getEmployeeHrWorkspaceAction();
            if (!res.success || !res.data) {
                setError(res.error || "Unable to load Employee HR workspace.");
                return;
            }
            setWorkspace(res.data);
            if (!leaveTargetUserId && res.data.currentUser.userId) {
                setLeaveTargetUserId(res.data.currentUser.userId);
            }
            if (!initializedDefaultTab) {
                setInitializedDefaultTab(true);
                const isSelfInEmployees = res.data.employees.some(
                    (e) => e.userId === res.data!.currentUser.userId
                );
                if (
                    res.data.currentUser.isFinance &&
                    !res.data.currentUser.isAdmin &&
                    !isSelfInEmployees
                ) {
                    setActiveTab("payroll");
                }
            }
        } catch (err: any) {
            setError(err?.message || "Failed to load Employee HR workspace.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWorkspace();
    }, []);

    const selfEmployee = useMemo(() => {
        if (!workspace) return null;
        return workspace.employees.find((e) => e.userId === workspace.currentUser.userId) || null;
    }, [workspace]);

    const filteredEmployees = useMemo(() => {
        if (!workspace) return [];
        const q = searchQuery.trim().toLowerCase();
        return workspace.employees.filter((emp) => {
            if (roleFilter !== "all" && emp.role !== roleFilter) return false;
            if (statusFilter !== "all" && emp.employmentStatus !== statusFilter) return false;
            if (!q) return true;
            return (
                emp.fullName.toLowerCase().includes(q) ||
                emp.email.toLowerCase().includes(q) ||
                emp.employeeCode.toLowerCase().includes(q) ||
                emp.department.toLowerCase().includes(q) ||
                emp.designation.toLowerCase().includes(q) ||
                emp.roleLabel.toLowerCase().includes(q)
            );
        });
    }, [workspace, searchQuery, roleFilter, statusFilter]);

    const filteredLeaves = useMemo(() => {
        if (!workspace) return [];
        return workspace.leaveRequests.filter((lr) => {
            if (leaveFilter === "needs_my_approval") return lr.canCallerApproveOrReject;
            if (leaveFilter === "mine") return lr.userId === workspace.currentUser.userId;
            if (leaveFilter === "Approved") return lr.status === "Approved";
            if (leaveFilter === "Rejected") return lr.status === "Rejected";
            return true;
        });
    }, [workspace, leaveFilter]);

    const selectedLeaveEmployee = useMemo(() => {
        if (!workspace) return null;
        const targetId = leaveTargetUserId || workspace.currentUser.userId;
        return workspace.employees.find((e) => e.userId === targetId) || null;
    }, [workspace, leaveTargetUserId]);

    const availablePayrollMonths = useMemo(() => {
        const months = new Set<string>();
        if (workspace?.summary.currentSalaryMonth) {
            months.add(workspace.summary.currentSalaryMonth);
        }
        (workspace?.salaryPayments || []).forEach((sp) => {
            if (sp.salaryMonth) months.add(sp.salaryMonth);
        });
        return Array.from(months).sort((a, b) => b.localeCompare(a));
    }, [workspace]);

    const filteredSalaryPayments = useMemo(() => {
        if (!workspace) return [];
        const q = payrollSearch.trim().toLowerCase();
        return (workspace.salaryPayments || []).filter((sp) => {
            if (payrollMonthFilter !== "all" && sp.salaryMonth !== payrollMonthFilter) {
                return false;
            }
            if (!q) return true;
            return (
                sp.employeeName.toLowerCase().includes(q) ||
                sp.employeeCode.toLowerCase().includes(q) ||
                sp.employeeEmail.toLowerCase().includes(q) ||
                sp.salaryMonth.toLowerCase().includes(q) ||
                (sp.paymentReference || "").toLowerCase().includes(q)
            );
        });
    }, [workspace, payrollMonthFilter, payrollSearch]);

    const selectedPayEmployee = useMemo(() => {
        if (!workspace || !payTargetUserId) return null;
        return workspace.employees.find((e) => e.userId === payTargetUserId) || null;
    }, [workspace, payTargetUserId]);

    const applyEmployeeDefaultsToPayForm = (emp: EmployeeHRDTO) => {
        setPayTargetUserId(emp.userId);
        setPayBasicLkr(String(emp.basicSalaryLkr ?? 0));
        setPayAllowancesLkr(String(emp.fixedAllowancesLkr ?? 0));
        setPayAdditionsLkr("0");
        setPayEpfDeductionLkr("0");
        setPayOtherDeductionsLkr("0");
        const bankSnap = emp.bankName
            ? `${emp.bankName}${emp.bankBranch ? ` (${emp.bankBranch})` : ""}${emp.bankAccountNumber ? ` · ${emp.bankAccountNumber}` : ""}${emp.bankAccountHolder ? ` — ${emp.bankAccountHolder}` : ""}`
            : "";
        setPayBankSnapshot(bankSnap);
    };

    const openPaySalaryModalFor = (emp?: EmployeeHRDTO, monthOverride?: string) => {
        if (!workspace) return;
        const target =
            emp ||
            workspace.employees.find((e) => e.isActive && e.employmentStatus !== "Resigned") ||
            workspace.employees[0];
        if (!target) {
            alert("No eligible employees found to pay.");
            return;
        }
        setPayModalError(null);
        applyEmployeeDefaultsToPayForm(target);
        setPaySalaryMonth(monthOverride || workspace.summary.currentSalaryMonth || nowDefaultYm());
        setPayDate(new Date().toISOString().split("T")[0]);
        setPayMethod("Bank Transfer");
        setPayReference("");
        setPayNotes("");
        setPaySlipFile(null);
        setPaySendEmail(true);
        setIsPaySalaryModalOpen(true);
    };

    const handleSubmitSalaryPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setPayModalError(null);
        setBannerMsg(null);

        if (!payTargetUserId) {
            setPayModalError("Please select an employee.");
            return;
        }
        if (!paySlipFile) {
            setPayModalError("Please attach the salary payment / bank transfer slip (PDF or Image).");
            return;
        }

        const basic = Math.max(0, parseFloat(payBasicLkr) || 0);
        const allowances = Math.max(0, parseFloat(payAllowancesLkr) || 0);
        const additions = Math.max(0, parseFloat(payAdditionsLkr) || 0);
        const epfDed = Math.max(0, parseFloat(payEpfDeductionLkr) || 0);
        const otherDed = Math.max(0, parseFloat(payOtherDeductionsLkr) || 0);
        const net = basic + allowances + additions - epfDed - otherDed;

        if (net <= 0) {
            setPayModalError("Net salary paid amount must be greater than zero.");
            return;
        }

        setSubmittingSalary(true);
        try {
            const fd = new FormData();
            fd.append("file", paySlipFile);
            const uploadRes = await uploadEmployeeSalarySlipAction(fd);
            if (!uploadRes.success || !uploadRes.slipStoragePath) {
                setPayModalError(uploadRes.error || "Failed to upload payment slip.");
                return;
            }

            const recRes = await recordEmployeeSalaryPaymentAction({
                targetUserId: payTargetUserId,
                salaryMonth: paySalaryMonth,
                paymentDate: payDate,
                basicSalaryLkr: basic,
                fixedAllowancesLkr: allowances,
                additionsLkr: additions,
                epfEmployeeDeductionLkr: epfDed,
                otherDeductionsLkr: otherDed,
                paymentMethod: payMethod,
                paymentReference: payReference || null,
                bankAccountSnapshot: payBankSnapshot || null,
                slipStoragePath: uploadRes.slipStoragePath,
                slipFileName: uploadRes.slipFileName || paySlipFile.name,
                notes: payNotes || null,
                sendEmailToEmployee: paySendEmail
            });

            if (!recRes.success) {
                setPayModalError(recRes.error || "Failed to record salary payment.");
                return;
            }

            const empLabel = selectedPayEmployee?.fullName || "employee";
            setIsPaySalaryModalOpen(false);
            setActiveTab("payroll");

            if (paySendEmail) {
                if (recRes.emailSent) {
                    setBannerMsg({
                        type: "success",
                        text: `Recorded salary payment (${fmtSalaryMonth(paySalaryMonth)}) for ${empLabel}, uploaded slip, and emailed confirmation to ${selectedPayEmployee?.email}.`
                    });
                } else {
                    setBannerMsg({
                        type: "error",
                        text: `Salary payment & slip saved for ${empLabel}, but the email could not be sent (${recRes.emailError || "check email settings"}). You can click "Send / Resend Email" in the table below.`
                    });
                }
            } else {
                setBannerMsg({
                    type: "success",
                    text: `Recorded salary payment (${fmtSalaryMonth(paySalaryMonth)}) and uploaded slip for ${empLabel}.`
                });
            }

            await loadWorkspace();
        } finally {
            setSubmittingSalary(false);
        }
    };

    const handleResendSlipEmail = async (sp: EmployeeSalaryPaymentDTO) => {
        setResendingPaymentId(sp.id);
        setBannerMsg(null);
        try {
            const res = await resendEmployeeSalarySlipEmailAction(sp.id);
            if (!res.success) {
                setBannerMsg({
                    type: "error",
                    text: res.error || `Failed to send salary slip email to ${sp.employeeEmail}.`
                });
                return;
            }
            if (res.emailSent) {
                setBannerMsg({
                    type: "success",
                    text: `Sent salary slip confirmation email (${fmtSalaryMonth(sp.salaryMonth)}) to ${sp.employeeEmail}.`
                });
            } else {
                setBannerMsg({
                    type: "error",
                    text: `Could not deliver email to ${sp.employeeEmail}: ${res.emailError || "Email provider error"}`
                });
            }
            await loadWorkspace();
        } finally {
            setResendingPaymentId(null);
        }
    };

    const openEditEmployeeModal = (
        emp: EmployeeHRDTO,
        initialTab: "general" | "leave" | "salary" | "commission" = "general"
    ) => {
        setEmpModalError(null);
        setEditingEmp(emp);
        setEmpModalTab(initialTab);
        setEmpForm({
            userId: emp.userId,
            employeeCode: emp.employeeCode,
            firstName: emp.firstName,
            lastName: emp.lastName,
            phone: emp.phone || "",
            supervisorId: emp.supervisorId || "",
            department: emp.department,
            designation: emp.designation,
            employmentType: emp.employmentType,
            employmentStatus: emp.employmentStatus,
            joinDate: emp.joinDate || "",
            nicOrPassport: emp.nicOrPassport || "",
            address: emp.address || "",
            emergencyContactName: emp.emergencyContactName || "",
            emergencyContactPhone: emp.emergencyContactPhone || "",
            hrNotes: emp.hrNotes || "",
            basicSalaryLkr: emp.basicSalaryLkr ?? 0,
            fixedAllowancesLkr: emp.fixedAllowancesLkr ?? 0,
            epfEligible: emp.epfEligible,
            epfNumber: emp.epfNumber || "",
            bankName: emp.bankName || "",
            bankBranch: emp.bankBranch || "",
            bankAccountNumber: emp.bankAccountNumber || "",
            bankAccountHolder: emp.bankAccountHolder || "",
            annualLeaveQuota: emp.annualLeaveQuota,
            casualLeaveQuota: emp.casualLeaveQuota,
            sickLeaveQuota: emp.sickLeaveQuota,
            annualLeaveCarriedForward: emp.annualLeaveCarriedForward,
            annualLeaveOpeningUsed: emp.annualLeaveOpeningUsed,
            casualLeaveOpeningUsed: emp.casualLeaveOpeningUsed,
            sickLeaveOpeningUsed: emp.sickLeaveOpeningUsed,
            commissionEligible: emp.commission.commissionEligible,
            defaultRatingTier: emp.commission.defaultRatingTier,
            customCommissionCapUsd: emp.commission.customCapUsd,
            annualGpTargetUsd: emp.commission.annualGpTargetUsd,
            commissionNotes: emp.commission.commissionNotes || "",
            isActive: emp.isActive
        });
    };

    const handleSaveEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!empForm) return;
        setSavingEmp(true);
        setBannerMsg(null);
        setEmpModalError(null);
        try {
            const res = await updateEmployeeHrProfileAction(empForm);
            if (!res.success) {
                const msg = res.error || "Failed to save HR record.";
                setEmpModalError(msg);
                setBannerMsg({ type: "error", text: msg });
                return;
            }
            setBannerMsg({
                type: "success",
                text: `Saved HR profile for ${editingEmp?.fullName || "employee"}.`
            });
            setEditingEmp(null);
            setEmpForm(null);
            await loadWorkspace();
        } finally {
            setSavingEmp(false);
        }
    };

    const openLeaveModalFor = (userId?: string) => {
        const today = new Date().toISOString().split("T")[0];
        setLeaveTargetUserId(userId || workspace?.currentUser.userId || "");
        setLeaveType("Annual");
        setLeaveIsHalfDay(false);
        setLeaveHalfDayPeriod("Morning");
        setLeaveStartDate(today);
        setLeaveEndDate(today);
        setLeaveDaysCount("1");
        setLeaveCoveringUserId("");
        setLeaveReason("");
        setLeaveHandoverNotes("");
        setIsLeaveModalOpen(true);
    };

    const handleStartDateChange = (val: string) => {
        setLeaveStartDate(val);
        const nextEnd = leaveEndDate < val ? val : leaveEndDate;
        setLeaveEndDate(nextEnd);
        if (leaveIsHalfDay) {
            setLeaveDaysCount("0.5");
        } else {
            setLeaveDaysCount(String(computeWorkingDaysInclusive(val, nextEnd)));
        }
    };

    const handleEndDateChange = (val: string) => {
        setLeaveEndDate(val);
        if (leaveIsHalfDay) {
            setLeaveDaysCount("0.5");
        } else {
            setLeaveDaysCount(String(computeWorkingDaysInclusive(leaveStartDate, val)));
        }
    };

    const handleSubmitLeaveRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingLeave(true);
        setBannerMsg(null);
        try {
            const res = await submitEmployeeLeaveRequestAction({
                targetUserId: leaveTargetUserId || undefined,
                leaveType,
                startDate: leaveStartDate,
                endDate: leaveIsHalfDay ? leaveStartDate : leaveEndDate,
                daysCount: leaveIsHalfDay ? 0.5 : parseFloat(leaveDaysCount) || 1,
                isHalfDay: leaveIsHalfDay,
                halfDayPeriod: leaveIsHalfDay ? leaveHalfDayPeriod : null,
                reason: leaveReason,
                handoverNotes: leaveHandoverNotes || null,
                coveringUserId: leaveCoveringUserId || null
            });

            if (!res.success) {
                alert(res.error || "Failed to submit leave request.");
                return;
            }

            setIsLeaveModalOpen(false);
            setActiveTab("leaves");
            setBannerMsg({
                type: "success",
                text: "Leave request submitted for approval."
            });
            await loadWorkspace();
        } finally {
            setSubmittingLeave(false);
        }
    };

    const handleConfirmReviewLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewingLeave) return;
        setSubmittingReview(true);
        setBannerMsg(null);
        try {
            const res = await reviewEmployeeLeaveRequestAction({
                leaveRequestId: reviewingLeave.req.id,
                decision: reviewingLeave.decision,
                reviewerNotes: reviewerNotes || null
            });
            if (!res.success) {
                alert(res.error || "Failed to process leave review.");
                return;
            }
            setBannerMsg({
                type: "success",
                text: `Leave request for ${reviewingLeave.req.employeeName} marked as ${reviewingLeave.decision}.`
            });
            setReviewingLeave(null);
            setReviewerNotes("");
            await loadWorkspace();
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleCancelLeave = async (req: EmployeeLeaveRequestDTO) => {
        if (!window.confirm(`Cancel pending ${req.leaveType} leave request (${req.startDate})?`)) {
            return;
        }
        const res = await cancelEmployeeLeaveRequestAction(req.id);
        if (!res.success) {
            alert(res.error || "Failed to cancel leave request.");
            return;
        }
        setBannerMsg({ type: "success", text: "Pending leave request cancelled." });
        await loadWorkspace();
    };

    if (loading && !workspace) {
        return (
            <div
                id="employee-hr-section"
                className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-8 text-center text-neutral-500"
            >
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#D4AF37] mx-auto mb-3" />
                Loading Office HR &amp; Employee Management...
            </div>
        );
    }

    if (error) {
        return (
            <div
                id="employee-hr-section"
                className="bg-red-50 rounded-2xl border border-red-200 p-6 text-sm text-red-700"
            >
                {error}
            </div>
        );
    }

    if (!workspace || !workspace.isEligibleViewer) {
        if (!fullPage) return null;
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-10 text-center max-w-xl mx-auto mt-10">
                <ShieldCheck className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-[#2B2B2B] font-playfair">
                    Office HR &amp; Employee Management
                </h2>
                <p className="text-sm text-neutral-500 mt-1">
                    Access to Office HR &amp; Employee Management is restricted to Admin and Office Staff roles.
                </p>
                <Link
                    href="/admin"
                    className="inline-block mt-4 px-4 py-2 rounded-xl bg-[#2B2B2B] text-[#D4AF37] text-xs font-bold hover:bg-black transition-colors"
                >
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    const { currentUser, summary, currentYear } = workspace;

    return (
        <section
            id="employee-hr-section"
            className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden"
        >
            {/* Header Bar */}
            <div className="px-6 py-5 border-b border-[#E5E7EB] bg-gradient-to-r from-[#2B2B2B] to-[#3A3A3A] text-white flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <Building2 className="w-5 h-5 text-[#D4AF37]" />
                        <h2 className="text-xl font-bold font-playfair tracking-wide">
                            Office HR &amp; Employee Management
                        </h2>
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                            {currentYear} Leave &amp; Payroll Cycle
                        </span>
                    </div>
                    <p className="text-xs text-neutral-300 mt-1">
                        Centralized employee records (all staff roles excluding Finance &amp; Tourists), Annual / Casual / Sick leave balances, hierarchical approvals, salaries, and commission policies.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {currentUser.isAdmin && (
                        <Link
                            href="/admin/user-management"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-colors"
                        >
                            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                            User &amp; Role Management
                        </Link>
                    )}
                    {currentUser.isAdmin ? (
                        workspace.employees.length > 0 && (
                            <button
                                type="button"
                                onClick={() =>
                                    openEditEmployeeModal(
                                        workspace.employees.find((e) => e.userId !== currentUser.userId) ||
                                            selfEmployee ||
                                            workspace.employees[0],
                                        "general"
                                    )
                                }
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-colors cursor-pointer"
                            >
                                <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                                Edit Employee HR Profile
                            </button>
                        )
                    ) : (
                        selfEmployee && (
                            <button
                                type="button"
                                onClick={() => openEditEmployeeModal(selfEmployee, "general")}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-colors cursor-pointer"
                            >
                                <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                                My HR Profile
                            </button>
                        )
                    )}
                    {currentUser.canManagePayroll && workspace.employees.length > 0 && (
                        <button
                            type="button"
                            onClick={() => openPaySalaryModalFor()}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            Pay Salary &amp; Upload Slip
                        </button>
                    )}
                    {(selfEmployee || currentUser.isAdmin) && (
                        <button
                            type="button"
                            onClick={() => openLeaveModalFor(currentUser.userId)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#B3932F] text-[#2B2B2B] text-xs font-bold shadow-sm transition-colors cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            Apply for Leave
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={loadWorkspace}
                        title="Sync users & refresh HR records"
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors cursor-pointer"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {(!workspace.usingSqlTables || !workspace.usingSalaryPaymentsSqlTable) &&
                currentUser.canManagePayroll && (
                    <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
                        <span>
                            <strong>Database Migration Available:</strong> Salary payments &amp; HR records are active in safe fallback storage. Run{" "}
                            <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-[11px]">
                                {!workspace.usingSqlTables
                                    ? "data/migrations/employee_hr_management.sql"
                                    : "data/migrations/employee_salary_payments.sql"}
                            </code>{" "}
                            in Supabase SQL Editor to activate dedicated SQL persistence (existing records will auto-migrate).
                        </span>
                    </div>
                )}

            {bannerMsg && (
                <div
                    className={`px-6 py-3 text-xs font-semibold flex items-center justify-between border-b ${
                        bannerMsg.type === "success"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                    }`}
                >
                    <span>{bannerMsg.text}</span>
                    <button
                        type="button"
                        onClick={() => setBannerMsg(null)}
                        className="text-neutral-500 hover:text-neutral-800 font-bold"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* KPI Strip */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#FAF9F6] border-b border-[#E5E7EB]">
                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
                    <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                        <span>Office Employees</span>
                        <Users className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <p className="text-2xl font-bold text-[#2B2B2B] mt-1.5">
                        {summary.totalActiveEmployees}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-1">
                        {summary.adminsCount} Admin &middot; {summary.supervisorsCount} Supervisor &middot;{" "}
                        {summary.agentsCount} Agent
                    </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
                    <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                        <span>My Leave Remaining</span>
                        <Calendar className="w-4 h-4 text-emerald-700" />
                    </div>
                    {selfEmployee ? (
                        <>
                            <div className="flex items-baseline gap-3 mt-1.5">
                                <span className="text-sm font-bold text-emerald-800">
                                    Ann: {selfEmployee.leaveBalances.annual.remaining}/
                                    {selfEmployee.leaveBalances.annual.quota}
                                </span>
                                <span className="text-sm font-bold text-blue-800">
                                    Cas: {selfEmployee.leaveBalances.casual.remaining}/
                                    {selfEmployee.leaveBalances.casual.quota}
                                </span>
                                <span className="text-sm font-bold text-amber-800">
                                    Sick: {selfEmployee.leaveBalances.sick.remaining}/
                                    {selfEmployee.leaveBalances.sick.quota}
                                </span>
                            </div>
                            <p className="text-[11px] text-neutral-500 mt-1">
                                Days available for {currentYear}
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-neutral-400 mt-2">No personal quota record</p>
                    )}
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
                    <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                        <span>On Leave Today</span>
                        <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-2xl font-bold text-[#2B2B2B] mt-1.5">
                        {summary.onLeaveTodayCount}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-1 truncate">
                        {summary.onLeaveTodayCount > 0
                            ? summary.onLeaveTodayNames.join(", ")
                            : "Full office team available today"}
                    </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
                    <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                        <span>
                            {currentUser.canManagePayroll
                                ? `${fmtSalaryMonth(summary.currentSalaryMonth)} Payroll`
                                : "Leave Approvals Queue"}
                        </span>
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    </div>
                    {currentUser.canManagePayroll ? (
                        <>
                            <p className="text-lg font-bold text-[#2B2B2B] font-mono mt-1.5">
                                {fmtLkr(summary.paidThisMonthTotalLkr)}{" "}
                                <span className="text-xs font-sans font-normal text-neutral-500">
                                    paid ({summary.paidThisMonthCount}/{summary.totalActiveEmployees})
                                </span>
                            </p>
                            <p className="text-[11px] mt-1">
                                {summary.pendingApprovalsForMeCount > 0 ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveTab("leaves");
                                            setLeaveFilter("needs_my_approval");
                                        }}
                                        className="text-amber-700 font-bold underline cursor-pointer"
                                    >
                                        {summary.pendingApprovalsForMeCount} leave request(s) awaiting approval
                                    </button>
                                ) : (
                                    <span className="text-neutral-500">
                                        Fixed Target: {fmtLkr(summary.totalMonthlyFixedPayrollLkr)}
                                    </span>
                                )}
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-2xl font-bold text-[#2B2B2B] mt-1.5">
                                {summary.pendingApprovalsForMeCount}
                            </p>
                            <p className="text-[11px] text-neutral-500 mt-1">
                                {currentUser.canApproveJuniorLeaves
                                    ? "Junior / team leave requests awaiting your review"
                                    : "Approvals handled by Senior Agents, Supervisors & Admins"}
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-4 bg-white">
                <div className="flex space-x-6 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab("directory")}
                        className={`py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                            activeTab === "directory"
                                ? "border-[#D4AF37] text-[#2B2B2B]"
                                : "border-transparent text-neutral-500 hover:text-[#2B2B2B]"
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Employees Table ({workspace.employees.length})
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("leaves")}
                        className={`py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                            activeTab === "leaves"
                                ? "border-[#D4AF37] text-[#2B2B2B]"
                                : "border-transparent text-neutral-500 hover:text-[#2B2B2B]"
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Leave Requests &amp; Approvals
                        {summary.pendingApprovalsForMeCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 border border-amber-300">
                                {summary.pendingApprovalsForMeCount} Pending
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("payroll")}
                        className={`py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                            activeTab === "payroll"
                                ? "border-[#D4AF37] text-[#2B2B2B]"
                                : "border-transparent text-neutral-500 hover:text-[#2B2B2B]"
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        {currentUser.canManagePayroll
                            ? `Salary Payments & Slips (${workspace.salaryPayments.length})`
                            : `My Salary Slips (${workspace.salaryPayments.length})`}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("compensation")}
                        className={`py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                            activeTab === "compensation"
                                ? "border-[#D4AF37] text-[#2B2B2B]"
                                : "border-transparent text-neutral-500 hover:text-[#2B2B2B]"
                        }`}
                    >
                        <DollarSign className="w-4 h-4" />
                        {currentUser.canManagePayroll
                            ? "Salary Structure & Commissions"
                            : "My Salary & Commission Policy"}
                    </button>
                </div>

                {currentUser.isAdmin && (
                    <Link
                        href="/admin/user-management"
                        className="text-xs font-bold text-[#B3932F] hover:underline py-2"
                    >
                        + Create / Manage System Login Accounts →
                    </Link>
                )}
            </div>

            {/* TAB 1: EMPLOYEES DIRECTORY & HR RECORDS */}
            {activeTab === "directory" && (
                <div className="p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="relative flex-1 min-w-[240px] max-w-md">
                            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, code (EMP-001), role, email, department..."
                                className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#D4AF37]"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none"
                            >
                                <option value="all">All Employee Roles</option>
                                <option value="admin">Admin</option>
                                <option value="principal_supervisor">Principal Supervisor</option>
                                <option value="executive_supervisor">Executive Supervisor</option>
                                <option value="senior_supervisor">Senior Supervisor</option>
                                <option value="agent_supervisor">Supervisor</option>
                                <option value="executive_agent">Executive Agent</option>
                                <option value="senior_agent">Senior Agent</option>
                                <option value="agent">Agent</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none"
                            >
                                <option value="all">All Statuses</option>
                                {EMPLOYMENT_STATUSES.map((st) => (
                                    <option key={st} value={st}>
                                        {st}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead className="bg-[#F9FAFB] text-[#6B7280] uppercase tracking-wider text-[10px] font-bold border-b border-[#E5E7EB]">
                                <tr>
                                    <th className="px-4 py-3.5">Employee</th>
                                    <th className="px-4 py-3.5">Role &amp; Reporting Line</th>
                                    <th className="px-4 py-3.5">Department &amp; Status</th>
                                    <th className="px-4 py-3.5">Leave Remaining (Days)</th>
                                    <th className="px-4 py-3.5">Monthly Salary</th>
                                    <th className="px-4 py-3.5">Commission Policy</th>
                                    <th className="px-4 py-3.5 text-right sticky right-0 bg-[#F9FAFB] z-10 shadow-[-6px_0_10px_-6px_rgba(0,0,0,0.08)]">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E7EB]">
                                {filteredEmployees.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-8 text-center text-neutral-500 italic"
                                        >
                                            No employees match the selected filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEmployees.map((emp) => {
                                        const isSelf = emp.userId === currentUser.userId;
                                        const canAdminEditEmp = Boolean(
                                            currentUser.isAdmin || emp.canCallerEditHrMaster
                                        );
                                        const canOpenEmpModal = canAdminEditEmp || isSelf;
                                        return (
                                            <tr
                                                key={emp.id}
                                                className="group hover:bg-neutral-50/70 transition-colors"
                                            >
                                                <td className="px-4 py-3.5">
                                                    <div
                                                        onClick={
                                                            canOpenEmpModal
                                                                ? () => openEditEmployeeModal(emp, "general")
                                                                : undefined
                                                        }
                                                        className={`flex items-center gap-3 ${
                                                            canOpenEmpModal ? "cursor-pointer" : ""
                                                        }`}
                                                        title={
                                                            canAdminEditEmp
                                                                ? `Click to edit ${emp.fullName}'s HR Profile`
                                                                : undefined
                                                        }
                                                    >
                                                        <div className="w-9 h-9 rounded-full bg-[#2B2B2B] text-[#D4AF37] flex items-center justify-center font-bold text-xs shrink-0">
                                                            {emp.fullName.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                                                                    {emp.employeeCode}
                                                                </span>
                                                                <span
                                                                    className={`font-bold text-[#2B2B2B] text-xs ${
                                                                        canOpenEmpModal
                                                                            ? "hover:underline hover:text-[#B3932F]"
                                                                            : ""
                                                                    }`}
                                                                >
                                                                    {emp.fullName}
                                                                </span>
                                                                {isSelf && (
                                                                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#D4AF37]/20 text-[#8A6D1C]">
                                                                        YOU
                                                                    </span>
                                                                )}
                                                                {emp.isOnLeaveToday && (
                                                                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-200">
                                                                        ON LEAVE TODAY
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-[11px] text-neutral-500 mt-0.5">
                                                                {emp.email}
                                                                {emp.phone ? ` · ${emp.phone}` : ""}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    <span
                                                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            emp.role === "admin"
                                                                ? "bg-purple-100 text-purple-800"
                                                                : emp.roleRank >= 4
                                                                  ? "bg-indigo-100 text-indigo-800"
                                                                  : emp.roleRank >= 2
                                                                    ? "bg-blue-100 text-blue-800"
                                                                    : "bg-emerald-100 text-emerald-800"
                                                        }`}
                                                    >
                                                        {emp.roleLabel}
                                                    </span>
                                                    <div className="text-[11px] text-neutral-500 mt-1">
                                                        {emp.supervisorName ? (
                                                            <>
                                                                Reports to:{" "}
                                                                <span className="font-semibold text-neutral-700">
                                                                    {emp.supervisorName}
                                                                </span>
                                                            </>
                                                        ) : emp.role === "admin" ? (
                                                            "Board / Executive"
                                                        ) : (
                                                            "Direct to Admin"
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    <div className="font-semibold text-neutral-800">
                                                        {emp.designation}
                                                    </div>
                                                    <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                                                        <span>{emp.department}</span>
                                                        <span>&middot;</span>
                                                        <span
                                                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                                emp.employmentStatus === "Active"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : emp.employmentStatus === "On Leave"
                                                                      ? "bg-amber-100 text-amber-800"
                                                                      : emp.employmentStatus === "Probation"
                                                                        ? "bg-blue-100 text-blue-800"
                                                                        : "bg-neutral-200 text-neutral-700"
                                                            }`}
                                                        >
                                                            {emp.employmentStatus}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span
                                                            title="Annual Leave Remaining / Quota"
                                                            className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] font-bold"
                                                        >
                                                            Ann {emp.leaveBalances.annual.remaining}/
                                                            {emp.leaveBalances.annual.quota}
                                                        </span>
                                                        <span
                                                            title="Casual Leave Remaining / Quota"
                                                            className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono text-[10px] font-bold"
                                                        >
                                                            Cas {emp.leaveBalances.casual.remaining}/
                                                            {emp.leaveBalances.casual.quota}
                                                        </span>
                                                        <span
                                                            title="Sick Leave Remaining / Quota"
                                                            className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px] font-bold"
                                                        >
                                                            Sick {emp.leaveBalances.sick.remaining}/
                                                            {emp.leaveBalances.sick.quota}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    {emp.canCallerViewCompensation ? (
                                                        <div>
                                                            <span className="font-mono font-bold text-neutral-800">
                                                                {fmtLkr(emp.totalFixedMonthlyLkr)}
                                                            </span>
                                                            <span className="block text-[10px] text-neutral-500">
                                                                Basic: {fmtLkr(emp.basicSalaryLkr)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400">
                                                            <Lock className="w-3 h-3" /> Confidential
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    {emp.commission.commissionEligible ? (
                                                        <div>
                                                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                                                {emp.commission.appliedMultiplier}x &middot; Cap{" "}
                                                                {emp.commission.effectiveCapUsd
                                                                    ? `$${emp.commission.effectiveCapUsd}`
                                                                    : "Uncapped"}
                                                            </span>
                                                            {emp.canCallerViewCompensation && (
                                                                <span className="block text-[10px] text-neutral-500 mt-0.5 font-mono">
                                                                    Earned:{" "}
                                                                    {fmtUsd(
                                                                        emp.commission.earnedApprovedAndPaidUsd
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] text-neutral-400">
                                                            Fixed Salary Only
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3.5 text-right sticky right-0 bg-white group-hover:bg-neutral-50 z-10 shadow-[-6px_0_10px_-6px_rgba(0,0,0,0.08)]">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        {currentUser.canManagePayroll && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openPaySalaryModalFor(emp)}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
                                                            >
                                                                <DollarSign className="w-3 h-3" />
                                                                Pay Salary
                                                            </button>
                                                        )}
                                                        {canOpenEmpModal && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openEditEmployeeModal(emp, "general")
                                                                }
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2B2B2B] hover:bg-black text-[#D4AF37] text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
                                                            >
                                                                <Edit3 className="w-3 h-3" />
                                                                {canAdminEditEmp
                                                                    ? "Edit HR Profile"
                                                                    : "My Details"}
                                                            </button>
                                                        )}
                                                        {(currentUser.isAdmin || isSelf) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openLeaveModalFor(emp.userId)}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:border-[#D4AF37] text-neutral-700 text-[11px] font-semibold transition-colors cursor-pointer"
                                                            >
                                                                <Calendar className="w-3 h-3 text-[#B3932F]" />
                                                                Leave
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: LEAVE REQUESTS & HIERARCHICAL APPROVALS */}
            {activeTab === "leaves" && (
                <div className="p-6 space-y-4">
                    <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-neutral-700">
                            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>
                                <strong>Leave Approval Authority:</strong> Any <strong>Admin</strong> can approve all leave requests, and any senior role (e.g.{" "}
                                <strong>Senior Agent</strong>, <strong>Executive Agent</strong>,{" "}
                                <strong>Supervisor</strong>) can approve leave requests for junior roles (e.g.{" "}
                                <strong>Agents</strong>) or reporting staff.
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => openLeaveModalFor(currentUser.userId)}
                            className="px-3 py-1.5 rounded-lg bg-[#2B2B2B] text-white font-bold text-xs hover:bg-black cursor-pointer"
                        >
                            + New Leave Request
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {[
                            { id: "all", label: `All Visible (${workspace.leaveRequests.length})` },
                            {
                                id: "needs_my_approval",
                                label: `Awaiting My Approval (${summary.pendingApprovalsForMeCount})`
                            },
                            { id: "mine", label: "My Requests" },
                            { id: "Approved", label: "Approved" },
                            { id: "Rejected", label: "Rejected" }
                        ].map((pill) => (
                            <button
                                key={pill.id}
                                type="button"
                                onClick={() => setLeaveFilter(pill.id as any)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                    leaveFilter === pill.id
                                        ? "bg-[#2B2B2B] text-[#D4AF37]"
                                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                                }`}
                            >
                                {pill.label}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead className="bg-[#F9FAFB] text-[#6B7280] uppercase tracking-wider text-[10px] font-bold border-b border-[#E5E7EB]">
                                <tr>
                                    <th className="px-4 py-3.5">Employee</th>
                                    <th className="px-4 py-3.5">Leave Type</th>
                                    <th className="px-4 py-3.5">Dates &amp; Duration</th>
                                    <th className="px-4 py-3.5">Reason &amp; Handover</th>
                                    <th className="px-4 py-3.5">Status &amp; Audit</th>
                                    <th className="px-4 py-3.5 text-right">Approval Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E7EB]">
                                {filteredLeaves.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-8 text-center text-neutral-500 italic"
                                        >
                                            No leave requests found for this filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLeaves.map((lr) => (
                                        <tr key={lr.id} className="hover:bg-neutral-50/70">
                                            <td className="px-4 py-3.5">
                                                <div className="font-bold text-[#2B2B2B]">
                                                    {lr.employeeName}
                                                </div>
                                                <div className="text-[10px] text-neutral-500">
                                                    {lr.employeeCode} &middot; {lr.employeeRoleLabel}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                        lr.leaveType === "Annual"
                                                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                            : lr.leaveType === "Casual"
                                                              ? "bg-blue-50 text-blue-800 border-blue-200"
                                                              : "bg-amber-50 text-amber-800 border-amber-200"
                                                    }`}
                                                >
                                                    {lr.leaveType} Leave
                                                </span>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <div className="font-mono font-bold text-neutral-800">
                                                    {lr.startDate === lr.endDate
                                                        ? lr.startDate
                                                        : `${lr.startDate} → ${lr.endDate}`}
                                                </div>
                                                <div className="text-[10px] text-neutral-500">
                                                    {lr.daysCount} {lr.daysCount === 1 ? "day" : "days"}
                                                    {lr.isHalfDay && lr.halfDayPeriod
                                                        ? ` (Half Day — ${lr.halfDayPeriod})`
                                                        : ""}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3.5 max-w-xs whitespace-normal">
                                                <p className="text-neutral-800 font-medium">{lr.reason}</p>
                                                {lr.coveringUserName && (
                                                    <p className="text-[10px] text-neutral-500 mt-0.5">
                                                        Covering: <strong>{lr.coveringUserName}</strong>
                                                    </p>
                                                )}
                                                {lr.handoverNotes && (
                                                    <p className="text-[10px] text-neutral-500 italic mt-0.5">
                                                        Handover: {lr.handoverNotes}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        lr.status === "Approved"
                                                            ? "bg-green-100 text-green-800"
                                                            : lr.status === "Rejected"
                                                              ? "bg-red-100 text-red-800"
                                                              : lr.status === "Cancelled"
                                                                ? "bg-neutral-200 text-neutral-600"
                                                                : "bg-amber-100 text-amber-800"
                                                    }`}
                                                >
                                                    {lr.status}
                                                </span>
                                                {lr.reviewedByName && (
                                                    <div className="text-[10px] text-neutral-500 mt-1">
                                                        By <strong>{lr.reviewedByName}</strong>
                                                        {lr.reviewedByRole ? ` (${lr.reviewedByRole})` : ""}
                                                        {lr.reviewerNotes ? ` — "${lr.reviewerNotes}"` : ""}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    {lr.canCallerApproveOrReject && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setReviewingLeave({
                                                                        req: lr,
                                                                        decision: "Approved"
                                                                    });
                                                                    setReviewerNotes("");
                                                                }}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold cursor-pointer"
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                Approve
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setReviewingLeave({
                                                                        req: lr,
                                                                        decision: "Rejected"
                                                                    });
                                                                    setReviewerNotes("");
                                                                }}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold cursor-pointer"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" />
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {lr.canCallerCancel && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCancelLeave(lr)}
                                                            className="px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-600 text-[11px] font-semibold cursor-pointer"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 3: SALARY PAYMENTS, UPLOADED SLIPS & EMAIL DISPATCH */}
            {activeTab === "payroll" && (() => {
                const targetStatusMonth =
                    payrollMonthFilter !== "all"
                        ? payrollMonthFilter
                        : summary.currentSalaryMonth;
                const paidUserIdsForMonth = new Set(
                    workspace.salaryPayments
                        .filter((sp) => sp.salaryMonth === targetStatusMonth)
                        .map((sp) => sp.userId)
                );
                const unpaidActiveEmployees = workspace.employees.filter(
                    (emp) =>
                        emp.isActive &&
                        emp.employmentStatus !== "Resigned" &&
                        !paidUserIdsForMonth.has(emp.userId)
                );

                return (
                    <div className="p-6 space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-bold text-[#2B2B2B]">
                                    {currentUser.canManagePayroll
                                        ? "Employee Salary Payments, Uploaded Bank Slips & Email Dispatch"
                                        : "My Recorded Salary Payments & Downloadable Slips"}
                                </h3>
                                <p className="text-xs text-neutral-500">
                                    {currentUser.canManagePayroll
                                        ? "Record employee salary transfers, attach official payment slips, and automatically notify employees via email."
                                        : "View your processed monthly salary disbursements and download attached payment slips."}
                                </p>
                            </div>

                            {currentUser.canManagePayroll && workspace.employees.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        openPaySalaryModalFor(
                                            unpaidActiveEmployees[0] || workspace.employees[0],
                                            payrollMonthFilter !== "all"
                                                ? payrollMonthFilter
                                                : undefined
                                        )
                                    }
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors"
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    + Record Salary Payment &amp; Upload Slip
                                </button>
                            )}
                        </div>

                        {/* Monthly Unpaid Quick-Action Strip for Admin & Finance */}
                        {currentUser.canManagePayroll && workspace.employees.length > 0 && (
                            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-2.5">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <span className="font-bold text-[#2B2B2B]">
                                        Payroll Status for {fmtSalaryMonth(targetStatusMonth)}:{" "}
                                        <span className="text-emerald-700">
                                            {paidUserIdsForMonth.size} Paid
                                        </span>{" "}
                                        &middot;{" "}
                                        <span
                                            className={
                                                unpaidActiveEmployees.length > 0
                                                    ? "text-amber-700"
                                                    : "text-neutral-500"
                                            }
                                        >
                                            {unpaidActiveEmployees.length} Pending Payment
                                        </span>
                                    </span>
                                    <span className="text-[11px] text-neutral-500">
                                        Click an unpaid employee below to pre-fill their salary &amp; upload their bank slip
                                    </span>
                                </div>

                                {unpaidActiveEmployees.length === 0 ? (
                                    <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4" />
                                        All active employees have recorded salary payments for{" "}
                                        {fmtSalaryMonth(targetStatusMonth)}.
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {unpaidActiveEmployees.map((emp) => (
                                            <button
                                                key={emp.id}
                                                type="button"
                                                onClick={() =>
                                                    openPaySalaryModalFor(emp, targetStatusMonth)
                                                }
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 border border-neutral-200 hover:border-emerald-300 text-xs text-neutral-800 transition-colors cursor-pointer shadow-2xs"
                                            >
                                                <span className="font-mono text-[10px] font-bold text-[#B3932F]">
                                                    {emp.employeeCode}
                                                </span>
                                                <span className="font-semibold">{emp.fullName}</span>
                                                <span className="text-[10px] font-mono text-neutral-500">
                                                    ({fmtLkr(emp.totalFixedMonthlyLkr)})
                                                </span>
                                                <span className="text-[10px] font-bold text-emerald-700 ml-1">
                                                    Pay →
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Filter Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            {currentUser.canManagePayroll ? (
                                <div className="relative flex-1 min-w-[240px] max-w-md">
                                    <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={payrollSearch}
                                        onChange={(e) => setPayrollSearch(e.target.value)}
                                        placeholder="Search by employee name, code, email, or bank reference..."
                                        className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#D4AF37]"
                                    />
                                </div>
                            ) : (
                                <div />
                            )}

                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-neutral-600">
                                    Salary Period:
                                </label>
                                <select
                                    value={payrollMonthFilter}
                                    onChange={(e) => setPayrollMonthFilter(e.target.value)}
                                    className="px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none"
                                >
                                    <option value="all">All Recorded Months</option>
                                    {availablePayrollMonths.map((ym) => (
                                        <option key={ym} value={ym}>
                                            {fmtSalaryMonth(ym)} ({ym})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Salary Payments & Uploaded Slips Table */}
                        <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-[#F9FAFB] text-[#6B7280] uppercase tracking-wider text-[10px] font-bold border-b border-[#E5E7EB]">
                                    <tr>
                                        <th className="px-4 py-3.5">Employee</th>
                                        <th className="px-4 py-3.5">Salary Period</th>
                                        <th className="px-4 py-3.5">Paid Date &amp; Method</th>
                                        <th className="px-4 py-3.5 text-right">Breakdown (LKR)</th>
                                        <th className="px-4 py-3.5 text-right">Net Paid (LKR)</th>
                                        <th className="px-4 py-3.5">Uploaded Slip</th>
                                        <th className="px-4 py-3.5">Email Notification</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E7EB]">
                                    {filteredSalaryPayments.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-6 py-10 text-center text-neutral-500 italic"
                                            >
                                                No salary payments recorded for this filter yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSalaryPayments.map((sp) => {
                                            const totalDed =
                                                Number(sp.epfEmployeeDeductionLkr || 0) +
                                                Number(sp.otherDeductionsLkr || 0);
                                            const isResending = resendingPaymentId === sp.id;
                                            return (
                                                <tr key={sp.id} className="hover:bg-neutral-50/70">
                                                    <td className="px-4 py-3.5">
                                                        <div className="font-bold text-[#2B2B2B]">
                                                            {sp.employeeName}
                                                        </div>
                                                        <div className="text-[10px] text-neutral-500">
                                                            {sp.employeeCode} &middot; {sp.employeeRoleLabel}
                                                        </div>
                                                        <div className="text-[10px] text-neutral-400">
                                                            {sp.employeeEmail}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3.5">
                                                        <span className="px-2.5 py-1 rounded-lg bg-[#FAF9F6] border border-[#E5E7EB] font-bold text-[#2B2B2B]">
                                                            {fmtSalaryMonth(sp.salaryMonth)}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-3.5">
                                                        <div className="font-mono font-semibold text-neutral-800">
                                                            {sp.paymentDate}
                                                        </div>
                                                        <div className="text-[10px] text-neutral-500">
                                                            {sp.paymentMethod}
                                                            {sp.paymentReference
                                                                ? ` · Ref: ${sp.paymentReference}`
                                                                : ""}
                                                        </div>
                                                        {sp.bankAccountSnapshot && (
                                                            <div className="text-[10px] text-neutral-400 truncate max-w-[200px]">
                                                                {sp.bankAccountSnapshot}
                                                            </div>
                                                        )}
                                                        {sp.paidByName && (
                                                            <div className="text-[10px] text-neutral-400 mt-0.5">
                                                                By {sp.paidByName}
                                                                {sp.paidByRole ? ` (${sp.paidByRole})` : ""}
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3.5 text-right font-mono text-[11px] text-neutral-600">
                                                        <div>Basic: {fmtLkr(sp.basicSalaryLkr)}</div>
                                                        <div>Allow: {fmtLkr(sp.fixedAllowancesLkr)}</div>
                                                        {sp.additionsLkr > 0 && (
                                                            <div className="text-emerald-700">
                                                                + Add: {fmtLkr(sp.additionsLkr)}
                                                            </div>
                                                        )}
                                                        {totalDed > 0 && (
                                                            <div className="text-red-600">
                                                                - Ded: {fmtLkr(totalDed)}
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3.5 text-right font-mono">
                                                        <div className="text-sm font-bold text-emerald-800">
                                                            {fmtLkr(sp.netPaidLkr)}
                                                        </div>
                                                        {sp.notes && (
                                                            <div className="text-[10px] font-sans text-neutral-500 italic max-w-[160px] truncate ml-auto">
                                                                {sp.notes}
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    viewStoredAttachment(sp.slipStoragePath)
                                                                }
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2B2B2B] hover:bg-black text-[#D4AF37] text-[11px] font-bold cursor-pointer"
                                                            >
                                                                <ExternalLink className="w-3 h-3" />
                                                                View Slip
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    downloadStoredAttachment(
                                                                        sp.slipStoragePath,
                                                                        `Salary_Slip_${sp.employeeCode}_${sp.salaryMonth}`
                                                                    )
                                                                }
                                                                title="Download Payment Slip"
                                                                className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                                                            >
                                                                <Download className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                        {sp.slipFileName && (
                                                            <div className="text-[10px] text-neutral-400 mt-1 truncate max-w-[150px]">
                                                                {sp.slipFileName}
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3.5">
                                                        {sp.emailSent ? (
                                                            <div className="space-y-1">
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                                                    <Mail className="w-3 h-3" />
                                                                    Emailed to Employee
                                                                </span>
                                                                {sp.emailSentAt && (
                                                                    <div className="text-[10px] text-neutral-400">
                                                                        {new Date(
                                                                            sp.emailSentAt
                                                                        ).toLocaleString()}
                                                                    </div>
                                                                )}
                                                                {currentUser.canManagePayroll && (
                                                                    <button
                                                                        type="button"
                                                                        disabled={isResending}
                                                                        onClick={() =>
                                                                            handleResendSlipEmail(sp)
                                                                        }
                                                                        className="text-[10px] font-semibold text-neutral-500 hover:text-[#2B2B2B] underline cursor-pointer disabled:opacity-50"
                                                                    >
                                                                        {isResending
                                                                            ? "Sending..."
                                                                            : "Resend Slip Email"}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1">
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    {sp.emailError
                                                                        ? "Email Failed"
                                                                        : "Email Not Sent"}
                                                                </span>
                                                                {sp.emailError && (
                                                                    <div
                                                                        className="text-[10px] text-red-600 max-w-[180px] truncate"
                                                                        title={sp.emailError}
                                                                    >
                                                                        {sp.emailError}
                                                                    </div>
                                                                )}
                                                                {currentUser.canManagePayroll && (
                                                                    <button
                                                                        type="button"
                                                                        disabled={isResending}
                                                                        onClick={() =>
                                                                            handleResendSlipEmail(sp)
                                                                        }
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2B2B2B] hover:bg-black text-[#D4AF37] text-[10px] font-bold cursor-pointer disabled:opacity-50"
                                                                    >
                                                                        <Send className="w-3 h-3" />
                                                                        {isResending
                                                                            ? "Sending..."
                                                                            : "Send Slip Email"}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })()}

            {/* TAB 4: COMPENSATION, PAYROLL & COMMISSION OVERVIEW */}
            {activeTab === "compensation" && (
                <div className="p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-bold text-[#2B2B2B]">
                                {currentUser.canManagePayroll
                                    ? "Office Payroll Structure, EPF & Tour Commission Overview"
                                    : "My Compensation, Bank & Commission Summary"}
                            </h3>
                            <p className="text-xs text-neutral-500">
                                Fixed monthly remuneration in LKR paired with per-tour commission caps and earned allocations.
                            </p>
                        </div>
                        <Link
                            href="/admin/commissions"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2B2B2B] text-[#D4AF37] text-xs font-bold hover:bg-black"
                        >
                            <Award className="w-3.5 h-3.5" />
                            Open Tour Commissions Workspace →
                        </Link>
                    </div>

                    <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead className="bg-[#F9FAFB] text-[#6B7280] uppercase tracking-wider text-[10px] font-bold border-b border-[#E5E7EB]">
                                <tr>
                                    <th className="px-4 py-3.5">Employee</th>
                                    <th className="px-4 py-3.5 text-right">Basic Salary</th>
                                    <th className="px-4 py-3.5 text-right">Fixed Allowances</th>
                                    <th className="px-4 py-3.5 text-right">Gross Monthly Fixed</th>
                                    <th className="px-4 py-3.5">EPF &amp; Bank Account</th>
                                    <th className="px-4 py-3.5">Commission Tier &amp; Cap</th>
                                    <th className="px-4 py-3.5 text-right">Earned Commissions</th>
                                    {currentUser.canManagePayroll && (
                                        <th className="px-4 py-3.5 text-right">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E7EB]">
                                {workspace.employees
                                    .filter((e) => e.canCallerViewCompensation)
                                    .map((emp) => (
                                        <tr key={emp.id} className="hover:bg-neutral-50/70">
                                            <td className="px-4 py-3.5">
                                                <div className="font-bold text-[#2B2B2B]">
                                                    {emp.fullName}
                                                </div>
                                                <div className="text-[10px] text-neutral-500">
                                                    {emp.employeeCode} &middot; {emp.roleLabel}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono">
                                                {fmtLkr(emp.basicSalaryLkr)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono">
                                                {fmtLkr(emp.fixedAllowancesLkr)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono font-bold text-[#2B2B2B]">
                                                {fmtLkr(emp.totalFixedMonthlyLkr)}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="text-neutral-800 font-medium">
                                                    {emp.bankName
                                                        ? `${emp.bankName}${emp.bankBranch ? ` (${emp.bankBranch})` : ""} · ${emp.bankAccountNumber || "No Acct #"}`
                                                        : "Bank details not set"}
                                                </div>
                                                <div className="text-[10px] text-neutral-500">
                                                    {emp.epfEligible
                                                        ? `EPF/ETF Eligible${emp.epfNumber ? ` · EPF #${emp.epfNumber}` : ""}`
                                                        : "Not enrolled in EPF"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {emp.commission.commissionEligible ? (
                                                    <div>
                                                        <span className="font-semibold text-emerald-800">
                                                            {RATING_TIER_LABELS[emp.commission.defaultRatingTier]}
                                                        </span>
                                                        <span className="block text-[10px] text-neutral-500">
                                                            Per-Tour Cap:{" "}
                                                            {emp.commission.effectiveCapUsd
                                                                ? `$${emp.commission.effectiveCapUsd} USD`
                                                                : "No Cap"}
                                                            {emp.commission.customCapUsd
                                                                ? " (Custom Override)"
                                                                : " (Role Policy)"}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-neutral-400">
                                                        Not Commission-Bearing
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono">
                                                <div className="font-bold text-emerald-800">
                                                    {fmtUsd(emp.commission.earnedApprovedAndPaidUsd)}
                                                </div>
                                                <div className="text-[10px] text-neutral-500">
                                                    {emp.commission.toursContributedCount} tour(s) &middot; Pending:{" "}
                                                    {fmtUsd(emp.commission.pendingCommissionUsd)}
                                                </div>
                                            </td>
                                            {currentUser.canManagePayroll && (
                                                <td className="px-4 py-3.5 text-right">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => openPaySalaryModalFor(emp)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                                                        >
                                                            <Upload className="w-3 h-3" />
                                                            Pay Salary
                                                        </button>
                                                        {currentUser.isAdmin && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openEditEmployeeModal(emp, "salary")
                                                                }
                                                                className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-[#2B2B2B] text-neutral-700 hover:text-white text-[11px] font-semibold cursor-pointer"
                                                            >
                                                                Configure
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL 1: EMPLOYEE HR PROFILE & SETTINGS */}
            {editingEmp && empForm && (() => {
                const canEditAllHr = Boolean(currentUser.isAdmin || editingEmp.canCallerEditHrMaster);
                return (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 bg-[#2B2B2B] text-white flex items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37]">
                                        {editingEmp.employeeCode}
                                    </span>
                                    <h3 className="text-lg font-bold font-playfair">
                                        {editingEmp.fullName}
                                    </h3>
                                    <span className="text-xs text-neutral-300">
                                        ({editingEmp.roleLabel})
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-400 mt-0.5">{editingEmp.email}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingEmp(null);
                                    setEmpForm(null);
                                    setEmpModalError(null);
                                }}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Admin Employee Switcher: allows Admin to select & edit ANY employee directly */}
                        {currentUser.isAdmin && workspace.employees.length > 1 && (
                            <div className="px-6 py-2.5 bg-amber-50/70 border-b border-amber-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <span className="font-bold text-neutral-700 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-[#B3932F]" />
                                    Editing Employee HR Profile:
                                </span>
                                <select
                                    value={editingEmp.userId}
                                    onChange={(e) => {
                                        const chosen = workspace.employees.find(
                                            (emp) => emp.userId === e.target.value
                                        );
                                        if (chosen) {
                                            openEditEmployeeModal(chosen, empModalTab);
                                        }
                                    }}
                                    className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white font-semibold text-[#2B2B2B] min-w-[260px]"
                                >
                                    {workspace.employees.map((emp) => (
                                        <option key={emp.userId} value={emp.userId}>
                                            {emp.employeeCode} — {emp.fullName} ({emp.roleLabel})
                                            {emp.userId === currentUser.userId ? " [You]" : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Modal Sub-Tabs */}
                        <div className="px-6 border-b border-neutral-200 flex space-x-5 bg-neutral-50 overflow-x-auto">
                            {[
                                { id: "general", label: "General HR Details", icon: Briefcase },
                                { id: "leave", label: "Leave Quotas (Annual / Casual / Sick)", icon: Calendar },
                                { id: "salary", label: "Salary & Bank", icon: DollarSign },
                                { id: "commission", label: "Commission Settings", icon: Award }
                            ].map((t) => {
                                const Icon = t.icon;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setEmpModalTab(t.id as any)}
                                        className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                            empModalTab === t.id
                                                ? "border-[#D4AF37] text-[#2B2B2B]"
                                                : "border-transparent text-neutral-500 hover:text-neutral-800"
                                        }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {t.label}
                                    </button>
                                );
                            })}
                        </div>

                        <form onSubmit={handleSaveEmployee} className="p-6 overflow-y-auto space-y-5 text-xs">
                            {empModalError && (
                                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold">
                                    {empModalError}
                                </div>
                            )}
                            {empModalTab === "general" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Employee Code
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!canEditAllHr}
                                            value={empForm.employeeCode || ""}
                                            onChange={(e) =>
                                                setEmpForm({ ...empForm, employeeCode: e.target.value })
                                            }
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60 font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Join Date
                                        </label>
                                        <input
                                            type="date"
                                            disabled={!canEditAllHr}
                                            value={empForm.joinDate || ""}
                                            onChange={(e) =>
                                                setEmpForm({ ...empForm, joinDate: e.target.value })
                                            }
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!canEditAllHr}
                                            value={empForm.firstName || ""}
                                            onChange={(e) =>
                                                setEmpForm({ ...empForm, firstName: e.target.value })
                                            }
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!canEditAllHr}
                                            value={empForm.lastName || ""}
                                            onChange={(e) =>
                                                setEmpForm({ ...empForm, lastName: e.target.value })
                                            }
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Department
                                        </label>
                                        <select
                                            disabled={!canEditAllHr}
                                            value={empForm.department || ""}
                                            onChange={(e) =>
                                                setEmpForm({ ...empForm, department: e.target.value })
                                            }
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60"
                                        >
                                            {empForm.department &&
                                                !DEPARTMENTS.includes(empForm.department) && (
                                                    <option value={empForm.department}>
                                                        {empForm.department}
                                                    </option>
                                                )}
                                            {DEPARTMENTS.map((d) => (
                                                <option key={d} value={d}>
                                                    {d}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Job Designation / Title
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!canEditAllHr}
                                            value={empForm.designation || ""}
                                            onChange={(e) =>
                                                setEmpForm({ ...empForm, designation: e.target.value })
                                            }
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Employment Type
                                        </label>
                                        <select
                                            disabled={!canEditAllHr}
                                            value={empForm.employmentType || "Full-Time"}
                                            onChange={(e) =>
                                                setEmpForm({
                                                    ...empForm,
                                                    employmentType: e.target.value as EmployeeEmploymentType
                                                })
                                            }
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60"
                                        >
                                            {EMPLOYMENT_TYPES.map((t) => (
                                                <option key={t} value={t}>
                                                    {t}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Employment Status
                                        </label>
                                        <select
                                            disabled={!canEditAllHr}
                                            value={empForm.employmentStatus || "Active"}
                                            onChange={(e) =>
                                                setEmpForm({
                                                    ...empForm,
                                                    employmentStatus: e.target
                                                        .value as EmployeeEmploymentStatus
                                                })
                                            }
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60"
                                        >
                                            {EMPLOYMENT_STATUSES.map((s) => (
                                                <option key={s} value={s}>
                                                    {s}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {editingEmp.role !== "admin" && (
                                        <div className="sm:col-span-2">
                                            <label className="block font-bold text-neutral-600 mb-1">
                                                Reporting Manager / Supervisor
                                            </label>
                                            <select
                                                disabled={!canEditAllHr}
                                                value={empForm.supervisorId || ""}
                                                onChange={(e) =>
                                                    setEmpForm({
                                                        ...empForm,
                                                        supervisorId: e.target.value || null
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60"
                                            >
                                                <option value="">— Direct to Admin —</option>
                                                {workspace.supervisorOptions
                                                    .filter(
                                                        (opt) =>
                                                            opt.userId !== editingEmp.userId &&
                                                            opt.rank > editingEmp.roleRank
                                                    )
                                                    .map((opt) => (
                                                        <option key={opt.userId} value={opt.userId}>
                                                            {opt.name} ({opt.roleLabel})
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Phone Number
                                        </label>
                                        <input
                                            type="text"
                                            value={empForm.phone || ""}
                                            onChange={(e) =>
                                                setEmpForm({ ...empForm, phone: e.target.value })
                                            }
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            NIC / Passport Number
                                        </label>
                                        <input
                                            type="text"
                                            value={empForm.nicOrPassport || ""}
                                            onChange={(e) =>
                                                setEmpForm({
                                                    ...empForm,
                                                    nicOrPassport: e.target.value
                                                })
                                            }
                                            placeholder="e.g. 199412345678"
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Residential Address
                                        </label>
                                        <input
                                            type="text"
                                            value={empForm.address || ""}
                                            onChange={(e) =>
                                                setEmpForm({ ...empForm, address: e.target.value })
                                            }
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Emergency Contact Person
                                        </label>
                                        <input
                                            type="text"
                                            value={empForm.emergencyContactName || ""}
                                            onChange={(e) =>
                                                setEmpForm({
                                                    ...empForm,
                                                    emergencyContactName: e.target.value
                                                })
                                            }
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Emergency Contact Phone
                                        </label>
                                        <input
                                            type="text"
                                            value={empForm.emergencyContactPhone || ""}
                                            onChange={(e) =>
                                                setEmpForm({
                                                    ...empForm,
                                                    emergencyContactPhone: e.target.value
                                                })
                                            }
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white"
                                        />
                                    </div>

                                    {canEditAllHr && (
                                        <>
                                            <div className="sm:col-span-2">
                                                <label className="block font-bold text-neutral-600 mb-1">
                                                    Internal HR Notes (Admin Only)
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={empForm.hrNotes || ""}
                                                    onChange={(e) =>
                                                        setEmpForm({ ...empForm, hrNotes: e.target.value })
                                                    }
                                                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white"
                                                />
                                            </div>
                                            <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                                                <input
                                                    type="checkbox"
                                                    id="emp-active-flag"
                                                    checked={empForm.isActive !== false}
                                                    onChange={(e) =>
                                                        setEmpForm({ ...empForm, isActive: e.target.checked })
                                                    }
                                                    className="accent-[#2B2B2B]"
                                                />
                                                <label
                                                    htmlFor="emp-active-flag"
                                                    className="font-bold text-neutral-700"
                                                >
                                                    Active Employee Record in Office Directory &amp; Payroll
                                                </label>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {empModalTab === "leave" && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {(
                                            [
                                                ["Annual Leave", editingEmp.leaveBalances.annual, "emerald"],
                                                ["Casual Leave", editingEmp.leaveBalances.casual, "blue"],
                                                ["Sick Leave", editingEmp.leaveBalances.sick, "amber"]
                                            ] as const
                                        ).map(([title, bal]) => (
                                            <div
                                                key={title}
                                                className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50"
                                            >
                                                <div className="font-bold text-neutral-700">{title}</div>
                                                <div className="text-xl font-bold text-[#2B2B2B] mt-1">
                                                    {bal.remaining}{" "}
                                                    <span className="text-xs font-normal text-neutral-500">
                                                        / {bal.quota + bal.carriedForward} days left
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-neutral-500 mt-1">
                                                    Used: {bal.totalUsed} &middot; Pending: {bal.pending}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                        <div>
                                            <label className="block font-bold text-neutral-600 mb-1">
                                                Annual Leave Quota (Days/Yr)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                disabled={!canEditAllHr}
                                                value={empForm.annualLeaveQuota ?? 14}
                                                onChange={(e) =>
                                                    setEmpForm({
                                                        ...empForm,
                                                        annualLeaveQuota: parseFloat(e.target.value) || 0
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-bold text-neutral-600 mb-1">
                                                Casual Leave Quota (Days/Yr)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                disabled={!canEditAllHr}
                                                value={empForm.casualLeaveQuota ?? 7}
                                                onChange={(e) =>
                                                    setEmpForm({
                                                        ...empForm,
                                                        casualLeaveQuota: parseFloat(e.target.value) || 0
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-bold text-neutral-600 mb-1">
                                                Sick Leave Quota (Days/Yr)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                disabled={!canEditAllHr}
                                                value={empForm.sickLeaveQuota ?? 7}
                                                onChange={(e) =>
                                                    setEmpForm({
                                                        ...empForm,
                                                        sickLeaveQuota: parseFloat(e.target.value) || 0
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60"
                                            />
                                        </div>

                                        <div>
                                            <label className="block font-bold text-neutral-600 mb-1">
                                                Annual Carried Forward
                                            </label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                disabled={!canEditAllHr}
                                                value={empForm.annualLeaveCarriedForward ?? 0}
                                                onChange={(e) =>
                                                    setEmpForm({
                                                        ...empForm,
                                                        annualLeaveCarriedForward:
                                                            parseFloat(e.target.value) || 0
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60"
                                            />
                                        </div>

                                        <div>
                                            <label className="block font-bold text-neutral-600 mb-1">
                                                Prior Annual Used (Pre-System)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                disabled={!canEditAllHr}
                                                value={empForm.annualLeaveOpeningUsed ?? 0}
                                                onChange={(e) =>
                                                    setEmpForm({
                                                        ...empForm,
                                                        annualLeaveOpeningUsed:
                                                            parseFloat(e.target.value) || 0
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60"
                                            />
                                        </div>

                                        <div>
                                            <label className="block font-bold text-neutral-600 mb-1">
                                                Prior Casual Used (Pre-System)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                disabled={!canEditAllHr}
                                                value={empForm.casualLeaveOpeningUsed ?? 0}
                                                onChange={(e) =>
                                                    setEmpForm({
                                                        ...empForm,
                                                        casualLeaveOpeningUsed:
                                                            parseFloat(e.target.value) || 0
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60"
                                            />
                                        </div>

                                        <div>
                                            <label className="block font-bold text-neutral-600 mb-1">
                                                Prior Sick Used (Pre-System)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                disabled={!canEditAllHr}
                                                value={empForm.sickLeaveOpeningUsed ?? 0}
                                                onChange={(e) =>
                                                    setEmpForm({
                                                        ...empForm,
                                                        sickLeaveOpeningUsed:
                                                            parseFloat(e.target.value) || 0
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {empModalTab === "salary" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Basic Monthly Salary (LKR)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            disabled={!canEditAllHr}
                                            value={empForm.basicSalaryLkr ?? 0}
                                            onChange={(e) =>
                                                setEmpForm({
                                                    ...empForm,
                                                    basicSalaryLkr: parseFloat(e.target.value) || 0
                                                })
                                            }
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60 font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Fixed Monthly Allowances (LKR)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            disabled={!canEditAllHr}
                                            value={empForm.fixedAllowancesLkr ?? 0}
                                            onChange={(e) =>
                                                setEmpForm({
                                                    ...empForm,
                                                    fixedAllowancesLkr: parseFloat(e.target.value) || 0
                                                })
                                            }
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60 font-mono"
                                        />
                                    </div>

                                    <div className="sm:col-span-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                                        <span className="font-bold text-emerald-900">
                                            Total Monthly Fixed Remuneration
                                        </span>
                                        <span className="font-mono font-bold text-sm text-emerald-900">
                                            {fmtLkr(
                                                Number(empForm.basicSalaryLkr || 0) +
                                                    Number(empForm.fixedAllowancesLkr || 0)
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            id="epf-eligible"
                                            disabled={!canEditAllHr}
                                            checked={Boolean(empForm.epfEligible)}
                                            onChange={(e) =>
                                                setEmpForm({ ...empForm, epfEligible: e.target.checked })
                                            }
                                            className="accent-[#2B2B2B]"
                                        />
                                        <label htmlFor="epf-eligible" className="font-bold text-neutral-700">
                                            EPF / ETF Eligible (Sri Lanka Statutory Contribution)
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            EPF Member Number
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!canEditAllHr}
                                            value={empForm.epfNumber || ""}
                                            onChange={(e) =>
                                                setEmpForm({ ...empForm, epfNumber: e.target.value })
                                            }
                                            placeholder="e.g. EPF-042"
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Bank Name
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!canEditAllHr}
                                            value={empForm.bankName || ""}
                                            onChange={(e) =>
                                                setEmpForm({ ...empForm, bankName: e.target.value })
                                            }
                                            placeholder="e.g. Commercial Bank / Sampath Bank"
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Bank Branch
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!canEditAllHr}
                                            value={empForm.bankBranch || ""}
                                            onChange={(e) =>
                                                setEmpForm({ ...empForm, bankBranch: e.target.value })
                                            }
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Account Number
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!canEditAllHr}
                                            value={empForm.bankAccountNumber || ""}
                                            onChange={(e) =>
                                                setEmpForm({
                                                    ...empForm,
                                                    bankAccountNumber: e.target.value
                                                })
                                            }
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60 font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Account Holder Name
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!canEditAllHr}
                                            value={empForm.bankAccountHolder || ""}
                                            onChange={(e) =>
                                                setEmpForm({
                                                    ...empForm,
                                                    bankAccountHolder: e.target.value
                                                })
                                            }
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60"
                                        />
                                    </div>
                                </div>
                            )}

                            {empModalTab === "commission" && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="comm-eligible"
                                            disabled={!canEditAllHr}
                                            checked={Boolean(empForm.commissionEligible)}
                                            onChange={(e) =>
                                                setEmpForm({
                                                    ...empForm,
                                                    commissionEligible: e.target.checked
                                                })
                                            }
                                            className="accent-[#2B2B2B]"
                                        />
                                        <label
                                            htmlFor="comm-eligible"
                                            className="font-bold text-neutral-700"
                                        >
                                            Eligible for Tour Gross-Profit Pool Commissions
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block font-bold text-neutral-600 mb-1">
                                                Default Performance Rating Tier
                                            </label>
                                            <select
                                                disabled={!canEditAllHr}
                                                value={empForm.defaultRatingTier || "meets"}
                                                onChange={(e) =>
                                                    setEmpForm({
                                                        ...empForm,
                                                        defaultRatingTier: e.target
                                                            .value as PerformanceRatingTier
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60"
                                            >
                                                {(
                                                    Object.keys(
                                                        RATING_TIER_LABELS
                                                    ) as PerformanceRatingTier[]
                                                ).map((tier) => (
                                                    <option key={tier} value={tier}>
                                                        {RATING_TIER_LABELS[tier]}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block font-bold text-neutral-600 mb-1">
                                                Custom Per-Tour Cap Override (USD)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                disabled={!canEditAllHr}
                                                value={empForm.customCommissionCapUsd ?? ""}
                                                onChange={(e) =>
                                                    setEmpForm({
                                                        ...empForm,
                                                        customCommissionCapUsd: e.target.value
                                                            ? parseFloat(e.target.value)
                                                            : null
                                                    })
                                                }
                                                placeholder={
                                                    editingEmp.commission.systemRoleCapUsd
                                                        ? `Role Default: $${editingEmp.commission.systemRoleCapUsd}`
                                                        : "Leave blank for policy default"
                                                }
                                                className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60 font-mono"
                                            />
                                        </div>

                                        <div>
                                            <label className="block font-bold text-neutral-600 mb-1">
                                                Annual Gross Profit Target (USD)
                                            </label>
                                            <input
                                                type="number"
                                                step="100"
                                                disabled={!canEditAllHr}
                                                value={empForm.annualGpTargetUsd ?? ""}
                                                onChange={(e) =>
                                                    setEmpForm({
                                                        ...empForm,
                                                        annualGpTargetUsd: e.target.value
                                                            ? parseFloat(e.target.value)
                                                            : null
                                                    })
                                                }
                                                placeholder="e.g. 75000"
                                                className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60 font-mono"
                                            />
                                        </div>

                                        <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                                            <div className="text-[10px] font-bold uppercase text-neutral-500">
                                                Recorded Commission Performance
                                            </div>
                                            <div className="font-mono font-bold text-sm text-emerald-800 mt-1">
                                                Approved/Paid:{" "}
                                                {fmtUsd(editingEmp.commission.earnedApprovedAndPaidUsd)}
                                            </div>
                                            <div className="text-[11px] text-neutral-500">
                                                {editingEmp.commission.toursContributedCount} tour(s) &middot;
                                                Pending: {fmtUsd(editingEmp.commission.pendingCommissionUsd)}
                                            </div>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block font-bold text-neutral-600 mb-1">
                                                Commission Terms / Incentive Notes
                                            </label>
                                            <textarea
                                                rows={2}
                                                disabled={!canEditAllHr}
                                                value={empForm.commissionNotes || ""}
                                                onChange={(e) =>
                                                    setEmpForm({
                                                        ...empForm,
                                                        commissionNotes: e.target.value
                                                    })
                                                }
                                                className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 disabled:opacity-60"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingEmp(null);
                                        setEmpForm(null);
                                    }}
                                    className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 font-bold cursor-pointer"
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingEmp}
                                    className="px-5 py-2 rounded-xl bg-[#2B2B2B] hover:bg-black text-[#D4AF37] font-bold shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                    {savingEmp ? "Saving..." : "Save HR Profile"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                );
            })()}

            {/* MODAL 2: APPLY FOR LEAVE */}
            {isLeaveModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 bg-[#2B2B2B] text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold font-playfair">
                                    Submit Leave Request
                                </h3>
                                <p className="text-xs text-neutral-300">
                                    Annual, Casual, or Sick Leave Application
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsLeaveModalOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitLeaveRequest} className="p-6 space-y-4 text-xs">
                            {currentUser.isAdmin && (
                                <div>
                                    <label className="block font-bold text-neutral-600 mb-1">
                                        Employee
                                    </label>
                                    <select
                                        value={leaveTargetUserId}
                                        onChange={(e) => setLeaveTargetUserId(e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-50"
                                    >
                                        {workspace.employees.map((emp) => (
                                            <option key={emp.userId} value={emp.userId}>
                                                {emp.fullName} ({emp.roleLabel} — {emp.employeeCode})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {selectedLeaveEmployee && (
                                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-center">
                                    <div>
                                        <span className="block text-[10px] text-neutral-500">
                                            Annual Left
                                        </span>
                                        <span className="font-mono font-bold text-emerald-800">
                                            {selectedLeaveEmployee.leaveBalances.annual.remaining}d
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-neutral-500">
                                            Casual Left
                                        </span>
                                        <span className="font-mono font-bold text-blue-800">
                                            {selectedLeaveEmployee.leaveBalances.casual.remaining}d
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-neutral-500">
                                            Sick Left
                                        </span>
                                        <span className="font-mono font-bold text-amber-800">
                                            {selectedLeaveEmployee.leaveBalances.sick.remaining}d
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-bold text-neutral-600 mb-1">
                                        Leave Category
                                    </label>
                                    <select
                                        value={leaveType}
                                        onChange={(e) =>
                                            setLeaveType(e.target.value as EmployeeLeaveType)
                                        }
                                        className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white"
                                    >
                                        <option value="Annual">Annual Leave</option>
                                        <option value="Casual">Casual Leave</option>
                                        <option value="Sick">Sick / Medical Leave</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-neutral-600 mb-1">
                                        Duration Mode
                                    </label>
                                    <select
                                        value={
                                            leaveIsHalfDay
                                                ? `half_${leaveHalfDayPeriod}`
                                                : "full_days"
                                        }
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            if (v === "full_days") {
                                                setLeaveIsHalfDay(false);
                                                setLeaveDaysCount(
                                                    String(
                                                        computeWorkingDaysInclusive(
                                                            leaveStartDate,
                                                            leaveEndDate
                                                        )
                                                    )
                                                );
                                            } else {
                                                setLeaveIsHalfDay(true);
                                                setLeaveHalfDayPeriod(
                                                    v === "half_Afternoon" ? "Afternoon" : "Morning"
                                                );
                                                setLeaveEndDate(leaveStartDate);
                                                setLeaveDaysCount("0.5");
                                            }
                                        }}
                                        className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white"
                                    >
                                        <option value="full_days">Full Day(s)</option>
                                        <option value="half_Morning">Half Day — Morning (0.5d)</option>
                                        <option value="half_Afternoon">
                                            Half Day — Afternoon (0.5d)
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-neutral-600 mb-1">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={leaveStartDate}
                                        onChange={(e) => handleStartDateChange(e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white"
                                    />
                                </div>

                                {!leaveIsHalfDay ? (
                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            min={leaveStartDate}
                                            value={leaveEndDate}
                                            onChange={(e) => handleEndDateChange(e.target.value)}
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Total Days
                                        </label>
                                        <input
                                            type="text"
                                            disabled
                                            value="0.5 Day"
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-100 font-mono"
                                        />
                                    </div>
                                )}
                            </div>

                            {!leaveIsHalfDay && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Working Days Count (Editable for Holidays)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0.5"
                                            required
                                            value={leaveDaysCount}
                                            onChange={(e) => setLeaveDaysCount(e.target.value)}
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Covering Colleague (Optional)
                                        </label>
                                        <select
                                            value={leaveCoveringUserId}
                                            onChange={(e) => setLeaveCoveringUserId(e.target.value)}
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white"
                                        >
                                            <option value="">— Select Colleague —</option>
                                            {workspace.employees
                                                .filter(
                                                    (e) =>
                                                        e.userId !==
                                                        (leaveTargetUserId || currentUser.userId)
                                                )
                                                .map((e) => (
                                                    <option key={e.userId} value={e.userId}>
                                                        {e.fullName} ({e.roleLabel})
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block font-bold text-neutral-600 mb-1">
                                    Reason for Leave *
                                </label>
                                <textarea
                                    rows={2}
                                    required
                                    value={leaveReason}
                                    onChange={(e) => setLeaveReason(e.target.value)}
                                    placeholder="Briefly describe the reason for leave..."
                                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-neutral-600 mb-1">
                                    Active Tour / Task Handover Notes (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={leaveHandoverNotes}
                                    onChange={(e) => setLeaveHandoverNotes(e.target.value)}
                                    placeholder="e.g. TR-2026-0019 hotel follow-up handed over to Nimali"
                                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white"
                                />
                            </div>

                            <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsLeaveModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 font-bold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingLeave}
                                    className="px-5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#B3932F] text-[#2B2B2B] font-bold shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                    {submittingLeave ? "Submitting..." : "Submit Leave Request"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: APPROVE / REJECT LEAVE CONFIRMATION */}
            {reviewingLeave && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-md overflow-hidden">
                        <div
                            className={`px-6 py-4 text-white flex items-center justify-between ${
                                reviewingLeave.decision === "Approved"
                                    ? "bg-emerald-800"
                                    : "bg-red-700"
                            }`}
                        >
                            <h3 className="text-base font-bold font-playfair">
                                {reviewingLeave.decision === "Approved"
                                    ? "Approve Leave Request"
                                    : "Reject Leave Request"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setReviewingLeave(null)}
                                className="p-1 rounded hover:bg-white/10 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmReviewLeave} className="p-6 space-y-4 text-xs">
                            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                                <div className="font-bold text-[#2B2B2B]">
                                    {reviewingLeave.req.employeeName} (
                                    {reviewingLeave.req.employeeRoleLabel})
                                </div>
                                <div className="text-neutral-600">
                                    <strong>{reviewingLeave.req.leaveType} Leave:</strong>{" "}
                                    {reviewingLeave.req.startDate} to {reviewingLeave.req.endDate} (
                                    {reviewingLeave.req.daysCount} day(s))
                                </div>
                                <div className="text-neutral-500 italic">
                                    &ldquo;{reviewingLeave.req.reason}&rdquo;
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-neutral-600 mb-1">
                                    Approver Note / Remarks (Optional)
                                </label>
                                <textarea
                                    rows={2}
                                    value={reviewerNotes}
                                    onChange={(e) => setReviewerNotes(e.target.value)}
                                    placeholder={
                                        reviewingLeave.decision === "Approved"
                                            ? "e.g. Approved — handover confirmed."
                                            : "Please provide reason for rejection..."
                                    }
                                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setReviewingLeave(null)}
                                    className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 font-bold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className={`px-5 py-2 rounded-xl text-white font-bold cursor-pointer disabled:opacity-50 ${
                                        reviewingLeave.decision === "Approved"
                                            ? "bg-emerald-700 hover:bg-emerald-800"
                                            : "bg-red-600 hover:bg-red-700"
                                    }`}
                                >
                                    {submittingReview
                                        ? "Saving..."
                                        : `Confirm ${reviewingLeave.decision}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: RECORD EMPLOYEE SALARY PAYMENT, UPLOAD SLIP & SEND EMAIL */}
            {isPaySalaryModalOpen && currentUser.canManagePayroll && (() => {
                const basicNum = Math.max(0, parseFloat(payBasicLkr) || 0);
                const allowNum = Math.max(0, parseFloat(payAllowancesLkr) || 0);
                const addNum = Math.max(0, parseFloat(payAdditionsLkr) || 0);
                const epfNum = Math.max(0, parseFloat(payEpfDeductionLkr) || 0);
                const otherDedNum = Math.max(0, parseFloat(payOtherDeductionsLkr) || 0);
                const grossCalc = basicNum + allowNum + addNum;
                const netCalc = grossCalc - epfNum - otherDedNum;
                const alreadyPaidForPeriod = workspace.salaryPayments.some(
                    (sp) =>
                        sp.userId === payTargetUserId && sp.salaryMonth === paySalaryMonth
                );

                return (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
                            <div className="px-6 py-4 bg-[#2B2B2B] text-white flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold font-playfair flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-[#D4AF37]" />
                                        Record Employee Salary Payment &amp; Upload Slip
                                    </h3>
                                    <p className="text-xs text-neutral-300 mt-0.5">
                                        Upload the payment / bank slip and notify the employee via email automatically.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsPaySalaryModalOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form
                                onSubmit={handleSubmitSalaryPayment}
                                className="flex-1 overflow-y-auto p-6 space-y-4 text-xs"
                            >
                                {payModalError && (
                                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold">
                                        {payModalError}
                                    </div>
                                )}

                                {/* Employee Selector & Bank Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block font-bold text-neutral-700 mb-1">
                                            Select Employee *
                                        </label>
                                        <select
                                            value={payTargetUserId}
                                            onChange={(e) => {
                                                const nextEmp = workspace.employees.find(
                                                    (emp) => emp.userId === e.target.value
                                                );
                                                if (nextEmp) {
                                                    applyEmployeeDefaultsToPayForm(nextEmp);
                                                } else {
                                                    setPayTargetUserId(e.target.value);
                                                }
                                            }}
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white font-semibold text-[#2B2B2B]"
                                        >
                                            {workspace.employees.map((emp) => {
                                                const paidInMonth = workspace.salaryPayments.some(
                                                    (sp) =>
                                                        sp.userId === emp.userId &&
                                                        sp.salaryMonth === paySalaryMonth
                                                );
                                                return (
                                                    <option key={emp.userId} value={emp.userId}>
                                                        {emp.employeeCode} — {emp.fullName} (
                                                        {emp.roleLabel})
                                                        {paidInMonth ? " [Paid for Period]" : ""}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    {selectedPayEmployee && (
                                        <div className="sm:col-span-2 p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <div className="font-bold text-[#2B2B2B]">
                                                    {selectedPayEmployee.fullName} &middot;{" "}
                                                    <span className="font-normal text-neutral-600">
                                                        {selectedPayEmployee.email || "No email set"}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-neutral-500 mt-0.5">
                                                    Bank on file:{" "}
                                                    <strong>
                                                        {selectedPayEmployee.bankName
                                                            ? `${selectedPayEmployee.bankName}${selectedPayEmployee.bankBranch ? ` (${selectedPayEmployee.bankBranch})` : ""} · ${selectedPayEmployee.bankAccountNumber || "No Acct #"}`
                                                            : "Not configured in HR Profile"}
                                                    </strong>
                                                </div>
                                            </div>
                                            {alreadyPaidForPeriod && (
                                                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold">
                                                    Payment already recorded for{" "}
                                                    {fmtSalaryMonth(paySalaryMonth)}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Salary Period (Month) *
                                        </label>
                                        <input
                                            type="month"
                                            required
                                            value={paySalaryMonth}
                                            onChange={(e) => setPaySalaryMonth(e.target.value)}
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Payment Date *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={payDate}
                                            onChange={(e) => setPayDate(e.target.value)}
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Payment Method *
                                        </label>
                                        <select
                                            value={payMethod}
                                            onChange={(e) =>
                                                setPayMethod(e.target.value as SalaryPaymentMethod)
                                            }
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white"
                                        >
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="Cash">Cash</option>
                                            <option value="Cheque">Cheque</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Bank / Transaction Reference
                                        </label>
                                        <input
                                            type="text"
                                            value={payReference}
                                            onChange={(e) => setPayReference(e.target.value)}
                                            placeholder="e.g. CEFT-9845120 / Slip #402"
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white font-mono"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block font-bold text-neutral-600 mb-1">
                                            Credited Bank Account Snapshot
                                        </label>
                                        <input
                                            type="text"
                                            value={payBankSnapshot}
                                            onChange={(e) => setPayBankSnapshot(e.target.value)}
                                            placeholder="e.g. Commercial Bank (Colombo 07) · 8001234567"
                                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white"
                                        />
                                    </div>
                                </div>

                                {/* Remuneration Calculation Grid */}
                                <div className="pt-2 border-t border-neutral-200 space-y-3">
                                    <div className="font-bold text-[#2B2B2B] uppercase tracking-wider text-[10px]">
                                        Remuneration Breakdown (LKR)
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block font-bold text-neutral-600 mb-1">
                                                Basic Salary (LKR)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={payBasicLkr}
                                                onChange={(e) => setPayBasicLkr(e.target.value)}
                                                className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white font-mono"
                                            />
                                        </div>

                                        <div>
                                            <label className="block font-bold text-neutral-600 mb-1">
                                                Fixed Allowances (LKR)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={payAllowancesLkr}
                                                onChange={(e) => setPayAllowancesLkr(e.target.value)}
                                                className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white font-mono"
                                            />
                                        </div>

                                        <div>
                                            <label className="block font-bold text-emerald-700 mb-1">
                                                + Bonus / Commission (LKR)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={payAdditionsLkr}
                                                onChange={(e) => setPayAdditionsLkr(e.target.value)}
                                                className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white font-mono"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="font-bold text-red-700">
                                                    - EPF 8% Deduction
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPayEpfDeductionLkr(
                                                            (
                                                                Math.round(basicNum * 0.08 * 100) /
                                                                100
                                                            ).toFixed(2)
                                                        )
                                                    }
                                                    className="text-[10px] font-bold text-[#B3932F] hover:underline cursor-pointer"
                                                >
                                                    Calc 8%
                                                </button>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={payEpfDeductionLkr}
                                                onChange={(e) =>
                                                    setPayEpfDeductionLkr(e.target.value)
                                                }
                                                className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white font-mono"
                                            />
                                        </div>

                                        <div>
                                            <label className="block font-bold text-red-700 mb-1">
                                                - Other Deductions (LKR)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={payOtherDeductionsLkr}
                                                onChange={(e) =>
                                                    setPayOtherDeductionsLkr(e.target.value)
                                                }
                                                className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white font-mono"
                                            />
                                        </div>

                                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col justify-center">
                                            <span className="text-[10px] font-bold uppercase text-emerald-800">
                                                Net Salary Paid
                                            </span>
                                            <span
                                                className={`font-mono font-bold text-sm mt-0.5 ${
                                                    netCalc > 0
                                                        ? "text-emerald-900"
                                                        : "text-red-700"
                                                }`}
                                            >
                                                {fmtLkr(netCalc)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Slip Upload */}
                                <div className="pt-2 border-t border-neutral-200 space-y-2">
                                    <label className="block font-bold text-neutral-700">
                                        Upload Salary / Bank Transfer Slip (PDF, JPG, PNG, WebP — Max 10 MB) *
                                    </label>
                                    <div className="p-4 rounded-xl border-2 border-dashed border-neutral-300 hover:border-[#D4AF37] bg-neutral-50 transition-colors">
                                        <input
                                            type="file"
                                            accept=".pdf,image/jpeg,image/png,image/webp"
                                            onChange={(e) =>
                                                setPaySlipFile(e.target.files?.[0] || null)
                                            }
                                            className="w-full text-xs text-neutral-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#2B2B2B] file:text-[#D4AF37] hover:file:bg-black file:cursor-pointer cursor-pointer"
                                        />
                                        {paySlipFile && (
                                            <div className="mt-2 text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Selected Slip: {paySlipFile.name} (
                                                {(paySlipFile.size / 1024).toFixed(1)} KB)
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-bold text-neutral-600 mb-1">
                                        Payroll Notes / Remarks (Optional — included on email summary)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={payNotes}
                                        onChange={(e) => setPayNotes(e.target.value)}
                                        placeholder="e.g. November 2026 monthly salary transfer including tour incentive."
                                        className="w-full p-2.5 rounded-xl border border-neutral-200 bg-white"
                                    />
                                </div>

                                {/* Email Notification Toggle */}
                                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-[#D4AF37]/40 flex items-start gap-2.5">
                                    <input
                                        type="checkbox"
                                        id="send-salary-slip-email"
                                        checked={paySendEmail}
                                        onChange={(e) => setPaySendEmail(e.target.checked)}
                                        className="mt-0.5 accent-[#2B2B2B]"
                                    />
                                    <label
                                        htmlFor="send-salary-slip-email"
                                        className="cursor-pointer leading-relaxed text-neutral-800"
                                    >
                                        <span className="font-bold block">
                                            Send email notification with attached salary slip to{" "}
                                            <span className="text-[#2B2B2B] underline">
                                                {selectedPayEmployee?.email || "employee"}
                                            </span>
                                        </span>
                                        <span className="text-[11px] text-neutral-600">
                                            Sends an official Nilathra Collection Salary Payment Confirmation email with the uploaded slip attached immediately upon saving.
                                        </span>
                                    </label>
                                </div>

                                <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsPaySalaryModalOpen(false)}
                                        className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 font-bold cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingSalary}
                                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm disabled:opacity-50 cursor-pointer"
                                    >
                                        <Upload className="w-3.5 h-3.5" />
                                        {submittingSalary
                                            ? "Uploading Slip & Recording..."
                                            : paySendEmail
                                              ? "Record Salary, Upload Slip & Email Employee"
                                              : "Record Salary & Upload Slip"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            })()}
        </section>
    );
}

