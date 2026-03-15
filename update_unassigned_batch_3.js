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

// 166 (Kandy View Point), 167 (Jaffna Market), 181 (Sinhala Tamil New Year), 182 (Vesak Festival)
const updates = [
    { id: 166, images: [findFile('kandy_view_point_1_'), findFile('kandy_view_point_2_'), findFile('kandy_view_point_3_')] },
    { id: 167, images: [findFile('jaffna_market_1_'), findFile('jaffna_market_2_'), findFile('jaffna_market_3_')] },
    { id: 181, images: [findFile('sinhala_new_year_1_'), findFile('sinhala_new_year_2_'), findFile('sinhala_new_year_3_')] },
    { id: 182, images: [findFile('vesak_festival_1_'), findFile('vesak_festival_2_'), findFile('vesak_festival_3_')] }
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
    console.log('Done Batch 3.');
}
run();
