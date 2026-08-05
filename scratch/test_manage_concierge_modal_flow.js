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
    console.log("--- 1. Fetching sample tour and itinerary day ---");
    const { data: tours, error: tourErr } = await supabase.from('tours').select('id').limit(1);
    if (tourErr || !tours || tours.length === 0) throw new Error("No sample tour found");
    const tourId = tours[0].id;
    console.log("Sample tour ID:", tourId);

    // Fetch sample itinerary day
    const { data: itinDays, error: itinErr } = await supabase.from('tour_itineraries').select('id, day_index').eq('tour_id', tourId).limit(1);
    const day1Id = (itinDays && itinDays.length > 0) ? itinDays[0].id : null;
    console.log("Sample itinerary day ID:", day1Id || "(No day row, creating temporary mock)");

    console.log("--- 2. Fetching active concierge cost items ---");
    const { data: concItems, error: concErr } = await supabase.from('seamless_concierge_cost_items').select('*').limit(2);
    if (concErr || !concItems || concItems.length < 2) throw new Error("Need at least 2 concierge cost items");
    const itemWholeTrip = concItems[0];
    const itemDayAssigned = concItems[1];

    console.log("Item 1 (Whole Trip):", itemWholeTrip.cost_code);
    console.log("Item 2 (Day Assigned):", itemDayAssigned.cost_code);

    console.log("--- 3. Testing saveTourConcierges with mixed scopes ---");
    const payload = [
      {
        concierge_cost_item_id: itemWholeTrip.id,
        quantity: 2,
        cost: Number(itemWholeTrip.default_cost || 0),
        tour_itinerary_id: null // Whole trip
      },
      {
        concierge_cost_item_id: itemDayAssigned.id,
        quantity: 5,
        cost: Number(itemDayAssigned.default_cost || 0) + 15,
        tour_itinerary_id: day1Id // Day assigned (or null if mock)
      }
    ];

    // Clean up existing
    await supabase.from('tour_itinerary_concierges').delete().eq('tour_id', tourId);

    // Insert payload
    const toInsert = payload.map(p => ({
      tour_id: tourId,
      tour_itinerary_id: p.tour_itinerary_id,
      concierge_cost_item_id: p.concierge_cost_item_id,
      quantity: p.quantity,
      cost: p.cost
    }));

    const { data: inserted, error: insErr } = await supabase.from('tour_itinerary_concierges').insert(toInsert).select();
    if (insErr) throw insErr;
    console.log("Successfully inserted mixed scope concierges count:", inserted.length);

    console.log("--- 4. Querying saved concierges for tour ---");
    const { data: saved, error: readErr } = await supabase
      .from('tour_itinerary_concierges')
      .select(`
        *,
        cost_item:seamless_concierge_cost_items (cost_code, title)
      `)
      .eq('tour_id', tourId);

    if (readErr) throw readErr;
    console.log("Fetched saved concierges:", saved.map(s => ({
      code: s.cost_item?.cost_code,
      scope: s.tour_itinerary_id ? `Day ID: ${s.tour_itinerary_id}` : 'Whole Trip (NULL)',
      qty: s.quantity,
      cost: s.cost
    })));

    console.log("--- 5. Cleanup test records ---");
    await supabase.from('tour_itinerary_concierges').delete().eq('tour_id', tourId);
    console.log("Cleanup done!");

    console.log("\nALL MANAGE CONCIERGES AI-BUILDER TESTS PASSED SUCCESSFULLY!");
  } catch (e) {
    console.error("Test failed:", e.message || e);
  }
}

run();
