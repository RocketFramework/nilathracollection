const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = {};
fs.readFileSync('.env.local','utf8').split('\n').forEach(l=>{const i=l.indexOf('=');if(i>0&&!l.startsWith('#'))env[l.slice(0,i).trim()]=l.slice(i+1).trim().replace(/^["']|["']$/g,'');});
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const T='35b2f9ec-827a-4419-b598-d81b05ea82fb';
(async()=>{
  const pos = await sb.from('purchase_orders').select('*').eq('tour_id',T).eq('vendor_type','driver');
  console.log(JSON.stringify(pos.data,null,1).slice(0,3500));
  const dr = await sb.from('draft_itinerary_versions').select('id,version_number,created_at').eq('tour_id',T);
  console.log('drafts', JSON.stringify(dr.data));
  const veh = await sb.from('tour_itinerary_vehicles').select('tour_itinerary_id,contracted_per_day_rate').eq('tour_id',T);
  console.log('vehicle rows', (veh.data||[]).length);
  const it = await sb.from('tour_itineraries').select('id,day_number').eq('tour_id',T).order('day_number');
  console.log(JSON.stringify(it.data));
})();
