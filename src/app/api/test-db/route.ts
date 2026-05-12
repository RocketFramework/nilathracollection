import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch rooms for hotel A
  const { data: roomsA } = await supabase.from('hotel_rooms').select('id').eq('hotel_id', '95b5d64f-dd0f-4559-9a2a-2312ec0f1c3f');
  const idsA = roomsA?.map(r => r.id) || [];
  const { data: ratesA } = await supabase.from('room_rates').select('*').in('hotel_room_id', idsA);

  const { count } = await supabase.from('room_rates').select('*', { count: 'exact', head: true });

  return NextResponse.json({
    total_room_rates: count
  });
}
