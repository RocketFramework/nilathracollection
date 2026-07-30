const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testVehicleSync() {
  console.log('--- Testing vehicle syncing logic ---');

  // Fetch all transport requirements with vehicles and daily activities
  const { data: reqs, error: rErr } = await supabase
    .from('transport_requirements')
    .select(`
      id,
      tour_id,
      transport_requirement_vehicles(
        vehicle_id,
        quantity,
        notes,
        vehicle:transport_vehicles(provider_id, day_rate, max_km_per_day, additional_km_rate)
      )
    `);

  if (rErr) console.error('Reqs error:', rErr);

  const { data: daList } = await supabase
    .from('daily_activities')
    .select('id, tour_id, itinerary_id, transport_requirement_id, distance')
    .not('transport_requirement_id', 'is', null)
    .not('itinerary_id', 'is', null);

  const transportPayloads = [];

  (reqs || []).forEach(req => {
    const tourId = req.tour_id;
    const vehicles = req.transport_requirement_vehicles || [];
    const linkedActs = (daList || []).filter(da => da.transport_requirement_id === req.id);
    const itinIds = [...new Set(linkedActs.map(da => da.itinerary_id))];

    itinIds.forEach(itinId => {
      vehicles.forEach(trv => {
        const v = trv.vehicle;
        if (v) {
          transportPayloads.push({
            tour_id: tourId,
            tour_itinerary_id: itinId,
            transport_provider_id: v.provider_id || null,
            vehicle_id: trv.vehicle_id,
            contracted_per_day_rate: (Number(v.day_rate) || 0) * (Number(trv.quantity) || 1),
            charged_per_day_rate: (Number(v.day_rate) || 0) * (Number(trv.quantity) || 1),
            notes: trv.notes || null
          });
        }
      });
    });
  });

  console.log(`Generated ${transportPayloads.length} vehicle transport records across all tour days.`);
  if (transportPayloads.length > 0) {
    console.log('Sample vehicle transport record:', transportPayloads[0]);
  }
}

testVehicleSync();
