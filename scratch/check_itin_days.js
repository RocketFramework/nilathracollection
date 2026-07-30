const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkItin() {
  const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';
  const { data: itins } = await supabase.from('tour_itineraries').select('*').eq('tour_id', tourId).order('day_number', { ascending: true });
  console.log('Itineraries:', itins.map(i => ({ id: i.id, day: i.day_number, date: i.date })));
  console.log('Total Itin Days:', itins.length);
}

checkItin();
