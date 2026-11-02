const { createClient } = require("@supabase/supabase-js");
const src = require("fs").readFileSync(__dirname + "/check_db.js", "utf8");
const supabase = createClient(src.match(/const url = "([^"]+)"/)[1], src.match(/const key = "([^"]+)"/)[1]);
(async () => {
  const { data, error } = await supabase.from("purchase_orders")
    .select("*, items:purchase_order_items(*)").ilike("po_number", "%144520%");
  console.log(error);
  for (const po of data || []) {
    const { items, ...h } = po;
    console.log(JSON.stringify(h));
    items.forEach(i => console.log(JSON.stringify({ d: i.description, q: i.quantity, up: i.unit_price, tp: i.total_price, fx: i.fx_rate, upl: i.unit_price_lkr, tpl: i.total_price_lkr, da: i.daily_activity_id })));
  }
})();
