"use client";

import { motion } from "framer-motion";
import { Check, Star, Gem, ArrowRight } from "lucide-react";
import Link from "next/link";

const packages = [
    {
        title: "Super Luxury VIP",
        icon: Gem,
        description: "The ultimate expression of Sri Lankan hospitality. Private jets, presidential suites, and dedicated concierge.",
        features: [
            "Sri Lanka's most iconic locations",
            "Private villas & Boutique resorts",
            "Private chauffeur & Luxury vehicles",
            "Dedicated travel guide 24/7",
            "Exclusive VIP handling at airports",
        ],
        color: "bg-brand-green",
        textColor: "text-white",
        accent: "text-brand-gold",
    },
    {
        title: "Deluxe Collection",
        icon: Star,
        description: "Exceptional comfort and refined elegance. Premium 5-star properties and professional guidance.",
        features: [
            "High-end 5-star hotels",
            "Professional guide & transport",
            "Curated cultural experiences",
            "Balance of comfort & exploration",
            "Premium dining experiences",
        ],
        color: "bg-white",
        textColor: "text-brand-charcoal",
        accent: "text-brand-green",
    },
    {
        title: "Standard Premium",
        icon: Check,
        description: "Reliable, well-organized, and comfortable. Experience the island's beauty with curated standard excellence.",
        features: [
            "Standard premium hotels",
            "Safe and reliable transport",
            "Expert local guides",
            "Seamless itinerary planning",
            "Authentic local experiences",
        ],
        color: "bg-[#EAE7E0]",
        textColor: "text-brand-charcoal",
        accent: "text-brand-green",
    },
    {
        title: "The Custom Mix",
        icon: ArrowRight,
        description: "Your journey, your way. Mix VIP and Deluxe experiences across different destinations.",
        features: [
            "Flexible travel planning",
            "Tier mixing per destination",
            "Personalized itinerary logic",
            "Scalable luxury options",
            "Expert consulting for mix",
        ],
        color: "bg-brand-gold",
        textColor: "text-white",
        accent: "text-brand-green",
    },
];

export default function PackagesSection() {
    return (
        <section className="py-24 px-6 md:px-12 bg-brand-sand">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <span className="section-subtitle">Our Tiers</span>
                    <h2 className="section-title">The Art of Travel</h2>
                    <p className="text-brand-charcoal/60 max-w-2xl mx-auto font-light">
                        Select the perfect level of luxury for your Sri Lankan odyssey. Each tier is meticulously designed to provide an unforgettable experience.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {packages.map((pkg, idx) => (
                        <motion.div
                            key={pkg.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            viewport={{ once: true }}
                            className={`p-10 flex flex-col h-full rounded-sm ${pkg.color} ${pkg.textColor} shadow-sm border border-brand-charcoal/5 group hover:shadow-2xl transition-all duration-500`}
                        >
                            <pkg.icon className={`mb-8 ${pkg.accent}`} size={32} />
                            <h3 className="font-serif text-2xl mb-4">{pkg.title}</h3>
                            <p className="text-sm opacity-80 mb-8 leading-relaxed italic">
                                {pkg.description}
                            </p>

                            <ul className="space-y-4 mb-10 flex-grow">
                                {pkg.features.map((feature) => (
                                    <li key={feature} className="flex gap-3 text-sm items-start">
                                        <Check size={16} className={`shrink-0 mt-0.5 ${pkg.accent}`} />
                                        <span className="opacity-90">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href="/packages"
                                className={`flex items-center gap-2 text-sm font-medium tracking-widest uppercase transition-all group-hover:gap-4 ${pkg.accent}`}
                            >
                                Learn More <ArrowRight size={16} />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
