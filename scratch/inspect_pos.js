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
    const tourId = '60dec7e8-cbd9-4801-9f97-b41e5062fcc2';
    console.log("Fetching purchase_orders for tour:", tourId);
    const { data: pos, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('tour_id', tourId);

    if (error) {
        console.error("PO Error:", error);
    } else {
        console.log(`Found ${pos.length} purchase orders:`);
        pos.forEach(po => {
            console.log(`  PO: id=${po.id}, po_number=${po.po_number}, hotel_id=${po.hotel_id}, vendor_id=${po.vendor_id}, status=${po.status}`);
        });
    }
}

run();
