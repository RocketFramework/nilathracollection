const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectTour() {
  const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';
  
  console.log('--- Inspecting Tour Drivers ---');
  const { data: tourDrivers, error: tdErr } = await supabase
    .from('tour_itinerary_drivers')
    .select('*')
    .eq('tour_id', tourId);
  console.log('tour_itinerary_drivers:', tourDrivers, tdErr);

  console.log('--- Inspecting PO Blocks ---');
  const { data: poBlocks, error: pbErr } = await supabase
    .from('po_blocks')
    .select('*')
    .eq('tour_id', tourId);
  console.log('po_blocks:', poBlocks, pbErr);

  console.log('--- Inspecting Purchase Orders ---');
  const { data: pos, error: poErr } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('tour_id', tourId);
  console.log('purchase_orders:', pos, poErr);

  console.log('--- Inspecting Daily Activities (driver/travel) ---');
  const { data: da, error: daErr } = await supabase
    .from('daily_activities')
    .select('id, activity_type, title, driver_id, transport_id, contracted_price, charged_unit_price, tour_itineraries(day_number, tour_id)')
    .eq('tour_id', tourId);
  console.log('daily_activities count:', da?.length);
  console.log('daily_activities driver/travel:', da?.filter(a => a.activity_type === 'driver' || a.activity_type === 'travel' || a.driver_id));
}

inspectTour();
