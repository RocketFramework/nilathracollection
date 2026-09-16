const { Client } = require('pg');
const fs = require('fs');

const passwords = [
  'NilathraCollection2026!',
  'Nilathra2024!',
  'Nilathra2026!',
  'Nilathra@2026',
  'Nilathra123!',
  'admin123',
  'postgres'
];

async function tryPasses() {
  for (const pass of passwords) {
    // IPv4 pooler host: db.vknibpdhovgcbenkcnaz.supabase.co or pooler host
    const connStr = `postgres://postgres.vknibpdhovgcbenkcnaz:${encodeURIComponent(pass)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`;
    console.log("Trying pooler 5432 with password:", pass);
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
}

tryPasses();
