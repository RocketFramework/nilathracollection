import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length > 0) {
      process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

import { createAdminClient } from '../src/utils/supabase/admin.ts';

async function main() {
  const supabase = createAdminClient();
  const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';

  const [tRes, vRes] = await Promise.all([
    supabase.from('tour_itinerary_transports').select('*, tour_itineraries(day_number)').eq('tour_id', tourId),
    supabase.from('tour_itinerary_vehicles').select('*, tour_itineraries(day_number)').eq('tour_id', tourId)
  ]);

  const trs = tRes.data || [];
  const vrs = vRes.data || [];

  trs.forEach(tr => {
    const dayNum = tr.tour_itineraries?.day_number || 1;
    const matchingVr = vrs.find(vr => vr.tour_itinerary_id === tr.tour_itinerary_id && vr.vehicle_id === tr.vehicle_id);
    console.log(`Day ${dayNum} (${tr.transport_provider_id}): matchingVr contracted_per_day_rate =`, matchingVr?.contracted_per_day_rate);
  });
}

main().catch(console.error);
