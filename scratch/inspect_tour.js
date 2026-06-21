const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectLatestTour() {
  // Get latest tour
  const { data: tours, error: tourError } = await supabase
    .from('tours')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (tourError || !tours || tours.length === 0) {
    console.error('Error fetching tours:', tourError);
    return;
  }

  const tour = tours[0];
  console.log('--- LATEST TOUR ---');
  console.log('ID:', tour.id);
  console.log('Title:', tour.title);
  console.log('Status:', tour.status);
  console.log('Updated At:', tour.updated_at);
  console.log('Planner Data Accommodations:', JSON.stringify(tour.planner_data?.accommodations, null, 2));
  console.log('--- PLANNER DATA ITINERARY (Sleep blocks) ---');
  const sleepBlocks = (tour.planner_data?.itinerary || []).filter(b => b.type === 'sleep');
  sleepBlocks.forEach(b => {
    console.log(`Day ${b.dayNumber}: ID: ${b.id}, Name: ${b.name}, Hotel ID: ${b.hotelId}, Hotel Name: ${b.hotelName}, Room Name: ${b.roomName}`);
  });


  // Get daily activities
  const { data: activities, error: actError } = await supabase
    .from('daily_activities')
    .select('*, tour_itineraries(day_number, date)')
    .eq('tour_id', tour.id);

  if (actError) {
    console.error('Error fetching daily activities:', actError);
    return;
  }

  console.log('--- DAILY ACTIVITIES (Sleep type only) ---');
  const sleepActs = activities.filter(a => a.activity_type === 'sleep');
  sleepActs.forEach(a => {
    console.log(`Day ${a.tour_itineraries?.day_number}: ID: ${a.id}, Title: ${a.title}, Hotel ID: ${a.hotel_id}, Hotel Room ID: ${a.hotel_room_id}`);
    console.log(`  Rooms: single_room_count=${a.single_room_count}, double_room_count=${a.double_room_count}, triple_room_count=${a.triple_room_count}, family_room_count=${a.family_room_count}`);
  });
}

inspectLatestTour();
