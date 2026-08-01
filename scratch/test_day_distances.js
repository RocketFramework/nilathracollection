const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDayDistances() {
  const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';
  
  const { data: acts } = await supabase
    .from('daily_activities')
    .select('id, itinerary_id, title, distance, tour_itineraries(day_number)')
    .eq('tour_id', tourId);

  console.log(`Found ${acts?.length} activities for tour.`);
  const dayDistanceMap = {};

  (acts || []).forEach(a => {
    const dayNum = a.tour_itineraries?.day_number || 'unknown';
    const rawDist = String(a.distance || '').replace(/[^0-9.]/g, '');
    const numDist = parseFloat(rawDist) || 0;
    if (numDist > 0) {
      console.log(`Day ${dayNum} - Activity "${a.title}": distance="${a.distance}" -> ${numDist} km`);
      dayDistanceMap[dayNum] = (dayDistanceMap[dayNum] || 0) + numDist;
    }
  });

  console.log('Total Distances per Day:', dayDistanceMap);
}

checkDayDistances();
