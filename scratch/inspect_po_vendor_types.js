const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const { data: pos } = await supabase
    .from('purchase_orders')
    .select('id, po_number, vendor_name, vendor_type, status, total_amount, currency')
    .limit(20);
    
  console.log("=== PURCHASE ORDERS SAMPLE ===");
  console.table(pos);
}

inspect().catch(console.error);
