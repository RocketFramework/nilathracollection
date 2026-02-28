import { createClient } from '@supabase/supabase-js';
import { RatingDTO, SuspensionRecommendationDTO } from '../dtos/user-vendor.dto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class RatingService {
    static async submitRating(dto: RatingDTO, agentId: string) {
        const { data, error } = await supabase
            .from('vendor_ratings')
            .insert({
                ...dto,
                agent_id: agentId
            })
            .select()
            .single();

        if (error) throw error;

        // Ideally, a database trigger or another service call would calculate the average here
        return data;
    }
}

export class SuspensionService {
    static async recommendSuspension(dto: SuspensionRecommendationDTO, agentId: string) {
        const { data, error } = await supabase
            .from('suspension_recommendations')
            .insert({
                ...dto,
                agent_id: agentId,
                status: 'Pending'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async approveSuspension(recommendationId: string, adminId: string) {
        // Logic for admin approving a recommendation and suspending the actual vendor
        // Typically requires a function or stored proc to ensure atomicity, but basically:
        const { data: rec, error: recError } = await supabase
            .from('suspension_recommendations')
            .update({ status: 'Approved', reviewed_by: adminId })
            .eq('id', recommendationId)
            .select()
            .single();
        if (recError) throw recError;

        let tableName = '';
        switch (rec.vendor_type) {
            case 'hotel': tableName = 'hotels'; break;
            case 'activity_vendor': tableName = 'activity_vendors'; break;
            case 'transport_provider': tableName = 'transport_providers'; break;
            case 'driver': tableName = 'drivers'; break;
            case 'guide': tableName = 'tour_guides'; break;
        }

        const { error: suspendErr } = await supabase
            .from(tableName)
            .update({ is_suspended: true })
            .eq('id', rec.entity_id);

        if (suspendErr) throw suspendErr;

        return rec;
    }
}
