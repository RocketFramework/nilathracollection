const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const url = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8'; const supabase = createClient(url, key);

const assigned = JSON.parse(fs.readFileSync('assigned_activities_75_258.json', 'utf8'));

// To prevent making 127 individual requests at once, let's process in small batches
async function run() {
    let successCount = 0;

    // Add fruit market manually since I copied it over
    assigned.push({
        id: 75,
        name: "Visiting a Local Fruit Market (Colombo Pettah)",
        images: ["/images/activities/fruit_market_pettah_1_1773414123324.png", "/images/activities/fruit_market_pettah_2_1773414143006.png", "/images/activities/fruit_market_pettah_3_1773414162392.png"]
    });

    for (let i = 0; i < assigned.length; i++) {
        const item = assigned[i];
        const { error } = await supabase.from('activities').update({ images: item.images }).eq('id', item.id);
        if (error) {
            console.error(`Error on ID ${item.id}:`, error);
        } else {
            successCount++;
            if (i % 20 === 0) console.log(`Processed ${i} of ${assigned.length}`);
        }
    }
    console.log(`Successfully updated ${successCount} activities out of ${assigned.length}`);
}

run();
