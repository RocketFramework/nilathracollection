const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const id = '35b2f9ec-827a-4419-b598-d81b05ea82fb';
(async () => {
  const t = await sb.from('tours').select('id,title,start_date,end_date,updated_at').eq('id', id);
  console.log('tour', JSON.stringify(t.data), t.error);
  const it = await sb.from('tour_itineraries').select('id,day_number,date').eq('tour_id', id).order('day_number');
  console.log('itineraries', JSON.stringify(it.data));
  const tr = await sb.from('tour_itinerary_transports').select('id,tour_id,tour_itinerary_id,transport_provider_id,vehicle_id,updated_at').eq('tour_id', id);
  console.log('transports', JSON.stringify(tr.data), tr.error);
  const b = await sb.from('po_blocks').select('id,name,block_type,has_finalized,created_at').eq('tour_id', id).eq('block_type','travel');
  console.log('travel blocks', JSON.stringify(b.data));
})();
