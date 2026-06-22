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

const TOUR_ID = '60dec7e8-cbd9-4801-9f97-b41e5062fcc2';

async function check() {
    console.log("Testing relation query with 'quotation:quotation_request_id (*)'...");
    const { data: data1, error: err1 } = await supabase
        .from('tour_rfq_emails')
        .select(`
            *,
            quotation:quotation_request_id (
                *
            )
        `)
        .eq('tour_id', TOUR_ID);
        
    if (err1) {
        console.error("Query 1 failed:", err1.message);
        
        console.log("Trying query 2 with 'quotation_request (*)'...");
        const { data: data2, error: err2 } = await supabase
            .from('tour_rfq_emails')
            .select(`
                *,
                quotation_request (
                    *
                )
            `)
            .eq('tour_id', TOUR_ID);
            
        if (err2) {
            console.error("Query 2 failed:", err2.message);
        } else {
            console.log("Query 2 succeeded! Sample:", data2);
        }
    } else {
        console.log("Query 1 succeeded! Sample:", data1);
    }
}

check();
