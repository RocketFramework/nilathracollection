import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // Check if ai_builder_rules exists
    const { data: cols, error: colError } = await supabase.rpc('get_schema_info', { table_name: 'ai_builder_rules' }).catch(() => ({data: null, error: 'no rpc'}));
    console.log("Cols or error:", cols, colError);

    // Try to select
    const { data: selData, error: selError } = await supabase.from('ai_builder_rules').select('*').limit(1);
    console.log("Select Error:", selError);
    console.log("Select Data:", selData);

    // Try upsert
    const rule = { itinerary_id: null, rule_type: 'generic', content: 'test' };
    const { data: upData, error: upError } = await supabase
        .from('ai_builder_rules')
        .upsert({
            itinerary_id: rule.itinerary_id,
            rule_type: rule.rule_type,
            content: rule.content,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'itinerary_id,rule_type'
        })
        .select()
        .single();
    console.log("Upsert Error:", upError);
}

run();
