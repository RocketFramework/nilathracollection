"use server";

import { AuthService } from "@/services/auth.service";
import { RequestService } from "@/services/request.service";
import { CreateRequestDTO } from "@/dtos/request.dto";
import { createAdminClient } from "@/utils/supabase/admin";
import { LoggerService } from "@/services/logger.service";

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

        // 3. Ensure public.users record exists (only insert columns that actually exist in the schema)
        const { error: usersError } = await supabaseAdmin.from('users').upsert([
            { id: userId, email }
        ], { onConflict: 'id' });
        
        if (usersError) {
            console.error("public.users Upsert Error:", usersError);
            await LoggerService.logError("user_registration_users_upsert", usersError, { userId, email });
            // If the public.users record fails to create, the foreign key for requests will fail.
            // We should throw here to prevent the silent failure.
            throw new Error(`Failed to create user profile: ${usersError.message}`);
        }

        // 4. Fetch the 'tourist' role ID
        const { data: roleData } = await supabaseAdmin.from("roles").select("id").eq("name", "tourist").single();
        if (roleData) {
            // 5. Assign User Role
            const { error: roleError } = await supabaseAdmin.from("user_roles").upsert([
                { user_id: userId, role_id: roleData.id }
            ], { onConflict: 'user_id, role_id' });
            if (roleError) console.error("Role assignment error:", roleError);
        }

        // 6. Create Tourist Profile
        const firstName = name ? name.split(' ')[0] : 'Guest';
        const lastName = name && name.includes(' ') ? name.split(' ').slice(1).join(' ') : 'User';

        const { error: tpError } = await supabaseAdmin.from('tourist_profiles').upsert([
            {
                id: userId,
                first_name: firstName,
                last_name: lastName,
                phone: phone || null,
            }
        ], { onConflict: 'id' });

        if (tpError) {
            console.error("tourist_profiles Upsert Error:", tpError);
            await LoggerService.logError("user_registration_tourist_profile_upsert", tpError, { userId });
        }

        return { success: true, user: { id: userId } };
    } catch (error: any) {
        console.error("registerTouristAction error", error);
        await LoggerService.logError("user_registration_exception", error);
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
        await LoggerService.logInteraction('contact_page_inquiry_start', { inquiryType: formData.inquiryType, email: formData.email });

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

        await LoggerService.logInteraction('contact_page_inquiry_success', { email });
        return { success: true, message: "Your inquiry has been delivered successfully. Our concierge will contact you shortly." };
    } catch (error: any) {
        console.error("Error in submitInquiryAction:", error);
        await LoggerService.logError('contact_page_inquiry_error', error, formData);
        return { error: "An unexpected system error occurred. Our technical team has been notified. Please try again or contact us via email." };
    }
}

export async function submitPlanRequestAction(dto: any) {
    try {
        await LoggerService.logInteraction('plan_request_start', { email: dto.email });

        if (!dto.email || !dto.name) {
            return { error: "Name and email are required." };
        }

        let userId: string | undefined = undefined;
        try {
            const authResult = await registerTouristAction(dto.email, dto.name, dto.phone_number);
            if (authResult.success && authResult.user) {
                userId = authResult.user.id;
            }
        } catch (authError) {
            console.warn("Auth Registration skipped in plan request flow:", authError);
        }

        const result = await RequestService.createRequest(dto, userId);
        await LoggerService.logInteraction('plan_request_success', { email: dto.email });
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Error in submitPlanRequestAction:", error);
        await LoggerService.logError('plan_request_error', error, dto);
        return { error: "An unexpected system error occurred. Our technical team has been notified. Please try again or contact us via email." };
    }
}
