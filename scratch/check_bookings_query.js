const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
env.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) process.env[k.trim()] = v.trim().replace(/^["']|["']$/g, '');
});
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBookings() {
    console.log("Checking raw activity_bookings table...");
    const { data: raw, error: rawErr } = await supabase.from('activity_bookings').select('*');
    console.log("Raw count:", raw ? raw.length : 0, "Error:", rawErr);
    if (raw && raw.length > 0) {
        console.log("Sample raw booking:", raw[0]);
    }

    console.log("\nTesting simplified join query...");
    const { data: simple, error: simpleErr } = await supabase
        .from('activity_bookings')
        .select(`
            *,
            items:activity_booking_items(
                *,
                activity:activities(*),
                vendor:vendors(*)
            ),
            user:users(*)
        `);
    
    console.log("Simplified join result count:", simple ? simple.length : 0);
    console.log("Simplified join error:", simpleErr);

    if (simple && simple.length > 0) {
        const touristIds = simple.map(b => b.tourist_id).filter(Boolean);
        const { data: profiles } = await supabase
            .from('tourist_profiles')
            .select('*')
            .in('id', touristIds);

        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        simple.forEach(b => {
            b.tourist_profile = profileMap.get(b.tourist_id) || null;
        });

        console.log("\nEnriched result with tourist_profile:");
        console.log(JSON.stringify(simple[0], null, 2));
    }
}

checkBookings();
