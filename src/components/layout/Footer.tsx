import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Youtube, Linkedin, X } from "lucide-react";
import { TikTok_Sans } from "next/font/google";

const Tiktok = ({ size = 24 }: { size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);

export default function Footer() {
    return (
        <footer className="bg-brand-green text-white pt-20 pb-10 px-6 md:px-12">
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-12 mb-16">
                <div className="space-y-6 md:col-span-1">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-full brightness-0 invert">
                            <Image
                                src="/images/nilathra_travels_logo.avif"
                                alt="Nilathra Collection Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <span className="font-serif text-2xl font-bold tracking-tighter uppercase">
                            NILATHRA <span className="text-[#016795]">COLLECTION</span>
                        </span>
                    </Link>
                    <p className="text-white/70 text-sm leading-relaxed max-w-xs">
                        Sri Lanka&apos;s premier luxury travel curator. From VIP handling to bespoke itineraries, we go above and beyond the norm to bring you the heart of the island.
                    </p>
                    <div className="flex items-center gap-5">
                        <a
                            href="https://www.facebook.com/nilathracollection/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Facebook"
                            className="transition-all duration-300 hover:text-brand-gold hover:scale-110"
                        >
                            <Facebook size={20} />
                        </a>
                        <a
                            href="https://www.instagram.com/nilathracollection/?hl=en"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Instagram"
                            className="transition-all duration-300 hover:text-brand-gold hover:scale-110"
                        >
                            <Instagram size={20} />
                        </a>
                        <a
                            href="https://twitter.com/NilathraTravels"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Twitter"
                            className="transition-all duration-300 hover:text-brand-gold hover:scale-110"
                        >
                            <Twitter size={20} />
                        </a>
                        <a
                            href="https://www.youtube.com/@nilathratravels"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="YouTube"
                            className="transition-all duration-300 hover:text-brand-gold hover:scale-110"
                        >
                            <Youtube size={20} />
                        </a>
                        <a
                            href="https://www.linkedin.com/company/nilathra-travels/?viewAsMember=true"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="LinkedIn"
                            className="transition-all duration-300 hover:text-brand-gold hover:scale-110"
                        >
                            <Linkedin size={20} />
                        </a>
                        <a
                            href="https://x.com/nilathraC"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="X"
                            className="transition-all duration-300 hover:text-brand-gold hover:scale-110"
                        >
                            <X size={20} />
                        </a>
                        <a
                            href="https://www.tiktok.com/@nilathra_collection"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="TikTok"
                            className="transition-all duration-300 hover:text-brand-gold hover:scale-110"
                        >
                            <Tiktok size={20} />
                        </a>
                    </div>
                </div>

                <div>
                    <h4 className="font-serif text-xl border-b border-brand-gold inline-block mb-6">Quick Links</h4>
                    <ul className="space-y-3">
                        <li><Link href="/destinations" className="text-white/70 hover:text-white transition-colors">Our Destinations</Link></li>
                        <li><Link href="/plans" className="text-white/70 hover:text-white transition-colors">Travel Packages</Link></li>
                        <li><Link href="/plans/compare" className="text-white/70 hover:text-white transition-colors">Compare All Plans</Link></li>
                        <li><Link href="/blog" className="text-white/70 hover:text-white transition-colors">The Journal (Blog)</Link></li>
                        <li><Link href="/custom-plan" className="text-white/70 hover:text-white transition-colors">Tailored Journey</Link></li>
                        <li><Link href="/about" className="text-white/70 hover:text-white transition-colors">The Collection</Link></li>
                        <li><Link href="/careers" className="text-white/70 hover:text-white transition-colors">Careers</Link></li>
                        <li><Link href="/reference" className="text-white/70 hover:text-white transition-colors">Travel Reference</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-serif text-xl border-b border-brand-gold inline-block mb-6">Collections</h4>
                    <ul className="space-y-3">
                        <li><Link href="/for-vip" className="text-white/70 hover:text-white transition-colors">Sovereignty (VIP)</Link></li>
                        <li><Link href="/elite-journeys" className="text-white/70 hover:text-white transition-colors">Elite Journeys</Link></li>
                        <li><Link href="/wild-ceylon" className="text-white/70 hover:text-white transition-colors">Wild Ceylon</Link></li>
                        <li><Link href="/imperial-helicopter" className="text-white/70 hover:text-white transition-colors">Helicopter Charters</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-serif text-xl border-b border-brand-gold inline-block mb-6">Destinations</h4>
                    <ul className="space-y-3">
                        <li><Link href="/destinations/colombo" className="text-white/70 hover:text-white transition-colors">Colombo Capital</Link></li>
                        <li><Link href="/destinations/galle" className="text-white/70 hover:text-white transition-colors">Galle Fort</Link></li>
                        <li><Link href="/destinations/sigiriya" className="text-white/70 hover:text-white transition-colors">Sigiriya Rock</Link></li>
                        <li><Link href="/destinations/ella" className="text-white/70 hover:text-white transition-colors">Ella Highlands</Link></li>
                        <li><Link href="/destinations/yala" className="text-white/70 hover:text-white transition-colors">Yala Safari</Link></li>
                        <li><Link href="/destinations/weligama-mirissa" className="text-white/70 hover:text-white transition-colors">Weligama & Mirissa</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-serif text-xl border-b border-brand-gold inline-block mb-6">Inquiries</h4>
                    <div className="space-y-6 text-xs">
                        <div className="space-y-2">
                            <p className="font-serif text-sm font-bold text-brand-gold uppercase tracking-wider">Sri Lanka (HQ)</p>
                            <p className="text-white/70 flex items-start gap-2">
                                <MapPin className="text-brand-gold shrink-0 mt-0.5" size={14} />
                                <span>145/1 Vajira Rd, Colombo 00500, Sri Lanka</span>
                            </p>
                            <p className="text-white/70 flex items-center gap-2">
                                <Phone className="text-brand-gold shrink-0" size={14} />
                                <span>+94 77 727 8282</span>
                            </p>
                            <p className="text-white/70 flex items-center gap-2">
                                <Mail className="text-brand-gold shrink-0" size={14} />
                                <span>concierge@nilathra.com</span>
                            </p>
                        </div>

                        <div className="space-y-2 pt-3 border-t border-white/10">
                            <p className="font-serif text-sm font-bold text-brand-gold uppercase tracking-wider">Maldives Office</p>
                            <p className="text-white/70 flex items-start gap-2">
                                <MapPin className="text-brand-gold shrink-0 mt-0.5" size={14} />
                                <span>H.Crimson Light, 2-A, Lonuziyaaraiy Magu, Male&apos; Maldives</span>
                            </p>
                            <p className="text-white/70 flex items-center gap-2">
                                <Phone className="text-brand-gold shrink-0" size={14} />
                                <span>+960 931 0940</span>
                            </p>
                            <p className="text-white/70 flex items-center gap-2">
                                <Mail className="text-brand-gold shrink-0" size={14} />
                                <span>maldives@nilathra.com</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50 uppercase tracking-widest">
                <p>&copy; {new Date().getFullYear()} Nilathra Collection (Pvt) Ltd. All Rights Reserved.</p>
                <div className="flex gap-8">
                    <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
                    <Link href="/terms" className="hover:text-white">Terms of Service</Link>
                    <Link href="/booking-conditions" className="hover:text-white">Booking Conditions</Link>
                </div>
            </div>
        </footer>
    );
}
