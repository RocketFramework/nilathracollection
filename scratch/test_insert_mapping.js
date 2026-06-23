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
        console.error('Error reading .env.local', e);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Fetching a valid daily_activity, tour, itinerary, and quotation request...");
    const { data: act } = await supabase.from('daily_activities').select('id, tour_id, itinerary_id').limit(1).single();
    const { data: quote } = await supabase.from('quotation_request').select('id').limit(1).single();

    if (!act || !quote) {
        console.error("Could not find required records to test.");
        return;
    }

    console.log("Found activity:", act);
    console.log("Found quote ID:", quote.id);

    const mapping = {
        daily_activity_id: act.id,
        tour_id: act.tour_id,
        itinerary_id: act.itinerary_id,
        activity_type: 'hotel',
        quotation_request_id: quote.id
    };

    console.log("Inserting mapping row...");
    const { data: inserted, error } = await supabase
        .from('daily_activity_quotation_request')
        .insert([mapping])
        .select();

    if (error) {
        console.error("INSERT ERROR:", error);
    } else {
        console.log("INSERT SUCCESS:", JSON.stringify(inserted, null, 2));
    }
}

run();
