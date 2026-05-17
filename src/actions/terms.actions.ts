"use server";

import { createAdminClient } from "@/utils/supabase/admin";

export async function getBookingTermsAction() {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("booking_terms")
            .select("*")
            .order("tier");

        if (error) throw error;
        
        return { success: true, terms: data };
    } catch (err: any) {
        console.error("Error fetching booking terms:", err);
        return { success: false, error: err.message };
    }
}

export async function saveBookingTermsAction(tier: string, data: any) {
    try {
        const supabase = createAdminClient();
        
        const updateData = {
            booking_payment: data.booking_payment,
            cancellation_policy: data.cancellation_policy,
            important_notes: data.important_notes,
            health_safety: data.health_safety,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from("booking_terms")
            .update(updateData)
            .eq("tier", tier);

        if (error) throw error;

        return { success: true };
    } catch (err: any) {
        console.error("Error saving booking terms:", err);
        return { success: false, error: err.message };
    }
}
