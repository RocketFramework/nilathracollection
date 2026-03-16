"use server";

import { AuthService } from "@/services/auth.service";
import { RequestService } from "@/services/request.service";
import { CreateRequestDTO } from "@/dtos/request.dto";
import { createAdminClient } from "@/utils/supabase/admin";

export async function registerTouristAction(email: string) {
    try {
        const supabaseAdmin = createAdminClient();

        // 1. Check if user exists in public.users to avoid throwing an error
        const { data: existingUser } = await supabaseAdmin.from('users').select('id').eq('email', email).single();
        if (existingUser) {
            return { success: true, user: { id: existingUser.id } };
        }

        // 2. Try to create user directly via admin API
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true, // Bypass email confirmation
            user_metadata: { role: 'tourist' }
        });

        if (authError) {
            if (authError.message.includes('already registered')) {
                // Fallback to exact match via listUsers if public.users query failed
                const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
                const fallbackUser = users.find(u => u.email === email);
                if (fallbackUser) return { success: true, user: { id: fallbackUser.id } };
            }
            return { success: false, error: authError.message };
        }

        return { success: true, user: { id: authUser.user.id } };
    } catch (error: any) {
        console.error("registerTouristAction error", error);
        return { success: false, error: error.message };
    }
}

export async function submitInquiryAction(formData: {
    name: string;
    email: string;
    phone?: string;
    inquiryType: string;
    message: string;
    departureCountry?: string;
    budget?: number;
    startDate?: string;
    durationNights?: number;
    adults?: number;
    children?: number;
    infants?: number;
}) {
    try {
        const {
            name, email, phone, inquiryType, message,
            departureCountry, budget, startDate, durationNights,
            adults, children, infants
        } = formData;

        if (!email || !message || !name) {
            return { error: "Name, email, and message are required." };
        }

        // Lazy register user or get existing
        let userId = null;
        try {
            const authResult = await registerTouristAction(email);
            if (authResult.success && authResult.user) {
                userId = authResult.user.id;
            }
        } catch (authError) {
            console.warn("Auth Registration skipped in inquiry flow:", authError);
        }

        const requestDto: CreateRequestDTO = {
            email,
            name,
            phone_number: phone,
            request_type: 'inquiry',
            note: `Inquiry Type: ${inquiryType}\n\nMessage: ${message}`,
            departure_country: departureCountry,
            budget,
            start_date: startDate,
            duration_nights: durationNights,
            adults,
            children,
            infants,
        };

        await RequestService.createRequest(requestDto, userId);

        return { success: true, message: "Your inquiry has been delivered successfully. Our concierge will contact you shortly." };
    } catch (error: any) {
        console.error("Error in submitInquiryAction:", error);
        return { error: error.message || "An unexpected error occurred. Please try again later." };
    }
}
