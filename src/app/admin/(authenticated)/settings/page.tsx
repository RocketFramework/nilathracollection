"use client";

import React, { useEffect, useState } from 'react';
import { getAppMarkupsAction, saveAppMarkupsAction } from '@/actions/admin.actions';
import { Save, Loader2 } from 'lucide-react';

export default function SettingsPage() {
    const [markups, setMarkups] = useState({
        room_markup: 10,
        diver_markup: 10,
        restaurant_markup: 10,
        tour_guide_markup: 10,
        vendor_activity_markup: 10,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        getAppMarkupsAction().then(res => {
            if (res.success && res.markups) {
                setMarkups(res.markups as any);
            }
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await saveAppMarkupsAction(markups);
            if (res.success) {
                setMessage({ text: 'Settings saved successfully!', type: 'success' });
            } else {
                setMessage({ text: res.error || 'Failed to save settings', type: 'error' });
            }
        } catch (err: any) {
            setMessage({ text: err.message, type: 'error' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-brand-gold w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold font-playfair text-[#2B2B2B] mb-8">System Settings</h1>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="p-6 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-[#2B2B2B]">Pricing Engine Settings</h2>
                        <p className="text-sm text-neutral-500">Configure global markup rules for the itinerary builder.</p>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Room Markup (%)</label>
                        <div className="flex items-center relative">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={markups.room_markup}
                                onChange={(e) => setMarkups({ ...markups, room_markup: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none pr-10"
                            />
                            <span className="absolute right-4 text-neutral-400 font-bold">%</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Diver Markup (%)</label>
                        <div className="flex items-center relative">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={markups.diver_markup}
                                onChange={(e) => setMarkups({ ...markups, diver_markup: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none pr-10"
                            />
                            <span className="absolute right-4 text-neutral-400 font-bold">%</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Restaurant Markup (%)</label>
                        <div className="flex items-center relative">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={markups.restaurant_markup}
                                onChange={(e) => setMarkups({ ...markups, restaurant_markup: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none pr-10"
                            />
                            <span className="absolute right-4 text-neutral-400 font-bold">%</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Tour Guide Markup (%)</label>
                        <div className="flex items-center relative">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={markups.tour_guide_markup}
                                onChange={(e) => setMarkups({ ...markups, tour_guide_markup: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none pr-10"
                            />
                            <span className="absolute right-4 text-neutral-400 font-bold">%</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Vendor Activity Markup (%)</label>
                        <div className="flex items-center relative">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={markups.vendor_activity_markup}
                                onChange={(e) => setMarkups({ ...markups, vendor_activity_markup: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none pr-10"
                            />
                            <span className="absolute right-4 text-neutral-400 font-bold">%</span>
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 mt-2">
                        <p className="text-xs text-neutral-500">
                            These markups will be applied automatically to the base contracted rates in the Itinerary Builder.
                            <br/>Example: A rate of $100 with a 10% markup will result in an agreed unit price of $110.
                        </p>
                    </div>
                </div>

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
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-brand-charcoal text-white font-bold rounded-xl hover:bg-black transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
