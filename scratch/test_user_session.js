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
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Let's create an anon client and see if we can read/write tour_itinerary_transports
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    console.log('Testing select on tour_itinerary_transports with anon key...');
    const { data: selectData, error: selectError } = await supabase
        .from('tour_itinerary_transports')
        .select('*')
        .limit(1);

    if (selectError) {
        console.error('Select Failed:', selectError);
    } else {
        console.log('Select Succeeded, data:', selectData);
    }

    console.log('Testing insert on tour_itinerary_transports with anon key...');
    const { data: insertData, error: insertError } = await supabase
        .from('tour_itinerary_transports')
        .insert([{
            tour_id: '34cfc060-fd58-4c20-8b57-158feeb689d6',
            tour_itinerary_id: '6f6b04db-1450-43eb-88c0-fcafaff7403b',
            transport_provider_id: 'a8f7ef93-94f4-4c77-93c6-ef9783154ae9',
            vehicle_id: '54511e1e-1848-42a4-9a73-2638bc3994f9'
        }]);

    if (insertError) {
        console.error('Insert Failed:', insertError);
    } else {
        console.log('Insert Succeeded, data:', insertData);
    }
}

test();
