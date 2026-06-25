const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
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
    console.log("Tracing daily_activities for daily_activity_id in links...");
    const { data: links } = await supabase.from('daily_activity_vendor_links').select('daily_activity_id');
    const daIds = links.map(l => l.daily_activity_id).filter(Boolean);
    console.log("Link daily_activity_ids:", daIds);

    const { data: acts } = await supabase.from('daily_activities').select('id, tour_id, itinerary_id').in('id', daIds);
    console.log("Matching daily_activities:", acts);

    console.log("Tracing tour_itineraries for itinerary_id in links...");
    const { data: linksItin } = await supabase.from('daily_activity_vendor_links').select('itinerary_id');
    const itinIds = linksItin.map(l => l.itinerary_id).filter(Boolean);
    console.log("Link itinerary_ids:", itinIds);

    const { data: itins } = await supabase.from('tour_itineraries').select('id, tour_id').in('id', itinIds);
    console.log("Matching tour_itineraries:", itins);
}

run();
