const { createClient } = require("@supabase/supabase-js");

const url = "https://vknibpdhovgcbenkcnaz.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8";

const supabase = createClient(url, key);

async function check() {
    // 1. Get the most recently updated tour
    const { data: tours, error: tourErr } = await supabase
        .from("tours")
        .select("id, title, updated_at")
        .order("updated_at", { ascending: false })
        .limit(1);

    if (tourErr || !tours || tours.length === 0) {
        console.error("Error fetching tours:", tourErr);
        return;
    }

    const tour = tours[0];
    console.log(`Most recent tour: ${tour.title} (ID: ${tour.id}), Updated at: ${tour.updated_at}`);

    // 2. Fetch daily_activities for this tour
    const { data: activities, error: actErr } = await supabase
        .from("daily_activities")
        .select("id, title, activity_type, hotel_id, itinerary_id")
        .eq("tour_id", tour.id);

    if (actErr) {
        console.error("Error fetching activities:", actErr);
        return;
    }

    console.log("\nDaily Activities in DB:");
    activities.forEach(act => {
        console.log(`- ID: ${act.id} | Type: ${act.activity_type} | Hotel ID: ${act.hotel_id} | Title: ${act.title}`);
    });

    // 3. Fetch tour_itineraries in DB
    const { data: itineraries, error: itinErr } = await supabase
        .from("tour_itineraries")
        .select("id, day_number, hotel_id")
        .eq("tour_id", tour.id);

    if (itinErr) {
        console.error("Error fetching itineraries:", itinErr);
        return;
    }

    console.log("\nTour Itineraries in DB:");
    itineraries.forEach(itin => {
        console.log(`- ID: ${itin.id} | Day: ${itin.day_number} | Hotel ID: ${itin.hotel_id}`);
    });
}

check();
