const { createClient } = require('@supabase/supabase-js');
const url = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabase = createClient(url, key);

const updates = [
    { id: 31, images: ['/images/activities/bodyboarding_bentota_1_1773403409618.png', '/images/activities/bodyboarding_bentota_2_1773403429658.png', '/images/activities/bodyboarding_bentota_3_1773403451504.png'] },
    { id: 32, images: ['/images/activities/kayaking_negombo_1_1773403471113.png', '/images/activities/kayaking_negombo_2_1773403491030.png', '/images/activities/kayaking_negombo_3_1773403509176.png'] },
    { id: 33, images: ['/images/activities/casino_ballys_colombo_1_1773403531024.png', '/images/activities/casino_ballys_colombo_2_1773403556075.png', '/images/activities/casino_ballys_colombo_3_1773403576371.png'] },
    { id: 34, images: ['/images/activities/casino_bellagio_colombo_1_1773403594514.png', '/images/activities/casino_bellagio_colombo_2_1773403612347.png', '/images/activities/casino_bellagio_colombo_3_1773403630280.png'] }
];

async function run() {
    for (const update of updates) {
        console.log(`Updating ID ${update.id}...`);
        const { error } = await supabase.from('activities').update({ images: update.images }).eq('id', update.id);
        if (error) console.error(`Error on ${update.id}:`, error);
    }
    console.log('Done 31-34.');
}
run();
