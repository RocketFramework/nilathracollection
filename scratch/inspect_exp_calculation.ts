import { createAdminClient } from '../src/utils/supabase/admin.ts';
import { InvoiceCalculationService } from '../src/services/invoice-calculation.service.ts';

async function main() {
    const tourId = 'c0569dc7-0eb6-4362-a071-668b643f3b54';
    const supabaseAdmin = createAdminClient();

    const [tourRes, itinRes, actRes] = await Promise.all([
        supabaseAdmin.from('tours').select('*').eq('id', tourId).single(),
        supabaseAdmin.from('tour_itineraries').select('id, day_number, date').eq('tour_id', tourId),
        supabaseAdmin.from('daily_activities').select('*').eq('tour_id', tourId)
    ]);

    const tour = tourRes.data;
    const itineraries = itinRes.data || [];
    const activities = actRes.data || [];

    console.log("=== TOUR PROFILE & PAX ===");
    console.log("Planner Profile:", tour?.planner_data?.profile);

    console.log("\n=== DAILY ACTIVITIES (type != meal/sleep/travel) ===");
    const experienceActs = activities.filter(da => {
        const actType = da.activity_type || da.type || '';
        return actType !== 'meal' && actType !== 'sleep' && actType !== 'travel';
    });

    experienceActs.forEach(a => {
        console.log(`Title: "${a.title}" | Qty: ${a.quantity} | charged_unit_price: ${a.charged_unit_price} | charged_total_price: ${a.charged_total_price} | contracted_price: ${a.contracted_price} | contracted_total_price: ${a.contracted_total_price}`);
    });

    console.log("\n=== ITINERARY BLOCKS FROM PLANNER_DATA ===");
    const plannerItinerary = tour?.planner_data?.itinerary || [];
    console.log("Planner itinerary blocks count:", plannerItinerary.length);
    const expPlannerBlocks = plannerItinerary.filter((b: any) => b.type === 'activity' || b.type === 'custom');
    expPlannerBlocks.forEach((b: any) => {
        console.log(`Title: "${b.title}" | Type: ${b.type} | agreedPrice: ${b.agreedPrice} | quantity: ${b.quantity} | headCount: ${b.headCount}`);
    });

}

main().catch(console.error);
