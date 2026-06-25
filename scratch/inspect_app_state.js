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
    const storageKey = `tour-wizard-state-${tourId}`;
    console.log(`Fetching app state for ${storageKey}...`);
    const { data, error } = await supabase
        .from('app_states')
        .select('*')
        .eq('state_key', storageKey)
        .maybeSingle();

    if (error) {
        console.error("Error:", error);
    } else if (data) {
        console.log("State key:", data.state_key);
        console.log("Created at:", data.created_at);
        const state = data.state || {};
        console.log("State keys:", Object.keys(state));
        if (state.itinerary) {
            console.log(`Itinerary blocks in app_states: ${state.itinerary.length}`);
            const customItins = state.itinerary.filter(b => b.isCustomPO);
            console.log(`Custom PO blocks in app_states itinerary: ${customItins.length}`);
            customItins.forEach(b => {
                console.log(`  Custom block: id=${b.id}, type=${b.type}, name="${b.name}", hotelId=${b.hotelId}`);
            });
        }
        if (state.dbActivities) {
            console.log(`dbActivities in app_states: ${state.dbActivities.length}`);
            const customActs = state.dbActivities.filter(a => a.isCustomPO || (a.hotel_id && a.activity_type !== 'sleep'));
            console.log(`Custom PO activities in app_states dbActivities: ${customActs.length}`);
            customActs.forEach(a => {
                console.log(`  Custom act: id=${a.id}, type=${a.activity_type}, title="${a.title}", hotel_id=${a.hotel_id}`);
            });
        }
    } else {
        console.log("No app state found in DB.");
    }
}

run();
