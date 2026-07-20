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
const tourId = 'c4295db5-1d89-4b7e-bf69-afa000292e07';

async function check() {
    const { data, error } = await supabase.from('tours').select('planner_data').eq('id', tourId).single();
    if (error) {
        console.error(error);
        return;
    }
    console.log("dayCostOverrides:", JSON.stringify(data.planner_data?.dayCostOverrides, null, 2));
}

check();
