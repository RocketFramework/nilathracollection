const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
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
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const sql = `ALTER TABLE tours ADD COLUMN IF NOT EXISTS itinerary_needs_po_rebuild BOOLEAN NOT NULL DEFAULT FALSE;`;
    // Verify column exists by selecting from it
    const { data: check, error: checkErr } = await supabase
        .from('tours')
        .select('itinerary_needs_po_rebuild')
        .limit(1);
    if (checkErr) {
        console.error('Column does NOT exist yet. Please run this in the Supabase SQL Editor:');
        console.log('\n' + sql + '\n');
    } else {
        console.log('✓ Column itinerary_needs_po_rebuild already exists. No migration needed.');
    }
}

run().catch(console.error);
