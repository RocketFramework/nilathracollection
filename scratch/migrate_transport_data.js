const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function migrateData() {
  console.log('--- Migrating transport data via Supabase JS ---');

  // Fetch old records
  const { data: podtiRows, error: podtiErr } = await supabase
    .from('purchase_order_daily_transport_items')
    .select('*, daily_activities(tour_id, itinerary_id, transport_id)');

  if (podtiErr) {
    console.error('Error fetching podtiRows:', podtiErr);
  }

  const transportPayloads = [];
  const seenItinIds = new Set();

  (podtiRows || []).forEach(row => {
    const da = row.daily_activities;
    if (da && da.itinerary_id && !seenItinIds.has(da.itinerary_id)) {
      seenItinIds.add(da.itinerary_id);
      transportPayloads.push({
        tour_id: da.tour_id,
        tour_itinerary_id: da.itinerary_id,
        transport_provider_id: da.transport_id || null,
        contracted_per_day_rate: row.day_rate || 0,
        contracted_excess_mileage_cost: row.extra_km_charge || 0,
        charged_per_day_rate: row.day_rate || 0,
        charged_excess_mileage_cost: row.extra_km_charge || 0,
        distance_km: row.total_km_for_day || 0
      });
    }
  });

  // Also fetch daily_activities travel legs
  const { data: travelActs } = await supabase
    .from('daily_activities')
    .select('tour_id, itinerary_id, transport_id, contracted_price, charged_unit_price')
    .eq('activity_type', 'travel')
    .not('transport_id', 'is', null);

  (travelActs || []).forEach(da => {
    if (da.itinerary_id && !seenItinIds.has(da.itinerary_id)) {
      seenItinIds.add(da.itinerary_id);
      transportPayloads.push({
        tour_id: da.tour_id,
        tour_itinerary_id: da.itinerary_id,
        transport_provider_id: da.transport_id,
        contracted_per_day_rate: Number(da.contracted_price) || 0,
        charged_per_day_rate: Number(da.charged_unit_price || da.contracted_price) || 0
      });
    }
  });

  console.log(`Found ${transportPayloads.length} unique transport itinerary assignments to migrate.`);

  if (transportPayloads.length > 0) {
    // Upsert into tour_itinerary_transports if table exists
    const { data: saved, error: saveErr } = await supabase
      .from('tour_itinerary_transports')
      .upsert(transportPayloads, { onConflict: 'tour_itinerary_id' })
      .select();

    console.log('Migration save result:', saved?.length, saveErr);
  }
}

migrateData();
