"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function AgentChatPage() {
    const params = useParams();
    const tourId = params.id as string;

    // In a real app, logic to fetch metadata like Tourist Name based on Tour ID
    const tourTitle = "14-Day Complete Sri Lanka Circuit";
    const touristName = "John Doe";

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col p-10 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4 text-sm font-medium text-neutral-500 mb-6 shrink-0">
                <Link href={`/admin`} className="hover:text-brand-green flex items-center gap-1 transition-colors">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
            </div>

            <div className="flex-1 pb-8">
                <ChatInterface
                    topicId={tourId}
                    currentUserId="agent-1"
                    currentUserType="agent"
                    title={`Communication: ${tourTitle}`}
                    subtitle={`Client: ${touristName}`}
                />
            </div>
        </div>
    );
}
