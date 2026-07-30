const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testSyncTour() {
  console.log('--- Testing Sync for Tour 34cfc060-fd58-4c20-8b57-158feeb689d6 ---');
  const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';

  // Fetch transport requirements for this tour
  const { data: reqs } = await supabase.from('transport_requirements').select('*').eq('tour_id', tourId);
  console.log('Requirements found:', reqs?.length);
  const reqId = reqs?.[0]?.id || 'req-test';

  // Assign vehicle
  const vehicleId = '49a7740b-f253-40cc-b627-8ba08c12966c';
  const { data: vehicleDetails } = await supabase
    .from('transport_vehicles')
    .select('id, provider_id, day_rate')
    .eq('id', vehicleId)
    .single();

  // Fetch app settings
  const { data: settingsRows } = await supabase.from('app_settings').select('*');
  const appSettingsMap = {};
  (settingsRows || []).forEach(s => appSettingsMap[s.setting_key] = s.setting_value);

  // Fetch tour
  const { data: tourData } = await supabase.from('tours').select('planner_data').eq('id', tourId).single();
  const rawStyle = tourData?.planner_data?.profile?.travelStyle || 'Luxury';

  const styleKeyMap = {
    'Regular': 'regular',
    'Standard': 'regular',
    'Premium': 'premium',
    'Luxury': 'luxury',
    'Ultra VIP': 'ultra_vip',
    'Ultra-VIP': 'ultra_vip'
  };
  const styleKey = styleKeyMap[rawStyle] || 'luxury';
  const vehicleDayRateKey = `${styleKey}_vehicle_day_rate`;
  const appVehicleDayRate = Number(appSettingsMap[vehicleDayRateKey]) || 0;
  const transportMarkupPercent = Number(appSettingsMap['transport_markup']) || 0;
  const markupFactor = 1 + (transportMarkupPercent / 100);

  const baseDayRate = appVehicleDayRate > 0 ? appVehicleDayRate : (Number(vehicleDetails?.day_rate) || 0);
  const chargedRate = baseDayRate * markupFactor;

  console.log(`Resolved Travel Style: "${rawStyle}" -> Key: "${styleKey}"`);
  console.log(`App Vehicle Day Rate (${vehicleDayRateKey}): $${appVehicleDayRate}`);
  console.log(`Transport Markup: ${transportMarkupPercent}% (factor ${markupFactor})`);
  console.log(`Calculated charged_per_day_rate to save: $${chargedRate}`);

  // Fetch itineraries
  const { data: tourItineraries } = await supabase.from('tour_itineraries').select('id, day_number').eq('tour_id', tourId);
  const allItinIds = (tourItineraries || []).map(it => it.id);

  // Re-sync table
  await supabase.from('tour_itinerary_transports').delete().in('tour_itinerary_id', allItinIds);

  const transportRows = allItinIds.map(itinId => ({
    tour_id: tourId,
    tour_itinerary_id: itinId,
    transport_provider_id: vehicleDetails?.provider_id || null,
    vehicle_id: vehicleId,
    contracted_per_day_rate: Number(vehicleDetails?.day_rate) || 0,
    charged_per_day_rate: chargedRate,
    updated_at: new Date().toISOString()
  }));

  const { data: inserted, error: insErr } = await supabase.from('tour_itinerary_transports').insert(transportRows).select();
  console.log(`Successfully saved ${inserted?.length} rows into tour_itinerary_transports! Error:`, insErr);

  // Inspect inserted table values
  const { data: verifyRows } = await supabase.from('tour_itinerary_transports').select('tour_itinerary_id, contracted_per_day_rate, charged_per_day_rate').eq('tour_id', tourId);
  console.log('Verified table values in DB:');
  verifyRows.forEach(r => console.log(`contracted=${r.contracted_per_day_rate}, charged=${r.charged_per_day_rate}`));
}

testSyncTour();
