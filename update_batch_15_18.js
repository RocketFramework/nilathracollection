const { createClient } = require('@supabase/supabase-js');
const url = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabase = createClient(url, key);

const updates = [
    { id: 15, images: ['/images/activities/train_ride_ella_1.png', '/images/activities/train_ride_ella_2.png', '/images/activities/train_ride_ella_3.png'] },
    { id: 16, images: ['/images/activities/hiking_diyaluma_1.png', '/images/activities/hiking_diyaluma_2.png', '/images/activities/hiking_diyaluma_3.png'] },
    { id: 17, images: ['/images/activities/surfing_weligama_1.png', '/images/activities/surfing_weligama_2.png', '/images/activities/surfing_weligama_3.png'] },
    { id: 18, images: ['/images/activities/surfing_arugam_bay_1.png', '/images/activities/surfing_arugam_bay_2.png', '/images/activities/surfing_arugam_bay_3.png'] }
];

async function run() {
    for (const update of updates) {
        console.log(`Updating ID ${update.id}...`);
        const { error } = await supabase.from('activities').update({ images: update.images }).eq('id', update.id);
        if (error) console.error(`Error on ${update.id}:`, error);
    }
}
run();
