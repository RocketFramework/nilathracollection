import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');
const env = {};
for (const line of envLines) {
    if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim().replace(/^"|"$/g, '');
        }
    }
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key in environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateMissingImages() {
    console.log("Reading missing_activities.json...");
    const rawData = fs.readFileSync('missing_activities.json', 'utf8');
    const missingActivities = JSON.parse(rawData);

    console.log(`Found ${missingActivities.length} activities to update.`);

    for (const activity of missingActivities) {
        let themeName = "";

        // Find the underlying theme by looking at what was originally missing
        if (activity.missingFiles && activity.missingFiles.length > 0) {
            const firstMissing = activity.missingFiles[0];
            // Regex to extract base theme, e.g., "/images/activities/colombo_city_tour_1.avif" -> "colombo_city_tour"
            const match = firstMissing.match(/\/images\/activities\/(.*?)_\d+\.avif/);
            if (match && match[1]) {
                themeName = match[1];
            }
        }

        if (!themeName) {
            console.log(`Warning: Could not extract theme for activity ID ${activity.id} (${activity.name}). Skipping.`);
            continue;
        }

        // Our standard mapping to the new images we just generated
        const newImages = [
            `/images/activities/${themeName}_1.avif`,
            `/images/activities/${themeName}_2.avif`,
            `/images/activities/${themeName}_3.avif`
        ];

        console.log(`Updating ID ${activity.id} (${activity.name}) -> ${themeName}_[1-3].avif`);

        const { error } = await supabase
            .from('activities')
            .update({ images: newImages })
            .eq('id', activity.id);

        if (error) {
            console.error(`Failed to update activity ${activity.id}:`, error.message);
        } else {
            console.log(`Successfully updated activity ${activity.id}`);
        }
    }

    console.log("Done updating images.");
}

updateMissingImages();
