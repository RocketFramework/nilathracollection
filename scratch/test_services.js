const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('/home/nirosh/Code/NilathraCollection/.env.local', 'utf-8');
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

async function testServices() {
    // 1. Hotels
    try {
        console.log("1. Fetching hotels...");
        const { data, error } = await supabase.from('hotels').select('*, hotel_rooms(*), payment_details(*)');
        if (error) throw error;
        console.log(`Success: fetched ${data.length} hotels.`);
    } catch (e) {
        console.error("Failed fetching hotels:", e.message || e);
    }

    // 2. Transport Providers
    try {
        console.log("2. Fetching transport providers...");
        const { data, error } = await supabase.from('transport_providers').select('*, transport_vehicles(*)');
        if (error) throw error;
        console.log(`Success: fetched ${data.length} transport providers.`);
    } catch (e) {
        console.error("Failed fetching transport providers:", e.message || e);
    }

    // 3. Tour Guides
    try {
        console.log("3. Fetching tour guides...");
        const { data, error } = await supabase.from('tour_guides').select('*');
        if (error) throw error;
        console.log(`Success: fetched ${data.length} tour guides.`);
    } catch (e) {
        console.error("Failed fetching tour guides:", e.message || e);
    }

    // 4. Restaurants
    try {
        console.log("4. Fetching restaurants...");
        const { data, error } = await supabase.from('restaurants').select('*');
        if (error) throw error;
        console.log(`Success: fetched ${data.length} restaurants.`);
    } catch (e) {
        console.error("Failed fetching restaurants:", e.message || e);
    }

    // 5. Vendors
    try {
        console.log("5. Fetching vendors...");
        const { data, error } = await supabase.from('vendors').select('*');
        if (error) throw error;
        console.log(`Success: fetched ${data.length} vendors.`);
    } catch (e) {
        console.error("Failed fetching vendors:", e.message || e);
    }
}

testServices();
