"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function WeligamaMirissaSection() {
    return (
        <section className="py-24 px-6 md:px-12 bg-white" id="weligama-mirissa-synergy">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative h-[600px] rounded-sm overflow-hidden shadow-2xl"
                    >
                        <Image
                            src="/images/tangalle.avif"
                            alt="Weligama and Mirissa Coastline"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-green/40 to-transparent" />
                        <div className="absolute bottom-10 left-10 text-white">
                            <p className="text-sm uppercase tracking-[0.3em] font-bold mb-2">Synergy</p>
                            <h3 className="text-3xl font-serif">The Southern Rhythm</h3>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <div>
                            <span className="section-subtitle">Southern Coast Synergy</span>
                            <h2 className="section-title">Weligama & Mirissa</h2>
                        </div>
                        <div className="space-y-6 text-brand-charcoal/70 leading-relaxed font-light">
                            <p>
                                Weligama and Mirissa represent the perfect synergy of the southern coast. Weligama, with its expansive crescent bay, is a haven for surfers and luxury seekers alike, offering a sophisticated beach lifestyle. Just a short drive away, Mirissa captivates with its intimate coves, vibrant sunset points, and its reputation as one of the world's premier locations for whale watching.
                            </p>
                            <p>
                                With Nilathra, you experience this coastal duo in unparalleled luxury. We arrange private yacht charters for whale watching expeditions, exclusive surf lessons with pro instructors in Weligama's gentle breaks, and sunset cocktail sessions at the most secluded beachfront venues. This is the heart of the southern rhythm—laid-back, yet impeccably refined.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-8 pt-4">
                            <div>
                                <p className="text-3xl font-serif text-brand-green">Blue Whale</p>
                                <p className="text-xs uppercase tracking-widest text-brand-gold mt-2">Expeditions</p>
                            </div>
                            <div>
                                <p className="text-3xl font-serif text-brand-green">Pristine</p>
                                <p className="text-xs uppercase tracking-widest text-brand-gold mt-2">Bays & Breaks</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
