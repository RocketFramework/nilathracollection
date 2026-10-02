import { createAdminClient } from '../src/utils/supabase/admin';

async function main() {
    const tourId = 'c0569dc7-0eb6-4362-a071-668b643f3b54';
    const supabaseAdmin = createAdminClient();

    const [appStateRes, tourConciergesRes, costItemsRes] = await Promise.all([
        supabaseAdmin.from('app_states').select('*').eq('state_key', `nilathra_planner_wizard_state_${tourId}`).maybeSingle(),
        supabaseAdmin.from('tour_itinerary_concierges').select('*, cost_item:concierge_cost_items(*)').eq('tour_id', tourId),
        supabaseAdmin.from('concierge_cost_items').select('*')
    ]);

    console.log("=== APP STATE DATA ===");
    console.log("concierges in app_state:", appStateRes.data?.state_data?.concierges);

    console.log("=== TOUR ITINERARY CONCIERGES TABLE ===");
    console.log("Rows count:", tourConciergesRes.data?.length);
    console.log(JSON.stringify(tourConciergesRes.data, null, 2));

    console.log("=== CONCIERGE COST ITEMS COUNT ===");
    console.log(costItemsRes.data?.length);
}

main().catch(console.error);
