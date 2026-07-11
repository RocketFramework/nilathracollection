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
  const { data: allRfps, error: allRfpsErr } = await db
    .from('tour_rfp_emails')
    .select('*');
  console.log("All RFP emails in database:", allRfps || allRfpsErr);

  const { data: allRfqs, error: allRfqsErr } = await db
    .from('tour_rfq_emails')
    .select('*');
  console.log("All RFQ emails in database:", allRfqs || allRfqsErr);
  
  // Let's get the 5 most recent tours
  const { data: tours, error: toursErr } = await db
    .from('tours')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (toursErr) {
    console.error("Error fetching tours:", toursErr);
    return;
  }

  console.log("Recent tours:");
  for (const t of tours) {
    console.log(`Tour ID: ${t.id}`);
    
    // Fetch blocks for this tour
    const { data: blocks, error: blocksErr } = await db
      .from('po_blocks')
      .select('id, name, block_type, block_number, has_finalized')
      .eq('tour_id', t.id);
    
    console.log(`  Blocks count: ${blocks ? blocks.length : 0}`);
    if (blocks) {
      for (const b of blocks) {
        console.log(`    Block: ${b.name} (Type: ${b.block_type}, Finalized: ${b.has_finalized}, ID: ${b.id})`);
      }
    }

    // Fetch tour RFP emails
    const { data: rfps, error: rfpsErr } = await db
      .from('tour_rfp_emails')
      .select('id, subject, recipient_email, po_block_id, vendor_name')
      .eq('tour_id', t.id);
    
    console.log(`  RFP emails count: ${rfps ? rfps.length : 0}`);
    if (rfps) {
      for (const r of rfps) {
        console.log(`    RFP Email: ${r.subject} to ${r.recipient_email} (Block ID: ${r.po_block_id}, Vendor: ${r.vendor_name})`);
      }
    }
    
    console.log("-----------------------------------------");
  }
}

run();
