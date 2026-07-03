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
    
    // 1. Get Tour
    const { data: tour, error: tourError } = await supabase
        .from('tours')
        .select('*')
        .eq('id', tourId)
        .single();
        
    if (tourError || !tour) {
        console.error('Failed to fetch tour:', tourError);
        return;
    }

    console.log('Tour details fetched successfully.');
    console.log('Tourist ID:', tour.tourist_id);
    console.log('Planner Data Profile:', JSON.stringify(tour.planner_data?.profile, null, 2));
    console.log('Day Cost Overrides:', JSON.stringify(tour.planner_data?.dayCostOverrides, null, 2));

    // 2. Get Settings
    const { data: rawSettings } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value');

    const appSettings = {};
    if (rawSettings) {
        rawSettings.forEach(s => {
            appSettings[s.setting_key] = s.setting_value;
        });
    }
    console.log('Concierge cost keys in app settings:', 
        rawSettings.filter(s => s.setting_key.includes('concierge') || s.setting_key.includes('service_fee'))
    );

    // 3. Get tourist profile
    if (tour.tourist_id) {
        const { data: profile } = await supabase
            .from('tourist_profiles')
            .select('*')
            .eq('id', tour.tourist_id)
            .maybeSingle();
        console.log('Tourist Profile:', JSON.stringify(profile, null, 2));
    }
}
run();
