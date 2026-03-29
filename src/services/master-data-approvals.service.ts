import { createClient as createSupabaseClient } from '@/utils/supabase/client';
import { MasterDataService, Vendor, Restaurant, TransportProvider, Driver, TourGuide } from './master-data.service';
import { HotelService, Hotel } from './hotel.service';

export interface ApprovalRequest {
    id?: string;
    entity_type: 'hotel' | 'vendor' | 'restaurant' | 'transport' | 'driver' | 'guide';
    entity_id?: string | null;
    action: 'CREATE' | 'UPDATE';
    proposed_data: any;
    contact_details?: {
        name?: string;
        phone?: string;
        email?: string;
    } | null;
    proof_image_url?: string | null;
    requested_by?: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    created_at?: string;
    resolved_at?: string;
}

export class MasterDataApprovalsService {
    /**
     * Called by Agents to submit a change for Admin approval.
     */
    static async submitApproval(request: Omit<ApprovalRequest, 'id' | 'status' | 'created_at' | 'resolved_at'>) {
        // Must fetch the current user to attach as requested_by
        const supabase = createSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const payload = {
            ...request,
            requested_by: user.id,
            status: 'PENDING'
        };

        const { data, error } = await supabase
            .from('master_data_approvals')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        return data.id;
    }

    /**
     * Called by Admins to fetch all pending requests.
     */
    static async getPendingApprovals() {
        const supabase = createSupabaseClient();

        const { data, error } = await supabase
            .from('master_data_approvals')
            .select(`
                *,
                agent:agent_profiles!requested_by(first_name, last_name, phone)
            `)
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data; // Returns the rows mixed with agent details automatically if foreign key holds.
    }

    /**
     * Mark an approval as resolved (APPROVED or REJECTED)
     */
    static async resolveApproval(id: string, status: 'APPROVED' | 'REJECTED') {
        const supabase = createSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Mark as resolved
        const { error, data: approvalData } = await supabase
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
                        if ((proposed_data as Hotel).id) {
                            await HotelService.updateHotel(proposed_data as Hotel);
                        } else {
                            await HotelService.createHotel(proposed_data as Hotel);
                        }
                        break;
                    case 'vendor':
                        await MasterDataService.saveVendor(proposed_data as Vendor);
                        break;
                    case 'restaurant':
                        await MasterDataService.saveRestaurant(proposed_data as Restaurant);
                        break;
                    case 'transport':
                        await MasterDataService.saveTransportProvider(proposed_data as TransportProvider);
                        break;
                    case 'driver':
                        await MasterDataService.saveDriver(proposed_data as Driver);
                        break;
                    case 'guide':
                        await MasterDataService.saveTourGuide(proposed_data as TourGuide);
                        break;
                    default:
                        console.warn(`Unknown entity type for approval application: ${entity_type}`);
                }
            } catch (applyError) {
                console.error("Error applying approved data to entity table:", applyError);
                throw new Error("Approval status updated, but failed to apply changes to database.");
            }
        }

        return true;
    }

    /**
     * Upload an image to the payment-proofs bucket
     */
    static async uploadPaymentProofImage(file: File): Promise<string> {
        const supabase = createSupabaseClient();
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('payment-proofs')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('payment-proofs')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
}
