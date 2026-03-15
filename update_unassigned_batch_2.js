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

const updates = [
    { id: 159, images: [findFile('colombo_city_tour_1_'), findFile('colombo_city_tour_2_'), findFile('colombo_city_tour_3_')] },
    { id: 163, images: [findFile('viharamahadevi_park_1_'), findFile('viharamahadevi_park_2_'), findFile('viharamahadevi_park_3_')] },
    { id: 164, images: [findFile('independence_square_1_'), findFile('independence_square_2_'), findFile('independence_square_3_')] },
    { id: 165, images: [findFile('kandy_lake_walk_1_'), findFile('kandy_lake_walk_2_'), findFile('kandy_lake_walk_3_')] }
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
    console.log('Done Batch 2.');
}
run();
