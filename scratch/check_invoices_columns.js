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
    const { data: cols, error } = await supabase.rpc('get_schema_info', { table_name: 'customer_invoices' });
    if (error) {
        console.error("RPC Error:", error);
    } else {
        console.log("Customer Invoices Schema:", cols);
    }

    const { data: itemCols, error: itemErr } = await supabase.rpc('get_schema_info', { table_name: 'customer_invoice_items' });
    if (itemErr) {
        console.error("Item RPC Error:", itemErr);
    } else {
        console.log("Customer Invoice Items Schema:", itemCols);
    }
}

run();
