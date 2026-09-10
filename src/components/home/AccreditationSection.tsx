"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ShieldCheck, Award, Building2, CheckCircle2 } from "lucide-react";

export default function AccreditationSection() {
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
            Official Licensing &amp; Accreditation
          </span>
          <h2 className="font-serif text-3xl md:text-5xl text-brand-green">
            Accredited &amp; Registered Agency
          </h2>
          <p className="text-brand-charcoal/70 font-light leading-relaxed text-sm md:text-base">
            Nilathra Collection operates under strict regulatory compliance and official licensing, guaranteeing absolute legitimacy, client protection, and sovereign quality standards across Sri Lanka.
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
                alt="Sri Lanka Tourism Development Authority Registered Agency"
                width={160}
                height={160}
                className="object-contain max-h-full"
                priority
              />
            </div>

            <div className="space-y-4 text-center sm:text-left flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-[11px] font-bold uppercase tracking-wider">
                <Award size={14} />
                <span>SLTDA Registered Agency</span>
              </div>
              <h3 className="font-serif text-xl md:text-2xl text-brand-green font-bold">
                Sri Lanka Tourism Development Authority
              </h3>
              <p className="text-brand-charcoal/70 text-xs md:text-sm font-light leading-relaxed">
                Officially licensed Inbound Tour Operator registered under the Sri Lanka Tourism Development Authority (SLTDA).
              </p>

              <ul className="space-y-2 pt-2 border-t border-neutral-100 text-xs text-brand-charcoal/80">
                <li className="flex items-center gap-2 justify-center sm:justify-start">
                  <CheckCircle2 size={14} className="text-brand-gold shrink-0" />
                  <span>Licensed Destination Management Company</span>
                </li>
                <li className="flex items-center gap-2 justify-center sm:justify-start">
                  <CheckCircle2 size={14} className="text-brand-gold shrink-0" />
                  <span>Certified High Safety &amp; Service Standards</span>
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
                alt="Sri Lanka Government Registered Company"
                width={160}
                height={160}
                className="object-contain max-h-full"
                priority
              />
            </div>

            <div className="space-y-4 text-center sm:text-left flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/10 border border-brand-green/30 text-brand-green text-[11px] font-bold uppercase tracking-wider">
                <Building2 size={14} />
                <span>Government Registered Company</span>
              </div>
              <h3 className="font-serif text-xl md:text-2xl text-brand-green font-bold">
                Government of Sri Lanka
              </h3>
              <p className="text-brand-charcoal/70 text-xs md:text-sm font-light leading-relaxed">
                Officially incorporated Private Limited Company (Pvt Ltd) registered under the Registrar General of Companies of Sri Lanka.
              </p>

              <ul className="space-y-2 pt-2 border-t border-neutral-100 text-xs text-brand-charcoal/80">
                <li className="flex items-center gap-2 justify-center sm:justify-start">
                  <ShieldCheck size={14} className="text-brand-green shrink-0" />
                  <span>Full Corporate Legal Sovereignty</span>
                </li>
                <li className="flex items-center gap-2 justify-center sm:justify-start">
                  <ShieldCheck size={14} className="text-brand-green shrink-0" />
                  <span>Financial Guarantee &amp; Consumer Security</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
