"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getTourDataAction, saveTourAction } from "@/actions/admin.actions";
import { TripData, Financials } from "./types";
import { ScopeAndProfileStep } from "./steps/ScopeAndProfileStep";
import { FlightsStep } from "./steps/FlightsStep";
import { ActivitiesStep } from "./steps/ActivitiesStep";
import { ItineraryBuilder } from "./steps/ItineraryBuilder";
import { FinanceAndBookingStep } from "./steps/FinanceAndBookingStep";
import { OperationalReadiness } from "./components/OperationalReadiness";
import { Save, FileCheck, CheckSquare, Users, Plane, Compass, BedDouble, CarFront, CalendarDays, Calculator, Activity, Loader2, MessageSquare, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { initOrCreateChatTopicAction } from "@/actions/chat.actions";
const initialData: TripData = {
    clientName: 'New Client Inquiry',
    clientEmail: '',
    status: 'Draft',
    serviceScopes: [],
    profile: {
        adults: 2,
        children: 0,
        infants: 0,
        arrivalDate: '',
        departureDate: '',
        durationDays: 0,
        budgetTotal: 0,
        budgetPerPerson: 0,
        travelStyle: 'Luxury',
        specialConditions: {
            dietary: '',
            medical: '',
            accessibility: '',
            language: 'English',
            occasion: ''
        }
    },
    flights: [],
    accommodations: [],
    transports: [],
    activities: [],
    itinerary: [],
    financials: {
        costs: { flights: 0, hotels: 0, transport: 0, activities: 0, guide: 0, misc: 0, commission: 0, tax: 0 },
        purchaseOrders: [],
        supplierInvoices: [],
        sellingPrice: 0
    }
};

const STEPS = [
    { id: 'summary', label: 'Summary', icon: Activity },
    { id: 'profile', label: 'Client Profile', icon: Users },
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'activities', label: 'Activities', icon: Compass },
    { id: 'itinerary', label: 'Builder Engine', icon: CalendarDays },
    { id: 'finance', label: 'Bookings & Finance', icon: Calculator }
];

function PlannerWorkspace() {
    const searchParams = useSearchParams();
    const tourId = searchParams.get('tourId');

    const [activeTab, setActiveTab] = useState('summary');
    const [tripData, setTripData] = useState<TripData>(initialData);
    const [isLoading, setIsLoading] = useState(!!tourId);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Live Chat State
    const [showChat, setShowChat] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [unreadChat, setUnreadChat] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);
        };
        fetchUser();
    }, []);

    // Unread Message Listener
    useEffect(() => {
        let isMounted = true;
        let channel: any = null;

        const initChatNotification = async () => {
            if (!tourId || !currentUserId) return;
            try {
                const topic = await initOrCreateChatTopicAction(tourId);
                if (!isMounted) return;

                const supabase = createClient();

                // Active check for recent messages from others
                const { data } = await supabase
                    .from('messages')
                    .select('id')
                    .eq('topic_id', topic.id)
                    .neq('sender_id', currentUserId)
                    .limit(1);

                if (isMounted && data && data.length > 0) {
                    setUnreadChat(true);
                }

                // Fallback polling for notifications every 10 seconds
                // Uses the same `channel` variable slot to attach the interval for cleanup
                const pollInterval = window.setInterval(async () => {
                    if (!isMounted) return;
                    try {
                        const { data: latestUnread } = await supabase
                            .from('messages')
                            .select('id')
                            .eq('topic_id', topic.id)
                            .neq('sender_id', currentUserId)
                            .limit(1);
                        if (latestUnread && latestUnread.length > 0) setUnreadChat(true);
                    } catch (e) { }
                }, 10000);

                channel = supabase.channel(`notification:${topic.id}`)
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `topic_id=eq.${topic.id}` }, (payload) => {
                        const m = payload.new;
                        if (isMounted && m.sender_id !== currentUserId) {
                            setUnreadChat(true);
                        }
                    })
                    .subscribe();

                (channel as any)._pollInterval = pollInterval;

            } catch (e) {
                console.error("Notification listener error", e);
            }
        };

        if (!showChat) {
            initChatNotification();
        } else {
            setUnreadChat(false);
        }

        return () => {
            isMounted = false;
            if (channel) {
                if ((channel as any)._pollInterval) clearInterval((channel as any)._pollInterval);
                createClient().removeChannel(channel);
            }
        };
    }, [tourId, currentUserId, showChat]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const updateData = (d: Partial<TripData>) => {
        setTripData(prev => {
            setIsDirty(true);
            return { ...prev, ...d };
        });
    };

    useEffect(() => {
        const loadTour = async () => {
            if (!tourId) return;
            setIsLoading(true);
            try {
                const res = await getTourDataAction(tourId);
                if (res.success && res.data) {
                    setTripData(res.data.tripData as TripData);
                } else {
                    throw new Error(res.error || "Failed to load");
                }
            } catch (error) {
                console.error("Failed to load tour data:", error);
                alert("Could not load tour data. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        loadTour();
    }, [tourId]);

    const handleSave = async () => {
        if (!tourId) {
            alert("This planner is not attached to a definitive Tour yet.");
            return;
        }
        setIsSaving(true);
        try {
            const res = await saveTourAction(tourId, tripData);
            if (res.success) {
                setIsDirty(false);
                alert("Workflow state saved to database successfully.");
            } else {
                throw new Error(res.error || "Failed to save");
            }
        } catch (error) {
            console.error("Failed to save tour", error);
            alert("Error saving tour. Check console for details.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col h-[calc(100vh-64px)] bg-[#F5F3EF] items-center justify-center">
                <Loader2 className="animate-spin text-brand-gold w-10 h-10 mb-4" />
                <p className="text-neutral-500 font-medium">Loading Planner Workspace...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-[#F5F3EF]">
            {/* Top Compact Toolbar */}
            <div className="bg-white border-b border-neutral-200 shadow-sm z-10 flex flex-col shrink-0">
                <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            value={tripData.clientName}
                            onChange={e => updateData({ clientName: e.target.value })}
                            className="text-lg font-serif text-brand-green bg-transparent font-bold focus:outline-none focus:border-b border-brand-gold w-64 placeholder-neutral-300"
                            placeholder="Enter Trip Name/Client..."
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded uppercase tracking-widest border border-brand-gold/20">
                                {tripData.status}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                                ID: {tripData.id || 'Draft'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-semibold shadow-sm text-xs relative ${showChat ? 'bg-brand-gold text-white border border-brand-gold' : 'bg-white text-neutral-600 border border-neutral-300 hover:bg-neutral-50'}`}
                        >
                            <MessageSquare size={14} /> Messages
                            {unreadChat && !showChat && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                                </span>
                            )}
                        </button>
                        <button className="flex items-center gap-1.5 bg-white text-neutral-600 border border-neutral-300 px-3 py-1.5 rounded-lg hover:bg-neutral-50 transition-all font-semibold shadow-sm text-xs">
                            <FileCheck size={14} /> Confirmed
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !isDirty}
                            className={`flex items-center gap-1.5 text-white px-3 py-1.5 rounded-lg transition-all shadow-md font-semibold text-xs disabled:opacity-50 ${isDirty ? 'bg-orange-500 hover:bg-orange-600 animate-pulse' : 'bg-brand-green hover:bg-green-900'}`}
                        >
                            <Save size={14} /> {isSaving ? 'Synching...' : isDirty ? 'Save Needed' : 'Saved Workflow'}
                        </button>
                    </div>
                </div>

                {/* Horizontal Nav Bar containing the Workflow Stages */}
                <div className="px-4 border-t border-neutral-100 flex items-center overflow-x-auto no-scrollbar">
                    {STEPS.map(step => {
                        const Icon = step.icon;
                        const isActive = activeTab === step.id;

                        let disabled = false;
                        if (step.id === 'flights' && !tripData.serviceScopes.includes('Book International Flights')) disabled = true;
                        if (step.id === 'activities' && !tripData.serviceScopes.includes('Plan Activities & Experiences')) disabled = true;

                        return (
                            <button
                                key={step.id}
                                onClick={() => !disabled && setActiveTab(step.id)}
                                disabled={disabled}
                                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-all border-b-2 whitespace-nowrap
                                    ${isActive ? 'border-brand-green text-brand-green bg-brand-green/5' : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'}
                                    ${disabled ? 'opacity-30 grayscale cursor-not-allowed hidden md:flex' : ''}
                                `}
                            >
                                <Icon size={14} className={isActive ? 'text-brand-gold' : 'text-neutral-400'} />
                                {step.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative">
                <div className="max-w-6xl mx-auto pb-32">
                    {activeTab === 'summary' && (
                        <div className="space-y-8">
                            <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm relative overflow-hidden">
                                <h3 className="text-xl font-serif text-brand-green mb-2 flex items-center gap-2">
                                    <Activity size={20} className="text-brand-gold" /> Inquiry & Operational Summary
                                </h3>
                                <p className="text-neutral-500 text-sm mb-6 pb-4 border-b">A high-level overview of operational readiness before confirming client proposals.</p>
                                <OperationalReadiness tripData={tripData} />
                            </div>
                        </div>
                    )}
                    {activeTab === 'profile' && (
                        <ScopeAndProfileStep tripData={tripData} updateData={updateData} />
                    )}
                    {activeTab === 'flights' && (
                        <FlightsStep tripData={tripData} updateFlights={(f) => setTripData(prev => { setIsDirty(true); return { ...prev, flights: f }; })} />
                    )}
                    {activeTab === 'activities' && (
                        <ActivitiesStep tripData={tripData} updateActivities={(a) => setTripData(prev => { setIsDirty(true); return { ...prev, activities: a }; })} />
                    )}
                    {activeTab === 'itinerary' && (
                        <div className="space-y-8">
                            <ItineraryBuilder tripData={tripData} updateData={updateData} />
                        </div>
                    )}
                    {activeTab === 'finance' && (
                        <FinanceAndBookingStep tripData={tripData} updateFinancials={(f: Financials) => setTripData(prev => { setIsDirty(true); return { ...prev, financials: f }; })} />
                    )}
                </div>
            </main>

            {/* Slide-out Chat Drawer */}
            {showChat && (
                <div className="fixed top-[64px] right-0 bottom-0 w-[400px] bg-white shadow-2xl border-l border-neutral-200 z-50 flex flex-col animate-in slide-in-from-right">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-neutral-50">
                        <h3 className="font-serif font-bold text-brand-green flex items-center gap-2">
                            <MessageSquare size={18} className="text-brand-gold" /> Live Chat
                        </h3>
                        <button onClick={() => setShowChat(false)} className="text-neutral-400 hover:text-neutral-600 p-1 rounded hover:bg-neutral-200 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                        {tourId && currentUserId ? (
                            <ChatInterface topicId={tourId} title={tripData?.clientName || "Trip Discussion"} currentUserId={currentUserId} currentUserType="agent" />
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                                <p className="text-sm text-neutral-500 mb-2">Initialize Workspace to Chat</p>
                                <p className="text-xs text-neutral-400">The chat room will be available once the user session and tour context loads.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PlannerWizard() {
    return (
        <Suspense fallback={
            <div className="flex flex-col h-[calc(100vh-64px)] bg-[#F5F3EF] items-center justify-center">
                <Loader2 className="animate-spin text-brand-gold w-10 h-10 mb-4" />
                <p className="text-neutral-500 font-medium">Initializing Planner Workspace...</p>
            </div>
        }>
            <PlannerWorkspace />
        </Suspense>
    );
}
