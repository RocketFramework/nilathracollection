"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { CommissionSimulationService } from "@/services/commission-simulation.service";
import {
    CommissionRuleConfigDTO,
    CommissionSimulationInputDTO,
    CommissionSimulationResultDTO,
    SimulationEmployeeDTO,
    SimulationMatrixRowDTO,
    TourFinancialReferenceDTO
} from "@/dtos/commission-simulation.dto";

async function verifyIsAdminUser(): Promise<boolean> {
    const supabase = await createClient();
    const {
        data: { user }
    } = await supabase.auth.getUser();
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

export async function getSimulationInitialDataAction(): Promise<{
    success: boolean;
    unauthorized?: boolean;
    tours?: TourFinancialReferenceDTO[];
    employees?: SimulationEmployeeDTO[];
    defaultRules?: CommissionRuleConfigDTO;
    error?: string;
}> {
    try {
        const isAdmin = await verifyIsAdminUser();
        if (!isAdmin) {
            return {
                success: false,
                unauthorized: true,
                error: "Access denied. The Commission Simulator is restricted to Administrators only."
            };
        }

        const [tours, employees] = await Promise.all([
            CommissionSimulationService.getRealToursForSimulation(),
            CommissionSimulationService.getEmployeesForSimulation()
        ]);
        const defaultRules = CommissionSimulationService.getDefaultRules();
        return {
            success: true,
            tours,
            employees,
            defaultRules
        };
    } catch (error: any) {
        console.error("Failed to load simulation initial data:", error);
        return {
            success: false,
            error: error.message || "Failed to load simulation data."
        };
    }
}

export async function runSingleCommissionSimulationAction(
    input: CommissionSimulationInputDTO
): Promise<{
    success: boolean;
    result?: CommissionSimulationResultDTO;
    error?: string;
}> {
    try {
        const result = CommissionSimulationService.simulateTourCommission(input);
        return { success: true, result };
    } catch (error: any) {
        console.error("Failed to run commission simulation:", error);
        return { success: false, error: error.message || "Simulation failed." };
    }
}

export async function runValidationMatrixSimulationAction(
    rules: CommissionRuleConfigDTO,
    assumedMarginPct: number = 25,
    exchangeRateLkr: number = 300
): Promise<{
    success: boolean;
    matrix?: SimulationMatrixRowDTO[];
    error?: string;
}> {
    try {
        const matrix = CommissionSimulationService.runValidationMatrix(rules, assumedMarginPct, exchangeRateLkr);
        return { success: true, matrix };
    } catch (error: any) {
        console.error("Failed to run validation matrix:", error);
        return { success: false, error: error.message || "Matrix simulation failed." };
    }
}

