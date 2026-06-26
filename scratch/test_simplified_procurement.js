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
    // 1. Get a valid block and daily activity to test with
    const { data: mappings, error: mapErr } = await db
      .from('po_block_daily_activities')
      .select('po_block_id, daily_activity_id')
      .limit(1);

    if (mapErr) throw mapErr;
    if (!mappings || mappings.length === 0) {
      console.log("No block-activity mappings found to test with.");
      return;
    }

    const testMapping = mappings[0];
    console.log("Testing with mapping:", testMapping);

    // Get the tour ID of the daily activity
    const { data: act } = await db
      .from('daily_activities')
      .select('tour_id')
      .eq('id', testMapping.daily_activity_id)
      .single();

    const tourId = act.tour_id;
    console.log("Tour ID:", tourId);

    // 2. Test inserting into tour_rfq_emails
    const rfqInsert = {
      tour_id: tourId,
      recipient_email: 'test-simplified@example.com',
      sender_email: 'concierge@nilathra.com',
      subject: 'Test Simplified RFQ Logging',
      body_html: '<p>Testing</p>',
      attachments: [],
      po_block_id: testMapping.po_block_id,
      vendor_id: '826eff6d-2e0e-40e2-ad4d-29c0b5246ba3', // Cinnamon Lodge Habarana ID or generic UUID
      vendor_name: 'Test Hotel',
      vendor_type: 'hotel',
      status: 'Sent',
      selected_vendor: false
    };

    const { data: insertedRfq, error: rfqErr } = await db
      .from('tour_rfq_emails')
      .insert([rfqInsert])
      .select('*')
      .single();

    if (rfqErr) throw rfqErr;
    console.log("1. Successfully inserted RFQ proposal:", insertedRfq.id);

    // 3. Test updating the quotation request
    const { data: updatedRfq, error: updateErr } = await db
      .from('tour_rfq_emails')
      .update({ quoted_price: 150, notes: 'Replied rate', status: 'Replied' })
      .eq('id', insertedRfq.id)
      .select('*')
      .single();

    if (updateErr) throw updateErr;
    console.log("2. Successfully updated RFQ proposal details:", updatedRfq.quoted_price);

    // 4. Test selecting the quotation
    // Simulating selectQuotation logic:
    // Mark all quotation emails for this block as not selected
    await db
      .from('tour_rfq_emails')
      .update({ selected_vendor: false, status: 'Sent' })
      .eq('po_block_id', testMapping.po_block_id);

    // Mark the chosen quotation email as Selected
    const { data: selectedRfq, error: selectErr } = await db
      .from('tour_rfq_emails')
      .update({ selected_vendor: true, status: 'Selected' })
      .eq('id', insertedRfq.id)
      .select('*')
      .single();

    if (selectErr) throw selectErr;
    console.log("3. Successfully set selected_vendor: true on RFQ proposal");

    // Update daily activity hotel_id
    const { error: actUpdateErr } = await db
      .from('daily_activities')
      .update({ hotel_id: selectedRfq.vendor_id })
      .eq('id', testMapping.daily_activity_id);

    if (actUpdateErr) throw actUpdateErr;
    console.log("4. Successfully updated daily activity hotel_id to:", selectedRfq.vendor_id);

    // Validate the update
    const { data: updatedAct } = await db
      .from('daily_activities')
      .select('hotel_id')
      .eq('id', testMapping.daily_activity_id)
      .single();

    console.log("5. Verified daily activity hotel_id in database:", updatedAct.hotel_id);

    // Clean up test RFQ email and restore daily activity hotel_id
    await db.from('tour_rfq_emails').delete().eq('id', insertedRfq.id);
    await db.from('daily_activities').update({ hotel_id: null }).eq('id', testMapping.daily_activity_id);
    console.log("6. Cleanup complete.");

  } catch (err) {
    console.error("Test failed:", err);
  }
}

run();
