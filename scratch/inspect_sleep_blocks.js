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
    
    // Get all daily activities
    const { data: activities, error } = await supabase
        .from('daily_activities')
        .select('id, activity_type, hotel_id, description, charged_total_price, tour_itineraries(day_number)')
        .eq('tour_id', tourId);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Total activities:', activities.length);
    console.log('All activities matching type == sleep or hotel_id != null:');
    activities.forEach(act => {
        const matchesType = act.activity_type === 'sleep';
        const matchesHotelId = !!act.hotel_id;
        if (matchesType || matchesHotelId) {
            console.log(`- ID: ${act.id}, Day: ${act.tour_itineraries?.day_number}, Type: ${act.activity_type}, HotelID: ${act.hotel_id}, Price: ${act.charged_total_price}, Desc: ${act.description}`);
        }
    });
}
run();
