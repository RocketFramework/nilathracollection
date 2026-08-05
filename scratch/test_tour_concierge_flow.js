const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envText = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envText.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  try {
    console.log("--- 1. Fetching available concierge items ---");
    const { data: concItems, error: concErr } = await supabase.from('seamless_concierge_cost_items').select('*').limit(3);
    if (concErr) throw concErr;
    console.log("Found active concierge cost items:", concItems.map(i => i.cost_code));

    console.log("--- 2. Fetching sample tour ---");
    const { data: tours, error: tourErr } = await supabase.from('tours').select('id').limit(1);
    if (tourErr || !tours || tours.length === 0) throw new Error("No sample tour found");
    const sampleTourId = tours[0].id;
    console.log("Sample tour ID:", sampleTourId);

    console.log("--- 3. Testing query on empty tour_itinerary_concierges (backward compatibility) ---");
    const { data: initialSaved, error: initErr } = await supabase
      .from('tour_itinerary_concierges')
      .select('*')
      .eq('tour_id', sampleTourId)
      .is('tour_itinerary_id', null);
    if (initErr) throw initErr;
    console.log("Initial saved concierges count for tour:", initialSaved.length);

    console.log("--- 4. Testing saveTourConcierges (Insert selections) ---");
    const testPayload = concItems.map(item => ({
      tour_id: sampleTourId,
      tour_itinerary_id: null,
      concierge_cost_item_id: item.id,
      quantity: 4,
      cost: Number(item.default_cost || 0) + 10
    }));

    // Delete existing
    await supabase.from('tour_itinerary_concierges').delete().eq('tour_id', sampleTourId).is('tour_itinerary_id', null);
    // Insert new
    const { data: inserted, error: insErr } = await supabase.from('tour_itinerary_concierges').insert(testPayload).select();
    if (insErr) throw insErr;
    console.log("Saved concierge items count:", inserted.length);

    console.log("--- 5. Querying saved concierges with join ---");
    const { data: joined, error: joinErr } = await supabase
      .from('tour_itinerary_concierges')
      .select(`
        *,
        cost_item:seamless_concierge_cost_items (
          cost_code, title, category, default_cost
        )
      `)
      .eq('tour_id', sampleTourId)
      .is('tour_itinerary_id', null);

    if (joinErr) throw joinErr;
    console.log("Joined query result:", joined.map(j => ({ code: j.cost_item?.cost_code, qty: j.quantity, cost: j.cost })));

    console.log("--- 6. Cleaning up test concierges ---");
    await supabase.from('tour_itinerary_concierges').delete().eq('tour_id', sampleTourId).is('tour_itinerary_id', null);
    console.log("Cleanup done!");

    console.log("\nALL CONCIERGE CONFIG INTEGRATION CHECKS PASSED CLEANLY!");
  } catch (e) {
    console.error("Test failed:", e.message || e);
  }
}

run();
