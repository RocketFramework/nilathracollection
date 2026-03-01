import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('vendors').select('*, payment_details(*), vendor_activities(*)').order('name');
  if (error) console.error("Error:", error);
  else {
    console.log("Total vendors:", data.length);
    const withActs = data.filter(v => v.vendor_activities && v.vendor_activities.length > 0);
    console.log("Vendors with activities:", withActs.length);
    if (withActs.length > 0) {
      console.log("Sample activities type of activity_id:", typeof withActs[0].vendor_activities[0].activity_id);
      console.log("Sample activities:", withActs[0].vendor_activities);
    }
  }
}
run();
