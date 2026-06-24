const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
        console.error('Error reading .env.local', e);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Service Role Key missing in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Reading migration SQL file...");
    const sqlPath = path.join(__dirname, '../data/migrations/create_daily_activity_customer_invoice_items.sql');
    const sqlQuery = fs.readFileSync(sqlPath, 'utf8');
    
    console.log("Executing SQL migration via RPC...");
    const { data: sqlData, error: sqlError } = await supabase.rpc('run_sql', { sql: sqlQuery });
    if (sqlError) {
        console.error('Database migration failed:', sqlError);
        process.exit(1);
    } else {
        console.log('Database migration succeeded:', sqlData || 'success');
    }
}

run();
