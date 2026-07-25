"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/components/I18nProvider";

export default function Hero() {
    const t = useTranslation();
    return (
        <section className="relative h-[100svh] min-h-[600px] w-full overflow-hidden">
            {/* Background Image optimized with next/image */}
            <Image
                src="/images/hero_ella_bridge.avif"
                alt="Bespoke luxury Sri Lanka travel"
                fill
                priority
                className="object-cover transition-transform duration-1000 scale-105 pointer-events-none"
                sizes="100vw"
            />
            <div className="absolute inset-0 cinematic-overlay" />

            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 pt-24 md:pt-28 pb-12 md:pb-16">
                <span className="section-subtitle text-white/90 hero-animate-subtitle mb-2">
                    {t.hero.subtitle}
                </span>

                <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-serif text-white mb-4 md:mb-6 max-w-5xl leading-tight hero-animate-title">
                    {t.hero.title_part1} <br />
                    <span className="text-gold-gradient italic">{t.hero.title_part2}</span>
                </h1>

                <p className="text-white/80 text-base md:text-lg max-w-2xl mb-8 md:mb-10 font-light tracking-wide hero-animate-desc">
                    {t.hero.description}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 hero-animate-cta">
                    <Link href="/custom-plan" className="luxury-button border border-white/20 rounded-full">
                        {t.hero.btn_design}
                    </Link>
                    <Link href="/destinations" className="luxury-button-outline !text-white !border-white hover:!bg-white hover:!text-brand-green rounded-full">
                        {t.hero.btn_explore}
                    </Link>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 hero-animate-scroll">
                <span className="text-white/50 text-[10px] uppercase tracking-[0.3em]">{t.hero.scroll}</span>
                <div className="w-[1px] h-8 md:h-12 bg-gradient-to-b from-brand-gold to-transparent" />
            </div>
        </section>
    );
}
