const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testAllDatesSync() {
  console.log('--- Testing All-Dates Vehicle Syncing ---');

  const tourId = '9bfb345a-da5d-443a-8644-90148b0b3a5a';

  // Fetch all tour_itineraries for this tour
  const { data: tourItin } = await supabase
    .from('tour_itineraries')
    .select('id, day_number')
    .eq('tour_id', tourId)
    .order('day_number', { ascending: true });

  console.log(`Tour has ${tourItin?.length} total itinerary days.`);

  // Sync test vehicle across ALL dates of this tour
  const vehicleId = '3050bf0a-0a9f-4f29-a7b8-053a7145b28c';
  const { data: vehicleDetails } = await supabase
    .from('transport_vehicles')
    .select('id, provider_id, day_rate')
    .eq('id', vehicleId)
    .single();

  const rowsToInsert = (tourItin || []).map(it => ({
    tour_id: tourId,
    tour_itinerary_id: it.id,
    transport_provider_id: vehicleDetails?.provider_id || null,
    vehicle_id: vehicleId,
    contracted_per_day_rate: Number(vehicleDetails?.day_rate) || 0,
    charged_per_day_rate: Number(vehicleDetails?.day_rate) || 0
  }));

  // Delete previous
  await supabase.from('tour_itinerary_transports').delete().eq('tour_id', tourId);

  // Insert all dates
  const { data: saved, error: saveErr } = await supabase
    .from('tour_itinerary_transports')
    .insert(rowsToInsert)
    .select();

  console.log('Saved records across ALL tour dates:', saved?.length, 'Error:', saveErr);
}

testAllDatesSync();
