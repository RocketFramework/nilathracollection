const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envLocal.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v) envVars[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';
  
  const { data: tp } = await supabase.from('tour_itinerary_transports').select('*').eq('tour_id', tourId);
  console.log('--- tour_itinerary_transports ---');
  console.log(tp);

  const { data: tv } = await supabase.from('tour_itinerary_vehicles').select('*').eq('tour_id', tourId);
  console.log('--- tour_itinerary_vehicles ---');
  console.log(tv);
}

main();
