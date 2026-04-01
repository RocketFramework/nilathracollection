import { createClient } from '@/utils/supabase/client';
import { ChatMessageDTO, CreateTopicDTO } from '../dtos/chat.dto';
import { sendChatMessageAction, getChatMessagesAction } from '@/actions/chat.actions';

export class ChatService {
    static async sendMessage(dto: ChatMessageDTO, senderId: string) {
        return await sendChatMessageAction(dto.topic_id, dto.content, senderId);
    }

    static async getMessages(topicId: string) {
        return await getChatMessagesAction(topicId);
    }

    // To support realtime, the UI will subscribe directly to Supabase channels
    // e.g. supabase.channel('messages').on('postgres_changes', ...)
}
