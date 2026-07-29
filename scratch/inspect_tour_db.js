const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';
  
  // 1. Get tour planner_data
  const { data: tour } = await supabase.from('tours').select('planner_data').eq('id', tourId).single();
  if (tour && tour.planner_data) {
    console.log("=== PLANNER DATA SLEEP BLOCKS ===");
    const sleepBlocks = (tour.planner_data.itinerary || []).filter(b => b.type === 'sleep');
    console.log(JSON.stringify(sleepBlocks.map(b => ({ id: b.id, name: b.name, dayNumber: b.dayNumber, mealPlan: b.mealPlan, mealType: b.mealType })), null, 2));
    
    console.log("=== PLANNER DATA ACCOMMODATIONS ===");
    console.log(JSON.stringify((tour.planner_data.accommodations || []).map(a => ({ nightIndex: a.nightIndex, hotelName: a.hotelName, mealPlan: a.mealPlan, selectedRooms: a.selectedRooms })), null, 2));
  }
  
  // 2. Get daily_activities
  const { data: dailyActivities } = await supabase.from('daily_activities').select('id, title, activity_type, meal_plan, meal_type, hotel_id').eq('tour_id', tourId);
  console.log("=== DAILY ACTIVITIES IN DB ===");
  console.log(JSON.stringify(dailyActivities, null, 2));
}

run().catch(console.error);
