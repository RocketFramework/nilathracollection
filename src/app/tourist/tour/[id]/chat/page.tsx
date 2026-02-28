"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function TouristChatPage() {
    const params = useParams();
    const tourId = params.id as string;

    // In a real app, logic to fetch metadata like Agent Name based on Tour ID
    const tourTitle = "14-Day Complete Sri Lanka Circuit";
    const agentName = "Samadhi Silva";

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4 text-sm font-medium text-neutral-500 mb-6 shrink-0">
                <Link href={`/tourist/tour/${tourId}`} className="hover:text-brand-green flex items-center gap-1 transition-colors">
                    <ArrowLeft size={16} /> Back to Tour Details
                </Link>
            </div>

            <div className="flex-1 pb-8">
                <ChatInterface
                    topicId={tourId}
                    currentUserId="tour-user-1"
                    currentUserType="tourist"
                    title="Tour Communications"
                    subtitle={`Direct line with ${agentName}`}
                />
            </div>
        </div>
    );
}
