// components/plans/SuperLuxuryVIPPlan.tsx (Revised with clear pricing)
"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
    Crown, Plane, Shield, Star, Heart, Sparkles,
    Wine, Car, Users, Phone, Clock, MapPin, Hotel,
    Utensils, Wifi, Lock, Check, X, Info
} from "lucide-react";
import { AnimatePresence } from "framer-motion";

interface PricingBreakdown {
    accommodation: number;
    meals: number;
    transport: number;
    guide: number;
    activities: number;
    entrance_fees: number;
    taxes: number;
}

import PlanRequestFormModal from "./PlanRequestFormModal";

export default function SuperLuxuryVIPPlan() {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nights, setNights] = useState(7);
    const [travelers, setTravelers] = useState(2);

    const nightRatePerPerson = 1250;
    const total = nightRatePerPerson * nights * travelers;

    const pricing = {
        total: total,
        perNight: nightRatePerPerson * 2, // Base for 2
        breakdown: {
            accommodation: 2000 * nights * Math.ceil(travelers / 2),
            meals: 125 * travelers * nights,
            transport: 150 * nights * Math.ceil(travelers / 4),
            guide: 100 * nights,
            activities: 50 * travelers * nights,
            entrance_fees: 25 * travelers * nights,
            taxes: 0 // Will calculate as remainder
        }
    };

    // Adjust taxes to match total
    const subtotal = pricing.breakdown.accommodation + pricing.breakdown.meals + pricing.breakdown.transport + pricing.breakdown.guide + pricing.breakdown.activities + pricing.breakdown.entrance_fees;
    pricing.breakdown.taxes = total - subtotal;

    const inclusions = [
        {
            category: "Accommodation", items: [
                "Amanwella - 3 nights (Ocean View Suite) - $2,200/night",
                "Ceylon Tea Trails - 2 nights (Castlereagh Bungalow) - $1,800/night",
                "Cape Weligama - 2 nights (Villa with Private Pool) - $2,500/night"
            ]
        },
        {
            category: "Meals & Beverages", items: [
                "All meals (breakfast, lunch, dinner) at resort restaurants",
                "Premium beverages including fine wines and spirits",
                "Private dining experiences (beach dinner, tea plantation picnic)",
                "In-villa dining with personal chef"
            ]
        },
        {
            category: "Transportation", items: [
                "Private helicopter transfers between all destinations",
                "Luxury SUV (Mercedes S-Class or BMW 7 Series) with driver",
                "Airport VIP meet & greet with personal concierge",
                "All airport taxes and fuel surcharges"
            ]
        },
        {
            category: "Guide Services", items: [
                "Dedicated professional guide (24/7 availability)",
                "Licensed expert in history, wildlife, and culture",
                "Fluent in English (other languages available on request)",
                "All guide accommodation and meals included"
            ]
        },
        {
            category: "Activities & Experiences", items: [
                "Private guided tours of all UNESCO sites",
                "Exclusive after-hours access to Temple of the Tooth",
                "Private wildlife safari in Yala with naturalist",
                "Helicopter tour of Sigiriya from above",
                "Private cooking class with master chef",
                "Sunset private yacht cruise (seasonal)"
            ]
        },
        {
            category: "Entrance Fees", items: [
                "All monument entrance fees (VIP fast-track)",
                "National park entry fees with private vehicles",
                "Cultural show private performances",
                "Museum private guided tours"
            ]
        }
    ];

    const exclusions = [
        "International flights",
        "Travel insurance (recommended - we can arrange)",
        "Personal expenses (shopping, spa treatments beyond included)",
        "Gratuities (discretionary - 10-15% standard)",
        "Visa fees ($50/person, e-visa assistance provided)",
        "COVID-19 testing if required"
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-amber-50 to-white rounded-3xl overflow-hidden shadow-2xl border border-amber-200"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-800 to-amber-600 p-8 text-white">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Crown size={32} className="text-amber-200" />
                            <span className="text-amber-200 text-sm uppercase tracking-widest">Ultra-Luxury All-Inclusive</span>
                        </div>
                        <h2 className="text-4xl font-serif mb-2">Super Luxury VIP</h2>
                        <p className="text-amber-100 max-w-xl">
                            Reserved for the world's most discerning travelers. Everything included, nothing overlooked.
                        </p>
                    </div>
                    <div className="text-right bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
                        <div className="text-5xl font-light mb-1">${total.toLocaleString()}</div>
                        <p className="text-amber-200 text-sm">for {nights} nights / {travelers} travelers</p>
                        <p className="text-amber-200 text-xs mt-1">(${nightRatePerPerson.toLocaleString()} per person per night)</p>
                        <button
                            onClick={() => setShowBreakdown(!showBreakdown)}
                            className="mt-3 text-xs text-amber-200 hover:text-white flex items-center gap-1 mx-auto"
                        >
                            <Info size={12} /> View pricing breakdown
                        </button>
                    </div>
                </div>
            </div>

            {/* Pricing Breakdown (Expandable) */}
            <AnimatePresence>
                {showBreakdown && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-amber-100/50 px-8 overflow-hidden"
                    >
                        <div className="py-6 border-b border-amber-200">
                            <h4 className="font-medium text-amber-900 mb-4">What's Included in Your ${total.toLocaleString()}</h4>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Accommodation ({nights} nights)</span>
                                        <span className="font-medium">${pricing.breakdown.accommodation.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>All meals & premium beverages</span>
                                        <span className="font-medium">${pricing.breakdown.meals.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Helicopter & luxury transport</span>
                                        <span className="font-medium">${pricing.breakdown.transport.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>24/7 personal guide</span>
                                        <span className="font-medium">${pricing.breakdown.guide.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Curated activities</span>
                                        <span className="font-medium">${pricing.breakdown.activities.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>VIP entrance fees</span>
                                        <span className="font-medium">${pricing.breakdown.entrance_fees.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Taxes & service charges</span>
                                        <span className="font-medium">${pricing.breakdown.taxes.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-amber-900 pt-2 border-t border-amber-200">
                                        <span>TOTAL</span>
                                        <span>${total.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="p-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Inclusions Detail */}
                    <div className="lg:col-span-2">
                        <h3 className="text-xl font-serif text-amber-900 mb-6 flex items-center gap-2">
                            <Check size={20} className="text-green-600" />
                            Everything Included in Your Package
                        </h3>

                        <div className="space-y-6">
                            {inclusions.map((section, idx) => (
                                <div key={idx} className="border-b border-amber-100 pb-4 last:border-0">
                                    <h4 className="font-medium text-amber-900 mb-3">{section.category}</h4>
                                    <ul className="space-y-2">
                                        {section.items.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                                                <Check size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Exclusions & Summary */}
                    <div className="space-y-6">
                        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
                            <h4 className="font-medium text-amber-900 mb-4 flex items-center gap-2">
                                <X size={16} className="text-red-500" />
                                Not Included
                            </h4>
                            <ul className="space-y-2">
                                {exclusions.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-amber-700">
                                        <span className="text-amber-400">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-6 pt-4 border-t border-amber-200">
                                <h4 className="font-medium text-amber-900 mb-3">Optional Add-ons</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>International Business Class</span>
                                        <span>$2,500 - $4,000</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Travel Insurance (comprehensive)</span>
                                        <span>$350</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Extra spa treatments (per session)</span>
                                        <span>$150 - $300</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Quote */}
                        <div className="bg-amber-900 text-white p-6 rounded-2xl">
                            <h4 className="font-medium mb-3">Customize Your Stay</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-amber-200">Number of nights</label>
                                    <select
                                        className="w-full bg-amber-800 text-white border border-amber-700 rounded-lg px-3 py-2 text-sm"
                                        value={nights}
                                        onChange={(e) => setNights(Number(e.target.value))}
                                    >
                                        <option value={5}>5 nights</option>
                                        <option value={7}>7 nights</option>
                                        <option value={10}>10 nights</option>
                                        <option value={14}>14 nights</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-amber-200">Travelers</label>
                                    <select
                                        className="w-full bg-amber-800 text-white border border-amber-700 rounded-lg px-3 py-2 text-sm"
                                        value={travelers}
                                        onChange={(e) => setTravelers(Number(e.target.value))}
                                    >
                                        <option value={2}>2 travelers</option>
                                        <option value={4}>4 travelers</option>
                                        <option value={6}>6 travelers</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="w-full bg-amber-500 hover:bg-amber-400 text-amber-900 font-medium py-3 rounded-lg transition-colors mt-2"
                                >
                                    Get Personalized Quote
                                </button>
                                <PlanRequestFormModal
                                    isOpen={isModalOpen}
                                    onClose={() => setIsModalOpen(false)}
                                    packageName="Super Luxury VIP"
                                    nights={nights}
                                    travelers={travelers}
                                    totalPrice={total}
                                    ctaText="Get Personalized Quote"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}