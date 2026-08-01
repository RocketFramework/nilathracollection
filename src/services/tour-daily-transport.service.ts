import { createClient } from '@supabase/supabase-js';
import { TourDailyTransportDTO } from '../dtos/tour-daily-transport.dto';

const getSupabaseClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return createClient(supabaseUrl, supabaseAnonKey);
};

export class TourDailyTransportService {
    static async getDailyTransportsByTourId(tourId: string, client?: any): Promise<TourDailyTransportDTO[]> {
        const sb = client || getSupabaseClient();

        // 1. Fetch tour_itineraries to map tour_itinerary_id -> day_number
        const { data: itineraries, error: itinError } = await sb
            .from('tour_itineraries')
            .select('id, day_number')
            .eq('tour_id', tourId);

        if (itinError) {
            console.error('Error fetching tour_itineraries:', itinError);
        }

        const itinIdToDayMap: Record<string, number> = {};
        (itineraries || []).forEach((it: any) => {
            itinIdToDayMap[it.id] = Number(it.day_number);
        });

        // 2. Fetch transport assignments for this tour
        const { data, error } = await sb
            .from('tour_itinerary_transports')
            .select('id, tour_id, tour_itinerary_id, transport_provider_id, vehicle_id, created_at, updated_at')
            .eq('tour_id', tourId);

        if (error) {
            console.error('Error fetching tour_itinerary_transports:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            tour_id: row.tour_id,
            tour_itinerary_id: row.tour_itinerary_id,
            day_number: itinIdToDayMap[row.tour_itinerary_id] || 1,
            transport_provider_id: row.transport_provider_id || '',
            vehicle_id: row.vehicle_id || null,
            created_at: row.created_at,
            updated_at: row.updated_at
        }));
    }

    static async bulkUpsertDailyTransports(tourId: string, payloads: TourDailyTransportDTO[], client?: any): Promise<TourDailyTransportDTO[]> {
        const sb = client || getSupabaseClient();
        if (!payloads || payloads.length === 0) {
            await sb.from('tour_itinerary_transports').delete().eq('tour_id', tourId);
            return [];
        }

        // Fetch existing tour_itineraries for this tour
        const { data: itineraries, error: itinError } = await sb
            .from('tour_itineraries')
            .select('id, day_number')
            .eq('tour_id', tourId);

        if (itinError) {
            console.error('Error fetching tour_itineraries for bulk transport upsert:', itinError);
        }

        const dayToItinIdMap: Record<number, string> = {};
        (itineraries || []).forEach((it: any) => {
            dayToItinIdMap[Number(it.day_number)] = it.id;
        });

        const formattedPayloads: any[] = [];
        for (const p of payloads) {
            const dayNum = Number(p.day_number);
            let tourItinId = p.tour_itinerary_id || dayToItinIdMap[dayNum];

            if (!tourItinId) {
                const { data: newItin, error: createItinErr } = await sb
                    .from('tour_itineraries')
                    .insert([{
                        tour_id: tourId,
                        day_number: dayNum,
                        title: `Day ${dayNum}`
                    }])
                    .select('id')
                    .single();

                if (createItinErr || !newItin) {
                    console.error(`Failed to scaffold tour_itineraries for day ${dayNum}:`, createItinErr);
                    continue;
                }
                tourItinId = newItin.id;
                dayToItinIdMap[dayNum] = tourItinId;
            }

            formattedPayloads.push({
                tour_id: tourId,
                tour_itinerary_id: tourItinId,
                transport_provider_id: p.transport_provider_id || null,
                vehicle_id: p.vehicle_id || null,
                updated_at: new Date().toISOString()
            });
        }

        if (formattedPayloads.length === 0) return [];

        await sb.from('tour_itinerary_transports').delete().eq('tour_id', tourId);

        const { data: savedData, error: upsertErr } = await sb
            .from('tour_itinerary_transports')
            .insert(formattedPayloads)
            .select();

        if (upsertErr) {
            console.error('Error saving tour_itinerary_transports:', upsertErr);
            throw upsertErr;
        }

        return (savedData || []).map((row: any) => ({
            id: row.id,
            tour_id: row.tour_id,
            tour_itinerary_id: row.tour_itinerary_id,
            day_number: Number(Object.keys(dayToItinIdMap).find(k => dayToItinIdMap[Number(k)] === row.tour_itinerary_id) || 1),
            transport_provider_id: row.transport_provider_id || '',
            vehicle_id: row.vehicle_id || null,
            created_at: row.created_at,
            updated_at: row.updated_at
        }));
    }

    static async deleteDailyTransportAssignment(id: string, client?: any): Promise<boolean> {
        const sb = client || getSupabaseClient();
        const { error } = await sb
            .from('tour_itinerary_transports')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting tour_itinerary_transport:', error);
            return false;
        }
        return true;
    }
}
