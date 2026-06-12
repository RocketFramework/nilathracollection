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

async function check() {
    console.log('Testing draft_itinerary_versions table...');
    const { data: d1, error: e1 } = await supabase.from('draft_itinerary_versions').select('id').limit(1);
    if (e1) {
        console.log('draft_itinerary_versions check error:', e1.message);
    } else {
        console.log('draft_itinerary_versions table exists!');
    }

    console.log('Testing itinerary_locks table...');
    const { data: d2, error: e2 } = await supabase.from('itinerary_locks').select('tour_id').limit(1);
    if (e2) {
        console.log('itinerary_locks check error:', e2.message);
    } else {
        console.log('itinerary_locks table exists!');
    }
}

check();
