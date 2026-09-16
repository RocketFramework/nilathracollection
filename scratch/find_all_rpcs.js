const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testRpcs() {
  const rpcNames = [
    'run_sql', 'exec_sql', 'execute_sql', 'exec', 'run_query', 'query',
    'sql', 'admin_run_sql', 'pg_exec', 'pg_query', 'pg_run'
  ];

  for (const name of rpcNames) {
    const { data, error } = await supabase.rpc(name, { sql: 'SELECT 1;' });
    const { data: d2, error: e2 } = await supabase.rpc(name, { query: 'SELECT 1;' });
    const { data: d3, error: e3 } = await supabase.rpc(name, { sql_query: 'SELECT 1;' });

    const errStr = (error?.message || e2?.message || e3?.message || '');
    if (!errStr.includes('Could not find the function')) {
      console.log(`FOUND FUNCTION: ${name}! Output:`, { data, error, e2, e3 });
    }
  }
}

testRpcs();
