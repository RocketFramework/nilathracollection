const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function runTest() {
  console.log('--- Testing Multi-Activity Booking System ---');

  // 1. Get sample activity and sample vendor
  const { data: acts } = await supabase.from('activities').select('id, activity_name').limit(2);
  const { data: vends } = await supabase.from('vendors').select('id, name').limit(1);

  if (!acts || acts.length === 0) {
    console.error('No activities found in DB!');
    return;
  }
  console.log('Found activities:', acts.map(a => `${a.id}: ${a.activity_name}`));

  const testEmail = `test_tourist_${Date.now()}@example.com`;
  console.log('Using test tourist email:', testEmail);

  // 2. Create test user
  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'TestPassword123!',
    email_confirm: true
  });
  if (authErr) {
    console.error('Auth error:', authErr);
    return;
  }
  const touristId = authUser.user.id;
  console.log('Created test user:', touristId);

  await supabase.from('users').upsert({ id: touristId, email: testEmail });

  // 3. Insert header & items
  const bookingNumber = `ACT-TEST-${Date.now().toString().slice(-4)}`;
  const bookingId = crypto.randomUUID();

  const { data: header, error: hErr } = await supabase.from('activity_bookings').insert([{
    id: bookingId,
    booking_number: bookingNumber,
    tourist_id: touristId,
    status: 'Pending Assignment',
    currency: 'USD'
  }]).select().single();

  if (hErr) {
    console.error('Header insert error:', hErr);
    return;
  }
  console.log('Created booking header:', header.booking_number);

  const items = acts.map(a => ({
    id: crypto.randomUUID(),
    booking_id: bookingId,
    activity_id: a.id,
    booking_date: '2026-11-15',
    preferred_time_slot: 'Morning',
    adults: 2,
    children: 1,
    infants: 0,
    status: 'Pending Assignment'
  }));

  const { data: insertedItems, error: iErr } = await supabase.from('activity_booking_items').insert(items).select();
  if (iErr) {
    console.error('Items insert error:', iErr);
    return;
  }
  console.log(`Inserted ${insertedItems.length} activity session items!`);

  // 4. Query tourist bookings
  const { data: fetched, error: fErr } = await supabase.from('activity_bookings')
    .select('*, items:activity_booking_items(*, activity:activities(activity_name))')
    .eq('id', bookingId)
    .single();

  if (fErr) {
    console.error('Query error:', fErr);
    return;
  }
  console.log('Successfully queried booking with items:', fetched.items.map((i) => i.activity?.activity_name));

  // 5. Cleanup test data
  await supabase.from('activity_booking_items').delete().eq('booking_id', bookingId);
  await supabase.from('activity_bookings').delete().eq('id', bookingId);
  await supabase.auth.admin.deleteUser(touristId);

  console.log('--- Test Completed Successfully! ---');
}

runTest();
