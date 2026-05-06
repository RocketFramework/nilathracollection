import React, { useState, useEffect } from "react";
import { X, Check, Trash2, Plus } from "lucide-react";
import { MasterDataService, TransportProvider, TransportVehicle } from "@/services/master-data.service";
import { MasterDataApprovalsService } from "@/services/master-data-approvals.service";
import { saveTransportProviderAction } from "@/actions/admin.actions";

interface TransportProviderFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    provider?: TransportProvider | null;
    onSave: () => void;
    userRole: string;
}

const TABS = ["Basic Info", "Vehicles", "Payment Details"];

export default function TransportProviderFormModal({ isOpen, onClose, provider, onSave, userRole }: TransportProviderFormModalProps) {
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [loading, setLoading] = useState(false);
    const [proofImage, setProofImage] = useState<File | null>(null);

    const [formData, setFormData] = useState<Partial<TransportProvider>>({
        name: "", phone: "", email: "", address: "", lat: undefined, lng: undefined, nic_number: "", is_suspended: false,
        payment_details: {},
        transport_vehicles: []
    });
    const [coordinateInput, setCoordinateInput] = useState("");

    useEffect(() => {
        if (isOpen) {
            if (provider) {
                setFormData({ ...provider, payment_details: provider.payment_details || {}, transport_vehicles: provider.transport_vehicles || [] });
                setCoordinateInput((provider.lat && provider.lng) ? `${provider.lat}, ${provider.lng}` : "");
            } else {
                setFormData({
                    name: "", phone: "", email: "", address: "", lat: undefined, lng: undefined, nic_number: "", is_suspended: false,
                    payment_details: {},
                    transport_vehicles: []
                });
                setCoordinateInput("");
            }
            setActiveTab(TABS[0]);
            setProofImage(null);
        }
    }, [isOpen, provider]);

    const handleChange = (field: keyof TransportProvider, value: string | boolean | number | object | undefined) => {
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

    const addVehicle = () => {
        const newVehicle: TransportVehicle = {
            vehicle_type: "",
            with_driver: true
        };
        setFormData(prev => ({
            ...prev,
            transport_vehicles: [...(prev.transport_vehicles || []), newVehicle]
        }));
    };

    const updateVehicle = (index: number, field: keyof TransportVehicle, value: string | boolean | number | undefined) => {
        setFormData(prev => {
            const vehicles = [...(prev.transport_vehicles || [])];
            vehicles[index] = { ...vehicles[index], [field]: value };
            return { ...prev, transport_vehicles: vehicles };
        });
    };

    const removeVehicle = (index: number) => {
        setFormData(prev => {
            const vehicles = [...(prev.transport_vehicles || [])];
            vehicles.splice(index, 1);
            return { ...prev, transport_vehicles: vehicles };
        });
    };

    const handlePaymentChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            payment_details: { ...(prev.payment_details || {}), [field]: value }
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name) return alert("Name is required");
        setLoading(true);
        try {
            if (userRole === 'agent') {
                let proof_image_url = null;
                const hasPayment = formData.payment_details?.bank_name || formData.payment_details?.account_number;
                if (hasPayment && proofImage) {
                    proof_image_url = await MasterDataApprovalsService.uploadPaymentProofImage(proofImage);
                } else if (hasPayment && !proofImage && !provider?.payment_details?.id) {
                    alert("A verification proof image is required when setting up payment details.");
                    setLoading(false);
                    return;
                }

                await MasterDataApprovalsService.submitApproval({
                    entity_type: 'transport',
                    entity_id: formData.id || null,
                    action: formData.id ? 'UPDATE' : 'CREATE',
                    proposed_data: formData,
                    contact_details: { name: formData.name, phone: formData.phone, email: formData.email },
                    proof_image_url
                });
                alert("Request sent for Admin approval.");
                onClose();
            } else {
                const res = await saveTransportProviderAction(formData as TransportProvider);
                if (!res.success) {
                    throw new Error(res.error || "Failed to save transport provider");
                }
                const savedId = res.savedId;
                onSave();

                // Re-fetch the saved provider to update form data with any new IDs (from DB)
                if (savedId) {
                    const updatedProvider = await MasterDataService.getTransportProvider(savedId);
                    setFormData({
                        ...updatedProvider,
                        payment_details: updatedProvider.payment_details || {},
                        transport_vehicles: updatedProvider.transport_vehicles || []
                    });
                    setCoordinateInput((updatedProvider.lat && updatedProvider.lng) ? `${updatedProvider.lat}, ${updatedProvider.lng}` : "");
                }

                alert("Transport provider saved successfully.");
            }
        } catch (error: any) {
            console.error("Save Transport Provider Error:", error);
            const message = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
            alert(`Error saving transport provider: ${message}`);
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
                        {provider ? "Edit Transport Provider" : "Add New Transport Provider"}
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
                            <div className="col-span-2 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Company Name / Provider Name *</label>
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
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Address</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.address || ''} onChange={e => handleChange('address', e.target.value)} />
                            </div>
                            <div className="col-span-2 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Location Coordinates (Lat, Lng)</label>
                                <input type="text" placeholder="e.g. 6.9271, 79.8612" className="w-full outline-none text-brand-charcoal font-medium" value={coordinateInput} onChange={e => handleCoordinateChange(e.target.value)} />
                            </div>
                            <div className="col-span-2 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">NIC Number</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.nic_number || ''} onChange={e => handleChange('nic_number', e.target.value)} />
                            </div>
                            <div className="col-span-2 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="w-5 h-5 accent-red-500 rounded border-neutral-300" checked={formData.is_suspended || false} onChange={e => handleChange('is_suspended', e.target.checked)} />
                                    <span className="text-sm font-bold text-red-600 group-hover:text-red-700 transition-colors">Provider Suspended</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === "Vehicles" && (
                        <div className="flex flex-col gap-6">
                            {(formData.transport_vehicles || []).map((vehicle, index) => (
                                <div key={index} className="border border-neutral-200 rounded-xl p-6 relative group bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <button onClick={() => removeVehicle(index)} className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                        <Trash2 size={18} />
                                    </button>
                                    <h4 className="font-bold text-lg text-brand-charcoal mb-4">Vehicle #{index + 1}</h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Vehicle Type *</label>
                                            <select
                                                className="w-full outline-none text-brand-charcoal font-medium bg-transparent"
                                                value={vehicle.vehicle_type}
                                                onChange={e => updateVehicle(index, 'vehicle_type', e.target.value)}
                                            >
                                                <option value="">Select Type</option>
                                                <optgroup label="SMALL GROUP (1–3 Pax)">
                                                    <option value="SMALL_BUDGET_SEDAN">Budget Sedan</option>
                                                    <option value="SMALL_PREMIUM_SEDAN">Premium Sedan</option>
                                                    <option value="SMALL_LUXURY_SUV">Luxury SUV</option>
                                                    <option value="SMALL_ULTRA_VIP_EUROPE_SEDAN">Ultra VIP Europe Sedan</option>
                                                    <option value="SMALL_ULTRA_VIP_EUROPE_SUV">Ultra VIP Europe SUV</option>
                                                    <option value="SMALL_ULTRA_VIP_ARMORED_SUV">Ultra VIP Armored SUV</option>
                                                </optgroup>
                                                <optgroup label="MEDIUM GROUP (4–9 Pax)">
                                                    <option value="MEDIUM_BUDGET_VAN">Budget Van</option>
                                                    <option value="MEDIUM_PREMIUM_HIGHROOF_VAN">Premium Highroof Van</option>
                                                    <option value="MEDIUM_LUXURY_EXECUTIVE_VAN">Luxury Executive Van</option>
                                                    <option value="MEDIUM_ULTRA_VIP_EUROPE_SUV_FLEET">Ultra VIP Europe SUV Fleet</option>
                                                    <option value="MEDIUM_ULTRA_VIP_EXECUTIVE_VAN">Ultra VIP Executive Van</option>
                                                    <option value="MEDIUM_ULTRA_VIP_HELICOPTER_TRANSFER">Ultra VIP Helicopter Transfer</option>
                                                </optgroup>
                                                <optgroup label="LARGE GROUP (10–25 Pax)">
                                                    <option value="LARGE_BUDGET_MINI_COACH">Budget Mini Coach</option>
                                                    <option value="LARGE_PREMIUM_COACH">Premium Coach</option>
                                                    <option value="LARGE_LUXURY_EXECUTIVE_COACH">Luxury Executive Coach</option>
                                                    <option value="LARGE_ULTRA_VIP_EUROPE_COACH">Ultra VIP Europe Coach</option>
                                                    <option value="LARGE_ULTRA_VIP_EXECUTIVE_VAN_FLEET">Ultra VIP Executive Van Fleet</option>
                                                    <option value="LARGE_ULTRA_VIP_PRIVATE_JET">Ultra VIP Private Jet</option>
                                                </optgroup>
                                            </select>
                                        </div>
                                        <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Make and Model</label>
                                            <input type="text" placeholder="e.g. Toyota Hiace" className="w-full outline-none text-brand-charcoal font-medium" value={vehicle.make_and_model || ''} onChange={e => updateVehicle(index, 'make_and_model', e.target.value)} />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Year of Manufacture</label>
                                            <input type="number" className="w-full outline-none text-brand-charcoal font-medium" value={vehicle.year_of_manufacture || ''} onChange={e => updateVehicle(index, 'year_of_manufacture', e.target.value ? parseInt(e.target.value) : undefined)} />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Vehicle Number</label>
                                            <input type="text" placeholder="e.g. WP CAA-1234" className="w-full outline-none text-brand-charcoal font-medium" value={vehicle.vehicle_number || ''} onChange={e => updateVehicle(index, 'vehicle_number', e.target.value)} />
                                        </div>

                                        <div className="col-span-2 pt-2 border-t border-neutral-100 flex items-center mb-2">
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <input type="checkbox" className="w-5 h-5 accent-brand-green rounded border-neutral-300" checked={vehicle.with_driver !== false} onChange={e => updateVehicle(index, 'with_driver', e.target.checked)} />
                                                <span className="text-sm font-bold text-brand-charcoal">Include Driver</span>
                                            </label>
                                        </div>

                                        <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Flat KM Rate (USD)</label>
                                            <input type="number" step="any" placeholder="e.g. 0.50" className="w-full outline-none text-brand-charcoal font-medium" value={vehicle.km_rate || ''} onChange={e => updateVehicle(index, 'km_rate', e.target.value ? parseFloat(e.target.value) : undefined)} />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Day Rate (USD)</label>
                                            <input type="number" step="any" placeholder="e.g. 50" className="w-full outline-none text-brand-charcoal font-medium" value={vehicle.day_rate || ''} onChange={e => updateVehicle(index, 'day_rate', e.target.value ? parseFloat(e.target.value) : undefined)} />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Max KM per Day</label>
                                            <input type="number" placeholder="e.g. 100" className="w-full outline-none text-brand-charcoal font-medium" value={vehicle.max_km_per_day || ''} onChange={e => updateVehicle(index, 'max_km_per_day', e.target.value ? parseInt(e.target.value) : undefined)} />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Additional KM Rate (USD)</label>
                                            <input type="number" step="any" placeholder="e.g. 0.60" className="w-full outline-none text-brand-charcoal font-medium" value={vehicle.additional_km_rate || ''} onChange={e => updateVehicle(index, 'additional_km_rate', e.target.value ? parseFloat(e.target.value) : undefined)} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addVehicle} className="col-span-2 border-2 border-dashed border-neutral-300 rounded-xl p-4 flex items-center justify-center gap-2 text-neutral-500 font-bold hover:text-brand-green hover:border-brand-green hover:bg-brand-green/5 transition-all outline-none">
                                <Plus size={20} /> Add Vehicle Option
                            </button>
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
                        {loading ? "Saving..." : <><Check size={18} /> {userRole === 'agent' ? "Submit for Approval" : (provider ? "Save Changes" : "Create Provider")}</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
