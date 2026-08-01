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
  console.log('--- Running tour_itinerary_vehicles Migration ---');
  const sql = fs.readFileSync('data/migrations/create_tour_itinerary_vehicles.sql', 'utf8');
  
  // Since we don't have a direct sql query execution RPC sometimes, let's execute sql using supabase.rpc or a direct connection if available
  // If not, we can run it block by block via rpc or just announce to the user that it needs to be run in Supabase SQL editor.
  // Wait, is there a postgres connection available or can we execute sql via supabase.rpc('exec_sql')?
  // Let's check if there is an exec_sql RPC.
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    console.error('exec_sql rpc error:', error);
    console.log('Note: Please run the SQL file data/migrations/create_tour_itinerary_vehicles.sql in your Supabase SQL Editor.');
  } else {
    console.log('Migration executed successfully via rpc!');
  }
}

runMigration();
