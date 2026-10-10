const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = {};
fs.readFileSync('.env.local','utf8').split('\n').forEach(l=>{const i=l.indexOf('=');if(i>0&&!l.trim().startsWith('#'))env[l.slice(0,i).trim()]=l.slice(i+1).trim().replace(/^["']|["']$/g,'');});
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
(async()=>{
 const t='35b2f9ec-827a-4419-b598-d81b05ea82fb';
 for (const tbl of ['customer_invoices','invoices']) {
  const r = await sb.from(tbl).select('*').eq('tour_id',t);
  console.log(tbl, r.error?.message, JSON.stringify(r.data,null,1)?.slice(0,3500));
 }
 const c = await sb.from('tour_itinerary_concierges').select('*').eq('tour_id',t);
 console.log('conc', JSON.stringify(c.data), c.error?.message);
})();
