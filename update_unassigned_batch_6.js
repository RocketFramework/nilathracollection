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

// 212 (Sunken Church), 213 (Jaffna Public Library), 214 (Ratnapura Gem Mine), 215 (Gem Panning)
const updates = [
    { id: 212, images: [findFile('sunken_church_1_'), findFile('sunken_church_2_'), findFile('sunken_church_3_')] },
    { id: 213, images: [findFile('jaffna_library_1_'), findFile('jaffna_library_2_'), findFile('jaffna_library_3_')] },
    { id: 214, images: [findFile('ratnapura_gem_mine_1_'), findFile('ratnapura_gem_mine_2_'), findFile('ratnapura_gem_mine_3_')] },
    { id: 215, images: [findFile('gem_panning_1_'), findFile('gem_panning_2_'), findFile('gem_panning_3_')] }
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
    console.log('Done Batch 6.');
}
run();
