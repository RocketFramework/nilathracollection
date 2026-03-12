const { createClient } = require('@supabase/supabase-js');
const url = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabase = createClient(url, key);

const updates = [
    {
        id: 4,
        images: [
            '/images/activities/mountain_biking_hill_country_1.png',
            '/images/activities/mountain_biking_hill_country_2.png',
            '/images/activities/mountain_biking_hill_country_3.png'
        ]
    },
    {
        id: 5,
        images: [
            '/images/activities/mountain_biking_cultural_triangle_1.png',
            '/images/activities/mountain_biking_cultural_triangle_2.png',
            '/images/activities/mountain_biking_cultural_triangle_3.png'
        ]
    },
    {
        id: 7,
        images: [
            '/images/activities/hiking_adams_peak_1.png',
            '/images/activities/hiking_adams_peak_2.png',
            '/images/activities/hiking_adams_peak_3.png'
        ]
    }
];

async function runUpdates() {
    for (const update of updates) {
        console.log(`Updating activity ID ${update.id}...`);
        const { error } = await supabase
            .from('activities')
            .update({ images: update.images })
            .eq('id', update.id);

        if (error) console.error(`Error updating ID ${update.id}:`, error.message);
        else console.log(`ID ${update.id} updated successfully.`);
    }
}

runUpdates();
