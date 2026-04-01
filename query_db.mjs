import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const tourId = '82b0e849-6450-4960-8c3b-3291e6bcb2d1';
    
    // Check tour itineraries
    const { data: itins, error: itinsErr } = await supabase
        .from('tour_itineraries')
        .select('*')
        .eq('tour_id', tourId)
        .order('day_number', { ascending: true });
        
    console.log("Tour Itineraries:", JSON.stringify(itins, null, 2));
    
    // Check planner data from tours
    const { data: tour, error: tourErr } = await supabase
        .from('tours')
        .select('id, request_id, planner_data')
        .eq('id', tourId)
        .single();
        
    if (tour && tour.planner_data && tour.planner_data.itinerary) {
        console.log("Planner Data Blocks for Day 1:");
        const day1Blocks = tour.planner_data.itinerary.filter(b => b.dayNumber === 1);
        console.log(JSON.stringify(day1Blocks, null, 2));
    }
}
run();
