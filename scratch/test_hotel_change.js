const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
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

const { TourService } = require('../src/services/tour.service');
const tourId = '9bfb345a-da5d-443a-8644-90148b0b3a5a';

async function run() {
    try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        
        // Find sleep activities for the tour
        const { data: stays, error: err1 } = await supabase
            .from('daily_activities')
            .select('id, hotel_id, itinerary_id')
            .eq('tour_id', tourId)
            .eq('activity_type', 'sleep');
        if (err1) throw err1;

        console.log("Found sleep stays:", stays);
        
        // Find Wallawwa hotel ID
        const { data: hotel, error: err2 } = await supabase
            .from('hotels')
            .select('id, name')
            .eq('name', 'Wallawwa by Teardrop Hotels')
            .single();
        if (err2) throw err2;

        console.log("Target Hotel:", hotel);

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

        const stayIds = stays.map(s => s.id);
        console.log("Calling updateChangedHotel with:", {
            tourId,
            stayIds,
            newHotelId: hotel.id,
            selectedRooms
        });

        await TourService.updateChangedHotel(tourId, stayIds, hotel.id, selectedRooms);
        console.log("updateChangedHotel completed successfully!");

    } catch (e) {
        console.error("Error in simulation:", e);
    }
}

run();
