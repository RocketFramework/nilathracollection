"use server";

import { AuthService } from "@/services/auth.service";
import { RequestService } from "@/services/request.service";
import { CreateRequestDTO } from "@/dtos/request.dto";

export async function submitInquiryAction(formData: {
    name: string;
    email: string;
    phone?: string;
    inquiryType: string;
    message: string;
}) {
    try {
        const { name, email, phone, inquiryType, message } = formData;

        if (!email || !message || !name) {
            return { error: "Name, email, and message are required." };
        }

        // Lazy register user or get existing
        let userId = null;
        try {
            const authResult = await AuthService.registerTouristByEmail(email);
            userId = (authResult as any)?.user?.id || null;
        } catch (authError) {
            console.warn("Auth Registration skipped in inquiry flow:", authError);
        }

        const requestDto: CreateRequestDTO = {
            email,
            name,
            phone_number: phone,
            request_type: 'inquiry',
            note: `Inquiry Type: ${inquiryType}\n\nMessage: ${message}`,
        };

        // Note: RequestService.createRequest might need adjustment for 'inquiry' if it expects details table.
        // Currently, it only inserts into 'request_details' if type is 'custom-plan' or 'package'.
        // This 'inquiry' will just go into the main 'requests' table.
        await RequestService.createRequest(requestDto, userId);

        return { success: true, message: "Your inquiry has been delivered successfully. Our concierge will contact you shortly." };
    } catch (error: any) {
        console.error("Error in submitInquiryAction:", error);
        return { error: error.message || "An unexpected error occurred. Please try again later." };
    }
}
