"use client";

import { useState } from "react";
import { X, User, Mail, Calendar, DollarSign, Send, CheckCircle2, AlertCircle, PlusCircle } from "lucide-react";
import { submitPlanRequestAction } from "@/actions/contact.actions";
import { PhoneInput } from "@/components/ui/PhoneInput";

interface CreateRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateRequestModal({
    isOpen,
    onClose,
    onSuccess
}: CreateRequestModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        departureCountry: "",
        requestType: "inquiry" as 'inquiry' | 'package' | 'custom-plan' | 'ultra-vip',
        startDate: "",
        durationNights: 7,
        adults: 2,
        children: 0,
        infants: 0,
        budget: 5000,
        note: ""
    });

    if (!isOpen) return null;

    const resetForm = () => {
        setForm({
            name: "",
            email: "",
            phone: "",
            departureCountry: "",
            requestType: "inquiry",
            startDate: "",
            durationNights: 7,
            adults: 2,
            children: 0,
            infants: 0,
            budget: 5000,
            note: ""
        });
        setError(null);
        setIsSuccess(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.name) {
            setError("Name and Email address are required.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await submitPlanRequestAction({
                name: form.name,
                email: form.email,
                phone_number: form.phone || undefined,
                request_type: form.requestType,
                departure_country: form.departureCountry || undefined,
                budget: form.budget ? Number(form.budget) : undefined,
                start_date: form.startDate || undefined,
                duration_nights: form.durationNights ? Number(form.durationNights) : undefined,
                adults: form.adults ? Number(form.adults) : 1,
                children: form.children ? Number(form.children) : 0,
                infants: form.infants ? Number(form.infants) : 0,
                note: form.note || undefined,
            });

            if (!res.success) {
                throw new Error(res.error || "Failed to create request");
            }

            setIsSuccess(true);
            setTimeout(() => {
                resetForm();
                onSuccess();
                onClose();
            }, 1500);

        } catch (err: any) {
            console.error("Error creating request from admin panel:", err);
            setError(err.message || "An error occurred while creating the request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden relative my-8 animate-in zoom-in-95 duration-200 border border-neutral-200">
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-brand-charcoal hover:bg-neutral-100 rounded-full transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {isSuccess ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 size={36} />
                        </div>
                        <h3 className="text-2xl font-bold font-playfair text-brand-charcoal mb-2">Request Created Successfully</h3>
                        <p className="text-neutral-500 text-sm">
                            New travel request for <strong className="text-brand-charcoal">{form.name}</strong> ({form.email}) has been saved.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="bg-brand-charcoal p-6 text-white relative">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-brand-gold/20 rounded-xl text-brand-gold border border-brand-gold/30">
                                    <PlusCircle size={22} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold font-playfair text-white">Create New Request</h3>
                                    <p className="text-neutral-400 text-xs mt-0.5">Manually submit a client travel inquiry into the system.</p>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                                    <AlertCircle size={16} className="shrink-0 text-red-500" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Section 1: Tourist Info */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Tourist Contact Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                                            <input
                                                type="text"
                                                required
                                                value={form.name}
                                                onChange={e => setForm({ ...form, name: e.target.value })}
                                                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-neutral-200 focus:ring-1 focus:ring-brand-gold focus:border-brand-gold bg-neutral-50/50 text-brand-charcoal"
                                                placeholder="e.g. Jane Doe"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                                            <input
                                                type="email"
                                                required
                                                value={form.email}
                                                onChange={e => setForm({ ...form, email: e.target.value })}
                                                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-neutral-200 focus:ring-1 focus:ring-brand-gold focus:border-brand-gold bg-neutral-50/50 text-brand-charcoal"
                                                placeholder="e.g. jane@example.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-700 mb-1.5">Phone Number</label>
                                        <PhoneInput
                                            value={form.phone}
                                            onPhoneChange={(phone) => setForm(prev => ({ ...prev, phone }))}
                                            onCountryChange={(country) => setForm(prev => ({ ...prev, departureCountry: prev.departureCountry || country }))}
                                            className="w-full px-3 text-xs rounded-xl border border-neutral-200 focus-within:ring-1 focus-within:ring-brand-gold focus-within:border-brand-gold bg-neutral-50/50"
                                            placeholder="Phone number"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-700 mb-1.5">Departure Country</label>
                                        <input
                                            type="text"
                                            value={form.departureCountry}
                                            onChange={e => setForm({ ...form, departureCountry: e.target.value })}
                                            className="w-full px-3 py-2.5 text-xs rounded-xl border border-neutral-200 focus:ring-1 focus:ring-brand-gold focus:border-brand-gold bg-neutral-50/50 text-brand-charcoal"
                                            placeholder="e.g. United Kingdom"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Request Specification */}
                            <div className="space-y-4 pt-2 border-t border-neutral-100">
                                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Trip Parameters</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-700 mb-1.5">Request Type</label>
                                        <select
                                            value={form.requestType}
                                            onChange={e => setForm({ ...form, requestType: e.target.value as any })}
                                            className="w-full px-3 py-2.5 text-xs rounded-xl border border-neutral-200 focus:ring-1 focus:ring-brand-gold focus:border-brand-gold bg-neutral-50/50 text-brand-charcoal"
                                        >
                                            <option value="inquiry">General Inquiry</option>
                                            <option value="package">Package</option>
                                            <option value="custom-plan">Custom Plan</option>
                                            <option value="ultra-vip">Ultra VIP</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-neutral-700 mb-1.5">Start Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                                            <input
                                                type="date"
                                                value={form.startDate}
                                                onChange={e => setForm({ ...form, startDate: e.target.value })}
                                                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-neutral-200 focus:ring-1 focus:ring-brand-gold focus:border-brand-gold bg-neutral-50/50 text-brand-charcoal"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-neutral-700 mb-1.5">Duration (Nights)</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={form.durationNights}
                                            onChange={e => setForm({ ...form, durationNights: parseInt(e.target.value) || 1 })}
                                            className="w-full px-3 py-2.5 text-xs rounded-xl border border-neutral-200 focus:ring-1 focus:ring-brand-gold focus:border-brand-gold bg-neutral-50/50 text-brand-charcoal"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-700 mb-1.5">Estimated Budget (USD)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                                            <input
                                                type="number"
                                                min={0}
                                                step={250}
                                                value={form.budget}
                                                onChange={e => setForm({ ...form, budget: parseInt(e.target.value) || 0 })}
                                                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-neutral-200 focus:ring-1 focus:ring-brand-gold focus:border-brand-gold bg-neutral-50/50 text-brand-charcoal"
                                                placeholder="5000"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-neutral-700 mb-1.5">Guests (Adults / Children / Infants)</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-400">A:</span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={form.adults}
                                                    onChange={e => setForm({ ...form, adults: parseInt(e.target.value) || 1 })}
                                                    className="w-full pl-7 pr-2 py-2.5 text-xs rounded-xl border border-neutral-200 focus:ring-1 focus:ring-brand-gold focus:border-brand-gold bg-neutral-50/50 text-brand-charcoal text-center"
                                                    placeholder="Adults"
                                                />
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-400">C:</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={form.children}
                                                    onChange={e => setForm({ ...form, children: parseInt(e.target.value) || 0 })}
                                                    className="w-full pl-7 pr-2 py-2.5 text-xs rounded-xl border border-neutral-200 focus:ring-1 focus:ring-brand-gold focus:border-brand-gold bg-neutral-50/50 text-brand-charcoal text-center"
                                                    placeholder="Children"
                                                />
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-400">I:</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={form.infants}
                                                    onChange={e => setForm({ ...form, infants: parseInt(e.target.value) || 0 })}
                                                    className="w-full pl-7 pr-2 py-2.5 text-xs rounded-xl border border-neutral-200 focus:ring-1 focus:ring-brand-gold focus:border-brand-gold bg-neutral-50/50 text-brand-charcoal text-center"
                                                    placeholder="Infants"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">Note / Special Requirements</label>
                                    <textarea
                                        rows={3}
                                        value={form.note}
                                        onChange={e => setForm({ ...form, note: e.target.value })}
                                        className="w-full p-3 text-xs rounded-xl border border-neutral-200 focus:ring-1 focus:ring-brand-gold focus:border-brand-gold bg-neutral-50/50 text-brand-charcoal resize-none"
                                        placeholder="Add any specific client requests, preferred destinations, or notes..."
                                    ></textarea>
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-5 py-2.5 text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 text-xs font-bold text-white bg-brand-gold hover:bg-[#B3932F] rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? "Creating Request..." : "Create Request"} {!isSubmitting && <Send size={14} />}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
