// components/plans/PlanComparison.tsx
"use client";

import { Check, X } from "lucide-react";

export default function PlanComparison() {
    const features = [
        { name: "Property Type", 
          standard: "5-Star Hotels", 
          deluxe: "Boutique & Heritage", 
          vip: "Aman & Relais & Châteaux" },
        { name: "Room Category", 
          standard: "Premium Rooms", 
          deluxe: "Suites & Tented Camps", 
          vip: "Private Villas" },
        { name: "Guide Service", 
          standard: "Chauffeur-Guide", 
          deluxe: "Professional Guide", 
          vip: "24/7 Personal Guide" },
        { name: "Transport", 
          standard: "Luxury SUV", 
          deluxe: "Premium Vehicle", 
          vip: "Helicopter + SUV" },
        { name: "Butler Service", 
          standard: <X size={16} className="text-red-500" />, 
          deluxe: "On Request", 
          vip: <Check size={16} className="text-green-600" /> },
        { name: "Airport Handling", 
          standard: "Standard", 
          deluxe: "Fast-Track", 
          vip: "VIP Personal" },
        { name: "Meals Included", 
          standard: "Breakfast Only", 
          deluxe: "Breakfast + Select", 
          vip: "All Inclusive" },
        { name: "Spa Access", 
          standard: "Paid", 
          deluxe: "Discounted", 
          vip: "Complimentary Daily" },
        { name: "Minimum Stay", 
          standard: "2 Nights", 
          deluxe: "3 Nights", 
          vip: "5 Nights" },
        { name: "Price/Night", 
          standard: "From $400", 
          deluxe: "From $800", 
          vip: "From $2,500" }
    ];

    return (
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-neutral-200">
            <h3 className="text-2xl font-serif text-brand-green mb-6 text-center">Compare Plans</h3>
            
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-neutral-200">
                            <th className="text-left py-4 px-2">Feature</th>
                            <th className="text-center py-4 px-2 text-green-700">Standard Premium</th>
                            <th className="text-center py-4 px-2 text-blue-700">Deluxe Collection</th>
                            <th className="text-center py-4 px-2 text-amber-700">Super Luxury VIP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {features.map((feature, index) => (
                            <tr key={index} className="border-b border-neutral-100">
                                <td className="py-3 px-2 font-medium">{feature.name}</td>
                                <td className="py-3 px-2 text-center text-green-800">{feature.standard}</td>
                                <td className="py-3 px-2 text-center text-blue-800">{feature.deluxe}</td>
                                <td className="py-3 px-2 text-center text-amber-800">{feature.vip}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 flex justify-center gap-4">
                <button className="px-6 py-3 bg-green-700 text-white rounded-xl text-sm font-medium hover:bg-green-800 transition-colors">
                    Book Standard Premium
                </button>
                <button className="px-6 py-3 bg-blue-700 text-white rounded-xl text-sm font-medium hover:bg-blue-800 transition-colors">
                    Book Deluxe
                </button>
                <button className="px-6 py-3 bg-amber-700 text-white rounded-xl text-sm font-medium hover:bg-amber-800 transition-colors">
                    Inquire VIP
                </button>
            </div>
        </div>
    );
}