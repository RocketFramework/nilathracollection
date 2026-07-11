const { createClient } = require("@supabase/supabase-js");

const url = "https://vknibpdhovgcbenkcnaz.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8";

const supabase = createClient(url, key);

async function run() {
    // Let's take the first activity from check_db output:
    // ID: 1096d375-3dbb-4b16-8ead-37c574dceee8 (Overnight Stay)
    // Current Hotel ID: 19a090c3-468d-47c3-bbe1-2e5198ff6d76
    // Let's try to upsert it with Hotel ID: 50158e09-33e4-45cf-b439-7fec960f50e2
    const activityId = "1096d375-3dbb-4b16-8ead-37c574dceee8";
    const newHotelId = "50158e09-33e4-45cf-b439-7fec960f50e2";

    const { data: before } = await supabase.from("daily_activities").select("hotel_id").eq("id", activityId).single();
    console.log("Hotel ID before upsert:", before.hotel_id);

    const { error: upsertErr } = await supabase
        .from("daily_activities")
        .upsert({
            id: activityId,
            hotel_id: newHotelId
        });

    if (upsertErr) {
        console.error("Upsert failed:", upsertErr);
        return;
    }

    const { data: after } = await supabase.from("daily_activities").select("hotel_id").eq("id", activityId).single();
    console.log("Hotel ID after upsert:", after.hotel_id);
}

run();
