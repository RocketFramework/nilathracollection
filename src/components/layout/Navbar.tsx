"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface NavItem {
    name: string;
    href: string;
    subLinks?: { name: string; href: string }[];
}

const NavLinks: NavItem[] = [
    { name: "Home", href: "/" },
    { name: "For VIP", href: "/for-vip" },
    { name: "Destinations", href: "/destinations" },
    {
        name: "Packages",
        href: "/plans",
        subLinks: [
            { name: "All", href: "https://www.nilathra.com/plans" },
            { name: "Ultra VIP", href: "https://www.nilathra.com/plans/ultra-vip" },
            { name: "Luxury", href: "https://www.nilathra.com/plans/luxury" },
            { name: "Premium", href: "https://www.nilathra.com/plans/premium" },
            { name: "Regular", href: "https://www.nilathra.com/plans/regular" },
            { name: "Mixed", href: "https://www.nilathra.com/custom-plan" },
        ],
    },
    { name: "Blog", href: "/blog" },
    {
        name: "About Us",
        href: "/about",
        subLinks: [
            { name: "About Us", href: "/about" },
            { name: "Leadership", href: "/about/leadership" },
        ],
    },
    { name: "Contact", href: "/contact" },
];

export default function Navbar() {
    const pathname = usePathname();
    const isHeroPage = pathname === "/" || pathname === "/for-vip";
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isTransparent = isHeroPage && !scrolled;

    return (
        <>
            <nav
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4 md:px-12",
                    isTransparent ? "bg-transparent" : "bg-white/90 backdrop-blur-md py-3 shadow-md"
                )}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-white shadow-md flex-shrink-0" style={{ padding: '3px' }}>
                            <div className="relative w-full h-full">
                                <Image
                                    src="/images/nilathra_travels_logo.avif"
                                    alt="Nilathra Collection Logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </div>
                        <span className={cn(
                            "font-serif text-lg md:text-2xl font-bold tracking-tighter transition-colors duration-500 uppercase",
                            isTransparent ? "text-white" : "text-logo-blue"
                        )}>
                            NILATHRA <span className="text-[#016795]">COLLECTION</span>
                        </span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8">
                        {NavLinks.map((link) => {
                            if (link.subLinks) {
                                return (
                                    <div
                                        key={link.name}
                                        className="relative group py-2"
                                        onMouseEnter={() => setActiveDropdown(link.name)}
                                        onMouseLeave={() => setActiveDropdown(null)}
                                    >
                                        <Link
                                            href={link.href}
                                            className={cn(
                                                "text-sm font-medium tracking-widest uppercase transition-colors duration-300 flex items-center gap-1",
                                                isTransparent ? "text-white hover:text-brand-gold" : "text-logo-blue hover:text-logo-red"
                                            )}
                                        >
                                            {link.name}
                                            <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
                                        </Link>

                                        {/* Dropdown Menu */}
                                        <div
                                            className={cn(
                                                "absolute top-full left-0 mt-1 w-48 rounded-md shadow-xl bg-slate-900/95 backdrop-blur-lg border border-slate-700/60 p-2 transition-all duration-300 transform origin-top-left z-50",
                                                activeDropdown === link.name
                                                    ? "opacity-100 scale-100 pointer-events-auto"
                                                    : "opacity-0 scale-95 pointer-events-none"
                                            )}
                                        >
                                            {link.subLinks.map((subItem) => (
                                                <Link
                                                    key={subItem.name}
                                                    href={subItem.href}
                                                    className="block px-4 py-2.5 text-xs font-medium tracking-wider uppercase text-slate-200 hover:text-brand-gold hover:bg-white/10 rounded transition-colors"
                                                    onClick={() => setActiveDropdown(null)}
                                                >
                                                    {subItem.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={cn(
                                        "text-sm font-medium tracking-widest uppercase transition-colors duration-300",
                                        isTransparent ? "text-white hover:text-brand-gold" : "text-logo-blue hover:text-logo-red"
                                    )}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                        <Link
                            href="/custom-plan"
                            className={cn(
                                "luxury-button text-sm flex items-center gap-2 truncate",
                                isTransparent ? "bg-white text-brand-green hover:bg-neutral-100" : "bg-logo-blue text-white hover:bg-logo-blue/90"
                            )}
                        >
                            Plan My Journey
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? (
                            <X className={isTransparent ? "text-white" : "text-logo-blue"} />
                        ) : (
                            <Menu className={isTransparent ? "text-white" : "text-logo-blue"} />
                        )}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            <div
                className={cn(
                    "fixed inset-0 bg-brand-green transition-transform duration-500 z-50 flex flex-col items-center justify-center gap-6 md:hidden px-6 overflow-y-auto",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <button
                    className="absolute top-6 right-6 text-white"
                    onClick={() => setIsOpen(false)}
                >
                    <X size={32} />
                </button>
                {NavLinks.map((link) => {
                    if (link.subLinks) {
                        return (
                            <div key={link.name} className="flex flex-col items-center gap-3">
                                <Link
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="text-white text-2xl font-serif tracking-widest uppercase hover:text-brand-gold transition-colors"
                                >
                                    {link.name}
                                </Link>
                                <div className="flex flex-col items-center gap-2 pl-4 border-l border-brand-gold/30">
                                    {link.subLinks.map((subItem) => (
                                        <Link
                                            key={subItem.name}
                                            href={subItem.href}
                                            onClick={() => setIsOpen(false)}
                                            className="text-brand-gold text-lg font-serif tracking-widest uppercase hover:text-white transition-colors"
                                        >
                                            {subItem.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    }
                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className="text-white text-2xl font-serif tracking-widest uppercase hover:text-brand-gold transition-colors"
                        >
                            {link.name}
                        </Link>
                    );
                })}
                <Link
                    href="/custom-plan"
                    onClick={() => setIsOpen(false)}
                    className="luxury-button bg-white text-brand-green mt-4"
                >
                    Plan My Journey
                </Link>
            </div>
        </>
    );
}
