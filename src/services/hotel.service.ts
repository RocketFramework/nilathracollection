import { createClient as createSupabaseClient } from '@/utils/supabase/client';

const supabase = createSupabaseClient();

export interface HotelRoom {
    id?: string;
    hotel_id?: string;
    room_name: string;
    max_guests: number;
    breakfast_included: boolean;
    summer_start_date?: string;
    summer_end_date?: string;
    summer_bb_rate?: number;
    summer_hb_rate?: number;
    summer_fb_rate?: number;
    winter_start_date?: string;
    winter_end_date?: string;
    winter_bb_rate?: number;
    winter_hb_rate?: number;
    winter_fb_rate?: number;
    rate_received_date?: string;
    rate_years_applicable?: number;
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
    location?: string;
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
    rooms?: HotelRoom[];
    recreations?: HotelRecreation[];
}

export class HotelService {
    /**
     * Fetch all hotels
     */
    static async getHotels() {
        const { data, error } = await supabase
            .from('hotels')
            .select('*')
            .order('name');

        if (error) throw error;
        return data as Hotel[];
    }

    /**
     * Fetch a single hotel with its rooms and activities
     */
    static async getHotel(id: string) {
        // Fetch Hotel
        const { data: hotelData, error: hotelError } = await supabase
            .from('hotels')
            .select('*')
            .eq('id', id)
            .single();

        if (hotelError) throw hotelError;

        // Fetch Rooms
        const { data: roomsData, error: roomsError } = await supabase
            .from('hotel_rooms')
            .select('*')
            .eq('hotel_id', id);

        if (roomsError) throw roomsError;

        // Fetch Recreations
        const { data: recreationsData, error: recreationsError } = await supabase
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
        const mappedRecreations = recreationsData.map((ha: any) => ({
            id: ha.id,
            hotel_id: id,
            recreation_id: ha.recreation_id,
            additional_charge: ha.additional_charge,
            recreation_name: ha.recreations?.name
        }));

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
        const { rooms, recreations, id, ...hotelData } = hotel;

        const { data: newHotel, error: hotelError } = await supabase
            .from('hotels')
            .insert([hotelData])
            .select()
            .single();

        if (hotelError) throw hotelError;

        const hotelId = newHotel.id;

        // 2. Insert Rooms
        if (rooms && rooms.length > 0) {
            const roomsToInsert = rooms.map(r => ({ ...r, hotel_id: hotelId }));
            const { error: roomsError } = await supabase
                .from('hotel_rooms')
                .insert(roomsToInsert);

            if (roomsError) throw roomsError;
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

        const { rooms, recreations, id, ...hotelData } = hotel;
        const hotelId = id;

        // 1. Update Hotel record
        const { error: hotelError } = await supabase
            .from('hotels')
            .update(hotelData)
            .eq('id', hotelId);

        if (hotelError) throw hotelError;

        // 2. Sync Rooms (Delete existing, insert new for simplicity, or handle diffs)
        // Simplest approach for arrays: wipe and replace
        await supabase.from('hotel_rooms').delete().eq('hotel_id', hotelId);

        if (rooms && rooms.length > 0) {
            // Remove 'id' if present so we insert fresh UUIDs, or keep if UUID generation is handled
            const roomsToInsert = rooms.map(r => {
                const { id, ...roomRest } = r;
                return { ...roomRest, hotel_id: hotelId };
            });
            const { error: roomsError } = await supabase
                .from('hotel_rooms')
                .insert(roomsToInsert);

            if (roomsError) throw roomsError;
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
