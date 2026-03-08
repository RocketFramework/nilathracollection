import MainLayout from "@/components/layout/MainLayout";
import Hero from "@/components/home/Hero";
import PackagesSection from "@/components/home/PackagesSection";
import DestinationsSection from "@/components/home/DestinationsSection";
import { ArrowRight, Quote } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <MainLayout>
      <Hero />

      {/* Brand Story Snippet */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center">
          <div className="flex-1 space-y-8">
            <span className="section-subtitle">Sri Lanka&apos;s Best Travel Agency</span>
            <h2 className="section-title">The Essence of Exclusive Sri Lankan Travel</h2>
            <p className="text-brand-charcoal/70 leading-relaxed text-lg font-light">
              Nilathra Collection was founded on a simple promise: to reveal the true heart of Sri Lanka to those who seek nothing but the finest. As the premier choice for luxury travelers, our deep-rooted heritage and local expertise allow us to open doors that remain closed to others.
            </p>
            <p className="text-brand-charcoal/70 leading-relaxed text-lg font-light italic border-l-4 border-brand-gold pl-6">
              &quot;We don&apos;t just plan trips; we curate legacies of travel that stay with you forever.&quot;
            </p>
            <Link href="/about" className="luxury-button-outline inline-block">
              Our Exclusive Story
            </Link>
          </div>
          <div className="flex-1 relative h-[600px] w-full">
            <div className="absolute top-0 right-0 w-4/5 h-4/5 z-10 overflow-hidden shadow-2xl">
              <Image
                src="/images/luxury_resort_sunset.png"
                alt="Luxury Sri Lanka Resort - Nilathra Collection"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-0 left-0 w-3/5 h-3/5 z-20 border-8 border-brand-sand overflow-hidden shadow-2xl translate-y-10 -translate-x-10 hidden md:block">
              <Image
                src="/images/hero_sigiriya_breakfast.png"
                alt="Bespoke VIP Travel Service Sri Lanka"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <PackagesSection />

      <DestinationsSection />

      {/* Testimonials / Trust Section */}
      <section className="py-24 bg-brand-green text-white px-6 md:px-12 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-gold rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-[120px]" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <Quote className="mx-auto mb-10 text-brand-gold opacity-50" size={60} />
          <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-12">
            "An unparalleled experience. From the private villa in Ella to the seamless VIP handling at Colombo, Nilathra Collection exceeded every expectation. True Sri Lankan luxury."
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
            "name": "Nilathra Collection",
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
