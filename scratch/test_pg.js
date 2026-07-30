const { Client } = require('pg');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

async function runPg() {
  const dbUrl = process.env.DATABASE_URL || env.DATABASE_URL || `postgres://postgres.vknibpdhovgcbenkcnaz:${encodeURIComponent(env.SUPABASE_SERVICE_ROLE_KEY)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;
  console.log('Connecting pg...');
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected!');
    const sql = fs.readFileSync('data/migrations/create_tour_itinerary_transports.sql', 'utf8');
    await client.query(sql);
    console.log('Successfully executed migration data/migrations/create_tour_itinerary_transports.sql!');
    await client.end();
  } catch (err) {
    console.error('pg connection error:', err.message);
  }
}

runPg();
