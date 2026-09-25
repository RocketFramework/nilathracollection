const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const tourId = 'c0569dc7-0eb6-4362-a071-668b643f3b54';
    const { data: tour } = await supabase.from('tours').select('planner_data').eq('id', tourId).single();
    
    const tripData = tour.planner_data || {};
    console.log("=== PROFILE ===");
    console.log(tripData.profile);
    
    console.log("\n=== FINANCIALS ===");
    console.log(JSON.stringify(tripData.financials, null, 2));
}

run();
