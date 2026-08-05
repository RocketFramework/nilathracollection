import { createClient as createSupabaseClient } from '@/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import { TourConciergeDTO, SaveTourConciergeItemDTO } from '@/dtos/tour-concierge.dto';

const supabase = createSupabaseClient();

export class TourConciergeService {
    /**
     * Fetch all saved concierge items for a given tour_id, joined with seamless_concierge_cost_items.
     * Gracefully returns an empty array if no records exist (e.g., when loading older tours).
     */
    static async getTourConcierges(tourId: string, client?: SupabaseClient): Promise<TourConciergeDTO[]> {
        const dbClient = client || supabase;
        if (!tourId) return [];

        try {
            const { data, error } = await dbClient
                .from('tour_itinerary_concierges')
                .select(`
                    *,
                    cost_item:seamless_concierge_cost_items (
                        id,
                        cost_code,
                        title,
                        details,
                        category,
                        default_cost,
                        currency,
                        costing_basis,
                        is_generic,
                        is_active
                    )
                `)
                .eq('tour_id', tourId);

            if (error) {
                console.warn("Notice in getTourConcierges (returning empty fallback):", error.message);
                return [];
            }

            return (data || []) as TourConciergeDTO[];
        } catch (err) {
            console.warn("Exception in getTourConcierges (returning empty fallback):", err);
            return [];
        }
    }

    /**
     * Save/Replace selected tour concierge items for a tour.
     * Deletes previous concierge items for tour_id and inserts current selections (both trip-wide and day-assigned).
     */
    static async saveTourConcierges(
        tourId: string,
        items: SaveTourConciergeItemDTO[],
        client?: SupabaseClient
    ): Promise<boolean> {
        const dbClient = client || supabase;
        if (!tourId) throw new Error("Tour ID is required to save concierge configuration.");

        // 1. Delete existing concierge selections for this tour
        const { error: delError } = await dbClient
            .from('tour_itinerary_concierges')
            .delete()
            .eq('tour_id', tourId);

        if (delError) {
            console.error("Error clearing existing tour_itinerary_concierges:", delError);
            throw new Error(`Failed to update tour concierges: ${delError.message}`);
        }

        // 2. Insert new selected items if any
        if (items && items.length > 0) {
            const toInsert = items.map(item => ({
                tour_id: tourId,
                tour_itinerary_id: item.tour_itinerary_id || null,
                concierge_cost_item_id: item.concierge_cost_item_id,
                quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
                cost: item.cost !== undefined && item.cost !== null ? Number(item.cost) : null,
                updated_at: new Date().toISOString()
            }));

            const { error: insError } = await dbClient
                .from('tour_itinerary_concierges')
                .insert(toInsert);

            if (insError) {
                console.error("Error inserting tour_itinerary_concierges:", insError);
                throw new Error(`Failed to save tour concierges: ${insError.message}`);
            }
        }

        return true;
    }
}
