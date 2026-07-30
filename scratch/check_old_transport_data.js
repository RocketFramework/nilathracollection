const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkOldTransportData() {
  const { data, error } = await supabase
    .from('purchase_order_daily_transport_items')
    .select('*, purchase_order_items(purchase_order_id, purchase_orders(tour_id)), daily_activities(tour_id, itinerary_id, transport_id)');
  console.log('Old transport items count:', data?.length, error);
  if (data && data.length > 0) {
    console.log('Sample old transport item:', JSON.stringify(data[0], null, 2));
  }
}

checkOldTransportData();
