const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function runCleanMigration() {
  console.log('--- Verifying tour_itinerary_transports schema in Supabase ---');
  
  // Test select
  const { data, error } = await supabase.from('tour_itinerary_transports').select('*').limit(5);
  console.log('tour_itinerary_transports rows count:', data?.length, 'Error:', error);
}

runCleanMigration();
