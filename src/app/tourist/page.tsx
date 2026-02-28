"use client";

import Link from "next/link";
import { MapPin, Calendar, Clock, ArrowRight, UserCircle2, Phone, Mail, FileText } from "lucide-react";

// For display purposes, we are keeping dummy data that represents what `TourService` would return.
// In a finalized application, this would fetch from Supabase.
const DUMMY_TOURS = [
    {
        id: "trip-a1",
        title: "14-Day Complete Sri Lanka Circuit",
        status: "Active",
        startDate: "2026-11-10",
        endDate: "2026-11-24",
        locations: ["Colombo", "Kandy", "Ella", "Yala", "Galle"],
        agent: {
            name: "Samadhi Silva",
            phone: "+94 77 123 4567",
            email: "samadhi@nilathra.com"
        },
        invoicesSummary: { pendingCount: 1, totalValue: 4500 }
    },
    {
        id: "trip-a2",
        title: "Weekend Coastal Escape",
        status: "Completed",
        startDate: "2025-12-05",
        endDate: "2025-12-08",
        locations: ["Galle", "Mirissa"],
        agent: {
            name: "Ruwan Perera",
            phone: "+94 71 987 6543",
            email: "ruwan@nilathra.com"
        },
        invoicesSummary: { pendingCount: 0, totalValue: 800 }
    }
];

export default function TouristDashboard() {
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

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {DUMMY_TOURS.map((tour) => {
                        const isActive = tour.status === 'Active' || tour.status === 'Assigned' || tour.status === 'Pending';
                        return (
                            <Link
                                key={tour.id}
                                href={`/tourist/tour/${tour.id}`}
                                className="group bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
                            >
                                {/* Card Header & Status */}
                                <div className="p-6 border-b border-neutral-100 relative">
                                    <div className={`absolute top-0 left-0 w-full h-1 ${isActive ? 'bg-brand-gold' : 'bg-neutral-300'}`} />
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${isActive
                                                ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/20'
                                                : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                                            }`}>
                                            {tour.status}
                                        </span>
                                        {tour.invoicesSummary.pendingCount > 0 && (
                                            <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                                                <FileText size={12} /> {tour.invoicesSummary.pendingCount} Pending Invoice
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-brand-charcoal group-hover:text-brand-green transition-colors">{tour.title}</h3>
                                    <div className="flex items-center gap-4 mt-3 text-sm text-neutral-500">
                                        <span className="flex items-center gap-1"><Calendar size={14} /> {tour.startDate}</span>
                                        <span className="flex items-center gap-1"><Clock size={14} /> 14 Days</span>
                                    </div>
                                </div>

                                {/* Destinations Summary */}
                                <div className="px-6 py-4 bg-neutral-50/50 flex flex-wrap gap-2 text-xs text-neutral-500">
                                    <MapPin size={14} className="text-brand-gold" />
                                    {tour.locations.join(' · ')}
                                </div>

                                {/* Agent Info Card embedded */}
                                <div className="p-6 mt-auto bg-neutral-50 border-t border-neutral-100">
                                    <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold mb-3">Your Dedicated Specialist</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-lg">
                                            {tour.agent.name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-brand-charcoal text-sm">{tour.agent.name}</h4>
                                            <div className="flex text-neutral-500 justify-between items-center w-full">
                                                <span className="text-xs flex items-center gap-1"><Phone size={10} /> {tour.agent.phone}</span>
                                                <ArrowRight size={16} className="text-brand-gold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
