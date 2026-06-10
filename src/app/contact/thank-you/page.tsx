import { Metadata } from "next";
import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Compass, Calendar, PhoneCall } from "lucide-react";

export const metadata: Metadata = {
    title: "Inquiry Delivered | Thank You | Nilathra Collection",
    description: "Thank you for contacting Nilathra Collection. Our dedicated concierge team will review your private inquiry and contact you shortly.",
    alternates: {
        canonical: "https://www.nilathra.com/contact/thank-you",
    },
    robots: {
        index: false,
        follow: false,
    },
};

export default function ThankYouPage() {
    return (
        <MainLayout>
            <section className="min-h-screen pt-32 pb-24 px-6 md:px-12 flex items-center justify-center bg-brand-sand relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-2xl w-full text-center relative z-10">
                    {/* Animated Checkmark Container */}
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-brand-green/5 border border-brand-green/10 text-brand-green mb-10 animate-fade-in shadow-inner">
                        <CheckCircle2 size={48} className="text-brand-gold stroke-[1.25]" />
                    </div>

                    {/* Headline and Message */}
                    <span className="text-brand-gold font-medium uppercase tracking-[0.3em] text-xs mb-3 block animate-slide-up">
                        Inquiry Received
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-brand-green mb-6 leading-tight animate-slide-up [animation-delay:0.2s]">
                        Thank You for <br />
                        <span className="italic font-light">Reaching Out</span>.
                    </h1>
                    <p className="text-brand-charcoal/70 text-lg font-light leading-relaxed max-w-lg mx-auto mb-12 animate-fade-in [animation-delay:0.4s]">
                        Your private inquiry has been successfully delivered. A dedicated Nilathra travel specialist is being assigned to review your preferences and will contact you shortly to begin curating your bespoke experience.
                    </p>

                    {/* Next Steps Card */}
                    <div className="bg-white/60 backdrop-blur-md border border-brand-gold/10 p-8 rounded-sm shadow-xl text-left mb-12 animate-slide-up [animation-delay:0.6s]">
                        <h2 className="font-serif text-xl text-brand-green mb-4 border-b border-brand-charcoal/5 pb-2">What happens next?</h2>
                        <ul className="space-y-4">
                            <li className="flex gap-4">
                                <span className="w-6 h-6 rounded-full bg-brand-gold/15 text-brand-gold text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                                <div>
                                    <h3 className="font-medium text-sm text-brand-charcoal">Concierge Assignment</h3>
                                    <p className="text-xs text-brand-charcoal/60">We review your specifications and assign the consultant best suited for your destinations.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="w-6 h-6 rounded-full bg-brand-gold/15 text-brand-gold text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                                <div>
                                    <h3 className="font-medium text-sm text-brand-charcoal">First Draft</h3>
                                    <p className="text-xs text-brand-charcoal/60">Within 72 hours, you will receive an initial custom travel proposal for your review.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="w-6 h-6 rounded-full bg-brand-gold/15 text-brand-gold text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                                <div>
                                    <h3 className="font-medium text-sm text-brand-charcoal">Tailoring & Booking</h3>
                                    <p className="text-xs text-brand-charcoal/60">We refine the details and secure premium accommodations and experiences for your stay.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-slide-up [animation-delay:0.8s]">
                        <Link
                            id="btn-return-home"
                            href="/"
                            className="luxury-button w-full sm:w-auto inline-flex items-center justify-center gap-2"
                        >
                            Return to Homepage <ArrowRight size={16} />
                        </Link>
                        <Link
                            id="btn-view-packages"
                            href="/packages"
                            className="luxury-button-outline w-full sm:w-auto inline-flex items-center justify-center gap-2"
                        >
                            <Compass size={16} /> Explore Packages
                        </Link>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}
