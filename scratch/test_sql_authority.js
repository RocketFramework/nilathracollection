const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';
  
  // Fetch tour_itineraries
  const { data: itins } = await supabase.from('tour_itineraries').select('id, day_number, date').eq('tour_id', tourId).order('day_number', { ascending: true });
  console.log("Tour itineraries:", itins.map(i => ({ id: i.id, day: i.day_number, date: i.date })));
  
  if (itins.length < 2) {
    console.log("Not enough itineraries to test day move");
    return;
  }
  
  const day1Itin = itins[0];
  const day2Itin = itins[1];
  
  // Pick one activity from daily_activities
  const { data: activities } = await supabase.from('daily_activities').select('id, title, itinerary_id, service_date').eq('tour_id', tourId).limit(1);
  if (!activities || activities.length === 0) {
    console.log("No activities found");
    return;
  }
  
  const targetAct = activities[0];
  console.log("\nBefore test target activity:", targetAct);
  
  // Update target activity in SQL directly to move it to Day 2's itinerary_id and date
  console.log(`\nSimulating manual SQL update: Moving activity '${targetAct.title}' to Day ${day2Itin.day_number} (itinerary_id: ${day2Itin.id}, date: ${day2Itin.date})...`);
  const { error: updateErr } = await supabase
    .from('daily_activities')
    .update({
      itinerary_id: day2Itin.id,
      service_date: day2Itin.date
    })
    .eq('id', targetAct.id);
    
  if (updateErr) throw updateErr;
  
  // Verify DB state right after manual SQL edit
  const { data: afterSql } = await supabase.from('daily_activities').select('id, title, itinerary_id, service_date, tour_itineraries(day_number)').eq('id', targetAct.id).single();
  console.log("Activity in SQL after manual update:", afterSql);
  
  console.log("\nTest passed! SQL update successfully applied.");
}

test().catch(console.error);
