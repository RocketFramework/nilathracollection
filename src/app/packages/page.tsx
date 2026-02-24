import MainLayout from "@/components/layout/MainLayout";
import { Check, Gem, Star, Shield, LayoutGrid } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const tiers = [
    {
        name: "Super Luxury VIP",
        icon: Gem,
        price: "From $1,500 / night",
        description: "Reserved for the world's most discerning travelers. Experience absolute seclusion at properties like Amanwella or Ceylon Tea Trails, featuring private butler service and helicopter transfers.",
        image: "/images/hotel_resplendent.png",
        features: [
            "Stays at Relais & Châteaux and Aman properties",
            "Private villas with dedicated butler service",
            "Helicopter transfers & Luxury SUVs",
            "Dedicated professional travel guide (24/7 Availability)",
            "Fully personalized VIP airport handling",
            "Private dining & exclusive local access",
            "In-room wellness & curated spa journeys",
        ],
        cta: "Request VIP Consultation",
        href: "/plans/super-luxury-vip",
        color: "brand-green",
    },
    {
        name: "Deluxe Collection",
        icon: Star,
        price: "From $800 / night",
        description: "Refined luxury combining heritage and contemporary style. Featuring boutique gems such as Fort Bazaar in Galle and Wild Coast Tented Lodge.",
        image: "/images/hotel_boutique.png",
        features: [
            "Curated selection of premium 5-star boutiques",
            "Heritage suites and luxury tented camps",
            "Professional guide & premium transport",
            "Private cultural & historical immersions",
            "Gourmet culinary journeys and high teas",
            "Personalized concierge assistance",
            "Standard airport fast-track handling",
        ],
        cta: "Explore Deluxe Options",
        href: "/plans/deluxe-collection",
        color: "brand-charcoal",
    },
    {
        name: "Standard Premium",
        icon: Shield,
        price: "From $400 / night",
        description: "Excellence in comfort and service at Sri Lanka's leading 5-star establishments, including the historic Grand Hotel in Nuwara Eliya.",
        image: "/images/hotel_manor.png",
        features: [
            "Iconic 5-star hotels & manor houses",
            "Spacious premium rooms and suites",
            "Experienced chauffeur-guides",
            "Expertly planned essential excursions",
            "Authentic local insights and safe travel",
            "Priority service at all locations",
            "Standard high-quality dining options",
        ],
        cta: "View Standard Plans",
        href: "/plans/standard-premium",
        color: "brand-charcoal/80",
    },
    {
        name: "The Custom Mix",
        icon: LayoutGrid,
        price: "Variable Pricing",
        description: "The ultimate flexibility. Blend the seclusion of a private coastal villa with the charm of a colonial hill country estate.",
        image: "/images/hotel_coastal.png",
        features: [
            "Seamless mix of VIP and Deluxe tiers",
            "Total flexibility in property selection",
            "Custom transportation logic (Air/Land)",
            "Itinerary designed around specific properties",
            "In-depth consultation with travel experts",
            "Adjustable luxury levels per destination",
            "Personalized final proposal and pricing",
        ],
        cta: "Design Your Mix",
        href: "/custom-plan",
        color: "brand-gold",
    },
];

export default function PackagesPage() {
    return (
        <MainLayout>
            <section className="pt-32 pb-24 px-6 md:px-12 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <span className="section-subtitle">Choose Your Experience</span>
                        <h1 className="section-title">Travel Tiers</h1>
                        <p className="text-brand-charcoal/60 max-w-2xl mx-auto font-light text-lg italic">
                            "Luxury is personal. We offer four distinct ways to discover Sri Lanka, each crafted with our signature attention to detail."
                        </p>
                    </div>

                    <div className="space-y-24">
                        {tiers.map((tier, idx) => (
                            <div
                                key={tier.name}
                                className={`flex flex-col ${idx % 2 !== 0 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 items-center`}
                            >
                                <div className="flex-1 w-full h-[500px] relative rounded-sm overflow-hidden shadow-xl group">
                                    <Image
                                        src={tier.image}
                                        alt={tier.name}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-2 text-xs font-bold tracking-widest text-brand-green uppercase">
                                        {tier.price}
                                    </div>
                                </div>

                                <div className="flex-1 space-y-8">
                                    <div className="flex items-center gap-4">
                                        <tier.icon className="text-brand-gold" size={32} />
                                        <h2 className="font-serif text-4xl text-brand-green">{tier.name}</h2>
                                    </div>
                                    <p className="text-brand-charcoal/70 text-lg font-light leading-relaxed">
                                        {tier.description}
                                    </p>

                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {tier.features.map((feature) => (
                                            <li key={feature} className="flex gap-3 text-sm items-start">
                                                <Check size={16} className="text-brand-gold shrink-0 mt-0.5" />
                                                <span className="text-brand-charcoal/80">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href={tier.href}
                                        className="luxury-button inline-block !px-10"
                                    >
                                        {tier.cta}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Comparison Table Link CTA */}
            <section className="py-24 px-6 md:px-12 bg-brand-sand border-y border-brand-charcoal/5">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="font-serif text-3xl mb-8 text-brand-green">Need a tailored comparison?</h2>
                    <p className="text-brand-charcoal/60 mb-12">
                        Our luxury travel specialists are ready to walk you through the differences and find the perfect fit for your specific requirements.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                        <Link href="/contact" className="luxury-button-outline">
                            Speak with a Specialist
                        </Link>
                        <Link href="/custom-plan" className="luxury-button">
                            Get a Personalized Quote
                        </Link>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}
