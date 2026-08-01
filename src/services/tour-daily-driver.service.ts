import { createClient } from '@supabase/supabase-js';
import { TourDailyDriverDTO } from '../dtos/tour-daily-driver.dto';

const getSupabaseClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return createClient(supabaseUrl, supabaseAnonKey);
};

export class TourDailyDriverService {
    static async getDailyDriversByTourId(tourId: string, client?: any): Promise<TourDailyDriverDTO[]> {
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

        // 2. Fetch driver assignments for this tour
        const { data, error } = await sb
            .from('tour_itinerary_drivers')
            .select('*')
            .eq('tour_id', tourId);

        if (error) {
            console.error('Error fetching tour_itinerary_drivers:', error);
            return [];
        }

        return (data || []).map((row: any) => {
            const contractedRate = Number(row.contracted_per_day_rate ?? row.per_day_rate ?? 0);
            const contractedAcc = Number(row.contracted_accommodation_cost ?? row.accommodation_cost ?? 0);
            const contractedMeal = Number(row.contracted_meal_cost ?? row.meal_cost ?? 0);
            const contractedOther = Number(row.contracted_other_allowance ?? row.other_allowance ?? 0);

            const chargedRate = Number(row.charged_per_day_rate ?? contractedRate);
            const chargedAcc = Number(row.charged_accommodation_cost ?? contractedAcc);
            const chargedMeal = Number(row.charged_meal_cost ?? contractedMeal);
            const chargedOther = Number(row.charged_other_allowance ?? contractedOther);

            return {
                id: row.id,
                tour_id: row.tour_id,
                tour_itinerary_id: row.tour_itinerary_id,
                day_number: itinIdToDayMap[row.tour_itinerary_id] || 1,
                driver_id: row.driver_id || '',

                per_day_rate: contractedRate,
                accommodation_cost: contractedAcc,
                meal_cost: contractedMeal,
                other_allowance: contractedOther,

                contracted_per_day_rate: contractedRate,
                contracted_accommodation_cost: contractedAcc,
                contracted_meal_cost: contractedMeal,
                contracted_other_allowance: contractedOther,

                charged_per_day_rate: chargedRate,
                charged_accommodation_cost: chargedAcc,
                charged_meal_cost: chargedMeal,
                charged_other_allowance: chargedOther,

                notes: row.notes || '',
                created_at: row.created_at,
                updated_at: row.updated_at
            };
        });
    }

    static async upsertDailyDriverAssignment(payload: TourDailyDriverDTO, client?: any): Promise<TourDailyDriverDTO | null> {
        const sb = client || getSupabaseClient();
        const { data, error } = await sb
            .from('tour_itinerary_drivers')
            .upsert([payload], { onConflict: 'tour_itinerary_id' })
            .select()
            .single();

        if (error) {
            console.error('Error upserting tour_itinerary_driver:', error);
            throw error;
        }
        return data;
    }

    static async bulkUpsertDailyDrivers(tourId: string, payloads: TourDailyDriverDTO[], client?: any, applyToAllDays?: boolean): Promise<TourDailyDriverDTO[]> {
        const sb = client || getSupabaseClient();
        if (!payloads || payloads.length === 0) {
            await sb.from('tour_itinerary_drivers').delete().eq('tour_id', tourId);
            return [];
        }

        // 1. Fetch existing tour_itineraries for this tour
        const { data: itineraries, error: itinError } = await sb
            .from('tour_itineraries')
            .select('id, day_number')
            .eq('tour_id', tourId);

        if (itinError) {
            console.error('Error fetching tour_itineraries for bulk upsert:', itinError);
        }

        const dayToItinIdMap: Record<number, string> = {};
        (itineraries || []).forEach((it: any) => {
            dayToItinIdMap[Number(it.day_number)] = it.id;
        });

        // 2. Format payloads and handle replication per-item
        const formattedPayloads: any[] = [];
        for (const p of payloads) {
            const contractedRate = Number(p.contracted_per_day_rate ?? p.per_day_rate ?? 0);
            const contractedAcc = p.contracted_accommodation_cost ?? p.accommodation_cost ?? 0;
            const contractedMeal = p.contracted_meal_cost ?? p.meal_cost ?? 0;
            const contractedOther = p.contracted_other_allowance ?? p.other_allowance ?? 0;

            const chargedRate = p.charged_per_day_rate ?? contractedRate;
            const chargedAcc = p.charged_accommodation_cost ?? contractedAcc;
            const chargedMeal = p.charged_meal_cost ?? contractedMeal;
            const chargedOther = p.charged_other_allowance ?? contractedOther;

            if (p.applyScope === 'all') {
                // Replicate across all itineraries
                (itineraries || []).forEach((it: any) => {
                    formattedPayloads.push({
                        tour_id: tourId,
                        tour_itinerary_id: it.id,
                        driver_id: p.driver_id || null,

                        contracted_per_day_rate: contractedRate,
                        contracted_accommodation_cost: contractedAcc,
                        contracted_meal_cost: contractedMeal,
                        contracted_other_allowance: contractedOther,

                        charged_per_day_rate: chargedRate,
                        charged_accommodation_cost: chargedAcc,
                        charged_meal_cost: chargedMeal,
                        charged_other_allowance: chargedOther,

                        notes: p.notes || null,
                        updated_at: new Date().toISOString()
                    });
                });
            } else {
                // Single day assignment
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
                    driver_id: p.driver_id || null,

                    contracted_per_day_rate: contractedRate,
                    contracted_accommodation_cost: contractedAcc,
                    contracted_meal_cost: contractedMeal,
                    contracted_other_allowance: contractedOther,

                    charged_per_day_rate: chargedRate,
                    charged_accommodation_cost: chargedAcc,
                    charged_meal_cost: chargedMeal,
                    charged_other_allowance: chargedOther,

                    notes: p.notes || null,
                    updated_at: new Date().toISOString()
                });
            }
        }

        if (formattedPayloads.length === 0) return [];

        // 3. Delete and Insert driver assignments into tour_itinerary_drivers
        await sb.from('tour_itinerary_drivers').delete().eq('tour_id', tourId);

        // Deduplicate to avoid unique constraint violations
        const uniquePayloadsMap: Record<string, any> = {};
        formattedPayloads.forEach(fp => {
            const key = `${fp.tour_itinerary_id}_${fp.driver_id}`;
            uniquePayloadsMap[key] = fp;
        });
        const deduplicatedPayloads = Object.values(uniquePayloadsMap);

        const { data: savedData, error: upsertErr } = await sb
            .from('tour_itinerary_drivers')
            .insert(deduplicatedPayloads)
            .select();

        if (upsertErr) {
            console.error('Error upserting tour_itinerary_drivers:', upsertErr);
            throw upsertErr;
        }



        return (savedData || []).map((row: any) => {
            const contractedRate = Number(row.contracted_per_day_rate ?? row.per_day_rate ?? 0);
            const contractedAcc = Number(row.contracted_accommodation_cost ?? row.accommodation_cost ?? 0);
            const contractedMeal = Number(row.contracted_meal_cost ?? row.meal_cost ?? 0);
            const contractedOther = Number(row.contracted_other_allowance ?? row.other_allowance ?? 0);

            const chargedRate = Number(row.charged_per_day_rate ?? contractedRate);
            const chargedAcc = Number(row.charged_accommodation_cost ?? contractedAcc);
            const chargedMeal = Number(row.charged_meal_cost ?? contractedMeal);
            const chargedOther = Number(row.charged_other_allowance ?? contractedOther);

            return {
                id: row.id,
                tour_id: row.tour_id,
                tour_itinerary_id: row.tour_itinerary_id,
                day_number: Number(Object.keys(dayToItinIdMap).find(k => dayToItinIdMap[Number(k)] === row.tour_itinerary_id) || 1),
                driver_id: row.driver_id || '',

                per_day_rate: contractedRate,
                accommodation_cost: contractedAcc,
                meal_cost: contractedMeal,
                other_allowance: contractedOther,

                contracted_per_day_rate: contractedRate,
                contracted_accommodation_cost: contractedAcc,
                contracted_meal_cost: contractedMeal,
                contracted_other_allowance: contractedOther,

                charged_per_day_rate: chargedRate,
                charged_accommodation_cost: chargedAcc,
                charged_meal_cost: chargedMeal,
                charged_other_allowance: chargedOther,

                notes: row.notes || '',
                created_at: row.created_at,
                updated_at: row.updated_at
            };
        });
    }

    static async deleteDailyDriverAssignment(id: string, client?: any): Promise<boolean> {
        const sb = client || getSupabaseClient();
        const { error } = await sb
            .from('tour_itinerary_drivers')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting tour_itinerary_driver:', error);
            return false;
        }
        return true;
    }
}
