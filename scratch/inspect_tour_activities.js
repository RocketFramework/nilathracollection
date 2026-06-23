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

async function run() {
    const tourId = '88eb758d-11b5-4b11-aafb-f04e7562de39';
    const { data: acts, error } = await supabase
        .from('daily_activities')
        .select('*')
        .eq('tour_id', tourId);
    
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Daily activities count:", acts.length);
        console.log("Daily activities details:", acts.map(a => ({ id: a.id, tour_id: a.tour_id, title: a.title, activity_type: a.activity_type })));
    }
}

run();
