import { createAdminClient } from "@/utils/supabase/admin";
import { DBPurchaseOrder, DBPurchaseOrderItem, DBSupplierInvoice, DBSupplierPayment } from "@/app/admin/(authenticated)/planner/types";

export class FinanceService {
    /**
     * Fetches all purchase orders for a specific tour, including items and invoices.
     */
    static async getPurchaseOrdersForTour(tourId: string): Promise<DBPurchaseOrder[]> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('purchase_orders')
            .select(`
                *,
                items:purchase_order_items(*),
                invoices:supplier_invoices(
                    *,
                    items:supplier_invoice_items(*),
                    payments:supplier_payments(*)
                ),
                advance_payments:supplier_payments(*)
            `)
            .eq('tour_id', tourId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Restore daily_activity_id from special_notes hack to bypass obsolete FK constraint
        const processedData = data?.map(po => ({
            ...po,
            items: po.items?.map((item: any) => {
                if (item.special_notes?.includes('BLOCK_REF:')) {
                    const parts = item.special_notes.split('|| BLOCK_REF:');
                    if (parts.length > 1) {
                        item.special_notes = parts[0].trim();
                        item.daily_activity_id = parts[1];
                    } else {
                        item.daily_activity_id = item.special_notes.replace('BLOCK_REF:', '');
                        item.special_notes = undefined;
                    }
                }
                return item;
            }),
            advance_payments: (po.advance_payments as any[])?.filter(p => !p.supplier_invoice_id) || []
        }));

        return processedData as DBPurchaseOrder[];
    }

    /**
     * Creates or updates a purchase order with its items.
     * Uses a transaction-like approach (delete items and re-insert for updates).
     */
    static async savePurchaseOrder(po: Partial<DBPurchaseOrder>, items: Partial<DBPurchaseOrderItem>[]) {
        const supabase = createAdminClient();

        const { id, items: _, invoices: __, ...poData } = po as any;

        // Strip generated columns that PostgreSQL refuses to accept in INSERT/UPDATE
        delete poData.balance_payable;

        let savedPOId: string;

        if (id) {
            // Use upsert to handle both updates and inserts with client-side IDs
            const { error: poError } = await supabase
                .from('purchase_orders')
                .upsert({ id, ...poData }, { onConflict: 'id' });

            if (poError) throw poError;
            savedPOId = id;

            // Delete existing items for a clean rewrite (only if it was an update)
            // Note: If it was a new insert, this delete does nothing.
            const { error: delError } = await supabase
                .from('purchase_order_items')
                .delete()
                .eq('purchase_order_id', id);
            if (delError) throw delError;
        } else {
            // Insert PO header letting DB generate ID
            const { data: newPO, error: poError } = await supabase
                .from('purchase_orders')
                .insert([poData])
                .select()
                .single();
            if (poError) throw poError;
            savedPOId = newPO.id;
        }
        // Insert items
        if (items && items.length > 0) {
            const itemsToInsert = items.map(item => {
                const { total_price: _, daily_activity_id, ...itemData } = item as any;
                
                // Encode the daily_activity block UUID into special_notes to bypass the obsolete tour_itineraries FK constraint
                if (daily_activity_id) {
                    itemData.daily_activity_id = daily_activity_id;
                    itemData.special_notes = itemData.special_notes 
                        ? `${itemData.special_notes} || BLOCK_REF:${daily_activity_id}` 
                        : `BLOCK_REF:${daily_activity_id}`;
                }

                return {
                    ...itemData,
                    purchase_order_id: savedPOId
                };
            });
            const { error: itemsError } = await supabase
                .from('purchase_order_items')
                .insert(itemsToInsert);

            if (itemsError) {
                console.error("Failed to insert PO items. Data summary:", {
                    poId: savedPOId,
                    itemCount: itemsToInsert.length,
                    firstItemActivityId: itemsToInsert[0]?.daily_activity_id
                });
                console.error("Supabase Error Details:", itemsError);
                throw itemsError;
            }
        }

        return savedPOId;
    }

    /**
     * Deletes a purchase order. Cascading deletes will handle items and invoices if configured in SQL.
     */
    static async deletePurchaseOrder(id: string) {
        const supabase = createAdminClient();
        const { error } = await supabase
            .from('purchase_orders')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }

    /**
     * Deletes all Draft and Pending Confirmation purchase orders for a tour.
     */
    static async deleteDraftPurchaseOrdersForTour(tourId: string) {
        const supabase = createAdminClient();
        const { error } = await supabase
            .from('purchase_orders')
            .delete()
            .eq('tour_id', tourId)
            .in('status', ['Draft', 'Pending Confirmation']);

        if (error) throw error;
        return true;
    }

    /**
     * Saves a supplier invoice.
     */
    static async saveSupplierInvoice(invoice: Partial<DBSupplierInvoice>) {
        const supabase = createAdminClient();
        const { id, payments: _, items, ...invData } = invoice as any;

        let invoiceId = id;
        if (id) {
            const { error } = await supabase.from('supplier_invoices').update(invData).eq('id', id);
            if (error) throw error;
            
            const { error: delError } = await supabase
                .from('supplier_invoice_items')
                .delete()
                .eq('supplier_invoice_id', id);
            if (delError) throw delError;
        } else {
            const { data, error } = await supabase.from('supplier_invoices').insert([invData]).select().single();
            if (error) throw error;
            invoiceId = data.id;
        }

        if (items && items.length > 0) {
            const itemsToInsert = items.map((item: any) => {
                const { id: _itemId, total_price: _, ...itemData } = item;
                return {
                    ...itemData,
                    supplier_invoice_id: invoiceId
                };
            });
            const { error: itemsError } = await supabase
                .from('supplier_invoice_items')
                .insert(itemsToInsert);
            if (itemsError) throw itemsError;
        }

        return invoiceId;
    }

    /**
     * Saves a supplier payment.
     */
    static async saveSupplierPayment(payment: Partial<DBSupplierPayment>) {
        const supabase = createAdminClient();
        const { id, ...payData } = payment as any;

        if (id) {
            const { error } = await supabase.from('supplier_payments').update(payData).eq('id', id);
            if (error) throw error;
            return id;
        } else {
            const { data, error } = await supabase.from('supplier_payments').insert([payData]).select().single();
            if (error) throw error;
            return data.id;
        }
    }

    /**
     * Aggregates itinerary data and creates Draft POs in the database.
     */
    static async syncItineraryToRelationalPOs(tourId: string, itinerary: any[]) {
        // This function will be called from a server action.
        // It should identify unique vendors and create draft POs if they don't exist.
        // For simplicity in this first pass, we will let the UI handle the "mapping" 
        // and send the PO objects to savePurchaseOrder.
    }

    /**
     * Updates the purchase order status and sent tracking fields.
     */
    static async updatePOEmailSentStatus(poId: string, email: string, name: string | null, date: string): Promise<boolean> {
        const supabase = createAdminClient();
        const { error } = await supabase
            .from('purchase_orders')
            .update({
                status: 'Sent',
                sent_email: email,
                sent_to_name: name,
                sent_date: date
            })
            .eq('id', poId);

        if (error) throw error;
        return true;
    }

    /**
     * Updates specific details (status, notes, discounts, tax, and acceptance details) of an existing PO.
     */
    static async updatePurchaseOrderDetails(poId: string, updates: any): Promise<boolean> {
        const supabase = createAdminClient();
        
        // Strip out generated or immutable fields
        delete updates.balance_payable;
        delete updates.id;
        delete updates.created_at;
        delete updates.updated_at;
        
        const { error } = await supabase
            .from('purchase_orders')
            .update(updates)
            .eq('id', poId);
            
        if (error) throw error;
        return true;
    }
}
