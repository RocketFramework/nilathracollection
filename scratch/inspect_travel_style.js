const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectTravelStyle() {
  const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';
  
  const { data: td } = await supabase.from('tourist_data').select('*').eq('tour_id', tourId);
  console.log('tourist_data:', JSON.stringify(td, null, 2));
}

inspectTravelStyle();
