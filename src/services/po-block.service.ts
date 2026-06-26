import { createAdminClient } from '@/utils/supabase/admin';
import { POBlock, POBlockDailyActivity } from '../interfaces/interfaces';

export class POBlockService {
    static async getPOBlocksForTour(tourId: string): Promise<POBlock[]> {
        const adminSupabase = createAdminClient();
        
        // 1. Fetch blocks
        const { data: blocks, error: blocksErr } = await adminSupabase
            .from('po_blocks')
            .select('*')
            .eq('tour_id', tourId)
            .order('block_number', { ascending: true });

        if (blocksErr) throw blocksErr;
        if (!blocks || blocks.length === 0) return [];

        // 2. Fetch block daily activities mappings
        const blockIds = blocks.map(b => b.id);
        const { data: mappings, error: mapErr } = await adminSupabase
            .from('po_block_daily_activities')
            .select('*')
            .in('po_block_id', blockIds);

        if (mapErr) throw mapErr;

        // 3. Fetch all daily activities for these mappings
        const dailyActivityIds = mappings?.map(m => m.daily_activity_id) || [];
        let activities: any[] = [];
        if (dailyActivityIds.length > 0) {
            const { data: actData, error: actErr } = await adminSupabase
                .from('daily_activities')
                .select('*, tour_itineraries(day_number, date)')
                .in('id', dailyActivityIds);
            if (actErr) throw actErr;
            
            // Filter out records that are activity_type === 'activity' or 'meal' and all vendor/booking references are null
            const filteredActivities = (actData || []).filter(act => {
                const isInvalidActivity = (act.activity_type === 'activity' || act.activity_type === 'meal') &&
                    !act.vendor_id &&
                    !act.restaurant_id &&
                    !act.vendor_activity_id &&
                    !act.hotel_id;
                return !isInvalidActivity;
            });
            activities = filteredActivities;
        }

        // 4. Fetch daily activity vendors (quotation requests/proposals) from tour_rfq_emails for these blocks
        const { data: vendors, error: venErr } = await adminSupabase
            .from('tour_rfq_emails')
            .select('*')
            .in('po_block_id', blockIds);
            
        if (venErr) throw venErr;

        // Assemble joins in memory
        return blocks.map(block => {
            const blockMappings = mappings?.filter(m => m.po_block_id === block.id) || [];
            const blockActivities = activities.filter(act => 
                blockMappings.some(m => m.daily_activity_id === act.id)
            );
            const blockVendors = vendors?.filter(v => v.po_block_id === block.id) || [];

            return {
                ...block,
                daily_activities: blockActivities,
                daily_activity_vendors: blockVendors
            };
        });
    }

    static async createPOBlock(
        tourId: string, 
        name: string, 
        blockType: 'accommodation' | 'sleep' | 'travel' | 'meal' | 'restaurant' | 'activity', 
        blockNumber: number, 
        dailyActivityIds: string[]
    ): Promise<POBlock> {
        const adminSupabase = createAdminClient();

        // 1. Insert block
        const { data: block, error: blockErr } = await adminSupabase
            .from('po_blocks')
            .insert({
                tour_id: tourId,
                name,
                block_type: blockType,
                block_number: blockNumber
            })
            .select()
            .single();

        if (blockErr) throw blockErr;

        // 2. Insert mappings
        if (dailyActivityIds.length > 0) {
            const mappingPayload = dailyActivityIds.map(id => ({
                po_block_id: block.id,
                daily_activity_id: id
            }));

            const { error: mapErr } = await adminSupabase
                .from('po_block_daily_activities')
                .insert(mappingPayload);

            if (mapErr) throw mapErr;
        }

        return block;
    }

    static async updatePOBlock(
        blockId: string,
        name: string,
        blockType: 'accommodation' | 'sleep' | 'travel' | 'meal' | 'restaurant' | 'activity',
        dailyActivityIds: string[]
    ): Promise<void> {
        const adminSupabase = createAdminClient();

        // 1. Update po_blocks fields
        const { error: blockErr } = await adminSupabase
            .from('po_blocks')
            .update({ name, block_type: blockType, updated_at: new Date().toISOString() })
            .eq('id', blockId);

        if (blockErr) throw blockErr;

        // 2. Clear old mappings
        const { error: deleteErr } = await adminSupabase
            .from('po_block_daily_activities')
            .delete()
            .eq('po_block_id', blockId);

        if (deleteErr) throw deleteErr;

        // 3. Insert new mappings
        if (dailyActivityIds.length > 0) {
            const mappingPayload = dailyActivityIds.map(id => ({
                po_block_id: blockId,
                daily_activity_id: id
            }));

            const { error: mapErr } = await adminSupabase
                .from('po_block_daily_activities')
                .insert(mappingPayload);

            if (mapErr) throw mapErr;
        }
    }

    static async deletePOBlock(blockId: string): Promise<void> {
        const adminSupabase = createAdminClient();
        
        // Deleting block cascade deletes mappings in po_block_daily_activities
        const { error } = await adminSupabase
            .from('po_blocks')
            .delete()
            .eq('id', blockId);

        if (error) throw error;
    }

    static async initializeDefaultBlocks(tourId: string): Promise<POBlock[]> {
        const adminSupabase = createAdminClient();

        // 1. Fetch all existing blocks for this tour
        const existingBlocks = await this.getPOBlocksForTour(tourId);
        
        // Split existing blocks into finalized and non-finalized
        const finalizedBlocks = existingBlocks.filter(b => b.has_finalized === true);
        const nonFinalizedBlocks = existingBlocks.filter(b => b.has_finalized !== true);

        // 2. Clear non-finalized blocks (this will cascade delete mapping rows)
        if (nonFinalizedBlocks.length > 0) {
            const nonFinalizedIds = nonFinalizedBlocks.map(b => b.id);
            const { error: deleteErr } = await adminSupabase
                .from('po_blocks')
                .delete()
                .in('id', nonFinalizedIds);
            if (deleteErr) throw deleteErr;
        }

        // Fetch all daily activities for the tour
        const { data: rawActivities, error: actErr } = await adminSupabase
            .from('daily_activities')
            .select('*, tour_itineraries(day_number, date)')
            .eq('tour_id', tourId);

        if (actErr) throw actErr;
        if (!rawActivities || rawActivities.length === 0) {
            return this.getPOBlocksForTour(tourId);
        }

        // Filter out records that are activity_type === 'activity' or 'meal' and all vendor/booking references are null
        const activities = rawActivities.filter(act => {
            const isInvalidActivity = (act.activity_type === 'activity' || act.activity_type === 'meal') &&
                !act.vendor_id &&
                !act.transport_id &&
                !act.driver_id &&
                !act.guide_id &&
                !act.restaurant_id &&
                !act.vehicle_id &&
                !act.vendor_activity_id &&
                !act.hotel_id;
            return !isInvalidActivity;
        });

        if (activities.length === 0) {
            return this.getPOBlocksForTour(tourId);
        }

        // Determine starting block number to keep them consecutive and unique
        let currentBlockNumber = 1;
        if (finalizedBlocks.length > 0) {
            currentBlockNumber = Math.max(...finalizedBlocks.map(b => b.block_number || 0)) + 1;
        }

        // Find daily activity IDs that are already mapped to finalized blocks
        const finalizedActivityIds = new Set<string>();
        finalizedBlocks.forEach(b => {
            b.daily_activities?.forEach(act => {
                if (act.id) finalizedActivityIds.add(act.id);
            });
        });

        // Filter out daily activities that are already in finalized blocks
        const activitiesToGroup = activities.filter(act => !finalizedActivityIds.has(act.id));
        const createdBlocks: POBlock[] = [];

        // 1. SLEEP: select only sleep, group strictly by hotel_id
        const sleepActivities = activitiesToGroup.filter(act => act.activity_type === 'sleep');
        const sleepGroups = new Map<string | null, any[]>();
        sleepActivities.forEach(act => {
            const hotelId = act.hotel_id || null;
            if (!sleepGroups.has(hotelId)) {
                sleepGroups.set(hotelId, []);
            }
            sleepGroups.get(hotelId)!.push(act);
        });

        // Resolve hotel names
        const hotelIds = Array.from(sleepGroups.keys()).filter(Boolean) as string[];
        let hotels: { id: string, name: string }[] = [];
        if (hotelIds.length > 0) {
            const { data: hotelData } = await adminSupabase
                .from('hotels')
                .select('id, name')
                .in('id', hotelIds);
            hotels = hotelData || [];
        }

        for (const [hotelId, group] of sleepGroups.entries()) {
            const hotelObj = hotels.find(h => h.id === hotelId);
            const hotelName = hotelObj ? hotelObj.name : 'Unassigned Hotel';
            const name = `${hotelName} Block`;
            const ids = group.map(a => a.id);
            const block = await this.createPOBlock(tourId, name, 'sleep', currentBlockNumber++, ids);
            createdBlocks.push(block);
        }

        // 2. TRAVEL: select only travel, filter to those with transport_id, group by transport_id
        const travelActivities = activitiesToGroup.filter(act => act.activity_type === 'travel' && act.transport_id);
        const travelGroups = new Map<string, any[]>();
        travelActivities.forEach(act => {
            const transportId = act.transport_id!;
            if (!travelGroups.has(transportId)) {
                travelGroups.set(transportId, []);
            }
            travelGroups.get(transportId)!.push(act);
        });

        const transportIds = Array.from(travelGroups.keys());
        let transportProviders: { id: string, name: string }[] = [];
        if (transportIds.length > 0) {
            const { data: providerData } = await adminSupabase
                .from('transport_providers')
                .select('id, name')
                .in('id', transportIds);
            transportProviders = providerData || [];
        }

        for (const [transportId, group] of travelGroups.entries()) {
            const providerObj = transportProviders.find(p => p.id === transportId);
            const providerName = providerObj ? providerObj.name : 'Unassigned Transport';
            const name = `${providerName} Block`;
            const ids = group.map(a => a.id);
            const block = await this.createPOBlock(tourId, name, 'travel', currentBlockNumber++, ids);
            createdBlocks.push(block);
        }

        // 3. MEAL: select only meal, group by restaurant_id
        const mealActivities = activitiesToGroup.filter(act => act.activity_type === 'meal');
        const mealGroups = new Map<string | null, any[]>();
        mealActivities.forEach(act => {
            const restaurantId = act.restaurant_id || null;
            if (!mealGroups.has(restaurantId)) {
                mealGroups.set(restaurantId, []);
            }
            mealGroups.get(restaurantId)!.push(act);
        });

        const restaurantIds = Array.from(mealGroups.keys()).filter(Boolean) as string[];
        let restaurants: { id: string, name: string }[] = [];
        if (restaurantIds.length > 0) {
            const { data: restData } = await adminSupabase
                .from('restaurants')
                .select('id, name')
                .in('id', restaurantIds);
            restaurants = restData || [];
        }

        for (const [restaurantId, group] of mealGroups.entries()) {
            const restObj = restaurants.find(r => r.id === restaurantId);
            const restName = restObj ? restObj.name : 'Unassigned Restaurant';
            const name = `${restName} Block`;
            const ids = group.map(a => a.id);
            const block = await this.createPOBlock(tourId, name, 'meal', currentBlockNumber++, ids);
            createdBlocks.push(block);
        }

        // 4. ACTIVITY: select only activity, group by vendor_id
        const regularActivities = activitiesToGroup.filter(act => act.activity_type === 'activity');
        const activityGroups = new Map<string | null, any[]>();
        regularActivities.forEach(act => {
            const vendorId = act.vendor_id || null;
            if (!activityGroups.has(vendorId)) {
                activityGroups.set(vendorId, []);
            }
            activityGroups.get(vendorId)!.push(act);
        });

        const activityVendorIds = Array.from(activityGroups.keys()).filter(Boolean) as string[];
        let activityVendors: { id: string, name: string }[] = [];
        if (activityVendorIds.length > 0) {
            const { data: vData } = await adminSupabase
                .from('vendors')
                .select('id, name')
                .in('id', activityVendorIds);
            activityVendors = vData || [];
        }

        for (const [vendorId, group] of activityGroups.entries()) {
            const vendorObj = activityVendors.find(v => v.id === vendorId);
            const vendorName = vendorObj ? vendorObj.name : 'Unassigned Activity';
            const name = `${vendorName} Block`;
            const ids = group.map(a => a.id);
            const block = await this.createPOBlock(tourId, name, 'activity', currentBlockNumber++, ids);
            createdBlocks.push(block);
        }

        return this.getPOBlocksForTour(tourId);
    }

    static async finalizePOBlock(blockId: string): Promise<void> {
        const adminSupabase = createAdminClient();
        const { error } = await adminSupabase
            .from('po_blocks')
            .update({ 
                has_finalized: true, 
                updated_at: new Date().toISOString() 
            })
            .eq('id', blockId);
        if (error) throw error;
    }
}
