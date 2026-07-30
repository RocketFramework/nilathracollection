const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testChargedRateCalc() {
  console.log('--- Testing charged price calculation based on travel style vehicle day rate * (1 + transport_markup/100) ---');

  // Fetch tour
  const tourId = '9bfb345a-da5d-443a-8644-90148b0b3a5a';
  const { data: tour } = await supabase.from('tours').select('travel_style').eq('id', tourId).single();
  const travelStyle = tour?.travel_style || 'Luxury';

  // Fetch app settings
  const { data: settings } = await supabase.from('app_settings').select('setting_key, setting_value');
  const appSettings = {};
  (settings || []).forEach(s => appSettings[s.setting_key] = s.setting_value);

  const styleKeyMap = {
    'Regular': 'regular',
    'Standard': 'regular',
    'Premium': 'premium',
    'Luxury': 'luxury',
    'Ultra VIP': 'ultra_vip',
    'Ultra-VIP': 'ultra_vip'
  };
  const styleKey = styleKeyMap[travelStyle] || 'luxury';
  const vehicleDayRateKey = `${styleKey}_vehicle_day_rate`;
  const baseVehicleDayRate = Number(appSettings[vehicleDayRateKey]) || 0;
  const transportMarkup = Number(appSettings['transport_markup']) || 0;
  const chargedRate = baseVehicleDayRate * (1 + (transportMarkup / 100));

  console.log(`Tour Travel Style: "${travelStyle}" -> key: "${styleKey}"`);
  console.log(`Base Vehicle Day Rate (${vehicleDayRateKey}): $${baseVehicleDayRate}`);
  console.log(`Transport Markup (transport_markup): ${transportMarkup}%`);
  console.log(`Calculated Charged Rate: $${chargedRate.toFixed(2)}`);
}

testChargedRateCalc();
