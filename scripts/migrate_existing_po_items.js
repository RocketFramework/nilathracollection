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

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Service Role Key missing in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Fetching purchase order items that need migration...");
    
    // We fetch items that have 'BLOCK_REF:' in special_notes and daily_activity_id is null
    const { data: items, error: fetchError } = await supabase
        .from('purchase_order_items')
        .select('id, special_notes, daily_activity_id')
        .like('special_notes', '%BLOCK_REF:%');

    if (fetchError) {
        console.error("Error fetching items:", fetchError);
        return;
    }

    const itemsToMigrate = items.filter(item => !item.daily_activity_id);

    console.log(`Found ${items.length} items with BLOCK_REF in special_notes.`);
    console.log(`Of those, ${itemsToMigrate.length} items have daily_activity_id set to NULL and need migration.`);

    if (itemsToMigrate.length === 0) {
        console.log("No records need migration. Exiting.");
        return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const item of itemsToMigrate) {
        try {
            let extractedActivityId = null;
            let cleanNotes = item.special_notes;

            if (item.special_notes.includes('|| BLOCK_REF:')) {
                const parts = item.special_notes.split('|| BLOCK_REF:');
                cleanNotes = parts[0].trim();
                extractedActivityId = parts[1].trim();
            } else if (item.special_notes.startsWith('BLOCK_REF:')) {
                extractedActivityId = item.special_notes.replace('BLOCK_REF:', '').trim();
                cleanNotes = null;
            }

            if (!extractedActivityId) {
                console.log(`Could not extract daily_activity_id for item ${item.id} from special_notes: "${item.special_notes}"`);
                failCount++;
                continue;
            }

            console.log(`Migrating item ${item.id}: setting daily_activity_id = ${extractedActivityId}`);
            
            const { error: updateError } = await supabase
                .from('purchase_order_items')
                .update({
                    daily_activity_id: extractedActivityId,
                    special_notes: cleanNotes || null
                })
                .eq('id', item.id);

            if (updateError) {
                console.error(`Failed to update item ${item.id}:`, updateError);
                failCount++;
            } else {
                successCount++;
            }
        } catch (err) {
            console.error(`Error processing item ${item.id}:`, err);
            failCount++;
        }
    }

    console.log("\nMigration completed!");
    console.log(`Successfully migrated: ${successCount} records.`);
    console.log(`Failed: ${failCount} records.`);
}

run();
