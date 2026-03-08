"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
    return (
        <section className="relative h-screen w-full overflow-hidden">
            {/* Background Image - Using a placeholder for now, will replace with generated one */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
                style={{
                    backgroundImage: `url('/images/hero_ella_bridge.png')`,
                }}
            >
                <div className="absolute inset-0 cinematic-overlay" />
            </div>

            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
                <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="section-subtitle text-white/90"
                >
                    Exclusively Sri Lanka
                </motion.span>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="text-5xl md:text-8xl font-serif text-white mb-8 max-w-5xl leading-tight"
                >
                    Sri Lanka&apos;s Best Travel Agency for <br />
                    <span className="text-gold-gradient italic">Curated Luxury Journeys</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="text-white/80 text-lg md:text-xl max-w-2xl mb-12 font-light tracking-wide"
                >
                    Experience the pinnacle of hospitality in the heart of the Indian Ocean. From private villas to VIP handling, Nilathra Collection defines Sri Lankan luxury.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    className="flex flex-col md:flex-row gap-6"
                >
                    <Link href="/custom-plan" className="luxury-button border border-white/20">
                        Design My Luxury Experience
                    </Link>
                    <Link href="/destinations" className="luxury-button-outline !text-white !border-white hover:!bg-white hover:!text-brand-green">
                        Explore Destinations
                    </Link>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
                <span className="text-white/50 text-[10px] uppercase tracking-[0.3em]">Scroll</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-brand-gold to-transparent" />
            </motion.div>
        </section>
    );
}
