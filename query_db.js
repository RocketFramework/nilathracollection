import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data: tourDays } = await supabase.from('tour_itineraries').select('id, tour_id').eq('tour_id', 'b2e4ac04-a37e-41d4-9342-f2982b860be4');
    console.log("Tour Days:", tourDays);
    const dayIds = tourDays.map(d => d.id);
    if (dayIds.length > 0) {
        const { data: acts } = await supabase.from('daily_activities').select('id, itinerary_id, activity_id, name').in('itinerary_id', dayIds);
        console.log("Valid Activities Count:", acts?.length);
    }
    
    const { data: missingAct } = await supabase.from('daily_activities').select('*').eq('id', '3b12d51b-cde1-414c-a2d1-e7c4d9aa4248');
    console.log("Missing Act:", missingAct);
}
run();
