"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function EllaMistySection() {
    return (
        <section className="py-24 px-6 md:px-12 bg-neutral-50" id="ella-misty">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <div>
                            <span className="section-subtitle">Misty Highlands</span>
                            <h2 className="section-title">Above the Clouds</h2>
                        </div>
                        <div className="space-y-6 text-brand-charcoal/70 leading-relaxed font-light">
                            <p>
                                Ella is where the soul of Sri Lanka's hill country resides. Perched on the edge of a mountain range, this mist-shrouded village offers some of the most dramatic landscapes on the island. From the iconic architectural marvel of the Nine Arch Bridge to the sweeping vistas of Ella Rock, every moment here feels like a scene from a dream.
                            </p>
                            <p>
                                With Nilathra, your Ella experience is elevated beyond the backpacker trail. We arrange private guided hikes to secluded viewpoints, exclusive tea-tasting sessions in colonial-era factories, and luxury stays in boutique lodges that offer panoramic views of the Ella Gap. This is hill country living at its most serene and sophisticated.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-8 pt-4">
                            <div>
                                <p className="text-3xl font-serif text-brand-green">1,000m+</p>
                                <p className="text-xs uppercase tracking-widest text-brand-gold mt-2">Elevation</p>
                            </div>
                            <div>
                                <p className="text-3xl font-serif text-brand-green">9</p>
                                <p className="text-xs uppercase tracking-widest text-brand-gold mt-2">Historic Arches</p>
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
                            src="/images/ella_hero.avif"
                            alt="Ella Misty Mountains"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-green/40 to-transparent" />
                        <div className="absolute bottom-10 left-10 text-white">
                            <p className="text-sm uppercase tracking-[0.3em] font-bold mb-2">Highlands</p>
                            <h3 className="text-3xl font-serif">The Misty Gap</h3>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
