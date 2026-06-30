"use server";
import sharp from "sharp";

import { revalidatePath } from "next/cache";
import { AdminService, UserService } from "@/services/user.service";
import { TourService } from "@/services/tour.service";
import { TouristService } from "@/services/tourist.service";
import { HotelService, Hotel } from "@/services/hotel.service";
import { MasterDataService, Restaurant, TransportProvider, Vendor } from "@/services/master-data.service";
import { createAdminClient } from "@/utils/supabase/admin";
import { CreateUserDTO } from "@/dtos/user-vendor.dto";
import { FinanceService } from "@/services/finance.service";
import { EmailTemplateService, EmailTemplate } from "@/services/email-template.service";
import { CurrencyService } from "@/services/currency.service";
import { DBPurchaseOrder, DBPurchaseOrderItem, DBSupplierInvoice, DBSupplierPayment } from "@/app/admin/(authenticated)/planner/types";
import { createClient } from "@/utils/supabase/server";
import { RequestService } from "@/services/request.service";
import { emailService } from "@/services/email.service";
import { AIService } from "@/services/ai.service";
import { AIRule } from "@/types/ai";
import { CreateRequestDTO, UpdateRequestDTO } from '../dtos/request.dto';
import { QuotationService } from "@/services/quotation.service";
import { CreateQuotationRequestDTO, UpdateQuotationDTO } from "../dtos/quotation.dto";
import { VendorBookingService } from "@/services/vendor-booking.service";
import { CreateVendorBookingDTO, UpdateBookingStatusDTO } from "../dtos/vendor-booking.dto";
import { ItineraryDraftService } from "@/services/itinerary-draft.service";
import { DraftItineraryVersion, ItineraryLock, InternalItineraryBlock } from "@/other/interfaces";
import { TourSharedEmailService } from "@/services/tour-shared-email.service";
import { VendorEmailHistoryService } from "@/services/vendor-email-history.service";
import { POBlockService } from "@/services/po-block.service";
import { enforcePermission } from "@/utils/auth-enforcer";
import { AppSettingsService } from "@/services/app-settings.service";
import { CustomerInvoiceService } from "@/services/customer-invoice.service";
import { Settings } from "@/types/types";


export async function getDashboardRequestsAction(filters: any, currentPage: number = 1, pageSize: number = 10) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Not authenticated" };

        const adminSupabase = createAdminClient();
        const { data: rpcRole } = await adminSupabase.rpc('get_user_role', { user_id: user.id });
        const { data: adminData } = await adminSupabase.from('admin_profiles').select('*').eq('id', user.id).single();
        const metadataRole = user.user_metadata?.role;

        const isRpcAdmin = typeof rpcRole === 'string'
            ? rpcRole.trim().toLowerCase() === 'admin'
            : typeof rpcRole === 'object' && rpcRole !== null && (rpcRole as any).role === 'admin';

        const isAdmin = isRpcAdmin || adminData || metadataRole === 'admin';

        let apiFilters = { ...filters };

        if (!isAdmin) {
            apiFilters.adminAssignedTo = user.id;
        }

        const { data, count } = await RequestService.getRequestsWithFilters(apiFilters, currentPage, pageSize, adminSupabase);

        return { success: true, data, count, role: isAdmin ? 'admin' : 'agent', userId: user.id };
    } catch (error: any) {
        console.error("Error fetching dashboard requests:", error);
        return { success: false, error: error.message };
    }
}

export async function getUserRoleAction() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: true, role: 'guest', id: null };

        const adminSupabase = createAdminClient();
        const { data: rpcRole } = await adminSupabase.rpc('get_user_role', { user_id: user.id });
        const { data: adminData } = await adminSupabase.from('admin_profiles').select('*').eq('id', user.id).single();
        const metadataRole = user.user_metadata?.role;

        const isRpcAdmin = typeof rpcRole === 'string'
            ? rpcRole.trim().toLowerCase() === 'admin'
            : typeof rpcRole === 'object' && rpcRole !== null && (rpcRole as any).role === 'admin';

        if (isRpcAdmin || adminData || metadataRole === 'admin') {
            return { success: true, role: 'admin', id: user.id };
        }

        return { success: true, role: 'agent', id: user.id };
    } catch (error: any) {
        console.error("Error fetching user role:", error);
        return { success: false, role: 'agent', id: null };
    }
}

export async function createAgentAction(formData: FormData) {
    try {
        const dto: CreateUserDTO = {
            first_name: formData.get("first_name") as string,
            last_name: formData.get("last_name") as string,
            email: formData.get("email") as string,
            phone: formData.get("phone") as string,
            password: formData.get("password") as string,
            role: "agent"
        };

        if (!dto.first_name || !dto.last_name || !dto.email || !dto.password) {
            return { error: "First Name, Last Name, Email, and Password are required." };
        }

        // Delegate business logic to the proper service class
        await AdminService.createUser(dto);

        // Revalidate admin pages that might show the list of agents
        revalidatePath("/admin/user-management");

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

export async function updateRequestStatusAction(requestId: string, status: UpdateRequestDTO['status']) {
    try {
        await RequestService.updateRequestStatus(requestId, { status });

        revalidatePath(`/admin/requests/${requestId}`);
        revalidatePath(`/admin/requests`);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating request status:", error);
        return { error: error.message || "Failed to update request status." };
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
        revalidatePath(`/admin-new`);
        return { success: true };
    } catch (error: any) {
        console.error("Error saving tour data:", error);
        return { error: error.stack || error.message || "Failed to save tour data." };
    }
}

export async function savePlannerDataAction(tourId: string, tripData: any) {
    try {
        const adminSupabase = createAdminClient();
        const { error } = await adminSupabase
            .from('tours')
            .update({ planner_data: tripData })
            .eq('id', tourId);
        if (error) throw error;
        // Force revalidation of any cached planner data views
        revalidatePath(`/admin-new`);
        return { success: true };
    } catch (error: any) {
        console.error("Error saving planner JSON data:", error);
        return { success: false, error: error.message || "Failed to save planner data." };
    }
}

export async function getTouristDataAction(tourId: string) {
    try {
        const data = await TouristService.getTouristData(tourId);
        return { success: true, data };
    } catch (error: any) {
        console.error("Error fetching tourist DTO data:", error);
        return { error: error.message || "Failed to load tourist data." };
    }
}

export async function saveTouristDataAction(tourId: string, data: any) {
    try {
        await TouristService.saveTouristData(tourId, data);
        revalidatePath(`/admin-new`);
        return { success: true };
    } catch (error: any) {
        console.error("Error saving tourist DTO data:", error);
        return { error: error.stack || error.message || "Failed to save tourist data." };
    }
}

export async function getHotelsListAction() {
    try {
        const supabase = createAdminClient();
        const { data: hotels } = await HotelService.getHotels({ client: supabase });
        return { success: true, hotels };
    } catch (error: any) {
        console.error("Error fetching hotels:", error);
        return { error: error.message || "Failed to load hotels." };
    }
}

export async function getAssignedHotelsAction(ids: string[]) {
    try {
        const supabase = createAdminClient();
        if (!ids || ids.length === 0) return { success: true, hotels: [] };
        const { data: hotels } = await HotelService.getHotels({ client: supabase, ids });
        return { success: true, hotels };
    } catch (error: any) {
        console.error("Error fetching assigned hotels:", error);
        return { error: error.message || "Failed to load assigned hotels." };
    }
}

export async function getAssignedVendorsAction(ids: string[]) {
    try {
        const supabase = createAdminClient();
        if (!ids || ids.length === 0) return { success: true, vendors: [] };
        const { data: vendors } = await MasterDataService.getVendors({ client: supabase, ids });
        return { success: true, vendors };
    } catch (error: any) {
        console.error("Error fetching assigned vendors:", error);
        return { error: error.message || "Failed to load assigned vendors." };
    }
}

export async function getAssignedTransportProvidersAction(ids: string[]) {
    try {
        const supabase = createAdminClient();
        if (!ids || ids.length === 0) return { success: true, providers: [] };
        const { data: providers } = await MasterDataService.getTransportProviders({ client: supabase, ids });
        return { success: true, providers };
    } catch (error: any) {
        console.error("Error fetching assigned transport providers:", error);
        return { error: error.message || "Failed to load assigned transport providers." };
    }
}

export async function getAssignedTourGuidesAction(ids: string[]) {
    try {
        const supabase = createAdminClient();
        if (!ids || ids.length === 0) return { success: true, guides: [] };
        const { data: guides } = await MasterDataService.getTourGuides({ client: supabase, ids });
        return { success: true, guides };
    } catch (error: any) {
        console.error("Error fetching assigned tour guides:", error);
        return { error: error.message || "Failed to load assigned tour guides." };
    }
}

export async function getAssignedRestaurantsAction(ids: string[]) {
    try {
        const supabase = createAdminClient();
        if (!ids || ids.length === 0) return { success: true, restaurants: [] };
        const { data: restaurants } = await MasterDataService.getRestaurants({ client: supabase, ids });
        return { success: true, restaurants };
    } catch (error: any) {
        console.error("Error fetching assigned restaurants:", error);
        return { error: error.message || "Failed to load assigned restaurants." };
    }
}

export async function searchHotelsAction(city: string, name: string) {
    try {
        const supabase = createAdminClient();
        const { data: hotels } = await HotelService.getHotels({ client: supabase, city, searchTerm: name });
        return { success: true, hotels };
    } catch (error: any) {
        console.error("Error searching hotels:", error);
        return { error: error.message || "Failed to search hotels." };
    }
}

export async function getHotelAction(id: string) {
    try {
        const supabase = createAdminClient();
        const hotel = await HotelService.getHotel(id, { client: supabase });
        return { success: true, hotel };
    } catch (error: any) {
        console.error("Error fetching hotel:", error);
        return { error: error.message || "Failed to load hotel." };
    }
}

export async function saveHotelAction(hotel: Hotel) {
    try {
        const scope = hotel.id ? 'scopes:hotel:update' : 'scopes:hotel:create';
        await enforcePermission('urn:nilathra:resource:hotel', scope, { id: hotel.id, payload: hotel });

        const adminSupabase = createAdminClient();
        let savedHotel;
        if (hotel.id) {
            savedHotel = await HotelService.updateHotel(hotel, { client: adminSupabase });
        } else {
            savedHotel = await HotelService.createHotel(hotel, { client: adminSupabase });
        }
        revalidatePath("/admin/master-data/hotels");
        return { success: true, hotel: savedHotel };
    } catch (error: any) {
        console.error("Error saving hotel:", error);
        return { error: error.message || "Failed to save hotel." };
    }
}


export async function uploadHotelPhotoAction(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            return { error: "No file provided" };
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Convert the input image buffer (JPEG, PNG, GIF, JPG) to optimized WebP format
        const optimizedBuffer = await sharp(buffer)
            .webp({ quality: 80 })
            .toBuffer();

        const adminSupabase = createAdminClient();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.webp`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await adminSupabase.storage
            .from('payment-proofs')
            .upload(filePath, optimizedBuffer, {
                contentType: 'image/webp',
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { data } = adminSupabase.storage
            .from('payment-proofs')
            .getPublicUrl(filePath);

        return { success: true, url: data.publicUrl };
    } catch (error: any) {
        console.error("Error uploading hotel photo:", error);
        return { error: error.message || "Failed to upload photo." };
    }
}

export async function uploadPayslipAction(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            return { error: "No file provided" };
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Convert the input image buffer (JPEG, PNG, GIF, JPG) to optimized WebP format on the fly
        const optimizedBuffer = await sharp(buffer)
            .webp({ quality: 80 })
            .toBuffer();

        const adminSupabase = createAdminClient();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.webp`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await adminSupabase.storage
            .from('payslips')
            .upload(filePath, optimizedBuffer, {
                contentType: 'image/webp',
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) throw uploadError;

        // Return relative file path since the bucket is private
        return { success: true, url: filePath };
    } catch (error: any) {
        console.error("Error uploading payslip:", error);
        return { error: error.message || "Failed to upload payslip." };
    }
}

export async function getPayslipSignedUrlAction(filePath: string) {
    try {
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase.storage
            .from('payslips')
            .createSignedUrl(filePath, 3600); // 1 hour expiration

        if (error) throw error;
        return { success: true, url: data.signedUrl };
    } catch (error: any) {
        console.error("Error generating signed URL for payslip:", error);
        return { error: error.message || "Failed to generate view link." };
    }
}

export async function updateHotelContactInfoAction(id: string, name: string, contact: string, email: string) {
    try {
        const adminSupabase = await createAdminClient();
        const { error } = await adminSupabase
            .from('hotels')
            .update({
                reservation_agent_name: name,
                reservation_agent_contact: contact,
                reservation_email: email
            })
            .eq('id', id);
        
        if (error) throw error;
        
        revalidatePath("/admin/master-data/hotels");
        return { success: true };
    } catch (error: any) {
        console.error("Error updating hotel contacts:", error);
        return { error: error.message || "Failed to update hotel contacts." };
    }
}

export async function updateTransportProviderContactInfoAction(id: string, phone: string, email: string) {
    try {
        const adminSupabase = await createAdminClient();
        const { error } = await adminSupabase
            .from('transport_providers')
            .update({
                phone: phone,
                email: email
            })
            .eq('id', id);
        
        if (error) throw error;
        
        revalidatePath("/admin/master-data");
        return { success: true };
    } catch (error: any) {
        console.error("Error updating transport provider contacts:", error);
        return { error: error.message || "Failed to update transport provider contacts." };
    }
}

export async function deleteHotelAction(id: string) {
    try {
        await enforcePermission('urn:nilathra:resource:hotel', 'scopes:hotel:delete', { id });
        const adminSupabase = createAdminClient();
        await HotelService.deleteHotel(id, { client: adminSupabase });
        revalidatePath("/admin/master-data/hotels");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting hotel:", error);
        return { error: error.message || "Failed to delete hotel." };
    }
}
export async function getRestaurantsAction(options?: any) {
    try {
        const supabase = createAdminClient();
        const { data: restaurants, count } = await MasterDataService.getRestaurants({ ...options, client: supabase });
        return { success: true, restaurants, count };
    } catch (error: any) {
        console.error("Error fetching restaurants:", error);
        return { error: error.message || "Failed to load restaurants." };
    }
}

export async function searchRestaurantsAction(searchTerm: string) {
    try {
        const supabase = createAdminClient();
        const { data: restaurants } = await MasterDataService.getRestaurants({ client: supabase, searchTerm });
        return { success: true, restaurants };
    } catch (error: any) {
        console.error("Error searching restaurants:", error);
        return { error: error.message || "Failed to search restaurants." };
    }
}

export async function saveRestaurantAction(restaurant: Restaurant) {
    try {
        const supabase = createAdminClient();
        const savedId = await MasterDataService.saveRestaurant(restaurant, { client: supabase });
        revalidatePath("/admin/master-data/restaurants");
        return { success: true, savedId };
    } catch (error: any) {
        console.error("Error saving restaurant:", error);
        return { error: error.message || "Failed to save restaurant." };
    }
}

export async function getRestaurantAction(id: string) {
    try {
        const supabase = createAdminClient();
        const restaurant = await MasterDataService.getRestaurant(id, { client: supabase });
        return { success: true, restaurant };
    } catch (error: any) {
        console.error("Error fetching restaurant:", error);
        return { error: error.message || "Failed to fetch restaurant." };
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

export async function getVendorsAction(options?: any) {
    try {
        const supabase = createAdminClient();
        const { data: vendors, count } = await MasterDataService.getVendors({ ...options, client: supabase });
        return { success: true, vendors, count };
    } catch (error: any) {
        console.error("Error fetching vendors:", error);
        return { error: error.message || "Failed to load vendors." };
    }
}

export async function saveVendorAction(vendor: Vendor) {
    try {
        const supabase = createAdminClient();
        const savedId = await MasterDataService.saveVendor(vendor, { client: supabase });
        revalidatePath("/admin/master-data");
        return { success: true, savedId };
    } catch (error: any) {
        console.error("Error saving vendor:", error);
        return { error: error.message || "Failed to save vendor." };
    }
}

export async function getVendorAction(id: string) {
    try {
        const supabase = createAdminClient();
        const vendor = await MasterDataService.getVendor(id, { client: supabase });
        return { success: true, vendor };
    } catch (error: any) {
        console.error("Error fetching vendor:", error);
        return { error: error.message || "Failed to fetch vendor." };
    }
}

export async function getTransportProvidersAction(options?: any) {
    try {
        const supabase = createAdminClient();
        const { data: providers, count } = await MasterDataService.getTransportProviders({ ...options, client: supabase });
        return { success: true, providers, count };
    } catch (error: any) {
        console.error("Error fetching transport providers:", error);
        return { error: error.message || "Failed to load transport providers." };
    }
}

export async function saveTransportProviderAction(provider: TransportProvider) {
    try {
        const supabase = createAdminClient();
        const savedId = await MasterDataService.saveTransportProvider(provider, { client: supabase });
        revalidatePath("/admin/master-data");
        return { success: true, savedId };
    } catch (error: any) {
        console.error("Error saving transport provider:", error);
        return { error: error.message || "Failed to save transport provider." };
    }
}

export async function refreshPlannerCacheAction() {
    try {
        revalidatePath('/admin-new');
        revalidatePath('/admin/master-data');
        return { success: true };
    } catch (error: any) {
        return { success: false };
    }
}

export async function getActivitiesAction(options?: any) {
    try {
        const supabase = createAdminClient();
        const result = await MasterDataService.getActivities({ ...options, client: supabase });
        return { success: true, data: result.data, count: result.count };
    } catch (error: any) {
        console.error("Error fetching activities:", error);
        return { success: false, error: error.message || "Failed to load activities." };
    }
}

export async function saveActivityAction(activityData: any) {
    try {
        const supabase = createAdminClient();
        const newId = await MasterDataService.saveActivity(activityData, supabase);
        revalidatePath(`/admin/master-data`);
        return { success: true, id: newId };
    } catch (error: any) {
        console.error("Error saving activity:", error);
        return { success: false, error: error.message || "Failed to save activity." };
    }
}

export async function getDriversAction(options?: any) {
    try {
        const supabase = createAdminClient();
        const { data: drivers, count } = await MasterDataService.getDrivers({ ...options, client: supabase });
        return { success: true, drivers, count };
    } catch (error: any) {
        console.error("Error fetching drivers:", error);
        return { error: error.message || "Failed to load drivers." };
    }
}

export async function getTourGuidesAction(options?: any) {
    try {
        const supabase = createAdminClient();
        const { data: guides, count } = await MasterDataService.getTourGuides({ ...options, client: supabase });
        return { success: true, guides, count };
    } catch (error: any) {
        console.error("Error fetching guides:", error);
        return { error: error.message || "Failed to load guides." };
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

export async function getFinalizedActivitiesAction(tourId: string) {
    try {
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
            .from('daily_activities')
            .select('*')
            .eq('tour_id', tourId)
            .eq('price_finalized', true);

        if (error) throw error;
        return { success: true, activities: data || [] };
    } catch (error: any) {
        console.error("Error fetching finalized activities:", error);
        return { success: false, error: error.message || "Failed to load activities." };
    }
}

export async function getDailyActivitiesAction(tourId: string) {
    try {
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
            .from('daily_activities')
            .select('*, tour_itineraries(day_number, date)')
            .eq('tour_id', tourId);

        if (error) throw error;
        
        // Filter out records that are activity_type === 'activity' or 'meal' and all vendor/booking references are null
        const filteredData = (data || []).filter((act: any) => {
            const isInvalidActivity = (act.activity_type === 'activity' || act.activity_type === 'meal') &&
                !act.vendor_id &&
                !act.restaurant_id &&
                !act.vendor_activity_id &&
                !act.hotel_id;
            return !isInvalidActivity;
        });

        return { success: true, activities: filteredData };
    } catch (error: any) {
        console.error("Error fetching daily activities:", error);
        return { success: false, error: error.message || "Failed to load daily activities." };
    }
}

export async function getItineraryDatesAction(tourId: string) {
    try {
        const adminSupabase = createAdminClient();
        
        // Query tour_itineraries directly for day_number and date
        const { data, error } = await adminSupabase
            .from('tour_itineraries')
            .select('day_number, date')
            .eq('tour_id', tourId);
            
        if (error) throw error;

        const dateMapByDayNumber: Record<number, string> = {};
        data?.forEach(ti => {
            if (ti.day_number && ti.date) {
                dateMapByDayNumber[ti.day_number] = ti.date;
            }
        });

        return { 
            success: true, 
            dateMapByDayNumber 
        };
    } catch (error: any) {
        console.error("Error fetching itinerary dates:", error);
        return { success: false, error: error.message || "Failed to load itinerary dates." };
    }
}


export async function finalizeActivityPricesAction(
    updates: { 
        id: string; 
        price_finalized?: boolean; 
        contracted_price?: number | null; 
        contracted_total_price?: number | null;
        driver_meal_included?: boolean;
        driver_acc_included?: boolean;
        parking_included?: boolean;
        guide_room_discount?: string | null;
    }[]
) {
    try {
        const adminSupabase = createAdminClient();
        for (const update of updates) {
            const dbFields: any = {};
            if (update.price_finalized !== undefined) {
                dbFields.price_finalized = update.price_finalized;
            }
            if (update.contracted_price !== undefined) {
                dbFields.contracted_price = update.contracted_price;
            }
            if (update.contracted_total_price !== undefined) {
                dbFields.contracted_total_price = update.contracted_total_price;
            }
            if (update.driver_meal_included !== undefined) {
                dbFields.driver_meal_included = update.driver_meal_included;
            }
            if (update.driver_acc_included !== undefined) {
                dbFields.driver_acc_included = update.driver_acc_included;
            }
            if (update.parking_included !== undefined) {
                dbFields.parking_included = update.parking_included;
            }
            if (update.guide_room_discount !== undefined) {
                dbFields.guide_room_discount = update.guide_room_discount;
            }

            const { error } = await adminSupabase
                .from('daily_activities')
                .update(dbFields)
                .eq('id', update.id);
            if (error) throw error;
        }
        return { success: true };
    } catch (error: any) {
        console.error("Error finalizing prices:", error);
        return { success: false, error: error.message || "Failed to finalize prices." };
    }
}

export async function savePurchaseOrderAction(po: Partial<DBPurchaseOrder>, items: Partial<DBPurchaseOrderItem>[]) {
    try {
        const id = await FinanceService.savePurchaseOrder(po, items);
        return { success: true, id };
    } catch (error: any) {
        console.error("Error saving purchase order:", error);
        return { success: false, error: error.message || "Failed to save purchase order." };
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

export async function saveSupplierInvoiceAction(invoice: Partial<DBSupplierInvoice>) {
    try {
        const id = await FinanceService.saveSupplierInvoice(invoice);
        return { success: true, id };
    } catch (error: any) {
        console.error("Error saving supplier invoice:", error);
        return { error: error.message || "Failed to save supplier invoice." };
    }
}

export async function saveSupplierPaymentAction(payment: Partial<DBSupplierPayment>) {
    try {
        const id = await FinanceService.saveSupplierPayment(payment);
        return { success: true, id };
    } catch (error: any) {
        console.error("Error saving supplier payment:", error);
        return { error: error.message || "Failed to save supplier payment." };
    }
}

export async function deleteSupplierPaymentAction(id: string) {
    try {
        await FinanceService.deleteSupplierPayment(id);
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting supplier payment:", error);
        return { success: false, error: error.message || "Failed to delete supplier payment." };
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

export async function getPendingApprovalsAction() {
    try {
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
            .from('master_data_approvals')
            .select('*')
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Enhance with agent details manually to avoid PostgREST relationship errors
        if (data && data.length > 0) {
            const agentIds = [...new Set(data.map((d: any) => d.requested_by).filter(Boolean))];
            if (agentIds.length > 0) {
                const { data: agents } = await adminSupabase
                    .from('agent_profiles')
                    .select('id, first_name, last_name, phone')
                    .in('id', agentIds);

                const agentMap = (agents || []).reduce((acc: any, curr: any) => {
                    acc[curr.id] = curr;
                    return acc;
                }, {});

                data.forEach((d: any) => {
                    d.agent = agentMap[d.requested_by] || null;
                });
            }
        }

        return { success: true, data };
    } catch (error: any) {
        console.error("Error fetching approvals:", error);
        return { success: false, error: error.message };
    }
}

export async function resolveApprovalAction(id: string, status: 'APPROVED' | 'REJECTED') {
    try {
        const adminSupabase = createAdminClient();
        const serverClient = await createClient();
        const { data: { user } } = await serverClient.auth.getUser();

        // 1. Mark as resolved
        const { error, data: approvalData } = await adminSupabase
            .from('master_data_approvals')
            .update({
                status,
                resolved_at: new Date().toISOString(),
                resolved_by: user?.id || null
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // 2. If approved, apply the proposed_data to the relevant entity table
        if (status === 'APPROVED' && approvalData) {
            const { entity_type, proposed_data } = approvalData;

            try {
                switch (entity_type) {
                    case 'hotel':
                        if (proposed_data.id) {
                            await HotelService.updateHotel(proposed_data, { client: adminSupabase });
                        } else {
                            await HotelService.createHotel(proposed_data, { client: adminSupabase });
                        }
                        break;
                    case 'vendor':
                        await MasterDataService.saveVendor(proposed_data, { client: adminSupabase });
                        break;
                    case 'restaurant':
                        await MasterDataService.saveRestaurant(proposed_data, { client: adminSupabase });
                        break;
                    case 'transport':
                        await MasterDataService.saveTransportProvider(proposed_data, { client: adminSupabase });
                        break;
                    case 'driver':
                        await MasterDataService.saveDriver(proposed_data);
                        break;
                    case 'guide':
                        await MasterDataService.saveTourGuide(proposed_data);
                        break;
                    default:
                        console.warn(`Unknown entity type for approval application: ${entity_type}`);
                }
            } catch (applyError: any) {
                console.error("Error applying approved data to entity table:", applyError);
                throw new Error("Approval status updated, but failed to apply changes to database.");
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error resolving approval:", error);
        return { success: false, error: error.message };
    }
}

export async function getToursAction(statuses: string[]) {
    try {
        const tours = await TourService.getToursByStatuses(statuses);
        return { success: true, tours };
    } catch (error: any) {
        console.error("Error fetching tours:", error);
        return { success: false, error: error.message };
    }
}

export async function sendCustomEmailAction(formData: FormData) {
    try {
        const to = formData.get('to') as string;
        const from = formData.get('from') as string;
        const subject = formData.get('subject') as string;
        const body = formData.get('body') as string;
        const files = formData.getAll('attachments') as File[];

        const attachments = [];
        for (const file of files) {
            if (file && file.size > 0) {
                const buffer = Buffer.from(await file.arrayBuffer());
                attachments.push({
                    filename: file.name,
                    content: buffer,
                    contentType: file.type
                });
            }
        }

        const contentHtml = `
              <div style="font-size:15px;color:#4a4a4a;line-height:1.7;white-space:pre-wrap;">${body}</div>
              
              <p style="margin:32px 0 0;font-size:15px;color:#4a4a4a;line-height:1.7;">
                For any further assistance, please contact us at <a href="mailto:concierge@nilathra.com" style="color:#C9A84C;text-decoration:none;font-weight:600;">concierge@nilathra.com</a>.
              </p>
        `;

        const html = emailService.generateEmailHtml('Concierge Communication', 'Concierge Message', contentHtml);

        await emailService.sendEmail({
            from,
            to,
            subject,
            html,
            text: body,
            attachments
        });

        return { success: true };
    } catch (error: any) {
        console.error("Error sending custom email:", error);
        require('fs').writeFileSync('/home/nirosh/Code/NilathraCollection/public/email_error_log.txt', error.stack || error.message);
        return { success: false, error: error.message || "Failed to send email." };
    }
}

export async function getEmailTemplatesAction() {
    try {
        await enforcePermission("urn:nilathra:resource:email-templates", "scopes:email-templates:view");
        const templates = await EmailTemplateService.getTemplates();
        return { success: true, templates };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function saveEmailTemplateAction(template: EmailTemplate) {
    try {
        await enforcePermission("urn:nilathra:resource:email-templates", "scopes:email-templates:manage");
        await EmailTemplateService.saveTemplate(template);
        revalidatePath("/admin/email-templates");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteEmailTemplateAction(id: string) {
    try {
        await enforcePermission("urn:nilathra:resource:email-templates", "scopes:email-templates:manage");
        await EmailTemplateService.deleteTemplate(id);
        revalidatePath("/admin/email-templates");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAIRulesAction(tourId?: string) {
    try {
        const rules = await AIService.getRules(tourId);
        return { success: true, rules };
    } catch (error: any) {
        console.error("Error fetching AI rules:", error);
        return { success: false, error: error.message || "Failed to load AI rules." };
    }
}

export async function saveAIRuleAction(rule: AIRule) {
    try {
        await AIService.saveRule(rule);
        return { success: true };
    } catch (error: any) {
        console.error("Error saving AI rule:", error);
        return { success: false, error: error.message || "Failed to save AI rule." };
    }
}

export async function getInboxEmailsAction() {
    try {
        const { gmailService } = await import('@/services/gmail.service');
        const emails = await gmailService.getRecentEmails(30);
        return { success: true, emails };
    } catch (error: any) {
        console.error("Error fetching inbox emails:", error);
        return { success: false, error: error.message || "Failed to fetch inbox emails." };
    }
}

export async function markEmailAsReadAction(messageId: string) {
    try {
        const { gmailService } = await import('@/services/gmail.service');
        await gmailService.markAsRead(messageId);
        return { success: true };
    } catch (error: any) {
        console.error("Error marking email as read:", error);
        return { success: false, error: error.message || "Failed to mark email as read." };
    }
}

export async function replyToInboxEmailAction(threadId: string, to: string, subject: string, originalMessageId: string, replyText: string) {
    try {
        const { gmailService } = await import('@/services/gmail.service');
        const formattedHtml = replyText.replace(/\n/g, '<br/>');
        const success = await gmailService.replyToEmail(threadId, to, subject, originalMessageId, formattedHtml);
        if (!success) throw new Error("Failed to send reply");
        return { success: true };
    } catch (error: any) {
        console.error("Error replying to email:", error);
        return { success: false, error: error.message || "Failed to reply to email." };
    }
}

export async function getRoomMarkupAction() {
    try {
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase.from('app_settings').select('setting_value').eq('setting_key', Settings.Room_Markup).single();
        if (error) return { success: true, markup: 10 }; // Default to 10%
        return { success: true, markup: Number(data.setting_value) };
    } catch (error) {
        return { success: true, markup: 10 };
    }
}

export async function saveRoomMarkupAction(markup: number) {
    try {
        const adminSupabase = createAdminClient();
        const { error } = await adminSupabase.from('app_settings').upsert({ setting_key: Settings.Room_Markup, setting_value: markup });
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error("Error saving room markup:", error);
        return { success: false, error: error.message };
    }
}

export async function getAppMarkupsAction() {
    try {
        const data = await AppSettingsService.getAppSettings();
        
        const markups = {
            [Settings.Room_Markup]: 10,
            [Settings.Diver_Markup]: 10,
            [Settings.Restaurant_Markup]: 10,
            [Settings.Tour_Guide_Markup]: 10,
            [Settings.Vendor_Activity_Markup]: 10,
            [Settings.Transport_Markup]: 10,
            [Settings.Regular_Vehicle_Km_Rate]: 0,
            [Settings.Premium_Vehicle_Km_Rate]: 0,
            [Settings.Luxury_Vehicle_Km_Rate]: 0,
            [Settings.Ultra_Vip_Vehicle_Km_Rate]: 0,
            [Settings.Regular_Vehicle_Day_Rate]: 0,
            [Settings.Premium_Vehicle_Day_Rate]: 0,
            [Settings.Luxury_Vehicle_Day_Rate]: 0,
            [Settings.Ultra_Vip_Vehicle_Day_Rate]: 0,
            [Settings.Regular_Chauffeur_Day_Rate]: 0,
            [Settings.Premium_Chauffeur_Day_Rate]: 0,
            [Settings.Luxury_Chauffeur_Day_Rate]: 0,
            [Settings.Ultra_Vip_Chauffeur_Day_Rate]: 0,
            [Settings.Guide_National_Day_Rate]: 0,
            [Settings.Guide_Regular_Day_Rate]: 0,
            [Settings.Guide_Location_Day_Rate]: 0,
            [Settings.Activity_Travel_Prep_Time]: 2,
            [Settings.Daily_Activity_Hours_Limit]: 6,
            [Settings.Activity_Average_Speed_Km]: 30,
            [Settings.Regular_Breakfast_Cost]: 12,
            [Settings.Premium_Breakfast_Cost]: 20,
            [Settings.Luxury_Breakfast_Cost]: 30,
            [Settings.Ultra_Vip_Breakfast_Cost]: 60,
            [Settings.Regular_Lunch_Cost]: 15,
            [Settings.Premium_Lunch_Cost]: 25,
            [Settings.Luxury_Lunch_Cost]: 50,
            [Settings.Ultra_Vip_Lunch_Cost]: 100,
            [Settings.Regular_Dinner_Cost]: 20,
            [Settings.Premium_Dinner_Cost]: 35,
            [Settings.Luxury_Dinner_Cost]: 50,
            [Settings.Ultra_Vip_Dinner_Cost]: 100,
            [Settings.Regular_Service_Fee]: 10,
            [Settings.Premium_Service_Fee]: 20,
            [Settings.Luxury_Service_Fee]: 25,
            [Settings.Ultra_Vip_Service_Fee]: 40,
            [Settings.Regular_Concierge_Cost]: 40,
            [Settings.Premium_Concierge_Cost]: 50,
            [Settings.Luxury_Concierge_Cost]: 100,
            [Settings.Ultra_Vip_Concierge_Cost]: 200,
            [Settings.Policy_Generic]: "",
            [Settings.Policy_Regular]: "",
            [Settings.Policy_Premium]: "",
            [Settings.Policy_Luxury]: "",
            [Settings.Policy_Ultra_Vip]: "",
            [Settings.Policy_Draft]: "",
            [Settings.Address]: "Nilathra Hotel Management (Pvt) Ltd, 145/1 Vajira Rd, Colombo 00500",
            [Settings.Company_Logo]: "",
        };

        if (data) {
            data.forEach(item => {
                if (item.setting_key in markups) {
                    if (item.setting_key.startsWith('policy_') || item.setting_key === 'address' || item.setting_key === 'company_logo') {
                        (markups as any)[item.setting_key] = item.setting_value || "";
                    } else {
                        (markups as any)[item.setting_key] = Number(item.setting_value);
                    }
                }
            });
        }
        
        return { success: true, markups };
    } catch (error) {
        return { success: true, markups: {
            [Settings.Room_Markup]: 10,
            [Settings.Diver_Markup]: 10,
            [Settings.Restaurant_Markup]: 10,
            [Settings.Tour_Guide_Markup]: 10,
            [Settings.Vendor_Activity_Markup]: 10,
            [Settings.Transport_Markup]: 10,
            [Settings.Regular_Vehicle_Km_Rate]: 0,
            [Settings.Premium_Vehicle_Km_Rate]: 0,
            [Settings.Luxury_Vehicle_Km_Rate]: 0,
            [Settings.Ultra_Vip_Vehicle_Km_Rate]: 0,
            [Settings.Regular_Vehicle_Day_Rate]: 0,
            [Settings.Premium_Vehicle_Day_Rate]: 0,
            [Settings.Luxury_Vehicle_Day_Rate]: 0,
            [Settings.Ultra_Vip_Vehicle_Day_Rate]: 0,
            [Settings.Regular_Chauffeur_Day_Rate]: 0,
            [Settings.Premium_Chauffeur_Day_Rate]: 0,
            [Settings.Luxury_Chauffeur_Day_Rate]: 0,
            [Settings.Ultra_Vip_Chauffeur_Day_Rate]: 0,
            [Settings.Guide_National_Day_Rate]: 0,
            [Settings.Guide_Regular_Day_Rate]: 0,
            [Settings.Guide_Location_Day_Rate]: 0,
            [Settings.Activity_Travel_Prep_Time]: 2,
            [Settings.Daily_Activity_Hours_Limit]: 6,
            [Settings.Activity_Average_Speed_Km]: 30,
            [Settings.Regular_Breakfast_Cost]: 12,
            [Settings.Premium_Breakfast_Cost]: 20,
            [Settings.Luxury_Breakfast_Cost]: 30,
            [Settings.Ultra_Vip_Breakfast_Cost]: 60,
            [Settings.Regular_Lunch_Cost]: 15,
            [Settings.Premium_Lunch_Cost]: 25,
            [Settings.Luxury_Lunch_Cost]: 50,
            [Settings.Ultra_Vip_Lunch_Cost]: 100,
            [Settings.Regular_Dinner_Cost]: 20,
            [Settings.Premium_Dinner_Cost]: 35,
            [Settings.Luxury_Dinner_Cost]: 50,
            [Settings.Ultra_Vip_Dinner_Cost]: 100,
            [Settings.Regular_Service_Fee]: 10,
            [Settings.Premium_Service_Fee]: 20,
            [Settings.Luxury_Service_Fee]: 25,
            [Settings.Ultra_Vip_Service_Fee]: 40,
            [Settings.Regular_Concierge_Cost]: 40,
            [Settings.Premium_Concierge_Cost]: 50,
            [Settings.Luxury_Concierge_Cost]: 100,
            [Settings.Ultra_Vip_Concierge_Cost]: 200,
            [Settings.Policy_Generic]: "",
            [Settings.Policy_Regular]: "",
            [Settings.Policy_Premium]: "",
            [Settings.Policy_Luxury]: "",
            [Settings.Policy_Ultra_Vip]: "",
            [Settings.Policy_Draft]: "",
            [Settings.Address]: "Nilathra Hotel Management (Pvt) Ltd, 145/1 Vajira Rd, Colombo 00500",
            [Settings.Company_Logo]: "",
        } };
    }
}

export async function saveAppMarkupsAction(markups: Record<string, any>) {
    try {
        const updates = Object.entries(markups).map(([key, value]) => ({
            setting_key: key,
            setting_value: value !== undefined && value !== null ? value.toString() : ""
        }));
        await AppSettingsService.saveAppSettings(updates);
        return { success: true };
    } catch (error: any) {
        console.error("Error saving markups:", error);
        return { success: false, error: error.message };
    }
}

export async function sendPurchaseOrderEmailAction(options: {
    to: string;
    from?: string;
    subject: string;
    body: string;
    pdfBase64: string;
    pdfFilename: string;
    poId?: string;
    sentToName?: string;
}) {
    try {
        const { to, from, subject, body, pdfBase64, pdfFilename, poId, sentToName } = options;
        
        if (!to) {
            return { success: false, error: "Recipient email is required." };
        }
        
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            return { success: false, error: "Resend API key is not configured in .env.local" };
        }
        
        // Wrap the body in standard Nilathra email HTML template
        const contentHtml = `
              <div style="font-size:15px;color:#4a4a4a;line-height:1.7;white-space:pre-wrap;">${body}</div>
              
              <p style="margin:32px 0 0;font-size:15px;color:#4a4a4a;line-height:1.7;">
                For any further assistance, please contact us at <a href="mailto:concierge@nilathra.com" style="color:#C9A84C;text-decoration:none;font-weight:600;">concierge@nilathra.com</a>.
              </p>
        `;
        const html = emailService.generateEmailHtml('Purchase Order', 'Purchase Order', contentHtml);
        
        const sender = from || process.env.EMAIL_FROM || 'concierge@nilathra.com';
        
        const emailPayload: any = {
            from: sender,
            to: to,
            subject: subject,
            html: html
        };

        if (pdfBase64 && pdfFilename) {
            emailPayload.attachments = [
                {
                    filename: pdfFilename,
                    content: pdfBase64
                }
            ];
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailPayload)
        });
        
        const resJson = await res.json();
        
        if (!res.ok) {
            console.error("Resend email delivery failed:", resJson);
            return { success: false, error: resJson.message || "Failed to send email via Resend." };
        }
        
        // Update PO status and tracking fields in Supabase if poId is provided
        if (poId) {
            await FinanceService.updatePOEmailSentStatus(poId, to, sentToName || null, new Date().toISOString());
        }
        
        return { success: true };
    } catch (error: any) {
        console.error("Error in sendPurchaseOrderEmailAction:", error);
        return { success: false, error: error.message || "An unexpected error occurred." };
    }
}

export async function createQuotationRequestAction(dto: CreateQuotationRequestDTO) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Not authenticated" };

        const quote = await QuotationService.createQuotationRequest(dto, user.id);
        return { success: true, quote };
    } catch (error: any) {
        console.error("Error in createQuotationRequestAction:", error);
        return { success: false, error: error.message || "Failed to create quotation request." };
    }
}

export async function getQuotationRequestsForActivityAction(dailyActivityId: string) {
    try {
        const quotes = await QuotationService.getQuotationRequestsForActivity(dailyActivityId);
        return { success: true, quotes };
    } catch (error: any) {
        console.error("Error in getQuotationRequestsForActivityAction:", error);
        return { success: false, error: error.message || "Failed to fetch quotation requests." };
    }
}

export async function getQuotationRequestsForTourAction(tourId: string) {
    try {
        const quotes = await QuotationService.getQuotationRequestsForTour(tourId);
        return { success: true, quotes };
    } catch (error: any) {
        console.error("Error in getQuotationRequestsForTourAction:", error);
        return { success: false, error: error.message || "Failed to fetch tour quotation requests." };
    }
}

export async function updateQuotationAction(id: string, updates: UpdateQuotationDTO) {
    try {
        const quote = await QuotationService.updateQuotation(id, updates);
        return { success: true, quote };
    } catch (error: any) {
        console.error("Error in updateQuotationAction:", error);
        return { success: false, error: error.message || "Failed to update quotation request." };
    }
}

export async function selectQuotationAction(quoteId: string, dailyActivityId: string) {
    try {
        const quote = await QuotationService.selectQuotation(quoteId, dailyActivityId);
        return { success: true, quote };
    } catch (error: any) {
        console.error("Error in selectQuotationAction:", error);
        return { success: false, error: error.message || "Failed to select quotation." };
    }
}

export async function createVendorBookingAction(dto: CreateVendorBookingDTO) {
    try {
        const booking = await VendorBookingService.createBookingRequest(dto);
        revalidatePath("/admin-new");
        return { success: true, booking };
    } catch (error: any) {
        console.error("Error in createVendorBookingAction:", error);
        return { success: false, error: error.message || "Failed to create booking." };
    }
}

export async function getVendorBookingsAction(tourId: string) {
    try {
        const bookings = await VendorBookingService.getBookingsForTour(tourId);
        return { success: true, bookings };
    } catch (error: any) {
        console.error("Error in getVendorBookingsAction:", error);
        return { success: false, error: error.message || "Failed to fetch bookings." };
    }
}

export async function updateVendorBookingStatusAction(dto: UpdateBookingStatusDTO) {
    try {
        const booking = await VendorBookingService.updateBookingStatus(dto);
        revalidatePath("/admin-new");
        return { success: true, booking };
    } catch (error: any) {
        console.error("Error in updateVendorBookingStatusAction:", error);
        return { success: false, error: error.message || "Failed to update booking status." };
    }
}

export async function confirmFinalVendorBookingAction(bookingId: string) {
    try {
        await VendorBookingService.confirmFinalVendor(bookingId);
        revalidatePath("/admin-new");
        return { success: true };
    } catch (error: any) {
        console.error("Error in confirmFinalVendorBookingAction:", error);
        return { success: false, error: error.message || "Failed to finalize booking." };
    }
}

export async function cancelVendorBookingAction(bookingId: string, reason?: string) {
    try {
        await VendorBookingService.cancelBooking(bookingId, reason);
        revalidatePath("/admin-new");
        return { success: true };
    } catch (error: any) {
        console.error("Error in cancelVendorBookingAction:", error);
        return { success: false, error: error.message || "Failed to cancel booking." };
    }
}

export async function getRfqEmailBodyAction(emailId: string) {
    try {
        const body = await VendorEmailHistoryService.getRfqEmailBody(emailId);
        return { success: true, body };
    } catch (error: any) {
        console.error("Error in getRfqEmailBodyAction:", error);
        return { success: false, error: error.message || "Failed to fetch RFQ email body." };
    }
}

export async function getRfpEmailBodyAction(emailId: string) {
    try {
        const body = await VendorEmailHistoryService.getRfpEmailBody(emailId);
        return { success: true, body };
    } catch (error: any) {
        console.error("Error in getRfpEmailBodyAction:", error);
        return { success: false, error: error.message || "Failed to fetch RFP email body." };
    }
}

export async function getDraftVersionsAction(tourId: string) {
    try {
        const versions = await ItineraryDraftService.getDraftVersions(tourId);
        return { success: true, versions };
    } catch (error: any) {
        console.error("Error in getDraftVersionsAction:", error);
        return { success: false, error: error.message || "Failed to fetch draft versions." };
    }
}

export async function saveDraftVersionAction(
    tourId: string,
    itineraryData: InternalItineraryBlock[],
    label: string | null,
    parentVersionId?: string | null,
    counts?: {
        adults: number;
        children: number;
        infants: number;
        single_rooms: number;
        double_rooms: number;
        triple_rooms: number;
        family_rooms: number;
    }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Not authenticated" };

        const version = await ItineraryDraftService.saveDraftVersion(
            tourId,
            itineraryData,
            label,
            user.id,
            parentVersionId || null,
            counts
        );
        return { success: true, version };
    } catch (error: any) {
        console.error("Error in saveDraftVersionAction:", error);
        return { success: false, error: error.stack || error.message || "Failed to save draft version." };
    }
}

export async function acquireItineraryLockAction(tourId: string, lockDurationMinutes: number = 5) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Not authenticated" };

        const lock = await ItineraryDraftService.acquireLock(tourId, user.id, lockDurationMinutes);
        if (!lock) {
            const activeLock = await ItineraryDraftService.checkLockStatus(tourId);
            let ownerName = "another planner";
            if (activeLock) {
                const adminSupabase = createAdminClient();
                const { data: profile } = await adminSupabase
                    .from('agent_profiles')
                    .select('first_name, last_name')
                    .eq('id', activeLock.locked_by)
                    .maybeSingle();
                if (profile) {
                    ownerName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || "another planner";
                }
            }
            return { success: true, acquired: false, message: `Itinerary is locked by ${ownerName}.` };
        }
        return { success: true, acquired: true, lock };
    } catch (error: any) {
        console.error("Error in acquireItineraryLockAction:", error);
        return { success: false, error: error.message || "Failed to acquire lock." };
    }
}

export async function refreshItineraryLockAction(tourId: string, lockDurationMinutes: number = 5) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Not authenticated" };

        const lock = await ItineraryDraftService.refreshLock(tourId, user.id, lockDurationMinutes);
        if (!lock) {
            return { success: true, refreshed: false, message: "Lock not found or owned by someone else." };
        }
        return { success: true, refreshed: true, lock };
    } catch (error: any) {
        console.error("Error in refreshItineraryLockAction:", error);
        return { success: false, error: error.message || "Failed to refresh lock." };
    }
}

export async function releaseItineraryLockAction(tourId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Not authenticated" };

        await ItineraryDraftService.releaseLock(tourId, user.id);
        return { success: true };
    } catch (error: any) {
        console.error("Error in releaseItineraryLockAction:", error);
        return { success: false, error: error.message || "Failed to release lock." };
    }
}

export async function checkItineraryLockStatusAction(tourId: string) {
    try {
        const lock = await ItineraryDraftService.checkLockStatus(tourId);
        if (lock) {
            const adminSupabase = createAdminClient();
            const { data: profile } = await adminSupabase
                .from('agent_profiles')
                .select('first_name, last_name')
                .eq('id', lock.locked_by)
                .maybeSingle();
            const ownerName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null;
            return { success: true, lock, ownerName };
        }
        return { success: true, lock: null };
    } catch (error: any) {
        console.error("Error in checkItineraryLockStatusAction:", error);
        return { success: false, error: error.message || "Failed to check lock status." };
    }
}

export async function getDraftVersionAction(versionId: string) {
    try {
        const version = await ItineraryDraftService.getDraftVersion(versionId);
        return { success: true, version };
    } catch (error: any) {
        console.error("Error in getDraftVersionAction:", error);
        return { success: false, error: error.message || "Failed to fetch draft version." };
    }
}

export async function logSharedEmailAction(
    tourId: string,
    recipientEmail: string,
    senderEmail: string,
    subject: string,
    bodyHtml: string,
    attachments: string[],
    type?: string
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const sentBy = user ? user.id : undefined;

        const logId = await TourSharedEmailService.logSharedEmail({
            tour_id: tourId,
            recipient_email: recipientEmail,
            sender_email: senderEmail,
            subject: subject,
            body_html: bodyHtml,
            attachments: attachments,
            sent_by: sentBy,
            type: type
        });

        return { success: true, logId };
    } catch (error: any) {
        console.error("Error in logSharedEmailAction:", error);
        return { success: false, error: error.message || "Failed to log shared email." };
    }
}

export async function getSharedEmailsAction(tourId: string) {
    try {
        const emails = await TourSharedEmailService.getSharedEmailsByTourId(tourId);
        return { success: true, emails };
    } catch (error: any) {
        console.error("Error in getSharedEmailsAction:", error);
        return { success: false, error: error.message || "Failed to fetch shared emails." };
    }
}

export async function getHotelRfqTemplateAction() {
    try {
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
            .from('email_templates')
            .select('*')
            .eq('name', 'Request For Quote')
            .maybeSingle();
        if (error) throw error;
        return { success: true, template: data };
    } catch (error: any) {
        console.error("Error fetching RFQ template:", error);
        return { success: false, error: error.message };
    }
}

export async function getRestaurantRfqTemplateAction() {
    try {
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
            .from('email_templates')
            .select('*')
            .eq('name', 'Request for Quote - Restaurant')
            .maybeSingle();
        if (error) throw error;
        return { success: true, template: data };
    } catch (error: any) {
        console.error("Error fetching Restaurant RFQ template:", error);
        return { success: false, error: error.message };
    }
}

export async function getTransportRfqTemplateAction(tourId: string) {
    try {
        const adminSupabase = createAdminClient();
        const [templateResult, tourResult] = await Promise.all([
            adminSupabase
                .from('email_templates')
                .select('*')
                .eq('name', 'Request for Quote - Transport')
                .maybeSingle(),
            adminSupabase
                .from('tours')
                .select('total_km')
                .eq('id', tourId)
                .maybeSingle()
        ]);
        if (templateResult.error) throw templateResult.error;
        if (tourResult.error) throw tourResult.error;
        return { 
            success: true, 
            template: templateResult.data, 
            total_km: tourResult.data?.total_km || 0 
        };
    } catch (error: any) {
        console.error("Error fetching Transport RFQ template and tour info:", error);
        return { success: false, error: error.message };
    }
}

export async function sendHotelRfqEmailAction(options: {
    to: string;
    from?: string;
    subject: string;
    body: string;
    pdfBase64?: string;
    pdfFilename?: string;
    quotationRequestId?: string;
}) {
    try {
        const { to, from, subject, body, pdfBase64, pdfFilename, quotationRequestId } = options;
        if (!to) {
            return { success: false, error: "Recipient email is required." };
        }
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            return { success: false, error: "Resend API key is not configured in .env.local" };
        }

        const isHtml = /<[a-z][\s\S]*>/i.test(body);
        const contentHtml = `
              <div style="font-size:15px;color:#4a4a4a;line-height:1.7;${isHtml ? '' : 'white-space:pre-wrap;'}">${body}</div>
              
              <p style="margin:32px 0 0;font-size:15px;color:#4a4a4a;line-height:1.7;">
                For any further assistance, please contact us at <a href="mailto:concierge@nilathra.com" style="color:#C9A84C;text-decoration:none;font-weight:600;">concierge@nilathra.com</a>.
              </p>
        `;
        const html = emailService.generateEmailHtml('Request for Quotation', 'Request for Quotation', contentHtml);
        const sender = from || process.env.EMAIL_FROM || 'concierge@nilathra.com';

        const attachments = [];
        if (pdfBase64 && pdfFilename) {
            attachments.push({
                filename: pdfFilename,
                content: pdfBase64
            });
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: sender,
                to: to,
                subject: subject,
                html: html,
                attachments
            })
        });

        const resJson = await res.json();
        if (!res.ok) {
            console.error("Resend email delivery failed:", resJson);
            return { success: false, error: resJson.message || "Failed to send email via Resend." };
        }

        if (quotationRequestId) {
            const adminSupabase = createAdminClient();
            await adminSupabase
                .from('quotation_request')
                .update({ status: 'Sent', updated_at: new Date().toISOString() })
                .eq('id', quotationRequestId);
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error in sendHotelRfqEmailAction:", error);
        return { success: false, error: error.message || "An unexpected error occurred." };
    }
}

export async function changeHotelDatabaseAction(
    tourId: string,
    stayIds: string[],
    newHotelId: string,
    selectedRooms: any[]
) {
    try {
        await TourService.updateChangedHotel(tourId, stayIds, newHotelId, selectedRooms);
        return { success: true };
    } catch (error: any) {
        console.error("Error in changeHotelDatabaseAction:", error);
        return { success: false, error: error.message || "Failed to update changed hotel details." };
    }
}

export async function changeRestaurantAction(
    tourId: string,
    mealActivityIds: string[],
    newRestaurantId: string
) {
    try {
        await TourService.updateChangedRestaurant(tourId, mealActivityIds, newRestaurantId);
        return { success: true };
    } catch (error: any) {
        console.error("Error in changeRestaurantAction:", error);
        return { success: false, error: error.message || "Failed to update restaurant assignment." };
    }
}

export async function changeVendorAction(
    tourId: string,
    activityIds: string[],
    newVendorId: string
) {
    try {
        await TourService.updateChangedVendor(tourId, activityIds, newVendorId);
        return { success: true };
    } catch (error: any) {
        console.error("Error in changeVendorAction:", error);
        return { success: false, error: error.message || "Failed to update vendor assignment." };
    }
}

export async function changeTransportProviderAction(
    tourId: string,
    travelActivityIds: string[],
    newProviderId: string
) {
    try {
        await TourService.updateChangedTransportProvider(tourId, travelActivityIds, newProviderId);
        return { success: true };
    } catch (error: any) {
        console.error("Error in changeTransportProviderAction:", error);
        return { success: false, error: error.message || "Failed to update transport provider assignment." };
    }
}


export async function logRfqEmailAction(
    tourId: string,
    vendorId: string | null,
    recipientEmail: string,
    senderEmail: string,
    subject: string,
    bodyHtml: string,
    attachments: any,
    quotationRequestId?: string,
    poBlockId?: string,
    vendorName?: string | null,
    vendorType?: string | null
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const sentBy = user ? user.id : undefined;

        const logId = await VendorEmailHistoryService.logRfqEmail({
            tour_id: tourId,
            vendor_id: vendorId || undefined,
            vendor_name: vendorName || undefined,
            vendor_type: vendorType || undefined,
            recipient_email: recipientEmail,
            sender_email: senderEmail,
            subject: subject,
            body_html: bodyHtml,
            attachments: attachments,
            sent_by: sentBy,
            daily_activity_vendor_id: quotationRequestId,
            po_block_id: poBlockId
        } as any);

        return { success: true, logId };
    } catch (error: any) {
        console.error("Error in logRfqEmailAction:", error);
        return { success: false, error: error.message || "Failed to log RFQ email." };
    }
}

export async function getRfqEmailsForTourAction(tourId: string) {
    try {
        const emails = await VendorEmailHistoryService.getRfqEmailsByTourId(tourId);
        return { success: true, emails };
    } catch (error: any) {
        console.error("Error in getRfqEmailsForTourAction:", error);
        return { success: false, error: error.message || "Failed to fetch RFQ emails." };
    }
}

export async function logRfpEmailAction(
    tourId: string,
    purchaseOrderId: string | null,
    recipientEmail: string,
    senderEmail: string,
    subject: string,
    bodyHtml: string,
    attachments: any,
    poBlockId?: string,
    vendorId?: string | null,
    vendorName?: string | null,
    vendorType?: string | null
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const sentBy = user ? user.id : undefined;

        const logId = await VendorEmailHistoryService.logRfpEmail({
            tour_id: tourId,
            purchase_order_id: purchaseOrderId || undefined,
            vendor_id: vendorId || undefined,
            vendor_name: vendorName || undefined,
            vendor_type: vendorType || undefined,
            recipient_email: recipientEmail,
            sender_email: senderEmail,
            subject: subject,
            body_html: bodyHtml,
            attachments: attachments,
            sent_by: sentBy,
            po_block_id: poBlockId
        } as any);

        return { success: true, logId };
    } catch (error: any) {
        console.error("Error in logRfpEmailAction:", error);
        return { success: false, error: error.message || "Failed to log RFP email." };
    }
}

export async function getRfpEmailsForTourAction(tourId: string) {
    try {
        const emails = await VendorEmailHistoryService.getRfpEmailsByTourId(tourId);
        return { success: true, emails };
    } catch (error: any) {
        console.error("Error in getRfpEmailsForTourAction:", error);
        return { success: false, error: error.message || "Failed to fetch RFP emails." };
    }
}

export async function updatePurchaseOrderAction(poId: string, updates: any) {
    try {
        await FinanceService.updatePurchaseOrderDetails(poId, updates);
        revalidatePath("/admin-new");
        return { success: true };
    } catch (error: any) {
        console.error("Error in updatePurchaseOrderAction:", error);
        return { success: false, error: error.message || "Failed to update PO details." };
    }
}

export async function previewCustomerInvoiceAction(tourId: string, options: any) {
    try {
        const items = await CustomerInvoiceService.previewInvoiceItems(tourId, options);
        return { success: true, items };
    } catch (error: any) {
        console.error("Error in previewCustomerInvoiceAction:", error);
        return { success: false, error: error.message || "Failed to preview customer invoice." };
    }
}

export async function generateCustomerInvoiceAction(dto: any) {
    try {
        const invoice = await CustomerInvoiceService.generateCustomerInvoice(dto);
        revalidatePath("/admin-new");
        return { success: true, invoice };
    } catch (error: any) {
        console.error("Error in generateCustomerInvoiceAction:", error);
        return { success: false, error: error.message || "Failed to generate customer invoice." };
    }
}

export async function getCustomerInvoicesAction(tourId: string) {
    try {
        const invoices = await CustomerInvoiceService.getCustomerInvoices(tourId);
        return { success: true, invoices };
    } catch (error: any) {
        console.error("Error in getCustomerInvoicesAction:", error);
        return { success: false, error: error.message || "Failed to retrieve customer invoices." };
    }
}

export async function deleteCustomerInvoiceAction(invoiceId: string) {
    try {
        await CustomerInvoiceService.deleteCustomerInvoice(invoiceId);
        revalidatePath("/admin-new");
        return { success: true };
    } catch (error: any) {
        console.error("Error in deleteCustomerInvoiceAction:", error);
        return { success: false, error: error.message || "Failed to delete customer invoice." };
    }
}

export async function registerCustomerPaymentAction(dto: any) {
    try {
        const payment = await CustomerInvoiceService.registerCustomerPayment(dto);
        revalidatePath("/admin-new");
        return { success: true, payment };
    } catch (error: any) {
        console.error("Error in registerCustomerPaymentAction:", error);
        return { success: false, error: error.message || "Failed to register customer payment." };
    }
}

export async function updateEmailProposalAction(
    id: string,
    isRfq: boolean,
    updates: {
        status?: string;
        quoted_price?: number | null;
        updated_at?: string | null;
        notes?: string | null;
        selected_vendor?: boolean;
    }
) {
    try {
        const clientSupabase = await createClient();
        const { data: { user } } = await clientSupabase.auth.getUser();
        if (!user) return { success: false, error: "Not authenticated" };

        const supabase = createAdminClient();
        const tableName = isRfq ? 'tour_rfq_emails' : 'tour_rfp_emails';

        // Always stamp updated_at when saving changes
        const payload = { ...updates, updated_at: new Date().toISOString() };

        // 1. Update the email record
        const { data: updated, error: updateErr } = await supabase
            .from(tableName)
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (updateErr) throw updateErr;

        // 2. If status was changed to Selected OR selected_vendor was set to true:
        if (updates.status === 'Selected' || updates.selected_vendor === true) {
            const poBlockId = updated.po_block_id;
            if (poBlockId) {
                // A. Reset selection on other RFQ/RFP emails for this PO Block
                const { error: resetErr } = await supabase
                    .from(tableName)
                    .update({ selected_vendor: false, status: 'Sent' })
                    .eq('po_block_id', poBlockId)
                    .neq('id', id);

                if (resetErr) throw resetErr;

                // B. Fetch PO block to check its block_type and find daily activity mappings
                const { data: block, error: blockErr } = await supabase
                    .from('po_blocks')
                    .select('*')
                    .eq('id', poBlockId)
                    .single();

                if (!blockErr && block) {
                    // Fetch mapped daily activities
                    const { data: mappings } = await supabase
                        .from('po_block_daily_activities')
                        .select('daily_activity_id')
                        .eq('po_block_id', poBlockId);

                    const activityIds = mappings?.map(m => m.daily_activity_id) || [];
                    if (activityIds.length > 0) {
                        const actUpdates: any = {};
                        if (block.block_type === 'sleep' || block.block_type === 'accommodation') {
                            actUpdates.hotel_id = updated.vendor_id;
                        } else if (block.block_type === 'meal') {
                            actUpdates.restaurant_id = updated.vendor_id;
                        } else if (block.block_type === 'travel') {
                            actUpdates.transport_id = updated.vendor_id;
                        } else if (block.block_type === 'activity') {
                            actUpdates.vendor_id = updated.vendor_id;
                        }

                        if (Object.keys(actUpdates).length > 0) {
                            const { error: actUpdateErr } = await supabase
                                .from('daily_activities')
                                .update(actUpdates)
                                .in('id', activityIds);

                            if (actUpdateErr) throw actUpdateErr;
                        }
                    }
                }
            }
        }

        revalidatePath("/admin-new");
        return { success: true, quote: updated };
    } catch (error: any) {
        console.error("Error in updateEmailProposalAction:", error);
        return { success: false, error: error.message || "Failed to update email proposal." };
    }
}




export async function deletePoBlockAction(blockId: string) {
    try {
        const clientSupabase = await createClient();
        const { data: { user } } = await clientSupabase.auth.getUser();
        if (!user) return { success: false, error: "Not authenticated" };

        await POBlockService.deleteBlockWithCascade(blockId);
        revalidatePath("/admin-new");
        return { success: true };
    } catch (error: any) {
        console.error("Error in deletePoBlockAction:", error);
        return { success: false, error: error.message || "Failed to delete block." };
    }
}
