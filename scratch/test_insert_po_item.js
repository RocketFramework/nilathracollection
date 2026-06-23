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
        console.error('Error reading .env.local', e);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // 1. Fetch a valid purchase_order_id and daily_activity_id
    console.log("Fetching valid PO and Activity IDs...");
    const { data: po } = await supabase.from('purchase_orders').select('id').limit(1).single();
    const { data: act } = await supabase.from('daily_activities').select('id').limit(1).single();

    if (!po || !act) {
        console.error("Could not find a valid PO or daily activity to test with.");
        return;
    }

    console.log(`Using PO ID: ${po.id}, Activity ID: ${act.id}`);

    // 2. Try inserting a row with daily_activity_id set
    const testItem = {
        purchase_order_id: po.id,
        daily_activity_id: act.id,
        description: "Test insertion of daily_activity_id column",
        quantity: 1,
        unit_price: 100
    };

    console.log("Inserting test item...");
    const { data: inserted, error } = await supabase
        .from('purchase_order_items')
        .insert([testItem])
        .select();

    if (error) {
        console.error("INSERT ERROR:", error);
    } else {
        console.log("INSERT SUCCESS:", JSON.stringify(inserted, null, 2));
    }
}

run();
