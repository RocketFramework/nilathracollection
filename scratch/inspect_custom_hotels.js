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
    console.log(`Fetching activities for tour ${tourId}...`);
    const { data: acts, error } = await supabase
        .from('daily_activities')
        .select('*')
        .eq('tour_id', tourId);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Found ${acts.length} activities:`);
        acts.forEach(act => {
            console.log(`  Act: id=${act.id}, type=${act.activity_type}, title="${act.title}", hotel_id=${act.hotel_id}, quantity=${act.quantity}, price=${act.charged_unit_price}`);
        });
    }
}

run();
