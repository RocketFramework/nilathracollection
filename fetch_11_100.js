const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const url = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabase = createClient(url, key);

async function fetchBatch() {
    console.log("Fetching activities with IDs 11 to 100...");
    const { data, error } = await supabase
        .from('activities')
        .select('id, activity_name, category, location_name, description')
        .gte('id', 11)
        .lte('id', 100)
        .order('id', { ascending: true });

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Fetched ${data.length} activities.`);
        fs.writeFileSync('activities_11_100.json', JSON.stringify(data, null, 2));
        console.log("Successfully saved to activities_11_100.json");
    }
}

fetchBatch();
