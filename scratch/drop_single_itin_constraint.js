const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function syncVehiclesToTransports() {
  console.log('--- Testing vehicle syncing to tour_itinerary_transports ---');

  // Fetch transport requirement vehicles
  const { data: reqVehicles, error: rvErr } = await supabase
    .from('transport_requirement_vehicles')
    .select('requirement_id, vehicle_id, quantity, notes, transport_requirements(tour_id), vehicle:transport_vehicles(provider_id, day_rate, max_km_per_day, additional_km_rate)');

  console.log('Found requirement vehicles:', reqVehicles?.length, rvErr);
  if (reqVehicles && reqVehicles.length > 0) {
    console.log('Sample requirement vehicle:', JSON.stringify(reqVehicles[0], null, 2));
  }
}

syncVehiclesToTransports();
