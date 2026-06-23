const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

try {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const idx = trimmed.indexOf('=');
            if (idx !== -1) {
                const key = trimmed.substring(0, idx).trim();
                let value = trimmed.substring(idx + 1).trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length - 1);
                }
                process.env[key] = value;
            }
        });
    }
} catch (err) {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function run() {
    const tourId = '60dec7e8-cbd9-4801-9f97-b41e5062fcc2';
    
    // 1. Get a valid activity from daily_activities for this tour
    const { data: acts } = await supabase
        .from('daily_activities')
        .select('id, tour_id, itinerary_id, title, activity_type, hotel_id')
        .eq('tour_id', tourId)
        .limit(1);
    
    if (!acts || acts.length === 0) {
        console.error("No activities found for tour:", tourId);
        return;
    }
    const act = acts[0];
    console.log("Selected Activity:", act);

    // 2. Get a valid quotation request
    const { data: quote } = await supabase.from('quotation_request').select('id').limit(1).single();
    if (!quote) {
        console.error("No quotation request found.");
        return;
    }

    // 3. Clear any existing mappings for this tour first
    await supabase.from('daily_activity_quotation_request').delete().eq('tour_id', tourId);

    // 4. Insert mapping record
    const mapping = {
        daily_activity_id: act.id,
        tour_id: tourId,
        itinerary_id: act.itinerary_id,
        activity_type: 'hotel',
        quotation_request_id: quote.id
    };

    console.log("Inserting mapping record...");
    const { data: insertedMapping, error: insErr } = await supabase
        .from('daily_activity_quotation_request')
        .insert([mapping])
        .select();
    
    if (insErr) {
        console.error("Insert error:", insErr);
        return;
    }
    console.log("Inserted Mapping:", insertedMapping);

    // 5. Fetch tour details to get tripData (planner_data)
    const { data: tour } = await supabase.from('tours').select('planner_data').eq('id', tourId).single();
    const tripData = tour.planner_data;

    // Let's run the exact saveTour logic!
    console.log("\nRunning saveTour logic simulation...");

    // C.1 Fetch existing mappings
    const { data: existingMappings } = await supabase
        .from('daily_activity_quotation_request')
        .select('*')
        .eq('tour_id', tourId);
    console.log("Loaded existing mappings before delete:", existingMappings);

    // C.2 Delete daily_activities and tour_itineraries
    const { error: daDeleteErr } = await supabase.from('daily_activities').delete().eq('tour_id', tourId);
    if (daDeleteErr) console.error("Delete daily_activities error:", daDeleteErr);

    const { error: itinDeleteErr } = await supabase.from('tour_itineraries').delete().eq('tour_id', tourId);
    if (itinDeleteErr) console.error("Delete tour_itineraries error:", itinDeleteErr);

    // Verify they are deleted
    const { data: mappingsAfterDelete } = await supabase.from('daily_activity_quotation_request').select('*').eq('tour_id', tourId);
    console.log("Mappings count after delete (should be 0 due to CASCADE):", mappingsAfterDelete.length);

    // C.3 Re-insert itineraries and activities using tripData
    const blocks = tripData.itinerary || [];
    const blocksByDay = {};
    for (const block of blocks) {
        if (!blocksByDay[block.dayNumber]) blocksByDay[block.dayNumber] = [];
        blocksByDay[block.dayNumber].push(block);
    }
    const days = Object.keys(blocksByDay).map(Number).sort((a, b) => a - b);
    
    const allInsertedActivities = [];

    for (const day of days) {
        // Create itinerary
        const { data: dbItin, error: itinErr } = await supabase
            .from('tour_itineraries')
            .insert([{
                tour_id: tourId,
                day_number: day,
                title: `Day ${day}`
            }])
            .select('id')
            .single();
        
        if (itinErr) {
            console.error("Itin insert error:", itinErr);
            continue;
        }

        const dayBlocks = blocksByDay[day];
        const activitiesToInsert = [];
        for (const b of dayBlocks) {
            activitiesToInsert.push({
                id: b.id,
                tour_id: tourId,
                itinerary_id: dbItin.id,
                title: b.name,
                activity_type: b.type || null
            });
        }

        if (activitiesToInsert.length > 0) {
            const { error: actErr } = await supabase.from('daily_activities').insert(activitiesToInsert);
            if (actErr) {
                console.error("Activities insert error:", actErr);
            } else {
                allInsertedActivities.push(...activitiesToInsert);
            }
        }
    }

    console.log(`Re-inserted ${allInsertedActivities.length} daily activities.`);

    // C.4 Restore mappings
    if (existingMappings && existingMappings.length > 0) {
        const newItinIdMap = new Map();
        for (const act of allInsertedActivities) {
            if (act.id && act.itinerary_id) {
                newItinIdMap.set(act.id, act.itinerary_id);
            }
        }

        const mappingsToReinsert = existingMappings
            .map(m => {
                const newItinId = newItinIdMap.get(m.daily_activity_id);
                console.log(`Mapping old activity ${m.daily_activity_id} -> new itinerary ${newItinId}`);
                if (!newItinId) return null;
                return {
                    daily_activity_id: m.daily_activity_id,
                    tour_id: m.tour_id,
                    itinerary_id: newItinId,
                    activity_type: m.activity_type,
                    quotation_request_id: m.quotation_request_id
                };
            })
            .filter(Boolean);

        console.log("Mappings to reinsert:", mappingsToReinsert);

        if (mappingsToReinsert.length > 0) {
            const { data: reinserted, error: reinsertErr } = await supabase
                .from('daily_activity_quotation_request')
                .insert(mappingsToReinsert)
                .select();
            
            if (reinsertErr) {
                console.error("Reinsert error:", reinsertErr);
            } else {
                console.log("Reinsert success:", reinserted);
            }
        }
    }

    // Verify final mappings
    const { data: finalMappings } = await supabase.from('daily_activity_quotation_request').select('*').eq('tour_id', tourId);
    console.log("\nFinal mappings in database after save simulation:", finalMappings);
}

run();
