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
    const sqlPath = path.join(__dirname, '../data/migrations/add_day_cost_overrides_to_draft_versions.sql');
    console.log('Reading SQL migration from:', sqlPath);
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing SQL migration in Supabase via RPC run_sql...');
    const { error } = await supabase.rpc('run_sql', { sql_query: sqlContent });
    if (error) {
        console.error('Migration failed:', error);
    } else {
        console.log('Migration executed successfully! Column day_cost_overrides added to draft_itinerary_versions.');
    }
}

run();
