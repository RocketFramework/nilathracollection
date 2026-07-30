const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function createTableViaREST() {
  const sql = fs.readFileSync('data/migrations/create_tour_itinerary_transports.sql', 'utf8');
  
  // Try exec_sql or query or pg_net or rpc if available
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  console.log('rpc exec_sql result:', data, error);
}

createTableViaREST();
