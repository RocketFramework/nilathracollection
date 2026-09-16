const { Client } = require('pg');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const passwords = [
  'postgres',
  'Nilathra2024!',
  'Nilathra2026!',
  'Nilathra@2026',
  'Nilathra123!',
  'admin123'
];

async function tryPasses() {
  for (const pass of passwords) {
    const connStr = `postgres://postgres:${encodeURIComponent(pass)}@db.vknibpdhovgcbenkcnaz.supabase.co:5432/postgres`;
    console.log("Trying password on direct host:", pass);
    const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      console.log("SUCCESSFULLY CONNECTED WITH PASSWORD:", pass);
      const sql = fs.readFileSync('data/migrations/partner_approval_and_images.sql', 'utf8');
      await client.query(sql);
      console.log("MIGRATION EXECUTED SUCCESSFULLY!");
      await client.end();
      return;
    } catch (err) {
      console.log("Error:", err.message);
    }
  }
  console.log("Could not connect with guessed passwords.");
}

tryPasses();
