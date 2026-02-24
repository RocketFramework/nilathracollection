// components/plans/DeluxeCollectionPlan.tsx
"use client";

import { motion } from "framer-motion";
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
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-8 text-white">
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
                        <div className="text-4xl font-light mb-1">From $800<span className="text-xl text-blue-200">/night</span></div>
                        <p className="text-blue-200 text-sm">Minimum 3 nights</p>
                    </div>
                </div>
            </div>

            {/* Rate Card */}
            <div className="p-8">
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Highlights */}
                    <div className="md:col-span-2">
                        <h3 className="text-xl font-serif text-blue-900 mb-6 flex items-center gap-2">
                            <Star size={20} className="text-blue-600" />
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
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <item.icon size={18} className="text-blue-700" />
                                    </div>
                                    <span className="text-sm text-blue-900">{item.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Rate Summary */}
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                        <h3 className="text-lg font-serif text-blue-900 mb-4">Rate Includes</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center gap-2">
                                <Check size={16} className="text-green-600" />
                                <span>Daily breakfast & select meals</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check size={16} className="text-green-600" />
                                <span>Premium vehicle with driver</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check size={16} className="text-green-600" />
                                <span>English-speaking guide</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check size={16} className="text-green-600" />
                                <span>Entry fees to attractions</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check size={16} className="text-green-600" />
                                <span>24/7 concierge support</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check size={16} className="text-green-600" />
                                <span>Airport transfers</span>
                            </li>
                        </ul>
                        <button className="w-full mt-6 bg-blue-800 hover:bg-blue-900 text-white py-3 rounded-xl font-medium transition-colors">
                            Check Availability
                        </button>
                    </div>
                </div>

                {/* Featured Properties with Pricing */}
                <div className="mt-8">
                    <h3 className="text-lg font-serif text-blue-900 mb-4">Curated Properties</h3>
                    <div className="grid md:grid-cols-4 gap-4">
                        {properties.map((prop, index) => (
                            <div key={index} className="border border-blue-100 rounded-xl p-4 hover:shadow-lg transition-shadow">
                                <div className="aspect-[4/3] bg-blue-100 rounded-lg mb-3 flex items-center justify-center">
                                    <Hotel size={32} className="text-blue-400" />
                                </div>
                                <h4 className="font-medium text-blue-900">{prop.name}</h4>
                                <p className="text-xs text-blue-600">{prop.location} · {prop.type}</p>
                                <p className="text-sm font-semibold text-blue-900 mt-2">{prop.price}/night</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}