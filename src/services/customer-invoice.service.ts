import { createAdminClient } from '@/utils/supabase/admin';
import { CustomerPaymentDTO, GenerateCustomerInvoiceDTO } from '../dtos/finance.dto';
import { DBCustomerInvoice, DBCustomerInvoiceItem } from '../types/finance';

export class CustomerInvoiceService {
    /**
     * Preview consolidated experience category invoice items for a tour
     */
    static async previewInvoiceItems(tourId: string, options: Partial<GenerateCustomerInvoiceDTO>): Promise<{ description: string; amount: number; dailyActivityIds: string[] }[]> {
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

        const invoiceItems: { description: string; amount: number; dailyActivityIds: string[] }[] = [];

        // --- CATEGORY 1: ACCOMMODATION & MEALS ---
        const sleepMealActs = activities?.filter(act => act.activity_type === 'sleep' || act.activity_type === 'meal' || act.hotel_id !== null) || [];
        const sleepActs = sleepMealActs.filter(act => act.activity_type === 'sleep' || act.hotel_id !== null);
        const nights = sleepActs.length;
        const sleepMealTotal = sleepMealActs.reduce((sum, act) => sum + (Number(act.charged_total_price) || 0), 0);

        if (sleepMealActs.length > 0) {
            const description = nights > 0 
                ? `Luxury Accommodation & Bespoke Dining throughout (${nights} Night${nights > 1 ? 's' : ''})`
                : "Luxury Accommodation & Bespoke Dining throughout";
            invoiceItems.push({
                description,
                amount: sleepMealTotal,
                dailyActivityIds: sleepMealActs.map(act => act.id).filter(Boolean)
            });
        }

        // --- CATEGORY 2: PRIVATE TRANSFERS ---
        const travelActs = activities?.filter(act => act.activity_type === 'travel' || act.activity_type === 'train') || [];
        const travelTotal = travelActs.reduce((sum, act) => sum + (Number(act.charged_total_price) || 0), 0);
        if (travelActs.length > 0) {
            invoiceItems.push({
                description: "Chauffeur-driven transfers throughout",
                amount: travelTotal,
                dailyActivityIds: travelActs.map(act => act.id).filter(Boolean)
            });
        }

        // --- CATEGORY 3: EXPERIENCES ---
        const experienceActs = activities?.filter(act => act.activity_type === 'activity' || act.activity_type === 'custom') || [];
        const experienceTotal = experienceActs.reduce((sum, act) => sum + (Number(act.charged_total_price) || 0), 0);
        if (experienceActs.length > 0) {
            invoiceItems.push({
                description: "Curated Activities & Experiences throughout",
                amount: experienceTotal,
                dailyActivityIds: experienceActs.map(act => act.id).filter(Boolean)
            });
        }

        // --- CATEGORY 4: FLIGHTS ---
        if (options.flightsQuotedSeparately) {
            const price = Number(options.flightsQuotedPrice) || 0;
            invoiceItems.push({
                description: price > 0 ? "International Airfare — Booked & Confirmed" : "International airfare excluded",
                amount: price,
                dailyActivityIds: []
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
            amount: serviceFeeAmount,
            dailyActivityIds: curationActs.map(act => act.id).filter(Boolean)
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

        // 6. Insert items and create links to daily activities
        if (items.length > 0) {
            const itemsToInsert = items.map(item => ({
                invoice_id: invoice.id,
                description: item.description,
                amount: item.amount
            }));

            const { data: insertedItems, error: itemsError } = await supabaseAdmin
                .from('customer_invoice_items')
                .insert(itemsToInsert)
                .select();

            if (itemsError) throw itemsError;

            // Link items with daily activities in the database
            const linksToInsert: { invoice_item_id: string; daily_activity_id: string }[] = [];
            insertedItems?.forEach((insertedItem, index) => {
                const sourceItem = items[index];
                if (sourceItem.dailyActivityIds && sourceItem.dailyActivityIds.length > 0) {
                    sourceItem.dailyActivityIds.forEach((daId: string) => {
                        linksToInsert.push({
                            invoice_item_id: insertedItem.id,
                            daily_activity_id: daId
                        });
                    });
                }
            });

            if (linksToInsert.length > 0) {
                const { error: linksError } = await supabaseAdmin
                    .from('daily_activity_customer_invoice_items')
                    .insert(linksToInsert);
                if (linksError) throw linksError;
            }
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

        // Fetch linked daily activities for each invoice item
        if (invoices && invoices.length > 0) {
            const itemIds = (invoices as any[]).flatMap(inv => ((inv.items as any[]) || []).map((item: any) => item.id));
            if (itemIds.length > 0) {
                const { data: links, error: linksError } = await supabaseAdmin
                    .from('daily_activity_customer_invoice_items')
                    .select('invoice_item_id, daily_activity_id')
                    .in('invoice_item_id', itemIds);

                if (!linksError && links) {
                    const linksMap = new Map<string, string[]>();
                    links.forEach((l: any) => {
                        if (!linksMap.has(l.invoice_item_id)) {
                            linksMap.set(l.invoice_item_id, []);
                        }
                        linksMap.get(l.invoice_item_id)!.push(l.daily_activity_id);
                    });

                    invoices.forEach(inv => {
                        (((inv as any).items as any[]) || []).forEach((item: any) => {
                            item.daily_activity_ids = linksMap.get(item.id) || [];
                        });
                    });
                }
            }
        }

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
