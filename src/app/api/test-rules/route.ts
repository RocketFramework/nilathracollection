import { NextResponse } from 'next/server';
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET() {
    try {
        const supabase = createAdminClient();
        
        let cols = null;
        let colError = null;
        try {
            const res = await supabase.rpc('get_schema_info', { table_name: 'ai_builder_rules' });
            cols = res.data;
            colError = res.error;
        } catch (e: any) {
            colError = e.message;
        }
        
        // Try getting an item
        const { data: items, error: itemError } = await supabase.from('ai_builder_rules').select('*').limit(1);

        // Try upserting a test generic rule
        const { data: upData, error: upError } = await supabase
            .from('ai_builder_rules')
            .upsert({
                tour_id: null,
                rule_type: 'generic',
                content: 'test',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'tour_id,rule_type'
            })
            .select()
            .single();

        return NextResponse.json({
            schema: cols,
            schemaError: colError,
            items,
            itemError,
            upsertData: upData,
            upsertError: upError
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
