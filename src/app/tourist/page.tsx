"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Calendar, Clock, ArrowRight, UserCircle2, Phone, Mail, FileText } from "lucide-react";

export default function TouristDashboard() {
    const [tours, setTours] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTours = async () => {
            setIsLoading(true);
            try {
                const { TouristService } = await import('@/services/tourist.service');
                const data = await TouristService.getMyTours();
                setTours(data);
            } catch (error) {
                console.error("Failed to load tours:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTours();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Welcome Section */}
            <div className="bg-brand-green rounded-3xl p-8 md:p-12 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-5xl font-serif mb-4">Welcome back, Traveler</h1>
                    <p className="text-white/80 text-lg max-w-2xl">
                        Track your upcoming journeys, review quotes, manage invoices, and chat directly with your dedicated travel specialist all in one place.
                    </p>
                </div>
            </div>

            {/* Grid View of Journeys */}
            <div>
                <h2 className="text-2xl font-serif text-brand-charcoal mb-6 border-b border-neutral-200 pb-3">My Journeys</h2>

                {isLoading ? (
                    <div className="p-12 flex justify-center text-brand-gold">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
                    </div>
                ) : tours.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center text-neutral-400 bg-white rounded-2xl border border-neutral-200">
                        <MapPin size={48} className="mb-4 opacity-50" />
                        <h3 className="text-lg font-bold text-brand-charcoal mb-2">No active journeys</h3>
                        <p className="text-sm text-center">Your travel specialist is curating your perfect itinerary. It will appear here once ready for your review.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tours.map((tour) => {
                            const isActive = tour.status === 'Active' || tour.status === 'Assigned' || tour.status === 'Pending' || tour.status === 'Review Ready';
                            return (
                                <Link
                                    key={tour.id}
                                    href={`/tourist/tour/${tour.id}`}
                                    className="group bg-white rounded-2xl border border-neutral-200 shadow-sm hover:border-brand-gold/40 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col md:flex-row items-center relative"
                                >
                                    {/* Left Accent Bar */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isActive ? 'bg-brand-gold' : 'bg-neutral-300'}`} />

                                    {/* Content Area */}
                                    <div className="p-6 flex-1 flex flex-col md:flex-row md:items-center gap-6 w-full pl-8">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${isActive
                                                    ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/20'
                                                    : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                                                    }`}>
                                                    {tour.status}
                                                </span>
                                                {tour.invoicesSummary?.pendingCount > 0 && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-full">
                                                        <FileText size={12} /> {tour.invoicesSummary.pendingCount} Pending Invoice
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-xl font-bold font-serif text-brand-charcoal group-hover:text-brand-green transition-colors">{tour.title}</h3>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500 font-medium">
                                                <span className="flex items-center gap-1.5"><Calendar size={14} className="text-brand-gold" /> {tour.startDate ? new Date(tour.startDate).toLocaleDateString() : 'TBD'}</span>
                                                {tour.locations && tour.locations.length > 0 && (
                                                    <span className="flex items-center gap-1.5"><MapPin size={14} className="text-brand-gold" /> {tour.locations.join(' · ')}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="w-full md:w-px md:h-16 bg-neutral-100 hidden md:block" />

                                        <div className="flex items-center gap-4 md:min-w-[280px] justify-between md:justify-start">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-lg">
                                                    {tour.agent?.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-0.5">Specialist</p>
                                                    <h4 className="font-bold text-brand-charcoal text-sm">{tour.agent?.name || 'Agent'}</h4>
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-colors ml-auto md:ml-4">
                                                <ArrowRight size={18} />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
