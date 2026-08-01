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

async function test() {
    // Let's fetch one tour and one tour_itinerary to use
    const { data: tour } = await supabase.from('tours').select('id').limit(1).single();
    if (!tour) {
        console.log('No tours found to test');
        return;
    }
    const { data: itin } = await supabase.from('tour_itineraries').select('id').eq('tour_id', tour.id).limit(1).single();
    if (!itin) {
        console.log('No itineraries found for tour', tour.id);
        return;
    }
    const { data: provider } = await supabase.from('transport_providers').select('id').limit(1).single();
    const { data: vehicle } = await supabase.from('transport_vehicles').select('id').limit(1).single();

    console.log('Inserting with tour_id:', tour.id, 'itin_id:', itin.id);
    const { data, error } = await supabase
        .from('tour_itinerary_transports')
        .insert([{
            tour_id: tour.id,
            tour_itinerary_id: itin.id,
            transport_provider_id: provider ? provider.id : null,
            vehicle_id: vehicle ? vehicle.id : null
        }])
        .select();

    if (error) {
        console.error('Insert Failed:', error);
    } else {
        console.log('Insert Succeeded:', data);
    }
}

test();
