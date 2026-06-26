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
    // 1. Get a valid tour and po_block
    const { data: blocks, error: blockErr } = await db
      .from('po_blocks')
      .select('id, tour_id')
      .limit(1);

    if (blockErr) throw blockErr;
    if (!blocks || blocks.length === 0) {
      console.log("No PO blocks found to test with.");
      return;
    }

    const testBlock = blocks[0];
    console.log("Testing with block:", testBlock);

    // 2. Test inserting to tour_rfq_emails
    const rfqInsert = {
      tour_id: testBlock.tour_id,
      recipient_email: 'test-rfq@example.com',
      sender_email: 'concierge@nilathra.com',
      subject: 'Test RFQ Block ID Logging',
      body_html: '<p>Testing</p>',
      attachments: [],
      po_block_id: testBlock.id
    };

    const { data: insertedRfq, error: rfqErr } = await db
      .from('tour_rfq_emails')
      .insert([rfqInsert])
      .select('id, po_block_id')
      .single();

    if (rfqErr) {
      console.error("RFQ insert error:", rfqErr);
    } else {
      console.log("Successfully logged RFQ email with block ID:", insertedRfq);
      
      // Clean up test RFQ email
      await db.from('tour_rfq_emails').delete().eq('id', insertedRfq.id);
    }

    // 3. Test inserting to tour_rfp_emails
    const rfpInsert = {
      tour_id: testBlock.tour_id,
      recipient_email: 'test-rfp@example.com',
      sender_email: 'concierge@nilathra.com',
      subject: 'Test RFP Block ID Logging',
      body_html: '<p>Testing</p>',
      attachments: [],
      po_block_id: testBlock.id
    };

    const { data: insertedRfp, error: rfpErr } = await db
      .from('tour_rfp_emails')
      .insert([rfpInsert])
      .select('id, po_block_id')
      .single();

    if (rfpErr) {
      console.error("RFP insert error:", rfpErr);
    } else {
      console.log("Successfully logged RFP email with block ID:", insertedRfp);
      
      // Clean up test RFP email
      await db.from('tour_rfp_emails').delete().eq('id', insertedRfp.id);
    }

  } catch (err) {
    console.error("Test failed:", err);
  }
}

run();
