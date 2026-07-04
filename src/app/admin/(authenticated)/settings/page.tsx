"use client";

import React, { useEffect, useState } from 'react';
import { Settings } from '@/types/types';
import { getAppMarkupsAction, saveAppMarkupsAction, uploadHotelPhotoAction } from '@/actions/admin.actions';
import { Save, Loader2, Upload } from 'lucide-react';

export default function SettingsPage() {
    const [markups, setMarkups] = useState({
        [Settings.Room_Markup]: 10,
        [Settings.Diver_Markup]: 10,
        [Settings.Restaurant_Markup]: 10,
        [Settings.Tour_Guide_Markup]: 10,
        [Settings.Vendor_Activity_Markup]: 10,
        [Settings.Transport_Markup]: 10,
        [Settings.Regular_Vehicle_Km_Rate]: 0,
        [Settings.Premium_Vehicle_Km_Rate]: 0,
        [Settings.Luxury_Vehicle_Km_Rate]: 0,
        [Settings.Ultra_Vip_Vehicle_Km_Rate]: 0,
        [Settings.Regular_Vehicle_Day_Rate]: 0,
        [Settings.Premium_Vehicle_Day_Rate]: 0,
        [Settings.Luxury_Vehicle_Day_Rate]: 0,
        [Settings.Ultra_Vip_Vehicle_Day_Rate]: 0,
        [Settings.Regular_Chauffeur_Day_Rate]: 0,
        [Settings.Premium_Chauffeur_Day_Rate]: 0,
        [Settings.Luxury_Chauffeur_Day_Rate]: 0,
        [Settings.Ultra_Vip_Chauffeur_Day_Rate]: 0,
        [Settings.Guide_National_Day_Rate]: 0,
        [Settings.Guide_Regular_Day_Rate]: 0,
        [Settings.Guide_Location_Day_Rate]: 0,
        [Settings.Activity_Travel_Prep_Time]: 2,
        [Settings.Daily_Activity_Hours_Limit]: 6,
        [Settings.Activity_Average_Speed_Km]: 30,
        [Settings.Regular_Service_Fee]: 10,
        [Settings.Premium_Service_Fee]: 20,
        [Settings.Luxury_Service_Fee]: 25,
        [Settings.Ultra_Vip_Service_Fee]: 40,
        [Settings.Regular_Concierge_Cost]: 40,
        [Settings.Premium_Concierge_Cost]: 50,
        [Settings.Luxury_Concierge_Cost]: 100,
        [Settings.Ultra_Vip_Concierge_Cost]: 200,
        [Settings.Regular_Breakfast_Cost]: 12,
        [Settings.Premium_Breakfast_Cost]: 20,
        [Settings.Luxury_Breakfast_Cost]: 30,
        [Settings.Ultra_Vip_Breakfast_Cost]: 60,
        [Settings.Regular_Lunch_Cost]: 15,
        [Settings.Premium_Lunch_Cost]: 25,
        [Settings.Luxury_Lunch_Cost]: 50,
        [Settings.Ultra_Vip_Lunch_Cost]: 100,
        [Settings.Regular_Dinner_Cost]: 20,
        [Settings.Premium_Dinner_Cost]: 35,
        [Settings.Luxury_Dinner_Cost]: 50,
        [Settings.Ultra_Vip_Dinner_Cost]: 100,
        [Settings.Policy_Generic]: "",
        [Settings.Policy_Regular]: "",
        [Settings.Policy_Premium]: "",
        [Settings.Policy_Luxury]: "",
        [Settings.Policy_Ultra_Vip]: "",
        [Settings.Policy_Draft]: "",
        [Settings.Address]: "",
        [Settings.Company_Logo]: "",
        [Settings.Bank_Details_Usd]: "",
        [Settings.Bank_Details_Lkr]: "",
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
                setMarkups(prev => ({ ...prev, [Settings.Company_Logo]: res.url }));
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
                            value={markups[Settings.Address] || ""}
                            onChange={(e) => setMarkups({ ...markups, [Settings.Address]: e.target.value })}
                            placeholder="Enter company address..."
                            className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none font-medium text-sm text-[#2B2B2B]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">USD Bank Details</label>
                        <textarea
                            rows={4}
                            value={markups[Settings.Bank_Details_Usd] || ""}
                            onChange={(e) => setMarkups({ ...markups, [Settings.Bank_Details_Usd]: e.target.value })}
                            placeholder="Enter USD bank details for invoices raised in USD..."
                            className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none font-medium text-sm text-[#2B2B2B]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">SLR / LKR Bank Details</label>
                        <textarea
                            rows={4}
                            value={markups[Settings.Bank_Details_Lkr] || ""}
                            onChange={(e) => setMarkups({ ...markups, [Settings.Bank_Details_Lkr]: e.target.value })}
                            placeholder="Enter SLR/LKR bank details for invoices raised in SLR..."
                            className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none font-medium text-sm text-[#2B2B2B]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Company Logo</label>
                        <div className="flex items-center gap-6">
                            {markups[Settings.Company_Logo] ? (
                                <div className="relative w-24 h-24 border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50 flex items-center justify-center">
                                    <img
                                        src={markups[Settings.Company_Logo]}
                                        alt="Company Logo Preview"
                                        className="object-contain w-full h-full p-2"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setMarkups({ ...markups, [Settings.Company_Logo]: "" })}
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
                                value={markups[Settings.Room_Markup]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Room_Markup]: parseFloat(e.target.value) || 0 })}
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
                                value={markups[Settings.Diver_Markup]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Diver_Markup]: parseFloat(e.target.value) || 0 })}
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
                                value={markups[Settings.Tour_Guide_Markup]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Tour_Guide_Markup]: parseFloat(e.target.value) || 0 })}
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
                                value={markups[Settings.Vendor_Activity_Markup]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Vendor_Activity_Markup]: parseFloat(e.target.value) || 0 })}
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
                                value={markups[Settings.Transport_Markup]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Transport_Markup]: parseFloat(e.target.value) || 0 })}
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
                                value={markups[Settings.Regular_Vehicle_Km_Rate]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Regular_Vehicle_Km_Rate]: parseFloat(e.target.value) || 0 })}
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
                                value={markups[Settings.Premium_Vehicle_Km_Rate]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Premium_Vehicle_Km_Rate]: parseFloat(e.target.value) || 0 })}
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
                                value={markups[Settings.Luxury_Vehicle_Km_Rate]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Luxury_Vehicle_Km_Rate]: parseFloat(e.target.value) || 0 })}
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
                                value={markups[Settings.Ultra_Vip_Vehicle_Km_Rate]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Ultra_Vip_Vehicle_Km_Rate]: parseFloat(e.target.value) || 0 })}
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
                        <h2 className="text-lg font-bold text-[#2B2B2B]">Transport Vehicle Per Day Rates</h2>
                        <p className="text-sm text-neutral-500">Configure global per day charges for different vehicle classes.</p>
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
                                value={markups[Settings.Regular_Vehicle_Day_Rate]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Regular_Vehicle_Day_Rate]: parseFloat(e.target.value) || 0 })}
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
                                value={markups[Settings.Premium_Vehicle_Day_Rate]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Premium_Vehicle_Day_Rate]: parseFloat(e.target.value) || 0 })}
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
                                value={markups[Settings.Luxury_Vehicle_Day_Rate]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Luxury_Vehicle_Day_Rate]: parseFloat(e.target.value) || 0 })}
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
                                value={markups[Settings.Ultra_Vip_Vehicle_Day_Rate]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Ultra_Vip_Vehicle_Day_Rate]: parseFloat(e.target.value) || 0 })}
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
                        <h2 className="text-lg font-bold text-[#2B2B2B]">Transport Chauffeur Per Day Rates</h2>
                        <p className="text-sm text-neutral-500">Configure global per day chauffeur/driver allowances and service rates by class.</p>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Regular Chauffeur ($)</label>
                        <div className="flex items-center relative">
                            <span className="absolute left-4 text-neutral-400 font-bold">$</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={markups[Settings.Regular_Chauffeur_Day_Rate]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Regular_Chauffeur_Day_Rate]: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Premium Chauffeur ($)</label>
                        <div className="flex items-center relative">
                            <span className="absolute left-4 text-neutral-400 font-bold">$</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={markups[Settings.Premium_Chauffeur_Day_Rate]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Premium_Chauffeur_Day_Rate]: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Luxury Chauffeur ($)</label>
                        <div className="flex items-center relative">
                            <span className="absolute left-4 text-neutral-400 font-bold">$</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={markups[Settings.Luxury_Chauffeur_Day_Rate]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Luxury_Chauffeur_Day_Rate]: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Ultra VIP Chauffeur ($)</label>
                        <div className="flex items-center relative">
                            <span className="absolute left-4 text-neutral-400 font-bold">$</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={markups[Settings.Ultra_Vip_Chauffeur_Day_Rate]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Ultra_Vip_Chauffeur_Day_Rate]: parseFloat(e.target.value) || 0 })}
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
                        <h2 className="text-lg font-bold text-[#2B2B2B]">Guide Per Day Rates</h2>
                        <p className="text-sm text-neutral-500">Configure global per day rates for different guide classes.</p>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">National Guide ($)</label>
                        <div className="flex items-center relative">
                            <span className="absolute left-4 text-neutral-400 font-bold">$</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={markups[Settings.Guide_National_Day_Rate]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Guide_National_Day_Rate]: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Regular Guide ($)</label>
                        <div className="flex items-center relative">
                            <span className="absolute left-4 text-neutral-400 font-bold">$</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={markups[Settings.Guide_Regular_Day_Rate]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Guide_Regular_Day_Rate]: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">Location Guide ($)</label>
                        <div className="flex items-center relative">
                            <span className="absolute left-4 text-neutral-400 font-bold">$</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={markups[Settings.Guide_Location_Day_Rate]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Guide_Location_Day_Rate]: parseFloat(e.target.value) || 0 })}
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
                                value={markups[Settings.Activity_Travel_Prep_Time]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Activity_Travel_Prep_Time]: parseFloat(e.target.value) || 0 })}
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
                                value={markups[Settings.Daily_Activity_Hours_Limit]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Daily_Activity_Hours_Limit]: parseFloat(e.target.value) || 0 })}
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
                                value={markups[Settings.Activity_Average_Speed_Km]}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Activity_Average_Speed_Km]: parseFloat(e.target.value) || 0 })}
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
                                        value={markups[Settings.Regular_Service_Fee]}
                                        onChange={(e) => setMarkups({ ...markups, [Settings.Regular_Service_Fee]: parseFloat(e.target.value) || 0 })}
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
                                        value={markups[Settings.Premium_Service_Fee]}
                                        onChange={(e) => setMarkups({ ...markups, [Settings.Premium_Service_Fee]: parseFloat(e.target.value) || 0 })}
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
                                        value={markups[Settings.Luxury_Service_Fee]}
                                        onChange={(e) => setMarkups({ ...markups, [Settings.Luxury_Service_Fee]: parseFloat(e.target.value) || 0 })}
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
                                        value={markups[Settings.Ultra_Vip_Service_Fee]}
                                        onChange={(e) => setMarkups({ ...markups, [Settings.Ultra_Vip_Service_Fee]: parseFloat(e.target.value) || 0 })}
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
                                        value={markups[Settings.Regular_Concierge_Cost]}
                                        onChange={(e) => setMarkups({ ...markups, [Settings.Regular_Concierge_Cost]: parseFloat(e.target.value) || 0 })}
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
                                        value={markups[Settings.Premium_Concierge_Cost]}
                                        onChange={(e) => setMarkups({ ...markups, [Settings.Premium_Concierge_Cost]: parseFloat(e.target.value) || 0 })}
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
                                        value={markups[Settings.Luxury_Concierge_Cost]}
                                        onChange={(e) => setMarkups({ ...markups, [Settings.Luxury_Concierge_Cost]: parseFloat(e.target.value) || 0 })}
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
                                        value={markups[Settings.Ultra_Vip_Concierge_Cost]}
                                        onChange={(e) => setMarkups({ ...markups, [Settings.Ultra_Vip_Concierge_Cost]: parseFloat(e.target.value) || 0 })}
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
                                        value={markups[Settings.Regular_Breakfast_Cost] ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, [Settings.Regular_Breakfast_Cost]: parseFloat(e.target.value) || 0 })}
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
                                        value={markups[Settings.Regular_Lunch_Cost] ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, [Settings.Regular_Lunch_Cost]: parseFloat(e.target.value) || 0 })}
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
                                        value={markups[Settings.Regular_Dinner_Cost] ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, [Settings.Regular_Dinner_Cost]: parseFloat(e.target.value) || 0 })}
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
                                        value={markups[Settings.Premium_Breakfast_Cost] ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, [Settings.Premium_Breakfast_Cost]: parseFloat(e.target.value) || 0 })}
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
                                        value={markups[Settings.Premium_Lunch_Cost] ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, [Settings.Premium_Lunch_Cost]: parseFloat(e.target.value) || 0 })}
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
                                        value={markups[Settings.Premium_Dinner_Cost] ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, [Settings.Premium_Dinner_Cost]: parseFloat(e.target.value) || 0 })}
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
                                        value={markups[Settings.Luxury_Breakfast_Cost] ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, [Settings.Luxury_Breakfast_Cost]: parseFloat(e.target.value) || 0 })}
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
                                        value={markups[Settings.Luxury_Lunch_Cost] ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, [Settings.Luxury_Lunch_Cost]: parseFloat(e.target.value) || 0 })}
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
                                        value={markups[Settings.Luxury_Dinner_Cost] ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, [Settings.Luxury_Dinner_Cost]: parseFloat(e.target.value) || 0 })}
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
                                        value={markups[Settings.Ultra_Vip_Breakfast_Cost] ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, [Settings.Ultra_Vip_Breakfast_Cost]: parseFloat(e.target.value) || 0 })}
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
                                        value={markups[Settings.Ultra_Vip_Lunch_Cost] ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, [Settings.Ultra_Vip_Lunch_Cost]: parseFloat(e.target.value) || 0 })}
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
                                        value={markups[Settings.Ultra_Vip_Dinner_Cost] ?? ''}
                                        onChange={(e) => setMarkups({ ...markups, [Settings.Ultra_Vip_Dinner_Cost]: parseFloat(e.target.value) || 0 })}
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
                                value={markups[Settings.Policy_Generic] || ""}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Policy_Generic]: e.target.value })}
                                placeholder="Enter generic policy notes, one per line..."
                                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none font-medium text-sm text-[#2B2B2B]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-2">Draft Itinerary Terms (Applies to draft itineraries)</label>
                            <textarea
                                rows={4}
                                value={markups[Settings.Policy_Draft] || ""}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Policy_Draft]: e.target.value })}
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
                                value={markups[Settings.Policy_Regular] || ""}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Policy_Regular]: e.target.value })}
                                placeholder="Enter Regular tier policies..."
                                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none font-medium text-sm text-[#2B2B2B]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-2">Premium Tier Policies</label>
                            <textarea
                                rows={4}
                                value={markups[Settings.Policy_Premium] || ""}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Policy_Premium]: e.target.value })}
                                placeholder="Enter Premium tier policies..."
                                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none font-medium text-sm text-[#2B2B2B]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-2">Luxury Tier Policies</label>
                            <textarea
                                rows={4}
                                value={markups[Settings.Policy_Luxury] || ""}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Policy_Luxury]: e.target.value })}
                                placeholder="Enter Luxury tier policies..."
                                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none font-medium text-sm text-[#2B2B2B]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-2">Ultra VIP Tier Policies</label>
                            <textarea
                                rows={4}
                                value={markups[Settings.Policy_Ultra_Vip] || ""}
                                onChange={(e) => setMarkups({ ...markups, [Settings.Policy_Ultra_Vip]: e.target.value })}
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
