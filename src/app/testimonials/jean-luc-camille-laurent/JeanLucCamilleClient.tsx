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
  UtensilsCrossed, 
  Sparkles, 
  ArrowLeft, 
  Quote, 
  CheckCircle2, 
  Heart,
  Car,
  Gem,
  Palmtree
} from "lucide-react";
import { motion } from "framer-motion";

export default function JeanLucCamilleClient() {
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
            Verified Sovereign Experience #SL-2026-VIP-773
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
                <Sparkles size={14} /> Ultra VIP Galle Villa Sanctuary
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs uppercase tracking-widest font-semibold">
                <span>Tier: Sovereign Ultra-VIP ($$$$$)</span>
              </div>
            </div>

            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-white leading-tight">
              &ldquo;French Art de Vivre Meets Sovereign Elegance in Galle&rdquo;
            </h1>

            <p className="text-white/70 text-base md:text-lg font-light leading-relaxed font-serif italic">
              A private beachfront villa buyout in Galle, bespoke Michelin-grade chef dining, and rare Ceylon gem curations, curated personally by Senior Travel Manager <span className="text-brand-gold font-sans font-semibold not-italic">Nimali</span>.
            </p>

            {/* Profile badge */}
            <div className="pt-4 flex flex-wrap items-center gap-6 border-t border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-brand-gold p-0.5 relative shadow-xl overflow-hidden shrink-0">
                  <Image
                    src="/images/jean_luc_nimali.webp"
                    alt="Jean-Luc & Camille Laurent with Nimali"
                    fill
                    className="object-cover"
                    sizes="64px"
                    priority
                  />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                    Jean-Luc &amp; Camille Laurent <span className="text-base">🇫🇷</span>
                  </h2>
                  <p className="text-brand-gold text-xs uppercase tracking-widest font-semibold">
                    Sovereign Sanctuary Guests &bull; Paris, France
                  </p>
                </div>
              </div>

              <div className="hidden sm:block h-10 w-px bg-white/15" />

              <div className="space-y-1 text-xs text-white/70">
                <p className="flex items-center gap-2">
                  <Calendar size={14} className="text-brand-gold" />
                  <span>Arrival: <strong>March 12, 2026</strong> (7 Days)</span>
                </p>
                <p className="flex items-center gap-2">
                  <UserCheck size={14} className="text-brand-gold" />
                  <span>Private Concierge: <strong>Nimali</strong></span>
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
                  src="/images/jean_luc_nimali.webp"
                  alt="Jean-Luc & Camille Laurent family with Nilathra personal travel manager Nimali at Galle Villa"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 inset-x-0 p-6 text-white space-y-1">
                <p className="text-xs text-brand-gold uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <MapPin size={13} /> Galle Beachfront Villa Buyout
                </p>
                <p className="text-xs text-white/80 font-light">
                  Jean-Luc &amp; Camille Laurent family with their Nilathra personal travel manager, <strong className="text-white">Nimali</strong>.
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
                <p className="text-xs md:text-sm font-semibold text-brand-green">7 Days (March 12, 2026)</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                <Palmtree size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/50 font-bold">Sanctuary</p>
                <p className="text-xs md:text-sm font-semibold text-brand-green">Galle Villa Buyout</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                <Car size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/50 font-bold">Ground Mobility</p>
                <p className="text-xs md:text-sm font-semibold text-brand-green">Black Luxury SUV Fleet</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                <Gem size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/50 font-bold">Bespoke Curation</p>
                <p className="text-xs md:text-sm font-semibold text-brand-green">Private Chef &amp; Rare Gems</p>
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
              Please note: Journeys of this level involve exclusive coastal villa buyouts, dedicated private culinary teams, bespoke gem master consultations, and executive SUV security escorts. Nilathra Collection operates strictly in the ultra-luxury and UHNW space, designed for discerning travelers who demand true French-level art de vivre.
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
                  Letter from Jean-Luc &amp; Camille Laurent
                </h3>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" />
                ))}
              </div>
            </div>

            {/* Letter Body - Genuine, Refined, French Art de Vivre Tone */}
            <div className="space-y-6 text-brand-charcoal/80 font-light leading-relaxed text-base md:text-lg font-serif">
              <p className="first-letter:text-5xl first-letter:font-bold first-letter:text-brand-green first-letter:mr-3 first-letter:float-left">
                As travelers from Paris accustomed to high standards of hospitality and French-level <span className="italic font-semibold text-brand-green">art de vivre</span>, our holiday criteria for Ceylon required absolute privacy, refined culinary excellence, and impeccable organization. When we landed in Sri Lanka on March 12th, 2026, Nilathra Collection provided an extraordinary experience that blew us away from the very first moment.
              </p>

              <p>
                Our personal travel manager, <strong className="font-semibold text-brand-green">Nimali</strong>, was a true marvel. From VIP tarmac arrival in Colombo to our serene arrival at the Southern coast, Nimali managed every single aspect of our journey with grace, warmth, and absolute discretion. She orchestrated a complete private buyout of a spectacular oceanfront colonial luxury villa in Galle, surrounded by swaying palms and an infinity pool overlooking the Indian Ocean.
              </p>

              <p>
                Having the entire Galle estate completely to ourselves allowed us to savor moments of genuine peace with our family. Nimali posted dedicated household staff and security details at the private estate gates, ensuring complete privacy throughout our stay.
              </p>

              <p>
                The culinary programming arranged by Nimali was a masterpiece. We were paired with a private master chef who crafted custom French-Ceylonese tasting menus every evening. From wild-caught Ceylon lobster with saffron-infused reductions to delicate tropical pastries, every meal felt like a Michelin-starred dining experience under the stars by our pool.
              </p>

              <p>
                Another unforgettable highlight engineered by Nimali was our private Ceylon gem curation experience. Knowing our passion for rare jewelry, Nimali brought a top-tier master gemologist directly to our villa for a private, closed-door showcase. We were able to inspect and select rare, unheated royal blue sapphires sourced directly from Ratnapura&apos;s finest mines—an opportunity available only to true sovereign clientele.
              </p>

              <p>
                Ground mobility throughout our stay was handled by a pristine black luxury SUV with a professional private chauffeur. Nimali ensured our drives to historic Galle Fort and secluded beaches were smooth, comfortable, and flawlessly timed.
              </p>

              <div className="p-6 bg-[#FAF9F6] border-l-4 border-brand-gold my-8 rounded-r-sm font-sans text-brand-green italic font-normal text-base md:text-lg">
                &ldquo;An ultra-luxury experience defined by refined elegance and absolute privacy. Villa buyouts in Galle, bespoke private chef dining, and rare gem curations were managed with true French-level art de vivre.&rdquo;
              </div>

              <p>
                Nilathra Collection set a new standard for luxury travel for our family. For anyone seeking total peace of mind, uncompromised privacy, and world-class bespoke hospitality in Sri Lanka, Nimali and her team are in a league of their own. We leave Ceylon with unforgettable memories and deep appreciation.
              </p>
            </div>

            {/* Signature Block */}
            <div className="mt-12 pt-8 border-t border-brand-charcoal/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <p className="font-serif font-bold text-xl text-brand-green">Jean-Luc &amp; Camille Laurent</p>
                <p className="text-xs uppercase tracking-widest text-brand-gold font-semibold mt-0.5">
                  Sovereign Sanctuary Guests &bull; Paris, France
                </p>
                <p className="text-[11px] text-brand-charcoal/50 mt-1">
                  Travel Dates: Mar 12, 2026 &ndash; Mar 19, 2026 (7 Days)
                </p>
              </div>

              <div className="flex items-center gap-3 bg-brand-green/5 px-4 py-3 rounded-full border border-brand-green/10">
                <ShieldCheck size={20} className="text-brand-green" />
                <span className="text-xs text-brand-green font-medium">Verified Ultra VIP Review</span>
              </div>
            </div>
          </motion.div>

          {/* Photo Gallery Grid */}
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-brand-gold text-[10px] font-black uppercase tracking-[0.3em] block">
                Journey Highlights
              </span>
              <h3 className="font-serif text-3xl text-brand-green">Visual Documentation of the Galle Retreat</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative h-64 rounded-sm overflow-hidden border border-brand-charcoal/10 shadow-md group">
                <Image
                  src="/images/jean_luc_suv.webp"
                  alt="Brand-New Black Luxury SUV Fleet with Chauffeur"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                  <p className="text-white text-xs font-semibold">Luxury Black SUV Fleet &amp; Private Chauffeur</p>
                </div>
              </div>

              <div className="relative h-64 rounded-sm overflow-hidden border border-brand-charcoal/10 shadow-md group">
                <Image
                  src="/images/jean_luc_nimali.webp"
                  alt="Jean-Luc & Camille Laurent family with Nilathra concierge Nimali"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                  <p className="text-white text-xs font-semibold">Jean-Luc &amp; Camille Laurent family with Nimali</p>
                </div>
              </div>

              <div className="relative h-64 rounded-sm overflow-hidden border border-brand-charcoal/10 shadow-md group">
                <Image
                  src="/images/galle_villa_buyout.webp"
                  alt="Private Galle Oceanfront Villa & Infinity Pool Buyout"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                  <p className="text-white text-xs font-semibold">Private Galle Villa &amp; Oceanfront Infinity Pool</p>
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
                Galle Buyout &amp; Exclusive Inclusions
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 text-sm">
              <div className="space-y-3 bg-white/5 p-6 rounded border border-white/10">
                <h4 className="font-bold text-brand-gold flex items-center gap-2 text-base">
                  <CheckCircle2 size={18} /> Private Villa &amp; Culinary Art
                </h4>
                <ul className="space-y-2 text-white/80 font-light">
                  <li>&bull; Full private buyout of colonial beachfront villa in Galle</li>
                  <li>&bull; Dedicated household butler staff and estate security</li>
                  <li>&bull; Michelin-grade private chef for daily French-Ceylonese tasting menus</li>
                  <li>&bull; Sunset wine pairing dinners on private oceanfront deck</li>
                  <li>&bull; Total estate isolation and private access gates</li>
                </ul>
              </div>

              <div className="space-y-3 bg-white/5 p-6 rounded border border-white/10">
                <h4 className="font-bold text-brand-gold flex items-center gap-2 text-base">
                  <CheckCircle2 size={18} /> Mobility &amp; Bespoke Curations
                </h4>
                <ul className="space-y-2 text-white/80 font-light">
                  <li>&bull; Black luxury SUV fleet with dedicated private chauffeur</li>
                  <li>&bull; Private in-villa Ceylon blue sapphire gem masterclass with Nimali</li>
                  <li>&bull; Exclusive access to unheated royal sapphires from Ratnapura</li>
                  <li>&bull; Guided walking tours of historic Galle Fort by local historian</li>
                  <li>&bull; 24/7 personal travel management by Senior Concierge Nimali</li>
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
              Plan Your Sovereign Ceylon Sanctuary with Nimali
            </h3>

            <p className="text-brand-charcoal/70 font-light text-base max-w-2xl mx-auto">
              Whether you desire an exclusive Galle villa buyout, private chef dining, or rare gem curations, Nimali and the Nilathra Collection team are ready to engineer your masterplan.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link 
                href="/custom-plan?concierge=nimali"
                className="w-full sm:w-auto px-8 py-4 bg-brand-green text-white font-bold uppercase tracking-widest text-xs rounded-full hover:bg-brand-gold hover:text-brand-green transition-all duration-300 shadow-lg"
              >
                Inquire With Nimali
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
