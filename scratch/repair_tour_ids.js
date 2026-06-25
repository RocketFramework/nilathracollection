const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
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
    console.log("Running refined backfill repair query via RPC run_sql...");
    const sql = `
        -- 1. Backfill links.tour_id from tour_itineraries using itinerary_id
        UPDATE public.daily_activity_vendor_links link
        SET tour_id = COALESCE(link.tour_id, (
            SELECT DISTINCT itin.tour_id 
            FROM public.tour_itineraries itin 
            WHERE itin.id = link.itinerary_id
        ))
        WHERE link.tour_id IS NULL AND link.itinerary_id IS NOT NULL;

        -- 2. Backfill links.tour_id from daily_activities using daily_activity_id
        UPDATE public.daily_activity_vendor_links link
        SET tour_id = COALESCE(link.tour_id, (
            SELECT DISTINCT da.tour_id 
            FROM public.daily_activities da 
            WHERE da.id = link.daily_activity_id
        ))
        WHERE link.tour_id IS NULL AND link.daily_activity_id IS NOT NULL;

        -- 3. Propagate resolved tour_id from links to vendors
        UPDATE public.daily_activity_vendors dav
        SET tour_id = COALESCE(dav.tour_id, (
            SELECT DISTINCT link.tour_id
            FROM public.daily_activity_vendor_links link
            WHERE link.daily_activity_vendor_id = dav.id AND link.tour_id IS NOT NULL
            LIMIT 1
        ))
        WHERE dav.tour_id IS NULL;

        -- 4. Backfill tour_id from tour_rfq_emails
        UPDATE public.daily_activity_vendors dav
        SET tour_id = COALESCE(dav.tour_id, (
            SELECT DISTINCT tre.tour_id
            FROM public.tour_rfq_emails tre
            WHERE tre.daily_activity_vendor_id = dav.id
            LIMIT 1
        ))
        WHERE dav.tour_id IS NULL;

        -- 5. Backfill vendor_type from links
        UPDATE public.daily_activity_vendors dav
        SET vendor_type = COALESCE(dav.vendor_type, (
            SELECT DISTINCT link.activity_type
            FROM public.daily_activity_vendor_links link
            WHERE link.daily_activity_vendor_id = dav.id
            LIMIT 1
        ))
        WHERE dav.vendor_type IS NULL;

        -- 6. Infer vendor_type from vendor_id by probing master tables
        UPDATE public.daily_activity_vendors dav
        SET vendor_type = CASE
            WHEN EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = dav.vendor_id) THEN 'hotel'
            WHEN EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = dav.vendor_id) THEN 'vendor'
            WHEN EXISTS (SELECT 1 FROM public.transport_providers tp WHERE tp.id = dav.vendor_id) THEN 'transport_provider'
            WHEN EXISTS (SELECT 1 FROM public.tour_guides tg WHERE tg.id = dav.vendor_id) THEN 'tour_guide'
            WHEN EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = dav.vendor_id) THEN 'driver'
            WHEN EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = dav.vendor_id) THEN 'restaurant'
            ELSE dav.vendor_type
        END
        WHERE dav.vendor_type IS NULL AND dav.vendor_id IS NOT NULL;
    `;

    // Wait! Since RPC run_sql is not found in public cache, let's try running individual queries or let's run it
    // Wait, the client doesn't support run_sql RPC, so we can't run DDL or update queries via rpc.
    // Wait! Can we use the supabase client to query, update each record programmatically using JS code?
    // YES! Programmatic updates via the Supabase Client API do not require the run_sql RPC!
    // We can do it completely in Node.js using simple JS queries! This is 100% reliable and doesn't depend on any RPC!
    
    console.log("Beginning programmatic repair of daily_activity_vendor_links...");
    const { data: links, error: lErr } = await supabase.from('daily_activity_vendor_links').select('*');
    if (lErr) {
        console.error("Failed to select links:", lErr);
        return;
    }

    for (const link of links) {
        let tourId = link.tour_id;
        if (!tourId && link.itinerary_id) {
            const { data: itin } = await supabase.from('tour_itineraries').select('tour_id').eq('id', link.itinerary_id).maybeSingle();
            if (itin && itin.tour_id) {
                tourId = itin.tour_id;
            }
        }
        if (!tourId && link.daily_activity_id) {
            const { data: da } = await supabase.from('daily_activities').select('tour_id').eq('id', link.daily_activity_id).maybeSingle();
            if (da && da.tour_id) {
                tourId = da.tour_id;
            }
        }

        if (tourId !== link.tour_id) {
            const { error: updErr } = await supabase
                .from('daily_activity_vendor_links')
                .update({ tour_id: tourId })
                .eq('id', link.id);
            if (updErr) console.error(`Failed to update link ${link.id}:`, updErr);
            else console.log(`Link ${link.id} tour_id updated to: ${tourId}`);
            link.tour_id = tourId; // Update local reference
        }
    }

    console.log("Beginning programmatic repair of daily_activity_vendors...");
    const { data: vendors, error: vErr } = await supabase.from('daily_activity_vendors').select('*');
    if (vErr) {
        console.error("Failed to select vendors:", vErr);
        return;
    }

    for (const vendor of vendors) {
        let tourId = vendor.tour_id;
        let vendorType = vendor.vendor_type;
        let vendorId = vendor.vendor_id;

        // 1. Trace tourId
        if (!tourId) {
            // Check link
            const matchLink = links.find(l => l.daily_activity_vendor_id === vendor.id && l.tour_id);
            if (matchLink) {
                tourId = matchLink.tour_id;
            }
        }
        if (!tourId) {
            // Check emails
            const { data: emails } = await supabase.from('tour_rfq_emails').select('tour_id, vendor_id').eq('daily_activity_vendor_id', vendor.id).limit(1);
            if (emails && emails.length > 0) {
                tourId = emails[0].tour_id;
                if (!vendorId && emails[0].vendor_id) {
                    vendorId = emails[0].vendor_id;
                }
            }
        }

        // 2. Resolve vendorType
        if (!vendorType) {
            const matchLink = links.find(l => l.daily_activity_vendor_id === vendor.id && l.activity_type);
            if (matchLink) {
                vendorType = matchLink.activity_type;
            }
        }
        if (!vendorType && vendorId) {
            // Probe tables
            const h = await supabase.from('hotels').select('id').eq('id', vendorId).maybeSingle();
            if (h.data) vendorType = 'hotel';
            else {
                const v = await supabase.from('vendors').select('id').eq('id', vendorId).maybeSingle();
                if (v.data) vendorType = 'vendor';
                else {
                    const tp = await supabase.from('transport_providers').select('id').eq('id', vendorId).maybeSingle();
                    if (tp.data) vendorType = 'transport_provider';
                    else {
                        const tg = await supabase.from('tour_guides').select('id').eq('id', vendorId).maybeSingle();
                        if (tg.data) vendorType = 'tour_guide';
                        else {
                            const d = await supabase.from('drivers').select('id').eq('id', vendorId).maybeSingle();
                            if (d.data) vendorType = 'driver';
                            else {
                                const r = await supabase.from('restaurants').select('id').eq('id', vendorId).maybeSingle();
                                if (r.data) vendorType = 'restaurant';
                            }
                        }
                    }
                }
            }
        }

        if (tourId !== vendor.tour_id || vendorType !== vendor.vendor_type || vendorId !== vendor.vendor_id) {
            const { error: updErr } = await supabase
                .from('daily_activity_vendors')
                .update({ 
                    tour_id: tourId, 
                    vendor_type: vendorType,
                    vendor_id: vendorId
                })
                .eq('id', vendor.id);
            if (updErr) {
                console.error(`Failed to update vendor ${vendor.vendor_name}:`, updErr);
            } else {
                console.log(`Vendor ${vendor.vendor_name} updated: tour_id=${tourId}, vendor_type=${vendorType}, vendor_id=${vendorId}`);
            }
        }
    }

    console.log("Repair run completed!");
}

run();
