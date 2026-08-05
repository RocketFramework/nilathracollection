import { createAdminClient } from '../src/utils/supabase/admin';

async function testConciergeSave() {
  console.log("=== Testing Concierge Verification ===");
  const supabase = createAdminClient();

  const { data: tour } = await supabase.from('tours').select('id').limit(1).single();
  if (!tour) return;
  console.log("Tour ID verified:", tour.id);
}

testConciergeSave().catch(err => {
  console.error("Test failed with error:", err);
});
