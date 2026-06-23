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
    // 1. Get a valid tour
    const { data: tours, error: tourError } = await supabase
        .from('tours')
        .select('id, tourist_id')
        .limit(1);

    if (tourError || !tours || tours.length === 0) {
        console.error("Failed to fetch tour:", tourError);
        return;
    }

    const tour = tours[0];
    console.log("Using Tour:", tour);

    // 2. Insert temporary invoice
    const { data: inv, error: invError } = await supabase
        .from('customer_invoices')
        .insert({
            tour_id: tour.id,
            tourist_id: tour.tourist_id,
            amount: 0,
            status: 'Pending'
        })
        .select()
        .single();

    if (invError) {
        console.error("Insert invoice error:", invError);
        return;
    }

    console.log("Inserted invoice columns:", Object.keys(inv));
    console.log("Details:", inv);

    // 3. Delete temporary invoice
    const { error: delError } = await supabase
        .from('customer_invoices')
        .delete()
        .eq('id', inv.id);

    if (delError) {
        console.error("Delete invoice error:", delError);
    } else {
        console.log("Temporary invoice deleted successfully.");
    }
}

run();
