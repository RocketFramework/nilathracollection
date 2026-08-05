const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
env.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    if (key && !key.startsWith('#')) {
      process.env[key] = val;
    }
  }
});

async function testConciergeSave() {
  const { createAdminClient } = require('./src/utils/supabase/admin');
  const { TourConciergeService } = require('./src/services/tour-concierge.service');

  console.log("=== Testing Concierge Save with Real Database ===");
  const supabase = createAdminClient();

  // 1. Get a sample tour
  const { data: tour } = await supabase.from('tours').select('id').limit(1).single();
  if (!tour) {
    console.error("No tour found to test.");
    return;
  }
  const tourId = tour.id;
  console.log("Testing with tourId:", tourId);

  // 2. Get tour_itineraries for this tour
  const { data: itins } = await supabase.from('tour_itineraries').select('id, day_number').eq('tour_id', tourId);
  console.log("Found tour_itineraries count:", itins?.length);

  // 3. Get master concierge cost item
  const { data: masterItems } = await supabase.from('seamless_concierge_cost_items').select('id').limit(1);
  if (!masterItems || masterItems.length === 0) {
    console.error("No seamless_concierge_cost_items found!");
    return;
  }
  const costItemId = masterItems[0].id;
  const dayItinId = itins && itins.length > 0 ? itins[0].id : null;

  console.log("Saving concierge item with tour_itinerary_id:", dayItinId);

  const payload = [{
    concierge_cost_item_id: costItemId,
    quantity: 2,
    cost: 50,
    tour_itinerary_id: dayItinId
  }];

  const success = await TourConciergeService.saveTourConcierges(tourId, payload, supabase);
  console.log("saveTourConcierges returned success:", success);

  // 4. Query tour_itineraries_concierges to verify!
  const { data: savedRows, error } = await supabase.from('tour_itinerary_concierges').select('*').eq('tour_id', tourId);
  console.log("Verified saved rows count in tour_itinerary_concierges:", savedRows?.length);
  console.log("Saved row detail:", savedRows);
  if (error) {
    console.error("Query error:", error);
    process.exit(1);
  }
}

testConciergeSave().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
