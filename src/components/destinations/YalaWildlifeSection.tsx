"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Camera, MapPin, Eye } from "lucide-react";

const wildlifeData = [
    {
        title: "The Elusive Leopard",
        image: "/images/wildlife_leopard.avif",
        description: "Yala boasts one of the highest leopard densities in the world. Witness the apex predator of the island in its natural habitat."
    },
    {
        title: "Gentle Giants",
        image: "/images/wildlife_elephant_herd.avif",
        description: "Large herds of Asian elephants roam the plains of Yala, often seen congregating around ancient water reservoirs."
    },
    {
        title: "The Shaggy Recluse",
        image: "/images/wildlife_sloth_bears.avif",
        description: "The rare Sri Lankan sloth bear is a prized sighting, often found during the Palu fruit season."
    },
    {
        title: "Lagoon Sentinels",
        image: "/images/wildlife_buffaloes.avif",
        description: "Wild water buffaloes and diverse birdlife thrive in the intricate network of lagoons and wetlands."
    }
];

export default function YalaWildlifeSection() {
    return (
        <section className="py-24 bg-brand-charcoal text-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                    <div className="max-w-2xl">
                        <span className="text-brand-gold uppercase tracking-[0.3em] text-sm mb-4 block">The Safari Experience</span>
                        <h2 className="font-serif text-4xl md:text-6xl mb-6">The Wild Core of <span className="italic">Yala</span></h2>
                        <p className="text-white/60 text-lg font-light leading-relaxed">
                            Yala is not just a park; it's a primal landscape where the drama of nature unfolds daily. At Nilathra, we provide exclusive access to the quietest corners of the park with elite trackers and luxury mobile camps.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/5 p-4 border border-white/10 rounded-sm text-center min-w-[120px]">
                            <p className="text-brand-gold text-2xl font-serif">#1</p>
                            <p className="text-[10px] uppercase tracking-widest text-white/40">Leopard Density</p>
                        </div>
                        <div className="bg-white/5 p-4 border border-white/10 rounded-sm text-center min-w-[120px]">
                            <p className="text-brand-gold text-2xl font-serif">40+</p>
                            <p className="text-[10px] uppercase tracking-widest text-white/40">Mammal Species</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {wildlifeData.map((item, index) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="group"
                        >
                            <div className="relative h-[400px] mb-6 overflow-hidden rounded-sm">
                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal to-transparent opacity-60" />
                                <div className="absolute bottom-6 left-6">
                                    <div className="flex items-center gap-2 text-brand-gold mb-2">
                                        <Eye size={16} />
                                        <span className="text-[10px] uppercase tracking-widest font-bold">Priority View</span>
                                    </div>
                                    <h3 className="font-serif text-xl">{item.title}</h3>
                                </div>
                            </div>
                            <p className="text-white/50 text-sm font-light leading-relaxed">
                                {item.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-20 p-12 border border-white/10 bg-white/5 rounded-sm flex flex-col md:flex-row items-center gap-12">
                    <div className="relative w-full md:w-1/3 h-[250px] rounded-sm overflow-hidden">
                        <Image
                            src="/images/wildlife_elephant_jeep.avif"
                            alt="Private Safari"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="flex-1 space-y-6">
                        <h3 className="font-serif text-3xl">Private Ranger-Led Expeditions</h3>
                        <p className="text-white/70 font-light">
                            Escape the crowds. Nilathra arranges private entry into the less-traversed blocks of Yala, accompanied by senior wildlife naturalists and photographers. Experience the wild in absolute exclusivity.
                        </p>
                        <div className="flex flex-wrap gap-6 pt-4">
                            <div className="flex items-center gap-3">
                                <Camera className="text-brand-gold" size={20} />
                                <span className="text-xs uppercase tracking-widest">Pro Photography Gear</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="text-brand-gold" size={20} />
                                <span className="text-xs uppercase tracking-widest">Off-track Permits</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
