import { createAdminClient } from '@/utils/supabase/admin';
import { CustomerPaymentDTO, GenerateCustomerInvoiceDTO } from '../dtos/finance.dto';
import { DBCustomerInvoice, DBCustomerInvoiceItem } from '../types/finance';

export class CustomerInvoiceService {
    /**
     * Preview consolidated experience category invoice items for a tour
     */
    static async previewInvoiceItems(tourId: string, options: Partial<GenerateCustomerInvoiceDTO>) {
        const supabaseAdmin = createAdminClient();

        // 1. Fetch tour details
        const { data: tour, error: tourError } = await supabaseAdmin
            .from('tours')
            .select('*')
            .eq('id', tourId)
            .single();

        if (tourError || !tour) throw new Error("Tour not found: " + (tourError?.message || ""));

        // 2. Fetch itinerary days
        const { data: itineraries, error: itinError } = await supabaseAdmin
            .from('tour_itineraries')
            .select('id, day_number, date')
            .eq('tour_id', tourId);

        if (itinError) throw itinError;
        const itinIds = itineraries?.map(i => i.id) || [];

        // 3. Fetch daily activities (handle fallbacks for tour_id being null)
        let query = supabaseAdmin
            .from('daily_activities')
            .select(`
                *,
                tour_itineraries(id, day_number, date),
                hotels(name, location_address)
            `);

        if (itinIds.length > 0) {
            query = query.or(`tour_id.eq.${tourId},itinerary_id.in.(${itinIds.join(',')})`);
        } else {
            query = query.eq('tour_id', tourId);
        }

        const { data: activities, error: actError } = await query;
        if (actError) throw actError;

        // Resolve room category names for room IDs
        const roomIds: string[] = [];
        activities?.forEach(act => {
            if (act.single_room_id) roomIds.push(act.single_room_id);
            if (act.double_room_id) roomIds.push(act.double_room_id);
            if (act.twin_room_id) roomIds.push(act.twin_room_id);
            if (act.triple_room_id) roomIds.push(act.triple_room_id);
            if (act.family_room_id) roomIds.push(act.family_room_id);
        });

        const roomNamesMap = new Map<string, string>();
        if (roomIds.length > 0) {
            const uniqueRoomIds = Array.from(new Set(roomIds));
            const { data: rooms } = await supabaseAdmin
                .from('hotel_rooms')
                .select('id, room_name')
                .in('id', uniqueRoomIds);
            rooms?.forEach(r => roomNamesMap.set(r.id, r.room_name));
        }

        const invoiceItems: { description: string; amount: number }[] = [];

        // --- CATEGORY 1: ACCOMMODATION ---
        const sleepActs = activities?.filter(act => act.activity_type === 'sleep' || act.hotel_id !== null) || [];
        const hotelGroups = new Map<string, typeof sleepActs>();
        sleepActs.forEach(act => {
            const key = act.hotel_id || 'unknown';
            if (!hotelGroups.has(key)) {
                hotelGroups.set(key, []);
            }
            hotelGroups.get(key)!.push(act);
        });

        const mealActs = activities?.filter(act => act.activity_type === 'meal' && (act.charged_total_price || 0) > 0) || [];

        for (const [hotelId, acts] of hotelGroups.entries()) {
            const firstAct = acts[0];
            const hotelName = firstAct.hotels?.name || firstAct.title || "Luxury Accommodation";
            const nights = acts.length;

            const roomTypeCountMap = new Map<string, number>();
            acts.forEach(act => {
                const roomCounts = [
                    { id: act.single_room_id, count: act.single_room_count, name: 'Single Room' },
                    { id: act.double_room_id, count: act.double_room_count, name: 'Double Room' },
                    { id: act.twin_room_id, count: act.twin_room_count, name: 'Twin Room' },
                    { id: act.triple_room_id, count: act.triple_room_count, name: 'Triple Room' },
                    { id: act.family_room_id, count: act.family_room_count, name: 'Family Room' }
                ];
                roomCounts.forEach(rc => {
                    if (rc.count && rc.count > 0) {
                        const name = rc.id ? (roomNamesMap.get(rc.id) || rc.name) : rc.name;
                        roomTypeCountMap.set(name, (roomTypeCountMap.get(name) || 0) + rc.count);
                    }
                });
            });

            const roomDetailsList: string[] = [];
            roomTypeCountMap.forEach((count, name) => {
                const avgCount = Math.round(count / nights) || 1;
                roomDetailsList.push(`${avgCount}x ${name}`);
            });
            const roomsStr = roomDetailsList.length > 0 ? roomDetailsList.join(", ") : "Bespoke Room Setup";

            const mealPlans = Array.from(new Set(acts.map(act => act.meal_plan).filter(Boolean)));
            const mealPlanNames = mealPlans.map(mp => {
                const code = String(mp).toUpperCase();
                if (code === 'BB') return 'Bed & Breakfast';
                if (code === 'HB') return 'Half Board';
                if (code === 'FB') return 'Full Board';
                if (code === 'AI') return 'All Inclusive';
                return mp;
            });
            const mealPlanStr = mealPlanNames.length > 0 ? ` - ${mealPlanNames.join(", ")}` : '';

            let totalAmount = acts.reduce((sum, act) => sum + (Number(act.charged_total_price) || 0), 0);

            // Roll meals on same day into stay
            const actDates = acts.map(act => act.tour_itineraries?.date).filter(Boolean);
            const matchingMeals = mealActs.filter(meal => actDates.includes(meal.tour_itineraries?.date));
            matchingMeals.forEach(meal => {
                totalAmount += (Number(meal.charged_total_price) || 0);
                const idx = mealActs.indexOf(meal);
                if (idx !== -1) mealActs.splice(idx, 1);
            });

            invoiceItems.push({
                description: `${hotelName} — ${roomsStr} (${nights} Night${nights > 1 ? 's' : ''}${mealPlanStr})`,
                amount: totalAmount
            });
        }

        // --- CATEGORY 2: PRIVATE TRANSFERS ---
        const travelActs = activities?.filter(act => act.activity_type === 'travel' || act.activity_type === 'train') || [];
        const travelTotal = travelActs.reduce((sum, act) => sum + (Number(act.charged_total_price) || 0), 0);
        if (travelActs.length > 0) {
            invoiceItems.push({
                description: "Chauffeur-driven transfers throughout",
                amount: travelTotal
            });
        }

        // --- CATEGORY 3: EXPERIENCES ---
        const experienceActs = activities?.filter(act => 
            act.activity_type === 'activity' || 
            act.activity_type === 'custom' || 
            (act.activity_type === 'meal' && !sleepActs.some(s => s.tour_itineraries?.date === act.tour_itineraries?.date))
        ) || [];

        experienceActs.forEach(act => {
            const price = Number(act.charged_total_price) || 0;
            if (price > 0) {
                let durationText = '';
                if (act.time_start && act.time_end) {
                    try {
                        const [sH, sM] = act.time_start.split(':').map(Number);
                        const [eH, eM] = act.time_end.split(':').map(Number);
                        if (!isNaN(sH) && !isNaN(eH)) {
                            const diffMins = (eH * 60 + eM) - (sH * 60 + sM);
                            if (diffMins > 0) {
                                const hrs = Math.floor(diffMins / 60);
                                const mins = diffMins % 60;
                                durationText = ` (${hrs > 0 ? `${hrs} hr${hrs > 1 ? 's' : ''}` : ''}${mins > 0 ? ` ${mins} min` : ''})`;
                            }
                        }
                    } catch (e) {}
                }
                invoiceItems.push({
                    description: `${act.title}${durationText}`,
                    amount: price
                });
            }
        });

        // --- CATEGORY 4: FLIGHTS ---
        if (options.flightsQuotedSeparately) {
            const price = Number(options.flightsQuotedPrice) || 0;
            invoiceItems.push({
                description: price > 0 ? "International Airfare — Booked & Confirmed" : "International airfare excluded",
                amount: price
            });
        }

        // --- CATEGORY 5: CONCIERGE & CURATION (SERVICE FEE) ---
        const curationTypes = ['guide', 'driver', 'buffer', 'wait'];
        const curationActs = activities?.filter(act => curationTypes.includes(act.activity_type || '')) || [];
        const defaultCurationTotal = curationActs.reduce((sum, act) => sum + (Number(act.charged_total_price) || 0), 0);

        const serviceFeeAmount = options.customServiceFee !== undefined 
            ? Number(options.customServiceFee) 
            : defaultCurationTotal;

        invoiceItems.push({
            description: "Nilathra Collection service fee",
            amount: serviceFeeAmount
        });

        return invoiceItems;
    }

    /**
     * Generate sequential customer invoice with items and save to DB
     */
    static async generateCustomerInvoice(dto: GenerateCustomerInvoiceDTO) {
        const supabaseAdmin = createAdminClient();

        // 1. Fetch tour details
        const { data: tour, error: tourError } = await supabaseAdmin
            .from('tours')
            .select('*')
            .eq('id', dto.tour_id)
            .single();

        if (tourError || !tour) throw new Error("Tour not found: " + (tourError?.message || ""));

        // 2. Generate consolidated items
        const items = await this.previewInvoiceItems(dto.tour_id, dto);

        // 3. Compute final amounts
        const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
        const discount = Number(dto.discountAmount) || 0;
        const tax = Number(dto.taxAmount) || 0;
        const finalAmount = subtotal - discount + tax;

        // 4. Generate sequential invoice number (e.g. INV-2026-0001)
        const currentYear = new Date().getFullYear();
        const prefix = `INV-${currentYear}-`;
        
        const { count, error: countErr } = await supabaseAdmin
            .from('customer_invoices')
            .select('*', { count: 'exact', head: true })
            .ilike('invoice_number', `${prefix}%`);

        if (countErr) throw countErr;
        const seq = (count || 0) + 1;
        const invoiceNumber = `${prefix}${String(seq).padStart(4, '0')}`;

        // 5. Insert invoice
        const invoicePayload = {
            tour_id: dto.tour_id,
            tourist_id: tour.tourist_id,
            amount: finalAmount,
            currency: tour.planner_data?.profile?.currency || 'USD',
            status: 'Pending',
            due_date: dto.dueDate || null,
            invoice_number: invoiceNumber,
            billing_details: dto.billingDetails,
            agency_note: dto.agencyNote || null,
            discount_amount: discount,
            tax_amount: tax
        };

        const { data: invoice, error: invError } = await supabaseAdmin
            .from('customer_invoices')
            .insert(invoicePayload)
            .select()
            .single();

        if (invError) throw invError;

        // 6. Insert items
        if (items.length > 0) {
            const itemsToInsert = items.map(item => ({
                invoice_id: invoice.id,
                description: item.description,
                amount: item.amount
            }));

            const { error: itemsError } = await supabaseAdmin
                .from('customer_invoice_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;
        }

        return {
            ...invoice,
            items
        };
    }

    /**
     * Retrieve all customer invoices generated for a specific tour
     */
    static async getCustomerInvoices(tourId: string) {
        const supabaseAdmin = createAdminClient();
        const { data: invoices, error } = await supabaseAdmin
            .from('customer_invoices')
            .select(`
                *,
                items:customer_invoice_items(*),
                payments:customer_payments(*)
            `)
            .eq('tour_id', tourId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return invoices as DBCustomerInvoice[];
    }

    /**
     * Register a payment against a customer invoice
     */
    static async registerCustomerPayment(dto: CustomerPaymentDTO) {
        const supabaseAdmin = createAdminClient();
        const { data: payment, error: payError } = await supabaseAdmin
            .from('customer_payments')
            .insert(dto)
            .select()
            .single();

        if (payError) throw payError;

        // Fetch invoice and all related payments to tally totals
        const { data: invoice } = await supabaseAdmin.from('customer_invoices').select('amount').eq('id', dto.invoice_id).single();
        const { data: payments } = await supabaseAdmin.from('customer_payments').select('amount').eq('invoice_id', dto.invoice_id);
        const totalPaid = (payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        if (invoice && totalPaid >= invoice.amount) {
            await supabaseAdmin.from('customer_invoices').update({ status: 'Paid' }).eq('id', dto.invoice_id);
        }

        return payment;
    }

    /**
     * Delete a customer invoice (deletes children items via DB Cascade)
     */
    static async deleteCustomerInvoice(invoiceId: string) {
        const supabaseAdmin = createAdminClient();
        const { error } = await supabaseAdmin
            .from('customer_invoices')
            .delete()
            .eq('id', invoiceId);

        if (error) throw error;
        return true;
    }
}
