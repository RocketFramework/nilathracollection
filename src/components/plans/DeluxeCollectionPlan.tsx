// components/plans/DeluxeCollectionPlan.tsx
"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
    Gem,
    Compass,
    Coffee,
    Camera,
    Map,
    Calendar,
    Check,
    Hotel,
    Utensils,
    Star,
    Car,
    Wifi,
    Shield
} from "lucide-react";

export default function DeluxeCollectionPlan() {
    const [nights, setNights] = useState(5);
    const [travelers, setTravelers] = useState(2);

    const basePrice = 400; // per person per night
    const total = basePrice * travelers * nights;

    const highlights = [
        { icon: Gem, text: "Curated selection of premium 5-star boutiques" },
        { icon: Hotel, text: "Heritage suites and luxury tented camps" },
        { icon: Compass, text: "Professional guide & premium transport" },
        { icon: Camera, text: "Private cultural & historical immersions" },
        { icon: Coffee, text: "Gourmet culinary journeys and high teas" },
        { icon: Calendar, text: "Personalized concierge assistance" },
        { icon: Shield, text: "Standard airport fast-track handling" }
    ];

    const properties = [
        { name: "Fort Bazaar", location: "Galle", type: "Boutique Heritage Hotel", price: "$850" },
        { name: "Wild Coast Tented Lodge", location: "Yala", type: "Luxury Safari Camp", price: "$950" },
        { name: "Cape Weligama", location: "Weligama", type: "Cliff-top Resort", price: "$900" },
        { name: "The Wallawwa", location: "Colombo", type: "Colonial Boutique", price: "$800" }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl overflow-hidden shadow-xl border border-blue-200"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-logo-blue to-blue-900 p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Gem size={28} className="text-blue-200" />
                            <span className="text-blue-200 text-sm uppercase tracking-widest">Refined Luxury</span>
                        </div>
                        <h2 className="text-3xl font-serif mb-2">Deluxe Collection</h2>
                        <p className="text-blue-100 max-w-xl">
                            Refined luxury combining heritage and contemporary style. Featuring boutique gems
                            such as Fort Bazaar in Galle and Wild Coast Tented Lodge.
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-light mb-1">${total.toLocaleString()}<span className="text-xl text-blue-200"></span></div>
                        <p className="text-blue-200 text-sm">for {nights} nights / {travelers} travelers</p>
                        <p className="text-blue-200 text-xs mt-1">(${basePrice.toLocaleString()} per person per night)</p>
                    </div>
                </div>
            </div>

            {/* Rate Card */}
            <div className="p-8">
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Highlights */}
                    <div className="md:col-span-2">
                        <h3 className="text-xl font-serif text-logo-blue mb-6 flex items-center gap-2">
                            <Star size={20} className="text-logo-red" />
                            Collection Inclusions
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {highlights.map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-start gap-3"
                                >
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <item.icon size={18} className="text-logo-blue" />
                                    </div>
                                    <span className="text-sm text-logo-blue">{item.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Rate Summary & Quote */}
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                        <h3 className="text-lg font-serif text-blue-900 mb-4">Customize Your Package</h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-xs text-blue-700 block mb-1">Nights</label>
                                <input
                                    type="range"
                                    min="3"
                                    max="14"
                                    value={nights}
                                    onChange={(e) => setNights(Number(e.target.value))}
                                    className="w-full accent-blue-700"
                                />
                                <div className="flex justify-between text-xs text-blue-600 mt-1">
                                    <span>3 nights</span>
                                    <span>{nights} nights</span>
                                    <span>14 nights</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-blue-700 block mb-1">Travelers</label>
                                <select
                                    value={travelers}
                                    onChange={(e) => setTravelers(Number(e.target.value))}
                                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value={1}>1 traveler</option>
                                    <option value={2}>2 travelers</option>
                                    <option value={3}>3 travelers</option>
                                    <option value={4}>4 travelers</option>
                                    <option value={5}>5 travelers</option>
                                    <option value={6}>6 travelers</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-blue-200">
                            <div className="flex justify-between font-medium">
                                <span>Package Total:</span>
                                <span className="text-blue-800">${total.toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                                Includes:
                            </p>
                        </div>

                        <ul className="space-y-2 text-xs mt-3 mb-6">
                            <li className="flex items-center gap-2 text-blue-800">
                                <Check size={14} className="text-green-600" />
                                <span>Daily breakfast & select meals</span>
                            </li>
                            <li className="flex items-center gap-2 text-blue-800">
                                <Check size={14} className="text-green-600" />
                                <span>Premium vehicle with driver</span>
                            </li>
                            <li className="flex items-center gap-2 text-blue-800">
                                <Check size={14} className="text-green-600" />
                                <span>English-speaking guide</span>
                            </li>
                            <li className="flex items-center gap-2 text-blue-800">
                                <Check size={14} className="text-green-600" />
                                <span>Entry fees to attractions</span>
                            </li>
                        </ul>

                        <button className="w-full bg-logo-blue hover:bg-logo-blue/90 text-white py-3 rounded-xl font-medium transition-colors">
                            Check Availability
                        </button>
                    </div>
                </div>

                {/* Featured Properties with Pricing */}
                <div className="mt-8">
                    <h3 className="text-lg font-serif text-logo-blue mb-4">Curated Properties</h3>
                    <div className="grid md:grid-cols-4 gap-4">
                        {properties.map((prop, index) => (
                            <div key={index} className="border border-blue-100 rounded-xl p-4 hover:shadow-lg transition-shadow">
                                <div className="aspect-[4/3] bg-blue-50 rounded-lg mb-3 flex items-center justify-center">
                                    <Hotel size={32} className="text-logo-blue/50" />
                                </div>
                                <h4 className="font-medium text-logo-blue">{prop.name}</h4>
                                <p className="text-xs text-logo-blue/70">{prop.location} · {prop.type}</p>
                                <p className="text-sm font-semibold text-logo-blue mt-2">{prop.price}/night</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}