const { createClient } = require("@supabase/supabase-js");

const url = "https://vknibpdhovgcbenkcnaz.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8";

const supabase = createClient(url, key);

// Import the saveTour method logic or define it locally
const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

async function run() {
    const tourId = "9bfb345a-da5d-443a-8644-90148b0b3a5a";
    
    // Fetch planner_data from tours
    const { data: tourMsg, error: tourErr } = await supabase
        .from('tours')
        .select('*')
        .eq('id', tourId)
        .single();

    if (tourErr) {
        console.error("Error fetching tour:", tourErr);
        return;
    }

    const tripData = tourMsg.planner_data;
    if (!tripData) {
        console.error("No planner data found");
        return;
    }

    console.log("Loaded tripData itinerary length:", tripData.itinerary?.length);

    // Now, let's simulate what TourService.saveTour does
    try {
        const supabaseAdmin = supabase;
        const { data: existingItins } = await supabaseAdmin
            .from('tour_itineraries')
            .select('id, day_number')
            .eq('tour_id', tourId);

        const { data: tourBlocks } = await supabaseAdmin
            .from('po_blocks')
            .select('id')
            .eq('tour_id', tourId);
        
        const tourBlockIds = tourBlocks?.map(b => b.id) || [];
        let existingPOBlockMappings = [];
        if (tourBlockIds.length > 0) {
            const { data: mappingsData } = await supabaseAdmin
                .from('po_block_daily_activities')
                .select('po_block_id, daily_activity_id')
                .in('po_block_id', tourBlockIds);
            existingPOBlockMappings = mappingsData || [];
        }

        const allInsertedActivities = [];
        const { data: dbActivities } = await supabaseAdmin.from('activities').select('id, activity_name');

        const { data: rawSettings } = await supabaseAdmin.from('app_settings').select('setting_key, setting_value');
        const settingsMap = {};
        if (rawSettings) {
            rawSettings.forEach(s => settingsMap[s.setting_key] = Number(s.setting_value) || 0);
        }
        const roomMarkup = settingsMap['room_markup'] || 10;
        
        const blocks = tripData.itinerary || [];
        const blocksByDay = {};
        for (const block of blocks) {
            if (!blocksByDay[block.dayNumber]) blocksByDay[block.dayNumber] = [];
            blocksByDay[block.dayNumber].push(block);
        }

        const days = Object.keys(blocksByDay).map(Number).sort((a, b) => a - b);
        let grandTotalCost = 0;
        const allActivitiesToUpsert = [];

        for (const day of days) {
            let dayDate = null;
            if (tripData.profile?.arrivalDate) {
                const dateObj = new Date(tripData.profile.arrivalDate);
                dateObj.setDate(dateObj.getDate() + (day - 1));
                dayDate = dateObj.toISOString().split('T')[0];
            }

            const matchingHotel = tripData.accommodations?.find(h => h.nightIndex === day);
            let dbHotelId = (matchingHotel?.hotelId && isUuid(matchingHotel.hotelId)) ? matchingHotel.hotelId : null;

            const existingItin = existingItins?.find(i => i.day_number === day);
            let dbItin = null;
            let itinErr = null;

            if (existingItin) {
                const { data, error } = await supabaseAdmin
                    .from('tour_itineraries')
                    .update({
                        date: dayDate,
                        title: `Day ${day}`,
                        hotel_id: dbHotelId
                    })
                    .eq('id', existingItin.id)
                    .select('id')
                    .single();
                dbItin = data;
                itinErr = error;
            } else {
                const { data, error } = await supabaseAdmin
                    .from('tour_itineraries')
                    .insert([{
                        tour_id: tourId,
                        day_number: day,
                        date: dayDate,
                        title: `Day ${day}`,
                        hotel_id: dbHotelId
                    }])
                    .select('id')
                    .single();
                dbItin = data;
                itinErr = error;
            }

            if (!dbItin) {
                console.error("Failed to map day", day, itinErr);
                return;
            }

            const dayBlocks = blocksByDay[day];
            const activitiesToInsert = [];

            for (const b of dayBlocks) {
                let vendorId = b.vendorId || null;
                let activityId = b.activityId !== undefined && b.activityId !== null ? Number(b.activityId) : null;
                
                let basePayload = {
                    id: b.id,
                    tour_id: tourId,
                    itinerary_id: dbItin.id,
                    service_date: dayDate || null,
                    title: b.name,
                    activity_type: b.type || null,
                    location_name: b.locationName || null,
                    distance: (b.distance !== undefined && b.distance !== null && b.distance !== '') ? String(b.distance) : null,
                    description: b.comments && b.comments.length > 0 ? JSON.stringify(b.comments) : (b.internalNotes || ''),
                    time_start: b.startTime || null,
                    time_end: b.endTime || null,
                    vendor_id: vendorId,
                    activity_id: activityId,
                    contracted_price: b.contractedPrice || 0,
                    charged_unit_price: b.agreedPrice || 0,
                    charged_total_price: (b.agreedPrice || 0) * (b.quantity || 1),
                    hotel_id: (b.hotelId && isUuid(b.hotelId)) ? b.hotelId : null,
                    adults: tripData.profile?.adults ?? 0,
                    children: tripData.profile?.children ?? 0,
                    infants: tripData.profile?.infants ?? 0,
                };

                activitiesToInsert.push(basePayload);
            }

            for (const act of activitiesToInsert) {
                if (act.charged_total_price) {
                    grandTotalCost += act.charged_total_price;
                }
                allActivitiesToUpsert.push(act);
                allInsertedActivities.push(act);
            }
        }

        console.log(`Prepared ${allActivitiesToUpsert.length} activities to upsert.`);

        // Upsert
        const { error: upsertErr } = await supabaseAdmin
            .from('daily_activities')
            .upsert(allActivitiesToUpsert);

        if (upsertErr) {
            console.error("Upsert failed with error:", upsertErr);
        } else {
            console.log("Upsert completed successfully!");
        }

    } catch (e) {
        console.error("Caught exception:", e);
    }
}

run();
