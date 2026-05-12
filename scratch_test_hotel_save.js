require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: hotelData } = await supabase.from('hotels').select('id').limit(1);
  if (!hotelData || hotelData.length === 0) return console.log("No hotels");
  
  const hotelId = hotelData[0].id;
  const { data: roomData, error: rError } = await supabase.from('hotel_rooms').insert([{ hotel_id: hotelId, room_name: 'Test Room', max_guests: 2 }]).select().single();
  
  if (rError) return console.log("Room error", rError);
  
  const rateData = {
    hotel_room_id: roomData.id,
    start_date: null,
    end_date: null,
    sgl_bb_rate: null,
    meal_plan_type: 'BB',
    breakfast_included: true
  };
  
  const { data: ratesData, error: ratesError } = await supabase.from('room_rates').insert([rateData]).select();
  if (ratesError) {
    console.log("Rates error", ratesError);
  } else {
    console.log("Rates saved successfully", ratesData);
  }
  
  // Cleanup
  await supabase.from('hotel_rooms').delete().eq('id', roomData.id);
}

test();
