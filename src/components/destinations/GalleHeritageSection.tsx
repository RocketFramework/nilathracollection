"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function GalleHeritageSection() {
    return (
        <section className="py-24 px-6 md:px-12 bg-neutral-50" id="galle-heritage">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8 lg:order-2"
                    >
                        <div>
                            <span className="section-subtitle">Heritage & History</span>
                            <h2 className="section-title">The Living Fortress</h2>
                        </div>
                        <div className="space-y-6 text-brand-charcoal/70 leading-relaxed font-light">
                            <p>
                                Galle Fort is not just a monument; it is a living, breathing testament to Sri Lanka's multifaceted history. Within its massive granite ramparts, colonial-era architecture seamlessly blends with modern tropical living. The air here carries the scent of salt spray and history, as narrow cobblestone streets reveal hidden boutique courtyards and world-class culinary gems.
                            </p>
                            <p>
                                With Nilathra, your experience of Galle transcends the typical tourist walk. We curate private encounters with local historians who reveal the secrets of the VOC era, arrange exclusive sunset champagne moments atop the ramparts, and provide access to private colonial villas that are usually closed to the public. This is the soul of the south, experienced in its most refined form.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-8 pt-4">
                            <div>
                                <p className="text-3xl font-serif text-brand-green">400+</p>
                                <p className="text-xs uppercase tracking-widest text-brand-gold mt-2">Years of History</p>
                            </div>
                            <div>
                                <p className="text-3xl font-serif text-brand-green">UNESCO</p>
                                <p className="text-xs uppercase tracking-widest text-brand-gold mt-2">World Heritage</p>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative h-[600px] rounded-sm overflow-hidden shadow-2xl lg:order-1"
                    >
                        <Image
                            src="/images/galle_fort.png"
                            alt="Galle Fort Clock Tower"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-green/40 to-transparent" />
                        <div className="absolute bottom-10 left-10 text-white">
                            <p className="text-sm uppercase tracking-[0.3em] font-bold mb-2">Heritage</p>
                            <h3 className="text-3xl font-serif">The Clock Tower Vista</h3>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
