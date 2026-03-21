"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function SigiriyaAncientSection() {
    return (
        <section className="py-24 px-6 md:px-12 bg-white" id="sigiriya-ancient">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative h-[600px] rounded-sm overflow-hidden shadow-2xl"
                    >
                        <Image
                            src="/images/sigiriya_rock.avif"
                            alt="Sigiriya Rock Fortress Ancient View"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-green/40 to-transparent" />
                        <div className="absolute bottom-10 left-10 text-white">
                            <p className="text-sm uppercase tracking-[0.3em] font-bold mb-2">Heritage</p>
                            <h3 className="text-3xl font-serif">The Eighth Wonder</h3>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <div>
                            <span className="section-subtitle">Ancient Marvel</span>
                            <h2 className="section-title">A Fortress in the Sky</h2>
                        </div>
                        <div className="space-y-6 text-brand-charcoal/70 leading-relaxed font-light">
                            <p>
                                Sigiriya, the "Lion Rock," is a monumental testament to the architectural brilliance and survivalist ingenuity of ancient Sri Lanka. Rising nearly 200 meters from the lush jungle plains, this monolithic rock fortress served as the palace-citadel of King Kashyapa in the 5th century. It is a mosaic of intricate gardens, advanced hydraulic engineering, and some of the world's most exquisite ancient frescoes.
                            </p>
                            <p>
                                With Nilathra, your journey to the summit is a curated narrative of royalty and rebellion. We arrange private, early-dawn climbs with archaeological experts to avoid the crowds, followed by luxury jungle breakfasts overlooking the fortress. Experience the spiritual and historical gravity of this UNESCO World Heritage site in absolute serenity and comfort.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-8 pt-4">
                            <div>
                                <p className="text-3xl font-serif text-brand-green">1,200+</p>
                                <p className="text-xs uppercase tracking-widest text-brand-gold mt-2">Steps to the Summit</p>
                            </div>
                            <div>
                                <p className="text-3xl font-serif text-brand-green">5th</p>
                                <p className="text-xs uppercase tracking-widest text-brand-gold mt-2">Century Masterpiece</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
