"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslation } from "@/components/I18nProvider";

export default function Hero() {
    const t = useTranslation();
    return (
        <section className="relative h-screen w-full overflow-hidden">
            {/* Background Image - Using a placeholder for now, will replace with generated one */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
                style={{
                    backgroundImage: `url('/images/hero_ella_bridge.avif')`,
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
                    {t.hero.subtitle}
                </motion.span>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="text-5xl md:text-8xl font-serif text-white mb-8 max-w-5xl leading-tight"
                >
                    {t.hero.title_part1} <br />
                    <span className="text-gold-gradient italic">{t.hero.title_part2}</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="text-white/80 text-lg md:text-xl max-w-2xl mb-12 font-light tracking-wide"
                >
                    {t.hero.description}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    className="flex flex-col md:flex-row gap-6"
                >
                    <Link href="/custom-plan" className="luxury-button border border-white/20 rounded-full">
                        {t.hero.btn_design}
                    </Link>
                    <Link href="/destinations" className="luxury-button-outline !text-white !border-white hover:!bg-white hover:!text-brand-green rounded-full">
                        {t.hero.btn_explore}
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
                <span className="text-white/50 text-[10px] uppercase tracking-[0.3em]">{t.hero.scroll}</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-brand-gold to-transparent" />
            </motion.div>
        </section>
    );
}
