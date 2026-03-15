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

// 183 (Deepavali), 184 (Kataragama Esala Festival), 188 (Bopath Ella), 196 (Maligawila Buddha Statue)
const updates = [
    { id: 183, images: [findFile('deepavali_festival_1_'), findFile('deepavali_festival_2_'), findFile('deepavali_festival_3_')] },
    { id: 184, images: [findFile('kataragama_festival_1_'), findFile('kataragama_festival_2_'), findFile('kataragama_festival_3_')] },
    { id: 188, images: [findFile('bopath_ella_1_'), findFile('bopath_ella_2_'), findFile('bopath_ella_3_')] },
    { id: 196, images: [findFile('maligawila_buddha_1_'), findFile('maligawila_buddha_2_'), findFile('maligawila_buddha_3_')] }
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
    console.log('Done Batch 4.');
}
run();
