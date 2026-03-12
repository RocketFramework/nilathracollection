const { createClient } = require('@supabase/supabase-js');
const url = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabase = createClient(url, key);

async function fetchBatch() {
    console.log("Fetching activities with IDs 2 to 10...");
    const { data, error } = await supabase
        .from('activities')
        .select('id, activity_name, description')
        .gte('id', 2)
        .lte('id', 10);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Results:", JSON.stringify(data, null, 2));
    }
}

fetchBatch();
