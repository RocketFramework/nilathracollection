"use server";

import { revalidatePath } from "next/cache";
import { AdminService } from "@/services/user.service";
import { TourService } from "@/services/tour.service";
import { HotelService, Hotel } from "@/services/hotel.service";
import { MasterDataService, Restaurant, TransportProvider } from "@/services/master-data.service";
import { createAdminClient } from "@/utils/supabase/admin";
import { CreateUserDTO } from "@/dtos/user-vendor.dto";
import { FinanceService } from "@/services/finance.service";
import { EmailTemplateService, EmailTemplate } from "@/services/email-template.service";
import { CurrencyService } from "@/services/currency.service";
import { DBPurchaseOrder, DBPurchaseOrderItem, DBVendorInvoice, DBVendorPayment } from "@/app/admin/(authenticated)/planner/types";
import { createClient } from "@/utils/supabase/server";
import { RequestService } from "@/services/request.service";
import { emailService } from "@/services/email.service";
import { AIService } from "@/services/ai.service";
import { AIRule } from "@/types/ai";
import { CreateRequestDTO, UpdateRequestDTO } from '../dtos/request.dto';

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

export async function deleteHotelAction(id: string) {
    try {
        const adminSupabase = createAdminClient();
        await HotelService.deleteHotel(id, { client: adminSupabase });
        revalidatePath("/admin/master-data/hotels");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting hotel:", error);
        return { error: error.message || "Failed to delete hotel." };
    }
}
export async function getRestaurantsAction() {
    try {
        const supabase = createAdminClient();
        const { data: restaurants } = await MasterDataService.getRestaurants({ client: supabase });
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

export async function getVendorsAction() {
    try {
        const supabase = createAdminClient();
        const { data: vendors } = await MasterDataService.getVendors({ client: supabase });
        return { success: true, vendors };
    } catch (error: any) {
        console.error("Error fetching vendors:", error);
        return { error: error.message || "Failed to load vendors." };
    }
}

export async function getTransportProvidersAction() {
    try {
        const supabase = createAdminClient();
        const { data: providers } = await MasterDataService.getTransportProviders({ client: supabase });
        return { success: true, providers };
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
        revalidatePath('/admin/planner');
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

export async function getDriversAction() {
    try {
        const supabase = createAdminClient();
        const { data: drivers } = await MasterDataService.getDrivers({ client: supabase });
        return { success: true, drivers };
    } catch (error: any) {
        console.error("Error fetching drivers:", error);
        return { error: error.message || "Failed to load drivers." };
    }
}

export async function getTourGuidesAction() {
    try {
        const supabase = createAdminClient();
        const { data: guides } = await MasterDataService.getTourGuides({ client: supabase });
        return { success: true, guides };
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
                        await MasterDataService.saveVendor(proposed_data);
                        break;
                    case 'restaurant':
                        await MasterDataService.saveRestaurant(proposed_data);
                        break;
                    case 'transport':
                        await MasterDataService.saveTransportProvider(proposed_data);
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
        const templates = await EmailTemplateService.getTemplates();
        return { success: true, templates };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function saveEmailTemplateAction(template: EmailTemplate) {
    try {
        await EmailTemplateService.saveTemplate(template);
        revalidatePath("/admin/email-templates");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteEmailTemplateAction(id: string) {
    try {
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
