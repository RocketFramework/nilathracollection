"use server";

import { POBlockService } from "@/services/po-block.service";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

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
 * Loads all previously assigned vehicles for a transport requirement from the junction table.
 * Returns them mapped to the reqPickedVehicles UI shape so the modal can be pre-populated.
 * Uses two flat queries instead of a nested join to avoid PostgREST FK-inference issues.
 */
export async function getTransportRequirementVehiclesAction(requirementId: string): Promise<{
    success: boolean;
    vehicles?: Array<{ vehicleId: string; vehicleName: string; providerName: string; quantity: number; notes: string }>;
    error?: string;
}> {
    try {
        const adminSupabase = createAdminClient();

        // Step 1: load junction rows (vehicle_id, quantity, notes)
        const { data: junctionRows, error: jErr } = await adminSupabase
            .from("transport_requirement_vehicles")
            .select("vehicle_id, quantity, notes")
            .eq("requirement_id", requirementId);

        if (jErr) {
            console.error("[getTransportRequirementVehiclesAction] junction query error:", jErr);
            throw jErr;
        }

        if (!junctionRows || junctionRows.length === 0) {
            return { success: true, vehicles: [] };
        }

        // Step 2: load vehicle + provider details for the returned vehicle IDs
        const vehicleIds = junctionRows.map((r: any) => r.vehicle_id);
        const { data: vehicleRows, error: vErr } = await adminSupabase
            .from("transport_vehicles")
            .select("id, make, model, make_and_model, vehicle_type, vehicle_number, provider_id")
            .in("id", vehicleIds);

        if (vErr) {
            console.error("[getTransportRequirementVehiclesAction] vehicles query error:", vErr);
            throw vErr;
        }

        // Step 3: load provider names
        const providerIds = [...new Set((vehicleRows || []).map((v: any) => v.provider_id).filter(Boolean))];
        let providerMap: Record<string, string> = {};
        if (providerIds.length > 0) {
            const { data: providerRows } = await adminSupabase
                .from("transport_providers")
                .select("id, name")
                .in("id", providerIds);
            (providerRows || []).forEach((p: any) => { providerMap[p.id] = p.name; });
        }

        // Step 4: assemble the result
        const vehicles = junctionRows.map((row: any) => {
            const v = (vehicleRows || []).find((vr: any) => vr.id === row.vehicle_id) || {} as any;
            const vehicleName = [
                [v.make, v.model].filter(Boolean).join(" ") || v.make_and_model || "",
                v.vehicle_type
            ].filter(Boolean).join(" – ");
            return {
                vehicleId: row.vehicle_id,
                vehicleName: vehicleName || "Unknown Vehicle",
                providerName: providerMap[v.provider_id] || "Unknown Provider",
                quantity: row.quantity || 1,
                notes: row.notes || ""
            };
        });

        return { success: true, vehicles };
    } catch (error: any) {
        console.error("Error loading transport requirement vehicles:", error);
        return { success: false, error: error.message || "Failed to load vehicle assignments." };
    }
}
