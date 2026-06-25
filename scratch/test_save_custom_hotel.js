const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function loadEnv() {
    try {
        const envContent = fs.readFileSync('.env.local', 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const parts = trimmed.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    let val = parts.slice(1).join('=').trim();
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.slice(1, -1);
                    }
                    env[key] = val;
                }
            }
        });
        return env;
    } catch (e) {
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Import TourService or simulate its logic
async function run() {
    const tourId = '60dec7e8-cbd9-4801-9f97-b41e5062fcc2';
    
    // 1. Fetch tour
    const { data: tour } = await supabase
        .from('tours')
        .select('*')
        .eq('id', tourId)
        .single();
        
    const tripData = tour.planner_data;
    
    // 2. Add custom PO block
    const newBlock = {
        id: 'c2fb7a9c-ea9b-4b74-ab92-052cf84a9669', // Generate new UUID
        dayNumber: 2,
        type: 'activity',
        name: 'Test Custom Spa Hotel Item',
        hotelId: '826eff6d-2e0e-40e2-ad4d-29c0b5246ba3', // Sigiriya Hotel
        startTime: '10:00',
        endTime: '12:00',
        bufferMins: 0,
        durationHours: 2,
        internalNotes: 'Spa treatment',
        confirmationStatus: 'Pending',
        paymentStatus: 'Pending',
        contractedPrice: 150.00,
        agreedPrice: 200.00,
        quantity: 2,
        contractedTotalPrice: 300.00,
        locationName: 'Hotel Spa',
        distance: '',
        isCustomPO: true
    };
    
    tripData.itinerary.push(newBlock);
    
    console.log("Simulating saveTour with new custom block...");
    try {
        const { TourService } = require('./src/services/tour.service');
        // Let's run it!
        await TourService.saveTour(tourId, tripData);
        console.log("Save tour succeeded!");
    } catch (err) {
        console.error("Save tour failed:", err);
    }
}

run();
