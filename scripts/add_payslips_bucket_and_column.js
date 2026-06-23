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
    // 1. Alter table
    console.log("Altering supplier_payments table to add attachment_url column...");
    const sqlQuery = `ALTER TABLE public.supplier_payments ADD COLUMN IF NOT EXISTS attachment_url text;`;
    const { data: sqlData, error: sqlError } = await supabase.rpc('run_sql', { sql_query: sqlQuery });
    if (sqlError) {
        console.error('Database migration failed:', sqlError);
    } else {
        console.log('Database migration succeeded:', sqlData || 'success');
    }

    // 2. Storage Bucket Creation
    console.log("Checking if 'payslips' bucket exists...");
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
        console.error("Failed to list buckets:", listError);
        return;
    }

    const payslipsBucket = buckets.find(b => b.name === 'payslips');
    if (!payslipsBucket) {
        console.log("Creating public bucket 'payslips'...");
        const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('payslips', {
            public: true,
            allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png', 'image/gif'],
            fileSizeLimit: 10485760 // 10MB
        });
        if (bucketError) {
            console.error("Failed to create bucket 'payslips':", bucketError);
        } else {
            console.log("Bucket 'payslips' created successfully:", bucketData);
        }
    } else {
        console.log("Bucket 'payslips' already exists!");
    }
}

run();
