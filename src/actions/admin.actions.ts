"use server";

import { revalidatePath } from "next/cache";
import { AdminService } from "@/services/user.service";
import { TourService } from "@/services/tour.service";
import { createAdminClient } from "@/utils/supabase/admin";
import { CreateAgentDTO } from "@/dtos/user-vendor.dto";
import { MasterDataService, Restaurant } from "@/services/master-data.service";
import { FinanceService } from "@/services/finance.service";
import { CurrencyService } from "@/services/currency.service";
import { DBPurchaseOrder, DBPurchaseOrderItem, DBVendorInvoice, DBVendorPayment } from "@/app/admin/(authenticated)/planner/types";

export async function createAgentAction(formData: FormData) {
    try {
        const dto: CreateAgentDTO = {
            first_name: formData.get("first_name") as string,
            last_name: formData.get("last_name") as string,
            email: formData.get("email") as string,
            phone: formData.get("phone") as string,
            password: formData.get("password") as string
        };

        if (!dto.first_name || !dto.last_name || !dto.email || !dto.password) {
            return { error: "First Name, Last Name, Email, and Password are required." };
        }

        // Delegate business logic to the proper service class
        await AdminService.createAgent(dto);

        // Revalidate admin pages that might show the list of agents
        revalidatePath("/admin/users");

        return { success: true, message: `Successfully created Agent account for ${dto.first_name} ${dto.last_name}` };
    } catch (error: any) {
        console.error("Unexpected error in createAgentAction:", error);
        return { error: error.message || "An unexpected error occurred while creating the agent." };
    }
}

export async function getAgentsAction() {
    try {
        const agents = await AdminService.getAllAgents();
        return { success: true, agents };
    } catch (error: any) {
        console.error("Error fetching agents:", error);
        return { error: error.message || "Failed to fetch agents." };
    }
}

export async function assignAgentAction(requestId: string, agentId: string) {
    try {
        await AdminService.assignAgentToRequest(requestId, agentId);
        revalidatePath(`/admin/requests/${requestId}`);
        revalidatePath(`/admin/requests`);
        return { success: true };
    } catch (error: any) {
        console.error("Error assigning agent:", error);
        return { error: error.message || "Failed to assign agent." };
    }
}

export async function createTourAction(requestId: string) {
    try {
        const newTourId = await TourService.createTourFromRequest(requestId);
        return { success: true, tourId: newTourId };
    } catch (error: any) {
        console.error("Error creating tour:", error);
        return { error: error.message || "Failed to create tour." };
    }
}

export async function getTourDataAction(tourId: string) {
    try {
        const data = await TourService.getTourData(tourId);
        return { success: true, data };
    } catch (error: any) {
        console.error("Error fetching tour data:", error);
        return { error: error.message || "Failed to load tour data." };
    }
}

export async function saveTourAction(tourId: string, tripData: any) {
    try {
        await TourService.saveTour(tourId, tripData);
        // Force revalidation of any cached planner data views
        revalidatePath(`/admin/planner`);
        return { success: true };
    } catch (error: any) {
        console.error("Error saving tour data:", error);
        return { error: error.message || "Failed to save tour data." };
    }
}

export async function getHotelsListAction() {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('hotels')
            .select('*, hotel_rooms(*)')
            .eq('is_suspended', false)
            .order('name');

        if (error) throw error;
        return { success: true, hotels: data };
    } catch (error: any) {
        console.error("Error fetching hotels list:", error);
        return { error: error.message || "Failed to load hotels." };
    }
}
export async function getRestaurantsAction() {
    try {
        const supabase = createAdminClient();
        const restaurants = await MasterDataService.getRestaurants(supabase);
        return { success: true, restaurants };
    } catch (error: any) {
        console.error("Error fetching restaurants:", error);
        return { error: error.message || "Failed to load restaurants." };
    }
}

export async function saveRestaurantAction(restaurant: Restaurant) {
    try {
        await MasterDataService.saveRestaurant(restaurant);
        revalidatePath("/admin/master-data/restaurants");
        return { success: true };
    } catch (error: any) {
        console.error("Error saving restaurant:", error);
        return { error: error.message || "Failed to save restaurant." };
    }
}

export async function deleteRestaurantAction(id: string) {
    try {
        await MasterDataService.deleteRestaurant(id);
        revalidatePath("/admin/master-data/restaurants");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting restaurant:", error);
        return { error: error.message || "Failed to delete restaurant." };
    }
}
export async function getActivitiesAction() {
    try {
        const activities = await MasterDataService.getActivities();
        return { success: true, activities };
    } catch (error: any) {
        console.error("Error fetching activities:", error);
        return { error: error.message || "Failed to load activities." };
    }
}
export async function getVendorsAction() {
    try {
        const supabase = createAdminClient();
        const vendors = await MasterDataService.getVendors(supabase);
        return { success: true, vendors };
    } catch (error: any) {
        console.error("Error fetching vendors:", error);
        return { error: error.message || "Failed to load vendors." };
    }
}

export async function getTransportProvidersAction() {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('transport_providers')
            .select('*, payment_details(*), transport_vehicles(*)')
            .order('name');

        if (error) throw error;
        return { success: true, providers: data };
    } catch (error: any) {
        console.error("Error fetching transport providers:", error);
        return { error: error.message || "Failed to load transport providers." };
    }
}

export async function getDriversAction() {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('drivers')
            .select('*, payment_details(*)')
            .order('first_name');

        if (error) throw error;
        return { success: true, drivers: data };
    } catch (error: any) {
        console.error("Error fetching drivers:", error);
        return { error: error.message || "Failed to load drivers." };
    }
}

export async function getTourGuidesAction() {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('tour_guides')
            .select('*, payment_details(*)')
            .order('first_name');

        if (error) throw error;
        return { success: true, guides: data };
    } catch (error: any) {
        console.error("Error fetching tour guides:", error);
        return { error: error.message || "Failed to load tour guides." };
    }
}
export async function getPurchaseOrdersAction(tourId: string) {
    try {
        const pos = await FinanceService.getPurchaseOrdersForTour(tourId);
        return { success: true, pos };
    } catch (error: any) {
        console.error("Error fetching purchase orders:", error);
        return { error: error.message || "Failed to load purchase orders." };
    }
}

export async function savePurchaseOrderAction(po: Partial<DBPurchaseOrder>, items: Partial<DBPurchaseOrderItem>[]) {
    try {
        const id = await FinanceService.savePurchaseOrder(po, items);
        // revalidatePath(`/admin/planner`); 
        return { success: true, id };
    } catch (error: any) {
        console.error("Error saving purchase order:", error);
        return { error: error.message || "Failed to save purchase order." };
    }
}

export async function deletePurchaseOrderAction(id: string) {
    try {
        await FinanceService.deletePurchaseOrder(id);
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting purchase order:", error);
        return { error: error.message || "Failed to delete purchase order." };
    }
}

export async function deleteDraftPurchaseOrdersAction(tourId: string) {
    try {
        await FinanceService.deleteDraftPurchaseOrdersForTour(tourId);
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting draft purchase orders:", error);
        return { error: error.message || "Failed to delete draft purchase orders." };
    }
}

export async function saveVendorInvoiceAction(invoice: Partial<DBVendorInvoice>) {
    try {
        const id = await FinanceService.saveVendorInvoice(invoice);
        return { success: true, id };
    } catch (error: any) {
        console.error("Error saving vendor invoice:", error);
        return { error: error.message || "Failed to save vendor invoice." };
    }
}

export async function saveVendorPaymentAction(payment: Partial<DBVendorPayment>) {
    try {
        const id = await FinanceService.saveVendorPayment(payment);
        return { success: true, id };
    } catch (error: any) {
        console.error("Error saving vendor payment:", error);
        return { error: error.message || "Failed to save vendor payment." };
    }
}
export async function getExchangeRateAction() {
    try {
        const rate = await CurrencyService.getUSDTOLKR();
        return { success: true, rate };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
