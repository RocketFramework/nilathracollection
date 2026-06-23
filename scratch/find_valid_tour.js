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
    // Find daily_activities that have a non-null itinerary_id and trace to a tour
    const { data: acts, error } = await supabase
        .from('daily_activities')
        .select('id, tour_id, itinerary_id, tour_itineraries(tour_id)')
        .limit(20);
    
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Daily activities and their tour links:");
        acts.forEach(a => {
            console.log(`Act ID: ${a.id}, tour_id in act: ${a.tour_id}, Tour ID via itinerary: ${a.tour_itineraries?.tour_id}`);
        });
    }
}

run();
