const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const tourId = '60dec7e8-cbd9-4801-9f97-b41e5062fcc2';
  const { data: acts, error } = await supabase
    .from('daily_activities')
    .select('id, title, activity_type, hotel_id, hotel_room_id, itinerary_id, tour_itineraries(day_number)')
    .eq('tour_id', tourId);

  if (error) {
    console.error(error);
    return;
  }

  console.log("Daily activities from database:");
  acts.forEach(a => {
    if (a.activity_type === 'sleep') {
      console.log(`ID: ${a.id}, Title: ${a.title}, Day: ${a.tour_itineraries?.day_number}, Hotel ID: ${a.hotel_id}, Hotel Room ID: ${a.hotel_room_id}`);
    }
  });
}

run();
