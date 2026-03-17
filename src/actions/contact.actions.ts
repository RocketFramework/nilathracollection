"use server";

import { AuthService } from "@/services/auth.service";
import { RequestService } from "@/services/request.service";
import { CreateRequestDTO } from "@/dtos/request.dto";
import { createAdminClient } from "@/utils/supabase/admin";

export async function registerTouristAction(email: string, name?: string, phone?: string) {
    try {
        const supabaseAdmin = createAdminClient();

        let userId: string;

        // 1. Check if user exists in public.users to avoid throwing an error
        const { data: existingUser } = await supabaseAdmin.from('users').select('id').eq('email', email).single();
        if (existingUser) {
            userId = existingUser.id;
        } else {
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
                    if (fallbackUser) {
                        userId = fallbackUser.id;
                    } else {
                        return { success: false, error: authError.message };
                    }
                } else {
                    return { success: false, error: authError.message };
                }
            } else {
                userId = authUser.user.id;
            }
        }

        // 3. Ensure public.users record exists
        await supabaseAdmin.from('users').upsert([
            { id: userId, email, role: 'tourist', full_name: name || 'Guest User' }
        ], { onConflict: 'id' });

        // 4. Fetch the 'tourist' role ID
        const { data: roleData } = await supabaseAdmin.from("roles").select("id").eq("name", "tourist").single();
        if (roleData) {
            // 5. Assign User Role
            await supabaseAdmin.from("user_roles").upsert([
                { user_id: userId, role_id: roleData.id }
            ], { onConflict: 'user_id, role_id' });
        }

        // 6. Create Tourist Profile
        const firstName = name ? name.split(' ')[0] : 'Guest';
        const lastName = name && name.includes(' ') ? name.split(' ').slice(1).join(' ') : 'User';

        await supabaseAdmin.from('tourist_profiles').upsert([
            {
                id: userId,
                first_name: firstName,
                last_name: lastName,
                phone: phone || null,
            }
        ], { onConflict: 'id' });

        return { success: true, user: { id: userId } };
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
        let userId: string | undefined = undefined;
        try {
            const authResult = await registerTouristAction(email, name, phone);
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
