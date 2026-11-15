"use server";

import { revalidatePath } from "next/cache";
import { EmployeeHrService } from "@/services/employee-hr.service";
import {
    CreateEmployeeLeaveRequestDTO,
    CreateEmployeeSalaryPaymentDTO,
    EmployeeHrWorkspaceDTO,
    ReviewEmployeeLeaveRequestDTO,
    UpdateEmployeeHRDTO
} from "@/dtos/employee-hr.dto";

export async function getEmployeeHrWorkspaceAction(): Promise<{
    success: boolean;
    data?: EmployeeHrWorkspaceDTO;
    error?: string;
}> {
    try {
        const data = await EmployeeHrService.getWorkspaceData();
        return { success: true, data };
    } catch (error: any) {
        console.error("getEmployeeHrWorkspaceAction error:", error);
        return {
            success: false,
            error: error?.message || "Failed to load Employee HR workspace."
        };
    }
}

export async function updateEmployeeHrProfileAction(dto: UpdateEmployeeHRDTO): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        await EmployeeHrService.updateEmployeeHrProfile(dto);
        revalidatePath("/admin");
        revalidatePath("/admin/hr");
        return { success: true };
    } catch (error: any) {
        console.error("updateEmployeeHrProfileAction error:", error);
        return {
            success: false,
            error: error?.message || "Failed to update employee HR profile."
        };
    }
}

export async function submitEmployeeLeaveRequestAction(
    dto: CreateEmployeeLeaveRequestDTO
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        await EmployeeHrService.submitLeaveRequest(dto);
        revalidatePath("/admin");
        revalidatePath("/admin/hr");
        return { success: true };
    } catch (error: any) {
        console.error("submitEmployeeLeaveRequestAction error:", error);
        return {
            success: false,
            error: error?.message || "Failed to submit leave request."
        };
    }
}

export async function reviewEmployeeLeaveRequestAction(
    dto: ReviewEmployeeLeaveRequestDTO
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        await EmployeeHrService.reviewLeaveRequest(dto);
        revalidatePath("/admin");
        revalidatePath("/admin/hr");
        return { success: true };
    } catch (error: any) {
        console.error("reviewEmployeeLeaveRequestAction error:", error);
        return {
            success: false,
            error: error?.message || "Failed to review leave request."
        };
    }
}

export async function cancelEmployeeLeaveRequestAction(leaveRequestId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        await EmployeeHrService.cancelLeaveRequest(leaveRequestId);
        revalidatePath("/admin");
        revalidatePath("/admin/hr");
        return { success: true };
    } catch (error: any) {
        console.error("cancelEmployeeLeaveRequestAction error:", error);
        return {
            success: false,
            error: error?.message || "Failed to cancel leave request."
        };
    }
}

export async function uploadEmployeeSalarySlipAction(formData: FormData): Promise<{
    success: boolean;
    slipStoragePath?: string;
    slipFileName?: string;
    error?: string;
}> {
    try {
        const file = formData.get("file") as File;
        const result = await EmployeeHrService.uploadSalarySlip(file);
        return {
            success: true,
            slipStoragePath: result.slipStoragePath,
            slipFileName: result.slipFileName
        };
    } catch (error: any) {
        console.error("uploadEmployeeSalarySlipAction error:", error);
        return {
            success: false,
            error: error?.message || "Failed to upload salary payment slip."
        };
    }
}

export async function recordEmployeeSalaryPaymentAction(
    dto: CreateEmployeeSalaryPaymentDTO
): Promise<{
    success: boolean;
    paymentId?: string;
    emailSent?: boolean;
    emailError?: string | null;
    error?: string;
}> {
    try {
        const result = await EmployeeHrService.recordSalaryPayment(dto);
        revalidatePath("/admin");
        revalidatePath("/admin/hr");
        return {
            success: true,
            paymentId: result.paymentId,
            emailSent: result.emailSent,
            emailError: result.emailError
        };
    } catch (error: any) {
        console.error("recordEmployeeSalaryPaymentAction error:", error);
        return {
            success: false,
            error: error?.message || "Failed to record employee salary payment."
        };
    }
}

export async function resendEmployeeSalarySlipEmailAction(paymentId: string): Promise<{
    success: boolean;
    emailSent?: boolean;
    emailError?: string | null;
    error?: string;
}> {
    try {
        const result = await EmployeeHrService.resendSalarySlipEmail(paymentId);
        revalidatePath("/admin");
        revalidatePath("/admin/hr");
        return {
            success: true,
            emailSent: result.emailSent,
            emailError: result.emailError
        };
    } catch (error: any) {
        console.error("resendEmployeeSalarySlipEmailAction error:", error);
        return {
            success: false,
            error: error?.message || "Failed to resend salary slip email."
        };
    }
}

