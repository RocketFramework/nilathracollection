const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function run() {
    console.log("Starting missing mappings restoration...");

    // 1. Fetch all quotation requests
    const { data: quotes, error: qErr } = await supabase
        .from('quotation_request')
        .select('*');
    
    if (qErr) {
        console.error("Error fetching quotes:", qErr);
        return;
    }

    // 2. Fetch all existing mappings
    const { data: mappings, error: mErr } = await supabase
        .from('daily_activity_quotation_request')
        .select('*');
    
    if (mErr) {
        console.error("Error fetching mappings:", mErr);
        return;
    }

    const mappedQuoteIds = new Set(mappings.map(m => m.quotation_request_id));

    console.log(`Found ${quotes.length} total quotation requests.`);
    console.log(`Mapped quote IDs:`, Array.from(mappedQuoteIds));

    // Find quotes that are not mapped
    const unmappedQuotes = quotes.filter(q => !mappedQuoteIds.has(q.id));
    console.log(`Found ${unmappedQuotes.length} unmapped quotation requests.`);

    for (const quote of unmappedQuotes) {
        console.log(`\nProcessing unmapped quote: ID=${quote.id}, Vendor=${quote.vendor_name}, Email=${quote.to_email}, Status=${quote.status}`);

        // Try to find a matching tour_rfq_email
        const { data: rfqEmails, error: rfqErr } = await supabase
            .from('tour_rfq_emails')
            .select('*')
            .eq('quotation_request_id', quote.id);
        
        if (rfqErr) {
            console.error(`Error fetching RFQ email for quote ${quote.id}:`, rfqErr);
            continue;
        }

        if (rfqEmails && rfqEmails.length > 0) {
            const email = rfqEmails[0];
            const tourId = email.tour_id;
            const vendorId = email.vendor_id;
            console.log(`Found matching RFQ email. Tour ID=${tourId}, Vendor ID=${vendorId}`);

            // Find daily activities for this tour and vendor
            // Since it's hotel RFQ, we look for sleep activities with hotel_id matching vendorId
            const { data: activities, error: actErr } = await supabase
                .from('daily_activities')
                .select('id, itinerary_id, title, activity_type')
                .eq('tour_id', tourId)
                .eq('hotel_id', vendorId);
            
            if (actErr) {
                console.error("Error fetching matching activities:", actErr);
                continue;
            }

            console.log(`Found ${activities.length} matching daily activities in DB:`, activities);

            if (activities.length > 0) {
                // Insert mappings for all matching activities
                const newMappings = activities.map(act => ({
                    daily_activity_id: act.id,
                    tour_id: tourId,
                    itinerary_id: act.itinerary_id,
                    activity_type: 'hotel',
                    quotation_request_id: quote.id
                }));

                console.log("Inserting mappings:", newMappings);
                const { data: inserted, error: insErr } = await supabase
                    .from('daily_activity_quotation_request')
                    .insert(newMappings)
                    .select();
                
                if (insErr) {
                    console.error("Failed to insert mapping:", insErr);
                } else {
                    console.log("Successfully inserted mappings:", inserted);
                }
            } else {
                console.log("No matching daily activities found for this tour and vendor in daily_activities table.");
            }
        } else {
            console.log("No matching tour_rfq_emails found for this quotation request.");
        }
    }
}

run();
