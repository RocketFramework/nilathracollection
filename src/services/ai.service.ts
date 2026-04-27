import { createAdminClient } from "@/utils/supabase/admin";
import { AIRule } from "@/types/ai";

export class AIService {
    private static TABLE = 'ai_builder_rules';

    static async getRules(itineraryId?: string): Promise<AIRule[]> {
        const supabase = createAdminClient();
        
        let query = supabase.from(this.TABLE).select('*');
        
        if (itineraryId) {
            query = query.or(`itinerary_id.eq.${itineraryId},rule_type.eq.generic`);
        } else {
            query = query.eq('rule_type', 'generic');
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    static async saveRule(rule: AIRule): Promise<AIRule> {
        const supabase = createAdminClient();
        
        const { data, error } = await supabase
            .from(this.TABLE)
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

        if (error) throw error;
        return data;
    }
}
