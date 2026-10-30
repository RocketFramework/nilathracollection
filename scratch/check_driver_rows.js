const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = {};
fs.readFileSync('.env.local','utf8').split('\n').forEach(l=>{const i=l.indexOf('=');if(i>0&&!l.startsWith('#'))env[l.slice(0,i).trim()]=l.slice(i+1).trim().replace(/^["']|["']$/g,'');});
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
(async()=>{
  const r = await sb.from('tour_itinerary_drivers').select('driver_id,tour_itinerary_id,contracted_per_day_rate,tour_itineraries(day_number)').eq('tour_id','35b2f9ec-827a-4419-b598-d81b05ea82fb');
  console.log(r.error?r.error.message:JSON.stringify((r.data||[]).map(x=>[x.driver_id.slice(0,8),x.tour_itineraries?.day_number,x.contracted_per_day_rate])));
})();
