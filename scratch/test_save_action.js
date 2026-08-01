import { saveTourDailyTransportsAction } from '../src/actions/admin.actions';

async function run() {
    console.log('Running test_save_action...');
    const tourId = '34cfc060-fd58-4c20-8b57-158feeb689d6';
    const payloads = [
        {
            tour_id: tourId,
            day_number: 1,
            transport_provider_id: 'a8f7ef93-94f4-4c77-93c6-ef9783154ae9',
            vehicle_id: '54511e1e-1848-42a4-9a73-2638bc3994f9'
        },
        {
            tour_id: tourId,
            day_number: 2,
            transport_provider_id: 'a8f7ef93-94f4-4c77-93c6-ef9783154ae9',
            vehicle_id: '54511e1e-1848-42a4-9a73-2638bc3994f9'
        }
    ];

    const res = await saveTourDailyTransportsAction(tourId, payloads);
    console.log('Result:', JSON.stringify(res, null, 2));
}

run();
