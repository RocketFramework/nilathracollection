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
    console.log("Altering customer_invoices table to add invoice_number, billing_details, agency_note, discount_amount, tax_amount...");
    const sqlQuery = `
      ALTER TABLE public.customer_invoices 
        ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100) UNIQUE,
        ADD COLUMN IF NOT EXISTS billing_details JSONB,
        ADD COLUMN IF NOT EXISTS agency_note TEXT,
        ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10, 2) DEFAULT 0.00;
    `;
    const { data: sqlData, error: sqlError } = await supabase.rpc('run_sql', { sql_query: sqlQuery });
    if (sqlError) {
        console.error('Database migration failed:', sqlError);
    } else {
        console.log('Database migration succeeded:', sqlData || 'success');
    }
}

run();
