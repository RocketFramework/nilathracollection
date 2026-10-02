import { createAdminClient } from '../src/utils/supabase/admin';

async function main() {
    const tourId = 'c0569dc7-0eb6-4362-a071-668b643f3b54';
    const supabaseAdmin = createAdminClient();

    const { data: tour } = await supabaseAdmin.from('tours').select('*').eq('id', tourId).single();
    const accs = tour?.planner_data?.accommodations || [];

    console.log("=== ACCOMMODATIONS IN PLANNER_DATA ===");
    accs.forEach((a: any) => {
        console.log(`Night ${a.nightIndex}: hotelName="${a.hotelName}", roomName="${a.roomName}", pricePerNight=${a.pricePerNight}, customContractedTotalPrice=${a.customContractedTotalPrice}`);
        if (a.selectedRooms) {
            a.selectedRooms.forEach((r: any) => console.log(`  Room selected: name="${r.name}", pricePerNight=${r.pricePerNight}, contractedPrice=${r.contractedPrice}, quantity=${r.quantity}`));
        }
    });

    console.log("\n1666 * 3 + 150 =", 1666 * 3 + 150);
}

main().catch(console.error);
