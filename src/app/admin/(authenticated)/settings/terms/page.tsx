"use client";

import React, { useEffect, useState } from 'react';
import { getBookingTermsAction, saveBookingTermsAction } from '@/actions/terms.actions';
import { Save, Loader2 } from 'lucide-react';

export default function BookingTermsSettingsPage() {
    const [terms, setTerms] = useState<any[]>([]);
    const [selectedTier, setSelectedTier] = useState<string>('premium');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        getBookingTermsAction().then(res => {
            if (res.success && res.terms) {
                setTerms(res.terms);
                if (res.terms.length > 0 && !res.terms.find((t: any) => t.tier === selectedTier)) {
                    setSelectedTier(res.terms[0].tier);
                }
            } else {
                setMessage({ text: res.error || 'Failed to load terms', type: 'error' });
            }
            setLoading(false);
        });
    }, [selectedTier]);

    const handleSave = async () => {
        const currentData = terms.find(t => t.tier === selectedTier);
        if (!currentData) return;

        setSaving(true);
        setMessage(null);
        try {
            const res = await saveBookingTermsAction(selectedTier, currentData);
            if (res.success) {
                setMessage({ text: 'Terms & Conditions saved successfully!', type: 'success' });
            } else {
                setMessage({ text: res.error || 'Failed to save terms', type: 'error' });
            }
        } catch (err: any) {
            setMessage({ text: err.message, type: 'error' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleChange = (field: string, value: string) => {
        setTerms(terms.map(t => t.tier === selectedTier ? { ...t, [field]: value } : t));
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-brand-gold w-8 h-8" />
            </div>
        );
    }

    const currentData = terms.find(t => t.tier === selectedTier) || {
        booking_payment: '',
        cancellation_policy: '',
        important_notes: '',
        health_safety: ''
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold font-playfair text-[#2B2B2B] mb-8">Booking Terms & Conditions</h1>

            <div className="mb-6 flex gap-4">
                {['premium', 'luxury', 'ultra_vip'].map(tier => (
                    <button
                        key={tier}
                        onClick={() => setSelectedTier(tier)}
                        className={`px-6 py-2.5 rounded-xl font-bold transition-colors ${
                            selectedTier === tier 
                            ? 'bg-brand-charcoal text-white shadow-md' 
                            : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                        }`}
                    >
                        {tier.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Tier
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="p-6 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-[#2B2B2B]">
                            {selectedTier.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} - Terms Content
                        </h2>
                        <p className="text-sm text-neutral-500">Edit the terms specific to this traveler tier.</p>
                    </div>
                </div>

                {terms.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500">
                        No terms found in the database. Please make sure to run the SQL migration script first.
                    </div>
                ) : (
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-2">Booking & Payment</label>
                            <textarea
                                rows={5}
                                value={currentData.booking_payment}
                                onChange={(e) => handleChange('booking_payment', e.target.value)}
                                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none resize-y"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-2">Cancellation Policy</label>
                            <textarea
                                rows={5}
                                value={currentData.cancellation_policy}
                                onChange={(e) => handleChange('cancellation_policy', e.target.value)}
                                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none resize-y"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-2">Important Notes</label>
                            <textarea
                                rows={6}
                                value={currentData.important_notes}
                                onChange={(e) => handleChange('important_notes', e.target.value)}
                                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none resize-y"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-2">Health & Safety</label>
                            <textarea
                                rows={4}
                                value={currentData.health_safety}
                                onChange={(e) => handleChange('health_safety', e.target.value)}
                                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none resize-y"
                            />
                        </div>
                    </div>
                )}

                <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
                    <div className="flex-1">
                        {message && (
                            <div className={`text-sm font-bold ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                {message.text}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving || terms.length === 0}
                        className="flex items-center gap-2 px-6 py-2.5 bg-brand-charcoal text-white font-bold rounded-xl hover:bg-black transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Terms
                    </button>
                </div>
            </div>
        </div>
    );
}
