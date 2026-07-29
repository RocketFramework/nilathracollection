const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';
  
  // 1. Get tour itineraries to see day mapping
  const { data: itins } = await supabase.from('tour_itineraries').select('id, day_number, service_date').eq('tour_id', tourId).order('day_number', { ascending: true });
  console.log("Tour itineraries:", itins);
  
  // 2. Fetch daily_activities with day_number
  const { data: dailyActivities } = await supabase
    .from('daily_activities')
    .select('id, title, activity_type, itinerary_id, service_date, tour_itineraries(day_number)')
    .eq('tour_id', tourId);
    
  console.log("Daily activities sample:", dailyActivities?.slice(0, 5));
}

run().catch(console.error);
