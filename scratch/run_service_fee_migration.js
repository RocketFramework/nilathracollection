const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    try {
        const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
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
        console.error('Error reading .env.local', e);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const migrationPath = path.join(__dirname, '../data/migrations/add_service_fee_percentage_to_customer_invoices.sql');
    const sqlQuery = fs.readFileSync(migrationPath, 'utf8');
    console.log('Running migration: add_service_fee_percentage_to_customer_invoices.sql...');
    const { data, error } = await supabase.rpc('run_sql', { sql: sqlQuery });
    if (error) {
        console.error('Migration failed via RPC:', error);
        console.log('Please execute the migration SQL manually in your Supabase SQL Editor.');
    } else {
        console.log('Migration succeeded:', data || 'success');
    }
}
run();
