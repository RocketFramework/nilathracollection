"use client";

import { useState } from "react";
import { Star, AlertTriangle, Send, CheckCircle2 } from "lucide-react";
import { RatingService, SuspensionService } from "@/services/rating-suspension.service";

// Dummy data representing vendors from a completed tour
const MOCK_VENDORS = [
    { id: 'v1', type: 'hotel', name: 'The Grand Colombo' },
    { id: 'v2', type: 'activity_vendor', name: 'Wilderness Safari Co.' },
    { id: 'v3', type: 'driver', name: 'Sunil Perera' },
];

export default function RatingsAndSuspensionsPage() {
    const [selectedVendor, setSelectedVendor] = useState(MOCK_VENDORS[0]);
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");
    const [actionType, setActionType] = useState<'rate' | 'suspend'>('rate');
    const [suspensionReason, setSuspensionReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSuccessMessage("");

        try {
            // Mocking current Agent ID
            const agentId = "mock-agent-uuid";
            const dtoBase = {
                vendor_type: selectedVendor.type as any,
                entity_id: selectedVendor.id,
            };

            if (actionType === 'rate') {
                if (rating === 0) { alert("Please select a rating"); return; }
                await RatingService.submitRating({
                    ...dtoBase,
                    tour_id: "mock-tour-uuid", // Usually from URL params
                    rating,
                    review
                }, agentId);
                setSuccessMessage("Rating submitted successfully!");
            } else {
                if (!suspensionReason) { alert("Please provide a reason for suspension"); return; }
                await SuspensionService.recommendSuspension({
                    ...dtoBase,
                    reason: suspensionReason
                }, agentId);
                setSuccessMessage("Suspension recommendation submitted to Admin.");
            }

            // Reset form
            setRating(0);
            setReview("");
            setSuspensionReason("");

        } catch (error) {
            console.error("Submission failed", error);
            alert("Failed to submit. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-10 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold font-playfair text-[#2B2B2B] mb-2">Vendor Quality Assurance</h1>
            <p className="text-[#6B7280] mb-8">Submit end-of-trip ratings or recommend suspensions for operational issues.</p>

            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-8">
                {/* Vendor Selection */}
                <div className="mb-8">
                    <label className="block text-sm font-bold text-neutral-700 mb-2 uppercase tracking-wide">Select Vendor from Tour</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {MOCK_VENDORS.map(v => (
                            <button
                                key={v.id}
                                onClick={() => setSelectedVendor(v)}
                                className={`p-4 rounded-xl border text-left transition-all ${selectedVendor.id === v.id ? 'border-brand-green bg-brand-green/5 ring-1 ring-brand-green' : 'border-neutral-200 hover:border-brand-gold/50'}`}
                            >
                                <span className="text-xs uppercase font-bold text-neutral-400 block mb-1">{v.type.replace('_', ' ')}</span>
                                <span className="font-semibold text-brand-charcoal">{v.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Toggle */}
                <div className="flex gap-4 mb-8 border-b border-neutral-100 pb-4">
                    <button
                        onClick={() => setActionType('rate')}
                        className={`flex items-center gap-2 pb-4 px-2 -mb-[17px] border-b-2 font-bold transition-colors ${actionType === 'rate' ? 'border-brand-green text-brand-green' : 'border-transparent text-neutral-500 hover:text-brand-charcoal'}`}
                    >
                        <Star size={18} /> Submit Rating
                    </button>
                    <button
                        onClick={() => setActionType('suspend')}
                        className={`flex items-center gap-2 pb-4 px-2 -mb-[17px] border-b-2 font-bold transition-colors ${actionType === 'suspend' ? 'border-red-600 text-red-600' : 'border-transparent text-neutral-500 hover:text-brand-charcoal'}`}
                    >
                        <AlertTriangle size={18} /> Recommend Suspension
                    </button>
                </div>

                {successMessage && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-3 font-medium">
                        <CheckCircle2 size={20} className="text-green-600" /> {successMessage}
                    </div>
                )}

                {/* Forms */}
                {actionType === 'rate' ? (
                    <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-3">Overall Performance</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className={`transition-colors ${star <= rating ? 'text-brand-gold' : 'text-neutral-200 hover:text-brand-gold/50'}`}
                                    >
                                        <Star size={32} fill={star <= rating ? "currentColor" : "none"} strokeWidth={1.5} />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-2">Review Notes (Optional)</label>
                            <textarea
                                value={review}
                                onChange={e => setReview(e.target.value)}
                                className="w-full rounded-xl border-neutral-200 focus:ring-brand-green focus:border-brand-green min-h-[120px]"
                                placeholder="Describe the vendor's performance..."
                            />
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-brand-green hover:bg-brand-charcoal text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Final Rating'} <Send size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-800 text-sm mb-6 flex items-start gap-3">
                            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                            <p><strong>Warning:</strong> A suspension recommendation will flag this vendor for administrative payload. Upon admin approval, the vendor will be hidden from all future planner selection lists.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-2">Detailed Reason for Suspension <span className="text-red-500">*</span></label>
                            <textarea
                                value={suspensionReason}
                                onChange={e => setSuspensionReason(e.target.value)}
                                className="w-full rounded-xl border-neutral-200 focus:ring-red-500 focus:border-red-500 min-h-[120px]"
                                placeholder="Provide specific operational incidents or contract breaches..."
                            />
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm"
                        >
                            {isSubmitting ? 'Submitting...' : 'Send Recommendation to Admin'} <AlertTriangle size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
