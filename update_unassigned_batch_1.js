const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const url = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8'; const supabase = createClient(url, key);

// Function to find the exact filename with timestamp
function findFile(baseName) {
    const dir = path.join(__dirname, 'public/images/activities');
    const files = fs.readdirSync(dir);
    const matched = files.filter(f => f.startsWith(baseName) && f.endsWith('.png'));
    if (matched.length > 0) {
        // Return latest if multiple
        return `/images/activities/${matched.sort().reverse()[0]}`;
    }
    return null;
}

const updates = [
    { id: 83, images: [findFile('minneriya_gathering_1_'), findFile('minneriya_gathering_2_'), findFile('minneriya_gathering_3_')] },
    { id: 93, images: [findFile('elephant_transit_home_1_'), findFile('elephant_transit_home_2_'), findFile('elephant_transit_home_3_')] },
    { id: 94, images: [findFile('rafting_kelani_1_'), findFile('rafting_kelani_2_'), findFile('rafting_kelani_3_')] },
    { id: 121, images: [findFile('pinnawala_orphanage_1_'), findFile('pinnawala_orphanage_2_'), findFile('pinnawala_orphanage_3_')] }
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
    console.log('Done Batch 1.');
}
run();
