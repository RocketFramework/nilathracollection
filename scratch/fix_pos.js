const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPOs() {
  const res1 = await supabase.from('purchase_orders').update({
    subtotal: 15,
    total_amount: 15
  }).eq('po_number', 'PO-DRI-622705');
  console.log("Updated PO-DRI-622705:", res1.error || "Success");

  const res2 = await supabase.from('purchase_orders').update({
    subtotal: 15,
    total_amount: 15
  }).eq('po_number', 'PO-DRI-643945');
  console.log("Updated PO-DRI-643945:", res2.error || "Success");

  const res3 = await supabase.from('purchase_orders').update({
    subtotal: 180,
    total_amount: 180
  }).eq('po_number', 'PO-TRA-236784');
  console.log("Updated PO-TRA-236784:", res3.error || "Success");
}

fixPOs();
