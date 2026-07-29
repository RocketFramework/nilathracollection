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

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';
  
  // Fetch tour planner_data
  const { data: tour } = await supabase.from('tours').select('planner_data').eq('id', tourId).single();
  const tripData = tour.planner_data;
  
  // Set day 7 sleep block mealPlan to RO
  const sleepDay7 = (tripData.itinerary || []).find(b => b.dayNumber === 7 && b.type === 'sleep');
  if (sleepDay7) {
    console.log("Day 7 sleep block before:", sleepDay7.mealPlan);
    sleepDay7.mealPlan = 'RO';
  }
  
  // Run normalization
  if (tripData?.itinerary) {
    tripData.itinerary.forEach((b) => {
      if (b.mealPlan && b.mealPlan.toLowerCase() === 'none') b.mealPlan = 'RO';
    });
  }
  if (tripData?.accommodations) {
    tripData.accommodations.forEach((acc) => {
      if (acc.mealPlan && acc.mealPlan.toLowerCase() === 'none') acc.mealPlan = 'RO';
      if (acc.selectedRooms) {
        acc.selectedRooms.forEach((r) => {
          if (r.mealPlan && r.mealPlan.toLowerCase() === 'none') r.mealPlan = 'RO';
        });
      }
    });
  }
  
  // Update planner_data
  await supabase.from('tours').update({ planner_data: tripData }).eq('id', tourId);
  
  // Also update daily_activities on day 7 to RO
  const { data: itin } = await supabase.from('tour_itineraries').select('id').eq('tour_id', tourId).eq('day_number', 7).single();
  if (itin) {
    await supabase.from('daily_activities').update({ meal_plan: 'RO' }).eq('itinerary_id', itin.id).eq('activity_type', 'sleep');
  }

  console.log("Updated DB successfully!");
}

run().catch(console.error);
