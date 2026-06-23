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
    const tourId = '60dec7e8-cbd9-4801-9f97-b41e5062fcc2';
    const { data: tour } = await supabase.from('tours').select('*').eq('id', tourId).single();
    
    if (!tour) {
        console.error("Tour not found");
        return;
    }

    console.log(`Tour: ${tour.title}`);
    const itinerary = tour.planner_data?.itinerary || [];
    console.log(`Planner itinerary count: ${itinerary.length}`);
    
    const { data: acts } = await supabase.from('daily_activities').select('id, title, activity_type').eq('tour_id', tourId);
    console.log(`DB daily_activities count: ${acts?.length}`);

    // Print mapping if there are matches
    const dbIds = new Set(acts.map(a => a.id));
    const plannerIds = new Set(itinerary.map(b => b.id));

    let matchCount = 0;
    plannerIds.forEach(pid => {
        if (dbIds.has(pid)) matchCount++;
    });
    console.log(`Match Count: ${matchCount}`);

    console.log("\nFirst 5 Planner IDs:", itinerary.slice(0, 5).map(b => b.id));
    console.log("First 5 DB IDs:", acts.slice(0, 5).map(a => a.id));
}

run();
