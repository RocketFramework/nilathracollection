// Audits (and with --apply fixes) purchase_order_items whose fx_rate / LKR values differ from the
// hotel/activity selection values saved on the linked daily_activities row (the source of truth).
const { createClient } = require("@supabase/supabase-js");
const src = require("fs").readFileSync(__dirname + "/check_db.js", "utf8");
const s = createClient(src.match(/const url = "([^"]+)"/)[1], src.match(/const key = "([^"]+)"/)[1]);
const APPLY = process.argv.includes("--apply");
const eq = (a, b) => (a == null && b == null) || (a != null && b != null && Math.abs(Number(a) - Number(b)) < 0.0001);
(async () => {
  const { data: items, error } = await s.from("purchase_order_items")
    .select("id,purchase_order_id,daily_activity_id,description,quantity,fx_rate,unit_price_lkr,total_price_lkr,purchase_orders(po_number,status)")
    .not("daily_activity_id", "is", null);
  if (error) throw error;
  const ids = [...new Set(items.map(i => i.daily_activity_id))];
  const acts = {};
  for (let i = 0; i < ids.length; i += 100) {
    const { data } = await s.from("daily_activities").select("id,contracted_fx_rate,contracted_unit_price_lkr,contracted_total_price_lkr").in("id", ids.slice(i, i + 100));
    (data || []).forEach(a => (acts[a.id] = a));
  }
  let bad = 0; const pos = new Set();
  for (const it of items) {
    const a = acts[it.daily_activity_id];
    if (!a) continue;
    if (eq(it.fx_rate, a.contracted_fx_rate) && eq(it.unit_price_lkr, a.contracted_unit_price_lkr) && eq(it.total_price_lkr, a.contracted_total_price_lkr)) continue;
    if (Number(a.contracted_total_price_lkr) === 0 && Number(it.total_price_lkr) > 0) {
      console.log(`SKIP (selection LKR is 0, needs review): ${it.purchase_orders?.po_number} ${it.description}`);
      continue;
    }
    bad++; pos.add(it.purchase_order_id);
    console.log(`${it.purchase_orders?.po_number} [${it.purchase_orders?.status}] ${it.description}\n   PO line : fx ${it.fx_rate} unit ${it.unit_price_lkr} total ${it.total_price_lkr}\n   selection: fx ${a.contracted_fx_rate} unit ${a.contracted_unit_price_lkr} total ${a.contracted_total_price_lkr}`);
    if (APPLY) {
      const r = await s.from("purchase_order_items").update({
        fx_rate: a.contracted_fx_rate ?? null,
        unit_price_lkr: a.contracted_unit_price_lkr ?? null,
        total_price_lkr: a.contracted_total_price_lkr ?? null,
      }).eq("id", it.id);
      if (r.error) console.log("   ERR", r.error.message);
    }
  }
  console.log(`\n${bad} mismatching PO line(s) in ${pos.size} PO(s). ${APPLY ? "FIXED." : "(dry run; pass --apply to fix)"}`);
})();
