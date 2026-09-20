"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { searchExistingVendorsAction, onboardVendorAction, getAvailableActivitiesAction, verifyVendorOwnershipAction } from "@/actions/partner-registration.actions";
import { IVendor } from "@/interfaces/interfaces";
import { Building2, Search, CheckCircle2, Loader2, ArrowLeft, CreditCard, Compass, AlertCircle, Plus, Trash2, MapPin, ShieldCheck, Lock, Info, X } from "lucide-react";

interface ActivityOption {
    id: string;
    activity_name: string;
    category?: string;
    location_name?: string;
    district?: string;
}

interface SelectedActivityState {
    activity_id: string;
    activity_name: string;
    vendor_price: number | string;
}

function maskPhone(phone?: string | null): string {
    if (!phone) return "";
    const clean = phone.trim();
    if (clean.length <= 4) return "****";
    const start = clean.slice(0, 4);
    const end = clean.slice(-3);
    return `${start}***${end}`;
}

function maskEmail(email?: string | null): string {
    if (!email) return "";
    const clean = email.trim();
    const parts = clean.split("@");
    if (parts.length !== 2) return "****";
    const name = parts[0];
    const domain = parts[1];
    const maskedName = name.length > 2 ? `${name.slice(0, 2)}***` : `${name.slice(0, 1)}***`;
    return `${maskedName}@${domain}`;
}

export default function ActivityVendorOnboardingPage() {
    const [step, setStep] = useState<'search' | 'form' | 'success'>('search');

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<IVendor[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedExistingVendor, setSelectedExistingVendor] = useState<IVendor | null>(null);

    // Security Verification Modal state
    const [verifyingVendor, setVerifyingVendor] = useState<IVendor | null>(null);
    const [verifyInput, setVerifyInput] = useState("");
    const [verifyingCode, setVerifyingCode] = useState(false);
    const [verifyError, setVerifyError] = useState("");

    // Form inputs
    const [vendorName, setVendorName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [description, setDescription] = useState("");

    // Bank Details
    const [bankName, setBankName] = useState("");
    const [branchName, setBranchName] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [swiftCode, setSwiftCode] = useState("");

    // Activities Selection
    const [availableActivities, setAvailableActivities] = useState<ActivityOption[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [selectedActivities, setSelectedActivities] = useState<SelectedActivityState[]>([]);
    const [actSearchFilter, setActSearchFilter] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    // Fetch master activities on load
    useEffect(() => {
        async function fetchActivities() {
            setLoadingActivities(true);
            try {
                const res = await getAvailableActivitiesAction();
                if (res.success && res.data) {
                    setAvailableActivities(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch activities:", err);
            } finally {
                setLoadingActivities(false);
            }
        }
        fetchActivities();
    }, []);

    // Live search vendors
    const handleSearchVendor = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setSearching(true);
        setHasSearched(true);
        setSelectedExistingVendor(null);

        try {
            const res = await searchExistingVendorsAction(searchQuery);
            if (res.success && res.data) {
                setSearchResults(res.data);
            } else {
                setSearchResults([]);
            }
        } catch (err) {
            console.error("Search error:", err);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    // Open verification modal when user clicks "Select & Update"
    const handleOpenVerification = (vendor: IVendor) => {
        setVerifyingVendor(vendor);
        setVerifyInput("");
        setVerifyError("");
    };

    // Verify ownership against registered phone or email
    const handleVerifyOwnershipSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verifyingVendor) return;
        setVerifyError("");

        if (!verifyInput.trim()) {
            setVerifyError("Please enter your registered phone number or email address.");
            return;
        }

        setVerifyingCode(true);

        try {
            const res = await verifyVendorOwnershipAction(verifyingVendor.id, verifyInput.trim());
            if (res.success && res.isOwner) {
                // Security check passed! Pre-fill & open form
                const v = verifyingVendor;
                setSelectedExistingVendor(v);
                setVendorName(v.name);
                setPhone(v.phone || "");
                setEmail(v.email || "");
                setAddress(v.address || "");
                setDescription(v.description || "");
                setVerifyingVendor(null);
                setStep('form');
            } else {
                setVerifyError(`Verification failed. The phone or email entered does not match our records for "${verifyingVendor.name}". To protect vendors from unauthorized modifications, editing is restricted.`);
            }
        } catch (err: any) {
            setVerifyError(err.message || "An error occurred during verification.");
        } finally {
            setVerifyingCode(false);
        }
    };

    // Toggle selected activity
    const handleToggleActivity = (act: ActivityOption) => {
        setSelectedActivities(prev => {
            const exists = prev.find(a => a.activity_id === act.id);
            if (exists) {
                return prev.filter(a => a.activity_id !== act.id);
            } else {
                return [...prev, {
                    activity_id: act.id,
                    activity_name: act.activity_name,
                    vendor_price: ""
                }];
            }
        });
    };

    // Update vendor price for selected activity
    const handlePriceChange = (activity_id: string, price: string) => {
        setSelectedActivities(prev => prev.map(item => {
            if (item.activity_id === activity_id) {
                return { ...item, vendor_price: price };
            }
            return item;
        }));
    };

    // Step 2: Submit Form
    const handleSubmitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");

        if (!vendorName.trim()) {
            setSubmitError("Vendor Business / Company Name is required.");
            return;
        }

        if (!phone.trim()) {
            setSubmitError("Contact Phone Number is required.");
            return;
        }

        setSubmitting(true);

        try {
            const mappedActivities = selectedActivities.map(act => ({
                activity_id: act.activity_id,
                vendor_price: act.vendor_price ? Number(act.vendor_price) : undefined
            }));

            const dto = {
                name: vendorName,
                phone: phone || undefined,
                email: email || undefined,
                address: address || undefined,
                description: description || undefined,
                has_contracted_price: true,
                bank_name: bankName || undefined,
                branch_name: branchName || undefined,
                account_name: accountName || undefined,
                account_number: accountNumber || undefined,
                swift_code: swiftCode || undefined,
                activities: mappedActivities
            };

            const res = await onboardVendorAction(dto);
            if (res.success) {
                setStep('success');
            } else {
                setSubmitError(res.error || "Failed to submit Vendor registration.");
            }
        } catch (err: any) {
            setSubmitError(err.message || "An error occurred while saving vendor profile.");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredAvailableActivities = availableActivities.filter(act => 
        act.activity_name.toLowerCase().includes(actSearchFilter.toLowerCase()) ||
        (act.district && act.district.toLowerCase().includes(actSearchFilter.toLowerCase())) ||
        (act.category && act.category.toLowerCase().includes(actSearchFilter.toLowerCase()))
    );

    return (
        <MainLayout>
            <div className="bg-[#FAF9F5] min-h-screen pt-20 md:pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {/* Top Back Nav */}
                    <div className="mb-6">
                        <Link href="/partner-registration" className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-brand-charcoal transition-colors">
                            <ArrowLeft size={16} /> Back to Partner Registration Portals
                        </Link>
                    </div>

                    {/* STEP 1: Search Existing Vendors */}
                    {step === 'search' && (
                        <div className="bg-white rounded-3xl border border-neutral-200 shadow-md overflow-hidden animate-in fade-in duration-300">
                            <div className="bg-brand-charcoal p-8 text-white flex items-center gap-4">
                                <div className="p-3 bg-brand-gold/20 rounded-2xl text-brand-gold">
                                    <Building2 size={32} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-serif font-bold">Activity Vendor Onboarding</h1>
                                    <p className="text-xs text-neutral-300 mt-1">First, search to verify if your activity business is already registered in our system.</p>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <form onSubmit={handleSearchVendor} className="space-y-4">
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">
                                        Search Registered Vendors (By Company Name, Phone, or Email)
                                    </label>
                                    
                                    {/* User requested note */}
                                    <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-900 leading-relaxed font-medium flex items-start gap-2.5">
                                        <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                        <span>
                                            You may have already been tracked and onboarded by our team. Please search your name and see if the record already exists before you add a new record....
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="e.g. Cinnamon Air, Bentota Water Sports, Kandy Cultural Center"
                                                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={searching}
                                            className="px-6 py-3.5 bg-brand-charcoal text-white font-bold text-sm rounded-xl hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {searching ? <Loader2 size={16} className="animate-spin text-brand-gold" /> : "Search Vendor"}
                                        </button>
                                    </div>
                                </form>

                                {hasSearched && (
                                    <div className="space-y-4 pt-4 border-t border-neutral-100">
                                        {searchResults.length > 0 ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                                                    <AlertCircle size={16} />
                                                    Found {searchResults.length} existing record(s) matching your search query. Select yours or proceed to register a new vendor.
                                                </div>

                                                <div className="grid grid-cols-1 gap-3">
                                                    {searchResults.map(v => (
                                                        <div key={v.id} className="p-4 border border-neutral-200 rounded-2xl bg-neutral-50 hover:border-brand-gold transition-colors flex items-center justify-between">
                                                            <div>
                                                                <h4 className="font-bold text-sm text-brand-charcoal">{v.name}</h4>
                                                                <p className="text-xs text-neutral-500 mt-0.5">
                                                                    {v.phone && <span>Phone: {maskPhone(v.phone)} • </span>}
                                                                    {v.email && <span>Email: {maskEmail(v.email)} • </span>}
                                                                    {v.address && <span>{v.address}</span>}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleOpenVerification(v)}
                                                                className="px-4 py-2 bg-brand-gold text-brand-charcoal font-bold text-xs rounded-xl hover:bg-amber-400 transition-colors flex items-center gap-1.5"
                                                            >
                                                                <Lock size={12} /> Claim & Edit
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs rounded-2xl flex items-center justify-between">
                                                <span>No existing vendor found with &quot;{searchQuery}&quot;. You can register as a new vendor.</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
                                    <p className="text-xs text-neutral-400">Not found in system? Register your vendor profile directly.</p>
                                    <button
                                        onClick={() => {
                                            if (!vendorName && searchQuery) setVendorName(searchQuery);
                                            setStep('form');
                                        }}
                                        className="px-6 py-3.5 bg-brand-charcoal text-white font-bold text-sm rounded-xl hover:bg-black transition-colors flex items-center gap-2"
                                    >
                                        <Plus size={16} className="text-brand-gold" /> Continue to New Vendor Form
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECURITY VERIFICATION MODAL FOR EXISTING VENDORS */}
                    {verifyingVendor && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-6 relative">
                                <button
                                    onClick={() => setVerifyingVendor(null)}
                                    className="absolute right-4 top-4 text-neutral-400 hover:text-brand-charcoal p-1 rounded-full"
                                >
                                    <X size={20} />
                                </button>

                                <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
                                    <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base text-brand-charcoal">Verify Vendor Ownership</h3>
                                        <p className="text-xs text-neutral-500 truncate">{verifyingVendor.name}</p>
                                    </div>
                                </div>

                                <form onSubmit={handleVerifyOwnershipSubmit} className="space-y-4">
                                    {verifyError && (
                                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                                            {verifyError}
                                        </div>
                                    )}

                                    <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-600 leading-relaxed">
                                        To prevent unauthorized changes by third parties or competitors, please enter the registered <strong>Contact Phone Number</strong> or <strong>Official Email Address</strong> for <strong>{verifyingVendor.name}</strong>.
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                                            Registered Phone or Email *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={verifyInput}
                                            onChange={(e) => setVerifyInput(e.target.value)}
                                            placeholder="Enter phone e.g. 0771234567 or email"
                                            className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none font-mono"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setVerifyingVendor(null)}
                                            className="px-4 py-2.5 border border-neutral-200 text-neutral-600 font-bold text-xs rounded-xl hover:bg-neutral-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={verifyingCode}
                                            className="px-5 py-2.5 bg-brand-charcoal text-white font-bold text-xs rounded-xl hover:bg-black transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                        >
                                            {verifyingCode ? (
                                                <>
                                                    <Loader2 size={14} className="animate-spin text-brand-gold" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 size={14} className="text-brand-gold" />
                                                    Verify & Access Form
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Vendor Registration & Activity Mapping Form */}
                    {step === 'form' && (
                        <div className="bg-white rounded-3xl border border-neutral-200 shadow-md overflow-hidden animate-in fade-in duration-300">
                            <div className="bg-brand-charcoal p-6 text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Building2 className="text-brand-gold" size={24} />
                                    <div>
                                        <h2 className="text-xl font-serif font-bold">
                                            {selectedExistingVendor ? `Update ${selectedExistingVendor.name}` : "Register New Activity Vendor"}
                                        </h2>
                                        <p className="text-xs text-neutral-300">Fill business details and select activities offered.</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmitForm} className="p-8 space-y-8">
                                {submitError && (
                                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                                        {submitError}
                                    </div>
                                )}

                                {/* Vendor Business Details */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2 flex items-center gap-2">
                                        <Building2 size={16} className="text-brand-gold" /> Company & Contact Information
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Company / Vendor Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={vendorName}
                                                onChange={(e) => setVendorName(e.target.value)}
                                                placeholder="e.g. Ella ATV Adventure Park"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Contact Phone Number *</label>
                                            <input
                                                type="text"
                                                required
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="e.g. +94 57 222 3456"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Official Email Address</label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="e.g. info@ellaatvadventures.lk"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Address / Location</label>
                                            <input
                                                type="text"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                placeholder="e.g. Passara Road, Ella"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Business Description / Services Offered</label>
                                            <textarea
                                                rows={2}
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Describe your activity offerings, safety standards, and facilities..."
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Activity Selection & Rates */}
                                <div className="space-y-4 pt-4 border-t border-neutral-100">
                                    <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                                        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                                            <Compass size={16} className="text-brand-gold" /> Offered Activities & Contracted Rates
                                        </h3>
                                        <span className="text-xs font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-full">
                                            {selectedActivities.length} Selected
                                        </span>
                                    </div>

                                    {/* Search / Filter Activities */}
                                    <div className="relative">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                                        <input
                                            type="text"
                                            value={actSearchFilter}
                                            onChange={(e) => setActSearchFilter(e.target.value)}
                                            placeholder="Filter activities by name, category, or district..."
                                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-brand-gold outline-none"
                                        />
                                    </div>

                                    {/* Activities Checkbox List */}
                                    {loadingActivities ? (
                                        <div className="p-8 text-center text-xs text-neutral-500">
                                            <Loader2 size={20} className="animate-spin text-brand-gold mx-auto mb-2" />
                                            Loading available activities...
                                        </div>
                                    ) : (
                                        <div className="max-h-60 overflow-y-auto border border-neutral-200 rounded-2xl p-3 space-y-2 divide-y divide-neutral-100">
                                            {filteredAvailableActivities.length > 0 ? (
                                                filteredAvailableActivities.map(act => {
                                                    const isSelected = selectedActivities.some(a => a.activity_id === act.id);
                                                    return (
                                                        <div key={act.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                                                            <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => handleToggleActivity(act)}
                                                                    className="w-4 h-4 accent-brand-gold rounded"
                                                                />
                                                                <div>
                                                                    <span className="font-bold text-xs text-brand-charcoal block">{act.activity_name}</span>
                                                                    <span className="text-[11px] text-neutral-400 flex items-center gap-2">
                                                                        {act.category && <span>Category: {act.category}</span>}
                                                                        {act.district && <span className="flex items-center gap-0.5"><MapPin size={10} /> {act.district}</span>}
                                                                    </span>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <p className="p-4 text-center text-xs text-neutral-400">No activities found matching filter.</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Configured Price Input for Selected Activities */}
                                    {selectedActivities.length > 0 && (
                                        <div className="space-y-3 pt-3">
                                            <h4 className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                                                Set Contracted Vendor Price for Selected Activities ($ / USD per person)
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {selectedActivities.map(act => (
                                                    <div key={act.activity_id} className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl flex items-center justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-xs font-bold text-brand-charcoal truncate block">{act.activity_name}</span>
                                                        </div>
                                                        <div className="w-32 flex items-center gap-1">
                                                            <span className="text-xs font-bold text-neutral-500">$</span>
                                                            <input
                                                                type="number"
                                                                value={act.vendor_price}
                                                                onChange={(e) => handlePriceChange(act.activity_id, e.target.value)}
                                                                placeholder="Rate"
                                                                className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs font-bold focus:ring-2 focus:ring-brand-gold outline-none"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedActivities(prev => prev.filter(a => a.activity_id !== act.activity_id))}
                                                            className="text-neutral-400 hover:text-red-500 p-1"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Bank Account Details */}
                                <div className="space-y-4 pt-4 border-t border-neutral-100">
                                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2 flex items-center gap-2">
                                        <CreditCard size={16} className="text-brand-gold" /> Bank Account Details (For Monthly Settlements)
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Bank Name</label>
                                            <input
                                                type="text"
                                                value={bankName}
                                                onChange={(e) => setBankName(e.target.value)}
                                                placeholder="e.g. Hatton National Bank"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Branch Name</label>
                                            <input
                                                type="text"
                                                value={branchName}
                                                onChange={(e) => setBranchName(e.target.value)}
                                                placeholder="e.g. Ella Branch"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Account Name</label>
                                            <input
                                                type="text"
                                                value={accountName}
                                                onChange={(e) => setAccountName(e.target.value)}
                                                placeholder="e.g. Ella ATV Adventure Park (Pvt) Ltd"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Account Number</label>
                                            <input
                                                type="text"
                                                value={accountNumber}
                                                onChange={(e) => setAccountNumber(e.target.value)}
                                                placeholder="e.g. 00401029384"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm font-mono focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-neutral-100 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep('search')}
                                        className="px-6 py-4 border border-neutral-200 text-neutral-600 font-bold rounded-xl hover:bg-neutral-50 transition-all text-xs"
                                    >
                                        Back to Search
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-8 py-4 bg-brand-charcoal text-white font-bold rounded-xl hover:bg-black transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 text-sm"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin text-brand-gold" />
                                                Submitting Vendor Profile...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={18} className="text-brand-gold" />
                                                Save Activity Vendor
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* SUCCESS STEP */}
                    {step === 'success' && (
                        <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center shadow-md space-y-6 animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 size={40} />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-3xl font-serif font-bold text-brand-charcoal">
                                    Activity Vendor Registered!
                                </h2>
                                <p className="text-neutral-600 text-sm max-w-md mx-auto">
                                    Your vendor profile and offered activity mappings have been successfully recorded in Nilathra Partner Network.
                                </p>
                            </div>

                            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 max-w-md mx-auto text-xs text-neutral-500 font-mono">
                                Vendor Name: <span className="font-bold text-brand-charcoal">{vendorName}</span>
                                <br />
                                Activities Mapped: <span className="font-bold text-brand-gold">{selectedActivities.length}</span>
                            </div>

                            <div className="pt-4 flex justify-center gap-4">
                                <Link
                                    href="/partner-registration"
                                    className="px-6 py-3 bg-brand-charcoal text-white font-bold text-xs rounded-xl hover:bg-black transition-colors"
                                >
                                    Return to Partner Hub
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
