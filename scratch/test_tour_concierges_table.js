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
    const { data, error } = await supabase.from('tour_itinerary_concierges').select('*').limit(5);
    if (error) {
      console.error("tour_itinerary_concierges table query error:", error.message);
    } else {
      console.log("tour_itinerary_concierges table exists! Sample rows count:", data.length);
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
