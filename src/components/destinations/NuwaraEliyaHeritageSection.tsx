"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function NuwaraEliyaHeritageSection() {
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
                            src="/images/nuwara_eliya.png"
                            alt="Nuwara Eliya Tea Country"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-green/40 to-transparent" />
                        <div className="absolute bottom-10 left-10 text-white">
                            <p className="text-sm uppercase tracking-[0.3em] font-bold mb-2">Heritage</p>
                            <h3 className="text-3xl font-serif">Little England</h3>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8 lg:order-1"
                    >
                        <div>
                            <span className="section-subtitle">Little England</span>
                            <h2 className="section-title">The Heart of Tea Country</h2>
                        </div>
                        <div className="space-y-6 text-brand-charcoal/70 leading-relaxed font-light">
                            <p>
                                Nuwara Eliya is a timeless sanctuary of cool breezes and emerald-green tea estates. Often called "Little England" for its colonial-era architecture and temperate climate, this highland retreat offers a pace of life that is elegantly slow. From the manicured lawns of the Hill Club to the tranquil waters of Gregory Lake, the city exudes a refined nostalgia.
                            </p>
                            <p>
                                With Nilathra, you immerse yourself in the authentic tea lifestyle. We curate private high-tea experiences in century-old bungalows, arrange exclusive tours of premier tea factories where the world's finest Ceylon tea is crafted, and organize bespoke horseback rides through the misty hills. This is the quintessence of luxury in the highlands.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-8 pt-4">
                            <div>
                                <p className="text-3xl font-serif text-brand-green">1,889m</p>
                                <p className="text-xs uppercase tracking-widest text-brand-gold mt-2">Peak Altitude</p>
                            </div>
                            <div>
                                <p className="text-3xl font-serif text-brand-green">1867</p>
                                <p className="text-xs uppercase tracking-widest text-brand-gold mt-2">Est. Colonial Era</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
