import { createAdminClient } from '@/utils/supabase/admin';
import { CreateVendorBookingDTO, UpdateBookingStatusDTO } from '../dtos/vendor-booking.dto';
import { VendorBooking } from '../types/vendor-booking.type';
import { FinanceService } from './finance.service';

export class VendorBookingService {
    /**
     * Creates a service booking request, links it to multiple daily activities,
     * and automatically generates a parallel Draft Purchase Order.
     */
    static async createBookingRequest(dto: CreateVendorBookingDTO): Promise<VendorBooking> {
        const supabase = createAdminClient();
        const { daily_activity_ids, ...bookingData } = dto;

        // 1. Insert the parallel booking record
        const { data: booking, error: bError } = await supabase
            .from('vendor_bookings')
            .insert([{
                tour_id: bookingData.tour_id,
                quotation_request_id: bookingData.quotation_request_id || null,
                vendor_type: bookingData.vendor_type,
                vendor_id: bookingData.vendor_id,
                vendor_name: bookingData.vendor_name,
                agreed_price: bookingData.agreed_price,
                currency: bookingData.currency || 'USD',
                cancellation_deadline: bookingData.cancellation_deadline || null,
                cancellation_policy: bookingData.cancellation_policy || null,
                notes: bookingData.notes || null,
                status: 'Pending'
            }])
            .select()
            .single();

        if (bError) throw bError;

        // 2. Link to daily activities
        if (daily_activity_ids && daily_activity_ids.length > 0) {
            const mappings = daily_activity_ids.map(actId => ({
                vendor_booking_id: booking.id,
                daily_activity_id: actId
            }));

            const { error: mError } = await supabase
                .from('vendor_booked_activities')
                .insert(mappings);

            if (mError) {
                // Rollback booking if mappings fail
                await supabase.from('vendor_bookings').delete().eq('id', booking.id);
                throw mError;
            }
        }

        // 3. Fetch vendor contact info from master tables to populate PO header
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

        // 4. Retrieve linked daily activities to create PO items
        const poItems: any[] = [];
        let calculatedSubtotal = 0;

        if (daily_activity_ids && daily_activity_ids.length > 0) {
            const { data: activities } = await supabase
                .from('daily_activities')
                .select('*')
                .in('id', daily_activity_ids);

            if (activities && activities.length > 0) {
                // Distribute the price evenly across linked activities for unit prices
                const pricePerActivity = Number((bookingData.agreed_price / activities.length).toFixed(2));

                activities.forEach((act, idx) => {
                    const itemQty = act.quantity || 1;
                    const itemPrice = pricePerActivity;
                    const itemTotal = itemQty * itemPrice;
                    calculatedSubtotal += itemTotal;

                    // Derive service date from itinerary if possible
                    let serviceDate = act.created_at ? new Date(act.created_at).toISOString().split('T')[0] : null;

                    poItems.push({
                        id: crypto.randomUUID(),
                        daily_activity_id: act.id,
                        description: `${bookingData.vendor_name} - ${act.title || 'Service Booking'}`,
                        service_date: serviceDate,
                        quantity: itemQty,
                        unit_price: itemPrice,
                        total_price: itemTotal,
                        room_type: act.room_type || undefined,
                        meal_plan: act.meal_plan || undefined,
                        special_notes: `Linked to parallel booking: ${booking.id}`
                    });
                });
            }
        }

        // 5. Generate and save the Draft PO
        const poNumber = `PO-${bookingData.vendor_type.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
        const poPayload: any = {
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
            subtotal: calculatedSubtotal || bookingData.agreed_price,
            total_amount: bookingData.agreed_price,
            discount: 0,
            tax: 0,
            service_charge: 0,
            advance_paid: 0,
            balance_payable: bookingData.agreed_price,
            vendor_booking_id: booking.id,
            cancellation_policy: bookingData.cancellation_policy || undefined
        };

        // Specific vendor foreign key links
        if (bookingData.vendor_type === 'hotel') poPayload.hotel_id = bookingData.vendor_id;
        else if (bookingData.vendor_type === 'vendor') poPayload.activity_vendor_id = bookingData.vendor_id;
        else if (bookingData.vendor_type === 'transport_provider') poPayload.transport_provider_id = bookingData.vendor_id;
        else if (bookingData.vendor_type === 'tour_guide') poPayload.guide_id = bookingData.vendor_id;
        else if (bookingData.vendor_type === 'driver') poPayload.driver_id = bookingData.vendor_id;
        else if (bookingData.vendor_type === 'restaurant') poPayload.restaurant_id = bookingData.vendor_id;

        try {
            const savedPOId = await FinanceService.savePurchaseOrder(poPayload, poItems);
            
            // 6. Update the booking with the generated PO ID
            const { error: updErr } = await supabase
                .from('vendor_bookings')
                .update({ purchase_order_id: savedPOId })
                .eq('id', booking.id);
            if (updErr) throw updErr;

            booking.purchase_order_id = savedPOId;
        } catch (poErr) {
            console.error("Failed to generate parallel PO for booking:", poErr);
        }

        // 7. Update the quotation request status if this was initiated from a quote
        if (bookingData.quotation_request_id) {
            await supabase
                .from('quotation_request')
                .update({ status: 'Selected', selected_vendor: true })
                .eq('id', bookingData.quotation_request_id);
        }
        
        return booking;
    }

    /**
     * Fetches all bookings and their mapped activities for a given tour.
     */
    static async getBookingsForTour(tourId: string) {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('vendor_bookings')
            .select(`
                *,
                activities:vendor_booked_activities(
                    daily_activity_id
                )
            `)
            .eq('tour_id', tourId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        return (data || []).map((booking: any) => ({
            ...booking,
            daily_activity_ids: (booking.activities || []).map((a: any) => a.daily_activity_id)
        }));
    }

    /**
     * Updates booking status (e.g. Confirmed, Cancelled).
     */
    static async updateBookingStatus(dto: UpdateBookingStatusDTO): Promise<VendorBooking> {
        const supabase = createAdminClient();
        const { booking_id, status, booking_reference } = dto;

        const updateData: any = { status, updated_at: new Date().toISOString() };
        if (booking_reference !== undefined) {
            updateData.booking_reference = booking_reference;
        }

        const { data, error } = await supabase
            .from('vendor_bookings')
            .update(updateData)
            .eq('id', booking_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Cancels a booking and its associated Purchase Order.
     */
    static async cancelBooking(bookingId: string, reason?: string): Promise<boolean> {
        const supabase = createAdminClient();

        // Fetch the booking first to check if there is a PO
        const { data: booking, error: fError } = await supabase
            .from('vendor_bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

        if (fError) throw fError;

        // Update status of the booking to Cancelled
        const { error: uError } = await supabase
            .from('vendor_bookings')
            .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
            .eq('id', bookingId);

        if (uError) throw uError;

        // Cancel the PO if exists
        if (booking.purchase_order_id) {
            const { error: poError } = await supabase
                .from('purchase_orders')
                .update({ 
                    status: 'Cancelled', 
                    internal_notes: `Cancelled booking. Reason: ${reason || 'Backup vendor deselected.'}` 
                })
                .eq('id', booking.purchase_order_id);
                
            if (poError) throw poError;
        }

        return true;
    }

    /**
     * Finalizes one vendor booking for the associated daily activities:
     * - Marks this booking as 'Went Ahead'
     * - Updates all linked daily_activities records with this vendor's details
     * - Automatically cancels parallel backup bookings for the same activities & their corresponding POs
     */
    static async confirmFinalVendor(bookingId: string): Promise<boolean> {
        const supabase = createAdminClient();

        // 1. Retrieve the target booking details
        const { data: targetBooking, error: tbError } = await supabase
            .from('vendor_bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

        if (tbError) throw tbError;

        const { id: targetBookingId, vendor_id, vendor_type, agreed_price } = targetBooking;

        // 2. Retrieve all activity IDs linked to this booking
        const { data: linkedActs, error: laError } = await supabase
            .from('vendor_booked_activities')
            .select('daily_activity_id')
            .eq('vendor_booking_id', targetBookingId);

        if (laError) throw laError;

        const activityIds = linkedActs.map((la: any) => la.daily_activity_id);
        if (activityIds.length === 0) {
            throw new Error("No daily activities linked to this booking.");
        }

        // 3. Find other bookings linked to the same activities
        const { data: otherMappings, error: omError } = await supabase
            .from('vendor_booked_activities')
            .select('vendor_booking_id')
            .in('daily_activity_id', activityIds)
            .neq('vendor_booking_id', targetBookingId);

        if (omError) throw omError;

        const otherBookingIds = Array.from(new Set(otherMappings.map((m: any) => m.vendor_booking_id)));

        // 4. Cancel backup bookings & POs
        if (otherBookingIds.length > 0) {
            const { data: backups, error: buError } = await supabase
                .from('vendor_bookings')
                .select('*')
                .in('id', otherBookingIds)
                .neq('status', 'Cancelled');

            if (buError) throw buError;

            for (const backup of backups) {
                // Set status to Cancelled
                await supabase
                    .from('vendor_bookings')
                    .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
                    .eq('id', backup.id);

                // Cancel the associated PO
                if (backup.purchase_order_id) {
                    await supabase
                        .from('purchase_orders')
                        .update({ 
                            status: 'Cancelled', 
                            internal_notes: 'Automatically cancelled - backup vendor deselected.' 
                        })
                        .eq('id', backup.purchase_order_id);
                }
            }
        }

        // 5. Update the selected booking to 'Went Ahead'
        await supabase
            .from('vendor_bookings')
            .update({ status: 'Went Ahead', updated_at: new Date().toISOString() })
            .eq('id', targetBookingId);

        // 6. Update daily_activities records with the selected vendor details for itinerary display
        const dailyActivityUpdates: any = {
            contracted_price: agreed_price,
            contracted_total_price: agreed_price
        };

        if (vendor_type === 'hotel') dailyActivityUpdates.hotel_id = vendor_id;
        else if (vendor_type === 'vendor') dailyActivityUpdates.vendor_id = vendor_id;
        else if (vendor_type === 'transport_provider') dailyActivityUpdates.transport_id = vendor_id;
        else if (vendor_type === 'tour_guide') dailyActivityUpdates.guide_id = vendor_id;
        else if (vendor_type === 'driver') dailyActivityUpdates.driver_id = vendor_id;
        else if (vendor_type === 'restaurant') dailyActivityUpdates.restaurant_id = vendor_id;

        const { error: daError } = await supabase
            .from('daily_activities')
            .update(dailyActivityUpdates)
            .in('id', activityIds);

        if (daError) throw daError;

        return true;
    }
}
