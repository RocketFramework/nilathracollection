"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, LogOut, Map, ReceiptText, ChevronDown } from "lucide-react";

export default function TouristLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleLogout = () => {
        // In a real app, call AuthService.signOut() and trigger router.push('/login')
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
            {/* Top Navigation */}
            <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo Area */}
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/tourist" className="text-2xl font-serif font-bold text-brand-green tracking-tight">
                                Nilathra<span className="text-brand-gold">.</span> Portal
                            </Link>
                        </div>

                        {/* Navigation Links (Desktop) */}
                        <nav className="hidden md:flex space-x-8">
                            <Link
                                href="/tourist"
                                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${pathname === '/tourist'
                                        ? 'border-brand-green text-brand-green'
                                        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                                    }`}
                            >
                                <Map className="w-4 h-4 mr-2" /> My Tours
                            </Link>
                            <Link
                                href="/tourist/invoices"
                                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${pathname?.includes('/invoices')
                                        ? 'border-brand-green text-brand-green'
                                        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                                    }`}
                            >
                                <ReceiptText className="w-4 h-4 mr-2" /> Invoices
                            </Link>
                        </nav>

                        {/* User Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 focus:outline-none"
                            >
                                <div className="w-9 h-9 rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20 flex items-center justify-center font-bold">
                                    T
                                </div>
                                <span className="hidden sm:block text-sm font-medium text-neutral-700">Tourist User</span>
                                <ChevronDown className="w-4 h-4 text-neutral-500" />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-neutral-100 z-50">
                                    <div className="py-1">
                                        <Link href="/tourist/profile" className="group flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
                                            <User className="mr-3 h-4 w-4 text-neutral-400 group-hover:text-brand-green" />
                                            Profile Management
                                        </Link>
                                        <Link href="/tourist" className="group flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
                                            <Map className="mr-3 h-4 w-4 text-neutral-400 group-hover:text-brand-green" />
                                            My Tours
                                        </Link>
                                        <Link href="/tourist/invoices" className="group flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
                                            <ReceiptText className="mr-3 h-4 w-4 text-neutral-400 group-hover:text-brand-green" />
                                            Invoices
                                        </Link>
                                    </div>
                                    <div className="py-1">
                                        <button
                                            onClick={handleLogout}
                                            className="group flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut className="mr-3 h-4 w-4 text-red-500 group-hover:text-red-600" />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
