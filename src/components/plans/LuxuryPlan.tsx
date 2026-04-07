"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "@/components/I18nProvider";
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
    Compass,
    Map,
    Train,
    Sunrise
} from "lucide-react";
import Link from "next/link";

export default function LuxuryPlan() {
    const t = useTranslation();
    const tLux = t.packages.luxury;
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [activeJourney, setActiveJourney] = useState<"epicurean" | "signature">("epicurean");
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
        { icon: Sparkles },
        { icon: Car },
        { icon: Hotel },
        { icon: Coffee },
        { icon: Compass },
        { icon: Waves }
    ];

    const sapphireSignatureItinerary = [
        { icon: Plane },
        { icon: Car },
        { icon: Sunrise },
        { icon: Compass },
        { icon: Train },
        { icon: Waves },
        { icon: Map }
    ];

    const inclusions = [
        { icon: Crown },
        { icon: Car },
        { icon: Gem },
        { icon: Heart }
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
                    className="absolute inset-0 bg-[url('/images/plans/luxury_sri_lanka.avif')] bg-cover"
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
                        {tLux.title}
                    </motion.h1>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-neutral-800 max-w-2xl text-xl font-medium leading-relaxed mb-12"
                    >
                        {tLux.desc_1}<br />
                        {tLux.desc_2}
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
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-black mb-3">{tLux.quote.sig}</p>
                                    <div className="text-6xl font-serif text-logo-blue tracking-widest leading-none">
                                        ${total.toLocaleString()}
                                    </div>
                                    <p className="text-neutral-500 text-xs mt-4 font-bold uppercase tracking-widest">
                                        {tLux.quote.sig_det}
                                    </p>
                                </div>
                                <div className="h-24 w-px bg-neutral-100 hidden md:block" />
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-brand-gold font-black mb-3">{tLux.quote.daily}</p>
                                    <div className="text-4xl font-serif text-logo-blue leading-none">
                                        ${nightRatePerPerson.toLocaleString()}
                                    </div>
                                    <p className="text-neutral-500 text-xs mt-4 font-bold uppercase tracking-widest">
                                        {tLux.quote.daily_det}
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
                        <h2 className="text-5xl md:text-7xl font-serif text-logo-blue mb-6 tracking-tight">Our Luxury Journeys</h2>
                        <p className="text-neutral-500 max-w-2xl mx-auto text-lg leading-relaxed">
                            Two distinct ways to experience Sri Lanka in style. Both at home in the Luxury Collection.
                        </p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex justify-center mb-20">
                        <div className="flex bg-white border border-neutral-200 rounded-full p-1.5 shadow-sm gap-1">
                            <button
                                onClick={() => setActiveJourney("epicurean")}
                                className={`flex items-center gap-2.5 px-7 py-3 rounded-full text-xs font-black uppercase tracking-[0.25em] transition-all duration-300 ${activeJourney === "epicurean"
                                    ? "bg-logo-blue text-white shadow-lg shadow-logo-blue/20"
                                    : "text-neutral-400 hover:text-logo-blue"
                                    }`}
                            >
                                <Gem size={14} /> The Epicurean Journey
                            </button>
                            <button
                                onClick={() => setActiveJourney("signature")}
                                className={`flex items-center gap-2.5 px-7 py-3 rounded-full text-xs font-black uppercase tracking-[0.25em] transition-all duration-300 ${activeJourney === "signature"
                                    ? "bg-logo-blue text-white shadow-lg shadow-logo-blue/20"
                                    : "text-neutral-400 hover:text-logo-blue"
                                    }`}
                            >
                                <Star size={14} /> Sapphire Signature Journey
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {/* Epicurean Journey Tab — unchanged Sapphire Route */}
                        {activeJourney === "epicurean" && (
                            <motion.div
                                key="epicurean"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                            >
                                <p className="text-center text-neutral-500 max-w-2xl mx-auto text-base leading-relaxed mb-20">
                                    {tLux.epicurean.desc}
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
                                                        {tLux.epicurean.phase} 0{idx + 1}
                                                    </div>
                                                    <h3 className="text-2xl font-serif text-neutral-900 mb-4 tracking-tight group-hover:text-logo-blue transition-colors">{tLux.epicurean.itinerary[idx].title}</h3>
                                                    <p className="text-neutral-500 text-sm leading-relaxed mb-8 min-h-[7rem] group-hover:text-neutral-700 transition-colors">
                                                        {tLux.epicurean.itinerary[idx].description}
                                                    </p>
                                                    <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-neutral-50 border border-neutral-100 group-hover:bg-logo-blue/5 group-hover:border-logo-blue/10 transition-all">
                                                        <Check size={14} className="text-brand-gold" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-logo-blue transition-colors">{tLux.epicurean.itinerary[idx].details}</span>
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

                        {/* Sapphire Signature Journey Tab */}
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
                                    {tLux.signature.desc}
                                </p>

                                {/* Day-by-Day Timeline */}
                                <div className="relative">
                                    <div className="absolute left-8 md:left-14 top-0 bottom-0 w-px bg-gradient-to-b from-brand-gold/60 via-brand-gold/20 to-transparent hidden md:block" />
                                    <div className="space-y-8">
                                        {sapphireSignatureItinerary.map((day: any, idx: number) => {
                                            const sigObj = tLux.signature.itinerary[idx];
                                            return (
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
                                                        <div className={`relative z-10 w-16 h-16 md:w-28 md:h-28 rounded-full flex flex-col items-center justify-center border-2 shadow-lg transition-all duration-500 group-hover:scale-110 ${idx === sapphireSignatureItinerary.length - 1
                                                            ? "bg-logo-blue border-logo-blue text-white"
                                                            : "bg-white border-brand-gold/40 text-logo-blue group-hover:border-brand-gold"
                                                            }`}>
                                                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-0.5">{tLux.signature.day}</span>
                                                            <span className="text-2xl md:text-4xl font-serif leading-none">{idx + 1}</span>
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
                                                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold">{sigObj.location}</span>
                                                                    </div>
                                                                    <h3 className="text-2xl md:text-3xl font-serif text-logo-blue tracking-tight">{sigObj.title}</h3>
                                                                </div>
                                                                <div className="w-12 h-12 rounded-2xl bg-logo-blue/5 border border-logo-blue/10 flex items-center justify-center text-logo-blue flex-shrink-0">
                                                                    <day.icon size={22} strokeWidth={1.5} />
                                                                </div>
                                                            </div>

                                                            <p className="text-neutral-600 text-sm leading-relaxed mb-8 italic">{sigObj.experience}</p>

                                                            {/* Highlights */}
                                                            <div className="mb-6">
                                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-4">{tLux.signature.highlights}</p>
                                                                <ul className="grid sm:grid-cols-2 gap-2.5">
                                                                    {sigObj.highlights.map((h: any, i: number) => (
                                                                        <li key={i} className="flex items-start gap-3">
                                                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0" />
                                                                            <span className="text-sm text-neutral-600 font-medium leading-snug">{h}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>

                                                            {/* Stay + Optional pills */}
                                                            <div className="flex flex-wrap gap-3 pt-6 border-t border-neutral-50">
                                                                {sigObj.stay && (
                                                                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-logo-blue/5 border border-logo-blue/10">
                                                                        <ShieldCheck size={12} className="text-logo-blue" />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-logo-blue">{tLux.signature.stay}: {sigObj.stay}</span>
                                                                    </div>
                                                                )}
                                                                {sigObj.optional && sigObj.optional.map((opt: any, i: number) => (
                                                                    <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-50 border border-neutral-100">
                                                                        <Star size={11} className="text-brand-gold" />
                                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{opt}</span>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {sigObj.note && (
                                                                <p className="mt-5 text-xs text-brand-gold font-black uppercase tracking-widest italic">{sigObj.note}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
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
                                            <Gem size={12} /> {tLux.signature.estimate.badge}
                                        </div>
                                        <div className="text-5xl md:text-7xl font-serif text-white mb-4">{tLux.signature.estimate.price}</div>
                                        <p className="text-neutral-400 text-sm font-bold uppercase tracking-widest mb-2">{tLux.signature.estimate.sub}</p>
                                        <p className="text-brand-gold text-xs font-black uppercase tracking-widest mb-10">{tLux.signature.estimate.min}</p>
                                        <div className="grid sm:grid-cols-3 gap-6 text-left">
                                            {tLux.signature.estimate.cols.map((col: any, i: number) => (
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
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-logo-blue/5 border border-logo-blue/10 text-logo-blue text-[10px] font-black uppercase tracking-[0.3em]">
                                <ShieldCheck size={14} /> {tLux.philosophy.badge}
                            </div>
                            <h2 className="text-5xl font-serif text-logo-blue tracking-tight">{tLux.philosophy.title}</h2>
                            <p className="text-neutral-600 text-xl leading-relaxed font-medium">
                                {tLux.philosophy.desc}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                {tLux.philosophy.grid.map((item: any, i: number) => (
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
                                <h3 className="text-2xl font-serif text-logo-blue">{tLux.breakdown.title}</h3>
                                <button
                                    onClick={() => setShowBreakdown(!showBreakdown)}
                                    className="text-[11px] font-black uppercase tracking-widest text-neutral-400 hover:text-logo-blue transition-colors flex items-center gap-2"
                                >
                                    {showBreakdown ? tLux.breakdown.btn_hide : tLux.breakdown.btn_show}
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
                                                { label: tLux.breakdown.items[0].label, value: pricing.breakdown.accommodation },
                                                { label: tLux.breakdown.items[1].label, value: pricing.breakdown.transport },
                                                { label: tLux.breakdown.items[2].label, value: pricing.breakdown.meals },
                                                { label: tLux.breakdown.items[3].label, value: pricing.breakdown.wellness },
                                                { label: tLux.breakdown.items[4].label, value: pricing.breakdown.experiences },
                                                { label: tLux.breakdown.items[5].label, value: pricing.breakdown.logistics },
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
                                    <h4 className="font-serif text-2xl text-white mb-2">{tLux.philosophy.seclusion.title}</h4>
                                    <p className="text-sm text-neutral-400 leading-relaxed font-medium">{tLux.philosophy.seclusion.desc}</p>
                                </div>
                            </div>
                            <div className="space-y-4 pt-16">
                                <div className="p-8 bg-neutral-50 rounded-[2.5rem] border border-neutral-100 hover:border-logo-blue/20 transition-colors">
                                    <Compass size={40} className="text-logo-blue mb-6" />
                                    <h4 className="font-serif text-2xl text-neutral-900 mb-2">{tLux.philosophy.access.title}</h4>
                                    <p className="text-sm text-neutral-500 leading-relaxed font-medium">{tLux.philosophy.access.desc}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Inclusions & Quote */}
                    <div className="space-y-12 lg:sticky lg:top-32">
                        <div className="bg-white border border-neutral-100 rounded-[3rem] p-12 space-y-16 shadow-xl">
                            {inclusions.map((section: any, idx: number) => {
                                const incObj = tLux.inclusions[idx];
                                return (
                                    <div key={idx} className="space-y-8">
                                        <div className="flex items-center gap-6">
                                            <div className="p-4 bg-logo-blue/5 rounded-2xl border border-logo-blue/10">
                                                <section.icon size={28} className="text-logo-blue" />
                                            </div>
                                            <h3 className="text-2xl font-serif text-neutral-900 tracking-tight">{incObj.category}</h3>
                                        </div>
                                        <ul className="grid gap-5">
                                            {incObj.items.map((item: any, i: number) => (
                                                <li key={i} className="flex items-start gap-4">
                                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0 shadow-[0_0_8px_rgba(196,181,92,0.5)]" />
                                                    <span className="text-sm font-bold text-neutral-600 leading-relaxed">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}

                            <div className="pt-12 border-t border-neutral-100 flex flex-col items-center">
                                <Link
                                    href={`/contact?plan=luxury&nights=${nights}&travelers=${travelers}`}
                                    className="w-full bg-logo-blue hover:bg-logo-blue/90 text-white py-6 rounded-3xl font-black uppercase tracking-[0.25em] text-sm transition-all shadow-2xl shadow-logo-blue/20 active:scale-[0.98] block text-center"
                                >
                                    {tLux.cta.btn}
                                </Link>

                                <p className="mt-8 text-[11px] uppercase font-bold tracking-[0.3em] text-neutral-400">
                                    {tLux.cta.sub}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </motion.div>
    );
}
