const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// We manually require the built file or write a script that does the same calculation
const TRAVEL_STYLES = {
  LUXURY: 'Luxury',
  ULTRA_VIP: 'Ultra VIP',
  PREMIUM: 'Premium',
  REGULAR: 'Regular',
  MIXED: 'Mixed'
};

const TravelStyleSettingKeys = {
  'Regular': 'regular',
  'Premium': 'premium',
  'Luxury': 'luxury',
  'Ultra VIP': 'ultra_vip'
};

const GUIDE_RATE_KEYS = {
  NATIONAL: 'guide_national_day_rate',
  REGULAR: 'guide_regular_day_rate',
  LOCATION: 'guide_location_day_rate'
};

function calculateInvoiceItems(params) {
  const {
    itinerary,
    travelStyle,
    chauffeurNeeded,
    guideNeeded,
    appSettings,
    pax,
    durationDays
  } = params;

  console.log("Calculation Input Params:", {
    travelStyle,
    chauffeurNeeded,
    guideNeeded,
    pax,
    durationDays,
    appSettingsKeysCount: Object.keys(appSettings || {}).length
  });

  const styleKey = TravelStyleSettingKeys[travelStyle] || 'luxury';
  console.log("Resolved styleKey:", styleKey);

  let transportTotal = 0;

  if (appSettings && (chauffeurNeeded || guideNeeded)) {
    if (chauffeurNeeded) {
      const vehicleDayRateKey = `${styleKey}_vehicle_day_rate`;
      const vehicleDayRate = Number(appSettings[vehicleDayRateKey]) || 0;
      const transportMarkupPercent = Number(appSettings.transport_markup) || 0;
      const transportMarkup = transportMarkupPercent / 100;
      const vehicleCost = vehicleDayRate * (1 + transportMarkup);

      const chauffeurDayRateKey = `${styleKey}_chauffeur_day_rate`;
      const chauffeurDayRate = Number(appSettings[chauffeurDayRateKey]) || 0;
      const driverMarkupPercent = appSettings.diver_markup !== undefined 
        ? Number(appSettings.diver_markup) 
        : (Number(appSettings.driver_markup) || 0);
      const driverMarkup = driverMarkupPercent / 100;
      const chauffeurCost = chauffeurDayRate * (1 + driverMarkup);

      console.log("Chauffeur Details:", {
        vehicleDayRateKey,
        vehicleDayRate,
        vehicleCost,
        chauffeurDayRateKey,
        chauffeurDayRate,
        chauffeurCost
      });

      transportTotal += (vehicleCost + chauffeurCost) * durationDays;
    }

    if (guideNeeded) {
      let guideDayRateKey = GUIDE_RATE_KEYS.NATIONAL;
      const normStyle = travelStyle;
      if (normStyle === 'Regular') {
        guideDayRateKey = GUIDE_RATE_KEYS.LOCATION;
      } else if (normStyle === 'Premium') {
        guideDayRateKey = GUIDE_RATE_KEYS.REGULAR;
      } else if (normStyle === 'Luxury' || normStyle === 'Ultra VIP') {
        guideDayRateKey = GUIDE_RATE_KEYS.NATIONAL;
      }

      const guideDayRate = Number(appSettings[guideDayRateKey]) || 0;
      const tourGuideMarkupPercent = Number(appSettings.tour_guide_markup) || 0;
      const tourGuideMarkup = tourGuideMarkupPercent / 100;
      const guideCost = guideDayRate * (1 + tourGuideMarkup);

      console.log("Guide Details:", {
        guideDayRateKey,
        guideDayRate,
        guideCost
      });

      transportTotal += guideCost * durationDays;
    }
  }

  console.log("Calculated transportTotal:", transportTotal);
  return transportTotal;
}

async function run() {
  // Query a real tour
  const tourId = 'a993a535-7645-4001-a741-42c314ab5fa3';
  const { data: tour } = await supabase.from('tours').select('*').eq('id', tourId).single();
  const { data: rawSettings } = await supabase.from('app_settings').select('*');
  const { data: appState } = await supabase.from('app_states').select('state_data').eq('state_key', `nilathra_planner_wizard_state_${tourId}`).maybeSingle();

  const appSettings = {};
  rawSettings.forEach(s => appSettings[s.setting_key] = s.setting_value);

  const elements = appState?.state_data?.elements || {};
  const chauffeurNeeded = elements.driver ?? true;
  const guideNeeded = elements.guide ?? true;

  const travelStyle = tour?.planner_data?.profile?.travelStyle || 'Luxury';
  const durationDays = tour?.planner_data?.profile?.durationDays || 5;

  calculateInvoiceItems({
    itinerary: [],
    travelStyle,
    chauffeurNeeded,
    guideNeeded,
    appSettings,
    pax: 2,
    durationDays
  });
}

run();
