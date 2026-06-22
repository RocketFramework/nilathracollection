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

async function inspect() {
    console.log("---- tour_shared_emails columns ----");
    const { data: tse, error: tseErr } = await supabase.from('tour_shared_emails').select('*').limit(1);
    if (tse && tse.length > 0) {
        console.log(Object.keys(tse[0]));
    } else if (tseErr) {
        console.error(tseErr);
    } else {
        // Try getting schema info via a quick RPC or query
        console.log("No rows in tour_shared_emails, trying to select empty to get columns or error");
        console.log(tseErr);
    }

    // List some possible tables
    const tables = ['tour_shared_emails', 'tour_rfq_emails', 'tour_rfp_emails', 'quotation_request', 'quotation_requests', 'rfq_history', 'rfp_history', 'rfq_emails', 'rfp_emails'];
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`Table: ${table} - Error: ${error.message}`);
        } else {
            console.log(`Table: ${table} - Exists! Keys:`, data[0] ? Object.keys(data[0]) : 'Empty table');
        }
    }
}

inspect();
