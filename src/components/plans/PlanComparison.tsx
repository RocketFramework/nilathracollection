// components/plans/PlanComparison.tsx
"use client";

import { Check, X, Sparkles, Clock, MapPin, Globe, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function PlanComparison() {
  const tiers = [
    { id: 'regular', name: 'Regular', color: 'text-green-700' },
    { id: 'premium', name: 'Premium', color: 'text-blue-700' },
    { id: 'luxury', name: 'Luxury', color: 'text-amber-700' },
    { id: 'ultra-vip', name: 'Ultra VIP', color: 'text-neutral-900' },
    { id: 'mixed', name: 'Mixed', color: 'text-neutral-500' }
  ];

  const features = [
    {
      name: "Property Type",
      regular: "3-Star / Homestays",
      premium: "3-4 Star / Comfort",
      luxury: "Signature 5-Star",
      ultraVip: "Private Estates",
      mixed: "Flexible Blend"
    },
    {
      name: "Linen & Bedding",
      regular: "As per Hotel",
      premium: "As per Hotel",
      luxury: "As per Hotel",
      ultraVip: "Brand New / Bespoke",
      mixed: "Flexible"
    },
    {
      name: "Property Privacy",
      regular: "Shared Hotel",
      premium: "Shared Hotel",
      luxury: "Luxury Hotel",
      ultraVip: "Entire Estate Buyout",
      mixed: "Flexible"
    },
    {
      name: "Security",
      regular: "None",
      premium: "None",
      luxury: "Discreet Support",
      ultraVip: "Executive Protection Team",
      mixed: "Optional"
    },
    {
      name: "Concierge",
      regular: "Email Support",
      premium: "Travel Concierge",
      luxury: "Dedicated Concierge",
      ultraVip: "24/7 Global Concierge",
      mixed: "Flexible"
    },
    {
      name: "Cultural Access",
      regular: "Public Visits",
      premium: "Guided Visits",
      luxury: "Premium Access",
      ultraVip: "Private Heritage Access",
      mixed: "Custom"
    },
    {
      name: "Dining",
      regular: "Hotel Dining (BB)",
      premium: "Hotel + Local (HB)",
      luxury: "Fine Dining (HB)",
      ultraVip: "Private Chef Experiences",
      mixed: "Custom"
    },
    {
      name: "Arrival Experience",
      regular: "Airport Arrival",
      premium: "Assisted Arrival",
      luxury: "VIP Lounge",
      ultraVip: "Private Terminal + Tarmac",
      mixed: "Flexible"
    },
    {
      name: "Experiences",
      regular: "Standard Tours",
      premium: "Curated Tours",
      luxury: "Signature Experiences",
      ultraVip: "Impossible Experiences",
      mixed: "Custom"
    },
    {
      name: "Wellness",
      regular: "Spa Access",
      premium: "Spa Packages",
      luxury: "Luxury Spa",
      ultraVip: "Private Doctor / Master",
      mixed: "Optional"
    },
    {
      name: "Personal Staff",
      regular: "None",
      premium: "Driver",
      luxury: "Driver, Guide & Butler",
      ultraVip: (
        <>
          Driver + Guide + Butler + Valet<br />
          + Concierge + 6-Chef Team
        </>
      ),
      mixed: "Flexible"
    },
    {
      name: "Travel Flexibility",
      regular: "Fixed",
      premium: "Limited Changes",
      luxury: "Flexible",
      ultraVip: "On-Demand Aircraft",
      mixed: "Flexible"
    },
    {
      name: "Price / Day / Pax",
      regular: "$50",
      premium: "$150",
      luxury: "$500",
      ultraVip: "$15,000",
      mixed: "Flexible"
    }
  ];

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl border border-neutral-200">
      <h3 className="text-3xl font-serif text-brand-green mb-10 text-center">Compare Journeys</h3>

      <div className="overflow-x-auto pb-6">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b-2 border-neutral-100">
              <th className="text-left py-6 px-4 font-serif text-lg">Experience</th>
              {tiers.map(tier => (
                <th key={tier.id} className={`text-center py-6 px-4 font-serif text-lg ${tier.color}`}>
                  {tier.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr key={index} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                <td className="py-5 px-4 font-bold text-neutral-800 text-sm italic">{feature.name}</td>
                <td className="py-5 px-4 text-center text-green-800 text-xs font-medium">{(feature as any).regular}</td>
                <td className="py-5 px-4 text-center text-blue-800 text-xs font-medium">{(feature as any).premium}</td>
                <td className="py-5 px-4 text-center text-amber-800 text-xs font-medium">{(feature as any).luxury}</td>
                <td className="py-5 px-4 text-center text-neutral-900 text-xs font-bold font-mono">{(feature as any).ultraVip}</td>
                <td className="py-5 px-4 text-center text-neutral-500 text-xs italic">{(feature as any).mixed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-4">
        {tiers.map(tier => (
          <Link
            key={tier.id}
            href={`/plans/${tier.id === 'mixed' ? 'mixed' : tier.id === 'ultra-vip' ? 'ultra-vip' : tier.id.toLowerCase()}`}
            className="flex flex-col items-center p-4 rounded-2xl hover:bg-neutral-50 border border-transparent hover:border-neutral-100 transition-all group"
          >
            <span className={`text-xs font-black uppercase tracking-widest mb-2 ${tier.color}`}>Explore</span>
            <span className="text-sm font-bold text-neutral-800 group-hover:underline">View {tier.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}