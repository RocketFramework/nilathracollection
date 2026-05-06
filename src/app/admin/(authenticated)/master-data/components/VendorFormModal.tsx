import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { MasterDataService, Vendor, Activity } from "@/services/master-data.service";
import { MasterDataApprovalsService } from "@/services/master-data-approvals.service";

interface VendorFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendor?: Vendor | null;
    onSave: () => void;
    userRole: string;
}

const TABS = ["Basic Info", "Activities Pricing", "Payment Details"];

export default function VendorFormModal({ isOpen, onClose, vendor, onSave, userRole }: VendorFormModalProps) {
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [loading, setLoading] = useState(false);
    const [allActivities, setAllActivities] = useState<Activity[]>([]);
    const [proofImage, setProofImage] = useState<File | null>(null);

    const [formData, setFormData] = useState<Partial<Vendor>>({
        name: "", phone: "", email: "", address: "", lat: undefined, lng: undefined, description: "", is_suspended: false,
        payment_details: {}, vendor_activities: []
    });
    const [coordinateInput, setCoordinateInput] = useState("");

    useEffect(() => {
        if (isOpen) {
            loadMasterData();
            if (vendor) {
                setFormData({ ...vendor, vendor_activities: vendor.vendor_activities || [], payment_details: vendor.payment_details || {} });
                setCoordinateInput((vendor.lat && vendor.lng) ? `${vendor.lat}, ${vendor.lng}` : "");
            } else {
                setFormData({
                    name: "", phone: "", email: "", address: "", lat: undefined, lng: undefined, description: "", is_suspended: false,
                    payment_details: {}, vendor_activities: []
                });
                setCoordinateInput("");
            }
            setActiveTab(TABS[0]);
            setProofImage(null);
        }
    }, [isOpen, vendor]);

    const loadMasterData = async () => {
        try {
            const { data } = await MasterDataService.getActivities();
            setAllActivities(data);
        } catch (error) {
            console.error("Failed to load activities", error);
        }
    };

    const handleChange = (field: keyof Vendor, value: string | number | boolean | string[] | undefined) => {
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

    const handleActivityToggle = (activityId: number) => {
        const vendorActs = [...(formData.vendor_activities || [])];
        const index = vendorActs.findIndex(va => va.activity_id === activityId);

        if (index >= 0) {
            vendorActs.splice(index, 1);
        } else {
            vendorActs.push({ activity_id: activityId, vendor_price: undefined });
        }
        setFormData(prev => ({ ...prev, vendor_activities: vendorActs }));
    };

    const handleActivityPriceChange = (activityId: number, priceStr: string) => {
        const price = priceStr ? parseFloat(priceStr) : undefined;
        const vendorActs = [...(formData.vendor_activities || [])];
        const act = vendorActs.find(va => va.activity_id === activityId);
        if (act) {
            act.vendor_price = price;
            setFormData(prev => ({ ...prev, vendor_activities: vendorActs }));
        }
    };

    const handleSubmit = async () => {
        if (!formData.name) return alert("Vendor name is required");
        setLoading(true);
        try {
            if (userRole === 'agent') {
                let proof_image_url = null;
                const hasPayment = formData.payment_details?.bank_name || formData.payment_details?.account_number;
                if (hasPayment && proofImage) {
                    proof_image_url = await MasterDataApprovalsService.uploadPaymentProofImage(proofImage);
                } else if (hasPayment && !proofImage && !vendor?.payment_details?.id) {
                    alert("A verification proof image is required when setting up payment details.");
                    setLoading(false);
                    return;
                }

                await MasterDataApprovalsService.submitApproval({
                    entity_type: 'vendor',
                    entity_id: formData.id || null,
                    action: formData.id ? 'UPDATE' : 'CREATE',
                    proposed_data: formData,
                    contact_details: { name: formData.name, phone: formData.phone, email: formData.email },
                    proof_image_url
                });
                alert("Request sent for Admin approval.");
                onClose();
            } else {
                const savedId = await MasterDataService.saveVendor(formData as Vendor);
                onSave();

                if (savedId) {
                    const updated = await MasterDataService.getVendor(savedId);
                    setFormData({
                        ...updated,
                        vendor_activities: updated.vendor_activities || [],
                        payment_details: updated.payment_details || {}
                    });
                    setCoordinateInput((updated.lat && updated.lng) ? `${updated.lat}, ${updated.lng}` : "");
                }
                alert("Vendor saved successfully.");
            }
        } catch (error: any) {
            console.error("Save Vendor Error:", error);
            const message = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
            alert(`Error saving vendor: ${message}`);
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
                        {vendor ? "Edit Activity Vendor" : "Add New Vendor"}
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
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Vendor Name *</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Phone Number</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Email Address</label>
                                <input type="email" className="w-full outline-none text-brand-charcoal font-medium" value={formData.email || ''} onChange={e => handleChange('email', e.target.value)} />
                            </div>
                            <div className="col-span-2 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Vendor Address</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.address || ''} onChange={e => handleChange('address', e.target.value)} />
                            </div>
                            <div className="col-span-2 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Location Coordinates (Lat, Lng)</label>
                                <input type="text" placeholder="e.g. 6.9271, 79.8612" className="w-full outline-none text-brand-charcoal font-medium" value={coordinateInput} onChange={e => handleCoordinateChange(e.target.value)} />
                            </div>
                            <div className="col-span-2 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Description</label>
                                <textarea rows={2} className="w-full outline-none text-brand-charcoal font-medium" value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} />
                            </div>
                            <div className="col-span-2 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="w-5 h-5 accent-red-500 rounded border-neutral-300" checked={formData.is_suspended || false} onChange={e => handleChange('is_suspended', e.target.checked)} />
                                    <span className="text-sm font-bold text-red-600 group-hover:text-red-700 transition-colors">Vendor Suspended</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === "Activities Pricing" && (
                        <div className="w-full">
                            <div className="w-full">
                                <p className="text-sm text-neutral-500 mb-6 font-medium">Select the activities this vendor provides and define their specific pricing in USD.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    {allActivities.map(activity => {
                                        const vendorActs = formData.vendor_activities || [];
                                        const isSelected = vendorActs.some(va => va.activity_id === activity.id);
                                        const currentVA = vendorActs.find(va => va.activity_id === activity.id);
                                        const vendorPriceText = currentVA?.vendor_price ? currentVA.vendor_price.toString() : '';

                                        return (
                                            <div key={activity.id} className={`p-4 rounded-xl border transition-all flex items-center justify-between overflow-hidden ${isSelected ? 'border-brand-green bg-brand-green/5' : 'border-neutral-200 hover:border-neutral-300 bg-white'}`}>
                                                <label className="flex items-center gap-3 cursor-pointer group min-w-0 mr-4">
                                                    <input
                                                        type="checkbox"
                                                        className="w-5 h-5 accent-brand-green rounded border-neutral-300 flex-shrink-0"
                                                        checked={isSelected}
                                                        onChange={() => handleActivityToggle(activity.id as number)}
                                                    />
                                                    <div className="flex flex-col truncate">
                                                        <span className="text-sm font-bold text-neutral-700 group-hover:text-brand-charcoal truncate">{activity.activity_name}</span>
                                                        <span className="text-xs text-neutral-500 truncate">{activity.location_name} • Base: ${activity.price}</span>
                                                    </div>
                                                </label>

                                                {isSelected && (
                                                    <div className="flex-shrink-0 w-32 border border-brand-green/30 rounded-lg px-3 py-1 bg-white flex items-center gap-1 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                                        <span className="text-xs font-bold text-neutral-400">$</span>
                                                        <input
                                                            type="number"
                                                            className="w-full text-sm outline-none text-brand-charcoal font-medium bg-transparent placeholder-neutral-300"
                                                            placeholder="Custom"
                                                            value={vendorPriceText}
                                                            onChange={e => handleActivityPriceChange(activity.id as number, e.target.value)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {allActivities.length === 0 && (
                                    <div className="p-8 text-center bg-neutral-50 rounded-xl border border-neutral-200">
                                        <p className="text-neutral-500 font-medium">No activities available in the database to assign.</p>
                                    </div>
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

                            <div className="col-span-2 text-sm font-bold text-[#2B2B2B] bg-neutral-100 p-3 rounded-lg mt-4">Verification Proof</div>
                            <div className="col-span-2 border border-neutral-200 rounded-xl px-4 py-4 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all bg-amber-50/30">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">Upload Bank Slip/Document {userRole === 'agent' && '*'}</label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="w-full text-sm outline-none text-brand-charcoal file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-green/10 file:text-brand-green hover:file:bg-brand-green/20 cursor-pointer"
                                    onChange={e => setProofImage(e.target.files?.[0] || null)}
                                />
                                <p className="text-[10px] text-neutral-400 mt-2">Required if adding or updating payment details to ensure accuracy.</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-4 rounded-b-2xl shadow-inner mt-auto">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-neutral-600 hover:bg-neutral-200 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={loading} className={`px-8 py-2.5 rounded-xl font-bold text-white transition-all flex items-center gap-2 shadow-sm ${loading ? 'bg-neutral-400 cursor-not-allowed' : 'bg-brand-green hover:bg-brand-charcoal hover:shadow-md'}`}>
                        {loading ? "Saving..." : <><Check size={18} /> {userRole === 'agent' ? "Submit for Approval" : (vendor ? "Save Changes" : "Create Vendor")}</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
