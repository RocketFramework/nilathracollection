const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = {};
fs.readFileSync('.env.local','utf8').split('\n').forEach(l=>{const i=l.indexOf('=');if(i>0&&!l.startsWith('#'))env[l.slice(0,i).trim()]=l.slice(i+1).trim().replace(/^["']|["']$/g,'');});
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const T='35b2f9ec-827a-4419-b598-d81b05ea82fb';
(async()=>{
  const it = await sb.from('tour_itineraries').select('id,day_number').eq('tour_id',T).order('day_number');
  console.log('itineraries:', (it.data||[]).length);
  const pos = await sb.from('purchase_orders').select('id,po_number,vendor_type,vendor_name,status,total_amount,items:purchase_order_items(id,description,service_date,quantity,unit_price,total_price,daily_activity_id)').eq('tour_id',T);
  (pos.data||[]).forEach(p=>console.log(p.po_number,p.vendor_type,p.vendor_name,p.status,p.total_amount,'items',p.items.length));
  const tr = await sb.from('tours').select('planner_data').eq('id',T).single();
  const pd = tr.data?.planner_data||{};
  console.log('planner keys:', Object.keys(pd));
  console.log('planner driver info:', JSON.stringify(pd.dailyDriverAssignments||pd.drivers||pd.driverAssignments||null).slice(0,600));
  const bl = await sb.from('po_blocks').select('id,name,block_type').eq('tour_id',T);
  console.log('blocks:', (bl.data||[]).map(b=>b.block_type+':'+b.name).join(' || '));
})();
