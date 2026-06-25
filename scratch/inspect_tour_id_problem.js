const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
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

async function run() {
    console.log("---- daily_activity_vendors ----");
    const { data: vendors, error: vErr } = await supabase
        .from('daily_activity_vendors')
        .select('id, vendor_name, tour_id, vendor_type, vendor_id');
    if (vErr) {
        console.error(vErr);
    } else {
        console.log(`Total vendors: ${vendors.length}`);
        console.log(vendors);
    }

    console.log("---- daily_activity_vendor_links ----");
    const { data: links, error: lErr } = await supabase
        .from('daily_activity_vendor_links')
        .select('id, daily_activity_id, daily_activity_vendor_id, tour_id, itinerary_id, activity_type');
    if (lErr) {
        console.error(lErr);
    } else {
        console.log(`Total links: ${links.length}`);
        console.log(links);
    }

    console.log("---- tour_rfq_emails count ----");
    const { count: emailCount } = await supabase
        .from('tour_rfq_emails')
        .select('*', { count: 'exact', head: true });
    console.log(`Total emails: ${emailCount}`);

    console.log("---- tour_rfq_emails samples ----");
    const { data: emails } = await supabase
        .from('tour_rfq_emails')
        .select('id, tour_id, vendor_id, daily_activity_vendor_id')
        .limit(10);
    console.log(emails);
}

run();
