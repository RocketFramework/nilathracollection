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
        console.error('Error reading .env.local', e);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // 1. Fetch a valid tour, itinerary, activity, and hotel
    console.log("Fetching valid IDs...");
    const { data: act } = await supabase.from('daily_activities').select('id, tour_id, itinerary_id').limit(1).single();
    const { data: hotel } = await supabase.from('hotels').select('id, name, reservation_email').limit(1).single();

    if (!act || !hotel) {
        console.error("No valid activity or hotel found.");
        return;
    }

    console.log(`Activity ID: ${act.id}, Tour ID: ${act.tour_id}, Itinerary ID: ${act.itinerary_id}`);
    console.log(`Hotel: ${hotel.name} (${hotel.id})`);

    // 2. Build the exact payload that createQuotationRequestAction receives
    const dto = {
        tour_id: act.tour_id,
        itinerary_id: act.itinerary_id,
        daily_activity_id: act.id,
        vendor_id: hotel.id,
        vendor_name: hotel.name,
        to_email: hotel.reservation_email || 'test@nilathra.com',
        from_email: 'concierge@nilathra.com',
        subject: `Test RFQ for ${hotel.name}`,
        email_content: `Test content for ${hotel.name}`,
        activity_type: 'hotel',
        daily_activity_ids: [act.id]
    };

    // 3. Call QuotationService.createQuotationRequest logic
    console.log("Creating quotation request via logic...");
    const { data: quote, error: qError } = await supabase
        .from('quotation_request')
        .insert([{
            vendor_id: dto.vendor_id || null,
            vendor_name: dto.vendor_name,
            to_email: dto.to_email,
            from_email: dto.from_email,
            subject: dto.subject,
            email_content: dto.email_content,
            status: 'Sent',
            created_by: '82ffd98b-3b66-4fb8-b584-f7b75cf63cfc' // hardcoded active planner UUID
        }])
        .select()
        .single();

    if (qError) {
        console.error("Quote Insert Error:", qError);
        return;
    }

    console.log("Created Quote ID:", quote.id);

    const activityIds = dto.daily_activity_ids && dto.daily_activity_ids.length > 0
        ? dto.daily_activity_ids
        : [dto.daily_activity_id].filter(Boolean);

    const mappings = activityIds.map(actId => ({
        daily_activity_id: actId,
        tour_id: dto.tour_id,
        itinerary_id: dto.itinerary_id,
        activity_type: dto.activity_type,
        quotation_request_id: quote.id
    }));

    console.log("Generated mappings payload:", JSON.stringify(mappings, null, 2));

    if (mappings.length > 0) {
        const { data: mappingResult, error: mError } = await supabase
            .from('daily_activity_quotation_request')
            .insert(mappings)
            .select();

        if (mError) {
            console.error("Mapping Insert Error (will delete quote):", mError);
            await supabase.from('quotation_request').delete().eq('id', quote.id);
            console.log("Quote deleted (rolled back).");
        } else {
            console.log("Mapping Insert Success:", JSON.stringify(mappingResult, null, 2));
        }
    }
}

run();
