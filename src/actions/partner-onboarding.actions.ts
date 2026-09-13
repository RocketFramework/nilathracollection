"use server";

import { headers } from "next/headers";
import { PartnerOnboardingService } from "@/services/partner-onboarding.service";
import { TransportProviderOnboardingDTO, TourGuideOnboardingDTO, PartnerVerificationResultDTO } from "@/dtos/partner-onboarding.dto";

async function getClientIp(): Promise<string> {
    try {
        const headersList = await headers();
        const forwarded = headersList.get("x-forwarded-for");
        if (forwarded) {
            return forwarded.split(",")[0].trim();
        }
        const realIp = headersList.get("x-real-ip");
        if (realIp) {
            return realIp.trim();
        }
    } catch (e) {
        // Fallback for non-request contexts
    }
    return "127.0.0.1";
}

export async function verifyPartnerAccessAction(
    partnerType: 'transport' | 'guide',
    code: string,
    nic: string
): Promise<PartnerVerificationResultDTO> {
    try {
        const ip = await getClientIp();
        const res = await PartnerOnboardingService.verifyAndFetch(partnerType, code, nic, ip);
        return res;
    } catch (err: any) {
        console.error("Error in verifyPartnerAccessAction:", err);
        return { success: false, error: err.message || "Verification failed." };
    }
}

export async function submitTransportPartnerOnboardingAction(
    dto: TransportProviderOnboardingDTO
): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
        const ip = await getClientIp();
        const res = await PartnerOnboardingService.saveTransportProvider(dto, ip);
        return res;
    } catch (err: any) {
        console.error("Error in submitTransportPartnerOnboardingAction:", err);
        return { success: false, error: err.message || "Failed to save transport partner registration." };
    }
}

export async function submitTourGuideOnboardingAction(
    dto: TourGuideOnboardingDTO
): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
        const ip = await getClientIp();
        const res = await PartnerOnboardingService.saveTourGuide(dto, ip);
        return res;
    } catch (err: any) {
        console.error("Error in submitTourGuideOnboardingAction:", err);
        return { success: false, error: err.message || "Failed to save tour guide registration." };
    }
}
