"use client";

import MainLayout from "@/components/layout/MainLayout";
import { Sparkles, Crown, Gem, Check, ArrowRight, LayoutList } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const plans = [
    {
        id: "vip",
        title: "Super Luxury VIP",
        description: "Reserved for the world's most discerning travelers. Everything included, nothing overlooked. From private helicopters to personal chefs.",
        icon: Crown,
        href: "/plans/super-luxury-vip",
        badge: "Ultra-Luxury",
        color: "bg-gradient-to-br from-amber-800 to-amber-600",
        iconColor: "text-amber-200",
        textColor: "text-amber-100",
        btnColor: "bg-white text-amber-900 hover:bg-amber-50"
    },
    {
        id: "deluxe",
        title: "Deluxe Collection",
        description: "Refined luxury combining heritage and contemporary style. Features boutique gems, premium transport, and gourmet culinary journeys.",
        icon: Gem,
        href: "/plans/deluxe-collection",
        badge: "Refined Luxury",
        color: "bg-gradient-to-br from-logo-blue to-blue-900",
        iconColor: "text-blue-200",
        textColor: "text-blue-100",
        btnColor: "bg-white text-logo-blue hover:bg-neutral-50"
    },
    {
        id: "standard",
        title: "Standard Premium",
        description: "Excellence in comfort and service at Sri Lanka's leading 5-star establishments. Perfect balance of authenticity and premium comfort.",
        icon: Check,
        href: "/plans/standard-premium",
        badge: "5-Star Excellence",
        color: "bg-gradient-to-br from-green-800 to-green-600",
        iconColor: "text-green-200",
        textColor: "text-green-100",
        btnColor: "bg-white text-green-900 hover:bg-green-50"
    }
];

export default function PlansPage() {
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
                            <Sparkles size={14} /> Curated Experiences
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-serif text-brand-green mb-4"
                        >
                            Choose Your Journey
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-neutral-500 max-w-2xl mx-auto text-lg"
                        >
                            From ultra-luxury seclusion to refined comfort, select the experience that matches your vision of the perfect Sri Lankan adventure.
                        </motion.p>
                    </div>

                    {/* Plans Grid */}
                    <div className="grid lg:grid-cols-3 gap-8 mb-16">
                        {plans.map((plan, idx) => (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + idx * 0.1 }}
                                className={`rounded-3xl p-8 shadow-xl flex flex-col ${plan.color} text-white group relative overflow-hidden`}
                            >
                                {/* Decorative circle background */}
                                <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-48 h-48 bg-white/10 rounded-full blur-2xl transition-transform group-hover:scale-110 duration-700" />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className={`p-4 rounded-2xl bg-white/10 backdrop-blur-md ${plan.iconColor}`}>
                                            <plan.icon size={32} />
                                        </div>
                                        <span className={`text-xs uppercase tracking-widest font-semibold px-4 py-2 rounded-full bg-white/10 ${plan.iconColor}`}>
                                            {plan.badge}
                                        </span>
                                    </div>

                                    <h3 className="text-3xl font-serif mb-4">{plan.title}</h3>
                                    <p className={`${plan.textColor} mb-12 flex-grow leading-relaxed`}>
                                        {plan.description}
                                    </p>

                                    <Link
                                        href={plan.href}
                                        className={`w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-transform duration-300 hover:scale-105 shadow-md ${plan.btnColor}`}
                                    >
                                        Explore Package <ArrowRight size={18} />
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
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
                                <LayoutList className="text-brand-gold" /> Need help deciding?
                            </h3>
                            <p className="text-neutral-500">
                                View a detailed side-by-side comparison of all features, properties, and inclusions to find your perfect match.
                            </p>
                        </div>
                        <Link
                            href="/plans/compare"
                            className="shrink-0 px-8 py-4 bg-brand-charcoal text-white rounded-xl font-medium hover:bg-brand-green transition-colors flex items-center gap-2"
                        >
                            Compare All Plans
                        </Link>
                    </motion.div>

                    {/* FAQ Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-neutral-100"
                    >
                        <h3 className="text-2xl font-serif text-brand-green mb-10 text-center">
                            Frequently Asked Questions
                        </h3>
                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                            <div>
                                <h4 className="font-semibold text-brand-green mb-2 text-lg">Can I upgrade my plan?</h4>
                                <p className="text-brand-charcoal/70 leading-relaxed">
                                    Yes! You can upgrade at any time. The price difference will be calculated based on remaining nights and availability of properties.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-brand-green mb-2 text-lg">Are flights included?</h4>
                                <p className="text-brand-charcoal/70 leading-relaxed">
                                    International flights are not included in the base packages, but our concierge team can assist with booking both commercial and private charter flights.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-brand-green mb-2 text-lg">What's the cancellation policy?</h4>
                                <p className="text-brand-charcoal/70 leading-relaxed">
                                    Standard and Deluxe plans offer free cancellation up to 30 days before arrival. The VIP plan provides extended flexibility depending on specific property policies.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-brand-green mb-2 text-lg">Can I customize my itinerary?</h4>
                                <p className="text-brand-charcoal/70 leading-relaxed">
                                    Absolutely! Each tier serves as a foundation. Once you select a tier, you can customize destinations, activities, and the duration of your stay.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Final CTA */}
                    <div className="mt-16 text-center">
                        <p className="text-neutral-500 mb-6 text-lg">
                            Not sure which plan is right for you? Our local travel specialists are here to guide you.
                        </p>
                        <Link
                            href="/contact"
                            className="inline-flex bg-brand-green text-white px-10 py-4 rounded-full text-sm uppercase tracking-widest font-bold hover:bg-brand-charcoal hover:scale-105 transition-all shadow-lg shadow-brand-green/20"
                        >
                            Schedule a Private Consultation
                        </Link>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}