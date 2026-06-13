const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl = '';
let supabaseKey = '';

try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
          supabaseUrl = val;
        } else if (key === 'SUPABASE_SERVICE_ROLE_KEY') {
          supabaseKey = val;
        }
      }
    }
  }
} catch (e) {
  console.error("Error reading env file:", e);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const tourId = '60dec7e8-cbd9-4801-9f97-b41e5062fcc2';
  
  const { data: tour, error } = await supabase
    .from('tours')
    .select('id, planner_data')
    .eq('id', tourId)
    .single();

  if (error) {
    console.error("Fetch tour error:", error);
    return;
  }

  console.log("Planner Data in Tours Table exists?", !!tour.planner_data);
  if (tour.planner_data) {
    console.log("Planner Data keys:", Object.keys(tour.planner_data));
    console.log("Itinerary Block Count in planner_data:", tour.planner_data.itinerary ? tour.planner_data.itinerary.length : 'undefined');
    if (tour.planner_data.itinerary && tour.planner_data.itinerary.length > 0) {
      console.log("First Itinerary Block:", tour.planner_data.itinerary[0]);
    }
  }

  const { data: drafts, error: draftsError } = await supabase
    .from('draft_itinerary_versions')
    .select('id, version_number, label, created_at, itinerary_data')
    .eq('tour_id', tourId)
    .order('version_number', { ascending: false });

  if (draftsError) {
    console.error("Fetch drafts error:", draftsError);
  } else {
    console.log("Draft versions count:", drafts.length);
    if (drafts.length > 0) {
      console.log("Latest Draft version details:", {
        id: drafts[0].id,
        version_number: drafts[0].version_number,
        label: drafts[0].label,
        created_at: drafts[0].created_at,
        block_count: drafts[0].itinerary_data ? drafts[0].itinerary_data.length : 'undefined'
      });
      if (drafts[0].itinerary_data && drafts[0].itinerary_data.length > 0) {
        console.log("First block of latest draft version:", drafts[0].itinerary_data[0]);
      }
    }
  }
}

run();
