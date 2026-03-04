import { createAdminClient } from "@/utils/supabase/admin";
import { DBPurchaseOrder, DBPurchaseOrderItem, DBVendorInvoice, DBVendorPayment } from "@/app/admin/(authenticated)/planner/types";

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
                invoices:vendor_invoices(
                    *,
                    payments:vendor_payments(*)
                )
            `)
            .eq('tour_id', tourId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as DBPurchaseOrder[];
    }

    /**
     * Creates or updates a purchase order with its items.
     * Uses a transaction-like approach (delete items and re-insert for updates).
     */
    static async savePurchaseOrder(po: Partial<DBPurchaseOrder>, items: Partial<DBPurchaseOrderItem>[]) {
        const supabase = createAdminClient();

        const { id, items: _, invoices: __, vendor_name: ___, ...poData } = po as any;

        // Ensure we only send valid db columns if more virtual fields are added
        delete poData.vendor_name;
        delete poData.vendorAddress;
        delete poData.vendorPhone;
        delete poData.vendorEmail;

        // Strip generated columns that PostgreSQL refuses to accept in INSERT/UPDATE
        delete poData.balance_payable;

        let savedPOId = id;

        if (id) {
            // Update PO header
            const { error: poError } = await supabase
                .from('purchase_orders')
                .update(poData)
                .eq('id', id);
            if (poError) throw poError;

            // Delete existing items for a clean rewrite
            const { error: delError } = await supabase
                .from('purchase_order_items')
                .delete()
                .eq('purchase_order_id', id);
            if (delError) throw delError;
        } else {
            // Insert PO header
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
                const { total_price: _, ...itemData } = item as any;
                return {
                    ...itemData,
                    purchase_order_id: savedPOId
                };
            });
            const { error: itemsError } = await supabase
                .from('purchase_order_items')
                .insert(itemsToInsert);
            if (itemsError) throw itemsError;
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
     * Saves a vendor invoice.
     */
    static async saveVendorInvoice(invoice: Partial<DBVendorInvoice>) {
        const supabase = createAdminClient();
        const { id, payments: _, ...invData } = invoice as any;

        if (id) {
            const { error } = await supabase.from('vendor_invoices').update(invData).eq('id', id);
            if (error) throw error;
            return id;
        } else {
            const { data, error } = await supabase.from('vendor_invoices').insert([invData]).select().single();
            if (error) throw error;
            return data.id;
        }
    }

    /**
     * Saves a vendor payment.
     */
    static async saveVendorPayment(payment: Partial<DBVendorPayment>) {
        const supabase = createAdminClient();
        const { id, ...payData } = payment as any;

        if (id) {
            const { error } = await supabase.from('vendor_payments').update(payData).eq('id', id);
            if (error) throw error;
            return id;
        } else {
            const { data, error } = await supabase.from('vendor_payments').insert([payData]).select().single();
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
}
