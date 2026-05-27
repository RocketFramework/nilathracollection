import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: acts, error } = await supabase
    .from('daily_activities')
    .select('*')
    .eq('tour_id', '60dec7e8-cbd9-4801-9f97-b41e5062fcc2');

  const { data: pos, error: poErr } = await supabase
    .from('purchase_orders')
    .select('*, items:purchase_order_items(*)')
    .eq('tour_id', '60dec7e8-cbd9-4801-9f97-b41e5062fcc2');

  return NextResponse.json({
    success: !error && !poErr,
    error: error?.message || poErr?.message,
    activitiesCount: acts?.length || 0,
    posCount: pos?.length || 0,
    activities: acts,
    pos: pos
  });
}
