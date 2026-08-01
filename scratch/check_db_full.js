const { createClient } = require('@supabase/supabase-js');

const url = 'https://vknibpdhovgcbenkcnaz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbmlicGRob3ZnY2JlbmtjbmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk5OTcwNSwiZXhwIjoyMDg3NTc1NzA1fQ.nUr9s0h8noHP6MxZujQS6MG2lcGfK5GyNe1iL5vuCB8';
const supabase = createClient(url, key);

async function check() {
    const tables = ['tours', 'tour_itineraries', 'drivers', 'transport_providers', 'transport_vehicles', 'tour_itinerary_drivers', 'tour_itinerary_transports', 'tour_itinerary_vehicles'];
    for (const t of tables) {
        const { data, count, error } = await supabase.from(t).select('*', { count: 'exact' }).limit(5);
        if (error) {
            console.error(`Table ${t} error:`, error.message);
        } else {
            console.log(`Table ${t}: count = ${count}`, data);
        }
    }
}

check();
