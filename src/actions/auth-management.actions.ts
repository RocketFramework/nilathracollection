'use server';

import { revalidatePath } from 'next/cache';
import { AuthorizationEngine } from '@/services/auth-decision.service';
import { UserService } from '@/services/user.service';
import { DynamicPolicy, DynamicPermission } from '@/types/auth.types';

// Helper to ensure user is admin
async function ensureAdmin() {
    const profile = await UserService.getCurrentUserProfile();
    if (!profile || profile.role !== 'admin') {
        throw new Error('Forbidden: Administrative privileges required');
    }
}

export async function getPoliciesAction() {
    try {
        await ensureAdmin();
        const repo = AuthorizationEngine.getRepository();
        const policies = await repo.getAllPolicies();
        return { success: true, policies };
    } catch (error: any) {
        console.error('Error fetching policies:', error);
        return { success: false, error: error.message };
    }
}

export async function getPermissionsAction() {
    try {
        await ensureAdmin();
        const repo = AuthorizationEngine.getRepository();
        const permissions = await repo.getAllPermissions();
        return { success: true, permissions };
    } catch (error: any) {
        console.error('Error fetching permissions:', error);
        return { success: false, error: error.message };
    }
}

export async function savePolicyAction(policy: Omit<DynamicPolicy, 'id'> & { id?: string }) {
    try {
        await ensureAdmin();
        const repo = AuthorizationEngine.getRepository();
        const saved = await repo.savePolicy(policy);
        revalidatePath('/admin/settings/permissions');
        return { success: true, policy: saved };
    } catch (error: any) {
        console.error('Error saving policy:', error);
        return { success: false, error: error.message };
    }
}

export async function savePermissionAction(permission: Omit<DynamicPermission, 'id'> & { id?: string }) {
    try {
        await ensureAdmin();
        const repo = AuthorizationEngine.getRepository();
        const saved = await repo.savePermission(permission);
        revalidatePath('/admin/settings/permissions');
        return { success: true, permission: saved };
    } catch (error: any) {
        console.error('Error saving permission:', error);
        return { success: false, error: error.message };
    }
}

export async function deletePolicyAction(id: string) {
    try {
        await ensureAdmin();
        const repo = AuthorizationEngine.getRepository();
        await repo.deletePolicy(id);
        revalidatePath('/admin/settings/permissions');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting policy:', error);
        return { success: false, error: error.message };
    }
}

export async function deletePermissionAction(id: string) {
    try {
        await ensureAdmin();
        const repo = AuthorizationEngine.getRepository();
        await repo.deletePermission(id);
        revalidatePath('/admin/settings/permissions');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting permission:', error);
        return { success: false, error: error.message };
    }
}
