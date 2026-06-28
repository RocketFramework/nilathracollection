import { createAdminClient } from '@/utils/supabase/admin';
import { POBlock, POBlockDailyActivity } from '../interfaces/interfaces';

export class POBlockService {
    static async getPOBlocksForTour(tourId: string): Promise<POBlock[]> {
        const adminSupabase = createAdminClient();
        
        // 1. Fetch blocks first (needed to derive blockIds for subsequent queries)
        const { data: blocks, error: blocksErr } = await adminSupabase
            .from('po_blocks')
            .select('*')
            .eq('tour_id', tourId)
            .order('block_number', { ascending: true });

        if (blocksErr) throw blocksErr;
        if (!blocks || blocks.length === 0) return [];

        const blockIds = blocks.map(b => b.id);

        // 2. Fetch mappings, activities, and rfq vendors in parallel
        const [mappingsResult, vendorsResult] = await Promise.all([
            adminSupabase
                .from('po_block_daily_activities')
                .select('*')
                .in('po_block_id', blockIds),
            adminSupabase
                .from('tour_rfq_emails')
                .select('*')
                .in('po_block_id', blockIds)
        ]);

        if (mappingsResult.error) throw mappingsResult.error;
        const mappings = mappingsResult.data || [];

        // 3. Fetch daily activities in parallel with the vendor fetch above
        const dailyActivityIds = mappings.map(m => m.daily_activity_id);
        let activities: any[] = [];
        if (dailyActivityIds.length > 0) {
            const { data: actData, error: actErr } = await adminSupabase
                .from('daily_activities')
                .select('*, tour_itineraries(day_number, date), service_date')
                .in('id', dailyActivityIds);
            if (actErr) throw actErr;
            
            // Filter out records that are activity_type === 'activity' or 'meal' and all vendor/booking references are null
            activities = (actData || []).filter(act => {
                const isInvalidActivity = (act.activity_type === 'activity' || act.activity_type === 'meal') &&
                    !act.vendor_id &&
                    !act.restaurant_id &&
                    !act.vendor_activity_id &&
                    !act.hotel_id;
                return !isInvalidActivity;
            });
        }

        const vendors = vendorsResult.data || [];

        // Assemble joins in memory — sort activities within each block by service_date ascending
        return blocks.map(block => {
            const blockMappings = mappings.filter(m => m.po_block_id === block.id);
            const blockActivities = activities
                .filter(act => blockMappings.some(m => m.daily_activity_id === act.id))
                .sort((a, b) => {
                    const dateA = a.service_date || a.tour_itineraries?.date || '';
                    const dateB = b.service_date || b.tour_itineraries?.date || '';
                    if (!dateA && !dateB) return 0;
                    if (!dateA) return 1;  // nulls last
                    if (!dateB) return -1;
                    return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
                });
            const blockVendors = vendors.filter(v => v.po_block_id === block.id);

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
        blockType: 'accommodation' | 'sleep' | 'travel' | 'meal' | 'restaurant' | 'activity' | 'guide' | 'driver', 
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
        blockType: 'accommodation' | 'sleep' | 'travel' | 'meal' | 'restaurant' | 'activity' | 'guide' | 'driver',
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

    /**
     * Safely deletes a PO block and all associated records.
     * Throws an error if supplier_invoices are linked (cannot delete — invoices exist).
     * Deletes in order: tour_rfq_emails, tour_rfp_emails, purchase_order_items,
     * purchase_orders, po_block_daily_activities, then po_blocks.
     */
    static async deleteBlockWithCascade(blockId: string): Promise<void> {
        const adminSupabase = createAdminClient();

        // 1. Guard: check for supplier invoices linked to this block
        const { data: invoices, error: invErr } = await adminSupabase
            .from('supplier_invoices')
            .select('id')
            .eq('po_block_id', blockId)
            .limit(1);

        if (invErr) throw invErr;
        if (invoices && invoices.length > 0) {
            throw new Error(
                'This block has a supplier invoice associated with it. Please remove the invoice before deleting this block.'
            );
        }

        // 2. Delete tour_rfq_emails for this block
        const { error: rfqErr } = await adminSupabase
            .from('tour_rfq_emails')
            .delete()
            .eq('po_block_id', blockId);
        if (rfqErr) throw rfqErr;

        // 3. Delete tour_rfp_emails for this block
        const { error: rfpErr } = await adminSupabase
            .from('tour_rfp_emails')
            .delete()
            .eq('po_block_id', blockId);
        if (rfpErr) throw rfpErr;

        // 4. Find purchase orders linked to this block, delete their items, then delete the POs
        const { data: pos, error: posErr } = await adminSupabase
            .from('purchase_orders')
            .select('id')
            .eq('po_block_id', blockId);
        if (posErr) throw posErr;

        if (pos && pos.length > 0) {
            const poIds = pos.map(p => p.id);

            const { error: itemsErr } = await adminSupabase
                .from('purchase_order_items')
                .delete()
                .in('purchase_order_id', poIds);
            if (itemsErr) throw itemsErr;

            const { error: poDelErr } = await adminSupabase
                .from('purchase_orders')
                .delete()
                .in('id', poIds);
            if (poDelErr) throw poDelErr;
        }

        // 5. Delete the block itself (cascade handles po_block_daily_activities via FK ON DELETE CASCADE)
        const { error: blockErr } = await adminSupabase
            .from('po_blocks')
            .delete()
            .eq('id', blockId);
        if (blockErr) throw blockErr;
    }

    /**
     * Bulk-inserts multiple PO blocks and their activity mappings in 2 DB round-trips
     * instead of N×2 serial calls. Preserves block_number ordering.
     */
    private static async createPOBlocksBatch(
        tourId: string,
        descriptors: Array<{ name: string; blockType: string; blockNumber: number; dailyActivityIds: string[] }>
    ): Promise<void> {
        if (descriptors.length === 0) return;
        const adminSupabase = createAdminClient();

        // 1. Bulk insert all blocks in one call
        const { data: blocks, error: blockErr } = await adminSupabase
            .from('po_blocks')
            .insert(descriptors.map(d => ({
                tour_id: tourId,
                name: d.name,
                block_type: d.blockType,
                block_number: d.blockNumber
            })))
            .select('id, block_number');

        if (blockErr) throw blockErr;

        // 2. Build all mapping rows, matched by block_number
        const mappings: Array<{ po_block_id: string; daily_activity_id: string }> = [];
        for (const block of blocks || []) {
            const desc = descriptors.find(d => d.blockNumber === block.block_number);
            if (desc) {
                for (const actId of desc.dailyActivityIds) {
                    mappings.push({ po_block_id: block.id, daily_activity_id: actId });
                }
            }
        }

        // 3. Bulk insert all mappings in one call
        if (mappings.length > 0) {
            const { error: mapErr } = await adminSupabase
                .from('po_block_daily_activities')
                .insert(mappings);
            if (mapErr) throw mapErr;
        }
    }

    static async initializeDefaultBlocks(tourId: string): Promise<POBlock[]> {
        const adminSupabase = createAdminClient();

        // 1. Fetch all existing blocks and all daily activities in parallel
        const [existingBlocks, activityResult] = await Promise.all([
            this.getPOBlocksForTour(tourId),
            adminSupabase
                .from('daily_activities')
                .select('id, activity_type, hotel_id, transport_id, restaurant_id, vendor_id, driver_id, guide_id, vehicle_id, vendor_activity_id, service_date, tour_itineraries(day_number, date)')
                .eq('tour_id', tourId)
        ]);

        const finalizedBlocks = existingBlocks.filter(b => b.has_finalized === true);
        const nonFinalizedBlocks = existingBlocks.filter(b => b.has_finalized !== true);

        if (activityResult.error) throw activityResult.error;
        const rawActivities = activityResult.data || [];

        // Filter to only meaningful activities
        const activities = rawActivities.filter(act => {
            const isInvalidActivity = (act.activity_type === 'activity' || act.activity_type === 'meal') &&
                !act.vendor_id && !act.transport_id && !act.driver_id && !act.guide_id &&
                !act.restaurant_id && !act.vehicle_id && !act.vendor_activity_id && !act.hotel_id;
            return !isInvalidActivity;
        });

        if (activities.length === 0) return existingBlocks;

        // Find activities not already in finalized blocks
        const finalizedActivityIds = new Set<string>();
        finalizedBlocks.forEach(b => b.daily_activities?.forEach(act => { if (act.id) finalizedActivityIds.add(act.id); }));
        const activitiesToGroup = activities.filter(act => !finalizedActivityIds.has(act.id));

        // FIX B: Compare activity signatures — skip full rebuild if nothing changed
        if (nonFinalizedBlocks.length > 0) {
            const buildSig = (acts: any[]) =>
                acts.map(a => `${a.id}:${a.hotel_id || ''}:${a.transport_id || ''}:${a.restaurant_id || ''}:${a.vendor_id || ''}:${a.guide_id || ''}:${a.driver_id || ''}`)
                    .sort().join('|');

            const incomingSig = buildSig(activitiesToGroup);
            const existingSig = buildSig(
                nonFinalizedBlocks.flatMap(b => b.daily_activities || [])
            );

            // Guard: if all non-finalized blocks have zero activities mapped,
            // the mappings are missing — force a rebuild regardless of signatures.
            const allBlocksHaveNoMappings = nonFinalizedBlocks.every(b => (b.daily_activities || []).length === 0);

            if (!allBlocksHaveNoMappings && incomingSig === existingSig) {
                return existingBlocks; // Nothing changed — skip all writes
            }
        }


        // Delete non-finalized blocks (cascade handles mapping rows)
        if (nonFinalizedBlocks.length > 0) {
            const { error: deleteErr } = await adminSupabase
                .from('po_blocks')
                .delete()
                .in('id', nonFinalizedBlocks.map(b => b.id));
            if (deleteErr) throw deleteErr;
        }

        if (activitiesToGroup.length === 0) return this.getPOBlocksForTour(tourId);

        let currentBlockNumber = finalizedBlocks.length > 0
            ? Math.max(...finalizedBlocks.map(b => b.block_number || 0)) + 1
            : 1;

        // FIX C: Collect all block descriptors first, then batch-create in 2 DB calls per category

        // ── 1. SLEEP & Hotel Associated Activities: group by hotel_id ────────────────
        const sleepGroups = new Map<string | null, any[]>();
        activitiesToGroup.filter(a => a.activity_type === 'sleep' || a.hotel_id).forEach(act => {
            const key = act.hotel_id || null;
            if (!sleepGroups.has(key)) sleepGroups.set(key, []);
            sleepGroups.get(key)!.push(act);
        });

        const hotelActivityIds = new Set(
            Array.from(sleepGroups.values()).flatMap(g => g.map(a => a.id))
        );
        const remainingActivities = activitiesToGroup.filter(a => !hotelActivityIds.has(a.id));

        const hotelIds = Array.from(sleepGroups.keys()).filter(Boolean) as string[];
        const [{ data: hotelsData }, travelResult, restaurantResult, vendorResult, guideResult, driverResult] = await Promise.all([
            hotelIds.length > 0
                ? adminSupabase.from('hotels').select('id, name').in('id', hotelIds)
                : Promise.resolve({ data: [] as any[], error: null }),
            // ── 2. TRAVEL: group by transport_id (one block per provider, whole trip) ──
            (async () => {
                const travelGroups = new Map<string, any[]>();
                remainingActivities.filter(a => a.activity_type === 'travel' && a.transport_id).forEach(act => {
                    const key = act.transport_id!;
                    if (!travelGroups.has(key)) travelGroups.set(key, []);
                    travelGroups.get(key)!.push(act);
                });
                const transportIds = Array.from(travelGroups.keys());
                const { data: providers } = transportIds.length > 0
                    ? await adminSupabase.from('transport_providers').select('id, name').in('id', transportIds)
                    : { data: [] as any[] };
                return { groups: travelGroups, lookup: providers || [] };
            })(),
            // ── 3. MEAL: group by restaurant_id ─────────────────────────────────────
            (async () => {
                const mealGroups = new Map<string | null, any[]>();
                remainingActivities.filter(a => a.activity_type === 'meal').forEach(act => {
                    const key = act.restaurant_id || null;
                    if (!mealGroups.has(key)) mealGroups.set(key, []);
                    mealGroups.get(key)!.push(act);
                });
                const restaurantIds = Array.from(mealGroups.keys()).filter(Boolean) as string[];
                const { data: rests } = restaurantIds.length > 0
                    ? await adminSupabase.from('restaurants').select('id, name').in('id', restaurantIds)
                    : { data: [] as any[] };
                return { groups: mealGroups, lookup: rests || [] };
            })(),
            // ── 4. ACTIVITY: group by vendor_id ─────────────────────────────────────
            (async () => {
                const actGroups = new Map<string | null, any[]>();
                remainingActivities.filter(a => a.activity_type === 'activity').forEach(act => {
                    const key = act.vendor_id || null;
                    if (!actGroups.has(key)) actGroups.set(key, []);
                    actGroups.get(key)!.push(act);
                });
                const vendorIds = Array.from(actGroups.keys()).filter(Boolean) as string[];
                const { data: vendors } = vendorIds.length > 0
                    ? await adminSupabase.from('vendors').select('id, name').in('id', vendorIds)
                    : { data: [] as any[] };
                return { groups: actGroups, lookup: vendors || [] };
            })(),
            // ── 5. GUIDE: group by guide_id ─────────────────────────────────────────
            (async () => {
                const guideIds = Array.from(new Set(activitiesToGroup.map(a => a.guide_id).filter(Boolean))) as string[];
                const { data: guides } = guideIds.length > 0
                    ? await adminSupabase.from('tour_guides').select('id, name, daily_rate').in('id', guideIds)
                    : { data: [] as any[] };
                return { guideIds, lookup: guides || [] };
            })(),
            // ── 6. DRIVER: group by driver_id ─────────────────────────────────────────
            (async () => {
                const driverIds = Array.from(new Set(activitiesToGroup.map(a => a.driver_id).filter(Boolean))) as string[];
                const { data: drivers } = driverIds.length > 0
                    ? await adminSupabase.from('drivers').select('id, first_name, last_name, per_day_rate').in('id', driverIds)
                    : { data: [] as any[] };
                return { driverIds, lookup: drivers || [] };
            })()
        ]);

        const hotels = hotelsData || [];
        const { groups: travelGroups, lookup: transportProviders } = travelResult;
        const { groups: mealGroups, lookup: restaurants } = restaurantResult;
        const { groups: activityGroups, lookup: activityVendors } = vendorResult;
        const { guideIds, lookup: tourGuides } = guideResult;
        const { driverIds, lookup: tourDrivers } = driverResult;

        // Build all descriptors, then batch-insert each category
        const sleepDescriptors = Array.from(sleepGroups.entries()).map(([hotelId, group]) => ({
            name: `${hotels.find(h => h.id === hotelId)?.name ?? 'Unassigned Hotel'} Block`,
            blockType: 'sleep',
            blockNumber: currentBlockNumber++,
            dailyActivityIds: group.map(a => a.id)
        }));

        const travelDescriptors = Array.from(travelGroups.entries()).map(([transportId, group]) => ({
            name: `${transportProviders.find(p => p.id === transportId)?.name ?? 'Unassigned Transport'} Block`,
            blockType: 'travel',
            blockNumber: currentBlockNumber++,
            dailyActivityIds: group.map(a => a.id)
        }));

        const mealDescriptors = Array.from(mealGroups.entries()).map(([restaurantId, group]) => ({
            name: `${restaurants.find(r => r.id === restaurantId)?.name ?? 'Unassigned Restaurant'} Block`,
            blockType: 'meal',
            blockNumber: currentBlockNumber++,
            dailyActivityIds: group.map(a => a.id)
        }));

        const activityDescriptors = Array.from(activityGroups.entries()).map(([vendorId, group]) => ({
            name: `${activityVendors.find(v => v.id === vendorId)?.name ?? 'Unassigned Activity'} Block`,
            blockType: 'activity',
            blockNumber: currentBlockNumber++,
            dailyActivityIds: group.map(a => a.id)
        }));

        const guideDescriptors = guideIds.map(guideId => {
            const guide = tourGuides.find((g: any) => g.id === guideId);
            return {
                name: `Guide: ${guide?.name || 'Unassigned Guide'} | ID: ${guideId}`,
                blockType: 'guide',
                blockNumber: currentBlockNumber++,
                dailyActivityIds: [] // Keep empty!
            };
        });

        const driverDescriptors = driverIds.map(driverId => {
            const driver = tourDrivers.find((d: any) => d.id === driverId);
            const driverName = driver ? `${driver.first_name || ''} ${driver.last_name || ''}`.trim() : 'Unassigned Driver';
            return {
                name: `Driver: ${driverName} | ID: ${driverId}`,
                blockType: 'driver',
                blockNumber: currentBlockNumber++,
                dailyActivityIds: [] // Keep empty!
            };
        });

        // Batch create all block types in parallel (each batch is 2 calls: insert blocks + insert mappings)
        await Promise.all([
            this.createPOBlocksBatch(tourId, sleepDescriptors),
            this.createPOBlocksBatch(tourId, travelDescriptors),
            this.createPOBlocksBatch(tourId, mealDescriptors),
            this.createPOBlocksBatch(tourId, activityDescriptors),
            this.createPOBlocksBatch(tourId, guideDescriptors),
            this.createPOBlocksBatch(tourId, driverDescriptors)
        ]);

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

    static async getGuideDailyActivitiesForTour(tourId: string): Promise<any[]> {
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
            .from('daily_activities')
            .select('*')
            .eq('tour_id', tourId)
            .eq('activity_type', 'travel')
            .is('transport_id', null)
            .is('vendor_id', null)
            .not('guide_id', 'is', null);
        if (error) throw error;
        return data || [];
    }

    static async saveGuideDailyActivities(tourId: string, guideId: string, activities: any[]): Promise<void> {
        const adminSupabase = createAdminClient();
        
        // 1. Delete existing guide activities for this guide
        const { error: deleteErr } = await adminSupabase
            .from('daily_activities')
            .delete()
            .eq('tour_id', tourId)
            .eq('activity_type', 'travel')
            .is('transport_id', null)
            .is('vendor_id', null)
            .eq('guide_id', guideId);
            
        if (deleteErr) throw deleteErr;
        
        // 2. Insert new ones
        if (activities.length > 0) {
            const { error: insertErr } = await adminSupabase
                .from('daily_activities')
                .insert(activities.map(act => ({
                    tour_id: tourId,
                    activity_type: 'travel',
                    guide_id: guideId,
                    service_date: act.service_date,
                    quantity: act.quantity || 1,
                    contracted_price: act.contracted_price || 0,
                    contracted_total_price: act.contracted_total_price || 0,
                    charged_unit_price: act.charged_unit_price || 0,
                    charged_total_price: act.charged_total_price || 0,
                    title: 'Tour Guide Services',
                    description: act.description || ''
                })));
            if (insertErr) throw insertErr;
        }
    }

    static async getDriverDailyActivitiesForTour(tourId: string): Promise<any[]> {
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
            .from('daily_activities')
            .select('*')
            .eq('tour_id', tourId)
            .eq('activity_type', 'travel')
            .is('transport_id', null)
            .is('vendor_id', null)
            .not('driver_id', 'is', null);
        if (error) throw error;
        return data || [];
    }

    static async saveDriverDailyActivities(tourId: string, driverId: string, activities: any[]): Promise<void> {
        const adminSupabase = createAdminClient();
        
        // 1. Delete existing driver activities for this driver
        const { error: deleteErr } = await adminSupabase
            .from('daily_activities')
            .delete()
            .eq('tour_id', tourId)
            .eq('activity_type', 'travel')
            .is('transport_id', null)
            .is('vendor_id', null)
            .eq('driver_id', driverId);
            
        if (deleteErr) throw deleteErr;
        
        // 2. Insert new ones
        if (activities.length > 0) {
            const { error: insertErr } = await adminSupabase
                .from('daily_activities')
                .insert(activities.map(act => ({
                    tour_id: tourId,
                    activity_type: 'travel',
                    driver_id: driverId,
                    service_date: act.service_date,
                    quantity: act.quantity || 1,
                    contracted_price: act.contracted_price || 0,
                    contracted_total_price: act.contracted_total_price || 0,
                    charged_unit_price: act.charged_unit_price || 0,
                    charged_total_price: act.charged_total_price || 0,
                    title: 'Driver Services',
                    description: act.description || ''
                })));
            if (insertErr) throw insertErr;
        }
    }
}
