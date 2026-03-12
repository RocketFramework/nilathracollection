const { createClient } = require('@supabase/supabase-js');
const url = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabase = createClient(url, key);

async function updateKnuckles() {
    const images = [
        '/images/activities/hiking_knuckles_range_1.png',
        '/images/activities/hiking_knuckles_range_2.png'
    ];
    console.log("Updating activity ID 8...");
    const { error } = await supabase.from('activities').update({ images }).eq('id', 8);
    if (error) console.error(error.message);
    else console.log("ID 8 updated.");
}

updateKnuckles();
