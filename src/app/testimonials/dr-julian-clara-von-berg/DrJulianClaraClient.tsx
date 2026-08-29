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
  ArrowLeft, 
  Quote, 
  CheckCircle2, 
  Heart,
  PlaneTakeoff,
  Car,
  Anchor,
  ShieldAlert,
  Train,
  Waves
} from "lucide-react";
import { motion } from "framer-motion";

export default function DrJulianClaraClient() {
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
            Verified Sovereign Experience #SL-2026-TWIN-904
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
                <Sparkles size={14} /> Ceylon &amp; Maldives Twin-Island Sovereignty
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs uppercase tracking-widest font-semibold">
                <span>Tier: Sovereign Ultra-VIP ($$$$$)</span>
              </div>
            </div>

            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-white leading-tight">
              &ldquo;German Precision Meets Warm Island Sovereignty&rdquo;
            </h1>

            <p className="text-white/70 text-base md:text-lg font-light leading-relaxed font-serif italic">
              A bespoke 8-day twin-island masterplan across Ceylon&apos;s highland tea estates and Maldives overwater sanctuaries, managed seamlessly by <span className="text-brand-gold font-sans font-semibold not-italic">Nimali</span> (Sri Lanka Desk) and <span className="text-brand-gold font-sans font-semibold not-italic">Ashee</span> (Maldives Desk).
            </p>

            {/* Profile badge */}
            <div className="pt-4 flex flex-wrap items-center gap-6 border-t border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-brand-gold p-0.5 relative shadow-xl overflow-hidden shrink-0">
                  <Image
                    src="/images/dr_julian_clara_nimali.webp"
                    alt="Dr. Julian & Clara Von Berg with Nimali"
                    fill
                    className="object-cover"
                    sizes="64px"
                    priority
                  />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                    Dr. Julian &amp; Clara Von Berg <span className="text-base">🇩🇪</span>
                  </h2>
                  <p className="text-brand-gold text-xs uppercase tracking-widest font-semibold">
                    Private Estate &amp; Twin-Island Guests &bull; Frankfurt, Germany
                  </p>
                </div>
              </div>

              <div className="hidden sm:block h-10 w-px bg-white/15" />

              <div className="space-y-1 text-xs text-white/70">
                <p className="flex items-center gap-2">
                  <Calendar size={14} className="text-brand-gold" />
                  <span>Arrival: <strong>April 3, 2026</strong> (5D Ceylon + 3N Maldives)</span>
                </p>
                <p className="flex items-center gap-2">
                  <UserCheck size={14} className="text-brand-gold" />
                  <span>Concierge Team: <strong>Nimali &amp; Ashee</strong></span>
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
                  src="/images/dr_julian_clara_nimali.webp"
                  alt="Dr. Julian and Clara Von Berg with Nilathra concierge Nimali at Hatton Tea Estate gate"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 inset-x-0 p-6 text-white space-y-1">
                <p className="text-xs text-brand-gold uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <MapPin size={13} /> Gated Estate Welcome &bull; Hatton Highlands
                </p>
                <p className="text-xs text-white/80 font-light">
                  Dr. Julian &amp; Clara Von Berg greeted by personal travel manager <strong className="text-white">Nimali</strong> upon estate arrival.
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
                <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/50 font-bold">Itinerary Pace</p>
                <p className="text-xs md:text-sm font-semibold text-brand-green">5D Ceylon + 3N Maldives</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                <Coffee size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/50 font-bold">Highland Sanctuary</p>
                <p className="text-xs md:text-sm font-semibold text-brand-green">Hatton Ceylon Tea Trails</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/50 font-bold">Privacy Protocol</p>
                <p className="text-xs md:text-sm font-semibold text-brand-green">Strict NDA &amp; Gated Security</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                <PlaneTakeoff size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/50 font-bold">Island Handoff</p>
                <p className="text-xs md:text-sm font-semibold text-brand-green">Nimali (SL) &rarr; Ashee (Maldives)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* UHNW Exclusivity & Investment Notice */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-sm text-amber-900 text-sm space-y-1 font-sans">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs text-amber-950">
              <ShieldAlert size={16} className="text-amber-600" />
              Sovereign Twin-Island Investment Tier Notice
            </div>
            <p className="text-amber-900/90 font-light leading-relaxed">
              Please note: Multi-country twin-island masterplans featuring private tea estate buyouts, dedicated security details, private train carriages, and overwater villa extensions are engineered strictly for UHNW clientele seeking top-tier bespoke sovereignty ($$$$$), rather than standard travel packages.
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
                  Letter from Dr. Julian &amp; Clara Von Berg
                </h3>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" />
                ))}
              </div>
            </div>

            {/* Letter Body - Genuine, Detailed, Highlighting Privacy & Unmatched Attention */}
            <div className="space-y-6 text-brand-charcoal/80 font-light leading-relaxed text-base md:text-lg font-serif">
              <p className="first-letter:text-5xl first-letter:font-bold first-letter:text-brand-green first-letter:mr-3 first-letter:float-left">
                As professionals accustomed to rigorous standards in Germany, our expectations for luxury travel leave no room for compromise. When we commissioned Nilathra Collection for our twin-island getaway arriving on April 3rd, 2026, we were looking for absolute logistical precision, total privacy protection, and genuine warmth. What we experienced exceeded every global benchmark.
              </p>

              <p>
                From our first arrival at BIA, our personal travel manager, <strong className="font-semibold text-brand-green">Nimali</strong>, implemented an impenetrable layer of privacy and security. Nilathra&apos;s team operated under strict Non-Disclosure Agreements (NDAs), routing our movements through private estate gates with discreet security details. We never had to navigate crowded lobbies or public waiting zones. We felt completely safe, anonymous, and enveloped in a serene sanctuary.
              </p>

              <p>
                We spent 5 glorious days in Ceylon&apos;s emerald highlands, residing at an exclusive <strong className="font-semibold text-brand-green">Hatton Ceylon Tea Trails Bungalow</strong>. What set Nimali apart was her staggering level of intuitive attention to detail:
              </p>

              <ul className="space-y-4 font-sans text-sm text-brand-charcoal/90 pl-4 border-l-2 border-brand-gold/40 my-6">
                <li className="flex items-start gap-3">
                  <Coffee size={18} className="text-brand-gold shrink-0 mt-0.5" />
                  <span><strong>Micro-Personalized Mornings:</strong> Nimali had pre-sourced our exact favorite organic single-origin German espresso blend, served at precisely 65°C on the bungalow veranda as sunrise illuminated the misty hills.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles size={18} className="text-brand-gold shrink-0 mt-0.5" />
                  <span><strong>VIP Closed-Door Tea Factory Access:</strong> Nimali arranged a private, after-hours visit to a nearby historic tea factory where the master blender conducted a private tasting session exclusively for Clara and me.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Train size={18} className="text-brand-gold shrink-0 mt-0.5" />
                  <span><strong>Private Luxury Train Clearance:</strong> For our excursion between Nuwara Eliya and Ella, Nimali secured an entire reserved observation cabin. We enjoyed the world-famous mountain railway in complete solitude, free from crowds or cameras.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Waves size={18} className="text-brand-gold shrink-0 mt-0.5" />
                  <span><strong>Morning Reservoir Kayaking:</strong> Each dawn, Nimali arranged private kayaking across the glassy waters of Castlereagh Lake. A support vessel stayed discreetly out of line of sight, and Nimali was waiting at the private dock with warm organic towels and chilled fresh coconut water.</span>
                </li>
              </ul>

              <p>
                After 5 days of highland perfection, the transition to the Maldives was where Nilathra&apos;s logistical mastery truly shone. There was zero friction. Nimali accompanied us to the tarmac departure in Colombo, handing us over directly to <strong className="font-semibold text-brand-green">Ashee</strong> at the Male Concierge Desk.
              </p>

              <p>
                Ashee had a private luxury speed-yacht waiting at the Male tarmac steps, whisking us away to our secluded overwater villa sanctuary in minutes. For 3 heavenly nights, Ashee oversaw every detail of our Maldivian retreat with the exact same precision and discretion before we flew back home to Frankfurt.
              </p>

              <div className="p-6 bg-[#FAF9F6] border-l-4 border-brand-gold my-8 rounded-r-sm font-sans text-brand-green italic font-normal text-base md:text-lg">
                &ldquo;German precision meets warm island sovereignty. The logistical seamlessness with which Nilathra arranged our twin-island escape between Ceylon&apos;s highlands and Maldives overwater sanctuaries set a new standard for luxury travel.&rdquo;
              </div>

              <p>
                While a multi-island masterplan of this magnitude represents a top-tier financial investment, the absolute peace of mind, unyielding privacy, and royal execution made it worth every single euro. Our heartfelt gratitude goes out to Nimali, Ashee, and the entire sovereign team at Nilathra Collection.
              </p>
            </div>

            {/* Signature Block */}
            <div className="mt-12 pt-8 border-t border-brand-charcoal/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <p className="font-serif font-bold text-xl text-brand-green">Dr. Julian &amp; Clara Von Berg</p>
                <p className="text-xs uppercase tracking-widest text-brand-gold font-semibold mt-0.5">
                  Private Estate &amp; Twin-Island Guests &bull; Frankfurt, Germany
                </p>
                <p className="text-[11px] text-brand-charcoal/50 mt-1">
                  Travel Dates: Apr 3, 2026 &ndash; Apr 11, 2026 (5D SL + 3N Maldives)
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-3 bg-brand-green/5 px-4 py-3 rounded-full border border-brand-green/10">
                  <ShieldCheck size={20} className="text-brand-green" />
                  <span className="text-xs text-brand-green font-medium">Verified Twin-Island Review</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-brand-gold bg-brand-gold/10 border border-brand-gold/20 px-3 py-2 rounded-full font-bold">
                  <span>NDA Written Release #SL-2026-TWIN-904</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Photo Gallery Grid */}
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-brand-gold text-[10px] font-black uppercase tracking-[0.3em] block">
                Visual Documentation
              </span>
              <h3 className="font-serif text-3xl text-brand-green">Highlights of the Highland Sanctuary</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative h-72 rounded-sm overflow-hidden border border-brand-charcoal/10 shadow-md group">
                <Image
                  src="/images/dr_julian_clara_nimali.webp"
                  alt="Dr. Julian & Clara Von Berg with Nimali at Hatton estate gate"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                  <p className="text-white text-xs font-semibold">Dr. Julian &amp; Clara Von Berg with Nimali at estate gate</p>
                </div>
              </div>

              <div className="relative h-72 rounded-sm overflow-hidden border border-brand-charcoal/10 shadow-md group">
                <Image
                  src="/images/ceylon_tea_trails_mansion_suv.webp"
                  alt="Hatton Ceylon Tea Trails Bungalow Mansion & SUV"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                  <p className="text-white text-xs font-semibold">Hatton Tea Trails Bungalow &amp; Estate Drive</p>
                </div>
              </div>

              <div className="relative h-72 rounded-sm overflow-hidden border border-brand-charcoal/10 shadow-md group">
                <Image
                  src="/images/hatton_tea_trails_evening.webp"
                  alt="Hatton Tea Trails Bungalow Evening View"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                  <p className="text-white text-xs font-semibold">Bungalow Terrace &amp; Fireplace Evening View</p>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications Breakdown */}
          <div className="bg-brand-green text-white p-8 md:p-12 rounded-sm space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-2 relative z-10">
              <span className="text-brand-gold text-[10px] font-black uppercase tracking-[0.4em] block">
                Masterplan Architecture
              </span>
              <h3 className="font-serif text-2xl md:text-4xl text-white">
                Twin-Island Inclusions &amp; Security Specs
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 text-sm">
              <div className="space-y-3 bg-white/5 p-6 rounded border border-white/10">
                <h4 className="font-bold text-brand-gold flex items-center gap-2 text-base">
                  <CheckCircle2 size={18} /> Ceylon Highlands (5 Days &bull; Managed by Nimali)
                </h4>
                <ul className="space-y-2 text-white/80 font-light">
                  <li>&bull; Hatton Ceylon Tea Trails Private Bungalow sanctuary</li>
                  <li>&bull; Private closed-door tour of working historic tea factory</li>
                  <li>&bull; Nuwara Eliya excursion &amp; Ella private luxury train carriage</li>
                  <li>&bull; Dawn kayaking on Castlereagh reservoir with private support vessel</li>
                  <li>&bull; 24/7 close-protection detail &amp; gated estate protocols</li>
                </ul>
              </div>

              <div className="space-y-3 bg-white/5 p-6 rounded border border-white/10">
                <h4 className="font-bold text-brand-gold flex items-center gap-2 text-base">
                  <CheckCircle2 size={18} /> Maldives Extension (3 Nights &bull; Managed by Ashee)
                </h4>
                <ul className="space-y-2 text-white/80 font-light">
                  <li>&bull; Tarmac steps reception at Male International Airport</li>
                  <li>&bull; Private speed-yacht transfer to overwater resort villa</li>
                  <li>&bull; 3 nights private overwater villa with personal butler</li>
                  <li>&bull; Seamless international departure handling back to Frankfurt</li>
                  <li>&bull; Total twin-island NDA identity protection</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-white p-10 md:p-14 rounded-sm border border-brand-gold/30 text-center space-y-6 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-brand-gold/15 text-brand-gold flex items-center justify-center mx-auto">
              <Heart size={32} />
            </div>

            <h3 className="font-serif text-3xl text-brand-green max-w-xl mx-auto">
              Request Your Sovereign Twin-Island Escape
            </h3>

            <p className="text-brand-charcoal/70 font-light text-base max-w-2xl mx-auto">
              Ready to experience Ceylon highlands and Maldives overwater sanctuaries with unyielding privacy? Let Nimali and Ashee craft your masterplan.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link 
                href="/custom-plan?plan=twin-island&concierge=nimali"
                className="w-full sm:w-auto px-8 py-4 bg-brand-green text-white font-bold uppercase tracking-widest text-xs rounded-full hover:bg-brand-gold hover:text-brand-green transition-all duration-300 shadow-lg"
              >
                Inquire With Nimali &amp; Ashee
              </Link>
              <Link 
                href="/contact"
                className="w-full sm:w-auto px-8 py-4 bg-transparent border border-brand-green text-brand-green font-bold uppercase tracking-widest text-xs rounded-full hover:bg-brand-green hover:text-white transition-all duration-300"
              >
                Contact Twin-Island Desk
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
