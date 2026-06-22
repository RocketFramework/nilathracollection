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

const TOUR_ID = '60dec7e8-cbd9-4801-9f97-b41e5062fcc2';

async function check() {
    console.log("---- daily_activities for current tour ----");
    const { data: acts, error: errActs } = await supabase.from('daily_activities').select('*').eq('tour_id', TOUR_ID);
    if (errActs) console.error(errActs);
    else {
        console.log(`Count: ${acts.length}`);
        console.log(acts.map(a => ({ id: a.id, tour_id: a.tour_id, activity_type: a.activity_type, hotel_id: a.hotel_id, hotel_room_id: a.hotel_room_id })));
    }
}

check();
