"use server";

import { CommissionSimulationService } from "@/services/commission-simulation.service";
import {
    CommissionRuleConfigDTO,
    CommissionSimulationInputDTO,
    CommissionSimulationResultDTO,
    SimulationEmployeeDTO,
    SimulationMatrixRowDTO,
    TourFinancialReferenceDTO
} from "@/dtos/commission-simulation.dto";

export async function getSimulationInitialDataAction(): Promise<{
    success: boolean;
    tours?: TourFinancialReferenceDTO[];
    employees?: SimulationEmployeeDTO[];
    defaultRules?: CommissionRuleConfigDTO;
    error?: string;
}> {
    try {
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

