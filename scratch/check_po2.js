const { createClient } = require("@supabase/supabase-js");
const key = require("fs").readFileSync(__dirname + "/check_day1.js","utf8").match(/const key = "([^"]+)"/)[1];
const s = createClient("https://vknibpdhovgcbenkcnaz.supabase.co", key);
(async () => {
  const { data: po } = await s.from('purchase_orders').select('*').eq('po_number','PO-HOT-2026-0002').single();
  console.log(po);
  for (const t of ['supplier_invoices','supplier_payments']) { const {data}=await s.from(t).select('id').eq('purchase_order_id',po.id); console.log(t,data.length); }
  const r = await s.from('purchase_orders').update({status:'Cancelled'}).eq('id',po.id).select('status');
  console.log('cancel test', r.error?.message, r.data);
})();
