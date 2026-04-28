"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "@/components/I18nProvider";
import {
    ArrowRight,
    Check,
    Info,
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
    Gem,
    Star
} from "lucide-react";
import Link from "next/link";

export default function LuxuryPlan() {
    const t = useTranslation();
    const tLux = t.packages.luxury;
    const [showBreakdown, setShowBreakdown] = useState(false);
    const nights = 7;
    const travelers = 2;

    const nightRatePerPerson = 650; // Flagship target rate per day per head
    const days = nights + 1; // 8 days for transport, guides, etc.

    // 150$ per head per day (night) - Signature Resorts
    const accommodation = 150 * nights * travelers;
    // 150$ per day total vehicle rate - Premium SUV with Fuel and driver
    const transport = 150 * days;
    // 25$ per head per day - Curated Fine Dining
    const meals = 25 * days * travelers;
    // 100$ per day per head - Daily Wellness & Access
    const wellness = 100 * nights * travelers;
    // 40$ per day for the group - elite guides and access
    const experiences = 40 * days;

    // Subtotal before tax and markup
    const baseCost = accommodation + transport + meals + wellness + experiences;

    // Fixed round logistics parameter as requested
    const logistics = 500;

    // Bottom-Up Build Sequence
    const totalCosts = baseCost + logistics;

    const markupPct = "20";
    const markup = Math.round(totalCosts * 0.20);

    const subtotal = totalCosts + markup;
    const vat = Math.round(subtotal * 0.18);

    const total = subtotal + vat;

    const pricing = {
        total: total,
        perNight: nightRatePerPerson,
        breakdown: {
            accommodation,
            transport,
            meals,
            wellness,
            experiences,
            logistics,
            vat,
            markup,
            markupPct
        }
    };

    const itinerary = [
        { icon: Sparkles },
        { icon: Car },
        { icon: Hotel },
        { icon: Compass },
        { icon: Heart },
        { icon: Waves }
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
            <div className="relative min-h-[850px] md:min-h-[700px] flex flex-col justify-center overflow-hidden py-20 md:py-10">
                <div
                    className="absolute inset-0 bg-[url('/images/plans/luxury_sri_lanka.avif')] bg-cover"
                    style={{ backgroundPosition: 'center -150px' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-black/10" />

                <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 md:px-10">
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
                                    <div className="text-[10px] uppercase tracking-widest text-logo-blue font-bold mb-1">Starting From</div>
                                    <div className="text-6xl font-serif text-logo-blue tracking-widest leading-none">
                                        ${total.toLocaleString()}
                                    </div>
                                    <p className="text-neutral-500 text-xs mt-4 font-bold uppercase tracking-widest">
                                        {tLux.quote.sig_det} • {nights} Nights, {days} Days
                                    </p>
                                </div>
                                <div className="h-24 w-px bg-neutral-100 hidden md:block" />
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-brand-gold font-black mb-3">{tLux.quote.daily}</p>
                                    <div className="text-[10px] uppercase tracking-widest text-logo-blue font-bold mb-1">Starting From</div>
                                    <div className="text-4xl font-serif text-logo-blue leading-none">
                                        ${nightRatePerPerson.toLocaleString()}
                                    </div>
                                    <p className="text-neutral-500 text-xs mt-4 font-bold uppercase tracking-widest">
                                        {tLux.quote.daily_det} • Based on {days} Days
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Curated Samples Section */}
            {tLux.samples && (
                <div className="bg-white py-32 px-6 md:px-12 border-t border-neutral-100">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-20">
                            <h2 className="text-4xl md:text-6xl font-serif text-logo-blue mb-6">{tLux.samples.title}</h2>
                            <p className="text-neutral-500 max-w-2xl mx-auto text-lg leading-relaxed">
                                {tLux.samples.desc}
                            </p>
                        </div>
                        <div className="grid lg:grid-cols-3 gap-8">
                            {tLux.samples.items.map((sample: any, idx: number) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    viewport={{ once: true }}
                                    className="bg-neutral-50 rounded-3xl p-10 border border-neutral-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col"
                                >
                                    <div className="text-[10px] uppercase tracking-[0.2em] font-black text-brand-gold mb-4">Sample Itinerary 0{idx + 1}</div>
                                    <h3 className="text-2xl font-serif text-logo-blue mb-4">{sample.title}</h3>
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 mb-8 pb-8 border-b border-neutral-200">
                                        <Clock size={14} className="text-brand-gold" /> {sample.duration}
                                    </div>
                                    <div className="mb-8 flex-grow">
                                        <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Highlights</div>
                                        <p className="text-sm text-neutral-600 leading-relaxed font-medium">{sample.highlights}</p>
                                    </div>
                                    <div className="flex items-end justify-between mt-auto pt-8 border-t border-neutral-200">
                                        <div>
                                            <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1">Per Person</div>
                                            <div className="text-2xl font-serif text-logo-blue">{sample.price_per_day} <span className="text-sm font-sans font-medium text-neutral-500">/ day</span></div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-1">{sample.total_price}</div>
                                        </div>
                                        <Link href={sample.link} className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-logo-blue group-hover:bg-logo-blue group-hover:text-white group-hover:border-logo-blue transition-all">
                                            <ArrowRight size={18} />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Experience Roadmap - The Sapphire Route */}
            <div className="bg-neutral-50 border-y border-neutral-100 py-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="text-center mb-32">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[10px] font-black uppercase tracking-[0.3em] mb-6"
                        >
                            <Sparkles size={14} /> {tLux.epicurean.badge}
                        </motion.div>
                        <h2 className="text-5xl md:text-7xl font-serif text-logo-blue mb-8 tracking-tight">{tLux.epicurean.title}</h2>
                        <p className="text-neutral-500 max-w-2xl mx-auto text-lg leading-relaxed">
                            {tLux.epicurean.desc}
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
                                <ShieldCheck size={14} /> {tLux.philosophy.badge}
                            </div>
                            <h2 className="text-4xl md:text-5xl font-serif text-logo-blue tracking-tight break-words">{tLux.philosophy.title}</h2>
                            <p className="text-neutral-600 text-xl leading-relaxed font-medium">
                                {tLux.philosophy.desc}
                            </p>
                        </div>

                        <div className="space-y-10">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
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
                                                { label: `${tLux.math_labels?.accommodation || "Signature Resorts & Hotels"} ($150 × ${travelers} × ${nights} ${tLux.math_labels?.nights || "Nights"})`, value: pricing.breakdown.accommodation },
                                                { label: `${tLux.math_labels?.transport || "Premium SUV, Fuel & Driver"} ($150 × ${days} ${tLux.math_labels?.days || "Days"})`, value: pricing.breakdown.transport },
                                                { label: `${tLux.math_labels?.meals || "Curated Fine Dining"} ($25 × ${travelers} × ${days} ${tLux.math_labels?.days || "Days"})`, value: pricing.breakdown.meals },
                                                { label: `${tLux.math_labels?.wellness || "Daily Wellness & Access"} ($100 × ${travelers} × ${nights} ${tLux.math_labels?.nights || "Nights"})`, value: pricing.breakdown.wellness },
                                                { label: `${tLux.math_labels?.experiences || "Elite Guides & Access"} ($40 × ${days} ${tLux.math_labels?.days || "Days"})`, value: pricing.breakdown.experiences },
                                                { label: tLux.math_labels?.logistics || "Invisible Concierge & Precision Logistics", value: pricing.breakdown.logistics },
                                                { label: `${tLux.math_labels?.agency || "Agency Planning & Service Fee"} (${pricing.breakdown.markupPct}%)`, value: pricing.breakdown.markup },
                                                { label: tLux.math_labels?.vat || "Government Tax (18% VAT)", value: pricing.breakdown.vat },
                                                { label: tLux.math_labels?.total || "Estimated Grand Total", value: pricing.total },
                                            ].map((item, i) => (
                                                <div key={i} className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-5 border-neutral-50 px-4 sm:px-6 rounded-2xl ${i === 8 ? 'bg-logo-blue/5 border-t-2 border-logo-blue/20' : 'border-b hover:bg-neutral-50 transition-colors'}`}>
                                                    <span className={`tracking-wide uppercase text-xs sm:pr-4 ${i === 8 ? 'text-logo-blue font-black' : 'text-neutral-500'}`}>
                                                        {item.label.includes('(') ? (
                                                            <>
                                                                <span className={i !== 8 ? 'font-bold' : ''}>{item.label.split('(')[0]}</span>
                                                                <span className="font-normal opacity-75 normal-case tracking-normal text-[10px] sm:text-[11px] inline-block sm:ml-1 whitespace-pre-line mt-1 sm:mt-0">({item.label.split('(').slice(1).join('(')}</span>
                                                            </>
                                                        ) : (
                                                            <span className={i !== 8 ? 'font-bold' : ''}>{item.label}</span>
                                                        )}
                                                    </span>
                                                    <span className={`font-serif tracking-widest flex-shrink-0 self-start sm:self-auto ${i === 8 ? 'text-logo-blue text-4xl font-black' : 'text-logo-blue text-2xl'}`}>${item.value.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {tLux.transparency && (
                            <div className="bg-logo-blue/5 border border-logo-blue/10 p-6 md:p-8 rounded-3xl mt-12 overflow-hidden break-words">
                                <h4 className="font-serif text-2xl text-logo-blue mb-3">{tLux.transparency.title}</h4>
                                <p className="text-sm text-neutral-600 leading-relaxed mb-6">
                                    {tLux.transparency.desc_estimate}
                                </p>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {tLux.transparency.factors.map((factor: any, idx: number) => (
                                        <div key={idx} className="bg-white p-4 rounded-2xl border border-logo-blue/5">
                                            <h5 className="text-[11px] font-black uppercase text-logo-blue mb-1 tracking-widest">{factor.title}</h5>
                                            <p className="text-xs text-neutral-500">{factor.desc}</p>
                                        </div>
                                    ))}
                                    <div className="bg-white p-4 rounded-2xl border border-logo-blue/5 sm:col-span-2">
                                        <h5 className="text-[11px] font-black uppercase text-logo-blue mb-1 tracking-widest">Active Curation Impact</h5>
                                        <p className="text-xs text-neutral-500">The final package cost is fluid and will scale either upward or downward appropriately based upon the specific volume, exclusivity, and raw entry fees of the exact activities chosen during your curation phase.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-12 pt-8">
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
                            <div className="space-y-4 sm:pt-16">
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

        </motion.div >
    );
}
