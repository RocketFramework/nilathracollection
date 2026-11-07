import {
    ICommissionRuleConfig,
    ICommissionSimulationInput,
    ICommissionSimulationResult,
    ITourFinancialReference,
    ICommissionContributorInput,
    ICommissionLeaderInput,
    ITeamDevRecipientInput
} from '@/other/interfaces';
import { SimulationOrgPresetKey } from '@/types/types';

export type CommissionRuleConfigDTO = ICommissionRuleConfig;
export type CommissionContributorInputDTO = ICommissionContributorInput;
export type CommissionLeaderInputDTO = ICommissionLeaderInput;
export type TeamDevRecipientInputDTO = ITeamDevRecipientInput;
export type CommissionSimulationInputDTO = ICommissionSimulationInput;
export type CommissionSimulationResultDTO = ICommissionSimulationResult;
export type TourFinancialReferenceDTO = ITourFinancialReference;

export interface SimulationEmployeeDTO {
    id: string;
    name: string;
    email: string;
    role: string;
    roleLabel: string;
    rank: number;
    supervisorId?: string | null;
    supervisorName?: string | null;
    supervisorRoleLabel?: string | null;
}

export interface SimulationMatrixRowDTO {
    scenarioCode: 'A' | 'B' | 'C';
    scenarioLabel: string;
    structureKey: SimulationOrgPresetKey;
    structureLabel: string;
    result: CommissionSimulationResultDTO;
}

export interface CareerEarningsPreviewDTO {
    currentDesignation: string;
    nextDesignation: string;
    toursCompleted: number;
    targetToursForNextLevel: number;
    cumulativeGrossProfitUsd: number;
    targetGrossProfitUsd: number;
    mentoredAgentsCount: number;
    targetMentoredAgentsCount: number;
    personalCommissionUsd: number;
    leadershipIncentivesUsd: number;
    teamDevBonusUsd: number;
    totalVariableEarningsUsd: number;
    totalVariableEarningsLkr: number;
    projectedNextLevelAnnualUsd: number;
    overallProgressPct: number;
}

