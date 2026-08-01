"use server";

import { POBlockService } from "@/services/po-block.service";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export async function syncMissingActivitiesToPOBlocksAction(tourId: string) {
    try {
        const result = await POBlockService.syncMissingActivitiesToPOBlocks(tourId);
        revalidatePath(`/admin-new`);
        return { success: true, blocks: result.blocks, addedCount: result.addedCount };
    } catch (error: any) {
        console.error("Error syncing missing activities to PO blocks:", error);
        return { success: false, error: error.message || "Failed to sync missing activities." };
    }
}

export async function initializeDefaultBlocksAction(tourId: string) {
    try {
        const result = await POBlockService.initializeDefaultBlocks(tourId);
        // If blocks were rebuilt normally, clear the regeneration flag
        if (result.status === 'rebuilt') {
            const adminSupabase = createAdminClient();
            await adminSupabase.from('tours').update({ itinerary_needs_po_rebuild: false }).eq('id', tourId);
        }
        revalidatePath(`/admin-new`);
        return { success: true, blocks: result.blocks, status: result.status };
    } catch (error: any) {
        console.error("Error initializing default blocks:", error);
        return { success: false, error: error.message || "Failed to initialize blocks.", status: 'error' as const };
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

/**
 * Force-wipes ALL PO data for the tour (po_blocks, purchase_orders, supplier_invoices,
 * supplier_payments, etc.) and rebuilds blocks from the current daily_activities.
 * Only called after the agent explicitly confirms the rebuild warning in the UI.
 * Also clears the itinerary_needs_po_rebuild flag.
 */
export async function forceRebuildAllPODataAction(tourId: string) {
    try {
        const result = await POBlockService.rebuildAllPOData(tourId);
        // Clear the flag — blocks are now in sync with the current itinerary
        const adminSupabase = createAdminClient();
        await adminSupabase.from('tours').update({ itinerary_needs_po_rebuild: false }).eq('id', tourId);
        revalidatePath(`/admin-new`);
        return { success: true, blocks: result.blocks };
    } catch (error: any) {
        console.error("Error force-rebuilding PO data:", error);
        return { success: false, error: error.message || "Failed to rebuild PO data." };
    }
}

/**
 * Sets itinerary_needs_po_rebuild = TRUE on the tour.
 * Called immediately after AI generates a new itinerary so the po-creation step
 * can show a confirmation banner without any complex DB state inference.
 */
export async function markItineraryRegeneratedAction(tourId: string) {
    try {
        const adminSupabase = createAdminClient();
        const { error } = await adminSupabase
            .from('tours')
            .update({ itinerary_needs_po_rebuild: true })
            .eq('id', tourId);
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error("Error marking itinerary regenerated:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Reads the itinerary_needs_po_rebuild flag from the tours table.
 * Used by the po-creation step on load to decide whether to show the rebuild banner.
 */
export async function getTourPORebuildStatusAction(tourId: string) {
    try {
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
            .from('tours')
            .select('itinerary_needs_po_rebuild')
            .eq('id', tourId)
            .single();
        if (error) throw error;
        return { success: true, needsRebuild: data?.itinerary_needs_po_rebuild ?? false };
    } catch (error: any) {
        console.error("Error reading PO rebuild status:", error);
        return { success: false, needsRebuild: false, error: error.message };
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
