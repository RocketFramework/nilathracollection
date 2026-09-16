const fs = require('fs');
const path = require('path');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

async function testPgMeta() {
  const sql = fs.readFileSync('data/migrations/partner_approval_and_images.sql', 'utf8');
  
  const endpoints = [
    `${url}/pg_meta/default/query`,
    `${url}/rest/v1/rpc/run_sql`,
    `${url}/rest/v1/rpc/exec_sql`,
    `${url}/pg/query`
  ];

  for (const ep of endpoints) {
    try {
      console.log("Testing endpoint:", ep);
      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': key,
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({ query: sql, sql: sql, sql_query: sql })
      });
      console.log("Status:", res.status, res.statusText);
      const text = await res.text();
      console.log("Response:", text.substring(0, 200));
    } catch (e) {
      console.error("Fetch error:", e.message);
    }
  }
}

testPgMeta();
