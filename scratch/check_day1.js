const { createClient } = require("@supabase/supabase-js");

const url = "https://vknibpdhovgcbenkcnaz.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8";

const supabase = createClient(url, key);

async function run() {
    const tourId = "9bfb345a-da5d-443a-8644-90148b0b3a5a";
    
    const { data: tour, error } = await supabase
        .from('tours')
        .select('planner_data')
        .eq('id', tourId)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    const tripData = tour.planner_data;
    const day1Acc = tripData.accommodations?.find(a => a.nightIndex === 1);
    console.log("Day 1 Accommodation in Planner Data:");
    console.log(JSON.stringify(day1Acc, null, 2));
}

run();
