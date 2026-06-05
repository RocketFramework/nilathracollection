const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Simple parser for .env.local
try {
    const env = fs.readFileSync('.env.local', 'utf8');
    env.split('\n').forEach(line => {
        const cleanLine = line.trim();
        if (!cleanLine || cleanLine.startsWith('#')) return;
        const parts = cleanLine.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
            process.env[key] = val;
        }
    });
} catch (e) {
    console.warn('Warning: Could not read .env.local file', e.message);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const sql = fs.readFileSync('data/migrations/update_tourist_profile_and_team.sql', 'utf8');
    console.log('Running migration:');
    console.log(sql);
    
    const { data, error } = await supabase.rpc('run_sql', { sql_query: sql });
    if (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } else {
        console.log('Migration succeeded!', data || '');
    }
}
run();
