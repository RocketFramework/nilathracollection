import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in environment.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMissing() {
    // Find where images is null or empty array
    // We can just fetch all and filter locally to be safe about array syntax, or use PostgREST filters
    const { data, error } = await supabase
        .from('activities')
        .select('id, activity_name, location_name, description, images');

    if (error) {
        console.error('Error fetching activities:', error);
        return;
    }

    const missing = data.filter(a => !a.images || a.images.length === 0);

    console.log(`Found ${missing.length} activities missing images.`);
    fs.writeFileSync('missing_images.json', JSON.stringify(missing, null, 2));
    console.log('Saved data to missing_images.json');
}

checkMissing();
