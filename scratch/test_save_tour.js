const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSave() {
  const { data: tours } = await supabase.from('tours').select('*').order('updated_at', { ascending: false }).limit(1);
  if (!tours || tours.length === 0) return;
  const tour = tours[0];
  const tripData = tour.planner_data;

  console.log('Original planner_data accommodations count:', tripData.accommodations?.length);
  
  // Let's print out what is currently in tripData accommodations for the Yala stay
  const yalaStay = tripData.accommodations.find(a => a.hotelName.includes('Yala'));
  console.log('Yala stay in tripData:', JSON.stringify(yalaStay, null, 2));

  // Let's query daily_activities in DB for this tour's sleep activities
  const { data: dbActs } = await supabase.from('daily_activities').select('*').eq('tour_id', tour.id).eq('activity_type', 'sleep');
  console.log('Daily activities (sleep) in DB before test:', dbActs.map(a => ({ day: a.itinerary_id, hotel_id: a.hotel_id, room_id: a.hotel_room_id })));
}

testSave();
