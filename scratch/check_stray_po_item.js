const { createClient } = require("@supabase/supabase-js");
const src = require("fs").readFileSync(__dirname + "/check_db.js", "utf8");
const supabase = createClient(src.match(/const url = "([^"]+)"/)[1], src.match(/const key = "([^"]+)"/)[1]);
(async () => {
  const { data: items } = await supabase.from("purchase_order_items").select("*").eq("purchase_order_id", "1d8d499b-9625-4411-bf11-3c1a15328887");
  console.log(JSON.stringify(items.filter(i => Number(i.unit_price) < 1), null, 1));
  const { data: acts } = await supabase.from("daily_activities").select("id,title,activity_type,quantity,contracted_price,contracted_total_price,charged_unit_price,hotel_id,tour_id").eq("tour_id", "35b2f9ec-827a-4419-b598-d81b05ea82fb").ilike("title", "%Tea Estate%");
  console.log(JSON.stringify(acts, null, 1));
})();
