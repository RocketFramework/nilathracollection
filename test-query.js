const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const tourId = '82b0e849-6450-4960-8c3b-3291e6bcb2d1';
    
    // Check tour itineraries
    const { data: itins, error: itinsErr } = await supabase
        .from('tour_itineraries')
        .select('*')
        .eq('tour_id', tourId)
        .order('day_number', { ascending: true });
        
    console.log("Tour Itineraries for 82b0e849:", itins?.map(i => i.day_number));
    
    if (itinsErr) console.log("Itins err:", itinsErr);

    const { data: acts, error: actsErr } = await supabase
        .from('daily_activities')
        .select('*')
        .in('itinerary_id', itins?.map(i => i.id) || []);
        
    console.log(`Found ${acts?.length || 0} activities in total for this tour.`);

    // Check planner data from tours
    const { data: tour, error: tourErr } = await supabase
        .from('tours')
        .select('id, request_id, planner_data')
        .eq('id', tourId)
        .single();
        
    if (tourErr) console.log("Tour err:", tourErr);
        
    if (tour && tour.planner_data && tour.planner_data.itinerary) {
        console.log(`Planner Data has ${tour.planner_data.itinerary.length} blocks.`);
        const day1Blocks = tour.planner_data.itinerary.filter(b => b.dayNumber === 1);
        console.log("Day 1 block IDs:", day1Blocks.map(b => b.id));
    } else {
        console.log("No planner_data itinerary found.");
    }
}
run();
