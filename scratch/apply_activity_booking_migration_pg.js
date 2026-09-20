const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

async function runPg() {
  const projectRef = 'vknibpdhovgcbenkcnaz';
  const connectionStrings = [
    process.env.DATABASE_URL,
    env.DATABASE_URL,
    env.POSTGRES_URL,
    `postgres://postgres.${projectRef}:${encodeURIComponent(env.SUPABASE_DB_PASSWORD || '')}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
    `postgres://postgres:${encodeURIComponent(env.SUPABASE_DB_PASSWORD || '')}@db.${projectRef}.supabase.co:5432/postgres`
  ].filter(Boolean);

  let client = null;
  for (const connStr of connectionStrings) {
    try {
      client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
      await client.connect();
      console.log('Connected successfully!');
      break;
    } catch (e) {
      console.warn('Could not connect with string:', e.message);
      client = null;
    }
  }

  if (!client) {
    // If no db password set in env, let's try calling supabase client to verify or use REST fallback
    console.log('Trying Supabase client schema check...');
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase.from('activity_bookings').select('*').limit(1);
    if (!error) {
      console.log('Table activity_bookings already exists!');
      return;
    } else {
      console.log('activity_bookings error:', error.message);
    }
    return;
  }

  try {
    const sqlPath = path.join(__dirname, '../data/migrations/create_activity_bookings_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Executing migration SQL...');
    await client.query(sql);
    console.log('Migration executed successfully via PG!');
    await client.end();
  } catch (err) {
    console.error('Migration execution error:', err);
    if (client) await client.end();
  }
}

runPg();
