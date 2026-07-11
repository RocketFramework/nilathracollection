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
const { TourService } = require('../src/services/tour.service');
const tourId = '9bfb345a-da5d-443a-8644-90148b0b3a5a';

async function run() {
    try {
        const { data } = await supabase.from('tours').select('planner_data').eq('id', tourId).single();
        if (!data || !data.planner_data) {
            console.log("No planner data found");
            return;
        }
        
        console.log("Running saveTour...");
        await TourService.saveTour(tourId, data.planner_data);
        console.log("saveTour completed successfully!");
    } catch (e) {
        console.error("Error in saveTour:", e);
    }
}

run();
