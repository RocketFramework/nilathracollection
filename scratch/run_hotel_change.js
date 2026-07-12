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

// Replicate the database update logic of TourService.updateChangedHotel
async function run() {
  try {
    const tourId = '9bfb345a-da5d-443a-8644-90148b0b3a5a';
    const stayIds = [
      '1fe01e42-0b03-44f9-8aec-9cb0b47a4b2b',
      '2d993260-49d5-48df-8c75-28052979f857',
      '94797ffb-d778-4c4d-a8fb-fd299f8d503c'
    ];
    // New hotel ID: Cinnamon Lakeside Colombo (d216269a-d193-47dd-9412-7dc125ee0e79)
    const newHotelId = 'd216269a-d193-47dd-9412-7dc125ee0e79';
    const selectedRooms = [
      { roomId: 'bfbe1102-1de2-4c2c-8cb4-b20c29a28e0b', roomName: 'Deluxe Room', quantity: 2, contractedPrice: 100, pricePerNight: 110, mealPlan: 'BB', reqId: 'Double' }
    ];

    console.log("--- RUNNING HOTEL CHANGE ---");
    // We will import TourService and call updateChangedHotel
    const { TourService } = require('../dist/services/tour.service.js'); // compile or check path
  } catch (err) {
    // If import fails, we can just run the query simulation with actual DB updates (on a copy/restore pattern)
    console.log("Failed to import TourService directly, simulating using SQL queries...");
    await runDbSimulation();
  }
}

async function runDbSimulation() {
  const tourId = '9bfb345a-da5d-443a-8644-90148b0b3a5a';
  const stayIds = [
    '1fe01e42-0b03-44f9-8aec-9cb0b47a4b2b',
    '2d993260-49d5-48df-8c75-28052979f857',
    '94797ffb-d778-4c4d-a8fb-fd299f8d503c'
  ];
  const newHotelId = 'd216269a-d193-47dd-9412-7dc125ee0e79'; // Cinnamon Lakeside Colombo
  const newHotelName = 'Cinnamon Lakeside Colombo';
  const oldHotelName = 'Ceylon Tea Trails - Summerville Bungalow';

  // 1. Get poBlockIds
  const { data: junctionData } = await db.from('po_block_daily_activities').select('po_block_id').in('daily_activity_id', stayIds);
  const poBlockIds = Array.from(new Set((junctionData || []).map((r) => r.po_block_id).filter(Boolean)));
  console.log("poBlockIds:", poBlockIds);

  // Let's run the DB updates that our code runs:
  // Update po_blocks name
  if (poBlockIds.length > 0) {
    console.log("Updating po_blocks names to:", `${newHotelName} Block`);
    const { data: updatedBlocks, error: updateErr } = await db
      .from('po_blocks')
      .update({ name: `${newHotelName} Block` })
      .in('id', poBlockIds)
      .select('*');
    if (updateErr) throw updateErr;
    console.log("Updated blocks:", updatedBlocks.map(b => ({ id: b.id, name: b.name })));
  }

  // Get all blocks now to verify
  const { data: allBlocks } = await db.from('po_blocks').select('*').eq('tour_id', tourId);
  console.log("All Blocks after update:", allBlocks.map(b => ({ id: b.id, name: b.name })));

  // Clean up: Restore the block name
  if (poBlockIds.length > 0) {
    await db.from('po_blocks').update({ name: `${oldHotelName} Block` }).in('id', poBlockIds);
    console.log("Restored original block name.");
  }
}

run();
