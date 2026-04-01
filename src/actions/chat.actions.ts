"use server";

import { createAdminClient } from "@/utils/supabase/admin";

export async function initOrCreateChatTopicAction(tourId: string, title?: string) {
    const supabaseAction = createAdminClient();

    // 1. Attempt to fetch or create the parent conversation for this tour
    let conversationId: string;
    const { data: existingConv } = await supabaseAction
        .from('conversations')
        .select('id')
        .eq('tour_id', tourId)
        .single();

    if (existingConv) {
        conversationId = existingConv.id;
    } else {
        const { data: newConv, error: newConvErr } = await supabaseAction
            .from('conversations')
            .insert({ tour_id: tourId })
            .select('id')
            .single();
        if (newConvErr) throw newConvErr;
        conversationId = newConv.id;
    }

    // 2. Attempt to fetch existing conversation topic
    const { data: existing, error: getErr } = await supabaseAction
        .from('conversation_topics')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();

    if (existing) return existing;

    // 3. Create safely as Admin if it doesn't exist
    const { data: created, error: createErr } = await supabaseAction
        .from('conversation_topics')
        .insert({
            conversation_id: conversationId,
            title: title || 'Tour Communications'
        })
        .select()
        .single();

    if (createErr) throw createErr;
    return created;
}
