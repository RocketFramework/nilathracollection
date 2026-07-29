const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function moveActivity(activityId, targetDayNumber) {
  const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';
  
  // 1. Fetch target tour_itinerary for targetDayNumber
  const { data: targetItin, error: itinErr } = await supabase
    .from('tour_itineraries')
    .select('id, day_number, date')
    .eq('tour_id', tourId)
    .eq('day_number', targetDayNumber)
    .single();
    
  if (itinErr || !targetItin) {
    throw new Error(`Could not find tour_itineraries for day_number ${targetDayNumber}: ${itinErr?.message}`);
  }
  
  console.log(`Found target itinerary: Day ${targetItin.day_number}, ID: ${targetItin.id}, Date: ${targetItin.date}`);
  
  // 2. Update daily_activities
  const { error: daErr } = await supabase
    .from('daily_activities')
    .update({
      itinerary_id: targetItin.id,
      service_date: targetItin.date
    })
    .eq('id', activityId);
    
  if (daErr) throw new Error(`Failed to update daily_activities: ${daErr.message}`);
  console.log(`Updated daily_activities row ${activityId} to Day ${targetDayNumber}`);
  
  // 3. Update tours.planner_data JSON
  const { data: tourRow } = await supabase.from('tours').select('planner_data').eq('id', tourId).single();
  if (tourRow && tourRow.planner_data && tourRow.planner_data.itinerary) {
    const itinerary = tourRow.planner_data.itinerary;
    let found = false;
    itinerary.forEach((block) => {
      if (block.id === activityId) {
        block.dayNumber = targetDayNumber;
        found = true;
      }
    });
    if (found) {
      await supabase.from('tours').update({ planner_data: tourRow.planner_data }).eq('id', tourId);
      console.log(`Updated tours.planner_data JSON for activity ${activityId} to dayNumber ${targetDayNumber}`);
    }
  }
  
  console.log("Move complete successfully!");
}

// Example usage if run directly with arguments
const activityId = process.argv[2];
const targetDay = parseInt(process.argv[3]);
if (activityId && targetDay) {
  moveActivity(activityId, targetDay).catch(console.error);
}

module.exports = { moveActivity };
