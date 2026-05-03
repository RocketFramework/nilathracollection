"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MapPin, Phone, Mail, MessageSquare, Download, CheckCircle2, ChevronRight, BedDouble, Calendar, ArrowLeft, ReceiptText } from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { createClient } from "@/utils/supabase/client";
import { ItineraryPdfTemplate } from "@/app/admin/(authenticated)/planner/components/ItineraryPdfTemplate";

export default function TourDetailsPage() {
    const params = useParams();
    const id = params.id as string;

    const [tour, setTour] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
    const [savingNote, setSavingNote] = useState<string | null>(null);

    const handleAddComment = async (blockId: string) => {
        const text = commentDrafts[blockId];
        if (!text?.trim()) return;

        setSavingNote(blockId);
        try {
            const { TouristService } = await import('@/services/tourist.service');
            await TouristService.addCommentToBlock(id, blockId, 'tourist', text.trim());
            
            // Optimistic update
            setTour((prev: any) => {
                const newTour = { ...prev };
                if (newTour.detailedItinerary) {
                    newTour.detailedItinerary = newTour.detailedItinerary.map((b: any) => {
                        if (b.id === blockId) {
                            const newComment = {
                                id: Math.random().toString(),
                                role: 'tourist',
                                text: text.trim(),
                                timestamp: new Date().toISOString()
                            };
                            return { ...b, comments: b.comments ? [...b.comments, newComment] : [newComment] };
                        }
                        return b;
                    });
                }
                return newTour;
            });
            setCommentDrafts(prev => ({ ...prev, [blockId]: '' }));
        } catch (e) {
            console.error(e);
        } finally {
            setSavingNote(null);
        }
    };

    useEffect(() => {
        const fetchDetails = async () => {
            setIsLoading(true);
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) setUserId(user.id);

                const { TouristService } = await import('@/services/tourist.service');
                const data = await TouristService.getTourDetails(id);
                setTour(data);
            } catch (error) {
                console.error("Failed to load tour details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchDetails();
        }
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold"></div>
            </div>
        );
    }

    if (!tour) {
        return (
            <div className="text-center py-20 text-neutral-500">
                <MapPin size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-brand-charcoal mb-2">Tour Not Found</h3>
                <p>We couldn't find the details for this journey or it hasn't been approved yet.</p>
                <Link href="/tourist" className="mt-4 inline-block px-6 py-2 bg-brand-charcoal text-white rounded-lg px-4 py-2 font-medium hover:bg-neutral-800 transition-colors">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4 text-sm font-medium text-neutral-500">
                <Link href="/tourist" className="hover:text-brand-green flex items-center gap-1 transition-colors">
                    <ArrowLeft size={16} /> Dashboard
                </Link>
                <ChevronRight size={14} />
                <span className="text-brand-charcoal">{tour.title}</span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column: Itinerary & Specifics */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Main Banner */}
                    <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full mb-3 ${tour.status === 'Review Ready' ? 'bg-blue-100 text-blue-700' : 'bg-brand-green/10 text-brand-green'}`}>
                                    {tour.status} Tour
                                </span>
                                <h1 className="text-3xl font-serif text-brand-charcoal font-bold">{tour.title}</h1>
                                {tour.destinations && tour.destinations.length > 0 && (
                                    <p className="text-neutral-500 flex items-center gap-2 mt-2 font-medium">
                                        <MapPin size={16} className="text-brand-gold" /> {tour.destinations.join(' → ')}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-neutral-50 rounded-2xl flex flex-wrap gap-8">
                            <div>
                                <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Start Date</p>
                                <p className="font-bold text-brand-charcoal">{tour.startDate ? new Date(tour.startDate).toLocaleDateString() : 'TBD'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Duration</p>
                                <p className="font-bold text-brand-charcoal">{tour.durationDays ? `${tour.durationDays} Days / ${tour.durationDays - 1} Nights` : 'TBD'}</p>
                            </div>
                            {tour.travelers && (
                                <div>
                                    <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Travelers</p>
                                    <p className="font-bold text-brand-charcoal">{tour.travelers}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Compact Itinerary Summary View */}
                    <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-serif text-brand-charcoal">Itinerary Overview</h2>
                            <button 
                                onClick={() => {
                                    const printContent = document.getElementById('print-container')?.innerHTML;
                                    if (printContent) {
                                        const iframe = document.createElement('iframe');
                                        iframe.style.position = 'fixed';
                                        iframe.style.right = '0';
                                        iframe.style.bottom = '0';
                                        iframe.style.width = '0';
                                        iframe.style.height = '0';
                                        iframe.style.border = '0';
                                        document.body.appendChild(iframe);

                                        const doc = iframe.contentWindow?.document;
                                        if (doc) {
                                            doc.open();
                                            doc.write(`
                                                <html>
                                                    <head>
                                                        <title>Itinerary PDF</title>
                                                        ${Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]')).map(n => n.outerHTML).join('\n')}
                                                        <style>
                                                            body { background: white !important; margin: 0; padding: 0; }
                                                            @page { size: A4; margin: 0; }
                                                            .pdf-container { padding: 0 !important; }
                                                        </style>
                                                    </head>
                                                    <body>${printContent}</body>
                                                </html>
                                            `);
                                            doc.close();
                                            iframe.contentWindow?.focus();
                                            setTimeout(() => {
                                                iframe.contentWindow?.print();
                                                setTimeout(() => document.body.removeChild(iframe), 1000);
                                            }, 500);
                                        }
                                    }
                                }}
                                className="text-brand-green text-sm font-bold flex items-center gap-2 hover:text-brand-gold transition-colors"
                            >
                                <Download size={16} /> Download PDF
                            </button>
                        </div>

                        <div className="space-y-6">
                            {tour.detailedItinerary && tour.detailedItinerary.length > 0 ? (
                                Object.entries(
                                    tour.detailedItinerary.reduce((acc: any, block: any) => {
                                        if (block.dayNumber > 0) {
                                            if (!acc[block.dayNumber]) acc[block.dayNumber] = [];
                                            acc[block.dayNumber].push(block);
                                        }
                                        return acc;
                                    }, {})
                                ).map(([dayStr, blocks]: [string, any]) => (
                                    <div key={dayStr} className="mb-8 last:mb-0">
                                        <h3 className="text-xl font-bold font-serif text-brand-charcoal mb-4 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-sm">
                                                {dayStr}
                                            </div>
                                            Day {dayStr}
                                        </h3>
                                        <div className="space-y-3">
                                            {blocks.map((block: any) => (
                                                <div key={block.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm hover:border-brand-gold/30 transition-colors">
                                                    <div className="text-xs font-bold text-neutral-400 w-16 pt-1 text-right shrink-0">
                                                        {block.startTime}
                                                    </div>
                                                    <div className="w-px bg-neutral-100 shrink-0"></div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-brand-charcoal">{block.name}</p>
                                                        {block.locationName && (
                                                            <p className="text-[11px] font-bold uppercase tracking-wider text-brand-gold mt-1 flex items-center gap-1">
                                                                <MapPin size={12} /> {block.locationName}
                                                            </p>
                                                        )}
                                                        <div className="mt-4 w-full border border-neutral-100 rounded-xl overflow-hidden bg-neutral-50/30">
                                                            <div className="bg-neutral-50 px-3 py-2 border-b border-neutral-100 flex justify-between items-center">
                                                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Line-Item Discussion</span>
                                                            </div>
                                                            {block.comments && block.comments.length > 0 && (
                                                                <div className="p-3 max-h-40 overflow-y-auto space-y-2 flex flex-col">
                                                                    {block.comments.map((c: any) => (
                                                                        <div key={c.id} className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${c.role === 'tourist' ? 'bg-brand-green/10 border-brand-green/20 text-brand-charcoal self-end' : 'bg-neutral-100 border-neutral-200 text-neutral-700 self-start'} border`}>
                                                                            <div className={`text-[9px] font-bold uppercase mb-1 ${c.role === 'tourist' ? 'text-brand-green' : 'text-neutral-500'}`}>{c.role === 'agent' ? tour.agent.name : 'You'}</div>
                                                                            <div>{c.text}</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div className="p-2 bg-white flex gap-2 border-t border-neutral-100">
                                                                <input
                                                                    type="text"
                                                                    value={commentDrafts[block.id] || ''}
                                                                    onChange={e => setCommentDrafts(prev => ({ ...prev, [block.id]: e.target.value }))}
                                                                    onKeyDown={e => e.key === 'Enter' && handleAddComment(block.id)}
                                                                    disabled={savingNote === block.id}
                                                                    placeholder="Add a reply..."
                                                                    className="flex-1 text-xs bg-neutral-50 border border-neutral-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-brand-green/50 disabled:opacity-50"
                                                                />
                                                                <button
                                                                    onClick={() => handleAddComment(block.id)}
                                                                    disabled={savingNote === block.id}
                                                                    className="px-3 py-1.5 bg-brand-green text-white text-xs font-bold rounded-md hover:bg-brand-green/90 transition-colors disabled:opacity-50"
                                                                >
                                                                    {savingNote === block.id ? '...' : 'Send'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : tour.itinerarySummary.length === 0 ? (
                                <p className="text-neutral-500 italic">Your agent is currently building your day-by-day itinerary.</p>
                            ) : (
                                tour.itinerarySummary.map((day: any) => (
                                    <div key={day.day} className="flex gap-6 group">
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-bold font-serif shadow-sm group-hover:bg-brand-green group-hover:text-white transition-colors">
                                                {day.day}
                                            </div>
                                            <div className="w-px h-full bg-neutral-100 mt-2" />
                                        </div>
                                        <div className="pb-6 w-full">
                                            <h3 className="text-lg font-bold text-brand-charcoal">{day.title}</h3>
                                            <div className="flex items-center gap-2 text-sm text-neutral-500 mt-2">
                                                <BedDouble size={14} className="text-brand-gold" />
                                                {day.hotel}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Agent & Finances */}
                <div className="space-y-8">
                    {/* Dedicated Agent Card */}
                    <div className="bg-brand-charcoal rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37] mb-6">Your Specialist</h3>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold border border-white/20">
                                {tour.agent.photoInitials}
                            </div>
                            <div>
                                <h4 className="text-xl font-serif">{tour.agent.name}</h4>
                                <p className="text-white/60 text-sm">Travel Consultant</p>
                            </div>
                        </div>
                        <div className="space-y-3 text-sm text-white/80 font-medium">
                            <p className="flex items-center gap-3"><Phone size={16} className="text-[#D4AF37]" /> {tour.agent.phone}</p>
                            <p className="flex items-center gap-3"><Mail size={16} className="text-[#D4AF37]" /> {tour.agent.email}</p>
                        </div>
                    </div>

                    {/* Embedded Direct Chat */}
                    {userId && (
                        <div className="h-[500px] xl:h-[600px]">
                            <ChatInterface
                                topicId={id}
                                currentUserId={userId}
                                currentUserType="tourist"
                                title="Live Collaboration"
                                subtitle={`Chat instantly with ${tour.agent.name}`}
                            />
                        </div>
                    )}

                    {/* Financial Summary */}
                    <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm">
                        <h3 className="text-xl font-serif text-brand-charcoal mb-6">Financial Summary</h3>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
                                <span className="text-neutral-500 font-medium">Total Tour Value</span>
                                <span className="font-bold text-lg">{tour.totalPrice}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
                                <span className="text-neutral-500 font-medium">Amount Paid</span>
                                <span className="text-green-600 font-bold">{tour.paidAmount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-neutral-500 font-medium">Balance Due</span>
                                <span className="text-red-600 font-bold text-xl">{tour.totalPrice}</span>
                            </div>
                        </div>

                        {tour.invoices && tour.invoices.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-3">Invoices</h4>
                                {tour.invoices.map((inv: any) => (
                                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 hover:border-brand-gold/40 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${inv.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {inv.status === 'Paid' ? <CheckCircle2 size={16} /> : <ReceiptText size={16} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-brand-charcoal">{inv.id}</p>
                                                <p className="text-xs text-neutral-400">{inv.date}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold">{inv.amount}</p>
                                            <p className={`text-[10px] font-bold uppercase tracking-wider ${inv.status === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>
                                                {inv.status}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hidden Print Container */}
            <div id="print-container" className="hidden">
                <ItineraryPdfTemplate tripData={tour.rawPlannerData} />
            </div>
        </div>
    );
}
