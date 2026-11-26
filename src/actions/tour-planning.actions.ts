'use server';

import { TourPlanningService } from '@/services/tour-planning.service';
import type {
    ProposedHotelOptionDTO,
    TourActivitySelectionDTO,
    TourPlanningScheduleDTO,
    TourProposedHotelDTO,
    TourRouteStopDTO,
} from '@/dtos/tour-planning.dto';

export async function getTourPlanningScheduleAction(
    tourId: string
): Promise<{ success: boolean; data?: TourPlanningScheduleDTO; error?: string }> {
    try {
        const data = await TourPlanningService.getSchedule(tourId);
        return { success: true, data };
    } catch (error: any) {
        console.error('Error loading tour planning schedule:', error);
        return { success: false, error: error.message || 'Failed to load tour schedule.' };
    }
}

export async function saveTourRouteStopsAction(
    tourId: string,
    stops: TourRouteStopDTO[]
): Promise<{ success: boolean; error?: string }> {
    try {
        await TourPlanningService.saveRouteStops(tourId, stops);
        return { success: true };
    } catch (error: any) {
        console.error('Error saving tour route stops:', error);
        return { success: false, error: error.message || 'Failed to save travel route.' };
    }
}

export async function saveTourActivitySelectionsAction(
    tourId: string,
    selections: TourActivitySelectionDTO[]
): Promise<{ success: boolean; error?: string }> {
    try {
        await TourPlanningService.saveActivitySelections(tourId, selections);
        return { success: true };
    } catch (error: any) {
        console.error('Error saving tour activity selections:', error);
        return { success: false, error: error.message || 'Failed to save activity dates.' };
    }
}

export async function saveTourProposedHotelsAction(
    tourId: string,
    proposedHotels: TourProposedHotelDTO[]
): Promise<{ success: boolean; error?: string }> {
    try {
        await TourPlanningService.saveProposedHotels(tourId, proposedHotels);
        return { success: true };
    } catch (error: any) {
        console.error('Error saving proposed hotels:', error);
        return { success: false, error: error.message || 'Failed to save proposed hotels.' };
    }
}

export async function listAllHotelsForProposalAction(): Promise<{
    success: boolean;
    data?: ProposedHotelOptionDTO[];
    error?: string;
}> {
    try {
        const data = await TourPlanningService.listAllHotels();
        return { success: true, data };
    } catch (error: any) {
        console.error('Error loading all hotels for proposal:', error);
        return { success: false, error: error.message || 'Failed to load hotels.' };
    }
}
