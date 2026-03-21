"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";

const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
        },
    },
};

export default function VIPContent() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio instance only on the client
        if (typeof window !== "undefined") {
            audioRef.current = new Audio('/audio/vip-story.mp3');
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
                audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
            }
            setIsPlaying(!isPlaying);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = current.clientWidth * 0.8;
            current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className="overflow-hidden">
            {/* Hero Section */}
            <section className="relative h-screen w-full flex items-center justify-center pt-20">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/images/sri-lanka/climate/sandy-beaches.avif"
                        alt="Sri Lanka VIP Beach"
                        fill
                        className="object-cover object-top"
                        priority
                    />
                    <div className="absolute inset-0 bg-black/50" />
                </div>

                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center">
                    <motion.p
                        initial={{ opacity: 0, letterSpacing: "0em" }}
                        animate={{ opacity: 1, letterSpacing: "0.2em" }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                        className="text-brand-gold text-sm md:text-md uppercase mb-4 font-serif"
                    >
                        A Land Like No Other
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="text-5xl md:text-7xl font-serif text-white uppercase tracking-wider leading-tight mb-8"
                    >
                        Thabrobana
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 1 }}
                        className="text-lg md:text-xl text-neutral-200 font-light max-w-2xl"
                    >
                        The pinnacle of luxury travel. Experience the diversity of an entire continent, curated exclusively for the world's most discerning travelers.
                    </motion.p>

                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 1.5 }}
                        onClick={togglePlay}
                        className="mt-12 flex items-center justify-center gap-3 px-8 py-4 rounded-full border border-brand-gold/60 text-brand-gold hover:bg-brand-gold hover:text-black transition-all duration-500 backdrop-blur-sm group"
                    >
                        {isPlaying ? (
                            <Pause size={20} className="fill-current" />
                        ) : (
                            <Play size={20} className="fill-current" />
                        )}
                        <span className="font-serif tracking-widest text-sm uppercase">
                            {isPlaying ? "Pause Story" : "Listen to the Story"}
                        </span>
                    </motion.button>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 2, repeat: Infinity, repeatType: "reverse" }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50"
                >
                    <p className="text-sm uppercase tracking-widest mb-2 font-serif">Discover</p>
                    <div className="w-[1px] h-12 bg-gradient-to-b from-brand-gold to-transparent mx-auto" />
                </motion.div>
            </section>

            {/* The Pitch */}
            <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
                <motion.div
                    variants={fadeUpVariant}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center"
                >
                    <div>
                        <h2 className="text-3xl md:text-4xl font-serif text-brand-gold mb-6 uppercase tracking-wider">Beyond The Maldives</h2>
                        <div className="space-y-6 text-neutral-300 font-light text-lg leading-relaxed">
                            <p>
                                While the Maldives offers pristine beaches curated by our very own Sri Lankan hospitality experts, Sri Lanka offers an experience that transcends mere relaxation.
                            </p>
                            <p>
                                Imagine a land not quite as vast as India, yet encompassing the entirety of India's breathtaking diversity within a compact 65,610 square kilometers. Here, luxury is defined not just by opulent resorts, but by unparalleled access to diverse worlds, seamlessly woven together.
                            </p>
                        </div>
                        <Link href="/custom-plan" className="inline-block mt-8 border border-brand-gold text-brand-gold px-8 py-3 uppercase tracking-widest text-sm hover:bg-brand-gold hover:text-black transition-colors duration-300">
                            Craft Your VIP Journey
                        </Link>
                    </div>
                    <div className="relative h-[600px] rounded-lg overflow-hidden group">
                        <Image
                            src="/images/sri-lanka/climate/hill-country.avif"
                            alt="Tea Estates Above the Clouds"
                            fill
                            className="object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8">
                            <p className="text-white text-xl font-serif italic">"Lunch above the clouds in our hill country tea estates."</p>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Climate Contrasts */}
            <section className="py-24 bg-neutral-950 px-6 md:px-12">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        variants={fadeUpVariant}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-serif text-brand-gold mb-6 uppercase tracking-wider">A Symphony of Climates</h2>
                        <p className="text-neutral-400 font-light max-w-3xl mx-auto text-lg leading-relaxed">
                            Begin your morning with yoga on a sun-drenched beach, ascend to the misty mountains for a colonial-style high tea, and conclude your day dining under a canopy of stars in the ancient dry lands of the North—all within hours.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {[
                            { src: "/images/sri-lanka/climate/sandy-beaches.avif", title: "Morning: Coastal Sun" },
                            { src: "/images/sri-lanka/climate/wet-land.avif", title: "Noon: Emerald Wetlands" },
                            { src: "/images/sri-lanka/climate/dry-land.avif", title: "Evening: Golden Dry Lands" }
                        ].map((img, i) => (
                            <motion.div key={i} variants={fadeUpVariant} className="relative h-[400px] rounded-lg overflow-hidden group">
                                <Image src={img.src} alt={img.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6">
                                    <h3 className="text-brand-gold font-serif text-xl">{img.title}</h3>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Heritage & Man Made */}
            <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
                <motion.div
                    variants={fadeUpVariant}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
                >
                    <div className="lg:col-span-5 order-2 lg:order-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div className="relative h-64 rounded-lg overflow-hidden">
                                    <Image src="/images/sri-lanka/man made/8th-wonder-of-the-world-lion-rock.avif" alt="Lion Rock" fill className="object-cover" />
                                </div>
                                <div className="relative h-48 rounded-lg overflow-hidden">
                                    <Image src="/images/sri-lanka/man made/ancient-resorvoir-called-kala-wewa.avif" alt="Kala Wewa" fill className="object-cover" />
                                </div>
                            </div>
                            <div className="space-y-4 mt-8">
                                <div className="relative h-48 rounded-lg overflow-hidden">
                                    <Image src="/images/sri-lanka/culture/devil-dance.avif" alt="Devil Dance" fill className="object-cover" />
                                </div>
                                <div className="relative h-64 rounded-lg overflow-hidden">
                                    <Image src="/images/sri-lanka/man made/ancient-stone-temple-called-gal-viharaya.avif" alt="Gal Viharaya" fill className="object-cover" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-7 order-1 lg:order-2 lg:pl-12">
                        <h2 className="text-3xl md:text-4xl font-serif text-brand-gold mb-6 uppercase tracking-wider">Echoes of Eternity</h2>
                        <div className="space-y-6 text-neutral-300 font-light text-lg leading-relaxed">
                            <p>
                                Step out of your luxury villa and into living history. Walk among 6000-year-old burial sites, trace the engineering marvels of ancient reservoirs, and gaze upon the majestic Sigiriya—the 8th Wonder of the World.
                            </p>
                            <p>
                                Our culture is a vibrant tapestry, alive with the mesmerizing rhythms of traditional dances and rituals that have safeguarded our people for millennia. Experience heritage that treats you not just as a guest, but as royalty.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Wildlife & Nature */}
            <section className="py-24 bg-neutral-950 px-6 md:px-12">
                <div className="max-w-7xl mx-auto text-center mb-16">
                    <motion.h2
                        variants={fadeUpVariant}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="text-3xl md:text-4xl font-serif text-brand-gold mb-6 uppercase tracking-wider"
                    >
                        Untamed Elegance
                    </motion.h2>
                    <motion.p
                        variants={fadeUpVariant}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="text-neutral-400 font-light max-w-3xl mx-auto text-lg leading-relaxed"
                    >
                        Private safaris and exclusive access to the wild heart of Thabrobana. From elusive leopards taking shade under ancient trees to majestic blue whales gliding through the deep ocean.
                    </motion.p>
                </div>

                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    {[
                        "/images/sri-lanka/animals/leopard.avif",
                        "/images/sri-lanka/animals/tusker.avif",
                        "/images/sri-lanka/nature/blue-sapphire-gem.avif", // placeholder, will verify actual gem image
                        "/images/sri-lanka/animals/peacock.avif",
                        "/images/sri-lanka/animals/whale.avif",
                        "/images/sri-lanka/nature/sinharaja-rain-forest.avif",
                        "/images/sri-lanka/nature/laxapana-waterfalls.avif",
                        "/images/sri-lanka/animals/hornbill.avif"
                    ].map((src, i) => {
                        // Adjust gem path since earlier we listed 'gem.avif'
                        const actualSrc = src.includes('blue-sapphire') ? "/images/sri-lanka/nature/gem.avif" : src;
                        return (
                            <motion.div key={i} variants={fadeUpVariant} className="relative aspect-square rounded-lg overflow-hidden group">
                                <Image src={actualSrc} alt="Nature and Wildlife" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                            </motion.div>
                        )
                    })}
                </motion.div>
            </section>

            {/* Culinary & Fruits */}
            <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
                <motion.div
                    variants={fadeUpVariant}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-serif text-brand-gold mb-6 uppercase tracking-wider">A Feast Fit For Kings & Visual Odyssey</h2>
                    <p className="text-neutral-300 font-light text-lg max-w-3xl mx-auto leading-relaxed">
                        Elevate your palate and feast your eyes. Savor mouth-watering native delicacies bursting with unique island spices, while exploring a visual journey of untold heritage, untamed wildlife, and endless natural beauty that we have yet to reveal.
                    </p>
                </motion.div>

                <div className="relative group">
                    <motion.div
                        ref={scrollRef}
                        variants={fadeUpVariant}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="w-full grid grid-rows-2 grid-flow-col gap-6 pb-8 overflow-x-auto snap-x snap-mandatory hide-scrollbar"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {[
                            // Mixed array of Food, Fruit, and All Unused Images
                            { src: "/images/sri-lanka/food/crab-curry.webp", label: "Lagoon Crab Curry" },
                            { src: "/images/sri-lanka/animals/elephant.avif", label: "Wild Elephant" },
                            { src: "/images/sri-lanka/fruit/mangosteen-fruit.avif", label: "Fresh Mangosteen" },
                            { src: "/images/sri-lanka/man made/famous-nine-arch-bridge.avif", label: "Nine Arch Bridge" },
                            { src: "/images/sri-lanka/food/hopper.avif", label: "Artisanal Hoppers" },
                            { src: "/images/sri-lanka/culture/fire-dance.avif", label: "Traditional Fire Dance" },
                            { src: "/images/sri-lanka/fruit/rambutan.avif", label: "Tropical Rambutan" },
                            { src: "/images/sri-lanka/nature/adams-peak.avif", label: "Sacred Adam's Peak" },

                            { src: "/images/sri-lanka/food/kottu.avif", label: "Signature Kottu" },
                            { src: "/images/sri-lanka/animals/turtle.webp", label: "Sea Turtles" },
                            { src: "/images/sri-lanka/fruit/passion-fruit.avif", label: "Passion Fruit" },
                            { src: "/images/sri-lanka/culture/wood-craft.avif", label: "Ancient Wood Craft" },
                            { src: "/images/sri-lanka/food/sweet.avif", label: "Native Sweets" },
                            { src: "/images/sri-lanka/man made/kandy-ancient-temple-of-tooth.avif", label: "Temple of the Tooth" },
                            { src: "/images/sri-lanka/fruit/papaya.avif", label: "Ceylon Papaya" },
                            { src: "/images/sri-lanka/nature/beautiful-sembuwatta-lake.avif", label: "Sembuwatta Lake" },

                            { src: "/images/sri-lanka/food/cashewnut-curry.avif", label: "Cashewnut Curry" },
                            { src: "/images/sri-lanka/climate/plain-lands.avif", label: "Lush Plains" },
                            { src: "/images/sri-lanka/fruit/king-coconut.avif", label: "King Coconut" },
                            { src: "/images/sri-lanka/man made/ancient-ruwan weli-pagoda.avif", label: "Ruwanweli Pagoda" },
                            { src: "/images/sri-lanka/food/ambul-kiribath.avif", label: "Ambul Kiribath" },
                            { src: "/images/sri-lanka/animals/monkey.avif", label: "Macaque Monkeys" },
                            { src: "/images/sri-lanka/fruit/star-fruit.avif", label: "Star Fruit" },
                            { src: "/images/sri-lanka/culture/yak-bera.avif", label: "Yak Bera Drums" },

                            { src: "/images/sri-lanka/food/all.avif", label: "Culinary Assortment" },
                            { src: "/images/sri-lanka/man made/2500-years-old-ancient-twin-pool.avif", label: "Ancient Twin Pool" },
                            { src: "/images/sri-lanka/fruit/banana.avif", label: "Local Banana" },
                            { src: "/images/sri-lanka/nature/cloud-forest-seen-from-adams-peak.webp", label: "Highland Cloud Forest" },
                            { src: "/images/sri-lanka/food/black-pork-curry.webp", label: "Black Pork Curry" },
                            { src: "/images/sri-lanka/culture/new-year-rituals.avif", label: "New Year Rituals" },

                            { src: "/images/sri-lanka/food/brinjal-curry.avif", label: "Brinjal Curry" },
                            { src: "/images/sri-lanka/man made/6000-years-old-burial-site.avif", label: "Prehistoric Burial Site" },
                            { src: "/images/sri-lanka/fruit/bilingi-fruit.avif", label: "Bilingi" },
                            { src: "/images/sri-lanka/nature/common-waterfalls.avif", label: "Hill Country Falls" },

                            { src: "/images/sri-lanka/food/dhal-curry.avif", label: "Dhal Curry" },
                            { src: "/images/sri-lanka/climate/rocky-lands.avif", label: "Rocky Landscapes" },
                            { src: "/images/sri-lanka/fruit/gaduguda-tree.avif", label: "Gaduguda Tree" },
                            { src: "/images/sri-lanka/culture/puppet-dance.webp", label: "Puppetry Art" },

                            { src: "/images/sri-lanka/food/fish-curry.avif", label: "Fish Curry" },
                            { src: "/images/sri-lanka/man made/ancient-damascas-sword.avif", label: "Ancient Metallurgy" },
                            { src: "/images/sri-lanka/fruit/gaduguda.avif", label: "Gaduguda Fruit" },
                            { src: "/images/sri-lanka/nature/flower-summer.avif", label: "Summer Blooms" },

                            { src: "/images/sri-lanka/food/melon-curry.avif", label: "Melon Curry" },
                            { src: "/images/sri-lanka/man made/ancient-ruines-of-bath-room.avif", label: "Royal Bath Ruins" },
                            { src: "/images/sri-lanka/fruit/golde-apple.avif", label: "Golden Apple" },
                            { src: "/images/sri-lanka/culture/thovil-dance.avif", label: "Thovil Ritual" },

                            { src: "/images/sri-lanka/food/milkrice.avif", label: "Festive Milkrice" },
                            { src: "/images/sri-lanka/man made/ancient-surgical-hospital.webp", label: "Ancient Hospital" },
                            { src: "/images/sri-lanka/fruit/king of Fruit.avif", label: "King of Fruits" },
                            { src: "/images/sri-lanka/nature/long-clean-sandy-beach.avif", label: "Endless Horizons" },

                            { src: "/images/sri-lanka/food/potato-curry.avif", label: "Potato Curry" },
                            { src: "/images/sri-lanka/culture/dance.webp", label: "Traditional Performers" },
                            { src: "/images/sri-lanka/fruit/laulu.avif", label: "Laulu Fruit" },

                            { src: "/images/sri-lanka/food/regular-meal.avif", label: "Traditional Meal" },
                            { src: "/images/sri-lanka/fruit/maa-dam-fruit.avif", label: "Maa Dam" },
                            { src: "/images/sri-lanka/food/rice.avif", label: "Steamed Rice" },
                            { src: "/images/sri-lanka/fruit/orange-trees.avif", label: "Orange Orchards" },

                            { src: "/images/sri-lanka/food/roti.avif", label: "Roti" },
                            { src: "/images/sri-lanka/fruit/red-guava.avif", label: "Red Guava" },
                            { src: "/images/sri-lanka/food/short-eats.avif", label: "Short Eats" },
                            { src: "/images/sri-lanka/fruit/small-tamarind.avif", label: "Small Tamarind" },

                            { src: "/images/sri-lanka/food/string-hoppers.webp", label: "String Hoppers" },
                            { src: "/images/sri-lanka/fruit/tamarind.avif", label: "Tamarind" },
                            { src: "/images/sri-lanka/food/traditional-wada.avif", label: "Traditional Wada" },
                            { src: "/images/sri-lanka/fruit/waraka.avif", label: "Waraka" },
                            { src: "/images/sri-lanka/food/vegitable-rotti.avif", label: "Vegetable Rotti" }
                        ].map((item, i) => (
                            <div key={i} className="w-[85vw] md:w-[45vw] lg:w-[400px] snap-center flex flex-col items-center group">
                                <div className="relative w-full h-[400px] rounded-xl overflow-hidden mb-4 shadow-2xl shadow-black/50">
                                    <Image src={item.src} alt={item.label} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300 pointer-events-none" />
                                </div>
                                <h4 className="text-brand-gold font-serif text-lg tracking-wide uppercase">{item.label}</h4>
                            </div>
                        ))}
                    </motion.div>

                    {/* Desktop Navigation Buttons */}
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 bg-black/80 hover:bg-brand-gold text-brand-gold hover:text-black p-4 rounded-full hidden md:flex items-center justify-center backdrop-blur-md transition-all duration-300 z-10 border border-brand-gold/30"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft size={28} />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 bg-black/80 hover:bg-brand-gold text-brand-gold hover:text-black p-4 rounded-full hidden md:flex items-center justify-center backdrop-blur-md transition-all duration-300 z-10 border border-brand-gold/30"
                        aria-label="Scroll right"
                    >
                        <ChevronRight size={28} />
                    </button>
                </div>

                {/* Scroll hint indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="flex justify-center items-center gap-2 mt-8 text-brand-gold/60"
                >
                    <span className="h-[1px] w-12 bg-brand-gold/40"></span>
                    <span className="text-sm font-serif uppercase tracking-widest leading-none">Swipe or use arrows</span>
                    <span className="h-[1px] w-12 bg-brand-gold/40"></span>
                </motion.div>
            </section>

            {/* CTA */}
            <section className="py-32 relative flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <Image src="/images/sri-lanka/nature/watch-sunrise.avif" alt="Sunrise" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/70" />
                </div>
                <div className="relative z-10 text-center px-6 max-w-3xl">
                    <h2 className="text-4xl md:text-5xl font-serif text-white mb-8 leading-tight">Your Thabrobana Awaits</h2>
                    <p className="text-xl text-neutral-300 font-light mb-12">Claim your spot in the mythical land where luxury knows no bounds.</p>
                    <Link href="/custom-plan" className="inline-block bg-brand-gold text-black font-semibold uppercase tracking-widest px-12 py-4 hover:bg-white hover:scale-105 transition-all duration-300">
                        Plan Your Journey
                    </Link>
                </div>
            </section>
        </div>
    );
}
