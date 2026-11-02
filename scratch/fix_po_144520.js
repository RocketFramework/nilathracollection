const { createClient } = require("@supabase/supabase-js");
const src = require("fs").readFileSync(__dirname + "/check_db.js", "utf8");
const supabase = createClient(src.match(/const url = "([^"]+)"/)[1], src.match(/const key = "([^"]+)"/)[1]);
(async () => {
  const poId = "1d8d499b-9625-4411-bf11-3c1a15328887";
  const del = await supabase.from("purchase_order_items").delete().eq("id", "f9f5600d-283e-401c-8e4d-371ca65d51ae").eq("purchase_order_id", poId);
  console.log("delete", del.error);
  const upd = await supabase.from("purchase_orders").update({ subtotal: 880, total_amount: 880 }).eq("id", poId);
  console.log("update", upd.error);
  const { data } = await supabase.from("purchase_orders").select("po_number,subtotal,total_amount,items:purchase_order_items(total_price,total_price_lkr)").eq("id", poId);
  console.log(JSON.stringify(data));
  const r = await supabase.from("v_finance_po_report").select("po_number,po_value_own_ccy,po_value_lkr,po_rate_used").eq("po_number", "PO-HOT-144520");
  console.log(JSON.stringify(r.data));
})();
