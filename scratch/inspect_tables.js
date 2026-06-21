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

async function inspect() {
    console.log("---- daily_activities columns ----");
    const { data: da, error: daErr } = await supabase.from('daily_activities').select('*').limit(1);
    if (da && da.length > 0) {
        console.log(Object.keys(da[0]));
    } else if (daErr) {
        console.error(daErr);
    } else {
        console.log("No rows in daily_activities");
    }

    console.log("---- room_rates columns ----");
    const { data: rr, error: rrErr } = await supabase.from('room_rates').select('*').limit(1);
    if (rr && rr.length > 0) {
        console.log(Object.keys(rr[0]));
    } else if (rrErr) {
        console.error(rrErr);
    } else {
        console.log("No rows in room_rates");
    }

    console.log("---- hotel_rooms columns ----");
    const { data: hr, error: hrErr } = await supabase.from('hotel_rooms').select('*').limit(1);
    if (hr && hr.length > 0) {
        console.log(Object.keys(hr[0]));
    } else if (hrErr) {
        console.error(hrErr);
    } else {
        console.log("No rows in hotel_rooms");
    }
}

inspect();
