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
    Car,
    Clock,
    Heart,
    Crown,
    Shield,
    Coffee,
    Hotel,
    Waves,
    Compass,
    Camera,
    Map
} from "lucide-react";
import Link from "next/link";

export default function PremiumPlan() {
    const t = useTranslation();
    const tPrem = t.packages.premium;
    const [showBreakdown, setShowBreakdown] = useState(false);
    const nights = 7;
    const travelers = 2;

    const nightRatePerPerson = 350; // Flagship Premium rate
    const total = nightRatePerPerson * nights * travelers;

    const baseTotal = total / 1.18;
    const vat = total - baseTotal;

    const accommodation = 140 * nights * travelers;
    const transport = 30 * (nights + 1) * travelers;
    const meals = 35 * nights * travelers;
    const logistics = baseTotal - (accommodation + transport + meals);

    const pricing = {
        total: total,
        perNight: nightRatePerPerson,
        breakdown: {
            accommodation,
            transport,
            meals,
            logistics,
            vat
        }
    };

    const itinerary = [
        { icon: Sparkles },
        { icon: Car },
        { icon: Hotel },
        { icon: Coffee },
        { icon: Camera },
        { icon: Clock }
    ];

    const inclusions = [
        { icon: Hotel },
        { icon: Car },
        { icon: Coffee }
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-neutral-200 text-neutral-900"
        >
            {/* World-Class Header */}
            <div className="relative min-h-[850px] md:min-h-[700px] flex flex-col justify-center overflow-hidden py-20 md:py-10">
                <div className="absolute inset-0 bg-[url('/images/plans/premium_sri_lanka.avif')] bg-cover bg-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-black/10" />

                <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 md:px-10">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-3 px-6 py-2 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] via-[#B38728] via-[#FBF5B7] to-[#AA771C] rounded-full border border-[#D4AF37]/50 backdrop-blur-md mb-8 shadow-[0_15px_40px_-10px_rgba(184,134,11,0.3)] relative overflow-hidden group"
                    >
                        <motion.div
                            animate={{ x: ['-150%', '300%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none"
                        />
                        <Gem size={20} className="text-white relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                        <span className="text-white text-xs font-black uppercase tracking-[0.4em] relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{tPrem.badge}</span>
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-7xl md:text-9xl font-serif text-logo-blue mb-6 tracking-tight drop-shadow-sm"
                    >
                        {tPrem.title}
                    </motion.h1>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-neutral-800 max-w-2xl text-xl font-medium leading-relaxed mb-12"
                    >
                        {tPrem.desc_1}<br />
                        {tPrem.desc_2}
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
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-black mb-3">{tPrem.quote.sig}</p>
                                    <div className="text-[10px] uppercase tracking-widest text-logo-blue font-bold mb-1">Starting From</div>
                                    <div className="text-6xl font-serif text-logo-blue tracking-widest leading-none">
                                        ${total.toLocaleString()}
                                    </div>
                                    <p className="text-neutral-500 text-xs mt-4 font-bold uppercase tracking-widest">
                                        {tPrem.quote.sig_det}
                                    </p>
                                </div>
                                <div className="h-24 w-px bg-neutral-100 hidden md:block" />
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-brand-gold font-black mb-3">{tPrem.quote.daily}</p>
                                    <div className="text-[10px] uppercase tracking-widest text-logo-blue font-bold mb-1">Starting From</div>
                                    <div className="text-4xl font-serif text-logo-blue leading-none">
                                        ${nightRatePerPerson.toLocaleString()}
                                    </div>
                                    <p className="text-neutral-500 text-xs mt-4 font-bold uppercase tracking-widest">
                                        {tPrem.quote.daily_det}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Experience Roadmap - The Emerald Route */}
            <div className="bg-neutral-50 border-y border-neutral-100 py-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="text-center mb-32">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[10px] font-black uppercase tracking-[0.3em] mb-6"
                        >
                            <Sparkles size={14} /> {tPrem.emerald.badge}
                        </motion.div>
                        <h2 className="text-5xl md:text-7xl font-serif text-logo-blue mb-8 tracking-tight">{tPrem.emerald.title}</h2>
                        <p className="text-neutral-500 max-w-2xl mx-auto text-lg leading-relaxed">
                            {tPrem.emerald.desc}
                        </p>
                    </div>

                    <div className="relative">
                        {/* Connecting Path Line (Desktop) */}
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
                                            {tPrem.emerald.phase} 0{idx + 1}
                                        </div>

                                        <h3 className="text-2xl font-serif text-neutral-900 mb-4 tracking-tight group-hover:text-logo-blue transition-colors">{tPrem.emerald.itinerary[idx].title}</h3>
                                        <p className="text-neutral-500 text-sm leading-relaxed mb-8 min-h-[7rem] group-hover:text-neutral-700 transition-colors">
                                            {tPrem.emerald.itinerary[idx].description}
                                        </p>

                                        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-neutral-50 border border-neutral-100 group-hover:bg-logo-blue/5 group-hover:border-logo-blue/10 transition-all">
                                            <Check size={14} className="text-brand-gold" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-logo-blue transition-colors">{tPrem.emerald.itinerary[idx].details}</span>
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
                                <Star size={14} /> {tPrem.philosophy.badge}
                            </div>
                            <h2 className="text-4xl md:text-5xl font-serif text-logo-blue tracking-tight break-words">{tPrem.philosophy.title}</h2>
                            <p className="text-neutral-600 text-xl leading-relaxed font-medium">
                                {tPrem.philosophy.desc}
                            </p>
                        </div>

                        <div className="space-y-10">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
                                <h3 className="text-2xl font-serif text-logo-blue">{tPrem.breakdown.title}</h3>
                                <button
                                    onClick={() => setShowBreakdown(!showBreakdown)}
                                    className="text-[11px] font-black uppercase tracking-widest text-neutral-400 hover:text-logo-blue transition-colors flex items-center gap-2"
                                >
                                    {showBreakdown ? tPrem.breakdown.btn_hide : tPrem.breakdown.btn_show}
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
                                                { label: tPrem.breakdown.items[0].label, value: pricing.breakdown.accommodation },
                                                { label: tPrem.breakdown.items[1].label, value: pricing.breakdown.transport },
                                                { label: tPrem.breakdown.items[2].label, value: pricing.breakdown.meals },
                                                { label: tPrem.breakdown.items[3].label, value: pricing.breakdown.logistics },
                                                { label: tPrem.breakdown.items[4].label, value: Math.round(total * 0.18) },
                                            ].map((item, i) => (
                                                <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-5 border-b border-neutral-50 hover:bg-neutral-50 transition-colors px-4 sm:px-6 rounded-2xl">
                                                    <span className="text-neutral-500 font-bold tracking-wide uppercase text-xs">{item.label}</span>
                                                    <span className="text-logo-blue font-serif text-2xl tracking-widest self-start sm:self-auto">${item.value.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {tPrem.transparency && (
                            <div className="bg-logo-blue/5 border border-logo-blue/10 p-6 md:p-8 rounded-3xl mt-12 overflow-hidden break-words">
                                <h4 className="font-serif text-2xl text-logo-blue mb-3">{tPrem.transparency.title}</h4>
                                <p className="text-sm text-neutral-600 leading-relaxed mb-6">
                                    {tPrem.transparency.desc_estimate}
                                </p>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {tPrem.transparency.factors.map((factor: any, idx: number) => (
                                        <div key={idx} className="bg-white p-4 rounded-2xl border border-logo-blue/5">
                                            <h5 className="text-[11px] font-black uppercase text-logo-blue mb-1 tracking-widest">{factor.title}</h5>
                                            <p className="text-xs text-neutral-500">{factor.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-12 pt-8">
                            <div className="space-y-4">
                                <div className="p-8 bg-neutral-900 rounded-[2.5rem] border border-logo-blue/20 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <ShieldCheck size={80} className="text-white" />
                                    </div>
                                    <Clock size={40} className="text-brand-gold mb-6" />
                                    <h4 className="font-serif text-2xl text-white mb-2">{tPrem.philosophy.comfort.title}</h4>
                                    <p className="text-sm text-neutral-400 leading-relaxed font-medium">{tPrem.philosophy.comfort.desc}</p>
                                </div>
                            </div>
                            <div className="space-y-4 sm:pt-16">
                                <div className="p-8 bg-neutral-50 rounded-[2.5rem] border border-neutral-100 hover:border-logo-blue/20 transition-colors">
                                    <Camera size={40} className="text-logo-blue mb-6" />
                                    <h4 className="font-serif text-2xl text-neutral-900 mb-2">{tPrem.philosophy.connection.title}</h4>
                                    <p className="text-sm text-neutral-500 leading-relaxed font-medium">{tPrem.philosophy.connection.desc}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Inclusions & Quote */}
                    <div className="space-y-12 lg:sticky lg:top-32">
                        <div className="bg-white border border-neutral-100 rounded-[3rem] p-12 space-y-16 shadow-xl">
                            {inclusions.map((section: any, idx: number) => {
                                const incObj = tPrem.inclusions[idx];
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
                                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0 shadow-[0_0_8px_rgba(196,181,92,0.4)]" />
                                                    <span className="text-sm font-bold text-neutral-600 leading-relaxed">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}

                            <div className="pt-12 border-t border-neutral-100 flex flex-col items-center">
                                <Link
                                    href={`/contact?plan=premium&nights=${nights}&travelers=${travelers}`}
                                    className="w-full bg-logo-blue hover:bg-logo-blue/90 text-white py-6 rounded-3xl font-black uppercase tracking-[0.25em] text-sm transition-all shadow-2xl shadow-logo-blue/20 active:scale-[0.98] block text-center"
                                >
                                    {tPrem.cta.btn}
                                </Link>

                                <p className="mt-8 text-[11px] uppercase font-bold tracking-[0.3em] text-neutral-400">
                                    {tPrem.cta.sub}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </motion.div>
    );
}
