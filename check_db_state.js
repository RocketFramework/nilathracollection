import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const tourId = 'b2e4ac04-a37e-41d4-9342-f2982b860be4';
    console.log("Checking Tour ID:", tourId);

    const { data: acts, error: e1 } = await supabase.from('daily_activities').select('id, name').eq('tour_id', tourId);
    console.log(`Currently there are ${acts?.length || 0} daily activities for this tour.`);
    
    const { data: tour, error: e2 } = await supabase.from('tours').select('planner_data').eq('id', tourId).single();
    if (tour && tour.planner_data) {
        console.log(`Currently there are ${tour.planner_data.itinerary?.length || 0} blocks in planner_data.itinerary.`);
        
        // Count lunches
        const lunches = tour.planner_data.itinerary?.filter(b => b.type === 'meal');
        console.log("Lunch blocks in JSON:", lunches?.map(b => b.name));
    }
}
run();
