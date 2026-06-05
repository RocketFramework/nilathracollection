const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Manual .env.local parser to bypass dependency issues
try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    envFile.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const index = trimmed.indexOf('=');
            if (index !== -1) {
                const key = trimmed.substring(0, index).trim();
                const val = trimmed.substring(index + 1).trim().replace(/^['"]|['"]$/g, '');
                process.env[key] = val;
            }
        }
    });
} catch (e) {
    console.error('Warning: Could not read .env.local file', e);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    try {
        console.log('Reading migration file...');
        const sql = fs.readFileSync('data/migrations/create_app_states.sql', 'utf8');
        console.log('Executing SQL migration via RPC...');
        const { data, error } = await supabase.rpc('run_sql', { sql_query: sql });
        if (error) {
            console.error('Migration failed:', error);
            console.log('\nNOTE: If run_sql is not exposed in your database, please execute the contents of "data/migrations/create_app_states.sql" manually in your Supabase SQL editor.');
        } else {
            console.log('Migration successfully completed!', data);
        }
    } catch (e) {
        console.error('Error during migration run:', e);
    }
}
run();
