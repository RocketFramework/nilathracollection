const { createClient } = require('@supabase/supabase-js');
const url = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabase = createClient(url, key);

const updates = [
    { id: 71, images: ['/images/activities/local_eatery_galle_1_1773413683843.png', '/images/activities/local_eatery_galle_2_1773413704144.png', '/images/activities/local_eatery_galle_3_1773413724826.png'] },
    { id: 72, images: ['/images/activities/spice_garden_matale_1_1773413753237.png', '/images/activities/spice_garden_matale_2_1773413776136.png', '/images/activities/spice_garden_matale_3_1773413794921.png'] },
    { id: 73, images: ['/images/activities/king_coconut_south_coast_1_1773413817031.png', '/images/activities/king_coconut_south_coast_2_1773413837422.png', '/images/activities/king_coconut_south_coast_3_1773413862570.png'] },
    { id: 74, images: ['/images/activities/jaffna_crab_curry_1_1773413880691.png', '/images/activities/jaffna_crab_curry_2_1773413904460.png', '/images/activities/jaffna_crab_curry_3_1773413927592.png'] }
];

async function run() {
    for (const update of updates) {
        console.log(`Updating ID ${update.id}...`);
        const { error } = await supabase.from('activities').update({ images: update.images }).eq('id', update.id);
        if (error) console.error(`Error on ${update.id}:`, error);
    }
    console.log('Done 71-74.');
}
run();
