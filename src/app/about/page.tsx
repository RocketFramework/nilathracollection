import MainLayout from "@/components/layout/MainLayout";
import Image from "next/image";
import { Award, ShieldCheck, HeartHandshake, Map, CheckCircle2 } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Us | Sri Lanka's Premier Travel Curator",
    description: "Learn about Nilathra Collection, our philosophy of unfiltered luxury, and our executive leadership team of local travel experts curating heritage journeys in Sri Lanka.",
};

const leadershipTeam = [
    {
        name: "Nirosh Li",
        role: "Managing Director",
        image: "/images/team/nirosh-li-v2.jpg",
        bio: "With over 20 years of executive corporate leadership and strategic enterprise management across major conglomerates and hospitality investments, Nirosh steers Nilathra Collection's global vision. His expertise in executive governance, cross-border luxury partnerships, and ultra-high-net-worth client relations ensures an unparalleled standard of excellence across all island operations.",
        highlights: ["20+ Years Executive Leadership", "Strategic Corporate Governance", "Ultra-Luxury Island Buyouts"],
        badge: "Executive Leadership"
    },
    {
        name: "Wajira Di",
        role: "Chief Financial Officer",
        image: "/images/team/wajira-di-cfo-v2.jpg",
        bio: "A seasoned corporate finance strategist and Chartered Accountant with 15+ years of experience in capital allocation, global treasury management, and financial compliance across luxury hospitality assets and travel infrastructure. Wajira guarantees flawless transaction security, price integrity, and financial strength for the agency.",
        highlights: ["15+ Years Finance & Governance", "Chartered Accountant (FCA)", "VIP Financial Escrow & Audit"],
        badge: "Finance & Strategy"
    },
    {
        name: "Saliya Vi",
        role: "Head of Marketing",
        image: "/images/team/saliya-vi-marketing-v2.jpg",
        bio: "A dynamic brand architect with 12+ years in global marketing strategy, luxury destination positioning, and high-impact digital acquisition. Saliya drives Nilathra Collection’s international visibility, spearheading marketing campaigns that connect ultra-discerning global travellers with Sri Lanka's most exclusive experiences.",
        highlights: ["12+ Years Brand Strategy", "Luxury Tourism Marketing", "Global Partner Networks"],
        badge: "Brand & Growth"
    },
    {
        name: "Nimali Ra",
        role: "Head of Sales",
        image: "/images/team/nimali-ra-v2.jpg",
        bio: "Bringing 16+ years of specialized experience in luxury travel sales, corporate guest relations, and high-value concierge management, Nimali leads our sales division. She specializes in crafting customized high-tier itineraries and maintaining seamless relationships with premier global travel advisors.",
        highlights: ["16+ Years Travel Sales", "Bespoke Itinerary Curation", "24/7 VIP Concierge Excellence"],
        badge: "Sales & Client Relations"
    },
    {
        name: "Janaka Cha",
        role: "Manager Operations",
        image: "/images/team/janaka-cha-ops-v2.jpg",
        bio: "A master of ground logistics and expedition management with 13+ years in complex fleet operations, private aviation ground handling, and VIP security protocols. Janaka leads our real-time ground operations, ensuring flawless execution, chauffeur-guide precision, and complete safety across every journey.",
        highlights: ["18+ Years Travel Operations", "Chauffeur & Fleet Management", "VIP Aviation & Ground Logistics"],
        badge: "Operations & Logistics"
    },
    {
        name: "Mahasen Ka",
        role: "Senior Manager Human Resource",
        image: "/images/team/mahasen-ka.png",
        bio: "An accomplished human resource strategist with over 15 years of leadership in talent development, executive recruitment, and organizational culture across premium luxury hotel chains and travel corporations. Mahasen oversees Nilathra Collection’s human capital, spearheading our elite concierge training academy and driving service excellence standards across all team touchpoints.",
        highlights: ["15+ Years Hospitality HR", "Concierge Training Academy", "Executive Talent & Culture"],
        badge: "People & Talent"
    }
];

export default function AboutPage() {
    return (
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
                    <span className="section-subtitle !text-white/80">The Collection</span>
                    <h1 className="text-5xl md:text-7xl font-serif">Our Story</h1>
                </div>
            </section>

            {/* Brand Philosophy */}
            <section className="py-24 px-6 md:px-12 bg-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="section-title mb-10">Luxury Unfiltered</h2>
                    <p className="text-xl text-brand-charcoal/70 font-light leading-relaxed mb-8">
                        Nilathra Collection was born from a passion to showcase Sri Lanka in its purest, most elegant form. We believe that true luxury is not just about the finest sheets or the most expensive cars—it's about the access to authentic, soul-stirring experiences that remain etched in memory.
                    </p>
                    <p className="text-brand-charcoal/60 leading-relaxed mb-12">
                        Based in Colombo, our team consists of local experts, historians, and hospitality veterans who understand the nuances of the island. We don't just book hotels; we curate relationships. We don't just plan routes; we curate narratives.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mt-20">
                        <div className="space-y-4">
                            <Award className="mx-auto text-brand-gold" size={40} />
                            <h4 className="font-serif text-lg">Excellence</h4>
                            <p className="text-xs text-brand-charcoal/50 uppercase tracking-widest">Global Standards</p>
                        </div>
                        <div className="space-y-4">
                            <ShieldCheck className="mx-auto text-brand-gold" size={40} />
                            <h4 className="font-serif text-lg">Trust</h4>
                            <p className="text-xs text-brand-charcoal/50 uppercase tracking-widest">Reliable Service</p>
                        </div>
                        <div className="space-y-4">
                            <HeartHandshake className="mx-auto text-brand-gold" size={40} />
                            <h4 className="font-serif text-lg">Personalized</h4>
                            <p className="text-xs text-brand-charcoal/50 uppercase tracking-widest">Tailored For You</p>
                        </div>
                        <div className="space-y-4">
                            <Map className="mx-auto text-brand-gold" size={40} />
                            <h4 className="font-serif text-lg">Expertise</h4>
                            <p className="text-xs text-brand-charcoal/50 uppercase tracking-widest">Local Insight</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Leadership Section */}
            <section className="py-24 px-6 md:px-12 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-green/20 rounded-full blur-3xl pointer-events-none" />
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <span className="section-subtitle !text-brand-gold">Executive Steering</span>
                        <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">Our Leadership</h2>
                        <p className="text-white/70 text-lg font-light leading-relaxed">
                            Guided by decades of corporate excellence and deep travel industry mastery, our leadership team combines strategic vision with meticulous operational focus to deliver Sri Lanka’s most trusted luxury journeys.
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
                        <span className="section-subtitle">Local Wisdom</span>
                        <h2 className="section-title">Beyond the Guidebooks</h2>
                        <p className="text-brand-charcoal/70 leading-relaxed">
                            Our guides are more than just navigators; they are storytellers. Whether it's a private tour of the Galle Fort with a local historian or a sunrise trek in the Knuckles Range with a wildlife specialist, we ensure you see Sri Lanka through the eyes of those who love it most.
                        </p>
                        <p className="text-brand-charcoal/70 leading-relaxed">
                            We maintain an exclusive network of boutique properties and private villas, many of which are not available on public booking platforms. This exclusivity is the cornerstone of the Nilathra experience.
                        </p>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}

