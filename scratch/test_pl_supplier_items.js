const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testPL() {
  const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';
  
  const { data: dbActivities } = await supabase
    .from('daily_activities')
    .select('*, tour_itineraries(day_number, date)')
    .eq('tour_id', tourId);

  const { data: purchaseOrders } = await supabase
    .from('purchase_orders')
    .select('*, items:purchase_order_items(*), invoices:supplier_invoices(*, items:supplier_invoice_items(*))')
    .eq('tour_id', tourId);

  const { data: masterHotels } = await supabase.from('hotels').select('*');

  console.log('--- DB Activities Sleep items ---');
  const sleepActs = dbActivities.filter(da => da.activity_type === 'sleep' || da.activity_type === 'accommodation');
  console.log('Found sleep activities:', sleepActs.length);
  sleepActs.forEach(da => {
    const dayNum = da.tour_itineraries?.day_number || da.day_number || 1;
    const hotel = masterHotels.find(h => h.id === da.hotel_id);
    console.log(`Day ${dayNum}: ${da.title} | Hotel ID: ${da.hotel_id} -> Name: ${hotel?.name || 'UNKNOWN'} | Contracted: ${da.contracted_price} | Charged: ${da.charged_unit_price}`);
  });
}

testPL();
