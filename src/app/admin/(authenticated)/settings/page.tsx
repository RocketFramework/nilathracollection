"use client";

import React, { useEffect, useState } from 'react';
import { getAppMarkupsAction, saveAppMarkupsAction, uploadHotelPhotoAction } from '@/actions/admin.actions';
import { Save, Loader2, Upload } from 'lucide-react';

export default function SettingsPage() {
    const [markups, setMarkups] = useState({
        room_markup: 10,
        diver_markup: 10,
        restaurant_markup: 10,
        tour_guide_markup: 10,
        vendor_activity_markup: 10,
        transport_markup: 10,
        regular_vehicle_km_rate: 0,
        premium_vehicle_km_rate: 0,
        luxury_vehicle_km_rate: 0,
        ultra_vip_vehicle_km_rate: 0,
        activity_travel_prep_time: 2,
        daily_activity_hours_limit: 6,
        activity_average_speed_km: 30,
        regular_service_fee: 10,
        premium_service_fee: 20,
        luxury_service_fee: 25,
        ultra_vip_service_fee: 40,
        regular_concierge_cost: 40,
        premium_concierge_cost: 50,
        luxury_concierge_cost: 100,
        ultra_vip_concierge_cost: 200,
        regular_breakfast_cost: 12,
        premium_breakfast_cost: 20,
        luxury_breakfast_cost: 30,
        ultra_vip_breakfast_cost: 60,
        regular_lunch_cost: 15,
        premium_lunch_cost: 25,
        luxury_lunch_cost: 50,
        ultra_vip_lunch_cost: 100,
        regular_dinner_cost: 20,
        premium_dinner_cost: 35,
        luxury_dinner_cost: 50,
        ultra_vip_dinner_cost: 100,
        policy_generic: "",
        policy_regular: "",
        policy_premium: "",
        policy_luxury: "",
        policy_ultra_vip: "",
        policy_draft: "",
        address: "",
        company_logo: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        setMessage(null);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await uploadHotelPhotoAction(formData);
            if (res.success && res.url) {
                setMarkups(prev => ({ ...prev, company_logo: res.url }));
                setMessage({ text: 'Logo uploaded successfully! Remember to save settings.', type: 'success' });
            } else {
                setMessage({ text: res.error || 'Failed to upload logo', type: 'error' });
            }
        } catch (err: any) {
            setMessage({ text: err.message || 'Error uploading file', type: 'error' });
        } finally {
            setUploadingLogo(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

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

            {/* General Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden mb-8 animate-fade-in">
                <div className="p-6 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-[#2B2B2B]">General Settings</h2>
                        <p className="text-sm text-neutral-500">Configure global company profile details and branding.</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Company Address</label>
                        <textarea
                            rows={3}
                            value={markups.address || ""}
                            onChange={(e) => setMarkups({ ...markups, address: e.target.value })}
                            placeholder="Enter company address..."
                            className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none font-medium text-sm text-[#2B2B2B]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Company Logo</label>
                        <div className="flex items-center gap-6">
                            {markups.company_logo ? (
                                <div className="relative w-24 h-24 border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50 flex items-center justify-center">
                                    <img
                                        src={markups.company_logo}
                                        alt="Company Logo Preview"
                                        className="object-contain w-full h-full p-2"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setMarkups({ ...markups, company_logo: "" })}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-sm"
                                        title="Remove Logo"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="w-24 h-24 border-2 border-dashed border-neutral-300 rounded-xl bg-neutral-50 flex flex-col items-center justify-center text-neutral-400 text-xs gap-1">
                                    <Upload size={20} className="text-neutral-400" />
                                    <span>No Logo</span>
                                </div>
                            )}

                            <div className="flex-1 max-w-md">
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        disabled={uploadingLogo}
                                        id="logo-upload"
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="logo-upload"
                                        className={`flex items-center justify-center gap-2 px-4 py-2 border border-neutral-300 rounded-xl font-bold text-sm cursor-pointer hover:bg-neutral-50 transition-colors select-none ${uploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}
                                    >
                                        {uploadingLogo ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin text-neutral-500" />
                                                <span>Uploading Logo...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={16} className="text-neutral-600" />
                                                <span>Choose Image file</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                                <p className="text-xs text-neutral-500 mt-2">
                                    Upload a company logo (PNG, JPG, SVG, etc.). It will be converted to WebP and hosted on the server.
                                </p>
                            </div>
                        </div>
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
                        disabled={saving || uploadingLogo}
                        className="flex items-center gap-2 px-6 py-2.5 bg-brand-charcoal text-white font-bold rounded-xl hover:bg-black transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Settings
                    </button>
                </div>
            </div>

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

                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Transport Markup (%)</label>
                        <div className="flex items-center relative">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={markups.transport_markup}
                                onChange={(e) => setMarkups({ ...markups, transport_markup: parseFloat(e.target.value) || 0 })}
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
            
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden mt-8">
                <div className="p-6 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-[#2B2B2B]">Transport Vehicle Per KM Rates</h2>
                        <p className="text-sm text-neutral-500">Configure global per km charges for different vehicle classes.</p>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Regular Vehicle ($)</label>
                        <div className="flex items-center relative">
                            <span className="absolute left-4 text-neutral-400 font-bold">$</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={markups.regular_vehicle_km_rate}
                                onChange={(e) => setMarkups({ ...markups, regular_vehicle_km_rate: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Premium Vehicle ($)</label>
                        <div className="flex items-center relative">
                            <span className="absolute left-4 text-neutral-400 font-bold">$</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={markups.premium_vehicle_km_rate}
                                onChange={(e) => setMarkups({ ...markups, premium_vehicle_km_rate: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Luxury Vehicle ($)</label>
                        <div className="flex items-center relative">
                            <span className="absolute left-4 text-neutral-400 font-bold">$</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={markups.luxury_vehicle_km_rate}
                                onChange={(e) => setMarkups({ ...markups, luxury_vehicle_km_rate: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Ultra VIP Vehicle ($)</label>
                        <div className="flex items-center relative">
                            <span className="absolute left-4 text-neutral-400 font-bold">$</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={markups.ultra_vip_vehicle_km_rate}
                                onChange={(e) => setMarkups({ ...markups, ultra_vip_vehicle_km_rate: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                            />
                        </div>
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
            
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden mt-8">
                <div className="p-6 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-[#2B2B2B]">Activity Planner Settings</h2>
                        <p className="text-sm text-neutral-500">Configure global parameters for activity durations and daily available limits.</p>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Activity Travel & Prep Time (hrs)</label>
                        <div className="flex items-center relative">
                            <input
                                type="number"
                                min="0"
                                max="24"
                                step="0.5"
                                value={markups.activity_travel_prep_time}
                                onChange={(e) => setMarkups({ ...markups, activity_travel_prep_time: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none pr-12"
                            />
                            <span className="absolute right-4 text-neutral-400 font-bold">hrs</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Daily Activity Hours Limit (hrs)</label>
                        <div className="flex items-center relative">
                            <input
                                type="number"
                                min="1"
                                max="24"
                                step="0.5"
                                value={markups.daily_activity_hours_limit}
                                onChange={(e) => setMarkups({ ...markups, daily_activity_hours_limit: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none pr-12"
                            />
                            <span className="absolute right-4 text-neutral-400 font-bold">hrs</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Average Travel Distance for 1 Hour (km)</label>
                        <div className="flex items-center relative">
                            <input
                                type="number"
                                min="1"
                                max="200"
                                step="1"
                                value={markups.activity_average_speed_km}
                                onChange={(e) => setMarkups({ ...markups, activity_average_speed_km: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none pr-12"
                            />
                            <span className="absolute right-4 text-neutral-400 font-bold">km</span>
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 border-t border-neutral-100 pt-6 mt-4">
                        <h3 className="text-sm font-bold text-neutral-800 mb-4">Agency Fee & Tax by Tier (%)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Regular Tier (%)</label>
                                <div className="flex items-center relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={markups.regular_service_fee}
                                        onChange={(e) => setMarkups({ ...markups, regular_service_fee: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none pr-8 text-sm font-medium"
                                    />
                                    <span className="absolute right-3 text-neutral-400 font-bold text-sm">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Premium Tier (%)</label>
                                <div className="flex items-center relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={markups.premium_service_fee}
                                        onChange={(e) => setMarkups({ ...markups, premium_service_fee: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none pr-8 text-sm font-medium"
                                    />
                                    <span className="absolute right-3 text-neutral-400 font-bold text-sm">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Luxury Tier (%)</label>
                                <div className="flex items-center relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={markups.luxury_service_fee}
                                        onChange={(e) => setMarkups({ ...markups, luxury_service_fee: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none pr-8 text-sm font-medium"
                                    />
                                    <span className="absolute right-3 text-neutral-400 font-bold text-sm">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Ultra VIP Tier (%)</label>
                                <div className="flex items-center relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={markups.ultra_vip_service_fee}
                                        onChange={(e) => setMarkups({ ...markups, ultra_vip_service_fee: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none pr-8 text-sm font-medium"
                                    />
                                    <span className="absolute right-3 text-neutral-400 font-bold text-sm">%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 border-t border-neutral-100 pt-6 mt-4">
                        <h3 className="text-sm font-bold text-neutral-800 mb-4">Concierge, Ticket & Refreshment Cost by Tier ($ per person)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Regular Tier ($)</label>
                                <div className="flex items-center relative">
                                    <span className="absolute left-3 text-neutral-400 font-bold text-sm">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={markups.regular_concierge_cost}
                                        onChange={(e) => setMarkups({ ...markups, regular_concierge_cost: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Premium Tier ($)</label>
                                <div className="flex items-center relative">
                                    <span className="absolute left-3 text-neutral-400 font-bold text-sm">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={markups.premium_concierge_cost}
                                        onChange={(e) => setMarkups({ ...markups, premium_concierge_cost: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Luxury Tier ($)</label>
                                <div className="flex items-center relative">
                                    <span className="absolute left-3 text-neutral-400 font-bold text-sm">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={markups.luxury_concierge_cost}
                                        onChange={(e) => setMarkups({ ...markups, luxury_concierge_cost: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Ultra VIP Tier ($)</label>
                                <div className="flex items-center relative">
                                    <span className="absolute left-3 text-neutral-400 font-bold text-sm">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={markups.ultra_vip_concierge_cost}
                                        onChange={(e) => setMarkups({ ...markups, ultra_vip_concierge_cost: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 border-t border-neutral-100 pt-6 mt-4">
                        <h3 className="text-sm font-bold text-neutral-800 mb-4">Daily Meal Cost by Tier ($ per person)</h3>
                        <div className="space-y-4">
                            {/* Regular Tier */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Regular Tier</span>
                                <div className="flex items-center relative">
                                    <span className="absolute left-3 text-neutral-400 font-bold text-sm">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Breakfast"
                                        value={markups.regular_breakfast_cost ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, regular_breakfast_cost: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium"
                                    />
                                    <span className="text-[10px] text-neutral-400 absolute right-3 font-semibold">BF</span>
                                </div>
                                <div className="flex items-center relative">
                                    <span className="absolute left-3 text-neutral-400 font-bold text-sm">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Lunch"
                                        value={markups.regular_lunch_cost ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, regular_lunch_cost: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium"
                                    />
                                    <span className="text-[10px] text-neutral-400 absolute right-3 font-semibold">LH</span>
                                </div>
                                <div className="flex items-center relative">
                                    <span className="absolute left-3 text-neutral-400 font-bold text-sm">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Dinner"
                                        value={markups.regular_dinner_cost ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, regular_dinner_cost: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium"
                                    />
                                    <span className="text-[10px] text-neutral-400 absolute right-3 font-semibold">DN</span>
                                </div>
                            </div>

                            {/* Premium Tier */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Premium Tier</span>
                                <div className="flex items-center relative">
                                    <span className="absolute left-3 text-neutral-400 font-bold text-sm">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Breakfast"
                                        value={markups.premium_breakfast_cost ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, premium_breakfast_cost: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium"
                                    />
                                    <span className="text-[10px] text-neutral-400 absolute right-3 font-semibold">BF</span>
                                </div>
                                <div className="flex items-center relative">
                                    <span className="absolute left-3 text-neutral-400 font-bold text-sm">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Lunch"
                                        value={markups.premium_lunch_cost ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, premium_lunch_cost: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium"
                                    />
                                    <span className="text-[10px] text-neutral-400 absolute right-3 font-semibold">LH</span>
                                </div>
                                <div className="flex items-center relative">
                                    <span className="absolute left-3 text-neutral-400 font-bold text-sm">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Dinner"
                                        value={markups.premium_dinner_cost ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, premium_dinner_cost: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium"
                                    />
                                    <span className="text-[10px] text-neutral-400 absolute right-3 font-semibold">DN</span>
                                </div>
                            </div>

                            {/* Luxury Tier */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Luxury Tier</span>
                                <div className="flex items-center relative">
                                    <span className="absolute left-3 text-neutral-400 font-bold text-sm">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Breakfast"
                                        value={markups.luxury_breakfast_cost ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, luxury_breakfast_cost: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium"
                                    />
                                    <span className="text-[10px] text-neutral-400 absolute right-3 font-semibold">BF</span>
                                </div>
                                <div className="flex items-center relative">
                                    <span className="absolute left-3 text-neutral-400 font-bold text-sm">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Lunch"
                                        value={markups.luxury_lunch_cost ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, luxury_lunch_cost: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium"
                                    />
                                    <span className="text-[10px] text-neutral-400 absolute right-3 font-semibold">LH</span>
                                </div>
                                <div className="flex items-center relative">
                                    <span className="absolute left-3 text-neutral-400 font-bold text-sm">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Dinner"
                                        value={markups.luxury_dinner_cost ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, luxury_dinner_cost: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium"
                                    />
                                    <span className="text-[10px] text-neutral-400 absolute right-3 font-semibold">DN</span>
                                </div>
                            </div>

                            {/* Ultra VIP Tier */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Ultra VIP Tier</span>
                                <div className="flex items-center relative">
                                    <span className="absolute left-3 text-neutral-400 font-bold text-sm">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Breakfast"
                                        value={markups.ultra_vip_breakfast_cost ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, ultra_vip_breakfast_cost: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium"
                                    />
                                    <span className="text-[10px] text-neutral-400 absolute right-3 font-semibold">BF</span>
                                </div>
                                <div className="flex items-center relative">
                                    <span className="absolute left-3 text-neutral-400 font-bold text-sm">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Lunch"
                                        value={markups.ultra_vip_lunch_cost ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, ultra_vip_lunch_cost: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium"
                                    />
                                    <span className="text-[10px] text-neutral-400 absolute right-3 font-semibold">LH</span>
                                </div>
                                <div className="flex items-center relative">
                                    <span className="absolute left-3 text-neutral-400 font-bold text-sm">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Dinner"
                                        value={markups.ultra_vip_dinner_cost ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, ultra_vip_dinner_cost: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-sm font-medium"
                                    />
                                    <span className="text-[10px] text-neutral-400 absolute right-3 font-semibold">DN</span>
                                </div>
                            </div>
                        </div>
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

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden mt-8">
                <div className="p-6 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-[#2B2B2B]">Communication Settings</h2>
                        <p className="text-sm text-neutral-500">Configure policy notes, terms & conditions to include in client itinerary PDFs (separate lines with Enter).</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-2">Generic Policy Notes (Applies to all itineraries)</label>
                            <textarea
                                rows={4}
                                value={markups.policy_generic || ""}
                                onChange={(e) => setMarkups({ ...markups, policy_generic: e.target.value })}
                                placeholder="Enter generic policy notes, one per line..."
                                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none font-medium text-sm text-[#2B2B2B]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-2">Draft Itinerary Terms (Applies to draft itineraries)</label>
                            <textarea
                                rows={4}
                                value={markups.policy_draft || ""}
                                onChange={(e) => setMarkups({ ...markups, policy_draft: e.target.value })}
                                placeholder="Enter draft itinerary terms, one per line..."
                                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none font-medium text-sm text-[#2B2B2B]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-2">Regular Tier Policies</label>
                            <textarea
                                rows={4}
                                value={markups.policy_regular || ""}
                                onChange={(e) => setMarkups({ ...markups, policy_regular: e.target.value })}
                                placeholder="Enter Regular tier policies..."
                                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none font-medium text-sm text-[#2B2B2B]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-2">Premium Tier Policies</label>
                            <textarea
                                rows={4}
                                value={markups.policy_premium || ""}
                                onChange={(e) => setMarkups({ ...markups, policy_premium: e.target.value })}
                                placeholder="Enter Premium tier policies..."
                                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none font-medium text-sm text-[#2B2B2B]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-2">Luxury Tier Policies</label>
                            <textarea
                                rows={4}
                                value={markups.policy_luxury || ""}
                                onChange={(e) => setMarkups({ ...markups, policy_luxury: e.target.value })}
                                placeholder="Enter Luxury tier policies..."
                                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none font-medium text-sm text-[#2B2B2B]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-2">Ultra VIP Tier Policies</label>
                            <textarea
                                rows={4}
                                value={markups.policy_ultra_vip || ""}
                                onChange={(e) => setMarkups({ ...markups, policy_ultra_vip: e.target.value })}
                                placeholder="Enter Ultra VIP tier policies..."
                                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none font-medium text-sm text-[#2B2B2B]"
                            />
                        </div>
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
