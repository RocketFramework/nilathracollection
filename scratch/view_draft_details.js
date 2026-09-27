const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDraft() {
  const { data: draft } = await supabase
    .from('draft_itinerary_versions')
    .select('*')
    .eq('tour_id', 'c0569dc7-0eb6-4362-a071-668b643f3b54')
    .eq('version_number', 17)
    .single();

  if (!draft) return;
  console.log('Version 17 label:', draft.label);
  console.log('Sample blocks from Version 17:');
  (draft.itinerary_data || []).forEach(b => {
    console.log(`Day ${b.dayNumber} [${b.type}] ${b.name}: agreedPrice=${b.agreedPrice}, baseRoomRate=${b.baseRoomRate}, hotelName=${b.hotelName}, hotelId=${b.hotelId}, qty=${b.quantity}`);
  });
}

inspectDraft();
