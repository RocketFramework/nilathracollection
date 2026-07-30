const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectTourTransports() {
  console.log('--- Inspecting tour_itinerary_transports for active tour ---');

  const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';
  const { data: tour } = await supabase.from('tours').select('id, travel_style').eq('id', tourId).single();
  console.log('Tour:', tour);

  const { data: transports, error } = await supabase
    .from('tour_itinerary_transports')
    .select('*, tour_itineraries(day_number)')
    .eq('tour_id', tourId);

  console.log('Transport count:', transports?.length, 'Error:', error);
  if (transports) {
    transports.forEach(t => {
      console.log(`Day ${t.tour_itineraries?.day_number}: vehicle_id=${t.vehicle_id}, provider_id=${t.transport_provider_id}, contracted_per_day_rate=${t.contracted_per_day_rate}, charged_per_day_rate=${t.charged_per_day_rate}`);
    });
  }
}

inspectTourTransports();
