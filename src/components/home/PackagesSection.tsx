"use client";

import { motion } from "framer-motion";
import { Check, Star, Gem, ArrowRight, Crown, LayoutList } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/components/I18nProvider";

const packages = [
    {
        title: "Ultra VIP",
        subtitle: "The Sovereignty Collection",
        icon: Crown,
        description: "Reserved for the world's most discerning travelers. Absolute privacy, bespoke luxury, and peerless security.",
        features: [
            "Private Jet-Side Arrival & Tarmac Clearance",
            "Standby Helicopter for Trip Duration",
            "24/7 Close Protection Detail (CPD)",
            "Private Estate Buyouts & 1:1 Staffing",
            "Absolute NDA & Identity Protection",
        ],
        color: "bg-brand-green",
        textColor: "text-white",
        accent: "text-brand-gold",
        href: "/plans/ultra-vip",
        image: "/images/hero_ultra_vip.avif"
    },
    {
        title: "Luxury Collection",
        subtitle: "The Sapphire Collection",
        icon: Star,
        description: "Exceptional 5-star elegance. Hand-picked signature resorts, elite guidance, and curated gastronomy.",
        features: [
            "Iconic Signature 5-Star Resorts",
            "Private Premium SUV & Elite Chauffeur",
            "Daily Signature Half-Board (HB) Dining",
            "Curated Cultural Tours & Private Access",
            "Daily Ayurvedic/Balinese Spa Sessions",
        ],
        color: "bg-white",
        textColor: "text-brand-charcoal",
        accent: "text-brand-green",
        href: "/plans/luxury"
    },
    {
        title: "Premium Plan",
        subtitle: "The Emerald Collection",
        icon: Gem,
        description: "Reliable, well-organized excellence. Experience the island's beauty with 3-4 star curated excellence.",
        features: [
            "Hand-picked 3-4 Star Signature Hotels",
            "Private AC Sedan/Van & Expert Driver",
            "Daily Half-Board (HB) Dining Selection",
            "Guided Tours of Major Historic Sites",
            "Entrance Fees to National Parks Included",
        ],
        color: "bg-[#EAE7E0]",
        textColor: "text-brand-charcoal",
        accent: "text-brand-green",
        href: "/plans/premium"
    },
    {
        title: "Mixed Collection",
        subtitle: "Total Fluidity",
        icon: LayoutList,
        description: "Your journey, your way. Mix and match tiers across destinations to create your bespoke escape.",
        features: [
            "Flexible Tier Mixing per Destination",
            "Dynamic Pacing (Activity vs. Serenity)",
            "Combined Jet & Ground Transport",
            "Bespoke Masterplans around Your Persona",
            "Unified Proposal at Multiple Points",
        ],
        color: "bg-brand-gold",
        textColor: "text-white",
        accent: "text-brand-green",
        href: "/custom-plan"
    },
];

export default function PackagesSection() {
    const t = useTranslation();
    return (
        <section className="py-24 px-6 md:px-12 bg-brand-sand">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <span className="section-subtitle">{t.packages.subtitle}</span>
                    <h2 className="section-title">{t.packages.title}</h2>
                    <p className="text-brand-charcoal/60 max-w-2xl mx-auto font-light leading-relaxed">
                        {t.packages.desc}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {packages.map((pkg, idx) => {
                        const tPkg = t.packages.items?.[idx] || pkg;
                        return (
                            <motion.div
                                key={pkg.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className={`p-10 flex flex-col h-full rounded-sm ${pkg.color} ${pkg.textColor} shadow-sm border border-brand-charcoal/5 group hover:shadow-2xl transition-all duration-500 relative overflow-hidden`}
                            >
                                {pkg.image && (
                                    <>
                                        <div
                                            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110 group-hover:scale-125 transition-transform duration-[2s]"
                                            style={{ backgroundImage: `url('${pkg.image}')` }}
                                        />
                                        <div className="absolute inset-0 bg-brand-green/85 group-hover:bg-brand-green/75 transition-colors duration-500" />
                                    </>
                                )}

                                <div className="relative z-10 h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-8">
                                        <pkg.icon className={pkg.accent} size={32} />
                                        <span className="text-[10px] uppercase tracking-[0.3em] opacity-60 font-black">{tPkg.subtitle}</span>
                                    </div>
                                    <h3 className="font-serif text-2xl mb-4">{tPkg.title}</h3>
                                    <p className="text-sm opacity-80 mb-8 leading-relaxed italic">
                                        {tPkg.description}
                                    </p>

                                    <ul className="space-y-4 mb-10 flex-grow">
                                        {(tPkg.features || pkg.features).map((feature: string, fIdx: number) => (
                                            <li key={fIdx} className="flex gap-3 text-sm items-start">
                                                <Check size={16} className={`shrink-0 mt-0.5 ${pkg.accent}`} />
                                                <span className="opacity-90">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href={pkg.href}
                                        className={`flex items-center gap-2 text-sm font-medium tracking-widest uppercase transition-all group-hover:gap-4 ${pkg.accent}`}
                                    >
                                        {t.packages.learn_more} <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
