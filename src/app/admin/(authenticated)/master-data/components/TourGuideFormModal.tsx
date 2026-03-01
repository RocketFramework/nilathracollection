import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { MasterDataService, TourGuide } from "@/services/master-data.service";

interface TourGuideFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    guide?: TourGuide | null;
    onSave: () => void;
}

const TABS = ["Basic Info", "Languages", "Payment Details"];

export default function TourGuideFormModal({ isOpen, onClose, guide, onSave }: TourGuideFormModalProps) {
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<Partial<TourGuide>>({
        first_name: "", last_name: "", phone: "", languages: [], is_suspended: false,
        payment_details: {}
    });

    const [langInput, setLangInput] = useState("");

    useEffect(() => {
        if (isOpen) {
            if (guide) {
                setFormData({ ...guide, languages: guide.languages || [], payment_details: guide.payment_details || {} });
            } else {
                setFormData({
                    first_name: "", last_name: "", phone: "", languages: [], is_suspended: false,
                    payment_details: {}
                });
            }
            setActiveTab(TABS[0]);
            setLangInput("");
        }
    }, [isOpen, guide]);

    const handleChange = (field: keyof TourGuide, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePaymentChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            payment_details: { ...(prev.payment_details || {}), [field]: value }
        }));
    };

    const addLanguage = () => {
        if (!langInput.trim()) return;
        const currentLangs = formData.languages || [];
        if (!currentLangs.includes(langInput.trim())) {
            setFormData(prev => ({ ...prev, languages: [...currentLangs, langInput.trim()] }));
        }
        setLangInput("");
    };

    const removeLanguage = (lang: string) => {
        setFormData(prev => ({ ...prev, languages: (prev.languages || []).filter(l => l !== lang) }));
    };

    const handleSubmit = async () => {
        if (!formData.first_name) return alert("First name is required");
        setLoading(true);
        try {
            await MasterDataService.saveTourGuide(formData as TourGuide);
            onSave();
            onClose();
        } catch (error: any) {
            alert(`Error saving guide: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center overflow-y-auto pt-10 pb-10">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-neutral-100">
                    <h2 className="text-2xl font-bold font-playfair text-[#2B2B2B]">
                        {guide ? "Edit Tour Guide" : "Add New Tour Guide"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-neutral-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex border-b border-neutral-100 px-6 bg-neutral-50/50">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 text-sm font-bold tracking-wide transition-colors border-b-2 ${activeTab === tab ? "border-brand-green text-brand-green bg-brand-green/5" : "border-transparent text-neutral-500 hover:text-brand-charcoal"}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                    {activeTab === "Basic Info" && (
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">First Name *</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.first_name || ''} onChange={e => handleChange('first_name', e.target.value)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Last Name</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.last_name || ''} onChange={e => handleChange('last_name', e.target.value)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Phone Number</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} />
                            </div>
                            <div className="col-span-2 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="w-5 h-5 accent-red-500 rounded border-neutral-300" checked={formData.is_suspended || false} onChange={e => handleChange('is_suspended', e.target.checked)} />
                                    <span className="text-sm font-bold text-red-600 group-hover:text-red-700 transition-colors">Guide Suspended</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === "Languages" && (
                        <div>
                            <p className="text-sm text-neutral-500 mb-6 font-medium">Add the languages spoken fluently by this guide.</p>
                            <div className="flex gap-4 items-center mb-6">
                                <div className="flex-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Language</label>
                                    <input
                                        type="text"
                                        className="w-full outline-none text-brand-charcoal font-medium"
                                        placeholder="e.g. English, French"
                                        value={langInput}
                                        onChange={e => setLangInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addLanguage()}
                                    />
                                </div>
                                <button onClick={addLanguage} className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm">
                                    Add
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {(formData.languages || []).map(lang => (
                                    <div key={lang} className="bg-brand-green/10 text-brand-green font-bold px-4 py-2 rounded-full flex items-center gap-2 text-sm shadow-sm border border-brand-green/20">
                                        {lang}
                                        <button onClick={() => removeLanguage(lang)} className="hover:text-red-500 transition-colors">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                {(formData.languages || []).length === 0 && (
                                    <p className="text-sm text-neutral-400 font-medium italic">No languages added yet.</p>
                                )}
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
                        {loading ? "Saving..." : <><Check size={18} /> {guide ? "Save Changes" : "Create Guide"}</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
