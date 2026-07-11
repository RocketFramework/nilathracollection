import * as fs from 'fs';
import * as path from 'path';

// MUST load env before importing any services
try {
    const envPath = path.join(__dirname, '../.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
            process.env[key] = val;
        }
    });
} catch (e) {
    console.error("Could not read .env.local:", e);
}

const tourId = '9bfb345a-da5d-443a-8644-90148b0b3a5a';

async function run() {
    try {
        const { createClient } = await import('@supabase/supabase-js');
        const { TourService } = await import('../src/services/tour.service');

        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        
        // Find sleep activities for the tour
        const { data: stays } = await supabase
            .from('daily_activities')
            .select('id, hotel_id, itinerary_id')
            .eq('tour_id', tourId)
            .eq('activity_type', 'sleep');

        // Find Wallawwa hotel ID
        const { data: hotel } = await supabase
            .from('hotels')
            .select('id, name')
            .eq('name', 'Wallawwa by Teardrop Hotels')
            .single();

        // Mock selected rooms
        const selectedRooms = [
            {
                reqId: 'Double',
                roomId: '09036a61-702a-4520-a6e4-76ddcd51da9b',
                roomName: 'Wallawwa Bedroom',
                quantity: 1,
                contractedPrice: 380,
                mealPlan: 'HB'
            }
        ];

        const stayIds = stays?.map(s => s.id) || [];
        
        console.log("1. Running updateChangedHotel...");
        if (hotel) {
            await TourService.updateChangedHotel(tourId, stayIds, hotel.id, selectedRooms);
        }

        // Fetch planner_data immediately to simulate auto-save payload (since client state was updated)
        const { data: tour } = await supabase.from('tours').select('planner_data').eq('id', tourId).single();
        
        console.log("2. Running saveTour...");
        if (tour && tour.planner_data) {
            await TourService.saveTour(tourId, tour.planner_data);
        }
        
        // Query daily_activities again to see if hotel_id changed back or room IDs were updated
        const { data: finalStays } = await supabase
            .from('daily_activities')
            .select('id, hotel_id, double_room_id, double_room_count')
            .eq('tour_id', tourId)
            .eq('activity_type', 'sleep');
            
        console.log("Final stays in DB after updateChangedHotel + saveTour:", finalStays);

    } catch (e) {
        console.error("Error in simulation:", e);
    }
}

run();
