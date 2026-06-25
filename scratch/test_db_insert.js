const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function loadEnv() {
    try {
        const envContent = fs.readFileSync('.env.local', 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const parts = trimmed.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    let val = parts.slice(1).join('=').trim();
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.slice(1, -1);
                    }
                    env[key] = val;
                }
            }
        });
        return env;
    } catch (e) {
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const tourId = '60dec7e8-cbd9-4801-9f97-b41e5062fcc2';
    
    // Get an itinerary day header to link
    const { data: itins } = await supabase
        .from('tour_itineraries')
        .select('id')
        .eq('tour_id', tourId)
        .limit(1);
        
    if (!itins || itins.length === 0) {
        console.error("No itinerary header found");
        return;
    }
    
    const basePayload = {
        id: 'c2fb7a9c-ea9b-4b74-ab92-052cf84a9669', // Generate new UUID
        tour_id: tourId,
        itinerary_id: itins[0].id,
        title: 'Test Custom Spa Hotel Item',
        activity_type: 'activity',
        location_name: 'Hotel Spa',
        distance: null,
        description: 'Spa treatment',
        time_start: '10:00',
        time_end: '12:00',
        vendor_id: null,
        activity_id: null,
        vendor_activity_id: null,
        contracted_price: 150.00,
        charged_unit_price: 200.00,
        charged_total_price: 400.00,
        transport_id: null,
        vehicle_id: null,
        driver_id: null,
        guide_id: null,
        restaurant_id: null,
        hotel_id: '826eff6d-2e0e-40e2-ad4d-29c0b5246ba3', // Sigiriya Hotel
        driver_meal_included: false,
        driver_acc_included: false,
        guide_room_discount: null,
        parking_included: false,
        price_finalized: false,
        quantity: 2,
        contracted_total_price: 300.00,
        meal_plan: null
    };

    console.log("Inserting direct payload...");
    const { data, error } = await supabase
        .from('daily_activities')
        .insert([basePayload]);

    if (error) {
        console.error("Insert failed:", error);
    } else {
        console.log("Insert succeeded!");
        // Delete it after test
        await supabase.from('daily_activities').delete().eq('id', 'c2fb7a9c-ea9b-4b74-ab92-052cf84a9669');
    }
}

run();
