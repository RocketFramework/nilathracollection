const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Parse .env.local manually
try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    envFile.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
            process.env[key] = val;
        }
    });
} catch (e) {
    console.error("Could not read .env.local:", e);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    try {
        console.log(`=== Inspecting ALL PO Blocks ===`);
        const { data: poBlocks, error: err1 } = await supabase
            .from('po_blocks')
            .select('*');
        if (err1) console.error("Error po_blocks:", err1);
        console.log(`\n--- ALL PO Blocks (${poBlocks?.length || 0}) ---`);
        poBlocks?.forEach(b => {
            console.log(`ID: ${b.id} | TourID: ${b.tour_id} | Name: ${b.name} | Type: ${b.block_type} | Finalized: ${b.has_finalized}`);
        });
    } catch (e) {
        console.error(e);
    }
}

inspect();
