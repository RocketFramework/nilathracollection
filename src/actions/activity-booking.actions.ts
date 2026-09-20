"use server";

import { ActivityBookingService } from '@/services/activity-booking.service';
import { CreateActivityBookingDTO, ConfirmActivityBookingDTO, UpdateActivityBookingStatusDTO } from '@/dtos/activity-booking.dto';

export async function submitActivityBookingAction(dto: CreateActivityBookingDTO, loggedInUserId?: string) {
    try {
        const result = await ActivityBookingService.createBooking(dto, loggedInUserId);
        return { success: true, data: result };
    } catch (error: any) {
        console.error("submitActivityBookingAction error:", error);
        return { success: false, error: error?.message || "Failed to submit activity booking" };
    }
}

export async function confirmActivityBookingAction(dto: ConfirmActivityBookingDTO) {
    try {
        const result = await ActivityBookingService.confirmBookingAndAssignVendors(dto);
        return { success: true, data: result };
    } catch (error: any) {
        console.error("confirmActivityBookingAction error:", error);
        return { success: false, error: error?.message || "Failed to confirm activity booking" };
    }
}

export async function getMyActivityBookingsAction(touristId: string) {
    try {
        const data = await ActivityBookingService.getMyActivityBookings(touristId);
        return { success: true, data };
    } catch (error: any) {
        console.error("getMyActivityBookingsAction error:", error);
        return { success: false, error: error?.message || "Failed to fetch tourist activity bookings" };
    }
}

export async function getAllActivityBookingsAction(filters?: { status?: string; search?: string }) {
    try {
        const data = await ActivityBookingService.getAllBookings(filters);
        return { success: true, data };
    } catch (error: any) {
        console.error("getAllActivityBookingsAction error:", error);
        return { success: false, error: error?.message || "Failed to fetch activity bookings" };
    }
}

export async function updateActivityBookingStatusAction(dto: UpdateActivityBookingStatusDTO) {
    try {
        const result = await ActivityBookingService.updateBookingStatus(dto);
        return { success: true, data: result };
    } catch (error: any) {
        console.error("updateActivityBookingStatusAction error:", error);
        return { success: false, error: error?.message || "Failed to update booking status" };
    }
}

