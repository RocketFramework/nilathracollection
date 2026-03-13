const { createClient } = require('@supabase/supabase-js');
const url = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabase = createClient(url, key);

const updates = [
    { id: 23, images: ['/images/activities/galle_face_sunset_1_1773388064439.png', '/images/activities/galle_face_sunset_2_1773388081159.png', '/images/activities/galle_face_sunset_3_1773388098169.png'] },
    { id: 24, images: ['/images/activities/galle_fort_ramparts_1_1773388116371.png', '/images/activities/galle_fort_ramparts_2_1773388132454.png', '/images/activities/galle_fort_ramparts_3_1773388147790.png'] },
    { id: 25, images: ['/images/activities/surfing_hiriketiya_1_1773388164565.png', '/images/activities/surfing_hiriketiya_2_1773388180893.png', '/images/activities/surfing_hiriketiya_3_1773388194350.png'] },
    { id: 26, images: ['/images/activities/diving_trincomalee_1_1773388212487.png', '/images/activities/diving_trincomalee_2_1773388227754.png', '/images/activities/diving_trincomalee_3_1773388247098.png'] }
];

async function run() {
    for (const update of updates) {
        console.log(`Updating ID ${update.id}...`);
        const { error } = await supabase.from('activities').update({ images: update.images }).eq('id', update.id);
        if (error) console.error(`Error on ${update.id}:`, error);
    }
    console.log('Done 23-26.');
}
run();
