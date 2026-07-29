const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';
  
  // 1. Fetch tour_itineraries for this tour
  const { data: itins } = await supabase
    .from('tour_itineraries')
    .select('id, day_number, date, title')
    .eq('tour_id', tourId)
    .order('day_number', { ascending: true });
    
  console.log("=== TOUR ITINERARIES ===");
  console.table(itins);
  
  // 2. Fetch daily_activities for this tour
  const { data: activities } = await supabase
    .from('daily_activities')
    .select('id, title, activity_type, itinerary_id, service_date, price_finalized, hotel_id, vendor_id, restaurant_id, tour_itineraries(day_number, date)')
    .eq('tour_id', tourId);
    
  console.log("\n=== PRICE FINALIZED ACTIVITIES ===");
  const finalized = (activities || []).filter(a => a.price_finalized === true);
  console.table(finalized.map(a => ({
    id: a.id,
    title: a.title,
    type: a.activity_type,
    itinerary_id: a.itinerary_id,
    day_number: a.tour_itineraries?.day_number,
    service_date: a.service_date,
    price_finalized: a.price_finalized
  })));
  
  // 3. Fetch po_block_daily_activities and po_blocks for this tour
  const { data: poBlocks } = await supabase
    .from('po_blocks')
    .select('id, name, block_type, has_finalized, po_block_daily_activities(daily_activity_id)')
    .eq('tour_id', tourId);
    
  console.log("\n=== PO BLOCKS & LINKED ACTIVITIES ===");
  console.log(JSON.stringify(poBlocks, null, 2));
}

inspect().catch(console.error);
