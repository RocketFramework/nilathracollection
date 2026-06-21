const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectItinerarySleepBlocks() {
  const { data: tours } = await supabase.from('tours').select('*').order('updated_at', { ascending: false }).limit(1);
  if (!tours || tours.length === 0) return;
  const tour = tours[0];
  const itinerary = tour.planner_data?.itinerary || [];
  
  console.log('Sleep blocks in itinerary:');
  itinerary.filter(b => b.type === 'sleep').forEach(b => {
    console.log(`Day ${b.dayNumber}: Name: ${b.name}, hotelId: ${b.hotelId}, hotelName: ${b.hotelName}, roomName: ${b.roomName}, isCustomPO: ${b.isCustomPO}`);
  });
}

inspectItinerarySleepBlocks();
