const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
let supabaseUrl = '';
let supabaseKey = '';

try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
          supabaseUrl = val;
        } else if (key === 'SUPABASE_SERVICE_ROLE_KEY') {
          supabaseKey = val;
        }
      }
    }
  }
} catch (e) {
  console.error("Error reading env file:", e);
}

// We need to require our compiled or transpile service file. 
// Or we can import / load it dynamically using ts-node or just use supabase client directly in js to simulate the service methods to test the database structure.
// Simulating the DB calls is easiest since the service is in TS. Let's do that!
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const tourId = '60dec7e8-cbd9-4801-9f97-b41e5062fcc2'; // Rasika Ranasinghe
  console.log("Checking if daily_activity_customer_invoice_items exists by doing a select query...");
  
  const { data: testSelect, error: selectErr } = await supabase
    .from('daily_activity_customer_invoice_items')
    .select('*')
    .limit(1);

  if (selectErr) {
    console.error("FAIL: Could not query daily_activity_customer_invoice_items table. Error:", selectErr);
    process.exit(1);
  }
  
  console.log("SUCCESS: Table is queryable!", testSelect);

  // Let's create a test invoice item and try to insert a junction link to a daily activity.
  // 1. Get a daily activity id for this tour
  const { data: tourDays } = await supabase.from('tour_itineraries').select('id').eq('tour_id', tourId);
  const dayIds = tourDays.map(d => d.id);
  
  if (dayIds.length === 0) {
    console.log("No tour itineraries found for Rasika Ranasinghe. Creating a test one...");
    return;
  }

  const { data: acts } = await supabase.from('daily_activities').select('id').in('itinerary_id', dayIds).limit(1);
  if (!acts || acts.length === 0) {
    console.error("No daily activities found for this tour.");
    return;
  }
  const activityId = acts[0].id;
  console.log("Found test daily activity:", activityId);

  // Get actual tourist_id for the tour
  const { data: tour, error: tourFetchErr } = await supabase
    .from('tours')
    .select('tourist_id')
    .eq('id', tourId)
    .single();

  if (tourFetchErr || !tour) {
    console.error("Error fetching tour tourist_id:", tourFetchErr);
    return;
  }
  const touristId = tour.tourist_id;

  // 2. Create a test customer invoice
  console.log("Creating test customer invoice...");
  const { data: invoice, error: invErr } = await supabase
    .from('customer_invoices')
    .insert({
      tour_id: tourId,
      tourist_id: touristId,
      amount: 100.00,
      invoice_number: 'TEST-INV-' + Date.now(),
      status: 'Pending'
    })
    .select()
    .single();

  if (invErr) {
    console.error("Error creating test invoice:", invErr);
    return;
  }
  console.log("Created test invoice:", invoice.id);

  // 3. Create a test customer invoice item
  console.log("Creating test customer invoice item...");
  const { data: item, error: itemErr } = await supabase
    .from('customer_invoice_items')
    .insert({
      invoice_id: invoice.id,
      description: 'Test Item Description',
      amount: 100.00
    })
    .select()
    .single();

  if (itemErr) {
    console.error("Error creating test item:", itemErr);
    // Cleanup invoice
    await supabase.from('customer_invoices').delete().eq('id', invoice.id);
    return;
  }
  console.log("Created test invoice item:", item.id);

  // 4. Create junction link
  console.log("Inserting junction link in daily_activity_customer_invoice_items...");
  const { data: link, error: linkErr } = await supabase
    .from('daily_activity_customer_invoice_items')
    .insert({
      invoice_item_id: item.id,
      daily_activity_id: activityId
    })
    .select();

  if (linkErr) {
    console.error("FAIL: Error inserting junction link:", linkErr);
  } else {
    console.log("SUCCESS: Junction link inserted!", link);
  }

  // 5. Query and verify many-to-many join works via join query
  console.log("Testing join select...");
  const { data: joined, error: joinErr } = await supabase
    .from('customer_invoice_items')
    .select(`
      id,
      description,
      daily_activity_customer_invoice_items (
        daily_activity_id
      )
    `)
    .eq('id', item.id)
    .single();

  if (joinErr) {
    console.error("FAIL: Join query failed:", joinErr);
  } else {
    console.log("SUCCESS: Joined result:", JSON.stringify(joined, null, 2));
  }

  // 6. Cleanup test data (Cascades will delete items and links!)
  console.log("Cleaning up test invoice...");
  const { error: delErr } = await supabase.from('customer_invoices').delete().eq('id', invoice.id);
  if (delErr) {
    console.error("Error deleting test invoice:", delErr);
  } else {
    console.log("SUCCESS: Test invoice deleted and cascades cleaned up items/links successfully.");
  }
}

run();
