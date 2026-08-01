const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkConstraints() {
  console.log('--- Checking indices / constraints ---');
  
  // We can query pg_indexes or information_schema
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT conname, contype, pg_get_constraintdef(c.oid) 
      FROM pg_constraint c 
      JOIN pg_namespace n ON n.oid = c.connamespace 
      WHERE n.nspname = 'public' AND conrelid::regclass::text IN ('tour_itinerary_drivers', 'tour_itinerary_transports');
    `
  }).catch(() => ({ error: 'no rpc' }));

  if (error) {
    console.log('Error querying pg_constraint:', error);
  } else {
    console.log('Constraints:', data);
  }
}

checkConstraints();
