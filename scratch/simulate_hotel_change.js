const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually parse .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const db = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  try {
    const tourId = '9bfb345a-da5d-443a-8644-90148b0b3a5a';
    
    // Stays for Cinnamon Lakeside Colombo Block
    const stayIds = [
      '1096d375-3dbb-4b16-8ead-37c574dceee8',
      '57c0a58c-7e17-4a67-9b9c-69ef42196b70'
    ];
    const newHotelId = '7cfc7adf-5b81-4ba1-9f45-8dd3829ac924'; // Ceylon Tea Trails
    
    console.log("--- BEFORE SIMULATION ---");
    const { data: blocksBefore } = await db.from('po_blocks').select('*').eq('tour_id', tourId);
    console.log("Blocks:", blocksBefore.map(b => ({ id: b.id, name: b.name })));
    
    // 1. Fetch new hotel
    const { data: newHotel } = await db.from('hotels').select('name, location_address, reservation_agent_contact, reservation_email').eq('id', newHotelId).single();
    
    // 2. Fetch firstStay
    const { data: firstStay } = await db.from('daily_activities').select('hotel_id').in('id', stayIds).limit(1).single();
    const oldHotelId = firstStay.hotel_id;
    const { data: oldHotel } = await db.from('hotels').select('name').eq('id', oldHotelId).single();
    const oldHotelName = oldHotel.name;
    console.log("Old Hotel Name:", oldHotelName);
    
    // 3. Fetch poBlockIds
    const { data: junctionData } = await db.from('po_block_daily_activities').select('po_block_id').in('daily_activity_id', stayIds);
    const poBlockIds = Array.from(new Set((junctionData || []).map((r) => r.po_block_id).filter(Boolean)));
    console.log("poBlockIds to update:", poBlockIds);
    
    // 4. Fetch mapped activities
    let mappedActivityIds = [];
    if (poBlockIds.length > 0) {
        const { data: mappedActs } = await db
            .from('po_block_daily_activities')
            .select('daily_activity_id')
            .in('po_block_id', poBlockIds);
        mappedActivityIds = (mappedActs || []).map(m => m.daily_activity_id);
    }
    console.log("Mapped activity IDs in this block:", mappedActivityIds);
    
    // 5. Let's see what blocks would be updated:
    console.log("Blocks that would be renamed:");
    const { data: blocksToUpdate } = await db.from('po_blocks').select('*').in('id', poBlockIds);
    console.log(blocksToUpdate.map(b => ({ id: b.id, name: b.name })));
    
  } catch (err) {
    console.error("Simulation failed:", err);
  }
}

run();
