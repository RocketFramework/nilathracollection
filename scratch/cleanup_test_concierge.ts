import { createAdminClient } from '../src/utils/supabase/admin';

async function main() {
    const supabase = createAdminClient();
    const testTourId = '091f11d4-56fb-4ee3-8684-3d529fada565';
    
    const { count, error } = await supabase
        .from('tour_itinerary_concierges')
        .delete({ count: 'exact' })
        .eq('tour_id', testTourId);

    if (error) {
        console.error("Error cleaning up test rows:", error);
    } else {
        console.log(`Cleaned up ${count} test rows from tour_itinerary_concierges for tour ${testTourId}`);
    }
}

main().catch(console.error);
