const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDbStatus() {
  console.log('--- Checking tour_itinerary_transports status ---');

  const { data, count, error } = await supabase
    .from('tour_itinerary_transports')
    .select('*', { count: 'exact' });

  console.log('Table exists:', !error);
  console.log('Total transport records in DB:', data?.length);
  if (error) console.error('DB Error:', error);
}

checkDbStatus();
