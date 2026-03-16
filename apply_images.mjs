import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const artifactDir = '/home/nirosh/.gemini/antigravity/brain/16583dca-16b3-4383-8f29-fdd7696476a2';
const destDir = '/home/nirosh/Code/NilathraCollection/public/images/activities';

const activities = [
    { id: 174, file: 'spice_garden_matale_1773637892384.png', name: 'spice_garden_matale.png' },
    { id: 227, file: 'meemure_village_1773637912993.png', name: 'meemure_village.png' },
    { id: 231, file: 'belihuloya_nature_1773637930518.png', name: 'belihuloya_nature.png' },
    { id: 232, file: 'madulsima_exploration_1773637949768.png', name: 'madulsima_exploration.png' },
    { id: 234, file: 'kalpitiya_kayaking_1773637964953.png', name: 'kalpitiya_kayaking.png' },
    { id: 235, file: 'koggala_lagoon_1773637982087.png', name: 'koggala_lagoon.png' },
    { id: 246, file: 'ritigala_monastery_1773638002672.png', name: 'ritigala_monastery.png' },
    { id: 248, file: 'nine_skies_bungalow_1773638043778.png', name: 'nine_skies_bungalow.png' },
    { id: 254, file: 'maligawila_buddha_1773638060947.png', name: 'maligawila_buddha.png' },
    { id: 259, file: 'negombo_lagoon_1773638079872.png', name: 'negombo_lagoon.png' },
    { id: 260, file: 'yapahuwa_fortress_1773638101286.png', name: 'yapahuwa_fortress.png' },
    { id: 261, file: 'panduwasnuwara_city_1773638118794.png', name: 'panduwasnuwara_city.png' },
    { id: 262, file: 'dedigama_site_1773638135279.png', name: 'dedigama_site.png' },
    { id: 263, file: 'kirinda_viharaya_1773638149218.png', name: 'kirinda_viharaya.png' }
];

async function updateAll() {
    for (const act of activities) {
        const src = path.join(artifactDir, act.file);
        const dest = path.join(destDir, act.name);

        try {
            if (fs.existsSync(src)) {
                fs.copyFileSync(src, dest);
                console.log(`Copied ${act.file} to ${act.name}`);
            } else {
                console.error(`File not found: ${src}`);
                continue;
            }
        } catch (e) {
            console.error(`Failed to copy ${act.file}:`, e);
            continue;
        }

        const { error } = await supabase
            .from('activities')
            .update({ images: [`/images/activities/${act.name}`] })
            .eq('id', act.id);

        if (error) {
            console.error(`Failed to update DB for activity ${act.id}:`, error);
        } else {
            console.log(`Updated DB for activity ${act.id} with /images/activities/${act.name}`);
        }
    }
}

updateAll();
