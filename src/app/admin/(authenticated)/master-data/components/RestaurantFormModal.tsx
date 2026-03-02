import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { MasterDataService, Restaurant } from "@/services/master-data.service";

interface RestaurantFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    restaurant?: Restaurant | null;
    onSave: () => void;
}

const TABS = ["Basic Info", "Meal Rates", "Payment Details"];

export default function RestaurantFormModal({ isOpen, onClose, restaurant, onSave }: RestaurantFormModalProps) {
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<Partial<Restaurant>>({
        name: "", address: "", contact_name: "", contact_number: "", email: "",
        lat: undefined, lng: undefined, total_capacity: undefined,
        has_breakfast: false, has_lunch: false, has_dinner: false, is_buffet: false,
        breakfast_rate_per_head: undefined, lunch_rate_per_head: undefined, dinner_rate_per_head: undefined,
        is_suspended: false, payment_details: {}
    });
    const [coordinateInput, setCoordinateInput] = useState("");

    useEffect(() => {
        if (isOpen) {
            if (restaurant) {
                setFormData({ ...restaurant, payment_details: restaurant.payment_details || {} });
                setCoordinateInput((restaurant.lat && restaurant.lng) ? `${restaurant.lat}, ${restaurant.lng}` : "");
            } else {
                setFormData({
                    name: "", address: "", contact_name: "", contact_number: "", email: "",
                    lat: undefined, lng: undefined, total_capacity: undefined,
                    has_breakfast: false, has_lunch: false, has_dinner: false, is_buffet: false,
                    breakfast_rate_per_head: undefined, lunch_rate_per_head: undefined, dinner_rate_per_head: undefined,
                    is_suspended: false, payment_details: {}
                });
                setCoordinateInput("");
            }
            setActiveTab(TABS[0]);
        }
    }, [isOpen, restaurant]);

    const handleChange = (field: keyof Restaurant, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCoordinateChange = (value: string) => {
        setCoordinateInput(value);
        if (!value.trim()) {
            setFormData(prev => ({ ...prev, lat: undefined, lng: undefined }));
            return;
        }
        const parts = value.split(',');
        if (parts.length >= 2) {
            const parsedLat = parseFloat(parts[0].trim());
            const parsedLng = parseFloat(parts[1].trim());
            setFormData(prev => ({
                ...prev,
                lat: isNaN(parsedLat) ? undefined : parsedLat,
                lng: isNaN(parsedLng) ? undefined : parsedLng
            }));
        }
    };

    const handlePaymentChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            payment_details: { ...(prev.payment_details || {}), [field]: value }
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name) return alert("Restaurant name is required");
        setLoading(true);
        try {
            await MasterDataService.saveRestaurant(formData as Restaurant);
            onSave();
            onClose();
        } catch (error: any) {
            alert(`Error saving restaurant: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center overflow-y-auto pt-10 pb-10">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] min-h-[60vh]">
                <div className="flex justify-between items-center p-6 border-b border-neutral-100">
                    <h2 className="text-2xl font-bold font-playfair text-[#2B2B2B]">
                        {restaurant ? "Edit Restaurant" : "Add New Restaurant"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-neutral-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex border-b border-neutral-100 px-6 bg-neutral-50/50 overflow-x-auto custom-scrollbar">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 whitespace-nowrap text-sm font-bold tracking-wide transition-colors border-b-2 ${activeTab === tab ? "border-brand-green text-brand-green bg-brand-green/5" : "border-transparent text-neutral-500 hover:text-brand-charcoal"}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar w-full">
                    {activeTab === "Basic Info" && (
                        <div className="grid grid-cols-2 gap-6 w-full">
                            <div className="col-span-2 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Restaurant Name *</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} />
                            </div>
                            <div className="col-span-2 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Address</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.address || ''} onChange={e => handleChange('address', e.target.value)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Contact Name</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.contact_name || ''} onChange={e => handleChange('contact_name', e.target.value)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Contact Number</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.contact_number || ''} onChange={e => handleChange('contact_number', e.target.value)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Email Address</label>
                                <input type="email" className="w-full outline-none text-brand-charcoal font-medium" value={formData.email || ''} onChange={e => handleChange('email', e.target.value)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Capacity</label>
                                <input type="number" className="w-full outline-none text-brand-charcoal font-medium" value={formData.total_capacity || ''} onChange={e => handleChange('total_capacity', e.target.value ? parseInt(e.target.value) : undefined)} />
                            </div>
                            <div className="col-span-2 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Location Coordinates (Lat, Lng)</label>
                                <input type="text" placeholder="e.g. 6.9271, 79.8612" className="w-full outline-none text-brand-charcoal font-medium" value={coordinateInput} onChange={e => handleCoordinateChange(e.target.value)} />
                            </div>
                            <div className="col-span-2 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="w-5 h-5 accent-red-500 rounded border-neutral-300" checked={formData.is_suspended || false} onChange={e => handleChange('is_suspended', e.target.checked)} />
                                    <span className="text-sm font-bold text-red-600 group-hover:text-red-700 transition-colors">Restaurant Suspended</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === "Meal Rates" && (
                        <div className="space-y-8 w-full">
                            <div className="p-4 bg-brand-green/5 rounded-xl border border-brand-green/20">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 accent-brand-green rounded border-neutral-300"
                                        checked={formData.is_buffet || false}
                                        onChange={e => handleChange('is_buffet', e.target.checked)}
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-brand-charcoal group-hover:text-brand-green transition-colors">Is Buffet Available?</span>
                                        <span className="text-xs text-neutral-500">Check this if the restaurant primarily serves buffet meals.</span>
                                    </div>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Breakfast */}
                                <div className={`p-6 rounded-2xl border transition-all ${formData.has_breakfast ? 'border-brand-green bg-brand-green/5 shadow-sm' : 'border-neutral-200 bg-white'}`}>
                                    <label className="flex items-center gap-3 cursor-pointer group mb-4">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 accent-brand-green rounded border-neutral-300"
                                            checked={formData.has_breakfast || false}
                                            onChange={e => handleChange('has_breakfast', e.target.checked)}
                                        />
                                        <span className="font-bold text-brand-charcoal group-hover:text-brand-green transition-colors">Breakfast</span>
                                    </label>

                                    {formData.has_breakfast && (
                                        <div className="border border-neutral-200 rounded-xl px-4 py-2 bg-white focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all animate-in slide-in-from-top-2 duration-300">
                                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Rate Per Head (USD)</label>
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-bold text-neutral-400">$</span>
                                                <input
                                                    type="number"
                                                    className="w-full outline-none text-brand-charcoal font-bold text-sm bg-transparent"
                                                    value={formData.breakfast_rate_per_head || ''}
                                                    onChange={e => handleChange('breakfast_rate_per_head', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Lunch */}
                                <div className={`p-6 rounded-2xl border transition-all ${formData.has_lunch ? 'border-brand-green bg-brand-green/5 shadow-sm' : 'border-neutral-200 bg-white'}`}>
                                    <label className="flex items-center gap-3 cursor-pointer group mb-4">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 accent-brand-green rounded border-neutral-300"
                                            checked={formData.has_lunch || false}
                                            onChange={e => handleChange('has_lunch', e.target.checked)}
                                        />
                                        <span className="font-bold text-brand-charcoal group-hover:text-brand-green transition-colors">Lunch</span>
                                    </label>

                                    {formData.has_lunch && (
                                        <div className="border border-neutral-200 rounded-xl px-4 py-2 bg-white focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all animate-in slide-in-from-top-2 duration-300">
                                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Rate Per Head (USD)</label>
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-bold text-neutral-400">$</span>
                                                <input
                                                    type="number"
                                                    className="w-full outline-none text-brand-charcoal font-bold text-sm bg-transparent"
                                                    value={formData.lunch_rate_per_head || ''}
                                                    onChange={e => handleChange('lunch_rate_per_head', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Dinner */}
                                <div className={`p-6 rounded-2xl border transition-all ${formData.has_dinner ? 'border-brand-green bg-brand-green/5 shadow-sm' : 'border-neutral-200 bg-white'}`}>
                                    <label className="flex items-center gap-3 cursor-pointer group mb-4">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 accent-brand-green rounded border-neutral-300"
                                            checked={formData.has_dinner || false}
                                            onChange={e => handleChange('has_dinner', e.target.checked)}
                                        />
                                        <span className="font-bold text-brand-charcoal group-hover:text-brand-green transition-colors">Dinner</span>
                                    </label>

                                    {formData.has_dinner && (
                                        <div className="border border-neutral-200 rounded-xl px-4 py-2 bg-white focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all animate-in slide-in-from-top-2 duration-300">
                                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Rate Per Head (USD)</label>
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-bold text-neutral-400">$</span>
                                                <input
                                                    type="number"
                                                    className="w-full outline-none text-brand-charcoal font-bold text-sm bg-transparent"
                                                    value={formData.dinner_rate_per_head || ''}
                                                    onChange={e => handleChange('dinner_rate_per_head', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "Payment Details" && (
                        <div className="grid grid-cols-2 gap-6 w-full">
                            <div className="col-span-2 text-sm font-bold text-[#2B2B2B] bg-neutral-100 p-3 rounded-lg">Bank Information</div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Bank Name</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.payment_details?.bank_name || ''} onChange={e => handlePaymentChange('bank_name', e.target.value)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Branch Name</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.payment_details?.branch_name || ''} onChange={e => handlePaymentChange('branch_name', e.target.value)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Account Name</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.payment_details?.account_name || ''} onChange={e => handlePaymentChange('account_name', e.target.value)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Account Number</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.payment_details?.account_number || ''} onChange={e => handlePaymentChange('account_number', e.target.value)} />
                            </div>
                            <div className="col-span-2 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">SWIFT Code</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.payment_details?.swift_code || ''} onChange={e => handlePaymentChange('swift_code', e.target.value)} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-4 rounded-b-2xl shadow-inner mt-auto">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-neutral-600 hover:bg-neutral-200 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={loading} className={`px-8 py-2.5 rounded-xl font-bold text-white transition-all flex items-center gap-2 shadow-sm ${loading ? 'bg-neutral-400 cursor-not-allowed' : 'bg-brand-green hover:bg-brand-charcoal hover:shadow-md'}`}>
                        {loading ? "Saving..." : <><Check size={18} /> {restaurant ? "Save Changes" : "Create Restaurant"}</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
