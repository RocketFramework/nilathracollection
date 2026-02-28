export interface CreateTopicDTO {
    conversation_id: string; // UUID
    title: string;
}

export interface ChatMessageDTO {
    topic_id: string; // UUID
    content: string;
    is_attachment?: boolean;
    attachment_url?: string;
}
