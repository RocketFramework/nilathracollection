const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const tourId = '60dec7e8-cbd9-4801-9f97-b41e5062fcc2';
  
  const { data: tour } = await supabase.from('tours').select('planner_data, updated_at').eq('id', tourId).single();
  console.log("Tour updated_at:", tour.updated_at);
  console.log("Tour accommodations for Night 9, 10, 11:");
  const accs = tour.planner_data?.accommodations || [];
  accs.filter(a => [9, 10, 11].includes(a.nightIndex)).forEach(a => {
    console.log(`Night ${a.nightIndex}: Hotel Name: ${a.hotelName}, Hotel ID: ${a.hotelId}, Room ID: ${a.roomId}`);
  });

  const { data: drafts } = await supabase
    .from('draft_itinerary_versions')
    .select('*')
    .eq('tour_id', tourId)
    .order('version_number', { ascending: false })
    .limit(1);

  if (drafts && drafts.length > 0) {
    const draft = drafts[0];
    console.log(`Latest Draft: Version ${draft.version_number}, Created At ${draft.created_at}`);
    const itinerary = draft.itinerary_data || [];
    itinerary.filter(b => b.type === 'sleep' && [9, 10, 11].includes(b.dayNumber)).forEach(b => {
      console.log(`Day ${b.dayNumber}: Hotel ID: ${b.hotelId}, Hotel Name: ${b.hotelName}, Room Name: ${b.roomName}`);
    });
  } else {
    console.log("No drafts found.");
  }
}

run();
