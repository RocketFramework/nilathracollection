import * as fs from 'fs';
import * as path from 'path';

try {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const idx = trimmed.indexOf('=');
            if (idx !== -1) {
                const key = trimmed.substring(0, idx).trim();
                let value = trimmed.substring(idx + 1).trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length - 1);
                }
                process.env[key] = value;
            }
        });
    }
} catch (err) {}

import { TourService } from '../src/services/tour.service';
import { createAdminClient } from '../src/utils/supabase/admin';

async function run() {
    const tourId = '60dec7e8-cbd9-4801-9f97-b41e5062fcc2';
    console.log(`Restoring tour activities for tour: ${tourId}`);

    // 1. Get current tripData from DB
    const { tripData } = await TourService.getTourData(tourId);
    if (!tripData) {
        console.error("Failed to load tripData");
        return;
    }

    // 2. Run real saveTour to restore all daily activities
    console.log("Saving tour to recreate daily_activities with correct fields...");
    await TourService.saveTour(tourId, tripData as any);
    console.log("Tour saved successfully.");

    // 3. Now let's find unmapped quotation requests and insert mapping records
    const supabase = createAdminClient();
    const { data: quotes } = await supabase.from('quotation_request').select('*');
    const { data: currentMappings } = await supabase.from('daily_activity_quotation_request').select('*');
    const mappedQuoteIds = new Set(currentMappings?.map(m => m.quotation_request_id) || []);

    const unmappedQuotes = (quotes || []).filter(q => !mappedQuoteIds.has(q.id));
    console.log(`Found ${unmappedQuotes.length} unmapped quotes.`);

    for (const quote of unmappedQuotes) {
        console.log(`Processing unmapped quote: ID=${quote.id}, Vendor=${quote.vendor_name}`);

        // Try to find matching RFQ email
        const { data: rfqEmails } = await supabase
            .from('tour_rfq_emails')
            .select('*')
            .eq('quotation_request_id', quote.id);

        if (rfqEmails && rfqEmails.length > 0) {
            const email = rfqEmails[0];
            const emailTourId = email.tour_id;
            const vendorId = email.vendor_id;
            console.log(`Found matching email. Tour ID=${emailTourId}, Vendor ID=${vendorId}`);

            // Find daily activities for this tour and vendor
            const { data: activities } = await supabase
                .from('daily_activities')
                .select('id, itinerary_id, title, activity_type')
                .eq('tour_id', emailTourId)
                .eq('hotel_id', vendorId);

            console.log(`Found ${activities?.length || 0} matching daily activities in DB.`);

            if (activities && activities.length > 0) {
                const newMappings = activities.map(act => ({
                    daily_activity_id: act.id,
                    tour_id: emailTourId,
                    itinerary_id: act.itinerary_id,
                    activity_type: 'hotel',
                    quotation_request_id: quote.id
                }));

                const { data: inserted, error: insErr } = await supabase
                    .from('daily_activity_quotation_request')
                    .insert(newMappings)
                    .select();

                if (insErr) {
                    console.error("Mapping insert error:", insErr);
                } else {
                    console.log("Successfully restored mappings:", inserted);
                }
            }
        } else {
            // For quotation requests without emails (e.g. manual entries), let's see if we can find by name
            // Let's search for hotels matching vendor_name
            const { data: hotels } = await supabase
                .from('hotels')
                .select('id')
                .ilike('name', quote.vendor_name)
                .limit(1);

            if (hotels && hotels.length > 0) {
                const vendorId = hotels[0].id;
                // Find matching activities for this hotel and tourId
                const { data: activities } = await supabase
                    .from('daily_activities')
                    .select('id, itinerary_id')
                    .eq('tour_id', tourId)
                    .eq('hotel_id', vendorId);

                if (activities && activities.length > 0) {
                    const newMappings = activities.map(act => ({
                        daily_activity_id: act.id,
                        tour_id: tourId,
                        itinerary_id: act.itinerary_id,
                        activity_type: 'hotel',
                        quotation_request_id: quote.id
                    }));

                    const { data: inserted, error: insErr } = await supabase
                        .from('daily_activity_quotation_request')
                        .insert(newMappings)
                        .select();

                    if (insErr) {
                        console.error("Manual mapping insert error:", insErr);
                    } else {
                        console.log("Successfully restored manual mappings:", inserted);
                    }
                }
            }
        }
    }

    // Verify final mappings
    const { data: finalMappings } = await supabase.from('daily_activity_quotation_request').select('*');
    console.log(`\nFinal total mappings in database: ${finalMappings?.length}`);
}

run();
