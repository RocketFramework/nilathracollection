"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslation } from "@/components/I18nProvider";

export default function ColomboUrbanSection() {
    const t = useTranslation();
    const tCol = t.destinations.colombo;

    return (
        <section className="py-24 px-6 md:px-12 bg-neutral-50" id="colombo-urban">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <div>
                            <span className="section-subtitle">{tCol.subtitle}</span>
                            <h2 className="section-title">{tCol.title}</h2>
                        </div>
                        <div className="space-y-6 text-brand-charcoal/70 leading-relaxed font-light">
                            <p>
                                {tCol.desc_1}
                            </p>
                            <p>
                                {tCol.desc_2}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-8 pt-4">
                            <div>
                                <p className="text-3xl font-serif text-brand-green">{tCol.stats[0].val}</p>
                                <p className="text-xs uppercase tracking-widest text-brand-gold mt-2">{tCol.stats[0].label}</p>
                            </div>
                            <div>
                                <p className="text-3xl font-serif text-brand-green">{tCol.stats[1].val}</p>
                                <p className="text-xs uppercase tracking-widest text-brand-gold mt-2">{tCol.stats[1].label}</p>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative h-[600px] rounded-sm overflow-hidden shadow-2xl"
                    >
                        <Image
                            src="/images/colombo_morning_drone.avif"
                            alt="Colombo Skyline Morning"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-green/40 to-transparent" />
                        <div className="absolute bottom-10 left-10 text-white">
                            <p className="text-sm uppercase tracking-[0.3em] font-bold mb-2">{tCol.hero_badge}</p>
                            <h3 className="text-3xl font-serif">{tCol.hero_title}</h3>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
