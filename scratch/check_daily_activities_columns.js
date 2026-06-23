const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
    const { data: cols, error } = await supabase.rpc('get_table_columns', { table_name: 'daily_activities' });
    if (error) {
        // Fallback: try fetching a single row
        console.log("RPC get_table_columns failed, attempting to select a single row...");
        const { data: row, error: rowErr } = await supabase.from('daily_activities').select('*').limit(1);
        if (rowErr) {
            console.error("Select row error:", rowErr);
        } else {
            console.log("Columns:", Object.keys(row[0] || {}));
        }
    } else {
        console.log("Columns:", cols);
    }
}

run();
