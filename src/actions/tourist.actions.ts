"use server";

import { TouristService } from "@/services/tourist.service";
import { TourPlanningService } from "@/services/tour-planning.service";
import { TouristDataDTO } from "@/dtos/tourist-data.dto";
import type { TourActivitySelectionDTO, TourProposedHotelDTO } from "@/dtos/tour-planning.dto";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

async function assertTouristOwnsTour(tourId: string): Promise<string> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Please sign in to access your trip.");

    const admin = createAdminClient();
    const [{ data: tour, error }, { data: roleRows }] = await Promise.all([
        admin.from('tours').select('id, tourist_id').eq('id', tourId).single(),
        admin.from('user_roles').select('roles(name)').eq('user_id', user.id),
    ]);

    if (error || !tour) throw new Error("Tour not found.");
    const isStaff = (roleRows || []).some((r: any) => r.roles?.name && r.roles.name !== 'tourist');
    if (!isStaff && tour.tourist_id && tour.tourist_id !== user.id) {
        throw new Error("Unauthorized access to this tour.");
    }
    return user.id;
}

/**
 * Server Action to fetch tourist tour details securely on the server
 */
export async function getTouristTourDetailsAction(tourId: string) {
    try {
        const data = await TouristService.getTourDetails(tourId);
        return { success: true, data };
    } catch (error: any) {
        console.error("Error in getTouristTourDetailsAction:", error);
        return { success: false, error: error.message || "Failed to fetch tour details" };
    }
}

/**
 * Server Action to fetch all tours belonging to the logged-in tourist
 */
export async function getMyTouristToursAction() {
    try {
        const data = await TouristService.getMyTours();
        return { success: true, data };
    } catch (error: any) {
        console.error("Error in getMyTouristToursAction:", error);
        return { success: false, error: error.message || "Failed to fetch tours" };
    }
}

/**
 * Server Action to add a tourist comment to an itinerary block
 */
export async function addTouristCommentToBlockAction(tourId: string, blockId: string, text: string) {
    try {
        await TouristService.addCommentToBlock(tourId, blockId, 'tourist', text);
        return { success: true };
    } catch (error: any) {
        console.error("Error in addTouristCommentToBlockAction:", error);
        return { success: false, error: error.message || "Failed to add comment" };
    }
}

/**
 * Loads Tourist Data, Activity Selection catalog + saved dates, and Proposed Hotels for the logged-in tourist's tour.
 */
export async function getTouristTripPlanningDataAction(tourId: string) {
    try {
        await assertTouristOwnsTour(tourId);
        const [touristData, schedule, activities, hotels] = await Promise.all([
            TouristDataDTO.pull(tourId),
            TourPlanningService.getSchedule(tourId),
            TourPlanningService.listAllActivities(),
            TourPlanningService.listAllHotels(),
        ]);
        return {
            success: true,
            data: { touristData, schedule, activities, hotels },
        };
    } catch (error: any) {
        console.error("Error in getTouristTripPlanningDataAction:", error);
        return { success: false, error: error.message || "Failed to load trip planning data" };
    }
}

export async function saveTouristOwnDataAction(tourId: string, data: TouristDataDTO) {
    try {
        await assertTouristOwnsTour(tourId);
        await TouristDataDTO.save(tourId, data);
        return { success: true };
    } catch (error: any) {
        console.error("Error in saveTouristOwnDataAction:", error);
        return { success: false, error: error.message || "Failed to save your details" };
    }
}

export async function saveTouristOwnActivitiesAction(
    tourId: string,
    selections: TourActivitySelectionDTO[]
) {
    try {
        await assertTouristOwnsTour(tourId);
        await TourPlanningService.saveActivitySelections(tourId, selections);
        return { success: true };
    } catch (error: any) {
        console.error("Error in saveTouristOwnActivitiesAction:", error);
        return { success: false, error: error.message || "Failed to save your activities" };
    }
}

export async function saveTouristOwnProposedHotelsAction(
    tourId: string,
    proposedHotels: TourProposedHotelDTO[]
) {
    try {
        await assertTouristOwnsTour(tourId);
        await TourPlanningService.saveProposedHotels(tourId, proposedHotels);
        return { success: true };
    } catch (error: any) {
        console.error("Error in saveTouristOwnProposedHotelsAction:", error);
        return { success: false, error: error.message || "Failed to save proposed hotels" };
    }
}
