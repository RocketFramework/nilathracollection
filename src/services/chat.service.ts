import { createClient } from '@supabase/supabase-js';
import { ChatMessageDTO, CreateTopicDTO } from '../dtos/chat.dto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class ChatService {
    static async createTopic(dto: CreateTopicDTO) {
        const { data, error } = await supabase
            .from('conversation_topics')
            .insert(dto)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    static async sendMessage(dto: ChatMessageDTO, senderId: string) {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                ...dto,
                sender_id: senderId
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    // To support realtime, the UI will subscribe directly to Supabase channels
    // e.g. supabase.channel('messages').on('postgres_changes', ...)
}
