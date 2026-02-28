"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { MapPin, Phone, Mail, MessageSquare, Download, CheckCircle2, ChevronRight, BedDouble, Calendar, ArrowLeft } from "lucide-react";

export default function TourDetailsPage() {
    const params = useParams();
    const id = params.id as string;

    // Dummy specific data for mockup purposes
    const tour = {
        title: "14-Day Complete Sri Lanka Circuit",
        status: "Active",
        destinations: ["Colombo", "Kandy", "Ella", "Yala", "Galle"],
        totalPrice: "$4,500 USD",
        paidAmount: "$1,500 USD",
        agent: {
            name: "Samadhi Silva",
            phone: "+94 77 123 4567",
            email: "samadhi@nilathra.com",
            photoInitials: "SS"
        },
        invoices: [
            { id: 'INV-001', amount: "$1,500", status: 'Paid', date: 'Oct 01, 2026' },
            { id: 'INV-002', amount: "$3,000", status: 'Pending', date: 'Oct 25, 2026' },
        ],
        itinerarySummary: [
            { day: 1, title: "Arrival & Negombo Rest", hotel: "The Jetwing Sea" },
            { day: 2, title: "Transfer to Kandy & Temple", hotel: "Kandy Heritage Resort" },
            { day: 3, title: "Scenic Train to Ella", hotel: "98 Acres Resort" },
        ]
    };

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
                                <span className="inline-block px-3 py-1 bg-brand-green/10 text-brand-green text-xs font-bold uppercase tracking-widest rounded-full mb-3">
                                    {tour.status} Tour
                                </span>
                                <h1 className="text-3xl font-serif text-brand-charcoal font-bold">{tour.title}</h1>
                                <p className="text-neutral-500 flex items-center gap-2 mt-2 font-medium">
                                    <MapPin size={16} className="text-brand-gold" /> {tour.destinations.join(' → ')}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-neutral-50 rounded-2xl flex flex-wrap gap-8">
                            <div>
                                <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Start Date</p>
                                <p className="font-bold text-brand-charcoal">Nov 10, 2026</p>
                            </div>
                            <div>
                                <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Duration</p>
                                <p className="font-bold text-brand-charcoal">14 Days / 13 Nights</p>
                            </div>
                            <div>
                                <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Travelers</p>
                                <p className="font-bold text-brand-charcoal">2 Adults</p>
                            </div>
                        </div>
                    </div>

                    {/* Compact Itinerary Summary View */}
                    <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-serif text-brand-charcoal">Itinerary Overview</h2>
                            <button className="text-brand-green text-sm font-bold flex items-center gap-2 hover:text-brand-gold transition-colors">
                                <Download size={16} /> Download PDF
                            </button>
                        </div>

                        <div className="space-y-6">
                            {tour.itinerarySummary.map((day) => (
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
                            ))}
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
                        <div className="space-y-3 text-sm text-white/80 mb-6 font-medium">
                            <p className="flex items-center gap-3"><Phone size={16} className="text-[#D4AF37]" /> {tour.agent.phone}</p>
                            <p className="flex items-center gap-3"><Mail size={16} className="text-[#D4AF37]" /> {tour.agent.email}</p>
                        </div>
                        <Link href={`/tourist/tour/${id}/chat`} className="w-full py-3 bg-brand-gold hover:bg-[#B3932F] text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                            <MessageSquare size={18} /> Open Tour Chat
                        </Link>
                    </div>

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
                                <span className="text-red-600 font-bold text-xl">$3,000 USD</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-3">Invoices</h4>
                            {tour.invoices.map(inv => (
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
                    </div>
                </div>
            </div>
        </div>
    );
}

// Ensure lucide icon ReceiptText is handled properly, if not imported we use default FileText. But lucide has ReceiptText.
import { ReceiptText } from "lucide-react";
