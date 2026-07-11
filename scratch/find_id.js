const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    envFile.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
            process.env[key] = val;
        }
    });
} catch (e) {
    console.error("Could not read .env.local:", e);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const tourId = '9bfb345a-da5d-443a-8644-90148b0b3a5a';
const searchId = '39ae46af-9a86-488d-ba30-6b761d9d890f';

async function run() {
    const { data } = await supabase.from('tours').select('planner_data').eq('id', tourId).single();
    const plannerStr = JSON.stringify(data.planner_data);
    console.log("Exists in planner_data?", plannerStr.includes(searchId));
    
    const { data: act } = await supabase.from('daily_activities').select('id, title').eq('id', searchId).maybeSingle();
    console.log("Exists in daily_activities?", act);
}

run();
