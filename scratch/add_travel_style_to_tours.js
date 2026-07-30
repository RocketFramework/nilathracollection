const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
  console.log('--- Step 1: Adding travel_style column to tours table and backfilling ---');

  // Check if column exists by attempting to select it
  const { data: selectCheck, error: selectErr } = await supabase.from('tours').select('id, travel_style, planner_data').limit(5);

  if (selectErr && selectErr.message.includes('travel_style')) {
    console.log('Column travel_style does not exist yet. Please run SQL migration or using rpc if available.');
  } else {
    console.log('Select check succeeded! Sample rows:', selectCheck);
  }

  // Backfill travel_style for existing tours
  const { data: allTours, error: toursErr } = await supabase.from('tours').select('id, planner_data, travel_style');
  if (allTours) {
    console.log(`Found ${allTours.length} total tours in DB.`);
    for (const tour of allTours) {
      // Find preference from tourist_data
      const { data: td } = await supabase.from('tourist_data').select('preferences').eq('tour_id', tour.id).single();
      const prefStyle = td?.preferences?.travel_style;
      const plannerStyle = tour.planner_data?.profile?.travelStyle || tour.planner_data?.profile?.travel_style;
      const resolvedStyle = prefStyle || plannerStyle || 'Luxury';

      const { error: updErr } = await supabase
        .from('tours')
        .update({ travel_style: resolvedStyle })
        .eq('id', tour.id);

      if (updErr) {
        console.error(`Failed to update tour ${tour.id}:`, updErr);
      } else {
        console.log(`Updated tour ${tour.id} -> travel_style: ${resolvedStyle}`);
      }
    }
  }
}

runMigration();
