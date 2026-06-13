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
        console.log('Loaded env variables from .env.local');
    }
} catch (err) {
    console.error('Failed to parse .env.local:', err.message);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error('Missing environment variables NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
    const sqlPath = path.join(__dirname, '../data/migrations/add_guest_and_room_counts_to_draft_versions.sql');
    console.log('Reading SQL migration from:', sqlPath);
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing SQL migration in Supabase via RPC run_sql...');
    const { error } = await supabase.rpc('run_sql', { sql: sqlContent });
    if (error) {
        console.error('Migration failed:', error);
    } else {
        console.log('Migration executed successfully! Columns added to draft_itinerary_versions table.');
    }
}

run();
