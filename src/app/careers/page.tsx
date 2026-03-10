"use client";

import MainLayout from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { Briefcase, MapPin, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

const vacancies = [
    {
        title: "Senior Executive Luxury Travel Designer",
        location: "Sri Lanka",
        overview: "The Luxury Travel Designer is responsible for creating highly personalized travel experiences for high-net-worth clients visiting Sri Lanka. This role combines creativity, destination expertise, and meticulous planning to craft extraordinary journeys.",
        responsibilities: [
            "Design bespoke luxury itineraries tailored to client preferences",
            "Coordinate experiences including private tours, helicopter transfers, wellness retreats, and exclusive cultural encounters",
            "Maintain relationships with luxury hotels, boutique villas, and experience providers",
            "Ensure every journey reflects Nilathra’s commitment to exceptional quality",
            "Work closely with the operations team to deliver seamless experiences"
        ],
        requirements: [
            "Minimum 3 years experience in luxury travel planning or hospitality",
            "Deep knowledge of Sri Lanka’s destinations, culture, and experiences",
            "Strong communication and organizational skills",
            "Passion for luxury travel and personalized service",
            "Excellent English communication skills"
        ]
    },
    {
        title: "Global Sales Executive",
        location: "Remote / Sri Lanka",
        overview: "The Global Sales Executive will drive international business development for Nilathra Collection, building relationships with luxury travel agencies, concierge services, and high-net-worth clientele worldwide.",
        responsibilities: [
            "Develop global partnerships with luxury travel agents and concierge companies",
            "Promote Nilathra’s ultra-luxury travel experiences internationally",
            "Identify and develop new markets including Europe, the Middle East, and North America",
            "Attend international travel trade shows and networking events",
            "Achieve sales targets and expand Nilathra’s client base"
        ],
        requirements: [
            "Proven experience in luxury travel sales or hospitality",
            "Strong international network in the travel industry",
            "Excellent negotiation and relationship-building skills",
            "Ability to represent a luxury brand at global events"
        ]
    },
    {
        title: "Senior Executive VIP Guest Experience",
        location: "Sri Lanka",
        overview: "The VIP Guest Experience Manager ensures every guest journey is delivered with exceptional attention to detail. This role oversees the entire guest experience from arrival to departure.",
        responsibilities: [
            "Act as the primary contact for VIP clients during their stay",
            "Coordinate special requests, celebrations, and personalized services",
            "Ensure smooth communication between clients, suppliers, and the operations team",
            "Maintain Nilathra’s luxury service standards",
            "Resolve any issues quickly and discreetly"
        ],
        requirements: [
            "Experience in luxury hospitality or concierge services",
            "Exceptional interpersonal and communication skills",
            "Ability to handle high-profile clients with professionalism and discretion",
            "Strong problem-solving skills"
        ]
    },
    {
        title: "Operations Executive",
        location: "Sri Lanka",
        overview: "The Operations Executive is responsible for ensuring the flawless execution of all travel programs organized by Nilathra Collection.",
        responsibilities: [
            "Coordinate bookings, transport, guides, and accommodations",
            "Manage supplier relationships and service delivery",
            "Oversee logistics for complex luxury itineraries",
            "Ensure operational efficiency and quality control",
            "Support the guest experience team during active tours"
        ],
        requirements: [
            "4+ years experience in travel operations or hospitality",
            "Strong organizational and coordination skills",
            "Experience managing suppliers and travel logistics",
            "Attention to detail and ability to work under pressure"
        ]
    },
    {
        title: "Digital Marketing Executive",
        location: "Remote / Sri Lanka",
        overview: "The Digital Marketing Executive will lead the online marketing strategy for Nilathra Collection, focusing on attracting international luxury travelers.",
        responsibilities: [
            "Manage SEO and digital marketing campaigns",
            "Optimize website content for global search visibility",
            "Develop social media and storytelling campaigns",
            "Analyze marketing performance and generate leads",
            "Collaborate with sales teams to support growth"
        ],
        requirements: [
            "Experience in digital marketing, preferably in travel or hospitality",
            "Strong understanding of SEO and online advertising",
            "Creative storytelling and content development skills",
            "Knowledge of international tourism markets"
        ]
    },
    {
        title: "Partnership & Supplier Executive",
        location: "Sri Lanka",
        overview: "The Partnership Executive is responsible for developing and maintaining relationships with luxury hotels, villas, transport providers, and experience partners.",
        responsibilities: [
            "Negotiate contracts with suppliers",
            "Develop exclusive partnerships and experiences",
            "Maintain strong relationships with luxury service providers",
            "Monitor service quality and supplier performance",
            "Identify new opportunities for unique experiences"
        ],
        requirements: [
            "Experience in hospitality partnerships or supplier management",
            "Strong negotiation and relationship management skills",
            "Knowledge of Sri Lanka’s luxury hospitality sector"
        ]
    }
];

export default function CareersPage() {
    return (
        <MainLayout>
            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-brand-green">
                <div className="absolute inset-0 z-0 opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-gold rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[120px]" />
                </div>

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="text-brand-gold font-medium uppercase tracking-[0.4em] text-sm mb-4 block">Careers</span>
                        <h1 className="text-white text-5xl md:text-7xl mb-6">Join the Collection</h1>
                        <p className="text-white/70 max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed">
                            We are building a team of passionate professionals who can deliver world-class travel experiences for the discerning elite.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Intro Section */}
            <section className="py-24 px-6 md:px-12 bg-white">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <h2 className="section-title">Nilathra Travels – Career Opportunities</h2>
                    <p className="text-brand-charcoal/70 text-lg font-light leading-relaxed">
                        Nilathra Travels is a luxury inbound travel company specializing in ultra-VIP journeys to Sri Lanka. We design bespoke experiences for discerning travelers who expect exceptional service, privacy, and access to extraordinary destinations.
                    </p>
                    <div className="w-24 h-1 bg-brand-gold mx-auto" />
                </div>
            </section>

            {/* Vacancies Section */}
            <section className="py-24 px-6 md:px-12 bg-brand-sand/30">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 gap-12">
                        {vacancies.map((vacancy, idx) => (
                            <motion.div
                                key={vacancy.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1, duration: 0.6 }}
                                className="glass-card p-8 md:p-12 rounded-sm border-l-4 border-l-brand-gold"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-brand-charcoal/5 pb-6">
                                    <div>
                                        <h3 className="text-3xl font-serif text-brand-green mb-2">{vacancy.title}</h3>
                                        <div className="flex items-center gap-2 text-brand-gold font-bold">
                                            <MapPin size={18} />
                                            <span className="text-sm uppercase tracking-widest">{vacancy.location}</span>
                                        </div>
                                    </div>
                                    <div className="hidden md:block">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-brand-charcoal/20">Full Time Role</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-xs uppercase font-black tracking-widest text-brand-charcoal/40 mb-3">Role Overview</h4>
                                            <p className="text-brand-charcoal/70 font-light leading-relaxed">
                                                {vacancy.overview}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-xs uppercase font-black tracking-widest text-brand-charcoal/40 mb-3">Key Responsibilities</h4>
                                            <ul className="space-y-3">
                                                {vacancy.responsibilities.map((resp, i) => (
                                                    <li key={i} className="flex gap-3 text-brand-charcoal/70 text-sm font-light leading-relaxed">
                                                        <CheckCircle2 className="text-brand-gold shrink-0 mt-1" size={16} />
                                                        {resp}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs uppercase font-black tracking-widest text-brand-charcoal/40 mb-3">Requirements</h4>
                                        <ul className="space-y-3">
                                            {vacancy.requirements.map((req, i) => (
                                                <li key={i} className="flex gap-3 text-brand-charcoal/70 text-sm font-light leading-relaxed">
                                                    <CheckCircle2 className="text-brand-gold shrink-0 mt-1" size={16} />
                                                    {req}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How to Apply */}
            <section className="py-32 px-6 md:px-12 bg-logo-blue text-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-gold rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-[120px]" />
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <Briefcase className="mx-auto mb-10 text-brand-gold opacity-50" size={60} />
                    <h2 className="font-serif text-4xl md:text-6xl mb-8">How to Apply</h2>
                    <p className="text-white/60 text-xl font-light leading-relaxed mb-12">
                        If you are passionate about luxury hospitality and want to be part of an elite team architecting the future of travel in Sri Lanka, we want to hear from you.
                    </p>
                    <div className="space-y-6">
                        <p className="text-white/70">
                            Please send your CV and a brief cover letter to:
                        </p>
                        <a href="mailto:careers@nilathra.com" className="text-3xl md:text-4xl font-serif text-brand-gold hover:text-white transition-colors">
                            careers@nilathra.com
                        </a>
                        <div className="pt-12">
                            <Link href="/contact" className="luxury-button !bg-brand-gold !text-brand-green hover:!bg-white group">
                                General Inquiry <ArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}
