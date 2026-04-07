"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Check, Camera, Coffee } from "lucide-react";
import { useTranslation } from "@/components/I18nProvider";

import ColomboUrbanSection from "@/components/destinations/ColomboUrbanSection";
import GalleHeritageSection from "@/components/destinations/GalleHeritageSection";
import SigiriyaAncientSection from "@/components/destinations/SigiriyaAncientSection";
import EllaMistySection from "@/components/destinations/EllaMistySection";
import NuwaraEliyaHeritageSection from "@/components/destinations/NuwaraEliyaHeritageSection";
import WeligamaMirissaSection from "@/components/destinations/WeligamaMirissaSection";
import YalaWildlifeSection from "@/components/destinations/YalaWildlifeSection";

// We keep the static images and icons structure
// We will merge this with translated text
const baseDestData = {
    sigiriya: {
        heroImage: "/images/sigiriya_rock.avif",
        experiencesIcons: [MapPin, Coffee, Camera],
    },
    galle: {
        heroImage: "/images/galle_fort.avif",
        experiencesIcons: [MapPin, Coffee, Camera],
    },
    yala: {
        heroImage: "/images/yala_hero.avif",
        experiencesIcons: [Camera, Coffee, MapPin],
    },
    kandy: {
        heroImage: "/images/kandy_real.avif",
        experiencesIcons: [MapPin, Coffee, Camera],
    },
    colombo: {
        heroImage: "/images/colombo_morning_drone.avif",
        experiencesIcons: [MapPin, Coffee, Camera],
    },
    ella: {
        heroImage: "/images/ella_hero.avif",
        experiencesIcons: [MapPin, Coffee, Camera],
    },
    "weligama-mirissa": {
        heroImage: "/images/tangalle.avif",
        experiencesIcons: [Coffee, Camera],
    },
    "nuwara-eliya": {
        heroImage: "/images/nuwara_eliya.avif",
        experiencesIcons: [Coffee, MapPin, Camera],
    },
    trincomalee: {
        heroImage: "/images/trincomalee_hero.avif",
        experiencesIcons: [MapPin, Coffee, Camera],
    },
};

export default function DestinationClient({ slug }: { slug: string }) {
    const t = useTranslation();
    const lSlug = t.destination_slugs[slug] || t.destination_slugs["sigiriya"];
    const baseObj = (baseDestData as any)[slug] || baseDestData["sigiriya"];
    const tl = t.destination_layout;

    return (
        <>
            {/* Hero */}
            <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
                <Image
                    src={baseObj.heroImage}
                    alt={lSlug.name}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 cinematic-overlay" />
                <div className="relative z-10 text-center text-white px-6">
                    <Link href="/destinations" className="inline-flex items-center gap-2 text-white/70 hover:text-brand-gold transition-colors mb-6 text-sm uppercase tracking-widest">
                        <ArrowLeft size={16} /> {tl.back_to}
                    </Link>
                    <h1 className="text-6xl md:text-8xl font-serif mb-4">{lSlug.name}</h1>
                    <p className="text-brand-gold text-lg uppercase tracking-[0.4em]">{lSlug.tagline}</p>
                </div>
            </section>

            {/* Content */}
            <section className="py-24 px-6 md:px-12 bg-white">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20">
                    <div className="flex-1 space-y-12">
                        <div>
                            <span className="section-subtitle">{tl.the_dest}</span>
                            <h2 className="section-title">{tl.overview}</h2>
                            <p className="text-brand-charcoal/70 text-lg leading-relaxed font-light">
                                {lSlug.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <h3 className="font-serif text-2xl text-brand-green">{tl.experience_highlights}</h3>
                                <ul className="space-y-4">
                                    {lSlug.highlights.map((item: string, idx: number) => (
                                        <li key={idx} className="flex gap-3 items-start text-brand-charcoal/80">
                                            <Check size={18} className="text-brand-gold shrink-0 mt-1" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="space-y-6">
                                <h3 className="font-serif text-2xl text-brand-green">{tl.essential_info}</h3>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <Calendar className="text-brand-gold" />
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-brand-charcoal/40">{tl.best_time}</p>
                                            <p className="font-medium text-brand-charcoal">{lSlug.bestTime}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {lSlug.experiences.map((exp: any, idx: number) => {
                                            const Icon = baseObj.experiencesIcons[idx] || Coffee;
                                            return (
                                                <div key={idx} className="flex items-center gap-4">
                                                    <Icon className="text-brand-gold" />
                                                    <div>
                                                        <p className="text-xs uppercase tracking-widest text-brand-charcoal/40">{tl.exclusive_offering}</p>
                                                        <p className="font-medium text-brand-charcoal">{exp.name}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <aside className="lg:w-[400px] space-y-8">
                        <div className="bg-brand-sand p-10 rounded-sm shadow-sm border border-brand-charcoal/5">
                            <h3 className="font-serif text-2xl text-brand-green mb-8">{tl.acc_suggestions}</h3>
                            <div className="space-y-6">
                                {lSlug.accommodations.map((acc: any, idx: number) => (
                                    <div key={idx} className="border-b border-brand-charcoal/10 pb-6 last:border-0 last:pb-0">
                                        <p className="text-brand-green font-medium">{acc.name}</p>
                                        <p className="text-xs uppercase tracking-widest text-brand-gold">{acc.type}</p>
                                    </div>
                                ))}
                            </div>
                            <Link href="/custom-plan" className="luxury-button w-full mt-10 text-center flex justify-center">
                                {tl.inquire}
                            </Link>
                        </div>

                        <div className="relative h-[300px] rounded-sm overflow-hidden group">
                            <Image
                                src="/images/galle_hero.avif"
                                alt="Luxury travel"
                                fill
                                className="object-cover transition-transform group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-brand-green/40 flex items-center justify-center p-8 text-center bg-brand-green/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-sm">{tl.custom_itin.replace("{name}", lSlug.name)}</p>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>

            {/* Colombo Specific Elaborated Content */}
            {slug === "colombo" && <ColomboUrbanSection />}

            {/* Galle Specific Elaborated Content */}
            {slug === "galle" && <GalleHeritageSection />}

            {/* Sigiriya Specific Elaborated Content */}
            {slug === "sigiriya" && <SigiriyaAncientSection />}

            {/* Ella Specific Elaborated Content */}
            {slug === "ella" && <EllaMistySection />}

            {/* Nuwara Eliya Specific Elaborated Content */}
            {slug === "nuwara-eliya" && <NuwaraEliyaHeritageSection />}

            {/* Weligama & Mirissa Specific Elaborated Content */}
            {slug === "weligama-mirissa" && <WeligamaMirissaSection />}

            {/* Yala Specific Elaborated Content */}
            {slug === "yala" && <YalaWildlifeSection />}

            {/* Dynamic CTA */}
            <section className="py-24 px-6 md:px-12 bg-brand-green text-white text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="font-serif text-4xl mb-8">{tl.include.replace("{name}", lSlug.name)}</h2>
                    <p className="text-white/70 mb-12 text-lg font-light">
                        {tl.specialists.replace("{name}", lSlug.name)}
                    </p>
                    <Link href="/custom-plan" className="luxury-button border border-white/20 !px-12 !py-5">
                        {tl.plan_my.replace("{name}", lSlug.name)}
                    </Link>
                </div>
            </section>
        </>
    );
}
