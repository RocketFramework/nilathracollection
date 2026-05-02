"use client";

import Link from "next/link";
import { ReceiptText, ArrowLeft, Info } from "lucide-react";

export default function TouristInvoicesPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4 text-sm font-medium text-neutral-500">
                <Link href="/tourist" className="hover:text-brand-green flex items-center gap-1 transition-colors">
                    <ArrowLeft size={16} /> Dashboard
                </Link>
            </div>

            <div className="bg-white rounded-3xl p-12 border border-neutral-200 shadow-sm text-center">
                <div className="w-20 h-20 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ReceiptText className="text-brand-gold" size={32} />
                </div>
                <h1 className="text-3xl font-serif text-brand-charcoal font-bold mb-4">My Invoices</h1>
                
                <div className="max-w-md mx-auto bg-blue-50 border border-blue-100 rounded-2xl p-6 mt-8 flex flex-col items-center">
                    <Info className="text-blue-500 mb-3" size={24} />
                    <p className="text-blue-800 font-medium">
                        Your invoices will be automatically generated and updated here once your final itinerary is finalized and officially confirmed.
                    </p>
                </div>

                <Link href="/tourist" className="inline-block mt-8 px-6 py-3 bg-brand-charcoal text-white rounded-xl font-bold hover:bg-neutral-800 transition-colors">
                    Return to My Tours
                </Link>
            </div>
        </div>
    );
}
