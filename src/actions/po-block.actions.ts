"use server";

import { POBlockService } from "@/services/po-block.service";
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
    blockType: 'accommodation' | 'sleep' | 'travel' | 'meal' | 'restaurant' | 'activity', 
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
    blockType: 'accommodation' | 'sleep' | 'travel' | 'meal' | 'restaurant' | 'activity',
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

export async function deletePOBlockAction(blockId: string) {
    try {
        await POBlockService.deletePOBlock(blockId);
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
