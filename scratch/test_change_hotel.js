const { createClient } = require("@supabase/supabase-js");

const url = "https://vknibpdhovgcbenkcnaz.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8";

const supabase = createClient(url, key);

// Define parameters matching a Day 1 hotel change to Wallawwa
const tourId = "9bfb345a-da5d-443a-8644-90148b0b3a5a";
const stayIds = ["1096d375-3dbb-4b16-8ead-37c574dceee8"];
const newHotelId = "50158e09-33e4-45cf-b439-7fec960f50e2";
const selectedRooms = [
  {
    reqId: "Double",
    roomId: "09036a61-702a-4520-a6e4-76ddcd51da9b",
    mealPlan: "HB",
    quantity: 1,
    roomName: "Wallawwa Bedroom",
    roomStandard: "Standard",
    pricePerNight: 418.00000000000006,
    contractedPrice: 380
  }
];

async function run() {
    try {
        const supabaseAdmin = supabase;
        const selectedRoomIds = selectedRooms.map(r => r.roomId).filter(Boolean);

        const [
            newHotelResult,
            ratesResult,
            firstStayResult,
            markupResult,
            staysResult
        ] = await Promise.all([
            supabaseAdmin.from('hotels').select('name, location_address').eq('id', newHotelId).single(),
            selectedRoomIds.length > 0
                ? supabaseAdmin.from('room_rates').select('*').in('hotel_room_id', selectedRoomIds)
                : Promise.resolve({ data: [], error: null }),
            supabaseAdmin.from('daily_activities').select('hotel_id').in('id', stayIds).limit(1).single(),
            supabaseAdmin.from('app_settings').select('setting_value').eq('setting_key', 'room_markup').single(),
            supabaseAdmin.from('daily_activities').select('id, itinerary_id').in('id', stayIds)
        ]);

        if (newHotelResult.error) throw new Error("New hotel not found: " + newHotelResult.error.message);
        const newHotel = newHotelResult.data;
        const ratesData = ratesResult.data || [];
        const firstStay = firstStayResult.data;
        const markup = markupResult.data ? Number(markupResult.data.setting_value) || 10 : 10;
        const stays = staysResult.data || [];

        console.log("Stays fetched:", stays);

        const itinIds = stays.map(s => s.itinerary_id).filter(Boolean);
        const [oldHotelResult, itinerariesResult] = await Promise.all([
            firstStay?.hotel_id
                ? supabaseAdmin.from('hotels').select('name').eq('id', firstStay.hotel_id).single()
                : Promise.resolve({ data: null, error: null }),
            itinIds.length > 0
                ? supabaseAdmin.from('tour_itineraries').select('id, day_number, date').in('id', itinIds)
                : Promise.resolve({ data: [], error: null })
        ]);

        const oldHotelName = oldHotelResult.data?.name ?? "Originally planned hotel";
        const itineraries = itinerariesResult.data || [];

        const dayNumbers = [];
        let avgContractedPriceAcrossStays = 0;
        let avgChargedPriceAcrossStays = 0;
        let totalRoomsAcrossStays = 0;

        await Promise.all(stays.map(async (stay) => {
            const itin = itineraries.find(i => i.id === stay.itinerary_id);
            const stayDate = itin?.date || null;
            if (itin?.day_number) dayNumbers.push(Number(itin.day_number));

            let totalContracted = 0;
            let totalRooms = 0;

            const roomUpdatePayload = {
                hotel_id: newHotelId,
                location_name: newHotel.location_address || '',
                description: `${oldHotelName} changed due to ${newHotel.name} due to availability`,
                single_room_id: null,  single_room_count: null,
                double_room_id: null,  double_room_count: null,
                twin_room_id: null,    twin_room_count: null,
                triple_room_id: null,  triple_room_count: null,
                family_room_id: null,  family_room_count: null,
                meal_plan: selectedRooms[0]?.mealPlan || 'BB'
            };

            for (const room of selectedRooms) {
                const reqType = room.reqId;
                totalRooms += room.quantity;
                if (reqType === 'Single')      { roomUpdatePayload.single_room_id = room.roomId; roomUpdatePayload.single_room_count = room.quantity; }
                else if (reqType === 'Double') { roomUpdatePayload.double_room_id = room.roomId; roomUpdatePayload.double_room_count = room.quantity; }
                else if (reqType === 'Twin')   { roomUpdatePayload.twin_room_id   = room.roomId; roomUpdatePayload.twin_room_count   = room.quantity; }
                else if (reqType === 'Triple') { roomUpdatePayload.triple_room_id = room.roomId; roomUpdatePayload.triple_room_count = room.quantity; }
                else if (reqType === 'Family') { roomUpdatePayload.family_room_id = room.roomId; roomUpdatePayload.family_room_count = room.quantity; }

                totalContracted += room.contractedPrice * room.quantity;
            }

            const avgContracted = totalRooms > 0 ? totalContracted / totalRooms : 0;
            const chargedUnit = avgContracted * (1 + markup / 100);

            roomUpdatePayload.hotel_room_id = selectedRooms[0]?.roomId || null;
            roomUpdatePayload.quantity = totalRooms;
            roomUpdatePayload.contracted_price = avgContracted;
            roomUpdatePayload.contracted_total_price = totalContracted;
            roomUpdatePayload.charged_unit_price = chargedUnit;
            roomUpdatePayload.charged_total_price = chargedUnit * totalRooms;

            avgContractedPriceAcrossStays = avgContracted;
            avgChargedPriceAcrossStays = chargedUnit;
            totalRoomsAcrossStays = totalRooms;

            console.log("Updating daily activity ID:", stay.id, "with hotel_id:", newHotelId);
            const { error: daErr } = await supabaseAdmin.from('daily_activities').update(roomUpdatePayload).eq('id', stay.id);
            if (daErr) {
                console.error("Failed to update daily activity:", daErr);
            } else {
                console.log("Daily activity updated successfully!");
            }

            if (stay.itinerary_id) {
                console.log("Updating itinerary ID:", stay.itinerary_id, "with hotel_id:", newHotelId);
                const { error: itinErr } = await supabaseAdmin.from('tour_itineraries').update({ hotel_id: newHotelId }).eq('id', stay.itinerary_id);
                if (itinErr) console.error("Failed to update itinerary:", itinErr);
            }
        }));

        console.log("Completed simulated updates!");

    } catch (e) {
        console.error("Error running simulation:", e);
    }
}

run();
