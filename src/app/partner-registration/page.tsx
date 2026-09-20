import Link from "next/link";
import Image from "next/image";
import MainLayout from "@/components/layout/MainLayout";
import { Car, UserCheck, ShieldCheck, Award, ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata = {
    title: "Partner Registration | Nilathra Collection",
    description: "Join Sri Lanka's premier luxury travel partner network. Onboarding portals for Transport Service Providers and Luxury Tourist Guides.",
    alternates: {
        canonical: "https://www.nilathra.com/partner-registration",
    },
};

export default function PartnerRegistrationLandingPage() {
    return (
        <MainLayout>
            <div className="bg-[#FAF9F5] min-h-screen pt-24 md:pt-32 pb-16 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
                <div className="max-w-6xl mx-auto">
                    {/* Header Banner */}
                    <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-xs font-bold uppercase tracking-widest">
                            <Award size={14} /> Nilathra Partner Network
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-charcoal tracking-tight">
                            Partner Onboarding Portals
                        </h1>
                        <p className="text-neutral-600 text-lg leading-relaxed">
                            Join Sri Lanka’s premier luxury travel network. We connect refined transport providers and distinguished tourist guides with high-net-worth international travelers.
                        </p>
                    </div>

                    {/* Portals Cards Grid displaying campaign posters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20">
                        {/* Transport Provider Portal Card */}
                        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col group">
                            <div className="relative h-96 w-full bg-neutral-900 overflow-hidden">
                                <Image
                                    src="/images/partners/transport-wanted.jpg"
                                    alt="Transport Providers Wanted - Nilathra Collection"
                                    fill
                                    className="object-contain group-hover:scale-105 transition-transform duration-700"
                                    priority
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                <div className="absolute bottom-4 left-6 right-6 text-white">
                                    <span className="px-3 py-1 bg-brand-gold text-brand-charcoal text-xs font-bold uppercase tracking-wider rounded-md">
                                        Transport Fleet
                                    </span>
                                    <h2 className="text-2xl font-serif font-bold mt-2">Transport Provider Registration</h2>
                                </div>
                            </div>
                            <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                                <div className="space-y-4">
                                    <p className="text-neutral-600 text-sm leading-relaxed">
                                        We are seeking Mercedes-Benz, latest Toyota models, VIP vans, luxury buses, and custom-modified luxury interior vehicles for Nilathra’s premium guest itineraries.
                                    </p>
                                    <ul className="space-y-2 text-xs text-neutral-700 font-medium">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-brand-gold shrink-0" />
                                            <span>Driver must be SLTDA-registered</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-brand-gold shrink-0" />
                                            <span>Vehicle SLTDA registration is optional</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-brand-gold shrink-0" />
                                            <span>Attractive partner pay rates & steady bookings</span>
                                        </li>
                                    </ul>
                                </div>

                                <Link
                                    href="/partner-registration/transport-provider"
                                    className="w-full py-4 px-6 bg-brand-charcoal text-white text-center font-bold rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg group-hover:bg-brand-gold group-hover:text-brand-charcoal"
                                >
                                    <Car size={18} />
                                    <span>Onboard Transport Provider</span>
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>

                        {/* Tour Guide Portal Card */}
                        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col group">
                            <div className="relative h-96 w-full bg-neutral-900 overflow-hidden">
                                <Image
                                    src="/images/partners/guides-wanted.jpg"
                                    alt="Luxury Tourist Guides Wanted - Nilathra Collection"
                                    fill
                                    className="object-contain group-hover:scale-105 transition-transform duration-700"
                                    priority
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                <div className="absolute bottom-4 left-6 right-6 text-white">
                                    <span className="px-3 py-1 bg-brand-gold text-brand-charcoal text-xs font-bold uppercase tracking-wider rounded-md">
                                        Tourist Guides
                                    </span>
                                    <h2 className="text-2xl font-serif font-bold mt-2">Tour Guide Registration</h2>
                                </div>
                            </div>
                            <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                                <div className="space-y-4">
                                    <p className="text-neutral-600 text-sm leading-relaxed">
                                        We are looking for refined, experienced tourist guides to serve high-net-worth travelers across Sri Lanka. German and French language proficiency is an added advantage.
                                    </p>
                                    <ul className="space-y-2 text-xs text-neutral-700 font-medium">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-brand-gold shrink-0" />
                                            <span>SLTDA Registration is Mandatory</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-brand-gold shrink-0" />
                                            <span>Pay rates above industry average</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-brand-gold shrink-0" />
                                            <span>German / French / Multilingual advantages</span>
                                        </li>
                                    </ul>
                                </div>

                                <Link
                                    href="/partner-registration/tour-guide"
                                    className="w-full py-4 px-6 bg-brand-charcoal text-white text-center font-bold rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg group-hover:bg-brand-gold group-hover:text-brand-charcoal"
                                >
                                    <UserCheck size={18} />
                                    <span>Onboard Tour Guide</span>
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>

                        {/* Chauffeur (Driver) Portal Card */}
                        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col group">
                            <div className="relative h-96 w-full bg-neutral-900 overflow-hidden">
                                <Image
                                    src="/images/partners/chauffeurs-wanted.jpg"
                                    alt="Luxury Chauffeurs & Drivers Wanted - Nilathra Collection"
                                    fill
                                    className="object-contain group-hover:scale-105 transition-transform duration-700"
                                    priority
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                <div className="absolute bottom-4 left-6 right-6 text-white">
                                    <span className="px-3 py-1 bg-brand-gold text-brand-charcoal text-xs font-bold uppercase tracking-wider rounded-md">
                                        Chauffeurs & Drivers
                                    </span>
                                    <h2 className="text-2xl font-serif font-bold mt-2">Chauffeur Registration</h2>
                                </div>
                            </div>
                            <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                                <div className="space-y-4">
                                    <p className="text-neutral-600 text-sm leading-relaxed">
                                        Join Sri Lanka’s premier network of professional luxury chauffeurs. Onboard directly with your SLTDA certificate, driving license, and National ID.
                                    </p>
                                    <ul className="space-y-2 text-xs text-neutral-700 font-medium">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-brand-gold shrink-0" />
                                            <span>SLTDA Certification & License required</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-brand-gold shrink-0" />
                                            <span>Guaranteed per-day rates & prompt payouts</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-brand-gold shrink-0" />
                                            <span>Direct integration with luxury tour assignments</span>
                                        </li>
                                    </ul>
                                </div>

                                <Link
                                    href="/partner-registration/chauffeur"
                                    className="w-full py-4 px-6 bg-brand-charcoal text-white text-center font-bold rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg group-hover:bg-brand-gold group-hover:text-brand-charcoal"
                                >
                                    <Car size={18} />
                                    <span>Onboard Chauffeur</span>
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>

                        {/* Activity Vendor Portal Card */}
                        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col group">
                            <div className="relative h-96 w-full bg-neutral-900 overflow-hidden">
                                <Image
                                    src="/images/partners/activity-vendors-wanted.jpg"
                                    alt="Activity Experience Vendors Wanted - Nilathra Collection"
                                    fill
                                    className="object-contain group-hover:scale-105 transition-transform duration-700"
                                    priority
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                <div className="absolute bottom-4 left-6 right-6 text-white">
                                    <span className="px-3 py-1 bg-brand-gold text-brand-charcoal text-xs font-bold uppercase tracking-wider rounded-md">
                                        Experience Vendors
                                    </span>
                                    <h2 className="text-2xl font-serif font-bold mt-2">Activity Vendor Registration</h2>
                                </div>
                            </div>
                            <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                                <div className="space-y-4">
                                    <p className="text-neutral-600 text-sm leading-relaxed">
                                        Partner with Nilathra to receive tourist activity session bookings for safari, water sports, trekking, wellness, and cultural experiences.
                                    </p>
                                    <ul className="space-y-2 text-xs text-neutral-700 font-medium">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-brand-gold shrink-0" />
                                            <span>Duplicate check for registered companies</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-brand-gold shrink-0" />
                                            <span>Map multiple offered activities with agreed prices</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-brand-gold shrink-0" />
                                            <span>Direct email notifications for guest assignments</span>
                                        </li>
                                    </ul>
                                </div>

                                <Link
                                    href="/partner-registration/activity-vendor"
                                    className="w-full py-4 px-6 bg-brand-charcoal text-white text-center font-bold rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg group-hover:bg-brand-gold group-hover:text-brand-charcoal"
                                >
                                    <UserCheck size={18} />
                                    <span>Onboard Activity Vendor</span>
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Onboarding Process Information Section */}
                    <div className="bg-white rounded-3xl border border-neutral-200 p-8 md:p-12 shadow-sm space-y-8">
                        <div className="text-center max-w-2xl mx-auto space-y-2">
                            <h3 className="text-2xl font-serif font-bold text-brand-charcoal">
                                Simple & Secure Partner Onboarding Process
                            </h3>
                            <p className="text-neutral-500 text-sm">
                                Follow these 5 easy steps to register or update your profile in Nilathra&apos;s Partner System.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-3">
                                <div className="w-10 h-10 rounded-full bg-brand-gold/20 text-brand-gold font-bold flex items-center justify-center text-sm">
                                    01
                                </div>
                                <h4 className="font-bold text-brand-charcoal text-sm">Get Campaign Code</h4>
                                <p className="text-xs text-neutral-500 leading-relaxed">
                                    Obtain the official Onboarding Code provided in our marketing campaigns.
                                </p>
                            </div>

                            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-3">
                                <div className="w-10 h-10 rounded-full bg-brand-gold/20 text-brand-gold font-bold flex items-center justify-center text-sm">
                                    02
                                </div>
                                <h4 className="font-bold text-brand-charcoal text-sm">Enter Code & NIC</h4>
                                <p className="text-xs text-neutral-500 leading-relaxed">
                                    Enter your Sri Lankan National ID (NIC) and campaign code to access or edit your profile.
                                </p>
                            </div>

                            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-3">
                                <div className="w-10 h-10 rounded-full bg-brand-gold/20 text-brand-gold font-bold flex items-center justify-center text-sm">
                                    03
                                </div>
                                <h4 className="font-bold text-brand-charcoal text-sm">Fill Profile & Fleet</h4>
                                <p className="text-xs text-neutral-500 leading-relaxed">
                                    Provide contact info, SLTDA credentials, vehicle fleet details, and bank account info.
                                </p>
                            </div>

                            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-3">
                                <div className="w-10 h-10 rounded-full bg-brand-gold/20 text-brand-gold font-bold flex items-center justify-center text-sm">
                                    04
                                </div>
                                <h4 className="font-bold text-brand-charcoal text-sm">Inspection and Interview</h4>
                                <p className="text-xs text-neutral-500 leading-relaxed">
                                    Once the details provided, conducting the credential verification
                                </p>
                            </div>

                            <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-3">
                                <div className="w-10 h-10 rounded-full bg-brand-gold/20 text-brand-gold font-bold flex items-center justify-center text-sm">
                                    05
                                </div>
                                <h4 className="font-bold text-brand-charcoal text-sm">Receive VIP Bookings</h4>
                                <p className="text-xs text-neutral-500 leading-relaxed">
                                    Once verified by our concierge team, receive direct Purchase Orders for premium itineraries.
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-neutral-100 text-center">
                            <p className="text-xs text-neutral-400 flex items-center justify-center gap-1.5">
                                <ShieldCheck size={16} className="text-brand-gold" />
                                <span>Anti-Spam Protected: Each National ID (NIC) is linked to a single partner profile. Edit your profile anytime using your NIC.</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
