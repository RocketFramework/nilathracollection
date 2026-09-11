"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Play, Pause, ArrowRight, ShieldCheck, Lock, Navigation, Clock, Crown, Sparkles, CheckCircle2, Phone, Mail, Globe, MessageCircle, Compass, Coins, UserCheck } from "lucide-react";

const fadeUpVariant = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 1 } },
};

import { useTranslation } from "@/components/I18nProvider";

export default function VIPContent() {
    const dict = useTranslation();
    const t = dict?.vip || {};
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

    const scarcityCards = t.scarcity_cards || [
        {
            metric: "Max 12–15 Journeys / Month",
            title: "Strict Intake Cap",
            desc: "Controlled intake ensuring senior executive focus on every active journey."
        },
        {
            metric: "24/7 Time-Zone Sync",
            title: "Your Time Zone is Our Working Hour",
            desc: "Whether midday in New York, London, or Paris—or midnight in Colombo—our directors are awake and coordinating."
        },
        {
            metric: "$10,000 – $100,000+",
            title: "Sovereign Investment Floor",
            desc: "Engineered strictly for top-tier luxury ($$$$$), featuring estate buyouts, helicopter safaris, and dedicated private staff."
        },
        {
            metric: "1 : 1 Executive Stewardship",
            title: "Direct Director Access",
            desc: "Direct line to senior travel leaders (Nirosh, Nimali, Sonali, Janaka)—zero call centers or third-party delays."
        }
    ];

    const scarcityIcons = [Compass, Clock, Coins, UserCheck];

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
                        {t.hero_subtitle || "A Land Like No Other"}
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.5, delay: 0.8 }}
                        className="text-6xl sm:text-8xl md:text-[9rem] font-serif text-white uppercase tracking-tighter leading-none mb-8 drop-shadow-2xl"
                    >
                        {t.hero_title || "Thabrobana"}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5, delay: 1.2 }}
                        className="text-lg md:text-2xl text-white/70 max-w-3xl font-serif italic"
                    >
                        {t.hero_desc || "The pinnacle of luxury travel. Experience the diversity of an entire continent, curated exclusively for the world's most discerning travelers."}
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
                            {isPlaying ? (t.play_pause || "Pause The Story") : (t.play_start || "Immerse In The Story")}
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
                        <h2 className="text-4xl md:text-6xl font-serif text-white leading-tight">
                            {t.pitch_title || "Beyond The"} <br />
                            <span className="text-brand-gold italic">{t.pitch_title_gold || "Ordinary"}</span>
                        </h2>
                        <div className="space-y-8 text-neutral-400 font-light text-xl leading-relaxed">
                            <p>
                                {t.pitch_p1 || "While the Maldives offers pristine beaches curated by our very own Sri Lankan hospitality experts, Sri Lanka offers an experience that transcends mere relaxation."}
                            </p>
                            <p>
                                {t.pitch_p2 || "Imagine a land not quite as vast as India, yet encompassing the entirety of India's breathtaking diversity within a compact 65,610 square kilometers. Here, luxury is defined not just by opulent resorts, but by unparalleled access to diverse worlds, seamlessly woven together."}
                            </p>
                        </div>
                        <Link href="/custom-plan" className="inline-flex items-center gap-4 text-brand-gold uppercase tracking-[0.2em] text-sm group pb-2 border-b border-brand-gold/30 hover:border-brand-gold transition-colors">
                            {t.pitch_btn || "Craft Your VIP Journey"} <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* 2.2 Sovereign Discretion & NDA Charter Banner */}
            <section className="py-16 px-6 md:px-12 bg-neutral-900/80 border-y border-white/10">
                <div className="max-w-6xl mx-auto bg-gradient-to-r from-[#0F1D17] via-neutral-900 to-[#0F1D17] border border-brand-gold/40 p-8 md:p-12 rounded-xl text-left space-y-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3 text-brand-gold font-bold uppercase tracking-wider text-xs md:text-sm">
                            <Lock size={20} />
                            <span>{t.nda_charter_badge || "Sovereign Discretion & Strict NDA Charter"}</span>
                        </div>
                        <span className="text-xs text-brand-gold/90 uppercase tracking-widest font-bold px-3 py-1 rounded bg-brand-gold/15 border border-brand-gold/30">
                            {t.nda_charter_title || "UHNW Privacy Guarantee & Protocol"}
                        </span>
                    </div>
                    <p className="font-serif italic font-light text-white/90 text-base md:text-lg leading-relaxed max-w-5xl">
                        &ldquo;{t.nda_charter_desc || "Over 95% of Nilathra Collection's Ultra-VIP journeys operate under strict Non-Disclosure Agreements (NDAs). To preserve the privacy, security, and total anonymity of our Forbes-list, royal, and high-profile clientele, we never publish guest identities, flight manifests, or reviews without explicit written authorization."}&rdquo;
                    </p>
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs text-white/70 font-sans border-t border-white/10">
                        <span className="flex items-center gap-2 text-brand-gold font-medium">
                            <ShieldCheck size={16} /> Confidential Peer Verification Available for Family Offices &amp; Private Wealth Advisors
                        </span>
                        <Link 
                            href="/contact?topic=nda-reference-request" 
                            className="px-6 py-2.5 rounded-full bg-brand-gold/20 hover:bg-brand-gold text-brand-gold hover:text-black border border-brand-gold/40 uppercase tracking-widest text-xs font-bold transition-all duration-300 shadow-md"
                        >
                            {t.nda_charter_btn || "Request Confidential NDA Peer Verification"} &rarr;
                        </Link>
                    </div>
                </div>
            </section>

            {/* 2.3 Deliberate Scarcity & VIP Service Guarantees Grid */}
            <section className="py-24 px-6 md:px-12 bg-neutral-950 border-b border-white/10 relative overflow-hidden">
                <div className="max-w-6xl mx-auto space-y-16">
                    <div className="text-center max-w-3xl mx-auto space-y-4">
                        <span className="text-brand-gold text-xs font-bold uppercase tracking-[0.3em] block">
                            {t.scarcity_subtitle || "Controlled Capacity & Investment Standard"}
                        </span>
                        <h2 className="font-serif text-3xl md:text-5xl text-white">
                            {t.scarcity_title || "Deliberate Scarcity & Service Standards"}
                        </h2>
                        <p className="text-white/70 text-base md:text-lg font-light leading-relaxed font-serif italic">
                            {t.scarcity_desc || "We do not aspire to be a volume tour operator—we choose to be the most refined. By strictly limiting active monthly masterplans and aligning with your time zone, every VIP receives 100% undivided senior stewardship."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {scarcityCards.map((card: any, idx: number) => {
                            const CardIcon = scarcityIcons[idx % scarcityIcons.length];
                            return (
                                <div
                                    key={idx}
                                    className="bg-white/5 border border-white/10 p-8 rounded-xl hover:border-brand-gold/50 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between group shadow-xl"
                                >
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 rounded-full bg-brand-gold/15 text-brand-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <CardIcon size={24} />
                                        </div>
                                        <span className="inline-block px-3 py-1 bg-brand-gold/20 text-brand-gold text-[10px] font-bold uppercase tracking-widest rounded-full">
                                            {card.metric}
                                        </span>
                                        <h3 className="font-serif text-xl text-white font-bold group-hover:text-brand-gold transition-colors">
                                            {card.title}
                                        </h3>
                                        <p className="text-white/70 text-xs md:text-sm font-light leading-relaxed">
                                            {card.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 2.4 Dedicated VIP Concierge Roster Desk */}
            <section className="py-20 px-6 md:px-12 bg-neutral-900 border-b border-white/10">
                <div className="max-w-6xl mx-auto space-y-12">
                    <div className="text-center max-w-2xl mx-auto space-y-3">
                        <span className="text-brand-gold text-xs font-bold uppercase tracking-[0.3em] block">
                            Direct Senior Concierge Access
                        </span>
                        <h2 className="font-serif text-3xl md:text-4xl text-white">Your Dedicated VIP Travel Managers</h2>
                        <p className="text-neutral-400 text-sm font-light leading-relaxed">
                            No automated call centers or third-party desks. You work 1:1 with senior travel directors.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { name: "Nimali", email: "nimali@nilathra.com", role: "Head of Sales & VIP Concierge", img: "/images/team/nimali.webp" },
                            { name: "Sonali", email: "sonali@nilathra.com", role: "Senior Travel Curator", img: "/images/team/sonali.webp" },
                            { name: "Ruchika", email: "ruchika@nilathra.com", role: "Expedition & Safari Director", img: "/images/team/ruchika.webp" },
                            { name: "Ashee", email: "ashee@nilathra.com", role: "Maldives Desk Manager", img: "/images/team/ashee.webp" },
                        ].map((agent, idx) => (
                            <div key={idx} className="bg-neutral-950 border border-white/10 p-6 rounded-xl text-center space-y-4 hover:border-brand-gold/40 transition-all shadow-lg">
                                <div className="relative w-20 h-20 rounded-full overflow-hidden mx-auto border-2 border-brand-gold/40">
                                    <Image src={agent.img} alt={agent.name} fill className="object-cover" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-lg text-white font-bold">{agent.name}</h3>
                                    <p className="text-[11px] text-brand-gold font-semibold uppercase tracking-wider mt-0.5">{agent.role}</p>
                                    <a href={`mailto:${agent.email}`} className="text-xs text-white/70 hover:text-brand-gold font-mono block mt-1 transition-colors">
                                        {agent.email}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 2.5 Operational Protocols & Case Studies - Real Scenarios of Sovereign Care */}
            <section className="py-32 px-6 md:px-12 bg-neutral-900 border-t border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div
                        variants={fadeUpVariant}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="text-center max-w-4xl mx-auto mb-20 space-y-6"
                    >
                        <span className="text-brand-gold text-xs uppercase font-semibold tracking-[0.4em] block">
                            Operational Excellence in Action
                        </span>
                        <h2 className="text-4xl md:text-6xl font-serif text-white leading-tight">
                            Protocols of Care: <span className="text-brand-gold italic">Real Operational Scenarios</span>
                        </h2>
                        <p className="text-neutral-400 text-lg md:text-xl font-light leading-relaxed">
                            True VIP confidence is not built on promises, but on execution. Below are real-world operational scenarios demonstrating how our command team handles high-profile movements, privacy engineering, and emergency pivots.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {[
                            {
                                code: "SCENARIO 01",
                                title: "Charter Helicopter Dispatch & Highland Estate Transfer",
                                context: "Executive Delegation / Weather & Time Optimization",
                                problem: "Guest needed to bypass a 5-hour highland road journey due to tight scheduling and afternoon meetings in Nuwara Eliya.",
                                execution: "Dispatched a chartered Bell 206/407 helicopter from Ratmalana Airport (RML) directly to a private estate helipad at Ceylon Tea Trails. Dedicated estate butler staff and private chef team were positioned and ready upon landing.",
                                icon: Navigation,
                                metric: "35 Min Air Transfer"
                            },
                            {
                                code: "SCENARIO 02",
                                title: "Secluded Estate Buyout & Discreet Security Perimeter",
                                context: "High-Profile Family / 100% Privacy Mandate",
                                problem: "Client requested absolute physical isolation and total privacy at a coastal sanctuary in Tangalle with zero outside disturbance.",
                                execution: "Executed a complete private estate buyout with trained Close Protection Detail (CPD) managing outer gate security. In-villa dining, wellness therapies, and concierge requests were managed seamlessly through personal butler service.",
                                icon: Lock,
                                metric: "Total Estate Buyout"
                            },
                            {
                                code: "SCENARIO 03",
                                title: "Silk Route VIP Tarmac Greeting & Luxury SUV Escort",
                                context: "Private Aviation Arrival / Colombo (CMB & RML)",
                                problem: "Avoid public airport terminal lines for immediate, fast-track arrival greeting and private transfer to a boutique city residence.",
                                execution: "Coordinated Silk Route VIP tarmac protocol with vehicle greeting at aircraft steps. Guests finalized immigration in minutes and transferred in a luxury SUV convoy (Range Rover & Land Cruiser V8) with an elite driver-guide.",
                                icon: ShieldCheck,
                                metric: "Silk Route Fast-Track"
                            },
                            {
                                code: "SCENARIO 04",
                                title: "\"Everything Brought To You\": In-Villa Ceylon Sapphire Viewing",
                                context: "Gem Collector & Enthusiast / Discreet Selection",
                                problem: "Guest requested a private viewing of rare unheated Ceylon Blue and Padparadscha Sapphires without visiting public commercial jewelry houses.",
                                execution: "Arranged for licensed master gemologists to present a hand-curated collection of natural sapphires directly at the guest's oceanfront villa in Weligama, complete with a private tea masterclass and chef-curated seafood dinner.",
                                icon: Sparkles,
                                metric: "In-Villa Private Curation"
                            }
                        ].map((scenario, idx) => (
                            <motion.div
                                key={scenario.code}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-neutral-950/90 border border-white/10 rounded-2xl p-8 md:p-10 flex flex-col justify-between hover:border-brand-gold/50 transition-all duration-500 group shadow-2xl relative overflow-hidden"
                            >
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-mono tracking-widest text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full border border-brand-gold/20">
                                            {scenario.code}
                                        </span>
                                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-black transition-colors">
                                            <scenario.icon size={20} />
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-xs uppercase tracking-widest text-neutral-500 block mb-1">{scenario.context}</span>
                                        <h3 className="font-serif text-2xl text-white group-hover:text-brand-gold transition-colors leading-snug">
                                            {scenario.title}
                                        </h3>
                                    </div>

                                    <div className="space-y-3 pt-2 text-sm text-neutral-400 font-light leading-relaxed">
                                        <p><strong className="text-neutral-200 font-medium">The Requirement:</strong> {scenario.problem}</p>
                                        <p><strong className="text-brand-gold font-medium">Nilathra Execution:</strong> {scenario.execution}</p>
                                    </div>
                                </div>

                                <div className="pt-6 mt-8 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-brand-gold">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={14} />
                                        <span>Verified Protocol</span>
                                    </div>
                                    <span className="text-neutral-400 font-mono">{scenario.metric}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. Symphony of Climates - Horizontal Scroll */}
            <section ref={targetRef} className="relative h-[300vh] bg-black">
                <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden py-24">
                    <div className="px-6 md:px-12 max-w-7xl mx-auto w-full mb-16">
                        <h2 className="text-4xl md:text-5xl font-serif text-brand-gold mb-6">{t.symphony_title || "A Symphony of Climates"}</h2>
                        <p className="text-neutral-400 font-light max-w-2xl text-lg">
                            {t.symphony_desc || "Begin your morning with yoga on a sun-drenched beach, ascend to the misty mountains for a colonial high tea, and conclude your day dining under a canopy of stars."}
                        </p>
                    </div>

                    <motion.div style={{ x }} className="flex gap-12 px-6 md:px-12 w-[300vw] lg:w-[200vw]">
                        {[
                            { src: "/images/sri-lanka/climate/sandy-beaches.avif", title: "Morning: Coastal Sun", desc: "Awake to the rhythmic crashing of the Indian Ocean from your secluded private villa." },
                            { src: "/images/sri-lanka/climate/wet-land.avif", title: "Noon: Emerald Wetlands", desc: "Helicopter to the lush interior, discovering hidden waterfalls and vibrant rainforests." },
                            { src: "/images/sri-lanka/climate/dry-land.avif", title: "Evening: Golden Dry Lands", desc: "Dine under ancient skies in the cultural triangle, surrounded by millennia of history." }
                        ].map((climate, idx) => {
                            const tClimate = t.climates?.[idx] || climate;
                            return (
                                <div key={idx} className="relative w-[85vw] md:w-[60vw] lg:w-[45vw] h-[60vh] shrink-0 group">
                                    <Image
                                        src={climate.src}
                                        alt={tClimate.title}
                                        fill
                                        className="object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-1000"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                    <div className="absolute bottom-10 left-10 right-10">
                                        <h3 className="text-3xl font-serif text-white mb-4">{tClimate.title}</h3>
                                        <p className="text-neutral-300 font-light">{tClimate.desc}</p>
                                    </div>
                                    <span className="absolute top-10 right-10 text-brand-gold font-serif text-2xl">0{idx + 1}</span>
                                </div>
                            );
                        })}
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
                        <h2 className="text-5xl font-serif text-brand-gold mb-8">{t.heritage_title || "Echoes of Eternity"}</h2>
                        <p className="text-neutral-400 font-light max-w-3xl mx-auto text-xl italic">
                            {t.heritage_desc || "Walk among 6000-year-old burial sites, trace the engineering marvels of ancient reservoirs, and gaze upon the majestic Sigiriya."}
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
                                {t.heritage_text || "Our culture is an unbroken lineage, alive with the mesmerizing rhythms of traditional dances and rituals that have safeguarded our people for millennia. Experience heritage that treats you not just as a guest, but as royalty."}
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
                            <h2 className="text-5xl font-serif text-white mb-6">{t.wildlife_title || "Untamed Elegance"}</h2>
                            <p className="text-neutral-400 font-light text-xl">{t.wildlife_desc || "Private safaris granting you exclusive access to the heart of the wild."}</p>
                        </div>
                        <div className="lg:col-span-1 flex justify-end">
                            <span className="text-brand-gold uppercase tracking-[0.2em] text-sm">{t.wildlife_tag || "The VIP Safari"}</span>
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
                        <span className="text-brand-gold text-sm uppercase tracking-[0.3em] block mb-4">{t.culinary_tag || "Culinary Mastery"}</span>
                        <h2 className="text-5xl md:text-6xl font-serif text-white mb-8">{t.culinary_title || "A Feast Fit For Kings"}</h2>
                        <p className="text-neutral-400 font-light max-w-3xl mx-auto text-xl">
                            {t.culinary_desc || "Elevate your palate. Savor hand-picked native delicacies bursting with unique island spices, prepared by world-renowned executive chefs in exclusive settings."}
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
                    <h2 className="text-5xl md:text-7xl font-serif text-white mb-8">{t.cta_title || "Your Thabrobana Awaits"}</h2>
                    <p className="text-2xl text-brand-gold font-light italic mb-16">{t.cta_desc || "The ultimate travel privilege."}</p>
                    <Link href="/contact?plan=ultra-vip" className="inline-block bg-transparent border border-brand-gold text-brand-gold uppercase tracking-[0.3em] px-16 py-6 hover:bg-brand-gold hover:text-black transition-all duration-500 text-sm font-medium">
                        {t.cta_btn || "Inquire With VIP Desk"}
                    </Link>
                </div>
            </section>
        </div>
    );
}
