"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ShieldCheck, Award, Building2, CheckCircle2, Plane } from "lucide-react";
import { useTranslation } from "@/components/I18nProvider";

export default function AccreditationSection() {
  const dict = useTranslation();
  const acc = dict?.home?.accreditation || {};

  return (
    <section 
      id="accreditation-section" 
      className="py-20 px-6 md:px-12 bg-gradient-to-b from-white via-[#FAF9F6] to-white relative overflow-hidden border-t border-brand-charcoal/5"
    >
      {/* Subtle background luxury glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-brand-gold text-[10px] font-black uppercase tracking-[0.4em] block">
            {acc.subtitle || "Official Licensing & Accreditation"}
          </span>
          <h2 className="font-serif text-3xl md:text-5xl text-brand-green">
            {acc.title || "Accredited & Registered Agency"}
          </h2>
          <p className="text-brand-charcoal/70 font-light leading-relaxed text-sm md:text-base">
            {acc.description || "Nilathra Collection operates under strict regulatory compliance and official licensing, guaranteeing absolute legitimacy, client protection, and sovereign quality standards across Sri Lanka."}
          </p>
        </div>

        {/* Accreditation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Card 1: Sri Lanka Tourist Board Authority Registered Agency */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            id="accreditation-card-sltda"
            className="bg-white/80 backdrop-blur-sm border border-brand-gold/20 p-8 md:p-10 rounded-lg shadow-xl hover:shadow-2xl hover:border-brand-gold/50 transition-all duration-300 flex flex-col sm:flex-row items-center sm:items-start gap-8 group"
          >
            <div className="relative shrink-0 w-36 h-36 md:w-40 md:h-40 flex items-center justify-center p-3 bg-neutral-50 rounded-full border border-neutral-100 shadow-inner group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/images/accreditation/sltda_registered_agency.png"
                alt={acc.sltda_title || "Sri Lanka Tourism Development Authority Registered Agency"}
                width={160}
                height={160}
                className="object-contain max-h-full"
                priority
              />
            </div>

            <div className="space-y-4 text-center sm:text-left flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-[11px] font-bold uppercase tracking-wider">
                <Award size={14} />
                <span>{acc.sltda_badge || "SLTDA Registered Agency"}</span>
              </div>
              <h3 className="font-serif text-xl md:text-2xl text-brand-green font-bold">
                {acc.sltda_title || "Sri Lanka Tourism Development Authority"}
              </h3>
              <p className="text-brand-charcoal/70 text-xs md:text-sm font-light leading-relaxed">
                {acc.sltda_desc || "Officially licensed Inbound Tour Operator registered under the Sri Lanka Tourism Development Authority (SLTDA)."}
              </p>

              <ul className="space-y-2 pt-2 border-t border-neutral-100 text-xs text-brand-charcoal/80">
                <li className="flex items-center gap-2 justify-center sm:justify-start">
                  <CheckCircle2 size={14} className="text-brand-gold shrink-0" />
                  <span>{acc.sltda_bullet1 || "Licensed Destination Management Company"}</span>
                </li>
                <li className="flex items-center gap-2 justify-center sm:justify-start">
                  <CheckCircle2 size={14} className="text-brand-gold shrink-0" />
                  <span>{acc.sltda_bullet2 || "Certified High Safety & Service Standards"}</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Card 2: Sri Lanka Government Registered Company */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            id="accreditation-card-gov"
            className="bg-white/80 backdrop-blur-sm border border-brand-gold/20 p-8 md:p-10 rounded-lg shadow-xl hover:shadow-2xl hover:border-brand-gold/50 transition-all duration-300 flex flex-col sm:flex-row items-center sm:items-start gap-8 group"
          >
            <div className="relative shrink-0 w-36 h-36 md:w-40 md:h-40 flex items-center justify-center p-3 bg-neutral-50 rounded-full border border-neutral-100 shadow-inner group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/images/accreditation/sl_gov_registered_company.png"
                alt={acc.gov_title || "Sri Lanka Government Registered Company"}
                width={160}
                height={160}
                className="object-contain max-h-full"
                priority
              />
            </div>

            <div className="space-y-4 text-center sm:text-left flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/10 border border-brand-green/30 text-brand-green text-[11px] font-bold uppercase tracking-wider">
                <Building2 size={14} />
                <span>{acc.gov_badge || "Government Registered Company"}</span>
              </div>
              <h3 className="font-serif text-xl md:text-2xl text-brand-green font-bold">
                {acc.gov_title || "Government of Sri Lanka"}
              </h3>
              <p className="text-brand-charcoal/70 text-xs md:text-sm font-light leading-relaxed">
                {acc.gov_desc || "Officially incorporated Private Limited Company (Pvt Ltd) registered under the Registrar General of Companies of Sri Lanka."}
              </p>

              <ul className="space-y-2 pt-2 border-t border-neutral-100 text-xs text-brand-charcoal/80">
                <li className="flex items-center gap-2 justify-center sm:justify-start">
                  <ShieldCheck size={14} className="text-brand-green shrink-0" />
                  <span>{acc.gov_bullet1 || "Full Corporate Legal Sovereignty"}</span>
                </li>
                <li className="flex items-center gap-2 justify-center sm:justify-start">
                  <ShieldCheck size={14} className="text-brand-green shrink-0" />
                  <span>{acc.gov_bullet2 || "Financial Guarantee & Consumer Security"}</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Verified Professional Network Guarantee Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25 }}
          id="accreditation-card-network-guarantee"
          className="mt-12 bg-gradient-to-r from-brand-charcoal via-[#1A241F] to-brand-charcoal border border-brand-gold/30 p-8 md:p-10 rounded-2xl shadow-2xl text-white relative overflow-hidden"
        >
          {/* Subtle gold ambient glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-gold/20 pb-6">
              <div className="space-y-1">
                <span className="text-brand-gold text-[10px] font-black uppercase tracking-[0.3em] block">
                  {acc.network_subtitle || "Strict Quality & Service Standard"}
                </span>
                <h3 className="font-serif text-2xl md:text-3xl text-white font-bold">
                  {acc.network_title || "SLTDA Authorized & Hand-Picked Network"}
                </h3>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/20 border border-brand-gold/40 text-brand-gold text-xs font-bold uppercase tracking-wider shrink-0 self-start md:self-auto">
                <ShieldCheck size={16} />
                <span>{acc.network_badge || "100% Certified & Vetted"}</span>
              </div>
            </div>

            <p className="text-neutral-300 text-sm md:text-base font-light leading-relaxed max-w-4xl">
              {acc.network_desc || "For absolute client safety and sovereign quality, Nilathra Collection exclusively engages Sri Lanka Tourism Development Authority (SLTDA) Authorized Drivers and Tour Guides, alongside hand-picked veteran Safari Drivers, hand-picked Yacht Captains, and audited Activity Providers."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {/* Pillar 1: SLTDA Drivers */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2 hover:border-brand-gold/40 transition-colors">
                <div className="flex items-center gap-2 text-brand-gold font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{acc.network_item1_title || "SLTDA Authorized Drivers"}</span>
                </div>
                <p className="text-neutral-400 text-xs font-light leading-normal">
                  {acc.network_item1_desc || "Officially licensed, background-vetted tourist drivers with flawless safety records."}
                </p>
              </div>

              {/* Pillar 2: SLTDA Tour Guides */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2 hover:border-brand-gold/40 transition-colors">
                <div className="flex items-center gap-2 text-brand-gold font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{acc.network_item2_title || "SLTDA Registered Guides"}</span>
                </div>
                <p className="text-neutral-400 text-xs font-light leading-normal">
                  {acc.network_item2_desc || "Certified National & Lecturer Guides possessing deep historical erudition and language fluency."}
                </p>
              </div>

              {/* Pillar 3: Hand-Picked Safari & Yacht Captains */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2 hover:border-brand-gold/40 transition-colors">
                <div className="flex items-center gap-2 text-brand-gold font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{acc.network_item3_title || "Hand-Picked Safari & Yachts"}</span>
                </div>
                <p className="text-neutral-400 text-xs font-light leading-normal">
                  {acc.network_item3_desc || "Veteran 4x4 wildlife trackers for Yala/Wilpattu & certified marine captains for private yacht charters."}
                </p>
              </div>

              {/* Pillar 4: Zero-Fatal-Accident Aviation */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2 hover:border-brand-gold/40 transition-colors border-brand-gold/20">
                <div className="flex items-center gap-2 text-brand-gold font-bold text-xs uppercase tracking-wider">
                  <Plane size={16} className="shrink-0 text-brand-gold" />
                  <span>{acc.network_item4_title || "Zero-Fatal-Accident Aviation"}</span>
                </div>
                <p className="text-neutral-400 text-xs font-light leading-normal">
                  {acc.network_item4_desc || "Air travel & helicopter charters operated exclusively with the Sri Lanka Air Force or private partners with a flawless zero fatal accident history."}
                </p>
              </div>

              {/* Pillar 5: Vetted Activity Providers */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2 hover:border-brand-gold/40 transition-colors sm:col-span-2 lg:col-span-2">
                <div className="flex items-center gap-2 text-brand-gold font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{acc.network_item5_title || "Vetted Activity Partners"}</span>
                </div>
                <p className="text-neutral-400 text-xs font-light leading-normal">
                  {acc.network_item5_desc || "Hand-picked local masters, wellness practitioners, and adventure operators meeting strict safety audits."}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
