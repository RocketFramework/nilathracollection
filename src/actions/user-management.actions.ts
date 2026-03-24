"use server";

import { revalidatePath } from "next/cache";
import { AdminService } from "@/services/user.service";
import { CreateUserDTO, UpdateUserDTO, ResetPasswordDTO } from "@/dtos/user-vendor.dto";

export async function createUserAction(formData: FormData) {
    try {
        const role = formData.get("role") as 'tourist' | 'agent' | 'admin';
        const dto: CreateUserDTO = {
            first_name: formData.get("first_name") as string,
            last_name: formData.get("last_name") as string,
            email: formData.get("email") as string,
            phone: formData.get("phone") as string,
            password: formData.get("password") as string,
            role
        };

        await AdminService.createUser(dto);
        revalidatePath("/admin/user-management");
        return { success: true, message: `Successfully created ${role} account for ${dto.first_name} ${dto.last_name}` };
    } catch (error: any) {
        console.error("Error creating user:", error);
        return { error: error.message || "An unexpected error occurred while creating the user." };
    }
}

export async function updateUserAction(userId: string, role: string, data: UpdateUserDTO) {
    try {
        await AdminService.updateUser(userId, role, data);
        revalidatePath("/admin/user-management");
        return { success: true, message: `User updated successfully.` };
    } catch (error: any) {
        console.error("Error updating user:", error);
        return { error: error.message || "Failed to update user." };
    }
}

export async function resetPasswordAction(userId: string, newPassword: string) {
    try {
        await AdminService.resetUserPassword({ userId, newPassword });
        return { success: true, message: "Password reset successfully." };
    } catch (error: any) {
        console.error("Error resetting password:", error);
        return { error: error.message || "Failed to reset password." };
    }
}

export async function getUsersByRoleAction(role: 'tourist' | 'agent' | 'admin') {
    try {
        const users = await AdminService.getUsersByRole(role);
        return { success: true, users };
    } catch (error: any) {
        console.error(`Error fetching ${role}s:`, error);
        return { error: error.message || `Failed to fetch ${role}s.` };
    }
}

export async function deactivateUserAction(userId: string, role: 'tourist' | 'agent' | 'admin') {
    try {
        await AdminService.deactivateUser(userId, role);
        revalidatePath("/admin/user-management");
        return { success: true, message: "User deactivated successfully." };
    } catch (error: any) {
        console.error("Error deactivating user:", error);
        return { error: error.message || "Failed to deactivate user." };
    }
}

export async function activateUserAction(userId: string, role: 'tourist' | 'agent' | 'admin') {
    try {
        await AdminService.updateUser(userId, role, { is_active: true });
        revalidatePath("/admin/user-management");
        return { success: true, message: "User activated successfully." };
    } catch (error: any) {
        console.error("Error activating user:", error);
        return { error: error.message || "Failed to activate user." };
    }
}
