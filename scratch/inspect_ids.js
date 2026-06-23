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

async function check() {
    // Let's get the latest updated tour
    const { data: tours, error: tErr } = await supabase.from('tours').select('*').order('updated_at', { ascending: false }).limit(1);
    if (tErr || !tours || tours.length === 0) {
        console.error("No tours found or error:", tErr);
        return;
    }

    const tour = tours[0];
    const tourId = tour.id;
    console.log(`Tour ID: ${tourId}`);
    console.log(`Tour Title: ${tour.title}`);
    console.log(`Total Cost: ${tour.total_cost}`);

    // Get daily activities in the database
    const { data: dailyActivities, error: daErr } = await supabase
        .from('daily_activities')
        .select('id, itinerary_id, title, activity_type, hotel_id')
        .eq('tour_id', tourId);
    if (daErr) {
        console.error("Error fetching daily activities:", daErr);
    } else {
        console.log(`Daily Activities count in DB: ${dailyActivities.length}`);
    }

    // Get itinerary blocks in planner_data
    const itinerary = tour.planner_data?.itinerary || [];
    console.log(`Itinerary blocks count in planner_data: ${itinerary.length}`);

    // Compare IDs
    const dbIds = new Set(dailyActivities.map(a => a.id));
    const plannerIds = new Set(itinerary.map(b => b.id));

    console.log("\nSample DB Activity IDs:", dailyActivities.slice(0, 5).map(a => ({ id: a.id, title: a.title, type: a.activity_type })));
    console.log("Sample Planner Activity IDs:", itinerary.slice(0, 5).map(b => ({ id: b.id, name: b.name, type: b.type })));

    let matchCount = 0;
    plannerIds.forEach(pid => {
        if (dbIds.has(pid)) matchCount++;
    });
    console.log(`\nMatch count between planner block IDs and DB activity IDs: ${matchCount} / ${itinerary.length}`);

    // Check quotation_request
    const { data: quotes, error: qErr } = await supabase.from('quotation_request').select('id, vendor_name, to_email, status, created_at');
    console.log(`\nTotal Quotation Requests count: ${quotes ? quotes.length : 0}`);
    if (quotes && quotes.length > 0) {
        console.log("Quotation Requests:", quotes);
    }

    // Check daily_activity_quotation_request
    const { data: mappings, error: mErr } = await supabase.from('daily_activity_quotation_request').select('*');
    console.log(`\nTotal Daily Activity Quotation Request Mappings count: ${mappings ? mappings.length : 0}`);
    if (mappings && mappings.length > 0) {
        console.log("Mappings:", mappings);
    }
}

check();
