"use client";

import Image from "next/image";
import Link from "next/link";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Star, 
  UserCheck, 
  Coffee, 
  Sparkles, 
  Compass, 
  ArrowLeft, 
  Quote, 
  CheckCircle2, 
  Heart,
  PlaneTakeoff,
  Car
} from "lucide-react";
import { motion } from "framer-motion";

export default function DavidMontgomeryClient() {
  return (
    <div className="bg-[#FAF9F6] text-brand-charcoal min-h-screen selection:bg-brand-gold selection:text-black font-sans">
      {/* Header Banner & Breadcrumb */}
      <div className="bg-brand-green text-white py-6 px-6 md:px-12 border-b border-brand-gold/20 relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between relative z-10">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-brand-gold hover:text-white text-xs uppercase tracking-widest font-bold transition-colors"
          >
            <ArrowLeft size={16} /> Back to Collection Overview
          </Link>
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/60 font-semibold hidden md:inline-block">
            Verified Sovereign Experience #SL-2026-VIP-882
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 px-6 md:px-12 bg-gradient-to-b from-brand-green via-[#162720] to-[#0D1813] text-white overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-gold/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column - Meta & Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-xs uppercase tracking-[0.2em] font-bold">
                <Sparkles size={14} /> Ultra VIP Ceylon Retreat
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs uppercase tracking-widest font-semibold">
                <span>Tier: Sovereign Ultra-VIP ($$$$$)</span>
              </div>
            </div>

            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-white leading-tight">
              &ldquo;An Unforgettable Sovereign Sanctuary in the Highlands&rdquo;
            </h1>

            <p className="text-white/70 text-base md:text-lg font-light leading-relaxed font-serif italic">
              A 10-day private Ceylon tea estate buyout, bespoke helicopter aviation, and holistic sanctuary, curated personally by Senior Concierge <span className="text-brand-gold font-sans font-semibold not-italic">Sonali</span>.
            </p>

            {/* Profile badge */}
            <div className="pt-4 flex flex-wrap items-center gap-6 border-t border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-brand-gold p-0.5 relative shadow-xl overflow-hidden shrink-0">
                  <Image
                    src="/images/david_montgomery_tea_estate.webp"
                    alt="David Montgomery with Sonali at Tea Estate"
                    fill
                    className="object-cover"
                    sizes="64px"
                    priority
                  />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                    David Montgomery <span className="text-base">🇬🇧</span>
                  </h2>
                  <p className="text-brand-gold text-xs uppercase tracking-widest font-semibold">
                    Ultra VIP Traveler &bull; London, UK
                  </p>
                </div>
              </div>

              <div className="hidden sm:block h-10 w-px bg-white/15" />

              <div className="space-y-1 text-xs text-white/70">
                <p className="flex items-center gap-2">
                  <Calendar size={14} className="text-brand-gold" />
                  <span>Arrival: <strong>Feb 22, 2026</strong> (10 Days)</span>
                </p>
                <p className="flex items-center gap-2">
                  <UserCheck size={14} className="text-brand-gold" />
                  <span>Private Concierge: <strong>Sonali</strong></span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Hero Featured Card Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="relative rounded-lg overflow-hidden border border-brand-gold/30 shadow-2xl group bg-neutral-900">
              <div className="relative h-[380px] w-full">
                <Image
                  src="/images/david_montgomery_tea_estate.webp"
                  alt="David Montgomery and family with Nilathra concierge Sonali at Ceylon Tea Estate"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 inset-x-0 p-6 text-white space-y-1">
                <p className="text-xs text-brand-gold uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <MapPin size={13} /> Colonial Tea Estate Bungalow Buyout
                </p>
                <p className="text-xs text-white/80 font-light">
                  David Montgomery &amp; family with their Nilathra personal travel manager, <strong className="text-white">Sonali</strong>.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Spec Highlights */}
      <section className="py-8 bg-white border-b border-brand-charcoal/5">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/50 font-bold">Duration &amp; Date</p>
                <p className="text-xs md:text-sm font-semibold text-brand-green">10 Days (Feb 22, 2026)</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                <Coffee size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/50 font-bold">Sanctuary</p>
                <p className="text-xs md:text-sm font-semibold text-brand-green">Tea Estate Buyout</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                <Car size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/50 font-bold">Ground Mobility</p>
                <p className="text-xs md:text-sm font-semibold text-brand-green">Black German SUV + Guide</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                <PlaneTakeoff size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/50 font-bold">Air Transfers</p>
                <p className="text-xs md:text-sm font-semibold text-brand-green">Helicopter to Sigiriya &amp; Yala</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Review Content Section */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Investment & Exclusivity Banner */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-sm text-amber-900 text-sm space-y-1 font-sans">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs text-amber-950">
              <ShieldCheck size={16} className="text-amber-600" />
              Sovereign Ultra-VIP Investment Tier Notice
            </div>
            <p className="text-amber-900/90 font-light leading-relaxed">
              Please note: Journeys of this level involve exclusive property buyouts, full personal staff teams, and private helicopter charters. Nilathra Collection operates strictly in the ultra-luxury and UHNW space, designed for travelers seeking elite, top-tier experiences rather than budget travel options.
            </p>
          </div>

          {/* Authentic Letter Container */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 md:p-14 rounded-sm border border-brand-charcoal/10 shadow-[0_15px_40px_rgba(0,0,0,0.03)] relative"
          >
            <Quote className="absolute top-6 right-8 text-brand-gold/20" size={80} />

            <div className="border-b border-brand-charcoal/10 pb-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-brand-gold text-[10px] font-black uppercase tracking-[0.3em] block mb-1">
                  Personal Experience Narrative
                </span>
                <h3 className="font-serif text-2xl md:text-3xl text-brand-green">
                  Letter from David Montgomery
                </h3>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" />
                ))}
              </div>
            </div>

            {/* Letter Body - Genuine, Touching, Authentic Tone */}
            <div className="space-y-6 text-brand-charcoal/80 font-light leading-relaxed text-base md:text-lg font-serif">
              <p className="first-letter:text-5xl first-letter:font-bold first-letter:text-brand-green first-letter:mr-3 first-letter:float-left">
                When planning our 10-day Ceylon getaway arriving on February 22nd, 2026, my family and I were seeking far more than a standard luxury vacation. We wanted true tranquility, total privacy, and absolute logistical ease. From the moment we landed, Nilathra Collection didn&apos;t just meet our expectations—they redefined what high-touch hospitality means.
              </p>

              <p>
                Our personal travel manager, <strong className="font-semibold text-brand-green">Sonali</strong>, took charge of our itinerary from day one. Her warmth, grace, and meticulous attention to detail were evident in everything she touched. Sonali arranged a complete private buyout of an exquisite colonial tea estate bungalow, set amidst rolling emerald hills just steps from a historic working tea factory. Having the entire estate exclusively to ourselves offered a sense of peaceful sovereignty that is almost impossible to find elsewhere in the world.
              </p>

              <p>
                The in-residence team assembled by Sonali was extraordinary. We were pampered by a dedicated private chef who prepared bespoke, Michelin-standard meals tailored to our exact dietary preferences every single day. Each morning began with sunrise sessions led by a dedicated yoga and spiritual master overlooking the misty tea valleys, followed by private consultations and traditional treatments from our resident Ayurvedic doctor. It was a deeply restorative experience for both mind and body.
              </p>

              <p>
                What impressed me most was the absolute seamlessness of the logistics. Ground transport was provided in a pristine, brand-new black German SUV with a professional dedicated chauffeur. Whenever we ventured into historic cities and cultural sites, our driver was accompanied by a highly knowledgeable local guide who brought Sri Lanka&apos;s rich history to life with fascinating insights and zero clutter.
              </p>

              <p>
                To crown the experience, Sonali eliminated tedious long-distance drives altogether. Our excursions to the iconic Sigiriya Rock Fortress and the wildlife heartlands of Yala National Park were conducted entirely by private helicopter charters. Landing directly on private helipads with minimal ground transportation allowed us to experience Sri Lanka&apos;s greatest wonders with maximum comfort and zero stress.
              </p>

              <p className="italic text-brand-charcoal/90">
                While an itinerary of this caliber—involving full estate buyouts, dedicated staffing, and private helicopter charters—naturally represents a substantial top-tier investment, the uncompromised privacy, precision, and sovereign treatment made every single penny worth it.
              </p>

              <div className="p-6 bg-[#FAF9F6] border-l-4 border-brand-gold my-8 rounded-r-sm font-sans text-brand-green italic font-normal text-base md:text-lg">
                &ldquo;Every detail was handled seamlessly while maintaining an uncompromised luxury standard. Sonali ensured our family was taken care of like royalty from start to finish. All in all, it was a well-organized trip that will stay in our hearts forever.&rdquo;
              </div>

              <p>
                If you are looking for an authentic, world-class luxury journey in Sri Lanka managed with utmost discretion and genuine care, look no further than Nilathra Collection. We left Ceylon with refreshed spirits, wonderful memories, and deep gratitude to Sonali and the entire Nilathra team.
              </p>
            </div>

            {/* Signature Block */}
            <div className="mt-12 pt-8 border-t border-brand-charcoal/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <p className="font-serif font-bold text-xl text-brand-green">David Montgomery</p>
                <p className="text-xs uppercase tracking-widest text-brand-gold font-semibold mt-0.5">
                  Ultra VIP Guest &bull; London, United Kingdom
                </p>
                <p className="text-[11px] text-brand-charcoal/50 mt-1">
                  Travel Dates: Feb 22, 2026 &ndash; Mar 4, 2026 (10 Days)
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-3 bg-brand-green/5 px-4 py-3 rounded-full border border-brand-green/10">
                  <ShieldCheck size={20} className="text-brand-green" />
                  <span className="text-xs text-brand-green font-medium">Verified Ultra VIP Review</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-brand-gold bg-brand-gold/10 border border-brand-gold/20 px-3 py-2 rounded-full font-bold">
                  <span>NDA Written Release #SL-2026-VIP-882</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Photo Gallery Grid */}
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-brand-gold text-[10px] font-black uppercase tracking-[0.3em] block">
                Journey Highlights
              </span>
              <h3 className="font-serif text-3xl text-brand-green">Visual Memories of the Ceylon Estate</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative h-64 rounded-sm overflow-hidden border border-brand-charcoal/10 shadow-md group">
                <Image
                  src="/images/david_montgomery_tea_estate.webp"
                  alt="David Montgomery family with Sonali"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                  <p className="text-white text-xs font-semibold">David Montgomery &amp; family with Sonali</p>
                </div>
              </div>

              <div className="relative h-64 rounded-sm overflow-hidden border border-brand-charcoal/10 shadow-md group">
                <Image
                  src="/images/heritance-tea.webp"
                  alt="Colonial Tea Factory Estate"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                  <p className="text-white text-xs font-semibold">Colonial Tea Estate &amp; Historic Factory</p>
                </div>
              </div>

              <div className="relative h-64 rounded-sm overflow-hidden border border-brand-charcoal/10 shadow-md group">
                <Image
                  src="/images/black_german_suv.webp"
                  alt="Brand New Black German Luxury SUV Transport"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                  <p className="text-white text-xs font-semibold">Brand-New Black German Luxury SUV Fleet</p>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Card Grid */}
          <div className="bg-brand-green text-white p-8 md:p-12 rounded-sm space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-2 relative z-10">
              <span className="text-brand-gold text-[10px] font-black uppercase tracking-[0.4em] block">
                Itinerary Specifications
              </span>
              <h3 className="font-serif text-2xl md:text-4xl text-white">
                Trip Breakdown &amp; Curated Inclusions
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 text-sm">
              <div className="space-y-3 bg-white/5 p-6 rounded border border-white/10">
                <h4 className="font-bold text-brand-gold flex items-center gap-2 text-base">
                  <CheckCircle2 size={18} /> Private Estate &amp; Wellness
                </h4>
                <ul className="space-y-2 text-white/80 font-light">
                  <li>&bull; Exclusive buyout of historic colonial tea estate bungalow</li>
                  <li>&bull; Situated beside working heritage tea factory in highlands</li>
                  <li>&bull; Dedicated private chef for tailor-made gourmet dining</li>
                  <li>&bull; Resident yoga &amp; spiritual master for sunrise sessions</li>
                  <li>&bull; In-house Ayurvedic doctor for personalized wellness</li>
                </ul>
              </div>

              <div className="space-y-3 bg-white/5 p-6 rounded border border-white/10">
                <h4 className="font-bold text-brand-gold flex items-center gap-2 text-base">
                  <CheckCircle2 size={18} /> Air &amp; Ground Mobility
                </h4>
                <ul className="space-y-2 text-white/80 font-light">
                  <li>&bull; Brand-new black color German SUV with private chauffeur</li>
                  <li>&bull; Specialist local guide for city explorations</li>
                  <li>&bull; Helipad air transfers directly to Sigiriya Rock Fortress</li>
                  <li>&bull; Helicopter safari flight to Yala National Park</li>
                  <li>&bull; Zero long road journeys with maximum air efficiency</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Box */}
          <div className="bg-white p-10 md:p-14 rounded-sm border border-brand-gold/30 text-center space-y-6 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-brand-gold/15 text-brand-gold flex items-center justify-center mx-auto">
              <Heart size={32} />
            </div>

            <h3 className="font-serif text-3xl text-brand-green max-w-xl mx-auto">
              Plan Your Sovereign Ceylon Experience with Sonali
            </h3>

            <p className="text-brand-charcoal/70 font-light text-base max-w-2xl mx-auto">
              Whether you desire a private highland tea estate buyout, helicopter safaris, or bespoke wellness retreats, Sonali and the Nilathra Collection team are ready to design your unforgettable journey.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link 
                href="/custom-plan?concierge=sonali"
                className="w-full sm:w-auto px-8 py-4 bg-brand-green text-white font-bold uppercase tracking-widest text-xs rounded-full hover:bg-brand-gold hover:text-brand-green transition-all duration-300 shadow-lg"
              >
                Inquire With Sonali
              </Link>
              <Link 
                href="/contact"
                className="w-full sm:w-auto px-8 py-4 bg-transparent border border-brand-green text-brand-green font-bold uppercase tracking-widest text-xs rounded-full hover:bg-brand-green hover:text-white transition-all duration-300"
              >
                Contact Sovereign Concierge
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
