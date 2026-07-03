const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    try {
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
    } catch (e) {
        console.error('Error reading .env.local', e);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const tourId = '9bfb345a-da5d-443a-8644-90148b0b3a5a';
    
    // 1. Get Invoices
    const { data: invoices, error: invError } = await supabase
        .from('customer_invoices')
        .select(`
            *,
            items:customer_invoice_items(*)
        `)
        .eq('tour_id', tourId);

    if (invError) {
        console.error('Error fetching invoices:', invError);
        return;
    }

    console.log('Customer Invoices for this tour:');
    invoices.forEach(inv => {
        console.log(`Invoice ${inv.invoice_number} (ID: ${inv.id}, Status: ${inv.status}, Amount: ${inv.amount})`);
        console.log('Items:');
        inv.items.forEach(item => {
            console.log(`  - ${item.description}: $${item.amount}`);
        });
    });

    // 2. Get Daily Activities to see total charged price
    const { data: activities } = await supabase
        .from('daily_activities')
        .select('activity_type, charged_total_price, tour_itineraries(day_number)')
        .eq('tour_id', tourId);

    console.log('\nDaily Activities Charged Total:');
    let totalCharged = 0;
    activities?.forEach(act => {
        const val = Number(act.charged_total_price) || 0;
        totalCharged += val;
        console.log(`  - Type: ${act.activity_type}, Charged: $${val}, Day: ${act.tour_itineraries?.day_number}`);
    });
    console.log(`Total Charged for all activities: $${totalCharged}`);
}
run();
