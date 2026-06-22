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

const TOUR_ID = '60dec7e8-cbd9-4801-9f97-b41e5062fcc2';

async function check() {
    console.log(`Checking data for tour: ${TOUR_ID}`);
    
    const { data: tourRfq, error: errRfq } = await supabase.from('tour_rfq_emails').select('*').eq('tour_id', TOUR_ID);
    console.log(`tour_rfq_emails count: ${tourRfq ? tourRfq.length : 0}`);
    if (tourRfq && tourRfq.length > 0) {
        console.log("Sample tour_rfq_emails:", tourRfq.map(r => ({ id: r.id, vendor_id: r.vendor_id, subject: r.subject, sent_at: r.sent_at, quotation_request_id: r.quotation_request_id })));
    }
    
    const { data: tourRfp, error: errRfp } = await supabase.from('tour_rfp_emails').select('*').eq('tour_id', TOUR_ID);
    console.log(`tour_rfp_emails count: ${tourRfp ? tourRfp.length : 0}`);
    if (tourRfp && tourRfp.length > 0) {
        console.log("Sample tour_rfp_emails:", tourRfp.map(r => ({ id: r.id, purchase_order_id: r.purchase_order_id, subject: r.subject, sent_at: r.sent_at })));
    }

    const { data: pos, error: errPos } = await supabase.from('purchase_orders').select('*').eq('tour_id', TOUR_ID);
    console.log(`purchase_orders count: ${pos ? pos.length : 0}`);
    if (pos && pos.length > 0) {
        console.log("Sample purchase_orders:", pos.map(p => ({ id: p.id, hotel_id: p.hotel_id, hotel_name: p.hotel_name, created_at: p.created_at })));
    }
}

check();
