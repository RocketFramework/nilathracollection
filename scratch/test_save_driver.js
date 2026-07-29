const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const testDriver = {
    first_name: "Test",
    last_name: "Driver",
    phone: "0771234567",
    license_number: "D12345",
    nic_number: "901234567V",
    per_day_rate: 15,
    is_suspended: false,
    has_contracted_price: true
  };

  console.log("--- Testing insert with ANON client ---");
  const { data: anonData, error: anonErr } = await anonClient.from('drivers').insert([testDriver]).select().single();
  console.log("Anon result:", anonData, "Anon error:", anonErr);

  console.log("\n--- Testing insert with ADMIN client ---");
  const { data: adminData, error: adminErr } = await adminClient.from('drivers').insert([testDriver]).select().single();
  console.log("Admin result:", adminData, "Admin error:", adminErr);

  if (adminData?.id) {
    await adminClient.from('drivers').delete().eq('id', adminData.id);
  }
}

test().catch(console.error);
