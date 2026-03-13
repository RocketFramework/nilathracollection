const { createClient } = require('@supabase/supabase-js');
const url = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabase = createClient(url, key);

const updates = [
    { id: 19, images: ['/images/activities/relaxing_mirissa_1.png', '/images/activities/relaxing_mirissa_2.png', '/images/activities/relaxing_mirissa_3.png'] },
    { id: 20, images: ['/images/activities/swimming_unawatuna_1.png', '/images/activities/swimming_unawatuna_2.png', '/images/activities/swimming_unawatuna_3.png'] },
    { id: 21, images: ['/images/activities/snorkeling_pigeon_island_1.png', '/images/activities/snorkeling_pigeon_island_2.png', '/images/activities/snorkeling_pigeon_island_3.png'] },
    { id: 22, images: ['/images/activities/east_coast_beaches_1.png', '/images/activities/east_coast_beaches_2.png', '/images/activities/east_coast_beaches_3.png'] }
];

async function run() {
    for (const update of updates) {
        console.log(`Updating ID ${update.id}...`);
        const { error } = await supabase.from('activities').update({ images: update.images }).eq('id', update.id);
        if (error) console.error(`Error on ${update.id}:`, error);
    }
}
run();
