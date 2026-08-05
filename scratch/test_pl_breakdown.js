const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envLocal.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v) envVars[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';

  const { data: itin } = await supabase.from('tour_itineraries').select('id, day_number, date').eq('tour_id', tourId);
  const itinIds = (itin || []).map(i => i.id);
  const { data: dbActivities } = await supabase.from('daily_activities').select('*').in('tour_itinerary_id', itinIds.length > 0 ? itinIds : ['none']);

  const { data: drivers } = await supabase.from('tour_itinerary_drivers').select('*').eq('tour_id', tourId);
  const { data: transports } = await supabase.from('tour_itinerary_transports').select('*').eq('tour_id', tourId);
  const { data: vehicles } = await supabase.from('tour_itinerary_vehicles').select('*').eq('tour_id', tourId);
  const { data: concierges } = await supabase.from('tour_itinerary_concierges').select('*').eq('tour_id', tourId);

  let totalCustomerAgreed = 0;
  let totalSupplierAgreed = 0;

  console.log('--- LINE BY LINE BREAKDOWN ---');
  (dbActivities || []).forEach(a => {
    const contracted = a.contracted_price || 0;
    const charged = a.charged_total_price || 0;
    totalSupplierAgreed += contracted;
    totalCustomerAgreed += charged;
    console.log(`[Activity/Hotel/Meal] ${a.title}: Contracted = $${contracted}, Charged = $${charged}`);
  });

  (drivers || []).forEach(d => {
    const contracted = (d.contracted_per_day_rate || 0) + (d.contracted_accommodation_cost || 0) + (d.contracted_meal_cost || 0) + (d.contracted_other_allowance || 0);
    const charged = (d.charged_per_day_rate || 0) + (d.charged_accommodation_cost || 0) + (d.charged_meal_cost || 0) + (d.charged_other_allowance || 0);
    totalSupplierAgreed += contracted;
    totalCustomerAgreed += charged;
    console.log(`[Driver] Day ${d.day_number || ''}: Contracted = $${contracted}, Charged = $${charged}`);
  });

  (vehicles || []).forEach(v => {
    const contracted = v.contracted_cost || 0;
    const charged = v.charged_cost || 0;
    totalSupplierAgreed += contracted;
    totalCustomerAgreed += charged;
    console.log(`[Vehicle] Contracted = $${contracted}, Charged = $${charged}`);
  });

  (concierges || []).forEach(c => {
    const qty = c.quantity || 1;
    const contracted = (c.cost || 0) * qty;
    const charged = contracted;
    totalSupplierAgreed += contracted;
    totalCustomerAgreed += charged;
    console.log(`[Concierge] Contracted = $${contracted}, Charged = $${charged}`);
  });

  const netAgreedProfit = totalCustomerAgreed - totalSupplierAgreed;
  console.log('\n==========================================');
  console.log(`Total Customer Agreed (Charged):  $${totalCustomerAgreed.toFixed(2)}`);
  console.log(`Total Supplier Agreed (Contracted): $${totalSupplierAgreed.toFixed(2)}`);
  console.log(`Agreed Net Profit:                 $${netAgreedProfit.toFixed(2)}`);
  console.log('==========================================');
}

main();
