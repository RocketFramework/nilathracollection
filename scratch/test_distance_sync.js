const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testDistanceSync() {
  console.log('--- Testing distance_km population in tour_itinerary_transports ---');
  const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';

  // Fetch activities and compute day distance map
  const { data: dailyActs } = await supabase
    .from('daily_activities')
    .select('itinerary_id, distance')
    .eq('tour_id', tourId);

  const dayDistanceMap = {};
  (dailyActs || []).forEach(act => {
    if (act.itinerary_id && act.distance) {
      const rawDist = String(act.distance).replace(/[^0-9.]/g, '');
      const numDist = parseFloat(rawDist) || 0;
      if (numDist > 0) {
        dayDistanceMap[act.itinerary_id] = (dayDistanceMap[act.itinerary_id] || 0) + numDist;
      }
    }
  });

  const { data: itineraries } = await supabase
    .from('tour_itineraries')
    .select('id, day_number')
    .eq('tour_id', tourId);

  // Update distance_km on existing records
  for (const itin of (itineraries || [])) {
    const dist = dayDistanceMap[itin.id] || 0;
    await supabase
      .from('tour_itinerary_transports')
      .update({ distance_km: dist })
      .eq('tour_itinerary_id', itin.id);
  }

  // Verify DB table distance_km
  const { data: rows } = await supabase
    .from('tour_itinerary_transports')
    .select('tour_itinerary_id, distance_km, tour_itineraries(day_number)')
    .eq('tour_id', tourId);

  console.log('Verified tour_itinerary_transports table distance_km in DB:');
  rows.forEach(r => {
    console.log(`Day ${r.tour_itineraries?.day_number}: distance_km = ${r.distance_km}`);
  });
}

testDistanceSync();
