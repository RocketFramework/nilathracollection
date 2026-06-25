const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function loadEnv() {
    try {
        const envContent = fs.readFileSync('.env.local', 'utf8');
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
        return {};
    }
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const tourId = '60dec7e8-cbd9-4801-9f97-b41e5062fcc2';
    console.log("Running getRfqEmailsByTourId query...");
    try {
        const { data, error } = await supabase
            .from('tour_rfq_emails')
            .select(`
                *,
                quotation:quotation_request_id (
                    *
                )
            `)
            .eq('tour_id', tourId)
            .order('sent_at', { ascending: false });
        
        if (error) {
            console.error("Query Error:", error);
        } else {
            console.log("Query Succeeded. Results count:", data.length);
            if (data.length > 0) {
                console.log("First record quotation relation:", data[0].quotation);
            }
        }
    } catch (err) {
        console.error("Caught error:", err);
    }
}

run();
