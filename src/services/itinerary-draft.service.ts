import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '../utils/supabase/admin';
import { DraftItineraryVersion, ItineraryLock, InternalItineraryBlock } from '../other/interfaces';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class ItineraryDraftService {
    // 1. Get all draft versions for a tour
    static async getDraftVersions(tourId: string): Promise<DraftItineraryVersion[]> {
        const { data, error } = await supabase
            .from('draft_itinerary_versions')
            .select('*')
            .eq('tour_id', tourId)
            .order('version_number', { ascending: false });

        if (error) throw error;
        return data as DraftItineraryVersion[];
    }

    // 2. Save a new draft version
    static async saveDraftVersion(
        tourId: string,
        itineraryData: InternalItineraryBlock[],
        label: string | null,
        userId: string | null,
        parentVersionId: string | null = null
    ): Promise<DraftItineraryVersion> {
        const supabaseAdmin = createAdminClient();
        
        // Find latest version number
        const { data: latest, error: fetchError } = await supabaseAdmin
            .from('draft_itinerary_versions')
            .select('version_number')
            .eq('tour_id', tourId)
            .order('version_number', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (fetchError) throw fetchError;
        const nextVersion = latest ? latest.version_number + 1 : 1;

        const { data, error } = await supabaseAdmin
            .from('draft_itinerary_versions')
            .insert([{
                tour_id: tourId,
                version_number: nextVersion,
                label,
                itinerary_data: itineraryData,
                created_by: userId,
                parent_version_id: parentVersionId
            }])
            .select('*')
            .single();

        if (error) throw error;
        return data as DraftItineraryVersion;
    }

    // 3. Acquire a lock on an itinerary
    static async acquireLock(tourId: string, userId: string, lockDurationMinutes: number = 5): Promise<ItineraryLock | null> {
        const supabaseAdmin = createAdminClient();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + lockDurationMinutes * 60 * 1000);

        // Check if there is an active lock by someone else
        const { data: existingLock, error: checkError } = await supabaseAdmin
            .from('itinerary_locks')
            .select('*')
            .eq('tour_id', tourId)
            .maybeSingle();

        if (checkError) throw checkError;

        if (existingLock) {
            const isExpired = new Date(existingLock.expires_at).getTime() < now.getTime();
            const isOwnedBySelf = existingLock.locked_by === userId;

            if (!isExpired && !isOwnedBySelf) {
                // Active lock exists by someone else - cannot acquire
                return null;
            }

            // Lock is expired or owned by self - update it
            const { data, error } = await supabaseAdmin
                .from('itinerary_locks')
                .update({
                    locked_by: userId,
                    locked_at: now.toISOString(),
                    expires_at: expiresAt.toISOString()
                })
                .eq('tour_id', tourId)
                .select('*')
                .single();

            if (error) throw error;
            return data as ItineraryLock;
        }

        // No lock exists - insert a new one
        const { data, error } = await supabaseAdmin
            .from('itinerary_locks')
            .insert([{
                tour_id: tourId,
                locked_by: userId,
                locked_at: now.toISOString(),
                expires_at: expiresAt.toISOString()
            }])
            .select('*')
            .single();

        if (error) throw error;
        return data as ItineraryLock;
    }

    // 4. Refresh lock (Heartbeat)
    static async refreshLock(tourId: string, userId: string, lockDurationMinutes: number = 5): Promise<ItineraryLock | null> {
        const supabaseAdmin = createAdminClient();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + lockDurationMinutes * 60 * 1000);

        const { data, error } = await supabaseAdmin
            .from('itinerary_locks')
            .update({
                expires_at: expiresAt.toISOString()
            })
            .eq('tour_id', tourId)
            .eq('locked_by', userId)
            .select('*')
            .maybeSingle();

        if (error) throw error;
        return data as ItineraryLock | null;
    }

    // 5. Release a lock
    static async releaseLock(tourId: string, userId: string): Promise<boolean> {
        const supabaseAdmin = createAdminClient();
        const { error } = await supabaseAdmin
            .from('itinerary_locks')
            .delete()
            .eq('tour_id', tourId)
            .eq('locked_by', userId);

        if (error) throw error;
        return true;
    }

    // 6. Check active lock status
    static async checkLockStatus(tourId: string): Promise<ItineraryLock | null> {
        const { data, error } = await supabase
            .from('itinerary_locks')
            .select('*')
            .eq('tour_id', tourId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        const now = new Date();
        const isExpired = new Date(data.expires_at).getTime() < now.getTime();
        return isExpired ? null : (data as ItineraryLock);
    }
}
