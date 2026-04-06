"use client";

import MainLayout from "@/components/layout/MainLayout";
import Hero from "@/components/home/Hero";
import PackagesSection from "@/components/home/PackagesSection";
import DestinationsSection from "@/components/home/DestinationsSection";
import { ArrowRight, Quote, Shield, Crown, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useTranslation } from "@/components/I18nProvider";

const experienceAssets = [
  { src: "/images/hero_ultra_vip.avif", label: "Private Aviation" },
  { src: "/images/luxury_transport_fleet_sl_1773073885754.avif", label: "Limo & SUV Fleet" },
  { src: "/images/kandyan_dancers_luxury_welcome_1773073904824.avif", label: "Cultural Welcome" },
  { src: "/images/private_chef_luxury_dining_1773073921412.avif", label: "Bespoke Culinary" },
  { src: "/images/bespoke_gem_jewelry_experience_1773073939946.avif", label: "Gem Curation" },
  { src: "/images/luxury_massage_spa_serenity_1773073961558.avif", label: "Ayurvedic Spa" },
  { src: "/images/luxury_bedroom_mountain_view_1773073980186.avif", label: "Sovereign Sanctuary" },
];

function ExperienceGallery() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % experienceAssets.length);
    }, 4500); // Elegant, slow cinematic timing
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[500px] md:h-[600px] lg:h-[750px] rounded-[4px] overflow-hidden bg-brand-charcoal shadow-2xl">
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          className="absolute inset-0 w-full h-full"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <Image
            src={experienceAssets[currentIndex].src}
            alt={experienceAssets[currentIndex].label}
            fill
            className="object-cover"
            priority={currentIndex === 0}
          />

          {/* Elegant typography overlay at the bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8 md:p-12">
            <div className="flex items-center gap-4 lg:gap-6">
              <span className="text-brand-gold font-serif italic text-xl md:text-2xl">
                {String(currentIndex + 1).padStart(2, '0')} <span className="opacity-40 text-sm md:text-base pl-1">/ {String(experienceAssets.length).padStart(2, '0')}</span>
              </span>
              <div className="h-px w-8 md:w-12 bg-brand-gold/50" />
              <span className="text-white text-xs md:text-sm tracking-[0.2em] uppercase font-light drop-shadow-md">
                {experienceAssets[currentIndex].label}
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function HomeClient() {
  const t = useTranslation();
  return (
    <MainLayout>
      <Hero />

      {/* Brand Story Section */}
      <section className="py-24 px-6 md:px-12 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <span className="section-subtitle">{t.home.brand_subtitle}</span>
            <h2 className="section-title">{t.home.brand_title}</h2>
            <div className="space-y-6 text-brand-charcoal/70 font-light leading-relaxed text-lg">
              <p>
                {t.home.brand_p1}
              </p>
              <p>
                {t.home.brand_p2}
              </p>
              <p>
                {t.home.brand_p3}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 pt-6">
              <div>
                <h4 className="font-serif text-3xl text-brand-green mb-1">12+</h4>
                <p className="text-xs uppercase tracking-widest text-brand-charcoal/40 font-bold">{t.home.years}</p>
              </div>
            </div>
          </motion.div>

          {/* Experience Gallery - The Bento Spread */}
          <div className="relative w-full flex items-center justify-center lg:justify-end">
            <ExperienceGallery />
          </div>
        </div>
      </section>

      {/* The Nilathra Standard - New SEO Section */}
      <section className="py-24 px-6 md:px-12 bg-logo-blue text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-brand-gold text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">{t.home.stand_subtitle}</span>
            <h2 className="font-serif text-4xl md:text-6xl mb-6">{t.home.stand_title}</h2>
            <p className="text-white/60 max-w-3xl mx-auto font-light leading-relaxed">
              {t.home.stand_desc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: "Unyielding Reliability",
                icon: Shield,
                text: "In an unpredictable world, Nilathra stands as your constant. We maintain direct relationships with every vendor, from private jet handlers to boutique estate owners. This ensures that every promise made is a promise kept, backed by 24/7 on-ground logistical support and real-time response teams."
              },
              {
                title: "Sovereign Exclusivity",
                icon: Crown,
                text: "Privacy is the ultimate luxury. Our Ultra VIP and Luxury collections are built around the concept of the 'Sovereign Sanctuary'. We specialize in property buyouts, private transport lanes, and absolute identity protection, ensuring your presence on the island remains as discreet as you desire."
              },
              {
                title: "Absolute Authenticity",
                icon: Star,
                text: "We reject the generic. Every Nilathra journey is infused with the genuine spirit of Sri Lanka. Whether it's a private Kandyan dance performance at your hotel or a sunrise meditation session with a local monk, our experiences are curated to provide deep, meaningful connections to the island's heritage."
              }
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="space-y-6"
              >
                <item.icon className="text-brand-gold" size={40} />
                <h3 className="text-2xl font-serif">{item.title}</h3>
                <p className="text-white/60 font-light leading-relaxed text-sm">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <PackagesSection />

      {/* SEO Rich Text Section */}
      <section className="py-24 px-6 md:px-12 bg-neutral-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-5xl font-serif text-logo-blue leading-tight">
                {t.home.seo_subtitle} <br />
                <span className="text-brand-gold italic">{t.home.seo_title2}</span>
              </h2>
              <p className="text-neutral-600 font-light leading-relaxed">
                {t.home.seo_p1}
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                {["VIP Concierge", "Private Jet Charters", "Security Detail", "Luxury Villa Buyouts"].map((service) => (
                  <span key={service} className="px-5 py-2 bg-white rounded-full text-[11px] font-bold uppercase tracking-widest text-logo-blue border border-neutral-100 shadow-sm">
                    {service}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-8 text-neutral-500 font-light text-sm leading-relaxed border-l border-neutral-200 pl-8 lg:pl-16">
              <p>
                {t.home.seo_p2}
              </p>
              <p>
                {t.home.seo_p3}
              </p>
              <Link href="/blog" className="inline-flex items-center gap-2 text-logo-blue font-bold uppercase tracking-widest text-[10px] hover:gap-4 transition-all">
                {t.home.read_journal} <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <DestinationsSection />

      {/* FAQ Section - New SEO Section */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-subtitle">{t.home.faq_subtitle}</span>
            <h2 className="section-title">{t.home.faq_title}</h2>
            <p className="text-brand-charcoal/60 font-light mt-4">
              {t.home.faq_desc}
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                q: "What makes Nilathra's Ultra VIP package different from standard luxury travel?",
                a: "Standard luxury focus on hotels; Ultra VIP focus on sovereignty. We provide jet-side tarmac clearance, standby helicopters, and total estate buyouts. You don't just stay in a hotel; you own the property for the duration of your stay, supported by a 6-member chef team and absolute security detail."
              },
              {
                q: "How does Nilathra ensure the security of international high-profile guests?",
                a: "We employ highly trained Close Protection Details (CPD) and utilize B6/B7 armored vehicles for ground movement. Our logistical planning ensures discreet entry and exit points, and we work under strict Non-Disclosure Agreements (NDAs) to protect our clients' identities at all times."
              },
              {
                q: "Can I customize a journey that blends different luxury tiers?",
                a: "Absolutely. Our 'Mixed Collection' is specifically designed for total fluidity. You might choose Ultra VIP transport with Luxury Collection resort stays, or balance the intensity of cultural exploration with the serenity of a 5-star spa retreat. We architect the masterplan around your specific rhythm."
              },
              {
                q: "Is Sri Lanka a suitable destination for family luxury travel?",
                a: "Sri Lanka is exceptional for families. Our Premium and Luxury plans offer spacious multi-room suites, child-friendly logistics, and curated educational experiences such as turtle hatchery visits and junior ranger safari programs, all managed with 24/7 driver-guide support."
              },
              {
                q: "What is the best time of year to visit Sri Lanka for a luxury escape?",
                a: "Sri Lanka is a year-round destination thanks to its dual monsoon system. For the South and West coasts (Galle, Colombo, Yala), the ideal window is December to April. For the East coast and ancient cities, May to September offers pristine weather. We adjust your itinerary to match the best seasonal horizons."
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group border-b border-brand-sand pb-8"
              >
                <h3 className="font-serif text-xl text-logo-blue mb-4 flex items-center gap-3">
                  <span className="text-brand-gold font-sans font-black text-xs">Q.</span> {item.q}
                </h3>
                <div className="pl-6 border-l-2 border-brand-gold/20 flex gap-3">
                  <p className="text-brand-charcoal/70 text-sm font-light leading-relaxed">
                    {item.a}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials / Trust Section */}
      <section className="py-24 bg-brand-green text-white px-6 md:px-12 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-gold rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-[120px]" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <Quote className="mx-auto mb-10 text-brand-gold opacity-50" size={60} />
          <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-12">
            {t.home.quote}
          </h2>
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-brand-gold p-1">
              <div className="w-full h-full rounded-full overflow-hidden relative">
                <Image src="/images/tier_vip.avif" alt="Client" fill className="object-cover" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-medium tracking-wide text-lg">David Montgomery</p>
              <p className="text-brand-gold/70 text-xs uppercase tracking-[0.3em]">London, UK</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 px-6 md:px-12 bg-white">
        <div className="max-w-5xl mx-auto glass-card p-12 md:p-24 rounded-sm text-center relative overflow-hidden bg-brand-sand/30">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-gold" />
          <span className="section-subtitle">{t.home.cta_subtitle}</span>
          <h2 className="section-title !text-5xl md:!text-7xl mb-8">{t.home.cta_title}</h2>
          <p className="text-brand-charcoal/60 text-xl max-w-2xl mx-auto mb-12 font-light">
            {t.home.cta_desc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/custom-plan" className="luxury-button !px-12 !py-5 text-lg">
              {t.home.cta_btn1}
            </Link>
            <Link href="/contact" className="luxury-button-outline !px-12 !py-5 text-lg">
              {t.home.cta_btn2}
            </Link>
          </div>
        </div>
      </section>

      {/* Structured Data (Schema.org) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TravelAgency",
            "name": "Nilathra Collection",
            "description": "The best travel agency in Sri Lanka specializing in luxury, curated, and VIP travel experiences.",
            "url": "https://nilathra.com",
            "telephone": "+94777278282",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Colombo",
              "addressCountry": "LK"
            },
            "image": "https://nilathra.com/images/luxury_resort_sunset.avif",
            "priceRange": "$$$$"
          }),
        }}
      />
    </MainLayout>
  );
}
