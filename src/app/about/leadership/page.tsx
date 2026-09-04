import MainLayout from "@/components/layout/MainLayout";
import Image from "next/image";
import { CheckCircle2, Shield, Crown, Building2, Globe, Sparkles, ArrowRight } from "lucide-react";
import { Metadata } from "next";
import { headers } from "next/headers";
import { getDictionary } from "@/dictionaries";
import { I18nProvider } from "@/components/I18nProvider";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Executive Leadership | Nilathra Collection Sri Lanka",
    description: "Meet the executive steering committee and leadership team guiding Nilathra Collection's sovereign standards across luxury island operations and VIP travel curation.",
    alternates: {
        canonical: "https://www.nilathra.com/about/leadership",
    },
    openGraph: {
        title: "Executive Leadership | Nilathra Collection Sri Lanka",
        description: "Meet the executive steering committee and leadership team guiding Nilathra Collection's sovereign standards across luxury island operations and VIP travel curation.",
        url: "https://www.nilathra.com/about/leadership",
        siteName: "Nilathra Collection",
        images: [
            {
                url: "https://www.nilathra.com/images/hero_sigiriya_breakfast.avif",
                width: 1200,
                height: 630,
                alt: "Nilathra Collection Executive Leadership",
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

export default async function LeadershipPage() {
    const headersList = await headers();
    const locale = headersList.get('x-locale') || 'en';
    const dict = await getDictionary(locale);
    const ab = dict?.about || {};

    return (
        <I18nProvider dictionary={dict}>
            <MainLayout>
                {/* Hero Section */}
                <section className="relative h-[55vh] min-h-[400px] flex items-center justify-center overflow-hidden">
                    <Image
                        src="/images/hero_sigiriya_breakfast.avif"
                        alt="Nilathra Leadership Steering"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 cinematic-overlay" />
                    <div className="relative z-10 text-center text-white px-6 max-w-4xl">
                        <span className="section-subtitle !text-white/80">{ab.leadership_subtitle || "Executive Steering"}</span>
                        <h1 className="text-4xl md:text-6xl font-serif text-white mt-2 mb-4">{ab.leadership_title || "Our Leadership"}</h1>
                        <p className="text-white/80 text-base md:text-lg font-light max-w-2xl mx-auto leading-relaxed">
                            {ab.leadership_desc || "Guided by decades of corporate excellence and deep travel industry mastery, our leadership team combines strategic vision with meticulous operational focus to deliver Sri Lanka’s most trusted luxury journeys."}
                        </p>
                    </div>
                </section>

                {/* Main Leadership Grid */}
                <section className="py-24 px-6 md:px-12 bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-gold/10 rounded-full blur-[140px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-green/20 rounded-full blur-[140px] pointer-events-none" />

                    <div className="max-w-7xl mx-auto relative z-10">
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

                {/* Executive Stewardship & Guarantee */}
                <section className="py-20 px-6 md:px-12 bg-[#F7F5F0] border-t border-brand-charcoal/5">
                    <div className="max-w-5xl mx-auto text-center space-y-8">
                        <span className="text-brand-gold text-xs font-bold uppercase tracking-[0.3em] block">
                            Direct Senior Accountability
                        </span>
                        <h2 className="font-serif text-3xl md:text-5xl text-brand-green">
                            Undivided Senior Director Stewardship
                        </h2>
                        <p className="text-brand-charcoal/70 text-base md:text-lg font-light leading-relaxed max-w-3xl mx-auto">
                            Unlike traditional mass travel agencies, every journey curated by Nilathra Collection is supervised directly by our senior leadership team. You have direct 1:1 access to our ground directors—ensuring zero call-center delays and total transparency at every touchpoint.
                        </p>
                        <div className="pt-4 flex flex-wrap items-center justify-center gap-6">
                            <Link
                                href="/custom-plan"
                                className="luxury-button bg-brand-green text-white hover:bg-brand-green/90 text-sm inline-flex items-center gap-2"
                            >
                                <span>Plan Your Journey With Us</span>
                                <ArrowRight size={16} />
                            </Link>
                            <Link
                                href="/about"
                                className="text-sm font-medium uppercase tracking-widest text-brand-green hover:text-brand-gold transition-colors"
                            >
                                Explore Our Legacy & Pillars →
                            </Link>
                        </div>
                    </div>
                </section>

                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "AboutPage",
                            "name": "Leadership - Nilathra Collection",
                            "url": "https://www.nilathra.com/about/leadership",
                            "description": "Executive leadership team and steering committee at Nilathra Collection.",
                            "publisher": {
                                "@type": "TravelAgency",
                                "name": "Nilathra Collection",
                                "url": "https://www.nilathra.com",
                                "telephone": "+94777278282"
                            }
                        }),
                    }}
                />
            </MainLayout>
        </I18nProvider>
    );
}
