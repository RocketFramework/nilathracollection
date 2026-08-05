import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { SeamlessConciergeCostItem } from "@/services/master-data.service";
import { saveSeamlessConciergeCostItemAction } from "@/actions/admin.actions";

interface ConciergeCostItemFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    item?: SeamlessConciergeCostItem | null;
    onSave: () => void;
    userRole?: string;
}

const CATEGORY_OPTIONS = [
    "Personal Concierge",
    "Airport Concierge",
    "Transport Assist",
    "Luxury Lounge",
    "Special Support",
    "General Assistance"
];

const CURRENCY_OPTIONS = ["USD", "LKR", "EUR", "GBP"];

const COSTING_BASIS_OPTIONS = [
    { value: "per_service", label: "Per Service" },
    { value: "per_day", label: "Per Day" },
    { value: "per_person", label: "Per Person" },
    { value: "per_booking", label: "Per Booking" }
];

export default function ConciergeCostItemFormModal({ isOpen, onClose, item, onSave }: ConciergeCostItemFormModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<SeamlessConciergeCostItem>>({
        cost_code: "",
        title: "",
        details: "",
        category: "Personal Concierge",
        default_cost: 0,
        currency: "USD",
        costing_basis: "per_service",
        is_generic: false,
        is_active: true
    });

    useEffect(() => {
        if (isOpen) {
            if (item) {
                setFormData({
                    ...item,
                    details: item.details || "",
                    is_generic: item.is_generic ?? false,
                    is_active: item.is_active ?? true
                });
            } else {
                setFormData({
                    cost_code: "",
                    title: "",
                    details: "",
                    category: "Personal Concierge",
                    default_cost: 0,
                    currency: "USD",
                    costing_basis: "per_service",
                    is_generic: false,
                    is_active: true
                });
            }
        }
    }, [isOpen, item]);

    const handleChange = (field: keyof SeamlessConciergeCostItem, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.cost_code?.trim()) return alert("Cost Code is required (e.g., SC-CON-001)");
        if (!formData.title?.trim()) return alert("Title is required");

        setLoading(true);
        try {
            const res = await saveSeamlessConciergeCostItemAction(formData as SeamlessConciergeCostItem);
            if (res.error) throw new Error(res.error);
            alert(item ? "Concierge cost item updated successfully!" : "Concierge cost item created successfully!");
            onSave();
            onClose();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "An unknown error occurred";
            alert(`Error saving cost item: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center overflow-y-auto pt-10 pb-10">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-neutral-100">
                    <h2 className="text-2xl font-bold font-playfair text-[#2B2B2B]">
                        {item ? "Edit Concierge Cost Item" : "Add New Concierge Cost Item"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-neutral-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Form Fields */}
                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Cost Code */}
                        <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Cost Code *</label>
                            <input
                                type="text"
                                className="w-full outline-none text-brand-charcoal font-medium"
                                placeholder="e.g. SC-CON-001"
                                value={formData.cost_code || ''}
                                onChange={e => handleChange('cost_code', e.target.value)}
                            />
                        </div>

                        {/* Title */}
                        <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Title *</label>
                            <input
                                type="text"
                                className="w-full outline-none text-brand-charcoal font-medium"
                                placeholder="e.g. Dedicated Personal Concierge"
                                value={formData.title || ''}
                                onChange={e => handleChange('title', e.target.value)}
                            />
                        </div>

                        {/* Category */}
                        <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Category *</label>
                            <input
                                type="text"
                                list="category-options"
                                className="w-full outline-none text-brand-charcoal font-medium"
                                placeholder="Select or type category..."
                                value={formData.category || ''}
                                onChange={e => handleChange('category', e.target.value)}
                            />
                            <datalist id="category-options">
                                {CATEGORY_OPTIONS.map(cat => (
                                    <option key={cat} value={cat} />
                                ))}
                            </datalist>
                        </div>

                        {/* Costing Basis */}
                        <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Costing Basis *</label>
                            <select
                                className="w-full outline-none text-brand-charcoal font-medium bg-transparent cursor-pointer"
                                value={formData.costing_basis || 'per_service'}
                                onChange={e => handleChange('costing_basis', e.target.value)}
                            >
                                {COSTING_BASIS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Default Cost */}
                        <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Default Cost</label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full outline-none text-brand-charcoal font-medium"
                                value={formData.default_cost ?? 0}
                                onChange={e => handleChange('default_cost', parseFloat(e.target.value) || 0)}
                            />
                        </div>

                        {/* Currency */}
                        <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Currency</label>
                            <select
                                className="w-full outline-none text-brand-charcoal font-medium bg-transparent cursor-pointer"
                                value={formData.currency || 'USD'}
                                onChange={e => handleChange('currency', e.target.value)}
                            >
                                {CURRENCY_OPTIONS.map(curr => (
                                    <option key={curr} value={curr}>{curr}</option>
                                ))}
                            </select>
                        </div>

                        {/* Details */}
                        <div className="col-span-2 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Details & Description</label>
                            <textarea
                                rows={3}
                                className="w-full outline-none text-brand-charcoal font-medium resize-none text-sm"
                                placeholder="Details about this concierge cost item..."
                                value={formData.details || ''}
                                onChange={e => handleChange('details', e.target.value)}
                            />
                        </div>

                        {/* Checkboxes: Generic & Active */}
                        <div className="col-span-2 flex flex-wrap items-center justify-between bg-neutral-50 p-4 rounded-xl border border-neutral-100 gap-4">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 accent-brand-green rounded border-neutral-300"
                                    checked={formData.is_generic || false}
                                    onChange={e => handleChange('is_generic', e.target.checked)}
                                />
                                <span className="text-sm font-bold text-neutral-700 group-hover:text-brand-charcoal transition-colors">Generic Item</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 accent-brand-green rounded border-neutral-300"
                                    checked={formData.is_active ?? true}
                                    onChange={e => handleChange('is_active', e.target.checked)}
                                />
                                <span className="text-sm font-bold text-green-700 group-hover:text-green-800 transition-colors">Active Item</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-4 rounded-b-2xl shadow-inner mt-auto">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-neutral-600 hover:bg-neutral-200 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`px-8 py-2.5 rounded-xl font-bold text-white transition-all flex items-center gap-2 shadow-sm ${loading ? 'bg-neutral-400 cursor-not-allowed' : 'bg-brand-green hover:bg-brand-charcoal hover:shadow-md'}`}
                    >
                        {loading ? "Saving..." : <><Check size={18} /> {item ? "Save Changes" : "Create Item"}</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
