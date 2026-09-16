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
  const dbUrl = process.env.DATABASE_URL || env.DATABASE_URL || `postgres://postgres.vknibpdhovgcbenkcnaz:${encodeURIComponent(env.SUPABASE_DB_PASSWORD || env.SUPABASE_SERVICE_ROLE_KEY)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;
  console.log('Connecting to Postgres DB...');
  
  // Try postgres connection with available credentials
  const connectionStrings = [
    process.env.DATABASE_URL,
    env.DATABASE_URL,
    env.POSTGRES_URL,
    `postgres://postgres:${encodeURIComponent(env.SUPABASE_DB_PASSWORD || '')}@db.vknibpdhovgcbenkcnaz.supabase.co:5432/postgres`
  ].filter(Boolean);

  let client;
  for (const connStr of connectionStrings) {
    try {
      client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
      await client.connect();
      console.log('Connected successfully using:', connStr.substring(0, 30) + '...');
      break;
    } catch (e) {
      console.warn('Could not connect with string:', e.message);
      client = null;
    }
  }

  if (!client) {
    console.error('No working pg connection string found in environment.');
    process.exit(1);
  }

  try {
    const sqlPath = path.join(__dirname, '../data/migrations/partner_approval_and_images.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Executing migration SQL:', sqlPath);
    await client.query(sql);
    console.log('Migration executed successfully!');
    await client.end();
  } catch (err) {
    console.error('Migration execution error:', err);
    if (client) await client.end();
  }
}

runPg();
