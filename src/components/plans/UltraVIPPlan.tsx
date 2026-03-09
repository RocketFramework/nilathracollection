"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
    Crown,
    Check,
    X,
    Info,
    ArrowRight,
    Star,
    Sparkles,
    ShieldCheck,
    Gem,
    Plane,
    Map,
    Car,
    Users,
    Clock,
    Heart,
    Stethoscope,
    Leaf,
    Lock,
    Shield
} from "lucide-react";
import Link from "next/link";

export default function UltraVIPPlan() {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const nights = 7;
    const travelers = 2;

    const nightRatePerPerson = 15000; // Ultimate UHNW flagship rate
    const total = nightRatePerPerson * nights * travelers;

    const pricing = {
        total: total,
        perNight: nightRatePerPerson,
        breakdown: {
            accommodation: 7000 * nights * travelers, // Private Estate Buyout & Full Staff
            transport: 3500 * nights * travelers, // Private Jet/Heli Fleet & 24/7 Security Detail
            meals: 1500 * nights * travelers, // Bespoke Culinary, Dedicated 6-Member Chef Team (24/7)
            wellness: 1200 * nights * travelers, // Dedicated Medical, Spa & Spiritual Team
            experiences: 1000 * nights * travelers, // Masterclasses, Private Access & Custom Jewelry
            logistics: 800 * nights * travelers // Jet-side Clearance & Absolute NDA Protocols
        }
    };

    const itinerary = [
        {
            title: "Jet-Side Arrival: Elite",
            description: "Direct jet-side greeting with private concierge and traditional welcome ceremony. Skip the terminal entirely as your security team escorts you.",
            icon: Sparkles,
            details: "Jet-Side Tarmac Clearance & Host"
        },
        {
            title: "Armored Command Transit",
            description: "24/7 Close Protection Detail (CPD) with armored SUV escort for all ground movements between flight segments.",
            icon: ShieldCheck,
            details: "Permanent Armed/Unarmed Security Detail"
        },
        {
            title: "Total Aerial Domain",
            description: "A dedicated helicopter and crew remain on standby for the duration of your trip, ensuring travel at the speed of thought.",
            icon: Plane,
            details: "Dedicated Standby Helicopter Fleet"
        },
        {
            title: "Sovereign Sanctuary",
            description: "Total buyout of a private island or estate. 1:1 staff-to-guest ratio including private physician, chef, and master butler.",
            icon: Crown,
            details: "Private Estate Buyout"
        },
        {
            title: "Exclusive Masterclasses",
            description: "Private sessions with world-renowned gemologists, spiritual masters, and culinary legends in absolute seclusion.",
            icon: Heart,
            details: "Bespoke Expert Access & Curation"
        },
        {
            title: "Zero-Trace Departure",
            description: "Direct-to-aircraft tarmac departure. Every protocol designed to ensure your transition is unseen and unmatched.",
            icon: Clock,
            details: "Tactical Tarmac-to-Tarmac Exit"
        }
    ];

    const inclusions = [
        {
            category: "Estates & Sovereign Staff",
            icon: Crown,
            items: [
                "Exclusive Private Estate Buyouts",
                "Dedicated English Speaking National Guide & Expert Driver",
                "1:1 Staff-to-Guest Ratio (Butler/Chef/Concierge/Valet)",
                "Full-time Dedicated Physician & Trauma Support",
                "Absolute Privacy: Site-wide Signal Management",
                "Personalized Gourmet Kitchen (6-Member Elite Chef Team)",
                "Brand New Bespoke Linen (Destroyed/Gifted After Stay)",
            ]
        },
        {
            category: "Sovereign Logistics",
            icon: Plane,
            items: [
                "Private Jet-Side Arrival & Tarmac Clearance",
                "Dedicated Standby Helicopter for Trip Duration",
                "Permanent 24/7 Close Protection Detail (CPD)",
                "Armored SUV Fleet (B6/B7 Level Availability)"
            ]
        },
        {
            category: "Impossible Access",
            icon: Gem,
            items: [
                "Private Jewelry Masterclass (Rare Stones)",
                "Elder Spiritual & Philosophical Counsel",
                "After-hours Private Opening of National Sites",
                "Global Identity Protection Protocols"
            ]
        },
        {
            category: "Regenerative Wellness",
            icon: Heart,
            items: [
                "Bespoke Anti-Aging & Regenerative Therapies",
                "Private Ayurvedic Master & Team (Dedicated)",
                "Advanced Wellness & Medical Diagnostic Suite",
                "Michelin-Standard Personalized Nutritionist (24/7)",
                "Anything & Everything On Request (Dedicated Service)",
                "Zero-Trace Anonymity & Full NDA Ecosystem"
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
                    className="absolute inset-0 bg-[url('/images/plans/ultra_vip_sri_lanka_v5.png')] bg-cover"
                    style={{ backgroundPosition: 'center -140px' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-black/10" />

                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-10">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-3 px-6 py-2 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] via-[#B38728] via-[#FBF5B7] to-[#AA771C] rounded-full border border-[#D4AF37]/50 backdrop-blur-md mb-8 shadow-[0_15px_40_rgba(184,134,11,0.6)] relative overflow-hidden group"
                    >
                        <motion.div
                            animate={{ x: ['-150%', '300%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none"
                        />
                        <Crown size={20} className="text-white relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                        <span className="text-white text-xs font-black uppercase tracking-[0.4em] relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">The Ultimate Experience</span>
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-7xl md:text-9xl font-serif text-logo-blue mb-6 tracking-tight drop-shadow-sm"
                    >
                        Ultra VIP
                    </motion.h1>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-neutral-800 max-w-2xl text-xl font-medium leading-relaxed mb-12"
                    >
                        Reserved for the world's most discerning travelers.
                        A realm of absolute privacy, bespoke luxury, and peerless security.
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
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-black mb-3">Signature Quote</p>
                                    <div className="text-6xl font-serif text-logo-blue tracking-widest leading-none">
                                        ${total.toLocaleString()}
                                    </div>
                                    <p className="text-neutral-500 text-xs mt-4 font-bold uppercase tracking-widest">
                                        7 Nights · 2 Travelers
                                    </p>
                                </div>
                                <div className="h-24 w-px bg-neutral-100 hidden md:block" />
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-brand-gold font-black mb-3">Daily Allocation</p>
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

            {/* Experience Roadmap - The Gold Route */}
            <div className="bg-neutral-50 border-y border-neutral-100 py-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="text-center mb-32">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[10px] font-black uppercase tracking-[0.3em] mb-6"
                        >
                            <Sparkles size={14} /> Sequential Excellence
                        </motion.div>
                        <h2 className="text-5xl md:text-7xl font-serif text-logo-blue mb-8 tracking-tight">The Gold Route Journey</h2>
                        <p className="text-neutral-500 max-w-2xl mx-auto text-lg leading-relaxed">
                            A perfectly orchestrated sequence of luxury, privacy, and speed.
                            From the moment you touch down to your final departure, every transition is seamless.
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
                                <Shield size={14} /> Total Anonymity Guaranteed
                            </div>
                            <h2 className="text-5xl font-serif text-logo-blue tracking-tight">Privacy Architecture</h2>
                            <p className="text-neutral-600 text-xl leading-relaxed font-medium">
                                Our Ultra VIP tier is a fortified private domain. Beyond luxury, we provide a "Zero-Trace" security architecture designed for high-profile individuals requiring absolute seclusion.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                {[
                                    { title: "Sovereign NDA Protocols", desc: "All staff and partners operate under multi-jurisdictional, elite-tier non-disclosure agreements." },
                                    { title: "Invisible Transitions", desc: "Jet-side tarmac handling and private helipads to ensure zero public or digital exposure." },
                                    { title: "Hardened Communications", desc: "Military-grade encrypted concierge channels for all planning and on-ground adjustments." },
                                    { title: "Ghost-Protocol Billing", desc: "Total financial invisibility and comprehensive global identity protection." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 items-start p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0" />
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
                                <h3 className="text-2xl font-serif text-logo-blue">Service Breakdown</h3>
                                <button
                                    onClick={() => setShowBreakdown(!showBreakdown)}
                                    className="text-[11px] font-black uppercase tracking-widest text-neutral-400 hover:text-logo-blue transition-colors flex items-center gap-2"
                                >
                                    {showBreakdown ? "Hide Details" : "Reveal Pricing"}
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
                                                { label: "Elite Buyout & 24/7 Butler", value: pricing.breakdown.accommodation },
                                                { label: "Helicopter Fleet & Security", value: pricing.breakdown.transport },
                                                { label: "Bespoke Culinary & Chef", value: pricing.breakdown.meals },
                                                { label: "Daily Ayurveda & Medical", value: pricing.breakdown.wellness },
                                                { label: "Bespoke Gems & Private Access", value: pricing.breakdown.experiences },
                                                { label: "VIP Handling & NDA Compliance", value: pricing.breakdown.logistics },
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
                                        <Lock size={80} className="text-white" />
                                    </div>
                                    <Users size={40} className="text-brand-gold mb-6" />
                                    <h4 className="font-serif text-2xl text-white mb-2">Absolute Seclusion</h4>
                                    <p className="text-sm text-neutral-400 leading-relaxed font-medium">Extreme privacy protocols with 100% staff anonymity and total site buyouts.</p>
                                </div>
                            </div>
                            <div className="space-y-4 pt-16">
                                <div className="p-8 bg-neutral-50 rounded-[2.5rem] border border-neutral-100 hover:border-logo-blue/20 transition-colors">
                                    <Sparkles size={40} className="text-logo-blue mb-6" />
                                    <h4 className="font-serif text-2xl text-neutral-900 mb-2">Impossible Access</h4>
                                    <p className="text-sm text-neutral-500 leading-relaxed font-medium">We open doors to private collections, remote sites, and sacred spaces.</p>
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
                                    href={`/contact?plan=ultra-vip&nights=${nights}&travelers=${travelers}`}
                                    className="w-full bg-logo-blue hover:bg-logo-blue/90 text-white py-6 rounded-3xl font-black uppercase tracking-[0.25em] text-sm transition-all shadow-2xl shadow-logo-blue/20 active:scale-[0.98] block text-center"
                                >
                                    Initiate VIP Consultation
                                </Link>

                                <p className="mt-8 text-[11px] uppercase font-bold tracking-[0.3em] text-neutral-400">
                                    private concierge assigned upon request
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </motion.div>
    );
}
