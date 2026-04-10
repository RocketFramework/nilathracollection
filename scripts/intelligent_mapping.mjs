import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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
const supabase = createClient(supabaseUrl, supabaseKey);
const IMAGE_DIR = path.join(process.cwd(), 'public', 'images', 'activities');

async function fixMapping() {
    const { data: activities, error } = await supabase.from('activities').select('*');
    if (error) throw error;

    const physicalFiles = fs.readdirSync(IMAGE_DIR).filter(f => !f.startsWith('.'));
    let newMapping = {};
    let matchedFiles = new Set();

    // Step 1: Strict Exact String Matching
    activities.forEach(act => {
        let slug1 = act.activity_name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
        let slug2 = act.activity_name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '_');
        newMapping[act.id] = { activity: act, images: [] };

        let exactMatches = physicalFiles.filter(f => f.startsWith(slug1) || f.startsWith(slug2));
        if (exactMatches.length > 0) {
            newMapping[act.id].images.push(...exactMatches);
            exactMatches.forEach(f => matchedFiles.add(f));
        }
    });

    // Step 2: Strict Partial Exact Words Matching
    for (const file of physicalFiles) {
        if (!matchedFiles.has(file)) {
            for (const id in newMapping) {
                if (newMapping[id].images.length === 0) {
                    const actName = newMapping[id].activity.activity_name.toLowerCase();
                    const words = actName.split(/\s+/).filter(w => w.length > 3).map(w => w.replace(/[^a-z0-9]/g, ''));
                    // Ensure strong match: at least 2 key words exactly match
                    let matchCount = 0;
                    words.forEach(w => {
                        if (file.toLowerCase().includes(w)) matchCount++;
                    });

                    if (matchCount >= 2 || (words.length === 1 && matchCount >= 1)) {
                        newMapping[id].images.push(file);
                        matchedFiles.add(file);
                        break;
                    }
                }
            }
        }
    }

    let orphanedFiles = physicalFiles.filter(f => !matchedFiles.has(f));
    let zeroCountActs = Object.values(newMapping).filter(m => m.images.length === 0);

    console.log(`Strict Matches Found for ${activities.length - zeroCountActs.length} activities.`);
    console.log(`There are ${orphanedFiles.length} orphaned files to potentially assign to ${zeroCountActs.length} completely empty activities.`);

    fs.writeFileSync('unmapped.json', JSON.stringify({
        orphanedFiles, zeroCountActs: zeroCountActs.map(a => a.activity.activity_name)
    }, null, 2));

    console.log("Applying strict accurate mapping to DB (clearing incorrect arrays)...");
    let updatedCount = 0;
    for (const id in newMapping) {
        let relativePaths = [];
        if (newMapping[id].images.length > 0) {
            relativePaths = newMapping[id].images.map(f => `/images/activities/${f}`);
        }

        const { error } = await supabase.from('activities').update({ images: Array.from(new Set(relativePaths)) }).eq('id', id);
        if (error) console.error(`Error updating ID ${id}:`, error.message);
        else updatedCount++;
    }

    console.log(`Updated all ${updatedCount} rows total. Wiped the non-matching rows.`);
    const finalZeroImages = Object.values(newMapping).filter(m => m.images.length === 0).length;
    console.log(`Completed. However, there are still ${finalZeroImages} activities completely missing imagery because no strict match existed.`);
}

fixMapping().catch(console.error);
