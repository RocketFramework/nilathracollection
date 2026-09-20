const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log('Checking activity_bookings...');
  const { data: bData, error: bErr } = await supabase.from('activity_bookings').select('*').limit(1);
  console.log('activity_bookings query:', { bData, bErr });

  console.log('Checking activity_booking_items...');
  const { data: iData, error: iErr } = await supabase.from('activity_booking_items').select('*').limit(1);
  console.log('activity_booking_items query:', { iData, iErr });
}

check();
