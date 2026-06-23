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
    // Let's get all tours
    const { data: tours } = await supabase.from('tours').select('id, title');
    console.log("All Tours:");
    console.log(tours);

    // Let's get all mapping rows
    const { data: allMappings } = await supabase.from('daily_activity_quotation_request').select('*');
    console.log("\nAll Mapping Rows in DB:");
    console.log(allMappings);

    // Let's get all quotation requests
    const { data: allQuotes } = await supabase.from('quotation_request').select('id, vendor_name, status, created_at');
    console.log("\nAll Quotation Requests in DB:");
    console.log(allQuotes);
}

run();
