"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Play, Pause, ArrowRight } from "lucide-react";

const fadeUpVariant = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 1 } },
};

export default function VIPContent() {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // For horizontal scroll section
    const targetRef = useRef<HTMLDivElement | null>(null);
    const { scrollYProgress } = useScroll({ target: targetRef });
    // Transform scroll progress to horizontal translation
    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-66.6%"]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            audioRef.current = new Audio('/audio/final-script.wav');
            const handleEnded = () => setIsPlaying(false);
            audioRef.current.addEventListener('ended', handleEnded);
            return () => {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.removeEventListener('ended', handleEnded);
                    audioRef.current = null;
                }
            };
        }
    }, []);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(e => console.error(e));
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="bg-neutral-950 text-neutral-200 selection:bg-brand-gold selection:text-black font-light">
            {/* 1. Cinematic Hero */}
            <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <motion.div
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 3, ease: "easeOut" }}
                        className="w-full h-full relative"
                    >
                        <Image
                            src="/images/sri-lanka/climate/sandy-beaches.avif"
                            alt="Sri Lanka VIP Beach"
                            fill
                            className="object-cover object-top opacity-60"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-neutral-950" />
                    </motion.div>
                </div>

                <div className="relative z-10 text-center px-6 max-w-5xl mx-auto flex flex-col items-center mt-20">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                        className="text-brand-gold text-xs sm:text-sm uppercase tracking-[0.4em] mb-6 font-medium"
                    >
                        A Land Like No Other
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.5, delay: 0.8 }}
                        className="text-6xl sm:text-8xl md:text-[9rem] font-serif text-white uppercase tracking-tighter leading-none mb-8 drop-shadow-2xl"
                    >
                        Thabrobana
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5, delay: 1.2 }}
                        className="text-lg md:text-2xl text-white/70 max-w-3xl font-serif italic"
                    >
                        The pinnacle of luxury travel. Experience the diversity of an entire continent, curated exclusively for the world's most discerning travelers.
                    </motion.p>

                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5, delay: 1.8 }}
                        onClick={togglePlay}
                        className="mt-16 flex items-center justify-center gap-4 px-10 py-5 rounded-full border border-brand-gold/30 text-brand-gold hover:bg-brand-gold hover:text-black transition-all duration-700 backdrop-blur-md group"
                    >
                        {isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current" />}
                        <span className="font-serif tracking-[0.3em] text-xs uppercase">
                            {isPlaying ? "Pause The Story" : "Immerse In The Story"}
                        </span>
                    </motion.button>
                </div>
            </section>

            {/* 2. Philosophy / The Pitch */}
            <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto border-t border-white/5">
                <motion.div
                    variants={fadeUpVariant}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center"
                >
                    <div className="lg:col-span-5 relative h-[700px] w-full mt-10 lg:mt-0">
                        <Image
                            src="/images/sri-lanka/climate/hill-country.avif"
                            alt="Tea Estates Above the Clouds"
                            fill
                            className="object-cover grayscale hover:grayscale-0 transition-all duration-1000 opacity-80 rounded-sm"
                        />
                        <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-brand-gold/5 -z-10 rounded-full blur-3xl" />
                    </div>
                    <div className="lg:col-span-7 space-y-12">
                        <h2 className="text-4xl md:text-6xl font-serif text-white leading-tight">Beyond The <br /><span className="text-brand-gold italic">Ordinary</span></h2>
                        <div className="space-y-8 text-neutral-400 font-light text-xl leading-relaxed">
                            <p>
                                While the Maldives offers pristine beaches curated by our very own Sri Lankan hospitality experts, Sri Lanka offers an experience that transcends mere relaxation.
                            </p>
                            <p>
                                Imagine a land not quite as vast as India, yet encompassing the entirety of India's breathtaking diversity within a compact 65,610 square kilometers. Here, luxury is defined not just by opulent resorts, but by unparalleled access to diverse worlds, seamlessly woven together.
                            </p>
                        </div>
                        <Link href="/custom-plan" className="inline-flex items-center gap-4 text-brand-gold uppercase tracking-[0.2em] text-sm group pb-2 border-b border-brand-gold/30 hover:border-brand-gold transition-colors">
                            Craft Your VIP Journey <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* 3. Symphony of Climates - Horizontal Scroll */}
            <section ref={targetRef} className="relative h-[300vh] bg-black">
                <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden py-24">
                    <div className="px-6 md:px-12 max-w-7xl mx-auto w-full mb-16">
                        <h2 className="text-4xl md:text-5xl font-serif text-brand-gold mb-6">A Symphony of Climates</h2>
                        <p className="text-neutral-400 font-light max-w-2xl text-lg">
                            Begin your morning with yoga on a sun-drenched beach, ascend to the misty mountains for a colonial high tea, and conclude your day dining under a canopy of stars.
                        </p>
                    </div>

                    <motion.div style={{ x }} className="flex gap-12 px-6 md:px-12 w-[300vw] lg:w-[200vw]">
                        {[
                            { src: "/images/sri-lanka/climate/sandy-beaches.avif", title: "Morning: Coastal Sun", desc: "Awake to the rhythmic crashing of the Indian Ocean from your secluded private villa." },
                            { src: "/images/sri-lanka/climate/wet-land.avif", title: "Noon: Emerald Wetlands", desc: "Helicopter to the lush interior, discovering hidden waterfalls and vibrant rainforests." },
                            { src: "/images/sri-lanka/climate/dry-land.avif", title: "Evening: Golden Dry Lands", desc: "Dine under ancient skies in the cultural triangle, surrounded by millennia of history." }
                        ].map((climate, idx) => (
                            <div key={idx} className="relative w-[85vw] md:w-[60vw] lg:w-[45vw] h-[60vh] shrink-0 group">
                                <Image
                                    src={climate.src}
                                    alt={climate.title}
                                    fill
                                    className="object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-1000"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                <div className="absolute bottom-10 left-10 right-10">
                                    <h3 className="text-3xl font-serif text-white mb-4">{climate.title}</h3>
                                    <p className="text-neutral-300 font-light">{climate.desc}</p>
                                </div>
                                <span className="absolute top-10 right-10 text-brand-gold font-serif text-2xl">0{idx + 1}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* 4. Heritage & Man Made - Editorial Layout */}
            <section className="py-32 px-6 md:px-12 bg-neutral-900 border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        variants={fadeUpVariant}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="text-center mb-24"
                    >
                        <h2 className="text-5xl font-serif text-brand-gold mb-8">Echoes of Eternity</h2>
                        <p className="text-neutral-400 font-light max-w-3xl mx-auto text-xl italic">
                            Walk among 6000-year-old burial sites, trace the engineering marvels of ancient reservoirs, and gaze upon the majestic Sigiriya.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
                        <motion.div variants={fadeUpVariant} initial="hidden" whileInView="visible" viewport={{ once: true }} className="md:col-span-7 relative h-[600px]">
                            <Image src="/images/sri-lanka/man made/8th-wonder-of-the-world-lion-rock.avif" alt="Sigiriya" fill className="object-cover" />
                        </motion.div>
                        <motion.div variants={fadeUpVariant} initial="hidden" whileInView="visible" viewport={{ once: true }} className="md:col-span-5 flex flex-col justify-center space-y-8">
                            <div className="relative h-[300px] w-full -ml-0 md:-ml-24 z-10 hidden md:block border-8 border-neutral-900">
                                <Image src="/images/sri-lanka/culture/devil-dance.avif" alt="Culture" fill className="object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                            </div>
                            <p className="text-neutral-400 font-light text-lg">
                                Our culture is an unbroken lineage, alive with the mesmerizing rhythms of traditional dances and rituals that have safeguarded our people for millennia. Experience heritage that treats you not just as a guest, but as royalty.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 5. Wildlife - Asymmetrical Grid */}
            <section className="py-32 px-6 md:px-12 bg-neutral-950">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mb-24 items-end">
                        <div className="lg:col-span-2">
                            <h2 className="text-5xl font-serif text-white mb-6">Untamed Elegance</h2>
                            <p className="text-neutral-400 font-light text-xl">Private safaris granting you exclusive access to the heart of the wild.</p>
                        </div>
                        <div className="lg:col-span-1 flex justify-end">
                            <span className="text-brand-gold uppercase tracking-[0.2em] text-sm">The VIP Safari</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                        <div className="relative md:col-span-2 md:row-span-2 rounded-sm overflow-hidden group">
                            <Image src="/images/sri-lanka/animals/leopard.avif" alt="Leopard" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        </div>
                        <div className="relative md:col-span-1 md:row-span-1 rounded-sm overflow-hidden group">
                            <Image src="/images/sri-lanka/animals/whale.avif" alt="Whale" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        </div>
                        <div className="relative md:col-span-1 md:row-span-1 rounded-sm overflow-hidden group">
                            <Image src="/images/sri-lanka/animals/tusker.avif" alt="Elephant" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Taste of Thabrobana - Curated Gallery */}
            <section className="py-32 px-6 md:px-12 bg-black border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        variants={fadeUpVariant}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <span className="text-brand-gold text-sm uppercase tracking-[0.3em] block mb-4">Culinary Mastery</span>
                        <h2 className="text-5xl md:text-6xl font-serif text-white mb-8">A Feast Fit For Kings</h2>
                        <p className="text-neutral-400 font-light max-w-3xl mx-auto text-xl">
                            Elevate your palate. Savor hand-picked native delicacies bursting with unique island spices, prepared by world-renowned executive chefs in exclusive settings.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-12 mt-0 md:mt-24">
                            <div className="relative h-[500px] w-full shadow-2xl">
                                <Image src="/images/sri-lanka/food/crab-curry.webp" alt="Lagoon Crab" fill className="object-cover" />
                                <p className="absolute -bottom-6 right-8 text-brand-gold uppercase tracking-[0.2em] text-sm bg-black px-4 py-2">Lagoon Crab</p>
                            </div>
                            <div className="relative h-[600px] w-full shadow-2xl">
                                <Image src="/images/sri-lanka/food/hopper.avif" alt="Artisanal Hoppers" fill className="object-cover" />
                                <p className="absolute -bottom-6 left-8 text-brand-gold uppercase tracking-[0.2em] text-sm bg-black px-4 py-2">Artisanal Hoppers</p>
                            </div>
                        </div>
                        <div className="space-y-12">
                            <div className="relative h-[600px] w-full shadow-2xl">
                                <Image src="/images/sri-lanka/fruit/mangosteen-fruit.avif" alt="Fresh Mangosteen" fill className="object-cover" />
                                <p className="absolute top-8 -right-4 md:-right-8 text-brand-gold uppercase tracking-[0.2em] text-sm bg-black px-4 py-2 whitespace-nowrap z-10 border-l border-brand-gold/30">Queen of Fruits</p>
                            </div>
                            <div className="relative h-[500px] w-full shadow-2xl">
                                <Image src="/images/sri-lanka/fruit/king-coconut.avif" alt="King Coconut" fill className="object-cover" />
                                <p className="absolute bottom-8 -left-4 md:-left-8 text-brand-gold uppercase tracking-[0.2em] text-sm bg-black px-4 py-2 whitespace-nowrap z-10 border-r border-brand-gold/30">Kings Coconut</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. Final Invitation CTA */}
            <section className="relative py-48 flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <Image src="/images/sri-lanka/nature/watch-sunrise.avif" alt="Sunrise" fill className="object-cover grayscale" />
                    <div className="absolute inset-0 bg-black/80" />
                </div>
                <div className="relative z-10 text-center px-6 max-w-4xl">
                    <h2 className="text-5xl md:text-7xl font-serif text-white mb-8">Your Thabrobana Awaits</h2>
                    <p className="text-2xl text-brand-gold font-light italic mb-16">The ultimate travel privilege.</p>
                    <Link href="/custom-plan" className="inline-block bg-transparent border border-brand-gold text-brand-gold uppercase tracking-[0.3em] px-16 py-6 hover:bg-brand-gold hover:text-black transition-all duration-500 text-sm font-medium">
                        Begin The Design
                    </Link>
                </div>
            </section>
        </div>
    );
}
