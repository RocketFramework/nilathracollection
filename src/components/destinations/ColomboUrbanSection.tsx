"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function ColomboUrbanSection() {
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
                            <span className="section-subtitle">Urban Masterpiece</span>
                            <h2 className="section-title">The Architecture of Ambition</h2>
                        </div>
                        <div className="space-y-6 text-brand-charcoal/70 leading-relaxed font-light">
                            <p>
                                Colombo is not merely a stopover; it is a destination undergoing a breathtaking transformation. From the colonial-era charm of the Fort district—where venerable buildings now house chic boutiques—to the futuristic skyline rising over the Indian Ocean, every corner tells a story of resilience and reinvention.
                            </p>
                            <p>
                                With Nilathra, you experience the city beyond the surface. We provide exclusive access to private art galleries, architectural masterpieces designed by Geoffrey Bawa, and rooftop venues that offer the most cinematic views of the Port City development. This is Colombo unfiltered—sophisticated, soulful, and relentlessly modern.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-8 pt-4">
                            <div>
                                <p className="text-3xl font-serif text-brand-green">15+</p>
                                <p className="text-xs uppercase tracking-widest text-brand-gold mt-2">Heritage Landmarks</p>
                            </div>
                            <div>
                                <p className="text-3xl font-serif text-brand-green">20+</p>
                                <p className="text-xs uppercase tracking-widest text-brand-gold mt-2">Gourmet Venues</p>
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
                            <p className="text-sm uppercase tracking-[0.3em] font-bold mb-2">Perspective</p>
                            <h3 className="text-3xl font-serif">The Morning Vista</h3>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
