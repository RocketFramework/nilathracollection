"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const destinations = [
    {
        name: "Sigiriya",
        tagline: "The Lion Rock Fortress",
        image: "/images/hero_sigiriya_breakfast.avif",
        href: "/destinations/sigiriya",
    },
    {
        name: "Galle",
        tagline: "Colonial Charm & Ocean Breeze",
        image: "/images/galle_hero.avif",
        href: "/destinations/galle",
    },
    {
        name: "Ella",
        tagline: "Highlands & Tea Estates",
        image: "/images/hero_ella_bridge.avif",
        href: "/destinations/ella",
    },
    {
        name: "Yala",
        tagline: "Wild Safaris & Leopards",
        image: "/images/yala_hero.avif",
        href: "/destinations/yala",
    },
];

export default function DestinationsSection() {
    return (
        <section className="py-24 px-6 md:px-12 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
                    <div className="max-w-2xl">
                        <span className="section-subtitle">Exquisite Locations</span>
                        <h2 className="section-title">Iconic Destinations</h2>
                        <p className="text-brand-charcoal/60 font-light leading-relaxed">
                            From the misty Highlands to the pristine Southern coast, explore Sri Lanka's most prestigious locations through the lens of luxury and exclusivity.
                        </p>
                    </div>
                    <Link
                        href="/destinations"
                        className="flex items-center gap-3 text-brand-green font-medium tracking-widest uppercase hover:gap-5 transition-all"
                    >
                        All Destinations <ArrowRight size={20} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {destinations.map((dest, idx) => (
                        <motion.div
                            key={dest.name}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1, duration: 0.8 }}
                            viewport={{ once: true }}
                            className="group relative h-[500px] overflow-hidden rounded-sm cursor-pointer"
                        >
                            <Image
                                src={dest.image}
                                alt={dest.name}
                                fill
                                className="object-cover transition-transform duration-1000 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-green/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                            <div className="absolute bottom-0 left-0 p-8 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                <span className="text-brand-gold text-xs uppercase tracking-[0.3em] block mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-700">Explore</span>
                                <h3 className="text-white font-serif text-3xl mb-2">{dest.name}</h3>
                                <p className="text-white/70 text-sm font-light mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-700">{dest.tagline}</p>

                                <Link
                                    href={dest.href}
                                    className="w-10 h-10 border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-brand-gold hover:border-brand-gold transition-all"
                                >
                                    <ArrowRight size={18} />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
