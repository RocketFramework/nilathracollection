const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = {};
fs.readFileSync('.env.local','utf8').split('\n').forEach(l=>{const i=l.indexOf('=');if(i>0&&!l.trim().startsWith('#'))env[l.slice(0,i).trim()]=l.slice(i+1).trim().replace(/^["']|["']$/g,'');});
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
(async()=>{
 const r = await sb.from('customer_invoices').select('invoice_number,amount,discount_amount,created_at,items:customer_invoice_items(description,amount)').eq('tour_id','35b2f9ec-827a-4419-b598-d81b05ea82fb').order('created_at');
 r.data.forEach(i=>console.log(i.invoice_number,i.amount,i.discount_amount,i.created_at.slice(0,16),JSON.stringify(i.items.map(x=>[x.description.slice(0,40),x.amount]))));
})();
