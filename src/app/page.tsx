"use client";

import MainLayout from "@/components/layout/MainLayout";
import Hero from "@/components/home/Hero";
import PackagesSection from "@/components/home/PackagesSection";
import DestinationsSection from "@/components/home/DestinationsSection";
import { ArrowRight, Quote, Shield, Crown, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const experienceAssets = [
  { src: "/images/hero_ultra_vip.png", rotate: "-12deg", left: "15%", top: "15%", z: 10, label: "Private Aviation" },
  { src: "/images/luxury_transport_fleet_sl_1773073885754.png", rotate: "8deg", left: "85%", top: "12%", z: 20, label: "Limo & SUV Fleet" },
  { src: "/images/kandyan_dancers_luxury_welcome_1773073904824.png", rotate: "-6deg", left: "10%", top: "45%", z: 30, label: "Cultural Welcome" },
  { src: "/images/private_chef_luxury_dining_1773073921412.png", rotate: "12deg", left: "80%", top: "45%", z: 15, label: "Bespoke Culinary" },
  { src: "/images/bespoke_gem_jewelry_experience_1773073939946.png", rotate: "-15deg", left: "70%", top: "85%", z: 25, label: "Gem Curation" },
  { src: "/images/luxury_massage_spa_serenity_1773073961558.png", rotate: "10deg", left: "20%", top: "85%", z: 5, label: "Ayurvedic Spa" },
  { src: "/images/luxury_bedroom_mountain_view_1773073980186.png", rotate: "0deg", left: "45%", top: "40%", z: 35, label: "Sovereign Sanctuary" },
];

function ExperienceGallery() {
  return (
    <div className="relative w-full h-full max-w-[1000px] aspect-square lg:aspect-[4/3] mx-auto">
      {experienceAssets.map((asset, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
          whileInView={{
            opacity: 1,
            scale: 1,
            rotate: asset.rotate,
            transition: { delay: idx * 0.1, duration: 0.8, ease: "easeOut" }
          }}
          whileHover={{
            scale: 1.1,
            zIndex: 100,
            rotate: "0deg",
            transition: { duration: 0.3 }
          }}
          viewport={{ once: true }}
          className="absolute w-[220px] md:w-[280px] aspect-[3/4] rounded-sm overflow-hidden shadow-2xl border-4 border-white bg-neutral-100"
          style={{
            left: asset.left,
            top: asset.top,
            transform: "translate(-50%, -50%)",
            zIndex: asset.z
          }}
        >
          <Image
            src={asset.src}
            alt={asset.label}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <span className="text-white text-[10px] uppercase font-black tracking-widest">{asset.label}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Home() {
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
            <span className="section-subtitle">Since 2012</span>
            <h2 className="section-title">A Vision of Pure Hospitality</h2>
            <div className="space-y-6 text-brand-charcoal/70 font-light leading-relaxed text-lg">
              <p>
                The &quot;Nilathra&quot; vision was born from a simple observation: Sri Lanka&apos;s soul is often lost in the noise of mass tourism. We set out to create a collection that doesn&apos;t just show you the island, but allows you to feel its pulse through the lens of absolute sovereignty and curated comfort.
              </p>
              <p>
                Our name, Nilathra, signifies the &quot;Blue Horizon&quot; where the sky meets the Indian Ocean—a symbol of the infinite possibilities our team creates for every guest. Over the last decade, we have transitioned from a boutique concierge to a world-class travel architect, serving a global elite who demand more than just luxury; they demand authenticity, privacy, and impeccable security.
              </p>
              <p>
                Every itinerary we design is a living masterplan. We analyze traveler personas down to the finest detail—from preferred sleep temperatures and dietary nuances to the specific cultural rhythms of the destinations visited. This is not just travel; it is the art of memory architecture.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 pt-6">
              <div>
                <h4 className="font-serif text-3xl text-brand-green mb-1">500+</h4>
                <p className="text-xs uppercase tracking-widest text-brand-charcoal/40 font-bold">Bespoke Journeys</p>
              </div>
              <div>
                <h4 className="font-serif text-3xl text-brand-green mb-1">12+</h4>
                <p className="text-xs uppercase tracking-widest text-brand-charcoal/40 font-bold">Years of Excellence</p>
              </div>
            </div>
          </motion.div>

          {/* Experience Gallery - The Card Spread */}
          <div className="relative h-[650px] w-full flex items-center justify-center lg:justify-end">
            <ExperienceGallery />
          </div>
        </div>
      </section>

      {/* The Nilathra Standard - New SEO Section */}
      <section className="py-24 px-6 md:px-12 bg-logo-blue text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-brand-gold text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Our Values</span>
            <h2 className="font-serif text-4xl md:text-6xl mb-6">The Nilathra Standard</h2>
            <p className="text-white/60 max-w-3xl mx-auto font-light leading-relaxed">
              Discover the three core pillars that define our commitment to world-class hospitality and uncompromising service excellence.
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
                Architecting the Finest <br />
                <span className="text-brand-gold italic">Sri Lankan Odysseys</span>
              </h2>
              <p className="text-neutral-600 font-light leading-relaxed">
                As the leading luxury travel agency in Sri Lanka, Nilathra Travels specializes in curating experiences that transcend the ordinary. Our deep-rooted heritage in the island&apos;s hospitality sector allows us to open doors that remain closed to others, from private sunset viewings at the Sigiriya Rock Fortress to exclusive tea tastings in the misty valleys of Nuwara Eliya.
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
                Whether you are seeking the wild heart of Yala National Park for a leopard safari or the colonial elegance of Galle Fort, our travel architects design every moment with precision. We understand that for the high-net-worth traveler, time is the ultimate currency. That is why our itineraries prioritize efficiency without sacrificing depth.
              </p>
              <p>
                Our collections—Ultra VIP, Luxury, and Premium—are designed to cater to varying levels of intensity and exclusivity. We invite you to explore our bespoke Sri Lanka tour packages, each a blank canvas ready to be painted with your specific desires. Let Nilathra Travels be your compass to the Pearl of the Indian Ocean.
              </p>
              <Link href="/blog" className="inline-flex items-center gap-2 text-logo-blue font-bold uppercase tracking-widest text-[10px] hover:gap-4 transition-all">
                Read our latest journal entries <ArrowRight size={14} />
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
            <span className="section-subtitle">Your Questions</span>
            <h2 className="section-title">Travel Excellence FAQ</h2>
            <p className="text-brand-charcoal/60 font-light mt-4">
              Everything you need to know about planning your luxury odyssey in Sri Lanka.
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
            &quot;An unparalleled experience. From the private villa in Ella to the seamless VIP handling at Colombo, Nilathra Travels exceeded every expectation. True Sri Lankan luxury.&quot;
          </h2>
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-brand-gold p-1">
              <div className="w-full h-full rounded-full overflow-hidden relative">
                <Image src="/images/tier_vip.png" alt="Client" fill className="object-cover" />
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
          <span className="section-subtitle">Begin Your Journey with the Best</span>
          <h2 className="section-title !text-5xl md:!text-7xl mb-8">Plan Your Sri Lankan Escape</h2>
          <p className="text-brand-charcoal/60 text-xl max-w-2xl mx-auto mb-12 font-light">
            Each itinerary is a blank canvas. Let the top travel agency in Sri Lanka design your perfect private escape.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/custom-plan" className="luxury-button !px-12 !py-5 text-lg">
              Private Consultation
            </Link>
            <Link href="/contact" className="luxury-button-outline !px-12 !py-5 text-lg">
              Contact Best Travel Agency
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
            "name": "Nilathra Travels",
            "description": "The best travel agency in Sri Lanka specializing in luxury, curated, and VIP travel experiences.",
            "url": "https://nilathra.com",
            "telephone": "+94777278282",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Colombo",
              "addressCountry": "LK"
            },
            "image": "https://nilathra.com/images/luxury_resort_sunset.png",
            "priceRange": "$$$$"
          }),
        }}
      />
    </MainLayout>
  );
}
