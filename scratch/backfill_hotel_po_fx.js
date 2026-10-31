const { createClient } = require("@supabase/supabase-js");
const key = require("fs").readFileSync(__dirname + "/check_day1.js","utf8").match(/const key = "([^"]+)"/)[1];
const s = createClient("https://vknibpdhovgcbenkcnaz.supabase.co", key);
const APPLY = process.argv.includes('--apply');
(async () => {
  const t = "35b2f9ec-827a-4419-b598-d81b05ea82fb";
  const { data: acts } = await s.from('daily_activities').select('id,title,hotel_id,contracted_price,contracted_total_price,contracted_fx_rate,contracted_unit_price_lkr,contracted_total_price_lkr').eq('tour_id', t).not('hotel_id','is',null);
  const { data: pos } = await s.from('purchase_orders').select('id,po_number,status,hotel_id,subtotal,tax,discount,items:purchase_order_items(id,unit_price,total_price,quantity)').eq('tour_id', t).eq('vendor_type','hotel');
  for (const po of pos) {
    const pool = acts.filter(a => a.hotel_id === po.hotel_id);
    const used = new Set(); const upd = [];
    const items = [...po.items].sort((a,b)=>b.unit_price-a.unit_price);
    for (const it of items) {
      let best=null,bd=1e9;
      for (const a of pool) { if (used.has(a.id)) continue; const d=Math.abs(a.contracted_price-it.unit_price); if (d<bd){bd=d;best=a;} }
      if (!best || bd > 1 || !best.contracted_fx_rate) { console.log(po.po_number, 'SKIP item', it.unit_price, '(no match)'); continue; }
      used.add(best.id);
      const q = Number(it.quantity||1);
      upd.push({ item: it, act: best, q });
      console.log(po.po_number, po.status, best.title.trim(), `PO ${it.unit_price} -> ${best.contracted_price}`, `fx ${best.contracted_fx_rate}`, `LKR ${best.contracted_total_price_lkr}`);
    }
    if (APPLY) {
      for (const u of upd) {
        const { error } = await s.from('purchase_order_items').update({
          daily_activity_id: u.act.id, unit_price: u.act.contracted_price,
          fx_rate: u.act.contracted_fx_rate, unit_price_lkr: u.act.contracted_unit_price_lkr, total_price_lkr: u.act.contracted_total_price_lkr
        }).eq('id', u.item.id);
        if (error) console.log('ERR', error.message);
      }
      if (upd.length) {
        const { data: its } = await s.from('purchase_order_items').select('total_price').eq('purchase_order_id', po.id);
        const sub = its.reduce((x,i)=>x+Number(i.total_price||0),0);
        await s.from('purchase_orders').update({ subtotal: sub, total_amount: sub + Number(po.tax||0) - Number(po.discount||0) }).eq('id', po.id);
      }
    }
  }
})();
