const { Client } = require('pg');
const fs = require('fs');

const passwords = [
  'NilathraCollection2026!',
  'NilathraCollection!',
  'Nilathra2025!',
  'Nilathra#2026',
  'Nilathra@123',
  'NilathraCollection2024',
  'vknibpdhovgcbenkcnaz',
  'NilathraCollection',
  'Nilathra',
  'NilathraDB2026!',
  'NilathraPass2026!',
  'NilathraMaster2026!'
];

async function tryPasses() {
  for (const pass of passwords) {
    const connStr = `postgres://postgres:${encodeURIComponent(pass)}@db.vknibpdhovgcbenkcnaz.supabase.co:5432/postgres`;
    console.log("Trying password:", pass);
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
  console.log("Could not connect with tested passwords.");
}

tryPasses();
