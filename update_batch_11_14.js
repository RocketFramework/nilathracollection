const { createClient } = require('@supabase/supabase-js');
const url = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabase = createClient(url, key);

const updates = [
    { id: 11, images: ['/images/activities/hiking_pidurangala_1.png', '/images/activities/hiking_pidurangala_2.png', '/images/activities/hiking_pidurangala_3.png'] },
    { id: 12, images: ['/images/activities/climbing_bambaragala_1.png', '/images/activities/climbing_bambaragala_2.png', '/images/activities/climbing_bambaragala_3.png'] },
    { id: 13, images: ['/images/activities/ziplining_dambulla_1.png', '/images/activities/ziplining_dambulla_2.png', '/images/activities/ziplining_dambulla_3.png'] },
    { id: 14, images: ['/images/activities/safari_knuckles_4wd_1.png', '/images/activities/safari_knuckles_4wd_2.png', '/images/activities/safari_knuckles_4wd_3.png'] }
];

async function run() {
    for (const update of updates) {
        console.log(`Updating ID ${update.id}...`);
        const { error } = await supabase.from('activities').update({ images: update.images }).eq('id', update.id);
        if (error) console.error(`Error on ${update.id}:`, error);
    }
}
run();
