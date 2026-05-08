import { createClient as createSupabaseClient } from '@/utils/supabase/client';
import { PaymentDetails } from './master-data.service';

const supabase = createSupabaseClient();

export interface RoomRate {
    id?: string;
    hotel_room_id?: string;
    start_date?: string;
    end_date?: string;
    rate?: number;
    meal_plan_type?: string;
    breakfast_included?: boolean;
}

export interface HotelRoom {
    id?: string;
    hotel_id?: string;
    room_name: string;
    room_standard?: string;
    max_guests: number;
    room_rates?: RoomRate[];
}

export interface HotelRecreation {
    id?: string;
    hotel_id?: string;
    recreation_id: string;
    additional_charge: boolean;
    recreation_name?: string; // Loaded from joining recreations table
}

export interface Hotel {
    id?: string;
    name: string;
    location_address?: string;
    closest_city?: string;
    location_coordinates?: string;
    description?: string;
    sales_agent_name?: string;
    sales_agent_contact?: string;
    reservation_agent_name?: string;
    reservation_agent_contact?: string;
    gm_name?: string;
    gm_contact?: string;
    hotel_class?: string;
    number_of_rooms?: number;
    disable_support?: 'none' | 'some areas' | 'full access';
    outdoor_pool?: boolean;
    wellness?: boolean;
    business_facility?: boolean;
    parking?: boolean;
    internet?: boolean;
    airport_shuttle?: boolean;
    free_cancellation_weeks?: number;
    admin_approved?: boolean;
    vat_registered?: boolean;
    is_suspended?: boolean;
    child_free_until_age?: number;
    child_half_price_until_age?: number;
    child_half_price_percentage?: number;
    child_policy_notes?: string;
    payment_detail_id?: string;
    payment_details?: PaymentDetails;
    rooms?: HotelRoom[];
    recreations?: HotelRecreation[];
}

export class HotelService {
    /**
     * Fetch all hotels
     */
    static async getHotels(options?: {
        searchTerm?: string;
        page?: number;
        pageSize?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        client?: any;
    }) {
        const supabaseClient = options?.client || supabase;
        let query = supabaseClient.from('hotels').select('*, hotel_rooms(*), payment_details(*)', { count: 'exact' });

        if (options?.searchTerm) {
            query = query.or(`name.ilike.%${options.searchTerm}%,location_address.ilike.%${options.searchTerm}%,closest_city.ilike.%${options.searchTerm}%`);
        }

        if (options?.sortBy) {
            query = query.order(options.sortBy, { ascending: options.sortOrder !== 'desc' });
        } else {
            query = query.order('name');
        }

        if (options?.page !== undefined && options?.pageSize !== undefined) {
            const from = options.page * options.pageSize;
            const to = from + options.pageSize - 1;
            query = query.range(from, to);
        }

        const { data, error, count } = await query;
        if (error) throw error;
        
        const hotels = data as any[];
        // Explicitly fetch room_rates to avoid schema cache join issues
        const allRoomIds = hotels.flatMap(h => (h.hotel_rooms || []).map((r: any) => r.id)).filter(Boolean);
        if (allRoomIds.length > 0) {
            const { data: ratesData, error: ratesError } = await supabaseClient
                .from('room_rates')
                .select('*')
                .in('hotel_room_id', allRoomIds);
                
            if (!ratesError && ratesData) {
                hotels.forEach(h => {
                    if (h.hotel_rooms) {
                        h.hotel_rooms.forEach((r: any) => {
                            r.room_rates = ratesData.filter((rate: any) => rate.hotel_room_id === r.id);
                        });
                    }
                });
            }
        }

        return { data: hotels as Hotel[], count: count || 0 };
    }

    /**
     * Fetch a single hotel with its rooms and activities
     */
    static async getHotel(id: string, options?: { client?: any }) {
        const supabaseClient = options?.client || supabase;
        // Fetch Hotel
        const { data: hotelData, error: hotelError } = await supabaseClient
            .from('hotels')
            .select('*, payment_details(*)')
            .eq('id', id)
            .single();

        if (hotelError) throw hotelError;

        // Fetch Rooms
        const { data: roomsData, error: roomsError } = await supabaseClient
            .from('hotel_rooms')
            .select('*')
            .eq('hotel_id', id);

        if (roomsError) throw roomsError;

        // Fetch Rates explicitly
        if (roomsData && roomsData.length > 0) {
            const roomIds = roomsData.map((r: any) => r.id).filter(Boolean);
            if (roomIds.length > 0) {
                const { data: ratesData } = await supabaseClient
                    .from('room_rates')
                    .select('*')
                    .in('hotel_room_id', roomIds);
                    
                if (ratesData) {
                    roomsData.forEach((r: any) => {
                        r.room_rates = ratesData.filter((rate: any) => rate.hotel_room_id === r.id);
                    });
                }
            }
        }

        // Fetch Recreations
        const { data: recreationsData, error: recreationsError } = await supabaseClient
            .from('hotel_recreations')
            .select(`
                id,
                recreation_id,
                additional_charge,
                recreations (
                    name
                )
            `)
            .eq('hotel_id', id);

        if (recreationsError) throw recreationsError;

        // Map recreations to include name smoothly
        const mappedRecreations = (recreationsData as unknown as Array<{
            id: string;
            recreation_id: string;
            additional_charge: boolean;
            recreations: { name: string } | Array<{ name: string }> | null;
        }>).map((ha) => {
            const recName = Array.isArray(ha.recreations)
                ? ha.recreations[0]?.name
                : ha.recreations?.name;
            return {
                id: ha.id,
                hotel_id: id,
                recreation_id: ha.recreation_id,
                additional_charge: ha.additional_charge,
                recreation_name: recName
            };
        });

        return {
            ...hotelData,
            rooms: roomsData || [],
            recreations: mappedRecreations || []
        } as Hotel;
    }

    /**
     * Fetch master list of recreations
     */
    static async getMasterRecreations() {
        const { data, error } = await supabase
            .from('recreations')
            .select('*')
            .order('name');

        if (error) throw error;
        return data;
    }

    /**
     * Create a new hotel with its rooms and recreations
     */
    static async createHotel(hotel: Hotel) {
        // 1. Insert Hotel
        const { rooms, recreations, id: _, payment_details, payment_detail_id, ...hotelData } = hotel;

        // Handle Payment Details
        let activePaymentId = payment_detail_id;
        if (payment_details && (payment_details.bank_name || payment_details.account_number)) {
            const { data: pdData, error: pdError } = await supabase.from('payment_details').insert([payment_details]).select().single();
            if (pdError) throw pdError;
            activePaymentId = pdData.id;
        }

        const payload = { ...hotelData, payment_detail_id: activePaymentId };

        const { data: newHotel, error: hotelError } = await supabase
            .from('hotels')
            .insert([payload])
            .select()
            .single();

        if (hotelError) throw hotelError;

        const hotelId = newHotel.id;

        // 2. Insert Rooms and Rates
        if (rooms && rooms.length > 0) {
            for (const r of rooms) {
                const { room_rates, id: _rid, ...roomData } = r;
                const { data: newRoom, error: roomError } = await supabase
                    .from('hotel_rooms')
                    .insert([{ ...roomData, hotel_id: hotelId }])
                    .select()
                    .single();

                if (roomError) throw roomError;

                if (room_rates && room_rates.length > 0) {
                    const ratesToInsert = room_rates.map(rate => {
                        const { id: _rateId, ...rateData } = rate;
                        return { ...rateData, hotel_room_id: newRoom.id };
                    });
                    const { error: ratesError } = await supabase
                        .from('room_rates')
                        .insert(ratesToInsert);
                    if (ratesError) throw ratesError;
                }
            }
        }

        // 3. Insert Recreations
        if (recreations && recreations.length > 0) {
            const recsToInsert = recreations.map(r => ({
                hotel_id: hotelId,
                recreation_id: r.recreation_id,
                additional_charge: r.additional_charge
            }));
            const { error: recsError } = await supabase
                .from('hotel_recreations')
                .insert(recsToInsert);

            if (recsError) throw recsError;
        }

        return newHotel;
    }

    /**
     * Update an existing hotel (fully syncs rooms and recreations)
     */
    static async updateHotel(hotel: Hotel) {
        if (!hotel.id) throw new Error("Hotel ID is required for update");

        const { rooms, recreations, id: _, payment_details, payment_detail_id, ...hotelData } = hotel;
        const hotelId = hotel.id as string;

        // Handle Payment Details
        let activePaymentId = payment_detail_id;
        if (payment_details && (payment_details.bank_name || payment_details.account_number)) {
            if (payment_details.id) {
                const { error: pdError } = await supabase.from('payment_details').update(payment_details).eq('id', payment_details.id);
                if (pdError) throw pdError;
            } else {
                const { data: pdData, error: pdError } = await supabase.from('payment_details').insert([payment_details]).select().single();
                if (pdError) throw pdError;
                activePaymentId = pdData.id;
            }
        }

        const payload = { ...hotelData, payment_detail_id: activePaymentId };

        // 1. Update Hotel record
        const { error: hotelError } = await supabase
            .from('hotels')
            .update(payload)
            .eq('id', hotelId);

        if (hotelError) throw hotelError;

        // 2. Sync Rooms
        // We will delete existing rooms. Because room_rates has ON DELETE CASCADE, they will be deleted too.
        await supabase.from('hotel_rooms').delete().eq('hotel_id', hotelId);

        if (rooms && rooms.length > 0) {
            for (const r of rooms) {
                const { room_rates, id: _rid, ...roomData } = r;
                // If there's an existing id and we wanted to preserve it to avoid breaking foreign keys in itinerary, we should do upsert instead.
                // But the current logic wipes rooms, so we will keep the wiping logic for now, but supply the old ID if it exists so references don't break!
                const roomPayload = _rid ? { ...roomData, hotel_id: hotelId, id: _rid } : { ...roomData, hotel_id: hotelId };

                const { data: newRoom, error: roomError } = await supabase
                    .from('hotel_rooms')
                    .insert([roomPayload])
                    .select()
                    .single();

                if (roomError) throw roomError;

                if (room_rates && room_rates.length > 0) {
                    const ratesToInsert = room_rates.map(rate => {
                        const { id: _rateId, ...rateData } = rate;
                        // Always create fresh rates since we cascaded delete
                        return { ...rateData, hotel_room_id: newRoom.id };
                    });
                    const { error: ratesError } = await supabase
                        .from('room_rates')
                        .insert(ratesToInsert);
                    if (ratesError) throw ratesError;
                }
            }
        }

        // 3. Sync Recreations
        await supabase.from('hotel_recreations').delete().eq('hotel_id', hotelId);

        if (recreations && recreations.length > 0) {
            const recsToInsert = recreations.map(r => ({
                hotel_id: hotelId,
                recreation_id: r.recreation_id,
                additional_charge: r.additional_charge
            }));
            const { error: recsError } = await supabase
                .from('hotel_recreations')
                .insert(recsToInsert);

            if (recsError) throw recsError;
        }

        return hotel;
    }

    /**
     * Delete a hotel
     */
    static async deleteHotel(id: string) {
        const { error } = await supabase
            .from('hotels')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
}
