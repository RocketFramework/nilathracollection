const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^"(.*)"$/, '$1');
    env[key] = val;
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGetHotels() {
    try {
        console.log("Fetching hotels from supabase...");
        const query = supabase.from('hotels').select('*, hotel_rooms(*), payment_details(*)', { count: 'exact' });
        const { data, error, count } = await query;
        if (error) {
            console.error("Supabase query error:", error);
            return;
        }
        console.log("Query succeeded. Count:", count);
        console.log("Data size:", data ? data.length : "null");
        if (data) {
            const allRoomIds = data.flatMap(h => (h.hotel_rooms || []).map(r => r.id)).filter(Boolean);
            console.log("All room IDs:", allRoomIds.length);
        }
    } catch (e) {
        console.error("Exception caught:", e);
    }
}

testGetHotels();
