import { createClient } from '@supabase/supabase-js';
import { TourDailyVehicleDTO } from '../dtos/tour-daily-vehicle.dto';

const getSupabaseClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return createClient(supabaseUrl, supabaseAnonKey);
};

export class TourDailyVehicleService {
    static async getDailyVehiclesByTourId(tourId: string, client?: any): Promise<TourDailyVehicleDTO[]> {
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

        // 2. Fetch vehicle assignments for this tour
        const { data, error } = await sb
            .from('tour_itinerary_vehicles')
            .select('*')
            .eq('tour_id', tourId);

        if (error) {
            console.error('Error fetching tour_itinerary_vehicles:', error);
            return [];
        }

        return (data || []).map((row: any) => {
            const contractedRate = Number(row.contracted_per_day_rate ?? row.per_day_rate ?? 0);
            const contractedMileage = Number(row.contracted_excess_mileage_cost ?? row.excess_mileage_cost ?? 0);
            const contractedOther = Number(row.contracted_other_allowance ?? row.other_allowance ?? 0);

            const chargedRate = Number(row.charged_per_day_rate ?? contractedRate);
            const chargedMileage = Number(row.charged_excess_mileage_cost ?? contractedMileage);
            const chargedOther = Number(row.charged_other_allowance ?? contractedOther);

            return {
                id: row.id,
                tour_id: row.tour_id,
                tour_itinerary_id: row.tour_itinerary_id,
                day_number: itinIdToDayMap[row.tour_itinerary_id] || 1,
                vehicle_id: row.vehicle_id || '',

                per_day_rate: contractedRate,
                excess_mileage_cost: contractedMileage,
                other_allowance: contractedOther,

                contracted_per_day_rate: contractedRate,
                contracted_excess_mileage_cost: contractedMileage,
                contracted_other_allowance: contractedOther,

                charged_per_day_rate: chargedRate,
                charged_excess_mileage_cost: chargedMileage,
                charged_other_allowance: chargedOther,

                route_path: row.route_path || '',
                distance_km: Number(row.distance_km || 0),
                notes: row.notes || '',
                created_at: row.created_at,
                updated_at: row.updated_at
            };
        });
    }

    static async bulkUpsertDailyVehicles(tourId: string, payloads: TourDailyVehicleDTO[], client?: any, applyToAllDays?: boolean): Promise<TourDailyVehicleDTO[]> {
        const sb = client || getSupabaseClient();
        if (!payloads || payloads.length === 0) {
            await sb.from('tour_itinerary_vehicles').delete().eq('tour_id', tourId);
            return [];
        }

        // Fetch existing tour_itineraries for this tour
        const { data: itineraries, error: itinError } = await sb
            .from('tour_itineraries')
            .select('id, day_number')
            .eq('tour_id', tourId);

        if (itinError) {
            console.error('Error fetching tour_itineraries for bulk vehicle upsert:', itinError);
        }

        const dayToItinIdMap: Record<number, string> = {};
        (itineraries || []).forEach((it: any) => {
            dayToItinIdMap[Number(it.day_number)] = it.id;
        });

        const formattedPayloads: any[] = [];
        for (const p of payloads) {
            const contractedRate = Number(p.contracted_per_day_rate ?? p.per_day_rate ?? 0);
            const contractedMileage = Number(p.contracted_excess_mileage_cost ?? p.excess_mileage_cost ?? 0);
            const contractedOther = Number(p.contracted_other_allowance ?? p.other_allowance ?? 0);

            const chargedRate = Number(p.charged_per_day_rate ?? contractedRate);
            const chargedMileage = Number(p.charged_excess_mileage_cost ?? contractedMileage);
            const chargedOther = Number(p.charged_other_allowance ?? contractedOther);

            if (p.applyScope === 'all') {
                (itineraries || []).forEach((it: any) => {
                    formattedPayloads.push({
                        tour_id: tourId,
                        tour_itinerary_id: it.id,
                        vehicle_id: p.vehicle_id || null,

                        contracted_per_day_rate: contractedRate,
                        contracted_excess_mileage_cost: contractedMileage,
                        contracted_other_allowance: contractedOther,

                        charged_per_day_rate: chargedRate,
                        charged_excess_mileage_cost: chargedMileage,
                        charged_other_allowance: chargedOther,

                        route_path: p.route_path || null,
                        distance_km: p.distance_km || 0,
                        notes: p.notes || null,
                        updated_at: new Date().toISOString()
                    });
                });
            } else {
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
                    vehicle_id: p.vehicle_id || null,

                    contracted_per_day_rate: contractedRate,
                    contracted_excess_mileage_cost: contractedMileage,
                    contracted_other_allowance: contractedOther,

                    charged_per_day_rate: chargedRate,
                    charged_excess_mileage_cost: chargedMileage,
                    charged_other_allowance: chargedOther,

                    route_path: p.route_path || null,
                    distance_km: p.distance_km || 0,
                    notes: p.notes || null,
                    updated_at: new Date().toISOString()
                });
            }
        }

        if (formattedPayloads.length === 0) return [];

        await sb.from('tour_itinerary_vehicles').delete().eq('tour_id', tourId);

        // Deduplicate
        const uniquePayloadsMap: Record<string, any> = {};
        formattedPayloads.forEach(fp => {
            const key = `${fp.tour_itinerary_id}_${fp.vehicle_id}`;
            uniquePayloadsMap[key] = fp;
        });
        const deduplicatedPayloads = Object.values(uniquePayloadsMap);

        const { data: savedData, error: upsertErr } = await sb
            .from('tour_itinerary_vehicles')
            .insert(deduplicatedPayloads)
            .select();

        if (upsertErr) {
            console.error('Error saving tour_itinerary_vehicles:', upsertErr);
            throw upsertErr;
        }

        return (savedData || []).map((row: any) => {
            const contractedRate = Number(row.contracted_per_day_rate ?? row.per_day_rate ?? 0);
            const contractedMileage = Number(row.contracted_excess_mileage_cost ?? row.excess_mileage_cost ?? 0);
            const contractedOther = Number(row.contracted_other_allowance ?? row.other_allowance ?? 0);

            const chargedRate = Number(row.charged_per_day_rate ?? contractedRate);
            const chargedMileage = Number(row.charged_excess_mileage_cost ?? contractedMileage);
            const chargedOther = Number(row.charged_other_allowance ?? contractedOther);

            return {
                id: row.id,
                tour_id: row.tour_id,
                tour_itinerary_id: row.tour_itinerary_id,
                day_number: Number(Object.keys(dayToItinIdMap).find(k => dayToItinIdMap[Number(k)] === row.tour_itinerary_id) || 1),
                vehicle_id: row.vehicle_id || '',

                per_day_rate: contractedRate,
                excess_mileage_cost: contractedMileage,
                other_allowance: contractedOther,

                contracted_per_day_rate: contractedRate,
                contracted_excess_mileage_cost: contractedMileage,
                contracted_other_allowance: contractedOther,

                charged_per_day_rate: chargedRate,
                charged_excess_mileage_cost: chargedMileage,
                charged_other_allowance: chargedOther,

                route_path: row.route_path || '',
                distance_km: Number(row.distance_km || 0),
                notes: row.notes || '',
                created_at: row.created_at,
                updated_at: row.updated_at
            };
        });
    }

    static async deleteDailyVehicleAssignment(id: string, client?: any): Promise<boolean> {
        const sb = client || getSupabaseClient();
        const { error } = await sb
            .from('tour_itinerary_vehicles')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting tour_itinerary_vehicle:', error);
            return false;
        }
        return true;
    }
}
