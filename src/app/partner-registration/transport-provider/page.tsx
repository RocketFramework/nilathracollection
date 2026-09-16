"use client";

import React, { useState } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { verifyPartnerAccessAction, submitTransportPartnerOnboardingAction } from "@/actions/partner-onboarding.actions";
import { validateSriLankanNIC, NICValidationResult } from "@/utils/nic-validation";
import { Car, Lock, ShieldCheck, CheckCircle2, Plus, Trash2, Loader2, ArrowLeft, Building, CreditCard, Edit3 } from "lucide-react";

export default function TransportProviderOnboardingPage() {
    const [step, setStep] = useState<'verify' | 'form' | 'success'>('verify');
    
    // Gate inputs
    const [nic, setNic] = useState("");
    const [code, setCode] = useState("");
    const [nicValidationInfo, setNicValidationInfo] = useState<NICValidationResult | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState("");
    const [isExisting, setIsExisting] = useState(false);

    // Form inputs
    const [providerId, setProviderId] = useState<string | undefined>(undefined);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [sltdaRegisteredDriver, setSltdaRegisteredDriver] = useState(true);

    // Bank Details
    const [bankName, setBankName] = useState("");
    const [branchName, setBranchName] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [swiftCode, setSwiftCode] = useState("");

    // Vehicles List
    const [vehicles, setVehicles] = useState<Array<{
        id?: string;
        vehicle_type: string;
        make: string;
        model: string;
        year_of_manufacture: number | string;
        vehicle_number: string;
        max_seat_capacity: number | string;
        km_rate: number | string;
        day_rate: number | string;
        max_km_per_day: number | string;
        additional_km_rate: number | string;
        with_driver: boolean;
    }>>([
        {
            vehicle_type: "",
            make: "",
            model: "",
            year_of_manufacture: "",
            vehicle_number: "",
            max_seat_capacity: "",
            km_rate: "",
            day_rate: "",
            max_km_per_day: "",
            additional_km_rate: "",
            with_driver: true
        }
    ]);

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    // Handle NIC Input & Auto Populate Campaign Code
    const handleNicChange = (val: string) => {
        const cleanVal = val.toUpperCase();
        setNic(cleanVal);

        if (cleanVal.trim()) {
            const validation = validateSriLankanNIC(cleanVal);
            setNicValidationInfo(validation);
            if (validation.isValid) {
                setCode("NILATHRA-TRANS-2026");
                setVerifyError("");
            }
        } else {
            setNicValidationInfo(null);
        }
    };

    // Step 1: Verify Code & NIC
    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerifyError("");

        const validation = validateSriLankanNIC(nic);
        if (!validation.isValid) {
            setVerifyError(validation.error || "Invalid Sri Lankan National ID (NIC) Number.");
            return;
        }

        setVerifying(true);

        try {
            const res = await verifyPartnerAccessAction('transport', code, nic);
            if (res.success) {
                setIsExisting(!!res.isExisting);
                if (res.isExisting && res.data) {
                    // Populate existing provider data
                    const p = res.data;
                    setProviderId(p.id);
                    setName(p.name || "");
                    setPhone(p.phone || "");
                    setEmail(p.email || "");
                    setAddress(p.address || "");
                    setContactPerson(p.contact_person || "");
                    setSltdaRegisteredDriver(p.sltda_registered_driver ?? true);

                    if (p.payment_details) {
                        setBankName(p.payment_details.bank_name || "");
                        setBranchName(p.payment_details.branch_name || "");
                        setAccountName(p.payment_details.account_name || "");
                        setAccountNumber(p.payment_details.account_number || "");
                        setSwiftCode(p.payment_details.swift_code || "");
                    }

                    if (p.transport_vehicles && p.transport_vehicles.length > 0) {
                        setVehicles(p.transport_vehicles.map((v: any) => ({
                            id: v.id,
                            vehicle_type: v.vehicle_type || "",
                            make: v.make || "",
                            model: v.model || v.make_and_model || "",
                            year_of_manufacture: v.year_of_manufacture || "",
                            vehicle_number: v.vehicle_number || "",
                            max_seat_capacity: v.max_seat_capacity || "",
                            km_rate: v.km_rate || "",
                            day_rate: v.day_rate || "",
                            max_km_per_day: v.max_km_per_day || "",
                            additional_km_rate: v.additional_km_rate || "",
                            with_driver: v.with_driver ?? true
                        })));
                    }
                }
                setStep('form');
            } else {
                setVerifyError(res.error || "Access verification failed.");
            }
        } catch (err: any) {
            setVerifyError(err.message || "An unexpected error occurred during verification.");
        } finally {
            setVerifying(false);
        }
    };

    // Add Vehicle row
    const addVehicle = () => {
        setVehicles(prev => [
            ...prev,
            {
                vehicle_type: "",
                make: "",
                model: "",
                year_of_manufacture: "",
                vehicle_number: "",
                max_seat_capacity: "",
                km_rate: "",
                day_rate: "",
                max_km_per_day: "",
                additional_km_rate: "",
                with_driver: true
            }
        ]);
    };

    // Remove Vehicle row
    const removeVehicle = (index: number) => {
        setVehicles(prev => prev.filter((_, i) => i !== index));
    };

    // Update Vehicle row
    const updateVehicle = (index: number, field: string, value: any) => {
        setVehicles(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    // Step 2: Submit Form
    const handleSubmitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");
        setSubmitting(true);

        try {
            const dto = {
                id: providerId,
                name,
                nic_number: nic,
                phone,
                email,
                address,
                contact_person: contactPerson,
                sltda_registered_driver: sltdaRegisteredDriver,
                onboarding_code: code,
                bank_name: bankName,
                branch_name: branchName,
                account_name: accountName,
                account_number: accountNumber,
                swift_code: swiftCode,
                vehicles: vehicles.map(v => ({
                    id: v.id,
                    vehicle_type: v.vehicle_type,
                    make: v.make,
                    model: v.model,
                    year_of_manufacture: v.year_of_manufacture ? Number(v.year_of_manufacture) : undefined,
                    vehicle_number: v.vehicle_number,
                    max_seat_capacity: v.max_seat_capacity ? Number(v.max_seat_capacity) : undefined,
                    km_rate: v.km_rate ? Number(v.km_rate) : undefined,
                    day_rate: v.day_rate ? Number(v.day_rate) : undefined,
                    max_km_per_day: v.max_km_per_day ? Number(v.max_km_per_day) : undefined,
                    additional_km_rate: v.additional_km_rate ? Number(v.additional_km_rate) : undefined,
                    with_driver: v.with_driver
                }))
            };

            const res = await submitTransportPartnerOnboardingAction(dto);
            if (res.success) {
                setStep('success');
            } else {
                setSubmitError(res.error || "Failed to submit registration.");
            }
        } catch (err: any) {
            setSubmitError(err.message || "An error occurred while saving profile.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <MainLayout>
            <div className="bg-[#FAF9F5] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {/* Top Back Nav */}
                    <div className="mb-6">
                        <Link href="/partner-registration" className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-brand-charcoal transition-colors">
                            <ArrowLeft size={16} /> Back to Partner Registration Portals
                        </Link>
                    </div>

                    {/* GATE STEP: Enter Code & NIC */}
                    {step === 'verify' && (
                        <div className="bg-white rounded-3xl border border-neutral-200 shadow-md overflow-hidden animate-in fade-in duration-300">
                            <div className="bg-brand-charcoal p-8 text-white flex items-center gap-4">
                                <div className="p-3 bg-brand-gold/20 rounded-2xl text-brand-gold">
                                    <Car size={32} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-serif font-bold">Transport Provider Portal</h1>
                                    <p className="text-xs text-neutral-300 mt-1">Please enter your Onboarding Campaign Code and National ID (NIC) to continue.</p>
                                </div>
                            </div>

                            <form onSubmit={handleVerify} className="p-8 space-y-6">
                                {verifyError && (
                                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium animate-in slide-in-from-top-2">
                                        {verifyError}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                                                <ShieldCheck size={14} className="text-brand-gold" /> Sri Lankan National ID (NIC) Number *
                                            </label>
                                            {nicValidationInfo && (
                                                <span className={`text-[11px] font-bold flex items-center gap-1 ${nicValidationInfo.isValid ? 'text-green-600' : 'text-red-500'}`}>
                                                    {nicValidationInfo.isValid ? (
                                                        <>
                                                            <CheckCircle2 size={12} />
                                                            Valid NIC ({nicValidationInfo.format === 'old' ? 'Old Format' : 'New Format'})
                                                        </>
                                                    ) : (
                                                        nicValidationInfo.error
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={nic}
                                            onChange={(e) => handleNicChange(e.target.value)}
                                            placeholder="e.g. 923612573V or 199226125738"
                                            className={`w-full bg-neutral-50 border ${nicValidationInfo ? (nicValidationInfo.isValid ? 'border-green-500 ring-1 ring-green-500/20' : 'border-red-400') : 'border-neutral-300'} rounded-xl p-3.5 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none font-mono text-sm uppercase`}
                                        />
                                        <p className="text-[11px] text-neutral-400 mt-1">Your NIC identifies your profile. If registered previously, this will load your existing record to edit.</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Lock size={14} className="text-brand-gold" /> Onboarding Campaign Code *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            placeholder="e.g. NILATHRA-TRANS-2026"
                                            className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3.5 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none font-mono text-sm uppercase tracking-wider"
                                        />
                                        <p className="text-[11px] text-neutral-400 mt-1">
                                            {nicValidationInfo?.isValid ? "Auto-populated upon valid NIC verification. You can modify if using a custom code." : "Auto-populated upon valid NIC entry, or enter your official invitation code."}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={verifying}
                                    className="w-full py-4 bg-brand-charcoal text-white font-bold rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                                >
                                    {verifying ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin text-brand-gold" />
                                            Verifying Credentials...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={18} className="text-brand-gold" />
                                            Verify & Access Portal
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* FORM STEP: Registration / Edit Form */}
                    {step === 'form' && (
                        <div className="bg-white rounded-3xl border border-neutral-200 shadow-md overflow-hidden animate-in fade-in duration-300">
                            <div className="bg-brand-charcoal p-6 text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Car className="text-brand-gold" size={24} />
                                    <div>
                                        <h2 className="text-xl font-serif font-bold">
                                            {isExisting ? "Edit Transport Provider Profile" : "New Transport Provider Onboarding"}
                                        </h2>
                                        <p className="text-xs text-neutral-300">
                                            NIC Number: <span className="font-mono text-brand-gold font-bold">{nic}</span>
                                        </p>
                                    </div>
                                </div>
                                {isExisting && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-300 text-xs font-bold rounded-full border border-green-400/30">
                                        <Edit3 size={12} /> Editing Existing Profile
                                    </span>
                                )}
                            </div>

                            <form onSubmit={handleSubmitForm} className="p-8 space-y-8">
                                {submitError && (
                                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                                        {submitError}
                                    </div>
                                )}

                                {/* Provider Business & Contact Details */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2 flex items-center gap-2">
                                        <Building size={16} className="text-brand-gold" /> Business & Contact Details
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Company / Business Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="e.g. Ceylon Elite Transfers (Pvt) Ltd"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Contact Person Name</label>
                                            <input
                                                type="text"
                                                value={contactPerson}
                                                onChange={(e) => setContactPerson(e.target.value)}
                                                placeholder="e.g. Kamal Perera"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">National ID (NIC) Number</label>
                                            <input
                                                type="text"
                                                disabled
                                                value={nic}
                                                className="w-full bg-neutral-100 border border-neutral-200 text-neutral-500 font-mono rounded-xl p-3 text-sm cursor-not-allowed"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Mobile / Phone Number *</label>
                                            <input
                                                type="text"
                                                required
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="e.g. +94 77 123 4567"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Email Address *</label>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="e.g. info@ceylontransfers.lk"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Business Address</label>
                                            <textarea
                                                rows={2}
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                placeholder="e.g. 12 Galle Road, Colombo 03"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* SLTDA Credentials */}
                                <div className="space-y-4 pt-4 border-t border-neutral-100">
                                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2 flex items-center gap-2">
                                        <ShieldCheck size={16} className="text-brand-gold" /> Compliance & Registration
                                    </h3>

                                    <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl">
                                        <label className="flex items-center gap-3 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={sltdaRegisteredDriver}
                                                onChange={(e) => setSltdaRegisteredDriver(e.target.checked)}
                                                className="w-5 h-5 accent-brand-gold rounded"
                                            />
                                            <div>
                                                <span className="font-bold text-sm text-brand-charcoal block">Driver SLTDA Registration *</span>
                                                <span className="text-xs text-neutral-500">I confirm driver(s) are registered with Sri Lanka Tourism Development Authority (SLTDA).</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Fleet Vehicles */}
                                <div className="space-y-4 pt-4 border-t border-neutral-100">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                                            <Car size={16} className="text-brand-gold" /> Fleet Vehicles Listing
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={addVehicle}
                                            className="flex items-center gap-1 text-xs font-bold text-brand-gold hover:text-yellow-600 transition-colors bg-brand-gold/10 px-3 py-1.5 rounded-lg border border-brand-gold/30"
                                        >
                                            <Plus size={14} /> Add Another Vehicle
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {vehicles.map((v, idx) => (
                                            <div key={idx} className="p-6 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-4 relative group shadow-sm">
                                                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                                                    <span className="text-sm font-bold text-brand-charcoal">
                                                        Vehicle #{idx + 1}
                                                    </span>
                                                    {vehicles.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeVehicle(idx)}
                                                            className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 transition-colors font-medium"
                                                        >
                                                            <Trash2 size={14} /> Remove Vehicle
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                    {/* Vehicle Type Dropdown with Optgroups */}
                                                    <div className="md:col-span-1">
                                                        <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">Vehicle Type *</label>
                                                        <select
                                                            className="w-full bg-white border border-neutral-300 rounded-xl p-3 outline-none text-brand-charcoal font-medium focus:ring-2 focus:ring-brand-gold"
                                                            value={v.vehicle_type}
                                                            onChange={e => updateVehicle(idx, 'vehicle_type', e.target.value)}
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

                                                    {/* Make Datalist */}
                                                    <div className="md:col-span-1">
                                                        <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">Make</label>
                                                        <input
                                                            type="text"
                                                            list={`make-list-${idx}`}
                                                            placeholder="e.g. Toyota"
                                                            className="w-full bg-white border border-neutral-300 rounded-xl p-3 outline-none text-brand-charcoal font-medium focus:ring-2 focus:ring-brand-gold"
                                                            value={v.make || ''}
                                                            onChange={e => updateVehicle(idx, 'make', e.target.value)}
                                                        />
                                                        <datalist id={`make-list-${idx}`}>
                                                            {['Toyota','Honda','Nissan','Mitsubishi','Suzuki','Isuzu','Hyundai','KIA','Mercedes-Benz','BMW','Audi','Volkswagen','Ford','Mazda','Tata','Volvo','Coaster','BYD','Renault','Peugeot'].map(m => (
                                                                <option key={m} value={m} />
                                                            ))}
                                                        </datalist>
                                                    </div>

                                                    {/* Model Datalist */}
                                                    <div className="md:col-span-1">
                                                        <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">Model</label>
                                                        <input
                                                            type="text"
                                                            list={`model-list-${idx}`}
                                                            placeholder="e.g. Hiace"
                                                            className="w-full bg-white border border-neutral-300 rounded-xl p-3 outline-none text-brand-charcoal font-medium focus:ring-2 focus:ring-brand-gold"
                                                            value={v.model || ''}
                                                            onChange={e => updateVehicle(idx, 'model', e.target.value)}
                                                        />
                                                        <datalist id={`model-list-${idx}`}>
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
                                                            })[v.make || ''] || [
                                                                'Land Cruiser','Hiace','Alphard','Sprinter','Carnival','Prado','H1','Coaster','Vellfire'
                                                            ]).map((m: string) => <option key={m} value={m} />)}
                                                        </datalist>
                                                    </div>

                                                    {/* Max Seat Capacity */}
                                                    <div className="md:col-span-1">
                                                        <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                                                            Max Seat Capacity <span className="font-normal normal-case text-neutral-400">(excl. driver)</span>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            placeholder="e.g. 7"
                                                            className="w-full bg-white border border-neutral-300 rounded-xl p-3 outline-none text-brand-charcoal font-medium focus:ring-2 focus:ring-brand-gold"
                                                            value={v.max_seat_capacity || ''}
                                                            onChange={e => updateVehicle(idx, 'max_seat_capacity', e.target.value)}
                                                        />
                                                    </div>

                                                    {/* Year of Manufacture */}
                                                    <div className="md:col-span-1">
                                                        <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">Year of Manufacture</label>
                                                        <input
                                                            type="number"
                                                            placeholder="e.g. 2022"
                                                            className="w-full bg-white border border-neutral-300 rounded-xl p-3 outline-none text-brand-charcoal font-medium focus:ring-2 focus:ring-brand-gold"
                                                            value={v.year_of_manufacture || ''}
                                                            onChange={e => updateVehicle(idx, 'year_of_manufacture', e.target.value)}
                                                        />
                                                    </div>

                                                    {/* Vehicle Number */}
                                                    <div className="md:col-span-1">
                                                        <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">Vehicle Number</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. WP CAA-1234"
                                                            className="w-full bg-white border border-neutral-300 rounded-xl p-3 outline-none text-brand-charcoal font-medium font-mono focus:ring-2 focus:ring-brand-gold"
                                                            value={v.vehicle_number || ''}
                                                            onChange={e => updateVehicle(idx, 'vehicle_number', e.target.value)}
                                                        />
                                                    </div>

                                                    {/* With Driver Checkbox */}
                                                    <div className="md:col-span-2 pt-2 border-t border-neutral-200 flex items-center">
                                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                                            <input
                                                                type="checkbox"
                                                                className="w-5 h-5 accent-brand-gold rounded border-neutral-300"
                                                                checked={v.with_driver !== false}
                                                                onChange={e => updateVehicle(idx, 'with_driver', e.target.checked)}
                                                            />
                                                            <span className="text-sm font-bold text-brand-charcoal">Include Driver</span>
                                                        </label>
                                                    </div>

                                                    {/* Rates */}
                                                    <div className="md:col-span-1">
                                                        <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">Flat KM Rate (USD)</label>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            placeholder="e.g. 0.50"
                                                            className="w-full bg-white border border-neutral-300 rounded-xl p-3 outline-none text-brand-charcoal font-medium focus:ring-2 focus:ring-brand-gold"
                                                            value={v.km_rate || ''}
                                                            onChange={e => updateVehicle(idx, 'km_rate', e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="md:col-span-1">
                                                        <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">Day Rate (USD)</label>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            placeholder="e.g. 50"
                                                            className="w-full bg-white border border-neutral-300 rounded-xl p-3 outline-none text-brand-charcoal font-medium focus:ring-2 focus:ring-brand-gold"
                                                            value={v.day_rate || ''}
                                                            onChange={e => updateVehicle(idx, 'day_rate', e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="md:col-span-1">
                                                        <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">Max KM per Day</label>
                                                        <input
                                                            type="number"
                                                            placeholder="e.g. 100"
                                                            className="w-full bg-white border border-neutral-300 rounded-xl p-3 outline-none text-brand-charcoal font-medium focus:ring-2 focus:ring-brand-gold"
                                                            value={v.max_km_per_day || ''}
                                                            onChange={e => updateVehicle(idx, 'max_km_per_day', e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="md:col-span-1">
                                                        <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">Additional KM Rate (USD)</label>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            placeholder="e.g. 0.60"
                                                            className="w-full bg-white border border-neutral-300 rounded-xl p-3 outline-none text-brand-charcoal font-medium focus:ring-2 focus:ring-brand-gold"
                                                            value={v.additional_km_rate || ''}
                                                            onChange={e => updateVehicle(idx, 'additional_km_rate', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Bank Payment Details */}
                                <div className="space-y-4 pt-4 border-t border-neutral-100">
                                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2 flex items-center gap-2">
                                        <CreditCard size={16} className="text-brand-gold" /> Bank Account Details (For Direct Settlements)
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Bank Name</label>
                                            <input
                                                type="text"
                                                value={bankName}
                                                onChange={(e) => setBankName(e.target.value)}
                                                placeholder="e.g. Commercial Bank of Ceylon"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Branch Name</label>
                                            <input
                                                type="text"
                                                value={branchName}
                                                onChange={(e) => setBranchName(e.target.value)}
                                                placeholder="e.g. Main Branch, Colombo 01"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Account Name</label>
                                            <input
                                                type="text"
                                                value={accountName}
                                                onChange={(e) => setAccountName(e.target.value)}
                                                placeholder="e.g. Ceylon Elite Transfers"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Account Number</label>
                                            <input
                                                type="text"
                                                value={accountNumber}
                                                onChange={(e) => setAccountNumber(e.target.value)}
                                                placeholder="e.g. 1000293848"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm font-mono focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-neutral-100 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-8 py-4 bg-brand-charcoal text-white font-bold rounded-xl hover:bg-black transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin text-brand-gold" />
                                                Saving Registration...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={18} className="text-brand-gold" />
                                                Save Provider Registration
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
                                    Registration Saved Successfully!
                                </h2>
                                <p className="text-neutral-600 text-sm max-w-md mx-auto">
                                    Since we service VIP tourists, post validating your record we will inform you a date for a formal inspection of your vehicle and update our records.
                                </p>
                            </div>

                            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 max-w-md mx-auto text-xs text-neutral-500 font-mono">
                                Registered NIC: <span className="font-bold text-brand-charcoal">{nic}</span>
                                <br />
                                <span className="text-[11px] font-sans text-neutral-400">You can edit your details anytime by returning to this portal with your NIC & Campaign Code.</span>
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
