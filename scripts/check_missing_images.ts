import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const IMAGE_DIR = path.join(process.cwd(), 'public');

async function checkImages() {
    const { data: activities, error } = await supabase.from('activities').select('id, activity_name, description, images');

    if (error) {
        console.error("Error fetching activities:", error);
        return;
    }

    const missing = [];
    let totalMissingFiles = 0;

    for (const activity of activities) {
        let hasMissing = false;
        let missingFiles = [];

        if (!activity.images || activity.images.length === 0) {
            hasMissing = true;
        } else {
            for (const imgUrl of activity.images) {
                // imgUrl is like /images/activities/xyz.avif
                const localPath = path.join(IMAGE_DIR, imgUrl);
                if (!fs.existsSync(localPath)) {
                    hasMissing = true;
                    missingFiles.push(imgUrl);
                    totalMissingFiles++;
                }
            }
        }

        if (hasMissing) {
            missing.push({
                id: activity.id,
                name: activity.activity_name,
                description: activity.description,
                currentImages: activity.images,
                missingFiles
            });
        }
    }

    console.log(`Found ${missing.length} activities with missing images.`);
    fs.writeFileSync('missing_activities.json', JSON.stringify(missing, null, 2));
}

checkImages();
