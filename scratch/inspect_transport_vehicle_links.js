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
    .select('*, tour_itineraries(day_number), transport_providers(name)')
    .eq('tour_id', tourId);

  const { data: vehicles } = await supabase
    .from('tour_itinerary_vehicles')
    .select('*, tour_itineraries(day_number)')
    .eq('tour_id', tourId);

  console.log('Transports mapping:');
  (transports || []).forEach(t => {
    console.log(`Day ${t.tour_itineraries?.day_number}: Provider = "${t.transport_providers?.name}" (${t.transport_provider_id}), Vehicle = ${t.vehicle_id}`);
  });

  console.log('\nVehicles rate mapping:');
  (vehicles || []).forEach(v => {
    console.log(`Day ${v.tour_itineraries?.day_number}: Vehicle = ${v.vehicle_id}, contracted_rate = ${v.contracted_per_day_rate}`);
  });
}

main().catch(console.error);
