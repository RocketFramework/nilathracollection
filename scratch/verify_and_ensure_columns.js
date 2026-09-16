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
} catch (err) {
    console.error('Failed to parse .env.local:', err.message);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function check() {
    console.log("Checking columns in tour_guides, transport_providers, transport_vehicles...");

    const { data: guideData, error: gErr } = await supabase.from('tour_guides').select('id, sltda_id_image_url, approval_status, approved_by, approved_at').limit(1);
    if (gErr) {
        console.log("tour_guides error:", gErr.message);
    } else {
        console.log("tour_guides columns verified OK!");
    }

    const { data: pData, error: pErr } = await supabase.from('transport_providers').select('id, approval_status, approved_by, approved_at').limit(1);
    if (pErr) {
        console.log("transport_providers error:", pErr.message);
    } else {
        console.log("transport_providers columns verified OK!");
    }

    const { data: vData, error: vErr } = await supabase.from('transport_vehicles').select('id, image_url, approval_status, approved_by, approved_at').limit(1);
    if (vErr) {
        console.log("transport_vehicles error:", vErr.message);
    } else {
        console.log("transport_vehicles columns verified OK!");
    }

    // Check storage bucket 'partner-documents'
    const { data: buckets } = await supabase.storage.listBuckets();
    const hasBucket = buckets && buckets.some(b => b.name === 'partner-documents');
    console.log("partner-documents bucket exists:", hasBucket);

    if (!hasBucket) {
        const { data: newBucket, error: bErr } = await supabase.storage.createBucket('partner-documents', { public: true });
        if (bErr) console.error("Error creating storage bucket:", bErr.message);
        else console.log("Created storage bucket partner-documents successfully!");
    }
}

check();
