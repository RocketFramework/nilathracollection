const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectSleep() {
  const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';
  
  console.log('--- Inspecting Tour Itineraries ---');
  const { data: itins } = await supabase
    .from('tour_itineraries')
    .select('id, day_number, date')
    .eq('tour_id', tourId)
    .order('day_number', { ascending: true });
  console.log('Itineraries:', itins);

  console.log('--- Inspecting All Daily Activities for Tour ---');
  const { data: da } = await supabase
    .from('daily_activities')
    .select('id, activity_type, title, hotel_id, itinerary_id, contracted_price, charged_unit_price, tour_itineraries(day_number, date)')
    .eq('tour_id', tourId);

  console.log('Sleep activities count:', da.filter(a => a.activity_type === 'sleep' || a.activity_type === 'accommodation').length);
  console.log('Sleep activities:', da.filter(a => a.activity_type === 'sleep' || a.activity_type === 'accommodation'));

  console.log('All activities per day:');
  itins.forEach(itin => {
    const acts = da.filter(a => a.itinerary_id === itin.id || a.tour_itineraries?.day_number === itin.day_number);
    console.log(`Day ${itin.day_number} (${itin.date}):`, acts.map(a => `${a.activity_type}: ${a.title}`));
  });
}

inspectSleep();
