import { saveTourDailyVehiclesAction } from '../src/actions/admin.actions';

async function run() {
    console.log('Running test_vehicle_save...');
    const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';
    const payloads = [
        {
            tour_id: tourId,
            day_number: 1,
            vehicle_id: '54511e1e-1848-42a4-9a73-2638bc3994f9',
            contracted_per_day_rate: 100,
            charged_per_day_rate: 150
        }
    ];

    const res = await saveTourDailyVehiclesAction(tourId, payloads, true);
    console.log('Result:', JSON.stringify(res, null, 2));
}

run();
