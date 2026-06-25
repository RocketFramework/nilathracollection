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
    // We can query pg_proc to find the function signature of run_sql
    const { data, error } = await supabase.from('tours').select('id').limit(1);
    if (error) {
        console.error('Connection/Auth error:', error);
        return;
    }
    console.log('Connected successfully!');

    // Let's run a query using an RPC if possible, or query some views
    // Wait, since we don't have a direct sql query runner if run_sql is not found,
    // let's try calling get_schema_info RPC to see if that works
    console.log('Testing get_schema_info RPC...');
    const { data: schemaInfo, error: schemaErr } = await supabase.rpc('get_schema_info', { table_name: 'tours' });
    if (schemaErr) {
        console.error('get_schema_info failed:', schemaErr);
    } else {
        console.log('get_schema_info works! Sample keys:', schemaInfo ? Object.keys(schemaInfo) : 'null');
    }

    console.log('Trying to find run_sql function...');
    // We can try to call run_sql with different shapes:
    const shapes = [
        { sql_query: 'SELECT 1' },
        { sql: 'SELECT 1' },
        { query: 'SELECT 1' }
    ];
    for (const shape of shapes) {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('run_sql', shape);
        console.log(`Called run_sql with shape ${JSON.stringify(shape)}:`, rpcErr ? rpcErr.message : 'SUCCESS!');
    }
}

check();
