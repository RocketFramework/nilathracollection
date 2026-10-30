const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = {};
fs.readFileSync('.env.local','utf8').split('\n').forEach(l=>{const i=l.indexOf('=');if(i>0&&!l.startsWith('#'))env[l.slice(0,i).trim()]=l.slice(i+1).trim().replace(/^["']|["']$/g,'');});
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
(async()=>{
  const col = await sb.from('tour_itinerary_drivers').select('contracted_fx_rate,contracted_total_lkr').limit(1);
  console.log('driver fx cols:', col.error ? col.error.message : 'OK');
  const da = await sb.from('daily_activities').select('contracted_fx_rate').limit(1);
  console.log('daily_activities fx col:', da.error ? da.error.message : 'OK');
  const rows = await sb.from('tour_itinerary_drivers').select('tour_id');
  const cnt = {}; (rows.data||[]).forEach(r=>cnt[r.tour_id]=(cnt[r.tour_id]||0)+1);
  console.log('driver rows per tour:', cnt);
  const blocks = await sb.from('po_blocks').select('tour_id,name,block_type,has_finalized').eq('block_type','driver');
  console.log('driver blocks:', JSON.stringify(blocks.data));
  const tours = await sb.from('tours').select('id,updated_at').order('updated_at',{ascending:false}).limit(3);
  console.log('recent tours:', JSON.stringify(tours.data));
})();
