"use client";

import MainLayout from "@/components/layout/MainLayout";
import Hero from "@/components/home/Hero";
import { ArrowRight, Quote, Shield, Crown, Star, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useTranslation } from "@/components/I18nProvider";
import dynamic from "next/dynamic";

const PackagesSection = dynamic(() => import("@/components/home/PackagesSection"), {
  ssr: true,
});

const DestinationsSection = dynamic(() => import("@/components/home/DestinationsSection"), {
  ssr: true,
});

const experienceAssets = [
  { src: "/images/hero_ultra_vip.avif", label: "Private Aviation" },
  { src: "/images/luxury_transport_fleet_sl_1773073885754.avif", label: "Limo & SUV Fleet" },
  { src: "/images/kandyan_dancers_luxury_welcome_1773073904824.avif", label: "Cultural Welcome" },
  { src: "/images/private_chef_luxury_dining_1773073921412.avif", label: "Bespoke Culinary" },
  { src: "/images/bespoke_gem_jewelry_experience_1773073939946.avif", label: "Gem Curation" },
  { src: "/images/luxury_massage_spa_serenity_1773073961558.avif", label: "Ayurvedic Spa" },
  { src: "/images/luxury_bedroom_mountain_view_1773073980186.avif", label: "Sovereign Sanctuary" },
];

const partnerLogos = [
  { src: "/images/logo/aman.webp", alt: "Aman Resorts", category: "Hotels & Stays" },
  { src: "/images/logo/anantara.webp", alt: "Anantara", category: "Hotels & Stays" },
  { src: "/images/logo/cape-weligama.webp", alt: "Cape Weligama", category: "Hotels & Stays" },
  { src: "/images/logo/tea-trails.webp", alt: "Ceylon Tea Trails", category: "Hotels & Stays" },
  { src: "/images/logo/wild-cost-tent.webp", alt: "Wild Coast Tented Lodge", category: "Hotels & Stays" },
  { src: "/images/logo/jetwinghotels.webp", alt: "Jetwing Hotels", category: "Hotels & Stays" },
  { src: "/images/logo/cinnamon.webp", alt: "Cinnamon Hotels", category: "Hotels & Stays" },
  { src: "/images/logo/shangrilla.webp", alt: "Shangri-La", category: "Hotels & Stays" },
  { src: "/images/logo/marriot.webp", alt: "Marriott", category: "Hotels & Stays" },
  { src: "/images/logo/hilton.webp", alt: "Hilton", category: "Hotels & Stays" },
  { src: "/images/logo/tharu-villas.webp", alt: "Taru Villas", category: "Hotels & Stays" },
  { src: "/images/logo/uga.webp", alt: "Uga Escapes", category: "Hotels & Stays" },
  { src: "/images/logo/kayaam-wellness.webp", alt: "Kayaam Wellness", category: "Wellness & Spa" },
  { src: "/images/logo/senok-air.webp", alt: "Senok Air", category: "Aviation & Helicopter" },
  { src: "/images/logo/aahaasa.webp", alt: "Aahaasa", category: "Aviation & Helicopter" },
  { src: "/images/logo/malkey-rent-car.webp", alt: "Malkey Limo & Chauffeur", category: "Limo & Chauffeur" },
  { src: "/images/logo/srilankapersonalchauffeurs.webp", alt: "Sri Lanka Personal Chauffeurs", category: "Limo & Chauffeur" },
  { src: "/images/logo/sea-adventures.webp", alt: "Sea Adventures", category: "Yacht & Marine" },
  { src: "/images/logo/elite-shield.webp", alt: "Elite Shield Security", category: "VIP Security" },
  { src: "/images/logo/the-one-group.webp", alt: "The One Group", category: "VIP Concierge" },
  { src: "/images/logo/avant-garde.webp", alt: "Avant Garde", category: "VIP Services" },
  { src: "/images/logo/aitken-spense.webp", alt: "Aitken Spence", category: "Luxury Travel" },
  { src: "/images/logo/tea-drop.webp", alt: "Tea Drop", category: "Bespoke Culinary" },
];

const testimonials = [
  {
    quote: "From our private tea estate bungalow buyout near the factory to helicopter transfers for Sigiriya and Yala, every moment was handled seamlessly by Sonali maintaining ultra-luxury standards. All in all, it was a exceptionally well-organized trip.",
    name: "David Montgomery",
    title: "Ultra VIP Traveler",
    location: "London, UK",
    flag: "🇬🇧",
    image: "/images/david_montgomery_tea_estate.webp",
    detailUrl: "/testimonials/david-montgomery"
  },
  {
    quote: "As someone accustomed to global top-tier concierge services, Nilathra surpassed all expectations. Their handling of our family's private aviation, close-protection security detail, and Ultra High Net-Worth privacy across Sri Lanka was flawless.",
    name: "Harrison Vance",
    title: "Forbes-List UHNW Client",
    location: "New York, USA",
    flag: "🇺🇸",
    image: "/images/srilanka_luxury_estate.png"
  },
  {
    quote: "German precision meets warm island sovereignty. The logistical seamlessness with which Nilathra arranged our twin-island escape between Ceylon's highlands and Maldives overwater sanctuaries set a new standard for luxury travel.",
    name: "Dr. Julian & Clara Von Berg",
    title: "Private Estate & Twin-Island Guest",
    location: "Frankfurt, Germany",
    flag: "🇩🇪",
    image: "/images/dr_julian_clara_nimali.webp",
    detailUrl: "/testimonials/dr-julian-clara-von-berg"
  },
  {
    quote: "An ultra-luxury experience defined by refined elegance and absolute privacy. Villa buyouts in Galle, bespoke private chef dining, and rare gem curations were managed with true French-level art de vivre.",
    name: "Jean-Luc & Camille Laurent",
    title: "Sovereign Sanctuary Guest",
    location: "Paris, France",
    flag: "🇫🇷",
    image: "/images/private_chef_luxury_dining_1773073921412.avif"
  },
  {
    quote: "Nilathra handled our multi-generational family retreat with unmatched royal hospitality. Tarmac VIP clearance, direct helicopter transfers, and exclusive resort buyouts made our Ceylon holiday an extraordinary VIP experience.",
    name: "Rajesh & Sunita Singhania",
    title: "VIP Family & Corporate Legacy Client",
    location: "Mumbai, India",
    flag: "🇮🇳",
    image: "/images/colombo_morning_drone.avif"
  }
];

function TestimonialsSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % testimonials.length);
    }, 14000); // 14 seconds for relaxed, comfortable reading
    return () => clearInterval(timer);
  }, [isPaused]);

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setActiveIdx((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[activeIdx];

  return (
    <section 
      className="py-24 bg-brand-green text-white px-6 md:px-12 overflow-hidden relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-gold rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-[120px]" />
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <span className="text-brand-gold text-[10px] font-black uppercase tracking-[0.4em] mb-6 block">
          Global Sovereign Experiences &amp; UHNW Reviews
        </span>

        <Quote className="mx-auto mb-8 text-brand-gold opacity-50" size={50} />

        <div className="min-h-[240px] md:min-h-[200px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 flex flex-col items-center justify-center"
            >
              <h2 className="font-serif text-2xl md:text-4xl leading-relaxed max-w-4xl mx-auto italic font-light">
                &ldquo;{current.quote}&rdquo;
              </h2>

              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-full border-2 border-brand-gold p-1 shadow-lg">
                  <div className="w-full h-full rounded-full overflow-hidden relative">
                    <Image
                      src={current.image}
                      alt={current.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-medium tracking-wide text-lg text-white flex items-center justify-center gap-2">
                    <span>{current.name}</span>
                    <span className="text-sm">{current.flag}</span>
                  </p>
                  <p className="text-brand-gold text-xs uppercase tracking-[0.2em] font-semibold mt-0.5">
                    {current.title}
                  </p>
                  <p className="text-white/50 text-[11px] uppercase tracking-[0.3em] font-light mt-0.5">
                    {current.location}
                  </p>
                </div>
              </div>

              {current.detailUrl && (
                <div className="pt-2">
                  <Link
                    href={current.detailUrl}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-gold/15 hover:bg-brand-gold text-brand-gold hover:text-brand-green border border-brand-gold/40 rounded-full text-xs uppercase tracking-widest font-bold transition-all duration-300 shadow-md group"
                  >
                    <span>Read Full Trip Detail</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel controls */}
        <div className="flex items-center justify-center gap-6 mt-12 pt-6 border-t border-white/10">
          <button
            onClick={handlePrev}
            className="p-2 rounded-full border border-white/20 hover:border-brand-gold hover:text-brand-gold transition-colors"
            aria-label="Previous review"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex gap-2">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === activeIdx ? "w-8 bg-brand-gold" : "w-2 bg-white/30 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="p-2 rounded-full border border-white/20 hover:border-brand-gold hover:text-brand-gold transition-colors"
            aria-label="Next review"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}

function formatPartnerName(src: string) {
  const fileName = src.split('/').pop()?.split('.')[0] || '';
  return fileName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function PartnerMarquee() {
  const duplicatedLogos = [...partnerLogos, ...partnerLogos];
  return (
    <div className="relative w-full overflow-hidden py-10 bg-white/50 border-y border-brand-charcoal/5">
      {/* Edge gradient overlays for smooth fade effect */}
      <div className="absolute inset-y-0 left-0 w-24 md:w-48 bg-gradient-to-r from-[#FAF9F6] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 md:w-48 bg-gradient-to-l from-[#FAF9F6] to-transparent z-10 pointer-events-none" />

      <div className="flex gap-20 items-center flex-row flex-nowrap animate-marquee hover:pause-marquee min-w-max" id="partner-marquee-track">
        {duplicatedLogos.map((logo, index) => {
          const partnerName = formatPartnerName(logo.src);
          return (
            <div
              key={`${logo.alt}-${index}`}
              id={`partner-logo-${logo.alt.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index}`}
              className="relative flex-shrink-0 flex flex-col items-center justify-start pt-1.5 w-44 h-24 group cursor-pointer"
            >
              {/* Logo image container with modern grayscale -> color filter on hover */}
              <div className="relative w-36 h-16 transition-all duration-500 filter grayscale opacity-70 group-hover:filter-none group-hover:opacity-100 group-hover:scale-105">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  fill
                  style={{ objectFit: 'contain' }}
                  className="object-contain"
                  sizes="180px"
                />
              </div>
              
              {/* Premium sub-label showing the partner's name from file name */}
              <span className="text-[9px] tracking-[0.2em] uppercase font-bold text-brand-charcoal/40 group-hover:text-brand-gold group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap mt-2.5">
                {partnerName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


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
            sizes="(max-width: 768px) 100vw, 50vw"
            quality={70}
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

      {/* Sovereign Partner Network Section */}
      <section className="py-20 bg-[#FAF9F6] text-brand-charcoal relative overflow-hidden border-b border-brand-charcoal/5">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-green/5 rounded-full blur-[100px] pointer-events-none opacity-20" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 mb-12 text-center relative z-10">
          <span className="text-brand-gold text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">
            {t.home.partners_subtitle}
          </span>
          <h2 className="font-serif text-3xl md:text-5xl text-brand-green mb-6">
            {t.home.partners_title}
          </h2>
          <p className="text-brand-charcoal/70 max-w-3xl mx-auto font-light leading-relaxed text-sm md:text-base">
            {t.home.partners_desc}
          </p>
        </div>

        {/* Animated Infinite Marquee */}
        <PartnerMarquee />
      </section>

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

      {/* Indian Ocean Twin-Island Secondary Teaser */}
      <section className="py-16 px-6 md:px-12 bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3">
            <span className="text-brand-gold text-[10px] font-black uppercase tracking-[0.3em]">Twin-Island Sovereignty</span>
            <h3 className="font-serif text-2xl md:text-3xl text-white">Ceylon Heritage &amp; Maldives Overwater Escapes</h3>
            <p className="text-slate-300 text-sm font-light max-w-2xl">
              Combine Sri Lanka&apos;s wildlife safaris, tea estates, and ancient fortresses with private overwater villa retreats in the Maldives. Coordinated seamlessly through our Male&apos; desk.
            </p>
          </div>
          <Link
            href="/contact?plan=maldives-extension"
            className="shrink-0 px-8 py-4 bg-brand-gold text-slate-950 font-bold uppercase tracking-widest text-xs rounded-full hover:bg-white transition-all shadow-lg"
          >
            Explore Maldives Extension
          </Link>
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

      {/* Travel Architecture & SEO Rich Guide - Ultra Luxury Vibe */}
      <section className="py-24 px-6 md:px-12 bg-[#F5F3EF]/30 border-t border-brand-charcoal/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-sand/30 rounded-full blur-[100px] pointer-events-none opacity-30" />
        <div className="max-w-5xl mx-auto">
          <div className="space-y-16">
            <div className="text-center">
              <span className="text-brand-gold text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">
                {t.home.guide_subtitle}
              </span>
              <h2 className="font-serif text-3xl md:text-5xl text-brand-green leading-tight">
                {t.home.guide_title}
              </h2>
            </div>
            
            <div className="text-brand-charcoal/70 font-light leading-relaxed text-lg max-w-3xl mx-auto text-center font-serif italic">
              <p>
                {t.home.guide_p1}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
              {[
                {
                  title: t.home.guide_card1_title,
                  desc: t.home.guide_card1_desc,
                  label: "01"
                },
                {
                  title: t.home.guide_card2_title,
                  desc: t.home.guide_card2_desc,
                  label: "02"
                },
                {
                  title: t.home.guide_card3_title,
                  desc: t.home.guide_card3_desc,
                  label: "03"
                },
                {
                  title: t.home.guide_card4_title,
                  desc: t.home.guide_card4_desc,
                  label: "04"
                }
              ].map((card, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white border border-brand-charcoal/[0.04] p-10 rounded-sm hover:border-brand-gold/30 hover:shadow-[0_20px_50px_rgba(43,43,43,0.05)] transition-all duration-[0.6s] group hover:-translate-y-1 relative"
                >
                  <div className="absolute top-8 right-10 text-brand-gold/20 font-serif italic text-3xl font-black select-none group-hover:text-brand-gold/40 transition-colors duration-[0.6s]">
                    {card.label}
                  </div>
                  <h3 className="font-serif text-xl text-brand-green mb-4 group-hover:text-brand-gold transition-colors duration-[0.6s]">
                    {card.title}
                  </h3>
                  <p className="text-brand-charcoal/60 leading-relaxed text-sm font-light font-sans tracking-wide">
                    {card.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="text-brand-charcoal/70 font-light leading-relaxed text-sm max-w-3xl mx-auto text-center border-t border-brand-charcoal/5 pt-12">
              <p>
                {t.home.guide_p2}
              </p>
            </div>
          </div>
        </div>
      </section>

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
            {(t.home.faqs || [
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
            ]).map((item: any, idx: number) => (
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
      <TestimonialsSection />

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
            "url": "https://www.nilathra.com",
            "telephone": "+94777278282",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Colombo",
              "addressCountry": "LK"
            },
            "image": "https://www.nilathra.com/images/luxury_resort_sunset.avif",
            "priceRange": "$$$$"
          }),
        }}
      />
    </MainLayout>
  );
}
