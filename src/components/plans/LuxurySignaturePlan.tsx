"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/components/I18nProvider";
import {
    Gem,
    Sparkles,
    ShieldCheck,
    Plane,
    Car,
    Sunrise,
    Compass,
    Train,
    Waves,
    Map,
    Star
} from "lucide-react";

export default function LuxurySignaturePlan() {
    const t = useTranslation();
    const tLux = t.packages.luxury;

    const sapphireSignatureItinerary = [
        { icon: Plane },
        { icon: Car },
        { icon: Sunrise },
        { icon: Compass },
        { icon: Train },
        { icon: Waves },
        { icon: Map }
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-neutral-200 text-neutral-900"
        >
            <div className="bg-neutral-50 py-24 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 md:px-12">

                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[10px] font-black uppercase tracking-[0.3em] mb-6"
                        >
                            <Sparkles size={14} /> Sapphire Signature Route
                        </motion.div>
                        <h2 className="text-5xl md:text-7xl font-serif text-logo-blue mb-6 tracking-tight">The 7-Day Signature Journey</h2>
                        <p className="text-neutral-500 max-w-2xl mx-auto text-lg leading-relaxed">
                            {tLux.signature.desc}
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto">

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

                    </div>
                </div>
            </div>
        </motion.div>
    );
}
