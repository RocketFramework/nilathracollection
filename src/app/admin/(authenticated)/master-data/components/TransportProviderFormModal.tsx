import React, { useState, useEffect } from "react";
import { X, Check, Trash2, Plus, Upload, ExternalLink, ShieldCheck, Clock, UserCheck } from "lucide-react";
import { MasterDataService, TransportProvider, TransportVehicle } from "@/services/master-data.service";
import { MasterDataApprovalsService } from "@/services/master-data-approvals.service";
import { saveTransportProviderAction, approvePartnerAction, uploadPartnerImageAction } from "@/actions/admin.actions";

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
    const [uploadingVehicleIndex, setUploadingVehicleIndex] = useState<number | null>(null);
    const [proofImage, setProofImage] = useState<File | null>(null);

    const [formData, setFormData] = useState<Partial<TransportProvider>>({
        name: "", phone: "", email: "", address: "", lat: undefined, lng: undefined, nic_number: "", approval_status: "Pending", is_suspended: false, has_contracted_price: true,
        payment_details: {},
        transport_vehicles: []
    });
    const [coordinateInput, setCoordinateInput] = useState("");

    useEffect(() => {
        if (isOpen) {
            if (provider) {
                setFormData({
                    ...provider,
                    approval_status: provider.approval_status || 'Pending',
                    has_contracted_price: provider.has_contracted_price ?? true,
                    payment_details: provider.payment_details || {},
                    transport_vehicles: provider.transport_vehicles || []
                });
                setCoordinateInput((provider.lat && provider.lng) ? `${provider.lat}, ${provider.lng}` : "");
            } else {
                setFormData({
                    name: "", phone: "", email: "", address: "", lat: undefined, lng: undefined, nic_number: "", approval_status: "Pending", is_suspended: false, has_contracted_price: true,
                    payment_details: {},
                    transport_vehicles: []
                });
                setCoordinateInput("");
            }
            setActiveTab(TABS[0]);
            setProofImage(null);
            setUploadingVehicleIndex(null);
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
            with_driver: true,
            approval_status: 'Pending'
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

    const handleVehicleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingVehicleIndex(index);
        try {
            const uploadFd = new FormData();
            uploadFd.append('file', file);
            uploadFd.append('folder', 'vehicles');
            const res = await uploadPartnerImageAction(uploadFd);
            if (res.error) throw new Error(res.error);
            if (res.url) {
                updateVehicle(index, 'image_url', res.url);
            }
        } catch (error: any) {
            alert(`Vehicle image upload failed: ${error.message}`);
        } finally {
            setUploadingVehicleIndex(null);
        }
    };

    const handleApproveProvider = async () => {
        if (!formData.id) {
            setFormData(prev => ({
                ...prev,
                approval_status: 'Approved',
                transport_vehicles: (prev.transport_vehicles || []).map(v => ({ ...v, approval_status: 'Approved' }))
            }));
            alert("Provider status set to Approved. Click 'Save Changes' to apply.");
            return;
        }

        if (!confirm("Are you sure you want to approve this Transport Provider and their fleet? Approver ID and timestamp will be recorded.")) return;

        setLoading(true);
        try {
            const res = await approvePartnerAction('transport', formData.id);
            if (!res.success) throw new Error(res.error);

            setFormData(prev => ({
                ...prev,
                approval_status: 'Approved',
                approved_by: res.data?.approved_by || 'Admin',
                approved_at: res.data?.approved_at || new Date().toISOString(),
                transport_vehicles: (prev.transport_vehicles || []).map(v => ({
                    ...v,
                    approval_status: 'Approved',
                    approved_by: res.data?.approved_by || 'Admin',
                    approved_at: res.data?.approved_at || new Date().toISOString()
                }))
            }));

            onSave();
            alert("Transport Provider approved successfully!");
        } catch (err: any) {
            alert(`Approval failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
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
                    <div>
                        <h2 className="text-2xl font-bold font-playfair text-[#2B2B2B]">
                            {provider ? "Edit Transport Provider" : "Add New Transport Provider"}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full ${formData.approval_status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                Status: {formData.approval_status || 'Pending'}
                            </span>
                        </div>
                    </div>
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

                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar space-y-6">
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
                            <div className="col-span-2 mt-2 flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="w-5 h-5 accent-red-500 rounded border-neutral-300" checked={formData.is_suspended || false} onChange={e => handleChange('is_suspended', e.target.checked)} />
                                    <span className="text-sm font-bold text-red-600 group-hover:text-red-700 transition-colors">Provider Suspended</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="w-5 h-5 accent-brand-green rounded border-neutral-300" checked={formData.has_contracted_price ?? true} onChange={e => handleChange('has_contracted_price', e.target.checked)} />
                                    <span className="text-sm font-bold text-brand-green group-hover:text-brand-green transition-colors">Has Contracted Price</span>
                                </label>
                            </div>

                            {/* Approval Verification Box */}
                            <div className="col-span-2 border border-neutral-200 rounded-2xl p-5 bg-neutral-50/50 space-y-4 shadow-sm">
                                <h3 className="text-sm font-bold text-brand-charcoal flex items-center gap-2">
                                    <UserCheck size={18} className="text-blue-600" /> Approval Verification Status
                                </h3>

                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div className="p-3 rounded-xl bg-white border border-neutral-200">
                                        <span className="text-neutral-400 font-bold uppercase tracking-wider block text-[10px]">Status</span>
                                        <span className={`inline-block mt-1 font-bold px-2.5 py-0.5 rounded-full text-[11px] ${formData.approval_status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {formData.approval_status || 'Pending'}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white border border-neutral-200">
                                        <span className="text-neutral-400 font-bold uppercase tracking-wider block text-[10px]">Approved By User ID</span>
                                        <span className="font-mono text-neutral-700 font-bold mt-1 block truncate">
                                            {formData.approved_by || 'Not Approved Yet'}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white border border-neutral-200 col-span-2">
                                        <span className="text-neutral-400 font-bold uppercase tracking-wider block text-[10px]">Approval Timestamp</span>
                                        <span className="text-neutral-700 font-bold mt-1 flex items-center gap-1.5">
                                            <Clock size={13} className="text-neutral-400" />
                                            {formData.approved_at ? new Date(formData.approved_at).toLocaleString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {formData.approval_status !== 'Approved' && (
                                    <button
                                        type="button"
                                        onClick={handleApproveProvider}
                                        disabled={loading}
                                        className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-2"
                                    >
                                        <ShieldCheck size={16} /> Approve Provider & Fleet
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "Vehicles" && (
                        <div className="flex flex-col gap-6">
                            {(formData.transport_vehicles || []).map((vehicle, index) => (
                                <div key={index} className="border border-neutral-200 rounded-xl p-6 relative group bg-white shadow-sm hover:shadow-md transition-shadow space-y-4">
                                    <button onClick={() => removeVehicle(index)} className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                        <Trash2 size={18} />
                                    </button>
                                    <div className="flex items-center justify-between border-b pb-3">
                                        <h4 className="font-bold text-lg text-brand-charcoal">Vehicle #{index + 1}</h4>
                                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full ${vehicle.approval_status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {vehicle.approval_status || 'Pending'}
                                        </span>
                                    </div>

                                    {/* Vehicle Photo Upload & Preview Section */}
                                    <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-1.5">
                                                Vehicle Image Photo
                                            </label>
                                            {vehicle.image_url && (
                                                <a href={vehicle.image_url} target="_blank" rel="noreferrer" className="text-xs text-brand-green font-bold flex items-center gap-1 hover:underline">
                                                    View Full <ExternalLink size={12} />
                                                </a>
                                            )}
                                        </div>

                                        {vehicle.image_url ? (
                                            <div className="relative rounded-lg overflow-hidden border border-neutral-200 bg-black/5 max-h-40 flex items-center justify-center">
                                                <img src={vehicle.image_url} alt={`Vehicle ${index + 1}`} className="max-h-40 object-contain" />
                                            </div>
                                        ) : (
                                            <div className="p-4 border border-dashed border-neutral-300 rounded-lg text-center bg-white">
                                                <p className="text-xs text-neutral-400">No vehicle image uploaded yet.</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                            <label className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-neutral-200 hover:border-brand-green rounded-xl cursor-pointer text-xs font-bold text-brand-charcoal hover:text-brand-green transition-all shadow-sm">
                                                <Upload size={14} /> {uploadingVehicleIndex === index ? "Uploading..." : "Upload Photo"}
                                                <input type="file" accept="image/*" className="hidden" onChange={e => handleVehicleImageUpload(index, e)} disabled={uploadingVehicleIndex === index} />
                                            </label>
                                            <div className="border border-neutral-200 rounded-xl px-3 py-1 bg-white focus-within:border-brand-green transition-all">
                                                <label className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">Image URL Link</label>
                                                <input type="text" placeholder="https://..." className="w-full outline-none text-xs text-brand-charcoal font-medium" value={vehicle.image_url || ''} onChange={e => updateVehicle(index, 'image_url', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>

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
                                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Make</label>
                                            <input
                                                type="text"
                                                list={`make-list-${index}`}
                                                placeholder="e.g. Toyota"
                                                className="w-full outline-none text-brand-charcoal font-medium bg-transparent"
                                                value={vehicle.make || ''}
                                                onChange={e => updateVehicle(index, 'make', e.target.value)}
                                            />
                                            <datalist id={`make-list-${index}`}>
                                                {['Toyota','Honda','Nissan','Mitsubishi','Suzuki','Isuzu','Hyundai','KIA','Mercedes-Benz','BMW','Audi','Volkswagen','Ford','Mazda','Tata','Volvo','Coaster','BYD','Renault','Peugeot'].map(m => (
                                                    <option key={m} value={m} />
                                                ))}
                                            </datalist>
                                        </div>
                                        <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Model</label>
                                            <input
                                                type="text"
                                                list={`model-list-${index}`}
                                                placeholder="e.g. Hiace"
                                                className="w-full outline-none text-brand-charcoal font-medium bg-transparent"
                                                value={vehicle.model || ''}
                                                onChange={e => updateVehicle(index, 'model', e.target.value)}
                                            />
                                            <datalist id={`model-list-${index}`}>
                                                {(({
                                                    'Toyota': ['Land Cruiser','Prado','Alphard','Vellfire','Hiace','Coaster','HiAce Commuter','Fortuner','Innova','Corolla','Camry'],
                                                    'Honda': ['Vezel','HR-V','CR-V','Odyssey','Accord','Civic','StepWGN'],
                                                    'Nissan': ['Patrol','Safari','Caravan','X-Trail','Navara'],
                                                    'Mitsubishi': ['Montero Sport','Pajero','Delica','Outlander','Rosa'],
                                                    'Suzuki': ['Jimny','Swift','Ertiga','Grand Vitara'],
                                                    'Mercedes-Benz': ['V-Class','Sprinter','S-Class','GLE','GLS','C-Class'],
                                                    'BMW': ['7 Series','5 Series','X5','X7'],
                                                    'Volkswagen': ['Multivan','Caravelle','Touareg'],
                                                    'Hyundai': ['H1','Staria','Santa Fe','Tucson'],
                                                    'KIA': ['Carnival','Sorento','Sportage'],
                                                    'Isuzu': ['D-Max','MU-X','NLR'],
                                                    'Volvo': ['B7R','9400','FH'],
                                                })[vehicle.make || ''] || [
                                                    'Land Cruiser','Hiace','Alphard','Sprinter','Carnival','Prado','H1','Coaster','Vellfire'
                                                ]).map((m: string) => <option key={m} value={m} />)}
                                            </datalist>
                                        </div>
                                        <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Max Seat Capacity <span className="font-normal normal-case text-neutral-400">(excl. driver)</span></label>
                                            <input type="number" min="1" placeholder="e.g. 7" className="w-full outline-none text-brand-charcoal font-medium" value={vehicle.max_seat_capacity || ''} onChange={e => updateVehicle(index, 'max_seat_capacity', e.target.value ? parseInt(e.target.value) : undefined)} />
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
