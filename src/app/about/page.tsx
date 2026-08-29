import MainLayout from "@/components/layout/MainLayout";
import Image from "next/image";
import { Award, ShieldCheck, HeartHandshake, Map, CheckCircle2, Crown, Globe, Building2, Sparkles, Clock, Coins, UserCheck, Compass } from "lucide-react";
import { Metadata } from "next";
import { headers } from "next/headers";
import { getDictionary } from "@/dictionaries";
import { I18nProvider } from "@/components/I18nProvider";

export const metadata: Metadata = {
    title: "About Us | Sri Lanka's Premier Travel Curator & Independent DMC",
    description: "Learn about Nilathra Collection's evolution from a trusted local execution engine for international ultra-luxury tour operators into an independent Destination Management Company.",
    alternates: {
        canonical: "https://www.nilathra.com/about",
    },
    openGraph: {
        title: "About Us | Sri Lanka's Premier Travel Curator & Independent DMC",
        description: "Learn about Nilathra Collection's evolution from a trusted local execution engine for international ultra-luxury tour operators into an independent Destination Management Company.",
        url: "https://www.nilathra.com/about",
        siteName: "Nilathra Collection",
        images: [
            {
                url: "https://www.nilathra.com/images/hero_sigiriya_breakfast.avif",
                width: 1200,
                height: 630,
                alt: "Nilathra Collection Luxury Hospitality in Sri Lanka",
            },
        ],
        type: "website",
    },
};

const leadershipTeam = [
    {
        name: "Nirosh Li",
        role: "Managing Director",
        image: "/images/team/nirosh-li-v2.webp",
        bio: "With over 20 years of executive corporate leadership and strategic enterprise management across major conglomerates and hospitality investments, Nirosh steers Nilathra Collection's global vision. His expertise in executive governance, cross-border luxury partnerships, and ultra-high-net-worth client relations ensures an unparalleled standard of excellence across all island operations.",
        highlights: ["20+ Years Executive Leadership", "Strategic Corporate Governance", "Ultra-Luxury Island Buyouts"],
        badge: "Executive Leadership"
    },
    {
        name: "Wajira Di",
        role: "Chief Financial Officer",
        image: "/images/team/wajira-di-cfo-v2.webp",
        bio: "A seasoned corporate finance strategist and Chartered Accountant with 15+ years of experience in capital allocation, global treasury management, and financial compliance across luxury hospitality assets and travel infrastructure. Wajira guarantees flawless transaction security, price integrity, and financial strength for the agency.",
        highlights: ["15+ Years Finance & Governance", "Chartered Accountant (FCA)", "VIP Financial Escrow & Audit"],
        badge: "Finance & Strategy"
    },
    {
        name: "Saliya Vi",
        role: "Head of Marketing & Head of Maldives Office",
        image: "/images/team/saliya-vi-marketing-v2.webp",
        bio: "A dynamic brand architect and travel executive with 12+ years of experience in global marketing strategy and luxury hospitality management. In addition to driving Nilathra Collection’s international marketing vision, Saliya heads our Male' regional office, overseeing Maldives operations, private seaplane charters, and overwater villa retreats.",
        highlights: ["12+ Years Brand & Regional Leadership", "Global Marketing Strategy", "Male' Office Operations"],
        badge: "Marketing & Maldives Ops"
    },
    {
        name: "Nimali Ra",
        role: "Head of Sales",
        image: "/images/team/nimali-ra-v2.webp",
        bio: "Bringing 16+ years of specialized experience in luxury travel sales, corporate guest relations, and high-value concierge management, Nimali leads our sales division. She specializes in crafting customized high-tier itineraries and maintaining seamless relationships with premier global travel advisors.",
        highlights: ["16+ Years Travel Sales", "Bespoke Itinerary Curation", "24/7 VIP Concierge Excellence"],
        badge: "Sales & Client Relations"
    },
    {
        name: "Janaka Cha",
        role: "Manager Operations",
        image: "/images/team/janaka-cha-ops-v2.webp",
        bio: "A master of ground logistics and expedition management with 13+ years in complex fleet operations, private aviation ground handling, and VIP security protocols. Janaka leads our real-time ground operations, ensuring flawless execution, chauffeur-guide precision, and complete safety across every journey.",
        highlights: ["18+ Years Travel Operations", "Chauffeur & Fleet Management", "VIP Aviation & Ground Logistics"],
        badge: "Operations & Logistics"
    },
    {
        name: "Mahasen Ka",
        role: "Senior Manager Human Resource",
        image: "/images/team/mahasen-ka.webp",
        bio: "An accomplished human resource strategist with over 15 years of leadership in talent development, executive recruitment, and organizational culture across premium luxury hotel chains and travel corporations. Mahasen oversees Nilathra Collection’s human capital, spearheading our elite concierge training academy and driving service excellence standards across all team touchpoints.",
        highlights: ["15+ Years Hospitality HR", "Concierge Training Academy", "Executive Talent & Culture"],
        badge: "People & Talent"
    }
];

export default async function AboutPage() {
    const headersList = await headers();
    const locale = headersList.get('x-locale') || 'en';
    const dict = await getDictionary(locale);
    const ab = dict?.about || {};

    const evolutionPillars = ab.evolution_pillars || [
        {
            title: "Proven Local Heritage",
            desc: "Years of experience serving as the execution engine for premier international ultra-luxury tour brands."
        },
        {
            title: "Direct Sovereign Access",
            desc: "Unfiltered relationships with private estate owners, helipad operators, and unlisted coastal villas."
        },
        {
            title: "Unmatched Discretion",
            desc: "Strict NDA protocols, B6/B7 armored transport options, and private tarmac escort clearance."
        },
        {
            title: "Twin-Island Masterplans",
            desc: "Dedicated Colombo headquarters and Male' desk for seamless Sri Lanka & Maldives dual escapes."
        }
    ];

    const scarcityCards = ab.scarcity_cards || [
        {
            metric: "Max 12–15 Journeys / Month",
            title: "Strict Operation Intake Cap",
            desc: "We deliberately limit active monthly masterplans so senior directors maintain 100% real-time focus on every single traveler."
        },
        {
            metric: "24/7 Global Time-Zone Sync",
            title: "Your Time Zone is Our Working Hour",
            desc: "Whether it is midday in New York, London, or Paris—or midnight in Colombo—our concierges and ground directors are awake, active, and coordinating in real time."
        },
        {
            metric: "$10,000 – $100,000+",
            title: "Sovereign Investment Floor",
            desc: "Engineered strictly for top-tier luxury ($$$$$), featuring full colonial estate buyouts, helicopter safaris, and dedicated private staff."
        },
        {
            metric: "1 : 1 Executive Stewardship",
            title: "Undivided Senior Director Focus",
            desc: "Direct 1:1 access to senior travel leaders like Nimali, Sonali, and Janaka—never an automated call center or third-party delay."
        }
    ];

    const pillarIcons = [Building2, Crown, ShieldCheck, Globe];
    const scarcityIcons = [Compass, Clock, Coins, UserCheck];

    return (
        <I18nProvider dictionary={dict}>
            <MainLayout>
                {/* Hero Section */}
                <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
                    <Image
                        src="/images/hero_sigiriya_breakfast.avif"
                        alt="Luxury hospitality"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 cinematic-overlay" />
                    <div className="relative z-10 text-center text-white px-6">
                        <span className="section-subtitle !text-white/80">{ab.hero_subtitle || "From Silent Mastery to Sovereign Leadership"}</span>
                        <h1 className="text-5xl md:text-7xl font-serif">{ab.hero_title || "Our Legacy & Evolution"}</h1>
                    </div>
                </section>

                {/* Brand Philosophy */}
                <section className="py-24 px-6 md:px-12 bg-white">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="section-title mb-10">{ab.philosophy_title || "Stepping Out into the Light"}</h2>
                        <p className="text-xl text-brand-charcoal/70 font-light leading-relaxed mb-8">
                            {ab.philosophy_p1 || "For years, our team operated behind the scenes as the trusted local execution engine and ground partner for renowned international ultra-luxury tour operators. Working under their banner, we quietly delivered uncompromised travel experiences for High-Net-Worth (HNW) and Ultra-High-Net-Worth (UHNW) individuals across Sri Lanka—mastering VIP aviation, estate buyouts, close-protection security, and bespoke culinary programming."}
                        </p>
                        <p className="text-brand-charcoal/60 leading-relaxed mb-12">
                            {ab.philosophy_p2 || "Having perfected the art of ultra-luxury island travel over years of silent excellence, we have stepped out from under the shadow to establish Nilathra Collection as a fully independent Destination Management Company (DMC). Focused exclusively on luxury and ultra-luxury tours, we now bring our insider access, deep local relationships, and sovereign standards directly to our global clientele."}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mt-20">
                            <div className="space-y-4">
                                <Award className="mx-auto text-brand-gold" size={40} />
                                <h4 className="font-serif text-lg">{ab.values?.excellence || "Excellence"}</h4>
                                <p className="text-xs text-brand-charcoal/50 uppercase tracking-widest">{ab.values?.excellence_sub || "Global Standards"}</p>
                            </div>
                            <div className="space-y-4">
                                <ShieldCheck className="mx-auto text-brand-gold" size={40} />
                                <h4 className="font-serif text-lg">{ab.values?.trust || "Trust"}</h4>
                                <p className="text-xs text-brand-charcoal/50 uppercase tracking-widest">{ab.values?.trust_sub || "Reliable Service"}</p>
                            </div>
                            <div className="space-y-4">
                                <HeartHandshake className="mx-auto text-brand-gold" size={40} />
                                <h4 className="font-serif text-lg">{ab.values?.personalized || "Personalized"}</h4>
                                <p className="text-xs text-brand-charcoal/50 uppercase tracking-widest">{ab.values?.personalized_sub || "Tailored For You"}</p>
                            </div>
                            <div className="space-y-4">
                                <Map className="mx-auto text-brand-gold" size={40} />
                                <h4 className="font-serif text-lg">{ab.values?.expertise || "Expertise"}</h4>
                                <p className="text-xs text-brand-charcoal/50 uppercase tracking-widest">{ab.values?.expertise_sub || "Local Insight"}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Evolution & Pillars Section */}
                <section className="py-20 px-6 md:px-12 bg-[#F7F5F0] border-y border-brand-charcoal/5 relative overflow-hidden">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                            <span className="text-brand-gold text-xs font-bold uppercase tracking-[0.3em] block">
                                {ab.evolution_subtitle || "The Independent Difference"}
                            </span>
                            <h2 className="font-serif text-3xl md:text-5xl text-brand-green">
                                {ab.evolution_title || "Our Evolution & Pillars"}
                            </h2>
                            <p className="text-brand-charcoal/70 text-base md:text-lg font-light leading-relaxed font-serif italic">
                                {ab.evolution_desc || "Built on decades of handling high-net-worth global clientele, our independent model eliminates middle-man friction and guarantees uncompromised access."}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {evolutionPillars.map((pillar: any, idx: number) => {
                                const IconComponent = pillarIcons[idx % pillarIcons.length];
                                return (
                                    <div
                                        key={idx}
                                        className="bg-white p-8 rounded-sm border border-brand-charcoal/5 shadow-sm hover:border-brand-gold/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                                    >
                                        <div className="space-y-4">
                                            <div className="w-12 h-12 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center">
                                                <IconComponent size={24} />
                                            </div>
                                            <h3 className="font-serif text-xl text-brand-green font-bold">
                                                {pillar.title}
                                            </h3>
                                            <p className="text-brand-charcoal/70 text-sm font-light leading-relaxed">
                                                {pillar.desc}
                                            </p>
                                        </div>
                                        <div className="pt-6 mt-6 border-t border-brand-charcoal/5 flex items-center justify-between text-xs text-brand-gold font-bold uppercase tracking-wider">
                                            <span>Pillar 0{idx + 1}</span>
                                            <Sparkles size={14} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Deliberate Scarcity & VIP Service Guarantees Section */}
                <section className="py-24 px-6 md:px-12 bg-gradient-to-b from-[#0D1813] via-brand-green to-[#0D1813] text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-gold/10 rounded-full blur-[140px] pointer-events-none" />
                    
                    <div className="max-w-6xl mx-auto relative z-10 space-y-16">
                        <div className="text-center max-w-3xl mx-auto space-y-4">
                            <span className="text-brand-gold text-xs font-bold uppercase tracking-[0.3em] block">
                                {ab.scarcity_subtitle || "Controlled Volume & VIP Guarantees"}
                            </span>
                            <h2 className="font-serif text-3xl md:text-5xl text-white">
                                {ab.scarcity_title || "Deliberate Scarcity & Service Standards"}
                            </h2>
                            <p className="text-white/70 text-base md:text-lg font-light leading-relaxed font-serif italic">
                                {ab.scarcity_desc || "We do not aspire to be the largest tour operator in Sri Lanka—we choose to be the most refined. By strictly limiting our active journey intake and aligning with your time zone, every traveler receives undivided executive stewardship."}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {scarcityCards.map((card: any, idx: number) => {
                                const CardIcon = scarcityIcons[idx % scarcityIcons.length];
                                return (
                                    <div
                                        key={idx}
                                        className="bg-white/5 border border-white/10 p-8 rounded-sm hover:border-brand-gold/50 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between group"
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

                {/* Our Leadership Section */}
                <section className="py-24 px-6 md:px-12 bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-green/20 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <span className="section-subtitle !text-brand-gold">{ab.leadership_subtitle || "Executive Steering"}</span>
                            <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">{ab.leadership_title || "Our Leadership"}</h2>
                            <p className="text-white/70 text-lg font-light leading-relaxed">
                                {ab.leadership_desc || "Guided by decades of corporate excellence and deep travel industry mastery, our leadership team combines strategic vision with meticulous operational focus to deliver Sri Lanka’s most trusted luxury journeys."}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {leadershipTeam.map((member) => (
                                <div 
                                    key={member.name}
                                    className="bg-slate-800/80 border border-slate-700/60 rounded-xl overflow-hidden shadow-2xl flex flex-col hover:border-brand-gold/50 transition-all duration-300 group"
                                >
                                    <div className="relative h-80 w-full overflow-hidden bg-slate-950">
                                        <Image
                                            src={member.image}
                                            alt={member.name}
                                            fill
                                            className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                                        <div className="absolute top-4 left-4">
                                            <span className="px-3 py-1 bg-brand-gold/90 text-slate-950 text-xs font-semibold uppercase tracking-wider rounded-full shadow-md backdrop-blur-sm">
                                                {member.badge}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                                        <div>
                                            <h3 className="text-2xl font-serif font-bold text-white group-hover:text-brand-gold transition-colors">
                                                {member.name}
                                            </h3>
                                            <p className="text-brand-gold font-medium text-sm tracking-wide mt-1">
                                                {member.role}
                                            </p>

                                            <p className="text-slate-300 text-sm leading-relaxed font-light mt-4">
                                                {member.bio}
                                            </p>
                                        </div>

                                        <div className="pt-4 border-t border-slate-700/60 space-y-2">
                                            {member.highlights.map((item, i) => (
                                                <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                                                    <CheckCircle2 size={14} className="text-brand-gold shrink-0" />
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Team / Expertise */}
                <section className="py-24 px-6 md:px-12 bg-brand-sand">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center">
                        <div className="flex-1">
                            <div className="relative h-[500px] w-full rounded-sm overflow-hidden">
                                <Image
                                    src="/images/yala_hero.avif"
                                    alt="Expert guide"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>
                        <div className="flex-1 space-y-6">
                            <span className="section-subtitle">{ab.wisdom_subtitle || "Local Wisdom"}</span>
                            <h2 className="section-title">{ab.wisdom_title || "Beyond the Guidebooks"}</h2>
                            <p className="text-brand-charcoal/70 leading-relaxed">
                                {ab.wisdom_p1 || "Our guides are more than just navigators; they are storytellers. Whether it's a private tour of the Galle Fort with a local historian or a sunrise trek in the Knuckles Range with a wildlife specialist, we ensure you see Sri Lanka through the eyes of those who love it most."}
                            </p>
                            <p className="text-brand-charcoal/70 leading-relaxed">
                                {ab.wisdom_p2 || "We maintain an exclusive network of boutique properties and private villas, many of which are not available on public booking platforms. This exclusivity is the cornerstone of the Nilathra experience."}
                            </p>
                        </div>
                    </div>
                </section>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "AboutPage",
                            "name": "About Nilathra Collection",
                            "url": "https://www.nilathra.com/about",
                            "description": "Learn about Nilathra Collection's evolution from a trusted local execution engine for international ultra-luxury tour operators into an independent Destination Management Company.",
                            "publisher": {
                                "@type": "TravelAgency",
                                "name": "Nilathra Collection",
                                "url": "https://www.nilathra.com",
                                "telephone": "+94777278282",
                                "priceRange": "$$$$$"
                            }
                        }),
                    }}
                />
            </MainLayout>
        </I18nProvider>
    );
}

