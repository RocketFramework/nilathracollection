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
    // Get latest tour
    const { data: tours, error: tourError } = await supabase
        .from('tours')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

    if (tourError || !tours || tours.length === 0) {
        console.error('Error fetching tours:', tourError);
        return;
    }

    const tour = tours[0];
    console.log('Tour:', {
        id: tour.id,
        title: tour.title,
        tourist_id: tour.tourist_id,
        request_id: tour.request_id,
        start_date: tour.start_date,
        end_date: tour.end_date
    });

    const { data: profile, error: profileErr } = await supabase
        .from('tourist_profiles')
        .select('*')
        .eq('id', tour.tourist_id)
        .single();

    if (profileErr) {
        console.error('Error fetching tourist profile:', profileErr);
    } else {
        console.log('Tourist Profile:', profile);
    }

    const { data: request, error: requestErr } = await supabase
        .from('requests')
        .select('*')
        .eq('id', tour.request_id)
        .single();

    if (requestErr) {
        console.error('Error fetching request:', requestErr);
    } else {
        console.log('Request start_date:', request.start_date);
    }
}

run();
