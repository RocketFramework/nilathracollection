const { createClient } = require("@supabase/supabase-js");
const url = "https://vknibpdhovgcbenkcnaz.supabase.co";
const key = require("fs").readFileSync(__dirname + "/check_day1.js","utf8").match(/const key = "([^"]+)"/)[1];
const s = createClient(url, key);
(async () => {
  const t = "35b2f9ec-827a-4419-b598-d81b05ea82fb";
  const { data: a } = await s.from('daily_activities').select('id,title,hotel_id,quantity,contracted_price,contracted_total_price,contracted_fx_rate,contracted_unit_price_lkr,contracted_total_price_lkr').eq('tour_id', t).not('hotel_id','is',null);
  console.log('ACT', a);
  const { data: p } = await s.from('purchase_orders').select('id,po_number,vendor_type,currency,total_amount,status,items:purchase_order_items(daily_activity_id,quantity,unit_price,total_price,fx_rate,unit_price_lkr,total_price_lkr)').eq('tour_id', t).eq('vendor_type','hotel');
  console.log('PO', JSON.stringify(p,null,1));
})();
