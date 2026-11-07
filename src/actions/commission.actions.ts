"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { CommissionService } from "@/services/commission.service";
import {
    ICommissionRuleConfig,
    IProgressionCriterion,
    ISaveTourCommissionPayload
} from "@/other/interfaces";

async function checkIsAdmin(user: { id: string; user_metadata?: any } | null): Promise<boolean> {
    if (!user) return false;
    if (user.user_metadata?.role === "admin") return true;

    const adminClient = createAdminClient();
    const { data: adminProfile } = await adminClient
        .from("admin_profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

    if (adminProfile) return true;

    const { data: userRoleRows } = await adminClient
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", user.id);

    return (userRoleRows || []).some((r: any) => r?.roles?.name === "admin");
}

export async function getCommissionWorkspaceInitialDataAction() {
    try {
        const supabase = await createClient();
        const {
            data: { user }
        } = await supabase.auth.getUser();

        const isAdmin = await checkIsAdmin(user);
        const dto = await CommissionService.getWorkspaceInitialData(user, isAdmin);
        return { success: true, data: dto.toPlainObject() };
    } catch (error: any) {
        return {
            success: false,
            error: error?.message || "Failed to load Commission Management workspace"
        };
    }
}

export async function saveTourCommissionAction(payload: ISaveTourCommissionPayload) {
    try {
        const supabase = await createClient();
        const {
            data: { user }
        } = await supabase.auth.getUser();

        const isAdmin = await checkIsAdmin(user);
        if (!isAdmin) {
            return {
                success: false,
                error: "Only Administrators can calculate, approve, or modify tour commissions."
            };
        }

        const fullName = user?.user_metadata?.first_name
            ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
            : "";

        const actor = {
            id: user?.id || "admin",
            name: fullName || user?.email || "Administrator"
        };

        const savedRecord = await CommissionService.calculateAndSaveTourCommission(payload, actor);
        revalidatePath("/admin/commissions");
        return { success: true, data: savedRecord };
    } catch (error: any) {
        return {
            success: false,
            error: error?.message || "Failed to save tour commission"
        };
    }
}

export async function publishNewCommissionRuleVersionAction(params: {
    versionName: string;
    rules: ICommissionRuleConfig;
    progressionCriteria?: Record<string, IProgressionCriterion>;
    notes: string;
}) {
    try {
        const supabase = await createClient();
        const {
            data: { user }
        } = await supabase.auth.getUser();

        const isAdmin = await checkIsAdmin(user);
        if (!isAdmin) {
            return {
                success: false,
                error: "Only Administrators can publish or modify commission rule versions."
            };
        }

        const created = await CommissionService.createNewRuleVersion({
            ...params,
            userId: user?.id || null
        });

        revalidatePath("/admin/commissions");
        return { success: true, data: created };
    } catch (error: any) {
        return {
            success: false,
            error: error?.message || "Failed to publish new commission rule version"
        };
    }
}

