const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectSchema() {
  console.log('--- Inspecting Table Columns ---');

  for (const table of ['tour_itinerary_drivers', 'tour_itinerary_transports']) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`Error reading ${table}:`, error);
    } else {
      console.log(`Columns in ${table}:`, data.length > 0 ? Object.keys(data[0]) : 'Empty table, trying select limit 0');
      // Let's get column names by doing a select with a limit of 0
      const { data: colsData, error: colsErr } = await supabase
        .from(table)
        .select()
        .limit(1);
      if (colsData) {
        console.log(`Columns in ${table} (limit 1):`, colsData[0] ? Object.keys(colsData[0]) : 'None returned');
      }
    }
  }
}

inspectSchema();
