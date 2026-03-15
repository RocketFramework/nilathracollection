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

// 216 (Moonstone Mine), 218 (Beruwala Gem Market), 219 (Lapidary Workshop), 221 (Vajira Lasanthi Homestay)
const updates = [
    { id: 216, images: [findFile('moonstone_mine_1_'), findFile('moonstone_mine_2_'), findFile('moonstone_mine_3_')] },
    { id: 218, images: [findFile('beruwala_gem_market_1_'), findFile('beruwala_gem_market_2_'), findFile('beruwala_gem_market_3_')] },
    { id: 219, images: [findFile('lapidary_workshop_1_'), findFile('lapidary_workshop_2_'), findFile('lapidary_workshop_3_')] },
    { id: 221, images: [findFile('homestay_experience_1_'), findFile('homestay_experience_2_'), findFile('homestay_experience_3_')] }
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
    console.log('Done Batch 7.');
}
run();
