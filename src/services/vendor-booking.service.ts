import { createAdminClient } from '@/utils/supabase/admin';
import { CreateVendorBookingDTO, UpdateBookingStatusDTO } from '../dtos/vendor-booking.dto';
import { VendorBooking } from '../types/vendor-booking.type';
import { FinanceService } from './finance.service';

export class VendorBookingService {
    /**
     * Creates a service booking request directly as a Draft Purchase Order with high-fidelity items.
     */
    static async createBookingRequest(dto: CreateVendorBookingDTO): Promise<VendorBooking> {
        const supabase = createAdminClient();
        const { daily_activity_ids, ...bookingData } = dto;

        // 1. Fetch vendor contact info from master tables to populate PO header
        let vendorAddress = '';
        let vendorPhone = '';
        let vendorEmail = '';

        try {
            if (bookingData.vendor_type === 'hotel') {
                const { data: v } = await supabase.from('hotels').select('location_address, reservation_agent_contact, reservation_email').eq('id', bookingData.vendor_id).single();
                if (v) {
                    vendorAddress = v.location_address || '';
                    vendorPhone = v.reservation_agent_contact || '';
                    vendorEmail = v.reservation_email || '';
                }
            } else if (bookingData.vendor_type === 'vendor') {
                const { data: v } = await supabase.from('vendors').select('address, phone, email').eq('id', bookingData.vendor_id).single();
                if (v) {
                    vendorAddress = v.address || '';
                    vendorPhone = v.phone || '';
                    vendorEmail = v.email || '';
                }
            } else if (bookingData.vendor_type === 'transport_provider') {
                const { data: v } = await supabase.from('transport_providers').select('address, phone, email').eq('id', bookingData.vendor_id).single();
                if (v) {
                    vendorAddress = v.address || '';
                    vendorPhone = v.phone || '';
                    vendorEmail = v.email || '';
                }
            } else if (bookingData.vendor_type === 'tour_guide') {
                const { data: v } = await supabase.from('tour_guides').select('phone').eq('id', bookingData.vendor_id).single();
                if (v) {
                    vendorPhone = v.phone || '';
                }
            } else if (bookingData.vendor_type === 'driver') {
                const { data: v } = await supabase.from('drivers').select('phone').eq('id', bookingData.vendor_id).single();
                if (v) {
                    vendorPhone = v.phone || '';
                }
            } else if (bookingData.vendor_type === 'restaurant') {
                const { data: v } = await supabase.from('restaurants').select('address, contact_number, email').eq('id', bookingData.vendor_id).single();
                if (v) {
                    vendorAddress = v.address || '';
                    vendorPhone = v.contact_number || '';
                    vendorEmail = v.email || '';
                }
            }
        } catch (err) {
            console.error("Failed to load vendor details for PO creation:", err);
        }

        // 2. Retrieve linked daily activities to create PO items
        const poItems: any[] = [];
        // Junction rows for transport POs (one per travel leg)
        const transportJunctionRows: Array<{
            purchase_order_item_id: string;
            daily_activity_id: string;
            transport_requirement_id: string | null;
            day_rate: number;
            max_km_per_day: number;
            additional_km_rate: number;
            total_km_for_day: number;
        }> = [];
        let calculatedSubtotal = 0;

        if (daily_activity_ids && daily_activity_ids.length > 0) {
            const isTransport = bookingData.vendor_type === 'transport_provider';

            const { data: activities, error: actErr } = await supabase
                .from('daily_activities')
                .select('*, tour_itineraries(date, day_number)')
                .in('id', daily_activity_ids);

            if (actErr) throw actErr;

            if (activities && activities.length > 0) {

                if (isTransport) {
                    // ── TRANSPORT PATH ───────────────────────────────────────────────────
                    // Group all travel legs by their service date → one PO item per day.

                    // Collect all unique transport_requirement_ids so we can fetch vehicle pricing
                    const requirementIds = [
                        ...new Set(
                            activities
                                .map((a: any) => a.transport_requirement_id)
                                .filter(Boolean)
                        )
                    ] as string[];

                    // Fetch vehicle pricing for each requirement
                    // transport_requirement_vehicles has requirement_id, vehicle_id, quantity
                    // transport_vehicles has day_rate, max_km_per_day, additional_km_rate
                    let vehiclePricingByReqId: Record<string, {
                        day_rate: number;
                        max_km_per_day: number;
                        additional_km_rate: number;
                        quantity: number;
                    }[]> = {};

                    if (requirementIds.length > 0) {
                        const { data: reqVehicles, error: rvErr } = await supabase
                            .from('transport_requirement_vehicles')
                            .select('requirement_id, quantity, vehicle:transport_vehicles(day_rate, max_km_per_day, additional_km_rate)')
                            .in('requirement_id', requirementIds);

                        if (rvErr) throw rvErr;

                        for (const rv of (reqVehicles || [])) {
                            const v = (rv as any).vehicle || {};
                            if (!vehiclePricingByReqId[rv.requirement_id]) {
                                vehiclePricingByReqId[rv.requirement_id] = [];
                            }
                            vehiclePricingByReqId[rv.requirement_id].push({
                                day_rate: Number(v.day_rate) || 0,
                                max_km_per_day: Number(v.max_km_per_day) || 0,
                                additional_km_rate: Number(v.additional_km_rate) || 0,
                                quantity: Number(rv.quantity) || 1,
                            });
                        }
                    }

                    // Group legs by service date
                    const dayGroups = new Map<string, typeof activities>();
                    for (const act of activities) {
                        const itin = (act as any).tour_itineraries;
                        const dateKey = act.service_date
                            ? new Date(act.service_date).toISOString().split('T')[0]
                            : itin?.date
                                ? new Date(itin.date).toISOString().split('T')[0]
                                : 'unknown';
                        if (!dayGroups.has(dateKey)) dayGroups.set(dateKey, []);
                        dayGroups.get(dateKey)!.push(act);
                    }

                    // Sort each day group by itinerary day_number for correct description order
                    for (const [, legs] of dayGroups) {
                        legs.sort((a: any, b: any) => {
                            const dA = a.tour_itineraries?.day_number || 0;
                            const dB = b.tour_itineraries?.day_number || 0;
                            return dA - dB;
                        });
                    }

                    for (const [dateKey, legs] of dayGroups) {
                        const firstLeg = legs[0] as any;
                        const itin = firstLeg.tour_itineraries;
                        const dayNum = itin?.day_number || firstLeg.day_number || null;

                        // total_km_for_day = SUM of quantity (= km) across all legs on this day
                        const totalKmForDay = legs.reduce((sum: number, a: any) => sum + (Number(a.quantity) || 0), 0);

                        // Build description: "Day N Transport – <from> → <to>"
                        const fromLocation = firstLeg.pickup_location || firstLeg.location_name || firstLeg.title || 'Origin';
                        const lastLeg = legs[legs.length - 1] as any;
                        const toLocation = lastLeg.dropoff_location || lastLeg.destination_location || lastLeg.title || 'Destination';
                        const description = dayNum
                            ? `Day ${dayNum} Transport – ${fromLocation} → ${toLocation}`
                            : `Transport – ${fromLocation} → ${toLocation}`;

                        // Compute day price from vehicle pricing
                        // Sum across all unique requirement ids on legs of this day
                        const reqIdsForDay = [
                            ...new Set(legs.map((a: any) => a.transport_requirement_id).filter(Boolean))
                        ] as string[];

                        let dayRate = 0;
                        let maxKmPerDay = 0;
                        let additionalKmRate = 0;
                        let snapshotDayRate = 0;
                        let snapshotMaxKm = 0;
                        let snapshotAdditionalRate = 0;

                        for (const reqId of reqIdsForDay) {
                            const vehicles = vehiclePricingByReqId[reqId] || [];
                            for (const v of vehicles) {
                                // Each vehicle type contributes (day_rate * quantity) to the day rate
                                dayRate += v.day_rate * v.quantity;
                                // For max_km and additional rate — use max across vehicles (or first)
                                if (maxKmPerDay === 0) maxKmPerDay = v.max_km_per_day;
                                if (additionalKmRate === 0) additionalKmRate = v.additional_km_rate;
                                // Snapshot the first vehicle's base values (for junction row)
                                if (snapshotDayRate === 0) snapshotDayRate = v.day_rate;
                                if (snapshotMaxKm === 0) snapshotMaxKm = v.max_km_per_day;
                                if (snapshotAdditionalRate === 0) snapshotAdditionalRate = v.additional_km_rate;
                            }
                        }

                        // If no vehicle pricing found, fall back to contracted values on activities
                        if (dayRate === 0) {
                            dayRate = legs.reduce((sum: number, a: any) => sum + (Number(a.contracted_total_price) || 0), 0);
                        }

                        const extraKm = Math.max(0, totalKmForDay - maxKmPerDay);
                        const extraKmCharge = extraKm * additionalKmRate;
                        const dayTotalPrice = dayRate + extraKmCharge;

                        calculatedSubtotal += dayTotalPrice;

                        const poItemId = crypto.randomUUID();
                        poItems.push({
                            id: poItemId,
                            // No daily_activity_id on the item itself — legs are in junction table
                            description,
                            service_date: dateKey !== 'unknown' ? dateKey : null,
                            quantity: 1,
                            unit_price: dayTotalPrice,
                            total_price: dayTotalPrice,
                            day_number: dayNum,
                        });

                        // Build junction rows — one per leg
                        for (const leg of legs) {
                            transportJunctionRows.push({
                                purchase_order_item_id: poItemId,
                                daily_activity_id: (leg as any).id,
                                transport_requirement_id: (leg as any).transport_requirement_id || null,
                                day_rate: snapshotDayRate,
                                max_km_per_day: snapshotMaxKm,
                                additional_km_rate: snapshotAdditionalRate,
                                total_km_for_day: totalKmForDay,
                            });
                        }
                    }

                } else {
                    // ── NON-TRANSPORT PATH (hotel / restaurant / vendor / guide / driver) ──
                    activities.forEach((act) => {
                        const itin = (act as any).tour_itineraries;
                        const checkInDate = itin?.date || act.created_at ? new Date(itin?.date || act.created_at).toISOString().split('T')[0] : null;
                        const dayNum = itin?.day_number || act.day_number || act.dayNumber || null;

                        let checkOutDate: string | null = null;
                        if (checkInDate) {
                            const checkIn = new Date(checkInDate);
                            const checkOut = new Date(checkIn);
                            checkOut.setDate(checkOut.getDate() + 1);
                            checkOutDate = checkOut.toISOString().split('T')[0];
                        }

                        // Check if negotiated price/quantity columns are missing or empty
                        if (
                            act.quantity === null || act.quantity === undefined ||
                            act.contracted_price === null || act.contracted_price === undefined ||
                            act.contracted_total_price === null || act.contracted_total_price === undefined
                        ) {
                            throw new Error(`Missing negotiated price/quantity for activity "${act.title || 'Service Booking'}". Every service must have quantity, contracted unit price, and contracted total price set.`);
                        }

                        const qty = Number(act.quantity);
                        const unitPrice = Number(act.contracted_price);
                        const totalPrice = Number(act.contracted_total_price);

                        calculatedSubtotal += totalPrice;

                        const service_details: Record<string, any> = {};
                        if (bookingData.vendor_type === 'hotel') {
                            service_details.check_in_date = checkInDate || undefined;
                            service_details.check_out_date = checkOutDate || undefined;
                            service_details.room_type = act.room_type || 'Accommodation';
                            service_details.meal_plan = act.meal_plan || undefined;
                            service_details.number_of_nights = 1;
                        } else if (bookingData.vendor_type === 'restaurant') {
                            service_details.meal_type = act.meal_plan || undefined;
                            service_details.number_of_guests = act.total_heads || act.adults || undefined;
                            service_details.dining_time_start = act.time_start || undefined;
                            service_details.dining_time_end = act.time_end || undefined;
                        }

                        poItems.push({
                            id: crypto.randomUUID(),
                            daily_activity_id: act.id,
                            description: `${bookingData.vendor_name} - ${act.title || 'Accommodation'}`,
                            service_date: checkInDate,
                            quantity: qty,
                            unit_price: unitPrice,
                            total_price: totalPrice,
                            day_number: dayNum,
                            special_notes: act.isCustomPO ? 'Custom PO Service item' : undefined,
                            service_details
                        });
                    });
                }
            }
        }

        const discount = bookingData.discount || 0;
        const tax = bookingData.tax || 0;
        const totalAmount = calculatedSubtotal + tax - discount;

        // 3. Generate and save the PO
        let resolvedPoBlockId = bookingData.po_block_id || null;
        if (!resolvedPoBlockId) {
            if (bookingData.quotation_request_id) {
                try {
                    const { data: rfq } = await supabase
                        .from('tour_rfq_emails')
                        .select('po_block_id')
                        .eq('id', bookingData.quotation_request_id)
                        .maybeSingle();
                    if (rfq?.po_block_id) {
                        resolvedPoBlockId = rfq.po_block_id;
                    }
                } catch (err) {
                    console.error("Failed to resolve po_block_id from quotation_request_id:", err);
                }
            }
            if (!resolvedPoBlockId && daily_activity_ids && daily_activity_ids.length > 0) {
                try {
                    const { data: mapping } = await supabase
                        .from('po_block_daily_activities')
                        .select('po_block_id')
                        .in('daily_activity_id', daily_activity_ids)
                        .limit(1)
                        .maybeSingle();
                    if (mapping?.po_block_id) {
                        resolvedPoBlockId = mapping.po_block_id;
                    }
                } catch (err) {
                    console.error("Failed to resolve po_block_id from daily_activities:", err);
                }
            }
        }

        const poNumber = bookingData.po_number || `PO-${bookingData.vendor_type.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
        const poPayload: any = {
            id: crypto.randomUUID(),
            tour_id: bookingData.tour_id,
            po_number: poNumber,
            po_date: new Date().toISOString().split('T')[0],
            vendor_type: bookingData.vendor_type === 'transport_provider' ? 'transport' : (bookingData.vendor_type === 'tour_guide' ? 'guide' : bookingData.vendor_type),
            vendor_name: bookingData.vendor_name,
            vendor_address: vendorAddress || undefined,
            vendor_phone: vendorPhone || undefined,
            vendor_email: vendorEmail || undefined,
            currency: bookingData.currency || 'USD',
            status: 'Draft',
            subtotal: calculatedSubtotal,
            total_amount: totalAmount,
            discount: discount,
            tax: tax,
            advance_paid: 0,
            balance_payable: totalAmount,
            cancellation_policy: bookingData.cancellation_policy || undefined,
            vendor_notes: bookingData.notes || undefined,
            daily_activity_vendor_id: bookingData.quotation_request_id || null,
            po_block_id: resolvedPoBlockId
        };

        if (bookingData.vendor_type === 'hotel') poPayload.hotel_id = bookingData.vendor_id;
        else if (bookingData.vendor_type === 'vendor') poPayload.activity_vendor_id = bookingData.vendor_id;
        else if (bookingData.vendor_type === 'transport_provider') poPayload.transport_provider_id = bookingData.vendor_id;
        else if (bookingData.vendor_type === 'tour_guide') poPayload.guide_id = bookingData.vendor_id;
        else if (bookingData.vendor_type === 'driver') poPayload.driver_id = bookingData.vendor_id;
        else if (bookingData.vendor_type === 'restaurant') poPayload.restaurant_id = bookingData.vendor_id;

        const savedPOId = await FinanceService.savePurchaseOrder(poPayload, poItems);

        // 3b. Insert transport junction rows if this is a transport PO
        if (transportJunctionRows.length > 0) {
            const { error: junctionErr } = await supabase
                .from('purchase_order_daily_transport_items')
                .insert(transportJunctionRows);
            if (junctionErr) {
                console.error('Failed to insert transport junction rows:', junctionErr);
                throw junctionErr;
            }
        }

        // 4. Update the tour_rfq_emails status if this was initiated from a quote
        if (bookingData.quotation_request_id) {
            await supabase
                .from('tour_rfq_emails')
                .update({ status: 'Selected', selected_vendor: true })
                .eq('id', bookingData.quotation_request_id);
        }

        return {
            id: savedPOId,
            purchase_order_id: savedPOId,
            tour_id: bookingData.tour_id,
            quotation_request_id: bookingData.quotation_request_id || null,
            vendor_type: bookingData.vendor_type,
            vendor_id: bookingData.vendor_id,
            vendor_name: bookingData.vendor_name,
            agreed_price: totalAmount,
            currency: bookingData.currency || 'USD',
            cancellation_policy: bookingData.cancellation_policy || null,
            notes: bookingData.notes || null,
            status: 'Pending',
            daily_activity_ids: daily_activity_ids
        } as any;
    }

    /**
     * Fetches all purchase orders and constructs them as operational bookings for compatibility.
     */
    static async getBookingsForTour(tourId: string) {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('purchase_orders')
            .select(`
                *,
                items:purchase_order_items(
                    id,
                    daily_activity_id,
                    transport_legs:purchase_order_daily_transport_items(
                        daily_activity_id
                    )
                )
            `)
            .eq('tour_id', tourId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((po: any) => {
            let bookingStatus = 'Pending';
            if (po.status === 'Accepted' || po.status === 'Completed') {
                bookingStatus = 'Went Ahead';
            } else if (po.status === 'Sent') {
                bookingStatus = 'Confirmed';
            } else if (po.status === 'Cancelled') {
                bookingStatus = 'Cancelled';
            }

            let vType = po.vendor_type;
            if (vType === 'transport') vType = 'transport_provider';
            else if (vType === 'guide') vType = 'tour_guide';

            const vendorId = po.hotel_id || po.activity_vendor_id || po.transport_provider_id || po.guide_id || po.driver_id || po.restaurant_id || '';

            // For transport POs the daily_activity_id is on the junction table, not the item
            const itemActivityIds = (po.items || [])
                .map((item: any) => item.daily_activity_id)
                .filter((id: any) => !!id);
            const junctionActivityIds = (po.items || [])
                .flatMap((item: any) => item.transport_legs || [])
                .map((leg: any) => leg.daily_activity_id)
                .filter((id: any) => !!id);
            const allActivityIds = [...new Set([...itemActivityIds, ...junctionActivityIds])];


            return {
                id: po.id,
                purchase_order_id: po.id,
                tour_id: po.tour_id,
                quotation_request_id: po.daily_activity_vendor_id || po.quotation_request_id || null,
                vendor_type: vType,
                vendor_id: vendorId,
                vendor_name: po.vendor_name,
                agreed_price: po.total_amount,
                currency: po.currency,
                cancellation_policy: po.cancellation_policy || null,
                notes: po.vendor_notes || po.internal_notes || null,
                status: bookingStatus,
                daily_activity_ids: allActivityIds
            };
        });
    }

    /**
     * Updates booking (PO) status.
     */
    static async updateBookingStatus(dto: UpdateBookingStatusDTO): Promise<any> {
        const supabase = createAdminClient();
        const { booking_id, status, booking_reference } = dto;

        let poStatus = 'Draft';
        if (status === 'Confirmed') poStatus = 'Sent';
        else if (status === 'Went Ahead') poStatus = 'Accepted';
        else if (status === 'Cancelled') poStatus = 'Cancelled';

        const updateData: any = { status: poStatus, updated_at: new Date().toISOString() };
        if (booking_reference !== undefined) {
            updateData.sent_email = booking_reference;
        }

        const { data, error } = await supabase
            .from('purchase_orders')
            .update(updateData)
            .eq('id', booking_id)
            .select()
            .single();

        if (error) throw error;

        // Sync back to tour_rfq_emails status
        if (data.daily_activity_vendor_id) {
            let unifiedStatus = 'Pending';
            if (status === 'Confirmed') unifiedStatus = 'Sent';
            else if (status === 'Went Ahead') unifiedStatus = 'Confirmed';
            else if (status === 'Cancelled') unifiedStatus = 'Cancelled';

            await supabase
                .from('tour_rfq_emails')
                .update({ status: unifiedStatus, selected_vendor: status === 'Went Ahead' })
                .eq('id', data.daily_activity_vendor_id);
        }
        
        return {
            ...data,
            purchase_order_id: data.id,
            status: status
        };
    }

    /**
     * Cancels a booking (PO).
     */
    static async cancelBooking(bookingId: string, reason?: string): Promise<boolean> {
        const supabase = createAdminClient();

        const { data: po, error: fetchErr } = await supabase
            .from('purchase_orders')
            .select('daily_activity_vendor_id')
            .eq('id', bookingId)
            .single();

        const { error } = await supabase
            .from('purchase_orders')
            .update({ 
                status: 'Cancelled', 
                internal_notes: `Cancelled booking. Reason: ${reason || 'Backup vendor deselected.'}`,
                updated_at: new Date().toISOString() 
            })
            .eq('id', bookingId);

        if (error) throw error;

        if (po && po.daily_activity_vendor_id) {
            await supabase
                .from('tour_rfq_emails')
                .update({ status: 'Cancelled', selected_vendor: false })
                .eq('id', po.daily_activity_vendor_id);
        }

        return true;
    }

    /**
     * Finalizes one vendor booking:
     * - Marks the PO as 'Accepted' (Went Ahead)
     * - Cancels parallel backup POs for the same activities
     * - Updates all linked daily_activities records with this vendor's details
     */
    static async confirmFinalVendor(bookingId: string): Promise<boolean> {
        const supabase = createAdminClient();

        const { data: targetPO, error: poErr } = await supabase
            .from('purchase_orders')
            .select(`
                *,
                items:purchase_order_items(
                    daily_activity_id
                )
            `)
            .eq('id', bookingId)
            .single();

        if (poErr) throw poErr;

        const { id: targetPOId, vendor_type } = targetPO;
        const vendor_id = targetPO.hotel_id || targetPO.activity_vendor_id || targetPO.transport_provider_id || targetPO.guide_id || targetPO.driver_id || targetPO.restaurant_id;

        const activityIds = (targetPO.items || [])
            .map((item: any) => item.daily_activity_id)
            .filter((id: any) => !!id);

        // For transport POs, daily_activity_id is stored in the junction table
        if (activityIds.length === 0 && targetPO.vendor_type === 'transport') {
            const itemIds = (targetPO.items || []).map((item: any) => item.id).filter(Boolean);
            if (itemIds.length > 0) {
                const { data: junctionLegs, error: jErr } = await supabase
                    .from('purchase_order_daily_transport_items')
                    .select('daily_activity_id')
                    .in('purchase_order_item_id', itemIds);
                if (jErr) throw jErr;
                activityIds.push(
                    ...(junctionLegs || [])
                        .map((row: any) => row.daily_activity_id)
                        .filter(Boolean)
                );
            }
        }

        if (activityIds.length === 0) {
            throw new Error("No daily activities linked to this Purchase Order.");
        }

        const { data: otherItems, error: itemsErr } = await supabase
            .from('purchase_order_items')
            .select('purchase_order_id')
            .in('daily_activity_id', activityIds)
            .neq('purchase_order_id', targetPOId);

        if (itemsErr) throw itemsErr;

        const otherPOIds = Array.from(new Set(otherItems.map((item: any) => item.purchase_order_id)));

        if (otherPOIds.length > 0) {
            await supabase
                .from('purchase_orders')
                .update({ 
                    status: 'Cancelled', 
                    internal_notes: 'Automatically cancelled - backup vendor deselected.',
                    updated_at: new Date().toISOString()
                })
                .in('id', otherPOIds)
                .neq('status', 'Cancelled');

            // Fetch daily_activity_vendor_id for other POs and cancel them
            const { data: otherPOs } = await supabase
                .from('purchase_orders')
                .select('daily_activity_vendor_id')
                .in('id', otherPOIds);
            const otherVendorIds = otherPOs ? otherPOs.map(p => p.daily_activity_vendor_id).filter(Boolean) : [];
            if (otherVendorIds.length > 0) {
                await supabase
                    .from('tour_rfq_emails')
                    .update({ selected_vendor: false, status: 'Declined' })
                    .in('id', otherVendorIds);
            }
        }

        await supabase
            .from('purchase_orders')
            .update({ 
                status: 'Accepted', 
                updated_at: new Date().toISOString() 
            })
            .eq('id', targetPOId);

        if (targetPO.daily_activity_vendor_id) {
            await supabase
                .from('tour_rfq_emails')
                .update({ selected_vendor: true, status: 'Selected' })
                .eq('id', targetPO.daily_activity_vendor_id);
        }

        let vType = vendor_type;
        if (vType === 'transport') vType = 'transport_provider';
        else if (vType === 'guide') vType = 'tour_guide';

        const dailyActivityUpdates: any = {
            contracted_price: targetPO.total_amount,
            contracted_total_price: targetPO.total_amount
        };

        if (vType === 'hotel') dailyActivityUpdates.hotel_id = vendor_id;
        else if (vType === 'vendor') dailyActivityUpdates.vendor_id = vendor_id;
        else if (vType === 'transport_provider') dailyActivityUpdates.transport_id = vendor_id;
        else if (vType === 'tour_guide') dailyActivityUpdates.guide_id = vendor_id;
        else if (vType === 'driver') dailyActivityUpdates.driver_id = vendor_id;
        else if (vType === 'restaurant') dailyActivityUpdates.restaurant_id = vendor_id;

        const { error: daError } = await supabase
            .from('daily_activities')
            .update(dailyActivityUpdates)
            .in('id', activityIds);

        if (daError) throw daError;

        return true;
    }
}
