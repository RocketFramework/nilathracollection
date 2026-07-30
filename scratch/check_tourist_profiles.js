const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTouristProfiles() {
  console.log('--- Checking tourist_profiles table ---');

  const { data, error } = await supabase.from('tourist_profiles').select('id, travel_style').limit(5);
  console.log('tourist_profiles query result:', data, 'Error:', error);
}

checkTouristProfiles();
