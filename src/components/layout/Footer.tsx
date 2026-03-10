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
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                <div className="space-y-6">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-full brightness-0 invert">
                            <Image
                                src="/images/nilathra_travels_logo.jpeg"
                                alt="Nilathra Travels Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <span className="font-serif text-2xl font-bold tracking-tighter uppercase">
                            NILATHRA <span className="text-brand-gold">COLLECTION</span>
                        </span>
                    </Link>
                    <p className="text-white/70 text-sm leading-relaxed max-w-xs">
                        Curating the finest luxury travel experiences in Sri Lanka. From VIP handling to bespoke itineraries, we bring you the heart of the island in absolute comfort.
                    </p>
                    <div className="flex items-center gap-5">
                        <a
                            href="https://www.facebook.com/profile.php?id=61588628732263"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Facebook"
                            className="transition-all duration-300 hover:text-brand-gold hover:scale-110"
                        >
                            <Facebook size={20} />
                        </a>
                        <a
                            href="https://www.instagram.com/nilathra/"
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
                            href="https://www.tiktok.com/@nilathratravel"
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
                        <li><Link href="/blog" className="text-white/70 hover:text-white transition-colors">The Journal (Blog)</Link></li>
                        <li><Link href="/custom-plan" className="text-white/70 hover:text-white transition-colors">Tailored Journey</Link></li>
                        <li><Link href="/about" className="text-white/70 hover:text-white transition-colors">The Collection</Link></li>
                        <li><Link href="/reference" className="text-white/70 hover:text-white transition-colors">Travel Reference</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-serif text-xl border-b border-brand-gold inline-block mb-6">Destinations</h4>
                    <ul className="space-y-3">
                        <li><Link href="/destinations/galle" className="text-white/70 hover:text-white transition-colors">Galle Fort</Link></li>
                        <li><Link href="/destinations/sigiriya" className="text-white/70 hover:text-white transition-colors">Sigiriya Rock</Link></li>
                        <li><Link href="/destinations/ella" className="text-white/70 hover:text-white transition-colors">Ella Highlands</Link></li>
                        <li><Link href="/destinations/yala" className="text-white/70 hover:text-white transition-colors">Yala Safari</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-serif text-xl border-b border-brand-gold inline-block mb-6">Inquiries</h4>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <MapPin className="text-brand-gold shrink-0" size={18} />
                            <span className="text-white/70 text-sm">Colombo, Sri Lanka</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Phone className="text-brand-gold shrink-0" size={18} />
                            <span className="text-white/70 text-sm">+94 77 727 8282</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Mail className="text-brand-gold shrink-0" size={18} />
                            <span className="text-white/70 text-sm">concierge@nilathra.com</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50 uppercase tracking-widest">
                <p>&copy; {new Date().getFullYear()} Nilathra Travels. All Rights Reserved.</p>
                <div className="flex gap-8">
                    <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
                    <Link href="/terms" className="hover:text-white">Terms of Service</Link>
                </div>
            </div>
        </footer>
    );
}
