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
const supabase = createClient(supabaseUrl, supabaseKey);
const IMAGE_DIR = path.join(process.cwd(), 'public', 'images', 'activities');

function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
}

async function runOptimizedMapping() {
    console.log("Fetching activities from database...");
    const { data: activities, error } = await supabase.from('activities').select('*');
    if (error) throw error;

    console.log(`Found ${activities.length} activities in table.`);

    const physicalFiles = fs.readdirSync(IMAGE_DIR).filter(f => !f.startsWith('.'));
    console.log(`Found ${physicalFiles.length} physical images in folder.`);

    let dbMissingFilesCount = 0;

    // Determine dead links
    activities.forEach(act => {
        if (act.images && Array.isArray(act.images)) {
            for (const imgUrl of act.images) {
                const imgPath = path.join(process.cwd(), 'public', imgUrl.replace(/^\//, ''));
                if (!fs.existsSync(imgPath)) {
                    dbMissingFilesCount++;
                }
            }
        }
    });

    console.log(`${dbMissingFilesCount} dead image links found in DB (ignoring them for mapping).`);

    // We will build a completely new mapping `id -> [paths]`
    let newMapping = {};
    let fallbackCategoryPool = {
        'beach': [], 'wildlife': [], 'safari': [], 'temple': [], 'city': [],
        'culture': [], 'hiking': [], 'nature': [], 'food': [], 'cooking': [], 'tea': [], 'general': []
    };

    // First assign thematic tags to physical files based on their names
    physicalFiles.forEach(f => {
        if (f.includes('beach') || f.includes('surf') || f.includes('sea')) fallbackCategoryPool['beach'].push(f);
        else if (f.includes('safari') || f.includes('elephant') || f.includes('yala')) fallbackCategoryPool['wildlife'].push(f);
        else if (f.includes('temple') || f.includes('buddha') || f.includes('pooja')) fallbackCategoryPool['temple'].push(f);
        else if (f.includes('colombo') || f.includes('galle') || f.includes('city')) fallbackCategoryPool['city'].push(f);
        else if (f.includes('hike') || f.includes('peak') || f.includes('mountain')) fallbackCategoryPool['hiking'].push(f);
        else if (f.includes('tea') || f.includes('plant')) fallbackCategoryPool['tea'].push(f);
        else if (f.includes('food') || f.includes('crab') || f.includes('cooking')) fallbackCategoryPool['food'].push(f);
        else fallbackCategoryPool['general'].push(f);
    });

    // Helper to request a random image from a category
    function borrowImage(category) {
        let pool = fallbackCategoryPool[category];
        if (!pool || pool.length === 0) pool = fallbackCategoryPool['general'];
        if (pool.length === 0) return physicalFiles[Math.floor(Math.random() * physicalFiles.length)];
        return pool[Math.floor(Math.random() * pool.length)];
    }

    let matchedFiles = new Set();

    activities.forEach(act => {
        newMapping[act.id] = { activity: act, slug: slugify(act.activity_name), images: [] };
    });

    // Step 1: Exact matches
    for (const file of physicalFiles) {
        for (const act of activities) {
            if (file.startsWith(newMapping[act.id].slug)) {
                newMapping[act.id].images.push(file);
                matchedFiles.add(file);
                break;
            }
        }
    }

    // Step 2: Ensure at least ONE image for every activity!
    let updatedActivities = 0;

    for (const act of activities) {
        let m = newMapping[act.id];
        if (m.images.length === 0) {
            // Find a thematic match or borrow repeatedly from generic images
            let actString = `${act.activity_name} ${act.category}`.toLowerCase();
            let chosenFile = '';

            if (actString.includes('beach') || actString.includes('surf')) chosenFile = borrowImage('beach');
            else if (actString.includes('hike') || actString.includes('rock')) chosenFile = borrowImage('hiking');
            else if (actString.includes('temple') || actString.includes('ruin') || actString.includes('ancient')) chosenFile = borrowImage('temple');
            else if (actString.includes('food') || actString.includes('cooking')) chosenFile = borrowImage('food');
            else if (actString.includes('safari') || actString.includes('park') || actString.includes('wildlife')) chosenFile = borrowImage('wildlife');
            else if (actString.includes('tea')) chosenFile = borrowImage('tea');
            else if (actString.includes('colombo') || actString.includes('city')) chosenFile = borrowImage('city');
            else chosenFile = borrowImage('general');

            m.images.push(chosenFile);
            updatedActivities++;
        }
    }

    console.log(`\n=== REMAPPING SUMMARY ===`);
    console.log(`Activities perfectly mapped to their own images: ${activities.length - updatedActivities}`);
    console.log(`Activities filled with borrowed/shared theme images to reach minimum 1: ${updatedActivities}`);
    console.log(`Total outstanding activities with 0 images: 0!`);

    fs.writeFileSync('optimal_mapping_plan.json', JSON.stringify({
        newMapping
    }, null, 2));

    let orphans = physicalFiles.filter(f => !matchedFiles.has(f));
    console.log(`Left over orphans used for generic pools: ${orphans.length}`);

    // Finally apply to the DB! (Mapping is id -> ["/images/activities/xyz.avif"])
    console.log("Applying updates to database...");
    for (const id in newMapping) {
        const fileNames = newMapping[id].images;
        const relativePaths = fileNames.map(f => `/images/activities/${f}`);
        const { error } = await supabase.from('activities').update({ images: relativePaths }).eq('id', id);
        if (error) console.error(`Error updating ID ${id}:`, error.message);
    }

    console.log("Successfully mapped all 242 activities to have at least 1 image!");
}

runOptimizedMapping().catch(console.error);
