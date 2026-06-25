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
    console.log("Checking tour_rfq_emails for tour:", tourId);
    const { data: rfq, error: rfqErr } = await supabase
        .from('tour_rfq_emails')
        .select('*')
        .eq('tour_id', tourId);

    if (rfqErr) {
        console.error("RFQ Err:", rfqErr);
    } else {
        console.log(`Found ${rfq.length} RFQ emails:`);
        rfq.forEach(e => {
            console.log(`  RFQ: id=${e.id}, vendor_id=${e.vendor_id}, hotel_id=${e.hotel_id || 'N/A'}, recipient=${e.recipient_email}, subject="${e.subject}"`);
        });
    }

    console.log("Checking tour_rfp_emails for tour:", tourId);
    const { data: rfp, error: rfpErr } = await supabase
        .from('tour_rfp_emails')
        .select('*')
        .eq('tour_id', tourId);

    if (rfpErr) {
        console.error("RFP Err:", rfpErr);
    } else {
        console.log(`Found ${rfp.length} RFP emails:`);
        rfp.forEach(e => {
            console.log(`  RFP: id=${e.id}, purchase_order_id=${e.purchase_order_id}, recipient=${e.recipient_email}, subject="${e.subject}"`);
        });
    }
}

run();
