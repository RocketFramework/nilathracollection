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
    const sql = `
        ALTER TABLE public.daily_activity_quotation_request 
        DROP CONSTRAINT IF EXISTS daily_activity_quotation_request_daily_activity_id_fkey;

        ALTER TABLE public.daily_activity_quotation_request 
        DROP CONSTRAINT IF EXISTS daily_activity_quotation_request_itinerary_id_fkey;
    `;
    console.log("Running SQL to drop constraints...");
    const { data, error } = await supabase.rpc('run_sql', { sql_query: sql });
    if (error) {
        console.error("Failed to alter table constraints:", error);
    } else {
        console.log("Successfully dropped cascade-delete constraints on mapping table!", data);
    }
}

run();
