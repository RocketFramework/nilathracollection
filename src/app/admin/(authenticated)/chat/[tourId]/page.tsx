"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { createClient } from "@/utils/supabase/client";

export default function AgentChatPage() {
    const params = useParams();
    const router = useRouter();
    const tourId = params.tourId as string;
    const [userId, setUserId] = useState<string | null>(null);

    // In a real app, logic to fetch metadata like Tourist Name based on Tour ID
    const tourTitle = "14-Day Complete Sri Lanka Circuit";
    const touristName = "Assigned Tourist";

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
            } else {
                router.push('/login');
            }
        };
        fetchUser();
    }, [router]);

    if (!userId) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
                <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
            </div>
        );
    }

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
                    currentUserId={userId}
                    currentUserType="agent"
                    title={`Communication: ${tourTitle}`}
                    subtitle={`Client: ${touristName}`}
                />
            </div>
        </div>
    );
}
