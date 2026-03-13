const { createClient } = require('@supabase/supabase-js');
const url = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabase = createClient(url, key);

const updates = [
    { id: 27, images: ['/images/activities/swimming_nilaveli_1_1773399685113.png', '/images/activities/swimming_nilaveli_2_1773399703970.png', '/images/activities/swimming_nilaveli_3_1773399722233.png'] },
    { id: 28, images: ['/images/activities/turtle_watching_kosgoda_1_1773399740265.png', '/images/activities/turtle_watching_kosgoda_2_1773399760337.png', '/images/activities/turtle_watching_kosgoda_3_1773399777704.png'] },
    { id: 29, images: ['/images/activities/beach_hopping_south_cross_1_1773399795976.png', '/images/activities/beach_hopping_south_cross_2_1773399813302.png', '/images/activities/beach_hopping_south_cross_3_1773399833740.png'] },
    { id: 30, images: ['/images/activities/snorkeling_hikkaduwa_1_1773399855803.png', '/images/activities/snorkeling_hikkaduwa_2_1773399883849.png', '/images/activities/snorkeling_hikkaduwa_3_1773399902372.png'] }
];

async function run() {
    for (const update of updates) {
        console.log(`Updating ID ${update.id}...`);
        const { error } = await supabase.from('activities').update({ images: update.images }).eq('id', update.id);
        if (error) console.error(`Error on ${update.id}:`, error);
    }
    console.log('Done 27-30.');
}
run();
