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
import { useTranslation } from "@/components/I18nProvider";

export default function UltraVIPPlan() {
    const t = useTranslation();
    const tVip = t.packages.ultraVip;
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [activeJourney, setActiveJourney] = useState<"gold" | "signature">("gold");
    const nights = 7;
    const travelers = 2;

    const nightRatePerPerson = 15000; // Ultra VIP flagship rate per person per day
    const total = nightRatePerPerson * nights * travelers;

    const pricing = {
        total: total,
        perNight: nightRatePerPerson,
        breakdown: {
            accommodation: 2333 * nights * travelers, // Private Estate Buyout & Full Staff
            transport: 1167 * nights * travelers, // Private Jet/Heli Fleet & 24/7 Security Detail
            meals: 500 * nights * travelers, // Bespoke Culinary, Dedicated 6-Member Chef Team (24/7)
            wellness: 400 * nights * travelers, // Dedicated Medical, Spa & Spiritual Team
            experiences: 333 * nights * travelers, // Masterclasses, Private Access & Custom Jewelry
            logistics: 267 * nights * travelers // Jet-side Clearance & Absolute NDA Protocols
        }
    };

    const itineraryIcons = [Sparkles, ShieldCheck, Plane, Crown, Heart, Clock];
    const itinerary = tVip.gold.itinerary.map((item: any, idx: number) => ({
        ...item,
        icon: itineraryIcons[idx]
    }));

    const sigIcons = [Plane, Map, Leaf, Stethoscope, Heart, Star, Sparkles];
    const signatureItinerary = tVip.signature.itinerary.map((item: any, idx: number) => ({
        ...item,
        day: idx + 1,
        icon: sigIcons[idx]
    }));

    const incIcons = [Crown, Plane, Gem, Heart];
    const inclusions = tVip.inclusions.map((item: any, idx: number) => ({
        ...item,
        icon: incIcons[idx]
    }));

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-neutral-200 text-neutral-900"
        >
            {/* World-Class Header */}
            <div className="relative min-h-[850px] md:min-h-[700px] flex flex-col justify-center overflow-hidden py-20 md:py-10">
                <div
                    className="absolute inset-0 bg-[url('/images/plans/ultra_vip_sri_lanka_v5.avif')] bg-cover"
                    style={{ backgroundPosition: 'center -140px' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-black/10" />

                <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 md:px-10">
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
                        <span className="text-white text-xs font-black uppercase tracking-[0.4em] relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{tVip.badge}</span>
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-7xl md:text-9xl font-serif text-logo-blue mb-6 tracking-tight drop-shadow-sm"
                    >
                        {tVip.title}
                    </motion.h1>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-neutral-800 max-w-2xl text-xl font-medium leading-relaxed mb-12"
                    >
                        {tVip.desc_1}<br />
                        {tVip.desc_2}
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
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-black mb-3">{tVip.quote.sig}</p>
                                    <div className="text-6xl font-serif text-logo-blue tracking-widest leading-none">
                                        ${total.toLocaleString()}
                                    </div>
                                    <p className="text-neutral-500 text-xs mt-4 font-bold uppercase tracking-widest">
                                        {tVip.quote.sig_det}
                                    </p>
                                </div>
                                <div className="h-24 w-px bg-neutral-100 hidden md:block" />
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-brand-gold font-black mb-3">{tVip.quote.daily}</p>
                                    <div className="text-4xl font-serif text-logo-blue leading-none">
                                        ${nightRatePerPerson.toLocaleString()}
                                    </div>
                                    <p className="text-neutral-500 text-xs mt-4 font-bold uppercase tracking-widest">
                                        {tVip.quote.daily_det}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Journey Selector Section */}
            <div className="bg-neutral-50 border-y border-neutral-100 py-24 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 md:px-12">

                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[10px] font-black uppercase tracking-[0.3em] mb-6"
                        >
                            <Sparkles size={14} /> Choose Your Journey
                        </motion.div>
                        <h2 className="text-5xl md:text-7xl font-serif text-logo-blue mb-6 tracking-tight">Our Ultra VIP Journeys</h2>
                        <p className="text-neutral-500 max-w-2xl mx-auto text-lg leading-relaxed">
                            Two distinct pathways, one standard of absolute excellence. Select the journey that resonates with your vision.
                        </p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex justify-center mb-20">
                        <div className="flex bg-white border border-neutral-200 rounded-full p-1.5 shadow-sm gap-1">
                            <button
                                onClick={() => setActiveJourney("gold")}
                                className={`flex items-center gap-2.5 px-7 py-3 rounded-full text-xs font-black uppercase tracking-[0.25em] transition-all duration-300 ${activeJourney === "gold"
                                    ? "bg-logo-blue text-white shadow-lg shadow-logo-blue/20"
                                    : "text-neutral-400 hover:text-logo-blue"
                                    }`}
                            >
                                <Crown size={14} /> The Gold Route
                            </button>
                            <button
                                onClick={() => setActiveJourney("signature")}
                                className={`flex items-center gap-2.5 px-7 py-3 rounded-full text-xs font-black uppercase tracking-[0.25em] transition-all duration-300 ${activeJourney === "signature"
                                    ? "bg-logo-blue text-white shadow-lg shadow-logo-blue/20"
                                    : "text-neutral-400 hover:text-logo-blue"
                                    }`}
                            >
                                <Gem size={14} /> Nilathra Signature Journey
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {/* Gold Route Tab */}
                        {activeJourney === "gold" && (
                            <motion.div
                                key="gold"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                            >
                                <p className="text-center text-neutral-500 max-w-2xl mx-auto text-base leading-relaxed mb-20">
                                    {tVip.gold.desc}
                                </p>
                                <div className="relative">
                                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neutral-200 to-transparent -translate-y-1/2 hidden lg:block" />
                                    <div className="grid lg:grid-cols-3 gap-y-24 lg:gap-12 relative">
                                        {itinerary.map((step: any, idx: number) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 30 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.15, duration: 0.6 }}
                                                viewport={{ once: true }}
                                                className="relative flex flex-col items-center text-center group"
                                            >
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-[80px] font-serif text-neutral-100/50 select-none group-hover:text-brand-gold/10 transition-colors duration-500">
                                                    0{idx + 1}
                                                </div>
                                                <div className="relative z-10 w-24 h-24 rounded-full bg-white border-2 border-neutral-100 flex items-center justify-center text-logo-blue mb-10 shadow-xl group-hover:border-logo-blue group-hover:scale-110 transition-all duration-500">
                                                    <div className="absolute inset-2 rounded-full border border-neutral-50" />
                                                    <step.icon size={36} strokeWidth={1.5} />
                                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-logo-blue border-4 border-white shadow-lg lg:hidden" />
                                                </div>
                                                <div className="relative p-10 rounded-[2.5rem] bg-white border border-neutral-100 shadow-sm group-hover:shadow-2xl group-hover:-translate-y-4 transition-all duration-700 w-full max-w-sm">
                                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 rounded-full bg-logo-blue text-white text-[10px] font-black uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all duration-500">
                                                        {tVip.gold.phase} 0{idx + 1}
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
                                                {idx !== itinerary.length - 1 && (
                                                    <div className="h-24 w-px bg-gradient-to-b from-neutral-200 to-transparent lg:hidden mt-4" />
                                                )}
                                                {idx !== itinerary.length - 1 && idx !== 2 && (
                                                    <div className="absolute top-1/2 -right-6 -translate-y-1/2 hidden lg:block">
                                                        <div className="w-12 h-px bg-neutral-200" />
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Nilathra Signature Journey Tab */}
                        {activeJourney === "signature" && (
                            <motion.div
                                key="signature"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                                className="max-w-4xl mx-auto"
                            >
                                <p className="text-center text-neutral-500 text-base leading-relaxed mb-20">
                                    {tVip.signature.desc}
                                </p>

                                {/* Day-by-Day Timeline */}
                                <div className="relative">
                                    {/* Vertical line */}
                                    <div className="absolute left-8 md:left-14 top-0 bottom-0 w-px bg-gradient-to-b from-brand-gold/60 via-brand-gold/20 to-transparent hidden md:block" />

                                    <div className="space-y-8">
                                        {signatureItinerary.map((day: any, idx: number) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: -20 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.08, duration: 0.5 }}
                                                viewport={{ once: true }}
                                                className="flex gap-6 md:gap-12 group"
                                            >
                                                {/* Day Badge */}
                                                <div className="flex-shrink-0 flex flex-col items-center">
                                                    <div className={`relative z-10 w-16 h-16 md:w-28 md:h-28 rounded-full flex flex-col items-center justify-center border-2 shadow-lg transition-all duration-500 group-hover:scale-110 ${idx === signatureItinerary.length - 1
                                                        ? "bg-logo-blue border-logo-blue text-white"
                                                        : "bg-white border-brand-gold/40 text-logo-blue group-hover:border-brand-gold"
                                                        }`}>
                                                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-0.5">{tVip.signature.day}</span>
                                                        <span className="text-2xl md:text-4xl font-serif leading-none">{day.day}</span>
                                                    </div>
                                                </div>

                                                {/* Content Card */}
                                                <div className="flex-1 pb-8">
                                                    <div className="bg-white border border-neutral-100 rounded-[2rem] p-8 md:p-10 shadow-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-500">
                                                        {/* Header */}
                                                        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Map size={13} className="text-brand-gold" />
                                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold">{day.location}</span>
                                                                </div>
                                                                <h3 className="text-2xl md:text-3xl font-serif text-logo-blue tracking-tight">{day.title}</h3>
                                                            </div>
                                                            <div className="w-12 h-12 rounded-2xl bg-logo-blue/5 border border-logo-blue/10 flex items-center justify-center text-logo-blue flex-shrink-0">
                                                                <day.icon size={22} strokeWidth={1.5} />
                                                            </div>
                                                        </div>

                                                        <p className="text-neutral-600 text-sm leading-relaxed mb-8 italic">{day.experience}</p>

                                                        {/* Highlights */}
                                                        <div className="mb-6">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-4">{tVip.signature.highlights}</p>
                                                            <ul className="grid sm:grid-cols-2 gap-2.5">
                                                                {day.highlights.map((h: any, i: number) => (
                                                                    <li key={i} className="flex items-start gap-3">
                                                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0" />
                                                                        <span className="text-sm text-neutral-600 font-medium leading-snug">{h}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        {/* Footer row: Stay + Optional */}
                                                        <div className="flex flex-wrap gap-4 pt-6 border-t border-neutral-50">
                                                            {day.stay && (
                                                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-logo-blue/5 border border-logo-blue/10">
                                                                    <ShieldCheck size={12} className="text-logo-blue" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-logo-blue">{tVip.signature.stay}: {day.stay}</span>
                                                                </div>
                                                            )}
                                                            {day.optional && day.optional.map((opt: any, i: number) => (
                                                                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-50 border border-neutral-100">
                                                                    <Star size={11} className="text-brand-gold" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{opt}</span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {day.note && (
                                                            <p className="mt-5 text-xs text-brand-gold font-black uppercase tracking-widest italic">{day.note}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Estimate Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="mt-16 bg-neutral-900 rounded-[2.5rem] p-10 md:p-14 text-center relative overflow-hidden"
                                >
                                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-gold/20 rounded-full blur-[100px] pointer-events-none" />
                                    <div className="relative z-10">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/20 border border-brand-gold/30 text-brand-gold text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                                            <Crown size={12} /> {tVip.signature.estimate.badge}
                                        </div>
                                        <div className="text-5xl md:text-7xl font-serif text-white mb-4">{tVip.signature.estimate.price}</div>
                                        <p className="text-neutral-400 text-sm font-bold uppercase tracking-widest mb-10">{tVip.signature.estimate.sub}</p>
                                        <div className="grid sm:grid-cols-3 gap-6 text-left mb-10">
                                            {tVip.signature.estimate.cols.map((col: any, i: number) => (
                                                <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold mb-4">{col.label}</p>
                                                    <ul className="space-y-2">
                                                        {col.items.map((item: any, j: number) => (
                                                            <li key={j} className="flex items-center gap-2 text-neutral-300 text-sm">
                                                                <div className="w-1 h-1 rounded-full bg-brand-gold flex-shrink-0" />
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-6 py-32 md:px-12">
                <div className="grid lg:grid-cols-2 gap-32 items-start">
                    {/* Left: Philosophy & Breakdown */}
                    <div className="space-y-20">
                        <div className="space-y-8 w-full min-w-0">
                            <div className="inline-flex max-w-full items-center flex-wrap justify-center text-center gap-2 px-4 py-2 rounded-full bg-logo-blue/5 border border-logo-blue/10 text-logo-blue text-[10px] font-black uppercase tracking-[0.3em]">
                                <Shield size={14} className="shrink-0" /> <span className="break-words min-w-0">{tVip.philosophy.badge}</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-serif text-logo-blue tracking-tight break-words">{tVip.philosophy.title}</h2>
                            <p className="text-neutral-600 text-xl leading-relaxed font-medium break-words">
                                {tVip.philosophy.desc}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 w-full">
                                {tVip.philosophy.grid.map((item: any, i: number) => (
                                    <div key={i} className="flex gap-4 items-start p-6 bg-neutral-50 rounded-2xl border border-neutral-100 min-w-0 w-full break-words">
                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-sm font-black text-logo-blue uppercase tracking-widest mb-1 break-words">{item.title}</h4>
                                            <p className="text-xs text-neutral-500 leading-relaxed break-words">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-10">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
                                <h3 className="text-2xl font-serif text-logo-blue">{tVip.breakdown.title}</h3>
                                <button
                                    onClick={() => setShowBreakdown(!showBreakdown)}
                                    className="text-[11px] font-black uppercase tracking-widest text-neutral-400 hover:text-logo-blue transition-colors flex items-center gap-2"
                                >
                                    {showBreakdown ? tVip.breakdown.btn_hide : tVip.breakdown.btn_show}
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
                                            {tVip.breakdown.items.map((item: any, i: number) => (
                                                <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-5 border-b border-neutral-50 hover:bg-neutral-50 transition-colors px-4 sm:px-6 rounded-2xl">
                                                    <span className="text-neutral-500 font-bold tracking-wide uppercase text-xs">{item.label}</span>
                                                    <span className="text-logo-blue font-serif text-2xl tracking-widest self-start sm:self-auto">${Object.values(pricing.breakdown)[i].toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-12 w-full">
                            <div className="space-y-4 min-w-0">
                                <div className="p-6 md:p-8 bg-neutral-900 rounded-[2.5rem] border border-logo-blue/20 shadow-2xl relative overflow-hidden group w-full break-words">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Lock size={80} className="text-white" />
                                    </div>
                                    <Users size={40} className="text-brand-gold mb-6" />
                                    <h4 className="font-serif text-2xl text-white mb-2 break-words">{tVip.philosophy.seclusion.title}</h4>
                                    <p className="text-sm text-neutral-400 leading-relaxed font-medium break-words">{tVip.philosophy.seclusion.desc}</p>
                                </div>
                            </div>
                            <div className="space-y-4 sm:pt-16 min-w-0">
                                <div className="p-6 md:p-8 bg-neutral-50 rounded-[2.5rem] border border-neutral-100 hover:border-logo-blue/20 transition-colors w-full break-words">
                                    <Sparkles size={40} className="text-logo-blue mb-6" />
                                    <h4 className="font-serif text-2xl text-neutral-900 mb-2 break-words">{tVip.philosophy.access.title}</h4>
                                    <p className="text-sm text-neutral-500 leading-relaxed font-medium break-words">{tVip.philosophy.access.desc}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Inclusions & Quote */}
                    <div className="space-y-12 lg:sticky lg:top-32">
                        <div className="bg-white border border-neutral-100 rounded-[3rem] p-8 md:p-12 space-y-16 shadow-xl">
                            {inclusions.map((section: any, idx: number) => (
                                <div key={idx} className="space-y-8">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-logo-blue/5 rounded-2xl border border-logo-blue/10">
                                            <section.icon size={28} className="text-logo-blue" />
                                        </div>
                                        <h3 className="text-2xl font-serif text-neutral-900 tracking-tight">{section.category}</h3>
                                    </div>
                                    <ul className="grid gap-5">
                                        {section.items.map((item: any, i: number) => (
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
                                    {tVip.cta.btn}
                                </Link>

                                <p className="mt-8 text-[11px] uppercase font-bold tracking-[0.3em] text-neutral-400">
                                    {tVip.cta.sub}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </motion.div>
    );
}
