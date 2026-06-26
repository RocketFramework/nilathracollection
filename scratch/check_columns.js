const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually parse .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing supabase env variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data: rfq, error: rfqErr } = await supabase
    .from('tour_rfq_emails')
    .select('*')
    .limit(1);

  if (rfqErr) {
    console.error("rfqErr:", rfqErr);
  } else {
    console.log("tour_rfq_emails fields:", Object.keys(rfq[0] || {}));
  }

  const { data: rfp, error: rfpErr } = await supabase
    .from('tour_rfp_emails')
    .select('*')
    .limit(1);

  if (rfpErr) {
    console.error("rfpErr:", rfpErr);
  } else {
    console.log("tour_rfp_emails fields:", Object.keys(rfp[0] || {}));
  }
}

run();
