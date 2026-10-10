const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
envContent.split('\n').forEach(line => {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) { let v = m[2] || ''; if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1); process.env[m[1]] = v; }
});
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const tourId = '35b2f9ec-827a-4419-b598-d81b05ea82fb';
  const { data: das } = await db.from('daily_activities').select('id,title,quantity,contracted_price,contracted_total_price,charged_unit_price,charged_total_price,price_finalized,hotel_id').eq('tour_id', tourId).eq('activity_type', 'sleep');
  console.log('DA', JSON.stringify(das));
  const { data: t } = await db.from('tours').select('planner_data').eq('id', tourId).single();
  const pd = t.planner_data;
  console.log('ACC', JSON.stringify(pd.accommodations.map(a => ({ n: a.nightIndex, h: a.hotelName, ppn: a.pricePerNight, cu: a.customContractedUnitPrice, ct: a.customContractedTotalPrice, rooms: (a.selectedRooms || []).map(r => ({ q: r.quantity, ppn: r.pricePerNight, cp: r.contractedPrice, at: r.agreedTotal })) }))));
  console.log('BLK', JSON.stringify(pd.itinerary.filter(b => b.type === 'sleep').map(b => ({ d: b.dayNumber, h: b.hotelName, ag: b.agreedPrice, cp: b.contractedPrice, base: b.baseRoomRate, fin: b.priceFinalized }))));
})();
