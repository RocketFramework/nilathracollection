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

const mappingDict = {
    "Visiting Jami Ul-Alfar Mosque": "jami_ul_alfar_mosque",
    "Exploring the Jaffna Fort": "jaffna_fort",
    "Exploring the Koneswaram Temple": "koneswaram_temple",
    "Enjoying a Beachfront Seafood Barbecue (Mirissa)": "seafood_beach_mirissa",
    "Learning to Make Hoppers (Colombo)": "local_eatery",
    "Learning to Make Hoppers (Galle)": "local_eatery_galle",
    "Jeep Safari in Udawalawe National Park": "yala_safari",
    "Whale Watching in Mirissa": "whale_watching_mirissa",
    "Visiting a Turtle Hatchery (Bentota)": "turtle_watching_kosgoda",
    "Boat Safari in Gal Oya National Park": "gal_oya",
    "Bird Watching in Bundala National Park": "minneriya_gathering",
    "Exploring Wilpattu National Park": "yala_safari",
    "Visiting Ravana Falls": "bopath_ella",
    "Bird Watching at Kumana National Park": "minneriya",
    "Swimming with Whales (Adventurer's Choice)": "whale_watching_mirissa",
    "Sacred City of Anuradhapura": "ancient_anuradhapura",
    "Munneswaram Temple": "pooja_hindu_temple",
    "Udawalawe National Park Safari": "safari_knuckles_4wd",
    "Minneriya National Park Safari": "minneriya_gathering",
    "Wilpattu National Park Safari": "yala_safari",
    "Bundala National Park Safari": "minneriya",
    "Kumana National Park Safari": "yala_safari",
    "Turtle Conservation Project Visit": "turtle_watching",
    "Ridiyagama Safari Park": "safari",
    "Surfing at Hikkaduwa": "snorkeling_hikkaduwa",
    "Mirissa Beach Relaxation": "relaxing_mirissa",
    "Bentota Beach Water Sports": "bodyboarding_bentota",
    "Pasikudah Beach": "beach_hopping",
    "Kitesurfing at Kalpitiya": "kalpitiya",
    "Dolphin Watching Kalpitiya": "kalpitiya",
    "Horton Plains and World's End Trek": "hiking_diyaluma",
    "Knuckles Mountain Range Trek": "climbing_bambaragala",
    "Ravana Falls Visit": "bambarakanda_falls",
    "Belihuloya Mountain Trekking": "kolapathana",
    "Namunukula Peak Trek": "hiking_little_adams_peak",
    "Mackwoods Tea Factory Tour": "tea_tasting_nuwara_eliya",
    "Pedro Tea Estate Visit": "tea_tasting_nuwara_eliya",
    "Blue Field Tea Factory Tour": "tea_tasting_ella",
    "Dambatenne Tea Factory Tour": "tea_tasting_ella",
    "Handunugoda Tea Estate": "nanda_tea_shop",
    "Tea Plucking Experience": "tea",
    "Colombo to Galle Coastal Train": "scenic_train",
    "Tea Tasting Experience": "tea_tasting",
    "Ayurvedic Massage Treatment": "spice_garden",
    "Yoga Retreat Session": "relaxing",
    "Ayurvedic Consultation": "spice_garden",
    "Herbal Steam Bath": "spice",
    "Meditation at Buddhist Temple": "temple_of_the_tooth",
    "Deepavali Celebrations": "deepavali",
    "Devon Falls Visit": "bambarakanda",
    "St. Clair's Falls Visit": "ranamune_spout",
    "Laxapana Falls Visit": "ranamune_spout",
    "Dunhinda Falls Visit": "bopath_ella",
    "Gem Museum Visit": "lapidary_workshop",
    "Martin Wickramasinghe Museum": "national_museum",
    "Anuradhapura Archaeological Museum": "ancient_anuradhapura",
    "Buduruwagala Ancient Statues": "gal_vihara",
    "Maduru Oya National Park": "safari",
    "Gal Oya National Park Boat Safari": "gal_oya",
    "Mulkirigala Rock Temple": "dambulla_cave",
    "Lunugamvehera National Park": "yala",
    "Wasgamuwa National Park": "minneriya",
    "Nagadeepa Temple": "pooja_hindu_temple",
    "Thirukketheeswaram Temple": "pooja_hindu_temple",
    "Naguleswaram Temple & Keerimalai Springs": "pooja_hindu_temple",
    "Chundikkulam National Park": "safari",
    "Gem Panning Experience": "gem_panning",
    "Gem Museum & Cutting Demonstration": "lapidary",
    "Aberdeen Falls Trek": "hiking",
    "Lakegala Rock Trek": "climbing",
    "Kalpitiya Kitesurfing": "kalpitiya",
    "Martin Wickramasinghe Folk Museum": "national_museum",
    "Kelaniya Raja Maha Viharaya": "gangaramaya",
    "Matara Forts Exploration": "galle_fort",
    "Gal Oya Boat Safari": "gal_oya",
    "Ritigala Forest Monastery": "kudumbigala",
    "Demodara Loop Hike": "ella_rock",
    "Diyaluma Falls Natural Pools": "hiking_diyaluma",
    "Lipton's Seat Viewpoint": "kandy_view_point",
    "Ulpotha Yoga Retreat": "relaxing",
    "Eagles Crest Wellness Stay": "relaxing",
    "Madu Ganga Boat Safari": "muthurajawela_boat",
    "Bentota River Safari": "muthurajawela_boat"
};

async function applyManualMapping() {
    const unmappedData = JSON.parse(fs.readFileSync('unmapped.json', 'utf8'));
    const orphanedFiles = unmappedData.orphanedFiles;

    console.log("Applying manual mapping rules...");
    const { data: activities, error } = await supabase.from('activities').select('*');
    if (error) throw error;

    let updatedCount = 0;

    for (const act of activities) {
        if (!unmappedData.zeroCountActs.includes(act.activity_name)) continue;

        let prefix = mappingDict[act.activity_name];
        if (!prefix) {
            // Find a highly matching keyword fallback manually
            let bestMatches = orphanedFiles.filter(f => f.includes(act.activity_name.toLowerCase().split(' ')[0]));
            if (bestMatches.length > 0) {
                prefix = act.activity_name.toLowerCase().split(' ')[0];
            }
        }

        if (prefix) {
            let matched = orphanedFiles.filter(f => f.includes(prefix));
            if (matched.length === 0) {
                // fallback if generic prefix
                matched = orphanedFiles.filter(f => f.includes(prefix.split('_')[0]));
            }

            if (matched.length > 0) {
                // take up to 3
                let finalImages = matched.slice(0, Math.min(3, matched.length)).map(f => `/images/activities/${f}`);
                const { error: upErr } = await supabase.from('activities').update({ images: finalImages }).eq('id', act.id);
                if (upErr) console.error(`Error ${act.activity_name}:`, upErr.message);
                else {
                    console.log(`Mapped ${act.activity_name} -> ${finalImages.length} images`);
                    updatedCount++;
                }
            } else {
                console.log(`Still no file matched for ${act.activity_name} using prefix ${prefix}`);
            }
        }
    }

    console.log(`Successfully hard-mapped ${updatedCount} out of ${unmappedData.zeroCountActs.length} unassigned activities!`);
}

applyManualMapping().catch(console.error);
