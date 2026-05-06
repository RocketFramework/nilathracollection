import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('activities').insert([
    {
      activity_name: "Test Activity",
      category: "Test Category",
      location_name: "Test Location",
      district: "Test District",
      description: "Test",
      duration_hours: 1,
      time_flexible: true,
      price: 100,
      optimal_start_time: "09:00:00",
      optimal_end_time: "10:00:00"
    }
  ]).select().single();
  console.log("Result:", data, error);
}
test();
