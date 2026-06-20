const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Parse .env.local
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
} catch (err) {
    console.error('Error parsing .env.local:', err);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function run() {
    console.log('Running migration: ALTER TABLE hotels ADD COLUMN IF NOT EXISTS gm_email VARCHAR(255);');
    const { error } = await supabase.rpc('run_sql', { 
        sql_query: 'ALTER TABLE hotels ADD COLUMN IF NOT EXISTS gm_email VARCHAR(255);' 
    });
    if (error) {
        console.error('Migration failed:', error.message);
    } else {
        console.log('Migration completed successfully!');
    }
}

run();
