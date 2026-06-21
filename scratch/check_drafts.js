const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDrafts() {
  const { data: tours } = await supabase.from('tours').select('*').order('updated_at', { ascending: false }).limit(1);
  if (!tours || tours.length === 0) return;
  const tour = tours[0];

  const { data: drafts } = await supabase
    .from('draft_itinerary_versions')
    .select('*')
    .eq('tour_id', tour.id)
    .order('created_at', { ascending: false });

  console.log(`Tour ID: ${tour.id}`);
  console.log(`Tour Updated At: ${tour.updated_at}`);
  console.log('Drafts:');
  drafts.forEach(d => {
    console.log(`  Version: ${d.version_number}, Label: ${d.label}, Created At: ${d.created_at}`);
  });
}

checkDrafts();
