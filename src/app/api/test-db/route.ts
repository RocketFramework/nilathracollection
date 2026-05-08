import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET() {
    const { data: hotels } = await supabase.from('hotels').select('*').limit(5);
    const { data: rooms } = await supabase.from('hotel_rooms').select('*').limit(5);
    const { data: rates } = await supabase.from('room_rates').select('*').limit(5);

    return NextResponse.json({
        hotels,
        rooms,
        rates
    });
}
