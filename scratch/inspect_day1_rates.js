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

  const { data: transports } = await supabase
    .from('tour_itinerary_transports')
    .select('*, tour_itineraries(day_number, date), transport_providers(*)')
    .eq('tour_id', tourId);

  console.log('Transports:');
  (transports || []).forEach(t => {
    console.log(`Day ${t.tour_itineraries?.day_number}: provider=${t.transport_providers?.name}, contracted_per_day_rate=${t.contracted_per_day_rate}, charged_per_day_rate=${t.charged_per_day_rate}`);
  });

  const { data: vehicles } = await supabase
    .from('tour_itinerary_vehicles')
    .select('*, tour_itineraries(day_number, date)')
    .eq('tour_id', tourId);

  console.log('Vehicles:');
  (vehicles || []).forEach(v => {
    console.log(`Day ${v.tour_itineraries?.day_number}: vehicle_id=${v.vehicle_id}, contracted_per_day_rate=${v.contracted_per_day_rate}, charged_per_day_rate=${v.charged_per_day_rate}`);
  });
}

main().catch(console.error);
