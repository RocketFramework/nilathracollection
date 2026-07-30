const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testSqlMigration() {
  console.log('--- Testing Transport Migration Logic ---');
  
  // 1. Fetch itinerary days for all tours
  const { data: itineraries, error: itinErr } = await supabase
    .from('tour_itineraries')
    .select('id, tour_id, day_number');

  if (itinErr) console.error('Itineraries error:', itinErr);

  const itinMap = new Map();
  (itineraries || []).forEach(it => itinMap.set(it.id, it));

  // 2. Fetch daily_activities travel items with transport_id
  const { data: travelActs, error: daErr } = await supabase
    .from('daily_activities')
    .select('tour_id, itinerary_id, transport_id, distance, contracted_price, charged_unit_price')
    .not('itinerary_id', 'is', null)
    .not('transport_id', 'is', null);

  if (daErr) console.error('Activities error:', daErr);

  const perDayTransportMap = new Map();
  (travelActs || []).forEach(act => {
    if (!perDayTransportMap.has(act.itinerary_id)) {
      perDayTransportMap.set(act.itinerary_id, {
        tour_id: act.tour_id,
        tour_itinerary_id: act.itinerary_id,
        transport_provider_id: act.transport_id,
        contracted_per_day_rate: Number(act.contracted_price) || 0,
        charged_per_day_rate: Number(act.charged_unit_price || act.contracted_price) || 0,
        distance_km: parseFloat(String(act.distance || '').replace(/[^\d.]/g, '')) || 0
      });
    } else {
      const existing = perDayTransportMap.get(act.itinerary_id);
      existing.distance_km += parseFloat(String(act.distance || '').replace(/[^\d.]/g, '')) || 0;
      existing.contracted_per_day_rate += Number(act.contracted_price) || 0;
      existing.charged_per_day_rate += Number(act.charged_unit_price || act.contracted_price) || 0;
    }
  });

  const records = Array.from(perDayTransportMap.values());
  console.log(`Generated ${records.length} day-level transport records for tour_itineraries.`);
  if (records.length > 0) {
    console.log('Sample day-level transport record:', records[0]);
  }
}

testSqlMigration();
