"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
    Gem,
    Check,
    Info,
    Star,
    Sparkles,
    ShieldCheck,
    Plane,
    Car,
    Clock,
    Heart,
    Crown,
    Shield,
    Coffee,
    Hotel,
    Waves,
    Compass
} from "lucide-react";
import Link from "next/link";

export default function LuxuryPlan() {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const nights = 7;
    const travelers = 2;

    const nightRatePerPerson = 500; // flagship luxury rate
    const total = nightRatePerPerson * nights * travelers;

    const pricing = {
        total: total,
        perNight: nightRatePerPerson,
        breakdown: {
            accommodation: 220 * nights * travelers, // Signature Resorts & Boutique Hotels
            transport: 70 * nights * travelers, // Premium SUV & Private Transfers
            meals: 60 * nights * travelers, // Signature Half-Board (HB): Breakfast & Fine Dining
            wellness: 50 * nights * travelers, // Spa sessions & Wellness access
            experiences: 70 * nights * travelers, // Expert Guides & Private Tours
            logistics: 30 * nights * travelers // Standard Express & Concierge (VIP on Request)
        }
    };

    const itinerary = [
        {
            title: "Private Arrival: Express",
            description: "Personalized greeting at the arrival terminal. Direct assistance with baggage and a smooth transition to your waiting private vehicle.",
            icon: Sparkles,
            details: "Arrival Greeting + Logistics Support"
        },
        {
            title: "Elite Chauffeur Transit",
            description: "Direct transfer via premium SUV to your first destination. Refreshments and Wi-Fi provided for a seamless transition.",
            icon: Car,
            details: "Premium SUV x 24/7 Availability"
        },
        {
            title: "5-Star Collection",
            description: "Check-in to the island's most iconic signature resorts. Reliable 5-star comfort with ocean or jungle views and personalized welcomes.",
            icon: Hotel,
            details: "Iconic 5-Star Resorts"
        },
        {
            title: "Signature Gastronomy (HB)",
            description: "Half-Board (HB) dining featuring signature breakfasts and sought-after dinner reservations. Enjoy private beachfront dinners and local organic delicacies.",
            icon: Coffee,
            details: "Signature Half-Board (HB)"
        },
        {
            title: "Immersive Discovery",
            description: "Explore sacred sites and hidden gems with an elite National Guide. Private after-hours access to selected monuments.",
            icon: Compass,
            details: "Expert Guide + Exclusive Access"
        },
        {
            title: "Elegant Departure",
            description: "Leisurely morning at your resort followed by a direct premium transfer to the airport for your stress-free departure.",
            icon: Waves,
            details: "Premium Transfer + Departure Support"
        }
    ];

    const inclusions = [
        {
            category: "Stay & Style",
            icon: Crown,
            items: [
                "Hand-picked Signature 5-Star Resorts",
                "Superior or Deluxe Room Categories",
                "Personalized Welcome Amenities",
                "Early Check-in & Late Check-out options",
                "Daily Signature Half-Board (HB) Buffet/Menu"
            ]
        },
        {
            category: "Premium Logistics",
            icon: Car,
            items: [
                "Private Premium SUV & Elastic Driver Support",
                "Dedicated English Speaking National Guide",
                "Personalized Butler Service (Per Property)",
                "Airport Arrival & Departure Greeting",
                "All Domestic Highway & Parking Fees",
                "Daily Refreshment Pack (Chilled)"
            ]
        },
        {
            category: "Curated Culture",
            icon: Gem,
            items: [
                "Private Curated Cultural Tours",
                "Expert Local Guide Insights",
                "Hand-picked Artisan Workshop visits",
                "Personalized Shopping Support",
                "Entrance Fees to All Major Sites"
            ]
        },
        {
            category: "Wellness & Rejuvenation",
            icon: Heart,
            items: [
                "Daily Ayurvedic or Balinese Spa Session",
                "Private Yoga or Meditation Sessions",
                "Access to Luxury Pool & Beach Clubs",
                "Dedicated On-trip Relationship Manager (24/7)",
                "All Local Taxes & Service Charges Included"
            ]
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-neutral-200 text-neutral-900"
        >
            {/* World-Class Header */}
            <div className="relative h-[700px] overflow-hidden">
                <div
                    className="absolute inset-0 bg-[url('/images/plans/luxury_sri_lanka.png')] bg-cover"
                    style={{ backgroundPosition: 'center -150px' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-black/10" />

                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-10">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-3 px-6 py-2 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] via-[#B38728] via-[#FBF5B7] to-[#AA771C] rounded-full border border-[#D4AF37]/50 backdrop-blur-md mb-8 shadow-[0_15px_40px_-10px_rgba(184,134,11,0.4)] relative overflow-hidden group"
                    >
                        <motion.div
                            animate={{ x: ['-150%', '300%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none"
                        />
                        <Star size={20} className="text-white relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                        <span className="text-white text-xs font-black uppercase tracking-[0.4em] relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">The Sapphire Collection</span>
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-7xl md:text-9xl font-serif text-logo-blue mb-6 tracking-tight drop-shadow-sm"
                    >
                        Luxury Collection
                    </motion.h1>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-neutral-800 max-w-2xl text-xl font-medium leading-relaxed mb-12"
                    >
                        An elevated journey through Sri Lanka's most iconic destinations,
                        featuring 5-star comfort and professional local expertise.
                    </motion.p>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col items-center"
                    >
                        <div className="bg-white/95 backdrop-blur-xl border border-neutral-100 rounded-[3rem] p-8 md:px-14 md:py-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]">
                            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-black mb-3">Flagship Quote</p>
                                    <div className="text-6xl font-serif text-logo-blue tracking-widest leading-none">
                                        ${total.toLocaleString()}
                                    </div>
                                    <p className="text-neutral-500 text-xs mt-4 font-bold uppercase tracking-widest">
                                        7 Nights · 2 Travelers
                                    </p>
                                </div>
                                <div className="h-24 w-px bg-neutral-100 hidden md:block" />
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-brand-gold font-black mb-3">Daily Investment</p>
                                    <div className="text-4xl font-serif text-logo-blue leading-none">
                                        ${nightRatePerPerson.toLocaleString()}
                                    </div>
                                    <p className="text-neutral-500 text-xs mt-4 font-bold uppercase tracking-widest">
                                        Per Person / Per Day
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Experience Roadmap - The Sapphire Route */}
            <div className="bg-neutral-50 border-y border-neutral-100 py-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="text-center mb-32">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[10px] font-black uppercase tracking-[0.3em] mb-6"
                        >
                            <Sparkles size={14} /> The Sapphire Route
                        </motion.div>
                        <h2 className="text-5xl md:text-7xl font-serif text-logo-blue mb-8 tracking-tight">The Epicurean Journey</h2>
                        <p className="text-neutral-500 max-w-2xl mx-auto text-lg leading-relaxed">
                            A curated sequence of discovery and comfort.
                            From standard express handling to final sunset, every moment is hand-crafted for excellence.
                        </p>
                    </div>

                    <div className="relative">
                        {/* Connecting Path Line (Desktop) */}
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neutral-200 to-transparent -translate-y-1/2 hidden lg:block" />

                        <div className="grid lg:grid-cols-3 gap-y-24 lg:gap-12 relative">
                            {itinerary.map((step, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.15, duration: 0.6 }}
                                    viewport={{ once: true }}
                                    className="relative flex flex-col items-center text-center group"
                                >
                                    {/* Sequence Number */}
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-[80px] font-serif text-neutral-100/50 select-none group-hover:text-brand-gold/10 transition-colors duration-500">
                                        0{idx + 1}
                                    </div>

                                    {/* Icon Milestone */}
                                    <div className="relative z-10 w-24 h-24 rounded-full bg-white border-2 border-neutral-100 flex items-center justify-center text-logo-blue mb-10 shadow-xl group-hover:border-logo-blue group-hover:scale-110 transition-all duration-500">
                                        <div className="absolute inset-2 rounded-full border border-neutral-50" />
                                        <step.icon size={36} strokeWidth={1.5} />

                                        {/* Progress Dot */}
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-logo-blue border-4 border-white shadow-lg lg:hidden" />
                                    </div>

                                    {/* Content Card */}
                                    <div className="relative p-10 rounded-[2.5rem] bg-white border border-neutral-100 shadow-sm group-hover:shadow-2xl group-hover:-translate-y-4 transition-all duration-700 w-full max-w-sm">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 rounded-full bg-logo-blue text-white text-[10px] font-black uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all duration-500">
                                            Phase 0{idx + 1}
                                        </div>

                                        <h3 className="text-2xl font-serif text-neutral-900 mb-4 tracking-tight group-hover:text-logo-blue transition-colors">{step.title}</h3>
                                        <p className="text-neutral-500 text-sm leading-relaxed mb-8 min-h-[7rem] group-hover:text-neutral-700 transition-colors">
                                            {step.description}
                                        </p>

                                        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-neutral-50 border border-neutral-100 group-hover:bg-logo-blue/5 group-hover:border-logo-blue/10 transition-all">
                                            <Check size={14} className="text-brand-gold" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-logo-blue transition-colors">{step.details}</span>
                                        </div>
                                    </div>

                                    {/* Mobile Connector */}
                                    {idx !== itinerary.length - 1 && (
                                        <div className="h-24 w-px bg-gradient-to-b from-neutral-200 to-transparent lg:hidden mt-4" />
                                    )}

                                    {/* Desktop Arrow Connector */}
                                    {idx !== itinerary.length - 1 && idx !== 2 && (
                                        <div className="absolute top-1/2 -right-6 -translate-y-1/2 hidden lg:block">
                                            <div className="w-12 h-px bg-neutral-200" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-6 py-32 md:px-12">
                <div className="grid lg:grid-cols-2 gap-32 items-start">
                    {/* Left: Philosophy & Breakdown */}
                    <div className="space-y-20">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-logo-blue/5 border border-logo-blue/10 text-logo-blue text-[10px] font-black uppercase tracking-[0.3em]">
                                <ShieldCheck size={14} /> Uncompromising Quality
                            </div>
                            <h2 className="text-5xl font-serif text-logo-blue tracking-tight">Iconic Standards</h2>
                            <p className="text-neutral-600 text-xl leading-relaxed font-medium">
                                The Luxury Tier is designed for travelers who seek the best of the island with absolute comfort. From top-tier room categories at 5-star resorts to elite-level guides, we ensure a world-class standard at every turn.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                {[
                                    { title: "Signature Resorts", desc: "Exclusive access to the most iconic room categories in 5-star properties." },
                                    { title: "Premium SUV", desc: "Luxurious, late-model SUV transport for all land-based movements." },
                                    { title: "National Guides", desc: "Elite English-speaking guides with deep knowledge of history and culture." },
                                    { title: "Standard Express", desc: "Smooth airport greeting and luggage assistance. (VIP Handling available on request)." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 items-start p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-black text-logo-blue uppercase tracking-widest mb-1">{item.title}</h4>
                                            <p className="text-xs text-neutral-500 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-10">
                            <div className="flex items-center justify-between border-b border-neutral-100 pb-6">
                                <h3 className="text-2xl font-serif text-logo-blue">Service Allocation</h3>
                                <button
                                    onClick={() => setShowBreakdown(!showBreakdown)}
                                    className="text-[11px] font-black uppercase tracking-widest text-neutral-400 hover:text-logo-blue transition-colors flex items-center gap-2"
                                >
                                    {showBreakdown ? "Hide Details" : "Reveal Breakdown"}
                                    <Info size={14} />
                                </button>
                            </div>

                            <AnimatePresence>
                                {showBreakdown && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden space-y-6"
                                    >
                                        <div className="grid gap-4">
                                            {[
                                                { label: "Signature Resorts & Hotels", value: pricing.breakdown.accommodation },
                                                { label: "Premium SUV & Transfers", value: pricing.breakdown.transport },
                                                { label: "Curated Fine Dining", value: pricing.breakdown.meals },
                                                { label: "Daily Wellness & Access", value: pricing.breakdown.wellness },
                                                { label: "Elite Guides & Entrance", value: pricing.breakdown.experiences },
                                                { label: "Premium Logistics & Support", value: pricing.breakdown.logistics },
                                            ].map((item, i) => (
                                                <div key={i} className="flex justify-between items-center py-5 border-b border-neutral-50 hover:bg-neutral-50 transition-colors px-6 rounded-2xl">
                                                    <span className="text-neutral-500 font-bold tracking-wide uppercase text-xs">{item.label}</span>
                                                    <span className="text-logo-blue font-serif text-2xl tracking-widest">${item.value.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <div className="p-8 bg-neutral-900 rounded-[2.5rem] border border-logo-blue/20 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Check size={80} className="text-white" />
                                    </div>
                                    <Sparkles size={40} className="text-brand-gold mb-6" />
                                    <h4 className="font-serif text-2xl text-white mb-2">Elite Curation</h4>
                                    <p className="text-sm text-neutral-400 leading-relaxed font-medium">Every accommodation and experience is personally vetted for the highest standard.</p>
                                </div>
                            </div>
                            <div className="space-y-4 pt-16">
                                <div className="p-8 bg-neutral-50 rounded-[2.5rem] border border-neutral-100 hover:border-logo-blue/20 transition-colors">
                                    <Compass size={40} className="text-logo-blue mb-6" />
                                    <h4 className="font-serif text-2xl text-neutral-900 mb-2">Deep Discovery</h4>
                                    <p className="text-sm text-neutral-500 leading-relaxed font-medium">Beyond sight-seeing: gain true insight through our most experienced National Guides.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Inclusions & Quote */}
                    <div className="space-y-12 lg:sticky lg:top-32">
                        <div className="bg-white border border-neutral-100 rounded-[3rem] p-12 space-y-16 shadow-xl">
                            {inclusions.map((section, idx) => (
                                <div key={idx} className="space-y-8">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-logo-blue/5 rounded-2xl border border-logo-blue/10">
                                            <section.icon size={28} className="text-logo-blue" />
                                        </div>
                                        <h3 className="text-2xl font-serif text-neutral-900 tracking-tight">{section.category}</h3>
                                    </div>
                                    <ul className="grid gap-5">
                                        {section.items.map((item, i) => (
                                            <li key={i} className="flex items-start gap-4">
                                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0 shadow-[0_0_8px_rgba(196,181,92,0.5)]" />
                                                <span className="text-sm font-bold text-neutral-600 leading-relaxed">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}

                            <div className="pt-12 border-t border-neutral-100 flex flex-col items-center">
                                <Link
                                    href={`/contact?plan=luxury&nights=${nights}&travelers=${travelers}`}
                                    className="w-full bg-logo-blue hover:bg-logo-blue/90 text-white py-6 rounded-3xl font-black uppercase tracking-[0.25em] text-sm transition-all shadow-2xl shadow-logo-blue/20 active:scale-[0.98] block text-center"
                                >
                                    Initiate Luxury Consultation
                                </Link>

                                <p className="mt-8 text-[11px] uppercase font-bold tracking-[0.3em] text-neutral-400">
                                    expert planning assigned upon request
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </motion.div>
    );
}
