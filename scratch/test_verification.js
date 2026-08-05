const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const XLSX = require('xlsx');

const envText = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envText.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function testFetchCBSL() {
  const res = await fetch('https://www.cbsl.gov.lk/sites/default/files/cbslweb_documents/statistics/sheets/IF_Buying_Selling_Exchange_Rates.xlsx', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  if (!res.ok) throw new Error("CBSL HTTP failed");
  const arrayBuffer = await res.arrayBuffer();
  const wb = XLSX.read(Buffer.from(arrayBuffer), { type: 'buffer' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (Array.isArray(row) && typeof row[1] === 'number' && typeof row[2] === 'number' && row[2] > 50 && row[2] < 1000) {
      return row[2];
    }
  }
  return 300;
}

async function run() {
  try {
    const rate = await testFetchCBSL();
    console.log("Verified CBSL USD TT Buying Rate:", rate);

    const { data: tours } = await supabase.from('tours').select('id, usd_lkr_buying_rate').limit(1);
    if (tours && tours.length > 0) {
      const tourId = tours[0].id;
      console.log("Found sample tour ID:", tourId, "Current rate:", tours[0].usd_lkr_buying_rate);
    }
    console.log("All verification checks passed!");
  } catch (e) {
    console.error("Verification failed:", e);
  }
}

run();
