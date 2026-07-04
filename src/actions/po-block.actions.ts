"use server";

import { POBlockService } from "@/services/po-block.service";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export async function initializeDefaultBlocksAction(tourId: string) {
    try {
        const blocks = await POBlockService.initializeDefaultBlocks(tourId);
        revalidatePath(`/admin-new`);
        return { success: true, blocks };
    } catch (error: any) {
        console.error("Error initializing default blocks:", error);
        return { success: false, error: error.message || "Failed to initialize blocks." };
    }
}

export async function getPOBlocksAction(tourId: string) {
    try {
        const blocks = await POBlockService.getPOBlocksForTour(tourId);
        return { success: true, blocks };
    } catch (error: any) {
        console.error("Error fetching blocks:", error);
        return { success: false, error: error.message || "Failed to load blocks." };
    }
}

export async function createPOBlockAction(
    tourId: string, 
    name: string, 
    blockType: 'accommodation' | 'sleep' | 'travel' | 'meal' | 'restaurant' | 'activity' | 'guide' | 'driver', 
    blockNumber: number, 
    dailyActivityIds: string[]
) {
    try {
        const block = await POBlockService.createPOBlock(tourId, name, blockType, blockNumber, dailyActivityIds);
        revalidatePath(`/admin-new`);
        return { success: true, block };
    } catch (error: any) {
        console.error("Error creating block:", error);
        return { success: false, error: error.message || "Failed to create block." };
    }
}

export async function updatePOBlockAction(
    blockId: string,
    name: string,
    blockType: 'accommodation' | 'sleep' | 'travel' | 'meal' | 'restaurant' | 'activity' | 'guide' | 'driver',
    dailyActivityIds: string[]
) {
    try {
        await POBlockService.updatePOBlock(blockId, name, blockType, dailyActivityIds);
        revalidatePath(`/admin-new`);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating block:", error);
        return { success: false, error: error.message || "Failed to update block." };
    }
}

/**
 * Deletes a PO block along with its associated tour_rfq_emails, tour_rfp_emails,
 * purchase_order_items, and purchase_orders. Guards against deletion when supplier
 * invoices exist for the block.
 */
export async function deletePOBlockAction(blockId: string) {
    try {
        await POBlockService.deleteBlockWithCascade(blockId);
        revalidatePath(`/admin-new`);
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting block:", error);
        return { success: false, error: error.message || "Failed to delete block." };
    }
}

export async function finalizePOBlockAction(blockId: string) {
    try {
        await POBlockService.finalizePOBlock(blockId);
        revalidatePath(`/admin-new`);
        return { success: true };
    } catch (error: any) {
        console.error("Error finalizing block:", error);
        return { success: false, error: error.message || "Failed to finalize block." };
    }
}

export async function getGuideDailyActivitiesAction(tourId: string) {
    try {
        const activities = await POBlockService.getGuideDailyActivitiesForTour(tourId);
        return { success: true, activities };
    } catch (error: any) {
        console.error("Error fetching guide activities:", error);
        return { success: false, error: error.message || "Failed to fetch guide activities." };
    }
}

export async function saveGuideDailyActivitiesAction(tourId: string, guideId: string, activities: any[]) {
    try {
        await POBlockService.saveGuideDailyActivities(tourId, guideId, activities);
        revalidatePath(`/admin-new`);
        return { success: true };
    } catch (error: any) {
        console.error("Error saving guide activities:", error);
        return { success: false, error: error.message || "Failed to save guide activities." };
    }
}

export async function getDriverDailyActivitiesAction(tourId: string) {
    try {
        const activities = await POBlockService.getDriverDailyActivitiesForTour(tourId);
        return { success: true, activities };
    } catch (error: any) {
        console.error("Error fetching driver activities:", error);
        return { success: false, error: error.message || "Failed to fetch driver activities." };
    }
}

export async function saveDriverDailyActivitiesAction(tourId: string, driverId: string, activities: any[]) {
    try {
        await POBlockService.saveDriverDailyActivities(tourId, driverId, activities);
        revalidatePath(`/admin-new`);
        return { success: true };
    } catch (error: any) {
        console.error("Error saving driver activities:", error);
        return { success: false, error: error.message || "Failed to save driver activities." };
    }
}

export async function upsertTransportRequirementAction(tourId: string, requirementId: string, data: any) {
    try {
        const result = await POBlockService.upsertTransportRequirement(tourId, requirementId, data);
        revalidatePath(`/admin-new`);
        return { success: true, requirement: result };
    } catch (error: any) {
        console.error("Error upserting transport requirement:", error);
        return { success: false, error: error.message || "Failed to save transport specifications." };
    }
}

export async function saveTransportRequirementVehiclesAction(
    requirementId: string,
    vehicles: Array<{ vehicle_id: string; quantity: number; notes?: string }>
) {
    try {
        await POBlockService.saveTransportRequirementVehicles(requirementId, vehicles);
        return { success: true };
    } catch (error: any) {
        console.error("Error saving transport requirement vehicles:", error);
        return { success: false, error: error.message || "Failed to save vehicle assignments." };
    }
}

/**
 * Sets vehicle_id on every daily_activities row that has the given
 * transport_requirement_id and activity_type = 'travel'.
 * Pass null as vehicleId to clear the field.
 */
export async function updateTravelActivitiesVehicleIdAction(
    requirementId: string,
    vehicleId: string | null
) {
    try {
        const adminSupabase = createAdminClient();
        const { error } = await adminSupabase
            .from("daily_activities")
            .update({ vehicle_id: vehicleId })
            .eq("transport_requirement_id", requirementId)
            .eq("activity_type", "travel");
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error("Error updating travel activity vehicle_id:", error);
        return { success: false, error: error.message || "Failed to update vehicle on travel activities." };
    }
}
