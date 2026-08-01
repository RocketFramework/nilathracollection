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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    // Let's use the active tour ID from the logs: 34cfc060-fd58-4c20-8b57-158feeb689d6
    const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';
    const { data: tour } = await supabase.from('tours').select('id').eq('id', tourId).single();
    if (!tour) {
        console.log('Tour 34cfc060-fd58-4c20-8b57-158feeb689d6 not found, fetching any tour');
        return;
    }

    const { data: itineraries } = await supabase.from('tour_itineraries').select('id, day_number').eq('tour_id', tour.id);
    console.log('Itineraries found:', itineraries?.length);

    const { data: provider } = await supabase.from('transport_providers').select('id').limit(1).single();
    const { data: vehicle } = await supabase.from('transport_vehicles').select('id').limit(1).single();

    // Mock payload: let's assign a transport provider and vehicle to day 1
    const payload = [{
        tour_id: tour.id,
        tour_itinerary_id: itineraries[0].id,
        transport_provider_id: provider?.id || null,
        vehicle_id: vehicle?.id || null
    }];

    console.log('Deleting existing for tour...', tour.id);
    const delRes = await supabase.from('tour_itinerary_transports').delete().eq('tour_id', tour.id);
    if (delRes.error) {
        console.error('Delete failed:', delRes.error);
        return;
    }

    console.log('Inserting payload:', payload);
    const insRes = await supabase.from('tour_itinerary_transports').insert(payload).select();
    if (insRes.error) {
        console.error('Insert failed:', insRes.error);
    } else {
        console.log('Insert Succeeded:', insRes.data);
    }
}

test();
