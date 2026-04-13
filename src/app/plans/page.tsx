"use client";

import MainLayout from "@/components/layout/MainLayout";
import { Sparkles, Crown, Gem, Check, ArrowRight, LayoutList } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "@/components/I18nProvider";

const plans = [
    {
        id: "ultra-vip",
        title: "Ultra VIP",
        priceRange: "$15,000",
        description: "The absolute pinnacle of luxury. Private jet-side clearance, 24/7 close protection, and dedicated aviation assets.",
        icon: Crown,
        href: "/plans/ultra-vip",
        badge: "The Pinnacle",
        image: "/images/plans/ultra-vip.avif",
        color: "from-neutral-950/60 via-transparent to-transparent",
        iconColor: "text-amber-400",
        textColor: "text-neutral-100",
        btnColor: "bg-amber-500 text-black hover:bg-amber-400"
    },
    {
        id: "luxury",
        title: "Luxury",
        priceRange: "$550",
        description: "5-star signature resorts, premium SUV transport, and dedicated personalized itinerary management.",
        icon: Gem,
        href: "/plans/luxury",
        badge: "Exquisite Comfort",
        image: "/images/plans/luxury.avif",
        color: "from-amber-950/60 via-transparent to-transparent",
        iconColor: "text-amber-200",
        textColor: "text-amber-50",
        btnColor: "bg-white text-amber-900 hover:bg-amber-50"
    },
    {
        id: "premium",
        title: "Premium",
        priceRange: "$290",
        description: "Reputable 3-4 star hotels, reliable sedan or van transport, and essential curated local experiences.",
        icon: Sparkles,
        href: "/plans/premium",
        badge: "Refined Style",
        image: "/images/plans/premium.avif",
        color: "from-blue-950/60 via-transparent to-transparent",
        iconColor: "text-blue-200",
        textColor: "text-blue-50",
        btnColor: "bg-white text-logo-blue hover:bg-neutral-50"
    },
    {
        id: "regular",
        title: "Regular",
        priceRange: "$50",
        description: "Authentic 3-star guesthouses, homestays, and flexible budget transport for the savvy explorer.",
        icon: Check,
        href: "/plans/regular",
        badge: "Authentic Value",
        image: "/images/plans/regular.avif",
        color: "from-green-950/60 via-transparent to-transparent",
        iconColor: "text-green-200",
        textColor: "text-green-50",
        btnColor: "bg-white text-green-900 hover:bg-green-50"
    },
    {
        id: "mixed",
        title: "Mixed Collection",
        priceRange: "Flexible",
        description: "A tailored blend of different tiers throughout your journey for the ultimate personalized experience.",
        icon: LayoutList,
        href: "/custom-plan",
        badge: "Custom Blend",
        image: "/images/plans/mixed.avif",
        color: "from-neutral-900/60 via-transparent to-transparent",
        iconColor: "text-neutral-200",
        textColor: "text-neutral-50",
        btnColor: "bg-white text-neutral-900 hover:bg-neutral-100"
    }
];

export default function PlansPage() {
    const t = useTranslation();
    return (
        <MainLayout>
            <section className="pt-32 pb-24 px-6 md:px-12 bg-neutral-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-brand-gold/10 text-brand-gold rounded-full text-xs uppercase tracking-widest font-semibold mb-4"
                        >
                            <Sparkles size={14} /> {t.packages.badge}
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-serif text-brand-green mb-4"
                        >
                            {t.packages.title}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-neutral-500 max-w-2xl mx-auto text-lg"
                        >
                            {t.packages.desc_1} {t.packages.desc_2}
                        </motion.p>
                    </div>

                    {/* Plans Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
                        {plans.map((plan, idx) => {
                            const translatedPlan = t.packages.items.find((item: any) => item.id === plan.id) || plan;

                            // Uniform 2nd-row grid (50% each) for the first 4 cards
                            // Mixed remains full width (100%)
                            const isMixed = plan.id === "mixed";
                            const colSpan = isMixed ? "md:col-span-12" : "md:col-span-6";

                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                                    whileHover={{ y: -10 }}
                                    className={`${colSpan} rounded-[2.5rem] ${isMixed ? 'min-h-[400px]' : 'min-h-[500px]'} shadow-2xl flex flex-col group relative overflow-hidden bg-neutral-900 border border-white/10`}
                                >
                                    {/* background image with zoom effect */}
                                    <div
                                        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                                        style={{ backgroundImage: `url('${plan.image}')` }}
                                    />
                                    {/* dynamic gradient overlay - adjusted for transparency */}
                                    <div className={`absolute inset-0 bg-gradient-to-t ${plan.color} opacity-60 transition-opacity duration-500 group-hover:opacity-40`} />

                                    {/* Subtle vignette for edge definition */}
                                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                                    <div className="relative z-10 flex flex-col h-full p-8 md:p-10">
                                        {/* Bookmark Ribbon */}
                                        <div className="absolute top-0 left-8 flex flex-col items-center">
                                            <motion.div
                                                initial={{ y: -100 }}
                                                whileInView={{ y: 0 }}
                                                transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.2 + idx * 0.1 }}
                                                className={`w-24 md:w-28 pb-6 rounded-b-2xl bg-white/95 backdrop-blur-xl shadow-2xl border-x border-b border-white/20 flex flex-col items-center text-center`}
                                            >
                                                <div className={`w-full p-3 rounded-b-xl mb-4 ${plan.btnColor.split(' ')[0]} flex justify-center`}>
                                                    <plan.icon size={24} />
                                                </div>
                                                <h3 className="text-sm font-black uppercase tracking-tighter text-neutral-900 px-2 leading-tight">
                                                    {translatedPlan.title.split(' ')[0]}<br />{translatedPlan.title.split(' ')[1] || ''}
                                                </h3>
                                                <div className="mt-4 pt-4 border-t border-neutral-100 w-full px-2">
                                                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">{t.cta?.from || "From"}</p>
                                                    <p className={`text-lg font-black font-mono tracking-tight text-neutral-900`}>
                                                        {translatedPlan.priceRange}
                                                    </p>
                                                    {!isMixed && <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter mt-1">{t.cta?.per_day || "Per Day"}</p>}
                                                </div>
                                            </motion.div>
                                            {/* Ribbon fold shadow effect */}
                                            <div className="w-1 h-1 bg-black/20 absolute -top-1 left-0" />
                                        </div>

                                        <div className="flex items-center justify-end mb-auto">
                                            <span className={`text-[9px] uppercase tracking-[0.2em] font-black px-4 py-2 rounded-full bg-logo-blue text-white shadow-lg border border-white/10`}>
                                                {translatedPlan.badge}
                                            </span>
                                        </div>

                                        <div className="mt-auto">
                                            <p className={`text-white/90 mb-10 leading-relaxed text-sm font-medium drop-shadow-md max-w-sm group-hover:text-white transition-colors`}>
                                                {translatedPlan.description}
                                            </p>

                                            <Link
                                                href={plan.href}
                                                className={`w-fit px-12 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:scale-[1.02] ${plan.btnColor}`}
                                            >
                                                explore journey <ArrowRight size={16} />
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Compare Section CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-neutral-200 flex flex-col md:flex-row items-center justify-between gap-8 mb-16"
                    >
                        <div>
                            <h3 className="text-2xl font-serif text-brand-green mb-2 flex items-center gap-3">
                                <LayoutList className="text-brand-gold" /> {t.plans_overview.compare.title}
                            </h3>
                            <p className="text-neutral-500">
                                {t.plans_overview.compare.desc}
                            </p>
                        </div>
                        <Link
                            href="/plans/compare"
                            className="shrink-0 px-8 py-4 bg-brand-charcoal text-white rounded-xl font-medium hover:bg-brand-green transition-colors flex items-center gap-2"
                        >
                            {t.plans_overview.compare.btn}
                        </Link>
                    </motion.div>

                    {/* Travel Essentials */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="bg-logo-blue rounded-[3rem] p-12 md:p-16 mb-24 relative overflow-hidden text-white shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=2033')] bg-cover bg-center opacity-20" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                            <div className="max-w-2xl">
                                <h3 className="text-3xl md:text-4xl font-serif mb-6 leading-tight">{t.plans_overview.essentials.title}</h3>
                                <p className="text-white/80 text-lg mb-8 leading-relaxed">
                                    {t.plans_overview.essentials.desc}
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <Link
                                        href="https://eta.gov.lk/slvisa/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-3 px-8 py-4 bg-brand-gold text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-brand-gold/90 transition-all hover:scale-[1.05]"
                                    >
                                        {t.plans_overview.essentials.btn_visa} <ArrowRight size={16} />
                                    </Link>
                                    <Link
                                        href="/reference"
                                        className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-white/20 transition-all"
                                    >
                                        {t.plans_overview.essentials.btn_lib} <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </div>
                            <div className="w-full md:w-auto">
                                <div className="p-8 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20">
                                    <h4 className="font-serif text-2xl mb-4">{t.plans_overview.essentials.visa_badge}</h4>
                                    <p className="text-sm text-white/60 leading-relaxed mb-6">
                                        {t.plans_overview.essentials.visa_desc}
                                    </p>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-brand-gold">
                                        {t.plans_overview.essentials.visa_tag}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* FAQ Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-neutral-100"
                    >
                        <h3 className="text-2xl font-serif text-brand-green mb-10 text-center">
                            {t.plans_overview.faq.title}
                        </h3>
                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                            {t.plans_overview.faq.items.map((item: any, idx: number) => (
                                <div key={idx}>
                                    <h4 className="font-semibold text-brand-green mb-2 text-lg">{item.q}</h4>
                                    <p className="text-brand-charcoal/70 leading-relaxed">
                                        {item.a}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Final CTA */}
                    <div className="mt-16 text-center">
                        <p className="text-neutral-500 mb-6 text-lg">
                            {t.plans_overview.cta.title}
                        </p>
                        <Link
                            href="/contact"
                            className="inline-flex bg-brand-green text-white px-10 py-4 rounded-full text-sm uppercase tracking-widest font-bold hover:bg-brand-charcoal hover:scale-105 transition-all shadow-lg shadow-brand-green/20"
                        >
                            {t.plans_overview.cta.btn}
                        </Link>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}