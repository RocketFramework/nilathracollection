"use server";

import { PartnerOnboardingService } from "@/services/partner-onboarding.service";
import { OnboardDriverDTO, OnboardVendorDTO } from "@/dtos/partner-registration.dto";

export async function onboardDriverAction(dto: OnboardDriverDTO) {
    try {
        const driver = await PartnerOnboardingService.onboardDriver(dto);
        return { success: true, data: driver };
    } catch (error: any) {
        console.error("onboardDriverAction error:", error);
        return { success: false, error: error?.message || "Failed to register driver" };
    }
}

export async function searchExistingVendorsAction(queryStr: string) {
    try {
        const vendors = await PartnerOnboardingService.searchVendors(queryStr);
        return { success: true, data: vendors };
    } catch (error: any) {
        console.error("searchExistingVendorsAction error:", error);
        return { success: false, error: error?.message || "Failed to search vendors" };
    }
}

export async function onboardVendorAction(dto: OnboardVendorDTO) {
    try {
        const vendor = await PartnerOnboardingService.onboardVendor(dto);
        return { success: true, data: vendor };
    } catch (error: any) {
        console.error("onboardVendorAction error:", error);
        return { success: false, error: error?.message || "Failed to register activity vendor" };
    }
}

export async function getAvailableActivitiesAction() {
    try {
        const activities = await PartnerOnboardingService.getAvailableActivities();
        return { success: true, data: activities };
    } catch (error: any) {
        console.error("getAvailableActivitiesAction error:", error);
        return { success: false, error: error?.message || "Failed to fetch activities" };
    }
}

export async function verifyVendorOwnershipAction(vendorId: string, input: string) {
    try {
        const isOwner = await PartnerOnboardingService.verifyVendorOwnership(vendorId, input);
        return { success: true, isOwner };
    } catch (error: any) {
        console.error("verifyVendorOwnershipAction error:", error);
        return { success: false, isOwner: false, error: error?.message || "Verification error" };
    }
}

