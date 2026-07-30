const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
  console.log('--- Creating tour_itinerary_transports table ---');
  const sql = `
  CREATE TABLE IF NOT EXISTS public.tour_itinerary_transports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE,
      tour_itinerary_id UUID REFERENCES public.tour_itineraries(id) ON DELETE CASCADE,
      transport_provider_id UUID REFERENCES public.transport_providers(id) ON DELETE SET NULL,
      vehicle_id UUID REFERENCES public.transport_vehicles(id) ON DELETE SET NULL,
      
      -- Contracted Cost (buying)
      contracted_per_day_rate NUMERIC(12,2) DEFAULT 0.00,
      contracted_excess_mileage_cost NUMERIC(12,2) DEFAULT 0.00,
      contracted_other_allowance NUMERIC(12,2) DEFAULT 0.00,
      
      -- Charged Price (selling)
      charged_per_day_rate NUMERIC(12,2) DEFAULT 0.00,
      charged_excess_mileage_cost NUMERIC(12,2) DEFAULT 0.00,
      charged_other_allowance NUMERIC(12,2) DEFAULT 0.00,
      
      route_path TEXT,
      distance_km NUMERIC(10,2) DEFAULT 0.00,
      notes TEXT,
      
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_tit_tour_id ON public.tour_itinerary_transports(tour_id);
  CREATE INDEX IF NOT EXISTS idx_tit_itinerary_id ON public.tour_itinerary_transports(tour_itinerary_id);
  CREATE INDEX IF NOT EXISTS idx_tit_provider_id ON public.tour_itinerary_transports(transport_provider_id);

  ALTER TABLE public.tour_itinerary_transports ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS admin_agent_finance_all_tit ON public.tour_itinerary_transports;
  CREATE POLICY admin_agent_finance_all_tit
      ON public.tour_itinerary_transports
      FOR ALL
      TO authenticated, service_role
      USING (true)
      WITH CHECK (true);
  `;

  // Write to migration file as well
  fs.writeFileSync('data/migrations/create_tour_itinerary_transports.sql', sql);
  console.log('Saved to data/migrations/create_tour_itinerary_transports.sql');

  // Test insert/select table test
  const { data, error } = await supabase.from('tour_itinerary_transports').select('*').limit(1);
  if (error && error.code === '42P01') {
    console.log('Table does not exist yet in Supabase. Attempting RPC execution...');
    // Execute raw SQL via rpc if available, or postgres connection
  } else {
    console.log('Table exists or check result:', data, error);
  }
}

runMigration();
