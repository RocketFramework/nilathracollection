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

const db = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const tourId = '60dec7e8-cbd9-4801-9f97-b41e5062fcc2';
  
  const { data: rfq, error: rfqErr } = await db
    .from('tour_rfq_emails')
    .select('id, subject, sent_at, po_block_id')
    .eq('tour_id', tourId);

  console.log("RFQ emails for tour:");
  console.log(rfq || rfqErr);

  const { data: rfp, error: rfpErr } = await db
    .from('tour_rfp_emails')
    .select('id, subject, sent_at, po_block_id')
    .eq('tour_id', tourId);

  console.log("RFP emails for tour:");
  console.log(rfp || rfpErr);
}

run();
