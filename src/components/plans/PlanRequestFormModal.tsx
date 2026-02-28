"use client";

import { useState } from "react";
import { X, Mail, Calendar, Users, Send, CheckCircle2 } from "lucide-react";
import { AuthService } from "@/services/auth.service";
import { RequestService } from "@/services/request.service";

interface PlanRequestFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    packageName: string;
    nights: number;
    travelers: number;
    totalPrice: number;
    ctaText?: string;
}

export default function PlanRequestFormModal({
    isOpen,
    onClose,
    packageName,
    nights,
    travelers,
    totalPrice,
    ctaText = "Get Personalized Quote"
}: PlanRequestFormModalProps) {
    const [email, setEmail] = useState("");
    const [startDate, setStartDate] = useState("");
    const [specialRequirements, setSpecialRequirements] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            alert("Please provide an email address.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Lazy Auth or get existing user
            let authResult = null;
            try {
                authResult = await AuthService.registerTouristByEmail(email);
            } catch (authError) {
                console.warn("Auth Registration skipped (e.g., rate limit):", authError);
                // We proceed anyway because the request service handles anonymous requests now!
            }

            await RequestService.createRequest({
                email,
                request_type: 'package',
                package_name: packageName,
                nights: nights,
                estimated_price: totalPrice,
                adults: travelers,
                start_date: startDate || undefined,
                special_requirements: specialRequirements || undefined,
            }, (authResult as any)?.user?.id);

            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                onClose();
            }, 3000);

        } catch (error) {
            console.error("Error submitting package request:", error);
            alert("An error occurred while submitting your request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-brand-charcoal hover:bg-neutral-100 rounded-full transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {isSuccess ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 size={40} />
                        </div>
                        <h3 className="text-3xl font-serif text-brand-charcoal mb-4">Request Received</h3>
                        <p className="text-neutral-500 mb-8">
                            Thank you! Your request for the <strong className="text-brand-charcoal">{packageName}</strong> has been received.
                            Our dedicated travel specialist will contact you shortly at {email}.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="bg-gradient-to-br from-brand-charcoal to-brand-green p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                            <h3 className="text-2xl font-serif mb-2 relative z-10">{ctaText}</h3>
                            <p className="text-white/80 text-sm relative z-10">We just need a few details to process your request for the {packageName}.</p>
                        </div>

                        {/* Summary Box */}
                        <div className="bg-neutral-50 border-b border-neutral-100 p-6 flex justify-between items-center text-sm font-medium">
                            <div className="text-neutral-500 flex gap-4">
                                <span>{nights} Nights</span>
                                <span>{travelers} Travelers</span>
                            </div>
                            <div className="text-brand-charcoal font-bold text-lg">
                                {/* Only show price if it's > 0, otherwise it might be TBD */}
                                {totalPrice > 0 ? `$${totalPrice.toLocaleString()}` : 'Price on Consultation'}
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-neutral-700 mb-2">Email Address <span className="text-brand-gold">*</span></label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 focus:ring-brand-green focus:border-brand-green bg-neutral-50/50"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-neutral-700 mb-2">Start Date <span className="text-neutral-400 font-normal">(Optional)</span></label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 focus:ring-brand-green focus:border-brand-green bg-neutral-50/50 text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-neutral-700 mb-2">Travelers</label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                        <input
                                            type="text"
                                            disabled
                                            value={`${travelers} Persons`}
                                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-500 font-medium text-sm cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-neutral-700 mb-2">Special Requirements <span className="text-neutral-400 font-normal">(Optional)</span></label>
                                <textarea
                                    value={specialRequirements}
                                    onChange={e => setSpecialRequirements(e.target.value)}
                                    className="w-full p-4 rounded-xl border border-neutral-200 focus:ring-brand-green focus:border-brand-green bg-neutral-50/50 text-sm min-h-[100px]"
                                    placeholder="Any dietary preferences, accessibility needs, or specific interests?"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-brand-green hover:bg-brand-charcoal text-white font-bold py-4 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Submitting...' : 'Send Request'} {!isSubmitting && <Send size={18} />}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
