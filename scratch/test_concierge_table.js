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
    const { data, error } = await supabase.from('seamless_concierge_cost_items').select('*').limit(5);
    if (error) {
      console.error("Table query error:", error.message);
    } else {
      console.log("seamless_concierge_cost_items table exists! Sample rows count:", data.length);
      console.log("Sample rows:", data);
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
