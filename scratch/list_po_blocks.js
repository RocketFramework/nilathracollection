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
  try {
    // Get all purchase orders
    const { data: pos, error: posErr } = await db
      .from('purchase_orders')
      .select('*');

    if (posErr) throw posErr;
    console.log(`Found ${pos?.length || 0} purchase orders:`);
    for (const po of pos || []) {
      console.log(`PO ID: ${po.id}, Supplier/Vendor: "${po.vendor_name}", Tour ID: ${po.tour_id}, Block ID: ${po.po_block_id}, Status: ${po.status}`);
    }
  } catch (err) {
    console.error("Failed to list POs:", err);
  }
}

run();
