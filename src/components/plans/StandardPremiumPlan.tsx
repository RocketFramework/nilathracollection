"use client";

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
    Users,
    MapPin,
    Star,
    Car,
    Wifi,
    Shield
} from "lucide-react";
// components/plans/StandardPremiumPlan.tsx (Revised)
export default function StandardPremiumPlan() {
    const [selectedNights, setSelectedNights] = useState(5);
    const [travelers, setTravelers] = useState(2);
    
    const basePrice = 400; // per person per night
    const totalPrice = basePrice * travelers * selectedNights;
    
    const inclusions = [
        { icon: Hotel, text: "Accommodation at 5-star hotels", details: "Premium rooms with breakfast" },
        { icon: Car, text: "Private vehicle with chauffeur", details: "Toyota Prius or similar (8am-6pm daily)" },
        { icon: MapPin, text: "Essential excursions", details: "Kandy, Sigiriya, Galle (entrance fees extra)" },
        { icon: Users, text: "English-speaking driver-guide", details: "Available during excursions" },
        { icon: Shield, text: "24/7 emergency support", details: "Local assistance anytime" }
    ];

    return (
        <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-green-200">
            <div className="bg-gradient-to-r from-green-800 to-green-600 p-8 text-white">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <h2 className="text-3xl font-serif mb-2">Standard Premium</h2>
                        <p className="text-green-100 max-w-xl">
                            Excellence in comfort and service at Sri Lanka's leading 5-star establishments.
                        </p>
                    </div>
                    <div className="text-right bg-white/10 p-6 rounded-2xl">
                        <div className="text-4xl font-light mb-1">${totalPrice.toLocaleString()}</div>
                        <p className="text-green-200 text-sm">for {selectedNights} nights / {travelers} travelers</p>
                        <p className="text-green-200 text-xs">(${basePrice} per person per night)</p>
                    </div>
                </div>
            </div>

            <div className="p-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <h3 className="text-lg font-serif text-green-900 mb-4">What's Included</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {inclusions.map((item, idx) => (
                                <div key={idx} className="bg-green-50 p-4 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <item.icon size={18} className="text-green-700" />
                                        <span className="font-medium text-green-900">{item.text}</span>
                                    </div>
                                    <p className="text-xs text-green-700">{item.details}</p>
                                </div>
                            ))}
                        </div>

                        <h3 className="text-lg font-serif text-green-900 mt-8 mb-4">Optional Extras (Pay on Spot)</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between p-3 bg-neutral-50 rounded-lg">
                                <span>Monument entrance fees (Sigiriya, Temple of Tooth)</span>
                                <span className="font-medium">$50-80 per person</span>
                            </div>
                            <div className="flex justify-between p-3 bg-neutral-50 rounded-lg">
                                <span>National park safari (Yala, Udawalawe)</span>
                                <span className="font-medium">$40-60 per person</span>
                            </div>
                            <div className="flex justify-between p-3 bg-neutral-50 rounded-lg">
                                <span>Lunch & dinner (at restaurants)</span>
                                <span className="font-medium">$15-30 per meal</span>
                            </div>
                            <div className="flex justify-between p-3 bg-neutral-50 rounded-lg">
                                <span>Train ride (Kandy to Ella, 2nd class)</span>
                                <span className="font-medium">$10 per person</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-green-50 p-6 rounded-2xl">
                            <h4 className="font-medium text-green-900 mb-4">Customize Your Package</h4>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-green-700 block mb-1">Nights</label>
                                    <input 
                                        type="range" 
                                        min="2" 
                                        max="14" 
                                        value={selectedNights}
                                        onChange={(e) => setSelectedNights(Number(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-green-600 mt-1">
                                        <span>2 nights</span>
                                        <span>{selectedNights} nights</span>
                                        <span>14 nights</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-green-700 block mb-1">Travelers</label>
                                    <select 
                                        value={travelers}
                                        onChange={(e) => setTravelers(Number(e.target.value))}
                                        className="w-full border border-green-200 rounded-lg px-3 py-2"
                                    >
                                        <option value={1}>1 traveler</option>
                                        <option value={2}>2 travelers</option>
                                        <option value={3}>3 travelers</option>
                                        <option value={4}>4 travelers</option>
                                    </select>
                                </div>

                                <div className="pt-4 border-t border-green-200">
                                    <div className="flex justify-between font-medium">
                                        <span>Package Total:</span>
                                        <span className="text-green-800">${totalPrice.toLocaleString()}</span>
                                    </div>
                                    <p className="text-xs text-green-600 mt-1">
                                        + optional activities & meals
                                    </p>
                                </div>

                                <button className="w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-lg transition-colors">
                                    Book This Package
                                </button>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl text-sm">
                            <h5 className="font-medium text-blue-800 mb-2">💡 Pro Tip</h5>
                            <p className="text-blue-700">
                                Most travelers spend an additional $200-300 per person on entrance fees, meals, and activities.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}