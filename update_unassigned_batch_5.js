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

// 201 (Kudumbigala Monastery), 205 (KayaMai Mountain Biking), 208 (Mannar Island Discovery), 209 (Delft Island Ferry Trip)
const updates = [
    { id: 201, images: [findFile('kudumbigala_monastery_1_'), findFile('kudumbigala_monastery_2_'), findFile('kudumbigala_monastery_3_')] },
    { id: 205, images: [findFile('kayamai_mountain_biking_1_'), findFile('kayamai_mountain_biking_2_'), findFile('kayamai_mountain_biking_3_')] },
    { id: 208, images: [findFile('mannar_island_discovery_1_'), findFile('mannar_island_discovery_2_'), findFile('mannar_island_discovery_3_')] },
    { id: 209, images: [findFile('delft_island_ferry_1_'), findFile('delft_island_ferry_2_'), findFile('delft_island_ferry_3_')] }
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
    console.log('Done Batch 5.');
}
run();
