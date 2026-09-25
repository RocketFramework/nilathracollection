"use server";

import { TouristService } from "@/services/tourist.service";

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
