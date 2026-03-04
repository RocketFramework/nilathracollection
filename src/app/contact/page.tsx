import MainLayout from "@/components/layout/MainLayout";
import { Phone, Mail, MapPin, MessageCircle, Send, Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ContactPage() {
    return (
        <MainLayout>
            <section className="pt-32 pb-24 px-6 md:px-12 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                        <div>
                            <span className="section-subtitle">Get In Touch</span>
                            <h1 className="section-title !text-6xl mb-8">Let's Design Your <span className="text-brand-gold italic">Legacy Journey</span>.</h1>
                            <p className="text-brand-charcoal/60 text-lg font-light leading-relaxed mb-12">
                                Our concierges are available 24/7 to assist with your inquiries. Whether it's a quick question or a detailed request for a super luxury VIP experience, we are here to provide discreet and elegant service.
                            </p>

                            <div className="space-y-8">
                                <div className="flex items-start gap-6 group">
                                    <div className="w-12 h-12 bg-brand-sand rounded-full flex items-center justify-center group-hover:bg-brand-gold group-hover:text-white transition-all duration-500">
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-brand-charcoal/50 font-bold mb-1">Direct Line</p>
                                        <p className="text-xl font-serif">+94 77 727 8282</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-6 group">
                                    <div className="w-12 h-12 bg-brand-sand rounded-full flex items-center justify-center group-hover:bg-brand-gold group-hover:text-white transition-all duration-500">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-brand-charcoal/50 font-bold mb-1">Email Concierge</p>
                                        <p className="text-xl font-serif">concierge@nilathra.com</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-6 group">
                                    <div className="w-12 h-12 bg-brand-sand rounded-full flex items-center justify-center group-hover:bg-brand-gold group-hover:text-white transition-all duration-500">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-brand-charcoal/50 font-bold mb-1">Headquarters</p>
                                        <p className="text-xl font-serif">Colombo, Sri Lanka</p>
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-brand-charcoal/5">
                                    <Link
                                        href="https://wa.me/94771234567"
                                        target="_blank"
                                        className="flex items-center gap-4 text-brand-green font-bold tracking-widest uppercase hover:text-brand-gold transition-colors"
                                    >
                                        <MessageCircle fill="currentColor" size={24} className="text-green-500" /> WhatsApp Us Instantly
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="bg-brand-sand p-10 md:p-16 rounded-sm shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Globe size={300} />
                            </div>
                            <h3 className="font-serif text-3xl text-brand-green mb-10 relative z-10">Send a Private Inquiry</h3>
                            <form className="space-y-6 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-brand-charcoal/40">Full Name</label>
                                        <input type="text" className="w-full bg-white/50 border-b border-brand-charcoal/20 p-3 outline-none focus:border-brand-gold transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-brand-charcoal/40">Email Address</label>
                                        <input type="email" className="w-full bg-white/50 border-b border-brand-charcoal/20 p-3 outline-none focus:border-brand-gold transition-colors" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-brand-charcoal/40">Inquiry Type</label>
                                    <select className="w-full bg-white/50 border-b border-brand-charcoal/20 p-3 outline-none focus:border-brand-gold transition-colors appearance-none">
                                        <option>Super Luxury VIP Experience</option>
                                        <option>Deluxe Collection Package</option>
                                        <option>Standard Premium Plan</option>
                                        <option>Custom Mix Itinerary</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-brand-charcoal/40">Message</label>
                                    <textarea rows={6} className="w-full bg-white/50 border-b border-brand-charcoal/20 p-3 outline-none focus:border-brand-gold transition-colors resize-none"></textarea>
                                </div>
                                <button className="luxury-button w-full flex items-center justify-center gap-4 !bg-brand-charcoal hover:!bg-brand-green">
                                    Deliver Inquiry <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* Map Placeholder */}
            <section className="h-[400px] w-full relative bg-brand-sand">
                <div className="absolute inset-0 grayscale opacity-40">
                    <Image
                        src="/images/luxury_resort_sunset.png"
                        alt="Map"
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white p-6 shadow-2xl flex items-center gap-4 rounded-sm border-t-2 border-brand-gold">
                        <MapPin className="text-brand-gold" size={32} />
                        <div>
                            <p className="font-serif text-xl">Nilathra Collection</p>
                            <p className="text-xs text-brand-charcoal/50 uppercase tracking-widest">Colombo, Sri Lanka</p>
                        </div>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}
