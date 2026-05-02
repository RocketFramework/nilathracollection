"use server";

import { LoggerService } from "@/services/logger.service";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function fetchLogsAction(includePageViews: boolean = false) {
    try {
        const logs = await LoggerService.getLogs(includePageViews, 100);
        return { success: true, logs };
    } catch (error: any) {
        console.error("Failed to fetch logs:", error);
        return { success: false, error: error.message };
    }
}

export async function deletePageViewLogsAction() {
    try {
        await LoggerService.deletePageViewLogs();
        revalidatePath('/admin/logs');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function togglePageViewLoggingAction(enabled: boolean) {
    try {
        await LoggerService.togglePageViewLogging(enabled);
        revalidatePath('/admin/logs');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function logPageViewAction(pageName: string) {
    try {
        const isEnabled = await LoggerService.isPageViewLoggingEnabled();
        if (!isEnabled) return { success: true };

        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';

        await LoggerService.logInteraction('contact_page_view', { 
            page: pageName, 
            ipAddress: ip,
            userAgent: headersList.get('user-agent') || 'unknown'
        });

        return { success: true };
    } catch (error: any) {
        return { success: false };
    }
}
