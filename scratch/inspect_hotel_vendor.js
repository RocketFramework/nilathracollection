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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const hotelId = '1027f407-463b-4161-82e6-4371ae28eb69';
    const loggedVendorId = 'bd410ca3-226f-4127-af57-cfc3c5ca5b3c';

    console.log("Fetching hotel:", hotelId);
    const { data: hotel } = await supabase.from('hotels').select('*').eq('id', hotelId).single();
    console.log("Hotel:", hotel);

    console.log("\nFetching vendor:", loggedVendorId);
    const { data: vendor } = await supabase.from('vendors').select('*').eq('id', loggedVendorId).single();
    console.log("Vendor:", vendor);
}

run();
