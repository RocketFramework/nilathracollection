import MainLayout from "@/components/layout/MainLayout";
import Image from "next/image";
import { Award, ShieldCheck, HeartHandshake, Map } from "lucide-react";

export default function AboutPage() {
    return (
        <MainLayout>
            {/* Hero Section */}
            <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
                <Image
                    src="/images/hero_sigiriya_breakfast.png"
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
                        Based in Colombo, our team consists of local experts, historians, and hospitality veterans who understand the nuances of the island. We don't just book hotels; we relationships. We don't just plan routes; we curate narratives.
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

            {/* Team / Expertise */}
            <section className="py-24 px-6 md:px-12 bg-brand-sand">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center">
                    <div className="flex-1">
                        <div className="relative h-[500px] w-full rounded-sm overflow-hidden">
                            <Image
                                src="/images/yala_hero.png"
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
