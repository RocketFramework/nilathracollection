const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const url = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';
const supabase = createClient(url, key);

function findFile(baseName) {
    const dir = path.join(__dirname, 'public/images/activities');
    const files = fs.readdirSync(dir);
    const matched = files.filter(f => f.startsWith(baseName) && f.endsWith('.png'));
    if (matched.length > 0) {
        return `/images/activities/${matched.sort().reverse()[0]}`;
    }
    return null;
}

// 222 (Tea Shop), 223 (Camping), 224 (Kadadora Village), 225 (Ranamune Spout)
const updates = [
    { id: 222, images: [findFile('nanda_tea_shop_1_'), findFile('nanda_tea_shop_2_'), findFile('nanda_tea_shop_3_')] },
    { id: 223, images: [findFile('kolapathana_camping_1_'), findFile('kolapathana_camping_2_'), findFile('kolapathana_camping_3_')] },
    { id: 224, images: [findFile('kadadora_village_1_'), findFile('kadadora_village_2_'), findFile('kadadora_village_3_')] },
    { id: 225, images: [findFile('ranamune_spout_1_'), findFile('ranamune_spout_2_'), findFile('ranamune_spout_3_')] }
];

async function run() {
    for (const update of updates) {
        if (update.images.includes(null)) {
            console.error(`Missing image for ID ${update.id}`, update.images);
            continue;
        }
        console.log(`Updating ID ${update.id}...`);
        const { error } = await supabase.from('activities').update({ images: update.images }).eq('id', update.id);
        if (error) console.error(`Error on ${update.id}:`, error);
    }
    console.log('Done Batch 8.');
}
run();
