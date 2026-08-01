const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5OTk3MDUsImV4cCI6MjA4NzU3NTcwNX0.gllt4Cf-5PSd4mnxZYDfcEemZPPQBNJUSr93xziVwAY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("=== Querying Transport Providers ===");
    const { data: providers, error: pErr } = await supabase.from('transport_providers').select('*');
    if (pErr) console.error("Providers error:", pErr);
    else console.log(`Found ${providers.length} providers:`, providers.map(p => ({ id: p.id, name: p.name })));

    console.log("=== Querying Transport Vehicles ===");
    const { data: vehicles, error: vErr } = await supabase.from('transport_vehicles').select('*');
    if (vErr) console.error("Vehicles error:", vErr);
    else console.log(`Found ${vehicles.length} vehicles:`, vehicles.map(v => ({ id: v.id, provider_id: v.provider_id, make: v.make, model: v.model, make_and_model: v.make_and_model, vehicle_number: v.vehicle_number })));
}

check();
