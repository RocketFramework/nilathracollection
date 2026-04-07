"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslation } from "@/components/I18nProvider";

export default function NuwaraEliyaHeritageSection() {
    const t = useTranslation();
    const tNuwara = t.destinations.nuwara_eliya;

    return (
        <section className="py-24 px-6 md:px-12 bg-neutral-50" id="nuwara-eliya-heritage">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative h-[600px] rounded-sm overflow-hidden shadow-2xl lg:order-2"
                    >
                        <Image
                            src="/images/nuwara_eliya.avif"
                            alt="Nuwara Eliya Tea Country"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-green/40 to-transparent" />
                        <div className="absolute bottom-10 left-10 text-white">
                            <p className="text-sm uppercase tracking-[0.3em] font-bold mb-2">{tNuwara.hero_badge}</p>
                            <h3 className="text-3xl font-serif">{tNuwara.hero_title}</h3>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8 lg:order-1"
                    >
                        <div>
                            <span className="section-subtitle">{tNuwara.subtitle}</span>
                            <h2 className="section-title">{tNuwara.title}</h2>
                        </div>
                        <div className="space-y-6 text-brand-charcoal/70 leading-relaxed font-light">
                            <p>
                                {tNuwara.desc_1}
                            </p>
                            <p>
                                {tNuwara.desc_2}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-8 pt-4">
                            <div>
                                <p className="text-3xl font-serif text-brand-green">{tNuwara.stats[0].val}</p>
                                <p className="text-xs uppercase tracking-widest text-brand-gold mt-2">{tNuwara.stats[0].label}</p>
                            </div>
                            <div>
                                <p className="text-3xl font-serif text-brand-green">{tNuwara.stats[1].val}</p>
                                <p className="text-xs uppercase tracking-widest text-brand-gold mt-2">{tNuwara.stats[1].label}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
