"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { CommissionService } from "@/services/commission.service";
import {
    ICommissionRuleConfig,
    IProgressionCriterion,
    ISaveTourCommissionPayload
} from "@/other/interfaces";

export async function getCommissionWorkspaceInitialDataAction() {
    try {
        const supabase = await createClient();
        const {
            data: { user }
        } = await supabase.auth.getUser();

        const dto = await CommissionService.getWorkspaceInitialData(user);
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

