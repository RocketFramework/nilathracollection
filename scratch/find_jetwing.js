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
    console.log("Searching in hotels...");
    const { data: hotels } = await supabase.from('hotels').select('*').ilike('name', '%Jetwing%');
    console.log("Hotels matching 'Jetwing':", hotels.map(h => ({ id: h.id, name: h.name })));

    console.log("\nSearching in vendors...");
    const { data: vendors } = await supabase.from('vendors').select('*').ilike('name', '%Jetwing%');
    console.log("Vendors matching 'Jetwing':", vendors.map(v => ({ id: v.id, name: v.name })));
}

run();
