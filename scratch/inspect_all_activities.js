const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';
  
  const { data: activities } = await supabase
    .from('daily_activities')
    .select('id, title, activity_type, price_finalized, service_date, tour_itineraries(day_number, date)')
    .eq('tour_id', tourId)
    .order('service_date', { ascending: true });
    
  console.log("ALL ACTIVITIES FOR TOUR:");
  activities.forEach((a, idx) => {
    console.log(`${idx + 1}. [Day ${a.tour_itineraries?.day_number || '?'}] [Date: ${a.service_date}] [Finalized: ${a.price_finalized}] ${a.title} (ID: ${a.id})`);
  });
}

inspect().catch(console.error);
