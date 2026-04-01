"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Paperclip, Image as ImageIcon, Check, CheckCheck } from "lucide-react";
import { ChatService } from "@/services/chat.service";
import { createClient } from "@/utils/supabase/client";
import { initOrCreateChatTopicAction } from "@/actions/chat.actions";

export interface Message {
    id: string;
    senderId: string;
    senderType: 'tourist' | 'agent' | 'admin';
    senderName: string;
    content: string;
    timestamp: string;
    read: boolean;
}

interface ChatInterfaceProps {
    topicId: string;
    currentUserId: string;
    currentUserType: 'tourist' | 'agent' | 'admin';
    title: string;
    subtitle?: string;
}

// Mock initial messages
const mockMessages: Message[] = [
    {
        id: '1',
        senderId: 'agent-1',
        senderType: 'agent',
        senderName: 'Samadhi Silva',
        content: 'Hello! I am your dedicated travel specialist. How can I assist you with your upcoming Sri Lanka tour?',
        timestamp: '10:00 AM',
        read: true,
    },
    {
        id: '2',
        senderId: 'tour-1',
        senderType: 'tourist',
        senderName: 'John Doe',
        content: 'Hi Samadhi! I was wondering if we could add an extra day in Ella?',
        timestamp: '10:15 AM',
        read: true,
    }
];

export function ChatInterface({ topicId, currentUserId, currentUserType, title, subtitle }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [dbTopicId, setDbTopicId] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        let isMounted = true;
        let channel: any = null;

        const initChat = async () => {
            try {
                // 1. Get or create topic using the securely elevated Server Action
                let topic = await initOrCreateChatTopicAction(topicId, title);
                if (!isMounted) return;

                setDbTopicId(topic.id);

                // 2. Fetch history
                const history = await ChatService.getMessages(topic.id);

                // Map database messages to UI Message interface
                const mappedHistory = history.map((m: any) => ({
                    id: m.id,
                    senderId: m.sender_id,
                    senderType: m.sender_id === currentUserId ? currentUserType : (currentUserType === 'tourist' ? 'agent' : 'tourist'),
                    senderName: m.sender_id === currentUserId ? 'You' : (currentUserType === 'tourist' ? 'Travel Agent' : 'Tourist'),
                    content: m.content,
                    timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    read: true
                }));

                setMessages(mappedHistory);

                // 3. Fallback Polling & Realtime
                const supabase = createClient();

                // Fallback polling every 3 seconds to guarantee sync
                const pollInterval = window.setInterval(async () => {
                    if (!isMounted) return;
                    try {
                        const latest = await ChatService.getMessages(topic.id);
                        setMessages(latest.map((m: any) => ({
                            id: m.id,
                            senderId: m.sender_id,
                            senderType: m.sender_id === currentUserId ? currentUserType : (currentUserType === 'tourist' ? 'agent' : 'tourist'),
                            senderName: m.sender_id === currentUserId ? 'You' : (currentUserType === 'tourist' ? 'Travel Agent' : 'Tourist'),
                            content: m.content,
                            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            read: true
                        })));
                    } catch (e) { }
                }, 3000);

                channel = supabase.channel(`messages:${topic.id}`)
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `topic_id=eq.${topic.id}` }, (payload) => {
                        if (isMounted) {
                            const m = payload.new;
                            setMessages(prev => {
                                if (prev.find(msg => msg.id === m.id)) return prev;
                                return [...prev, {
                                    id: m.id,
                                    senderId: m.sender_id,
                                    senderType: m.sender_id === currentUserId ? currentUserType : (currentUserType === 'tourist' ? 'agent' : 'tourist'),
                                    senderName: m.sender_id === currentUserId ? 'You' : (currentUserType === 'tourist' ? 'Travel Agent' : 'Tourist'),
                                    content: m.content,
                                    timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                    read: true
                                }];
                            });
                        }
                    })
                    .subscribe();

                // Store interval on channel to clean it up
                (channel as any)._pollInterval = pollInterval;
            } catch (error) {
                console.error("Failed to initialize chat", error);
            }
        };

        if (topicId && currentUserId) {
            initChat();
        }

        return () => {
            isMounted = false;
            if (channel) {
                if ((channel as any)._pollInterval) clearInterval((channel as any)._pollInterval);
                const supabase = createClient();
                supabase.removeChannel(channel);
            }
        };
    }, [topicId, currentUserId, currentUserType, title]);

    const handleSend = async () => {
        if (!inputValue.trim() || !dbTopicId || !currentUserId) return;

        const content = inputValue.trim();
        setInputValue(""); // optimistic clear

        try {
            const saved = await ChatService.sendMessage({
                topic_id: dbTopicId,
                content: content
            }, currentUserId);

            // Add optimistically
            setMessages(prev => {
                if (prev.find(msg => msg.id === saved.id)) return prev;
                return [...prev, {
                    id: saved.id,
                    senderId: saved.sender_id,
                    senderType: currentUserType,
                    senderName: 'You',
                    content: saved.content,
                    timestamp: new Date(saved.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    read: true
                }];
            });
        } catch (error) {
            console.error("Failed to send message", error);
            setInputValue(content); // revert
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-sm border border-neutral-200 relative">
            {/* Chat Header */}
            <div className="p-4 md:p-6 bg-brand-green text-white flex justify-between items-center relative z-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="relative z-10">
                    <h2 className="text-xl font-bold font-playfair">{title}</h2>
                    {subtitle && <p className="text-white/80 text-sm mt-1">{subtitle}</p>}
                </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-neutral-50/50 scroll-smooth">
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`text-xs ml-1 mb-1 font-bold tracking-wide uppercase ${isMe ? 'text-brand-green' : 'text-neutral-400'}`}>
                                {isMe ? 'You' : msg.senderName}
                            </div>
                            <div
                                className={`px-5 py-3.5 max-w-[85%] md:max-w-[70%] text-[15px] leading-relaxed relative ${isMe
                                    ? 'bg-brand-green text-white rounded-2xl rounded-tr-sm shadow-md'
                                    : 'bg-white text-brand-charcoal border border-neutral-200 rounded-2xl rounded-tl-sm shadow-sm'
                                    }`}
                            >
                                {msg.content}
                            </div>
                            <div className="flex items-center gap-1 mt-1 mr-1 text-[10px] text-neutral-400 font-medium">
                                {msg.timestamp}
                                {isMe && (
                                    <span className="text-brand-green ml-1">{msg.read ? <CheckCheck size={14} /> : <Check size={14} />}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 bg-white border-t border-neutral-100 relative z-10">
                <div className="flex items-end gap-3 bg-neutral-50 border border-neutral-200 rounded-2xl p-2 focus-within:ring-2 ring-brand-green/20 focus-within:border-brand-green transition-all">
                    <button className="p-3 text-neutral-400 hover:text-brand-green transition-colors rounded-xl hover:bg-white shrink-0">
                        <Paperclip size={20} />
                    </button>
                    <button className="p-3 text-neutral-400 hover:text-brand-green transition-colors rounded-xl hover:bg-white shrink-0 mr-1">
                        <ImageIcon size={20} />
                    </button>
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 max-h-32 min-h-[44px] bg-transparent border-0 focus:ring-0 resize-none py-3 text-sm"
                        rows={1}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className="p-3 bg-brand-green text-white hover:bg-brand-charcoal disabled:opacity-50 disabled:bg-neutral-300 disabled:text-neutral-500 rounded-xl transition-all shadow-md shrink-0 mb-0.5 mr-0.5"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
