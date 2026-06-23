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
    // Let's find some tour that has daily activities
    const { data: rawActs, error: err } = await supabase
        .from('daily_activities')
        .select(`
            *,
            tour_itineraries!inner (
                tour_id,
                day_number,
                date
            )
        `)
        .limit(30);

    if (err) {
        console.error("Error:", err);
        return;
    }

    console.log(`Found ${rawActs.length} activities.`);
    rawActs.forEach((a, i) => {
        console.log(`\n--- Activity #${i+1} ---`);
        console.log(`ID: ${a.id}`);
        console.log(`Type: ${a.activity_type}`);
        console.log(`Title: ${a.title}`);
        console.log(`Description: ${a.description}`);
        console.log(`Charged Unit Price: ${a.charged_unit_price}`);
        console.log(`Charged Total Price: ${a.charged_total_price}`);
        console.log(`Quantity: ${a.quantity}`);
        console.log(`Hotel ID: ${a.hotel_id}`);
        console.log(`Meal Plan: ${a.meal_plan}`);
        console.log(`Rooms: Single(${a.single_room_count}), Double(${a.double_room_count}), Twin(${a.twin_room_count}), Triple(${a.triple_room_count}), Family(${a.family_room_count})`);
    });
}

run();
