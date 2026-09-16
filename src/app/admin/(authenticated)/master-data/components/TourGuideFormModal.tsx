import React, { useState, useEffect } from "react";
import { X, Check, Upload, ExternalLink, ShieldCheck, Clock, UserCheck } from "lucide-react";
import { MasterDataService, TourGuide } from "@/services/master-data.service";
import { MasterDataApprovalsService } from "@/services/master-data-approvals.service";
import { saveTourGuideAction, approvePartnerAction, uploadPartnerImageAction } from "@/actions/admin.actions";

interface TourGuideFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    guide?: TourGuide | null;
    onSave: () => void;
    userRole: string;
}

const TABS = ["Basic Info", "SLTDA & Verification", "Languages", "Payment Details"];

export default function TourGuideFormModal({ isOpen, onClose, guide, onSave, userRole }: TourGuideFormModalProps) {
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [proofImage, setProofImage] = useState<File | null>(null);

    const [formData, setFormData] = useState<Partial<TourGuide>>({
        first_name: "", last_name: "", phone: "", license_id: "", sltda_registration_number: "", nic_number: "", sltda_id_image_url: "", approval_status: "Pending", languages: [], is_suspended: false, has_contracted_price: true,
        payment_details: {}
    });

    const [langInput, setLangInput] = useState("");

    useEffect(() => {
        if (isOpen) {
            if (guide) {
                const rate = guide.daily_rate ?? guide.per_day_rate ?? 20;
                setFormData({
                    ...guide,
                    daily_rate: rate,
                    per_day_rate: rate,
                    has_contracted_price: guide.has_contracted_price ?? true,
                    approval_status: guide.approval_status || 'Pending',
                    languages: guide.languages || [],
                    payment_details: guide.payment_details || {}
                });
            } else {
                setFormData({
                    first_name: "", last_name: "", phone: "", license_id: "", sltda_registration_number: "", nic_number: "", sltda_id_image_url: "", approval_status: "Pending", languages: [], is_suspended: false, has_contracted_price: true,
                    daily_rate: 20,
                    per_day_rate: 20,
                    payment_details: {}
                });
            }
            setActiveTab(TABS[0]);
            setLangInput("");
            setProofImage(null);
        }
    }, [isOpen, guide]);

    const handleChange = (field: keyof TourGuide, value: string | number | boolean | string[] | undefined) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePaymentChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            payment_details: { ...(prev.payment_details || {}), [field]: value }
        }));
    };

    const handleSltdaImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const uploadFd = new FormData();
            uploadFd.append('file', file);
            uploadFd.append('folder', 'tour-guides');
            const res = await uploadPartnerImageAction(uploadFd);
            if (res.error) throw new Error(res.error);
            if (res.url) {
                setFormData(prev => ({ ...prev, sltda_id_image_url: res.url }));
            }
        } catch (error: any) {
            alert(`Image upload failed: ${error.message}`);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleApproveGuide = async () => {
        if (!formData.id) {
            // New guide, set status to Approved locally before save
            setFormData(prev => ({ ...prev, approval_status: 'Approved' }));
            alert("Guide status set to Approved. Click 'Save Changes' to apply.");
            return;
        }

        if (!confirm("Are you sure you want to approve this Tour Guide? Approver ID and timestamp will be recorded.")) return;

        setLoading(true);
        try {
            const res = await approvePartnerAction('guide', formData.id);
            if (!res.success) throw new Error(res.error);

            setFormData(prev => ({
                ...prev,
                approval_status: 'Approved',
                approved_by: res.data?.approved_by || 'Admin',
                approved_at: res.data?.approved_at || new Date().toISOString()
            }));

            onSave();
            alert("Tour Guide approved successfully!");
        } catch (err: any) {
            alert(`Approval failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
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
            if (userRole === 'agent') {
                let proof_image_url = null;
                const hasPayment = formData.payment_details?.bank_name || formData.payment_details?.account_number;
                if (hasPayment && proofImage) {
                    proof_image_url = await MasterDataApprovalsService.uploadPaymentProofImage(proofImage);
                } else if (hasPayment && !proofImage && !guide?.payment_details?.id) {
                    alert("A verification proof image is required when setting up payment details.");
                    setLoading(false);
                    return;
                }

                await MasterDataApprovalsService.submitApproval({
                    entity_type: 'guide',
                    entity_id: formData.id || null,
                    action: formData.id ? 'UPDATE' : 'CREATE',
                    proposed_data: formData,
                    contact_details: { name: `${formData.first_name} ${formData.last_name}`, phone: formData.phone },
                    proof_image_url
                });
                alert("Request sent for Admin approval.");
                onClose();
            } else {
                const res = await saveTourGuideAction(formData as TourGuide);
                if (res.error) throw new Error(res.error);
                const savedId = res.savedId;
                onSave();

                if (savedId) {
                    const updated = await MasterDataService.getTourGuide(savedId);
                    setFormData({ ...updated, payment_details: updated.payment_details || {} });
                }
                alert("Tour Guide saved successfully.");
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "An unknown error occurred";
            alert(`Error saving guide: ${message}`);
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
                            {guide ? "Edit Tour Guide" : "Add New Tour Guide"}
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

                <div className="flex border-b border-neutral-100 px-6 bg-neutral-50/50 overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 text-sm font-bold tracking-wide transition-colors border-b-2 whitespace-nowrap ${activeTab === tab ? "border-brand-green text-brand-green bg-brand-green/5" : "border-transparent text-neutral-500 hover:text-brand-charcoal"}`}
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
                            <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Per Day Rate ($)</label>
                                <input
                                    type="number"
                                    className="w-full outline-none text-brand-charcoal font-medium"
                                    value={formData.daily_rate ?? formData.per_day_rate ?? 20}
                                    onChange={e => {
                                        const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                        handleChange('daily_rate', val);
                                        handleChange('per_day_rate', val);
                                    }}
                                />
                            </div>
                            <div className="col-span-2 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Email Address</label>
                                <input type="email" className="w-full outline-none text-brand-charcoal font-medium" value={formData.email || ''} onChange={e => handleChange('email', e.target.value)} />
                            </div>
                            <div className="col-span-2 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Address</label>
                                <input type="text" className="w-full outline-none text-brand-charcoal font-medium" value={formData.address || ''} onChange={e => handleChange('address', e.target.value)} />
                            </div>
                            <div className="col-span-2 mt-2 flex flex-wrap items-center justify-between bg-neutral-50 p-3 rounded-xl border border-neutral-100 gap-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="w-5 h-5 accent-red-500 rounded border-neutral-300" checked={formData.is_suspended || false} onChange={e => handleChange('is_suspended', e.target.checked)} />
                                    <span className="text-sm font-bold text-red-600 group-hover:text-red-700 transition-colors">Guide Suspended</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="w-5 h-5 accent-brand-green rounded border-neutral-300" checked={formData.has_contracted_price ?? true} onChange={e => handleChange('has_contracted_price', e.target.checked)} />
                                    <span className="text-sm font-bold text-brand-green group-hover:text-brand-green transition-colors">Has Contracted Price</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === "SLTDA & Verification" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">NIC Number</label>
                                    <input type="text" placeholder="e.g. 199226125738 or 923612573V" className="w-full outline-none text-brand-charcoal font-medium" value={formData.nic_number || ''} onChange={e => handleChange('nic_number', e.target.value)} />
                                </div>
                                <div className="col-span-2 sm:col-span-1 border border-neutral-200 rounded-xl px-4 py-2 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green transition-all">
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">SLTDA Registration / License ID</label>
                                    <input type="text" placeholder="e.g. SLTDA/TG/2026/089" className="w-full outline-none text-brand-charcoal font-medium" value={formData.sltda_registration_number || formData.license_id || ''} onChange={e => { handleChange('sltda_registration_number', e.target.value); handleChange('license_id', e.target.value); }} />
                                </div>
                            </div>

                            {/* Image Upload & Edit URL Section */}
                            <div className="border border-neutral-200 rounded-2xl p-5 bg-neutral-50/50 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-brand-charcoal flex items-center gap-2">
                                        <ShieldCheck size={18} className="text-brand-green" /> SLTDA Tourist Guide ID Image
                                    </h3>
                                    {formData.sltda_id_image_url && (
                                        <a href={formData.sltda_id_image_url} target="_blank" rel="noreferrer" className="text-xs text-brand-green font-bold flex items-center gap-1 hover:underline">
                                            View Full Image <ExternalLink size={12} />
                                        </a>
                                    )}
                                </div>

                                {formData.sltda_id_image_url ? (
                                    <div className="relative rounded-xl overflow-hidden border border-neutral-200 bg-black/5 max-h-48 flex items-center justify-center">
                                        <img src={formData.sltda_id_image_url} alt="SLTDA Guide ID" className="max-h-48 object-contain" />
                                    </div>
                                ) : (
                                    <div className="p-6 border-2 border-dashed border-neutral-300 rounded-xl text-center bg-white">
                                        <p className="text-xs text-neutral-500 font-medium">No SLTDA Tourist Guide ID image uploaded yet.</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 hover:border-brand-green rounded-xl cursor-pointer text-xs font-bold text-brand-charcoal hover:text-brand-green transition-all shadow-sm">
                                        <Upload size={16} /> {uploadingImage ? "Uploading..." : "Upload New Image"}
                                        <input type="file" accept="image/*" className="hidden" onChange={handleSltdaImageUpload} disabled={uploadingImage} />
                                    </label>
                                    <div className="border border-neutral-200 rounded-xl px-3 py-1.5 bg-white focus-within:border-brand-green transition-all">
                                        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Image URL Link</label>
                                        <input type="text" placeholder="https://..." className="w-full outline-none text-xs text-brand-charcoal font-medium" value={formData.sltda_id_image_url || ''} onChange={e => handleChange('sltda_id_image_url', e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            {/* Approval Status & Metadata Panel */}
                            <div className="border border-neutral-200 rounded-2xl p-5 bg-white space-y-4 shadow-sm">
                                <h3 className="text-sm font-bold text-brand-charcoal flex items-center gap-2">
                                    <UserCheck size={18} className="text-blue-600" /> Admin Approval Status
                                </h3>

                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                                        <span className="text-neutral-400 font-bold uppercase tracking-wider block text-[10px]">Current Status</span>
                                        <span className={`inline-block mt-1 font-bold px-2.5 py-0.5 rounded-full text-[11px] ${formData.approval_status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {formData.approval_status || 'Pending'}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                                        <span className="text-neutral-400 font-bold uppercase tracking-wider block text-[10px]">Approved By User ID</span>
                                        <span className="font-mono text-neutral-700 font-bold mt-1 block truncate">
                                            {formData.approved_by || 'Not Approved Yet'}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 col-span-2">
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
                                        onClick={handleApproveGuide}
                                        disabled={loading}
                                        className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-2"
                                    >
                                        <ShieldCheck size={16} /> Approve Tour Guide & Record Verification
                                    </button>
                                )}
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
                        {loading ? "Saving..." : <><Check size={18} /> {userRole === 'agent' ? "Submit for Approval" : (guide ? "Save Changes" : "Create Guide")}</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
