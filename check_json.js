import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data: tour } = await supabase.from('tours').select('planner_data').eq('id', 'b2e4ac04-a37e-41d4-9342-f2982b860be4').single();
    if (tour && tour.planner_data) {
        console.log("Itinerary block count in JSON:", tour.planner_data.itinerary?.length);
        const lunchBlocks = tour.planner_data.itinerary?.filter(b => b.type === 'meal');
        console.log("Lunch blocks in JSON:", lunchBlocks?.map(b => b.name));
    } else {
        console.log("No planner_data found.");
    }
}
run();
