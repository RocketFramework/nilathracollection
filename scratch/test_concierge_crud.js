const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envText = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envText.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  try {
    console.log("--- 1. Testing Read ---");
    const { data: initialItems, count } = await supabase.from('seamless_concierge_cost_items').select('*', { count: 'exact' });
    console.log("Read success! Count:", count);

    console.log("--- 2. Testing Insert ---");
    const testItem = {
      cost_code: 'SC-TEST-999',
      title: 'Automated Test Concierge Service',
      details: 'Created during verification test',
      category: 'Test Category',
      default_cost: 99.50,
      currency: 'USD',
      costing_basis: 'per_service',
      is_generic: true,
      is_active: true
    };
    const { data: inserted, error: insertErr } = await supabase.from('seamless_concierge_cost_items').insert([testItem]).select().single();
    if (insertErr) throw insertErr;
    console.log("Insert success! ID:", inserted.id, "Code:", inserted.cost_code);

    console.log("--- 3. Testing Update ---");
    const { error: updateErr } = await supabase.from('seamless_concierge_cost_items').update({ default_cost: 150.00, title: 'Updated Test Service' }).eq('id', inserted.id);
    if (updateErr) throw updateErr;
    console.log("Update success!");

    console.log("--- 4. Testing Delete ---");
    const { error: delErr } = await supabase.from('seamless_concierge_cost_items').delete().eq('id', inserted.id);
    if (delErr) throw delErr;
    console.log("Delete success!");

    console.log("\nALL CRUD VERIFICATION CHECKS PASSED CLEANLY!");
  } catch (e) {
    console.error("Verification failed:", e.message || e);
  }
}

run();
