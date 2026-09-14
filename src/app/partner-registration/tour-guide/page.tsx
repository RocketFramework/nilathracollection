"use client";

import React, { useState } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { verifyPartnerAccessAction, submitTourGuideOnboardingAction } from "@/actions/partner-onboarding.actions";
import { UserCheck, Lock, ShieldCheck, CheckCircle2, Loader2, ArrowLeft, Award, CreditCard, Edit3, Globe } from "lucide-react";

const AVAILABLE_LANGUAGES = ['English', 'German', 'French', 'Italian', 'Russian', 'Japanese', 'Chinese', 'Spanish', 'Tamil', 'Sinhala'];

export default function TourGuideOnboardingPage() {
    const [step, setStep] = useState<'verify' | 'form' | 'success'>('verify');
    
    // Gate inputs
    const [code, setCode] = useState("");
    const [nic, setNic] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState("");
    const [isExisting, setIsExisting] = useState(false);

    // Form inputs
    const [guideId, setGuideId] = useState<string | undefined>(undefined);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [sltdaRegNumber, setSltdaRegNumber] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [district, setDistrict] = useState("");
    const [languages, setLanguages] = useState<string[]>(['English']);
    const [germanProficiency, setGermanProficiency] = useState(false);
    const [frenchProficiency, setFrenchProficiency] = useState(false);
    const [experienceYears, setExperienceYears] = useState<number | string>(5);
    const [dailyRate, setDailyRate] = useState<number | string>(45);

    // Bank Details
    const [bankName, setBankName] = useState("");
    const [branchName, setBranchName] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [swiftCode, setSwiftCode] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    // Step 1: Verify Code & NIC
    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerifyError("");
        setVerifying(true);

        try {
            const res = await verifyPartnerAccessAction('guide', code, nic);
            if (res.success) {
                setIsExisting(!!res.isExisting);
                if (res.isExisting && res.data) {
                    // Populate existing guide data
                    const g = res.data;
                    setGuideId(g.id);
                    setFirstName(g.first_name || "");
                    setLastName(g.last_name || "");
                    setSltdaRegNumber(g.sltda_registration_number || g.license_id || "");
                    setPhone(g.phone || "");
                    setEmail(g.email || "");
                    setAddress(g.address || "");
                    setCity(g.city || "");
                    setDistrict(g.district || "");
                    setLanguages(g.languages || ['English']);
                    setGermanProficiency(g.german_proficiency ?? false);
                    setFrenchProficiency(g.french_proficiency ?? false);
                    setExperienceYears(g.experience_years ?? 5);
                    setDailyRate(g.daily_rate ?? g.per_day_rate ?? 45);

                    if (g.payment_details) {
                        setBankName(g.payment_details.bank_name || "");
                        setBranchName(g.payment_details.branch_name || "");
                        setAccountName(g.payment_details.account_name || "");
                        setAccountNumber(g.payment_details.account_number || "");
                        setSwiftCode(g.payment_details.swift_code || "");
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

    // Toggle language checkbox
    const toggleLanguage = (lang: string) => {
        setLanguages(prev => {
            if (prev.includes(lang)) {
                return prev.filter(l => l !== lang);
            } else {
                return [...prev, lang];
            }
        });
    };

    // Step 2: Submit Form
    const handleSubmitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");

        if (!sltdaRegNumber.trim()) {
            setSubmitError("SLTDA Registration Number is mandatory for Tourist Guides.");
            return;
        }

        setSubmitting(true);

        try {
            const dto = {
                id: guideId,
                first_name: firstName,
                last_name: lastName,
                nic_number: nic,
                sltda_registration_number: sltdaRegNumber,
                phone,
                email,
                address,
                city,
                district,
                languages,
                german_proficiency: germanProficiency,
                french_proficiency: frenchProficiency,
                experience_years: Number(experienceYears) || 0,
                daily_rate: Number(dailyRate) || 0,
                onboarding_code: code,
                bank_name: bankName,
                branch_name: branchName,
                account_name: accountName,
                account_number: accountNumber,
                swift_code: swiftCode
            };

            const res = await submitTourGuideOnboardingAction(dto);
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
                                    <UserCheck size={32} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-serif font-bold">Tour Guide Portal</h1>
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
                                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Lock size={14} className="text-brand-gold" /> Onboarding Campaign Code
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            placeholder="e.g. NILATHRA-GUIDE-2026"
                                            className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3.5 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none font-mono text-sm uppercase tracking-wider"
                                        />
                                        <p className="text-[11px] text-neutral-400 mt-1">Code provided in Nilathra&apos;s luxury guide campaign invitation.</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <ShieldCheck size={14} className="text-brand-gold" /> Sri Lankan National ID (NIC) Number
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={nic}
                                            onChange={(e) => setNic(e.target.value.toUpperCase())}
                                            placeholder="e.g. 198812345678 or 881234567V"
                                            className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3.5 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none font-mono text-sm uppercase"
                                        />
                                        <p className="text-[11px] text-neutral-400 mt-1">Your NIC identifies your profile. If you registered previously, this will load your existing record to edit.</p>
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
                                    <UserCheck className="text-brand-gold" size={24} />
                                    <div>
                                        <h2 className="text-xl font-serif font-bold">
                                            {isExisting ? "Edit Tour Guide Profile" : "New Tour Guide Registration"}
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

                                {/* Personal & Contact Details */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2 flex items-center gap-2">
                                        <UserCheck size={16} className="text-brand-gold" /> Personal & Contact Information
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">First Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                placeholder="e.g. Nimal"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Last Name</label>
                                            <input
                                                type="text"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                placeholder="e.g. Perera"
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
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Email Address</label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="e.g. nimal.guide@example.com"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">City / District</label>
                                            <input
                                                type="text"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                placeholder="e.g. Kandy / Colombo"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Residential Address</label>
                                            <textarea
                                                rows={2}
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                placeholder="e.g. 45 Peradeniya Road, Kandy"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Mandatory SLTDA Accreditation */}
                                <div className="space-y-4 pt-4 border-t border-neutral-100">
                                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2 flex items-center gap-2">
                                        <Award size={16} className="text-brand-gold" /> Mandatory SLTDA Accreditation
                                    </h3>

                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                                        <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
                                            SLTDA License / Registration Number *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={sltdaRegNumber}
                                            onChange={(e) => setSltdaRegNumber(e.target.value)}
                                            placeholder="e.g. SLTDA/N-GUIDE/2024/0982"
                                            className="w-full bg-white border border-amber-300 rounded-xl p-3 text-sm font-mono focus:ring-2 focus:ring-brand-gold outline-none"
                                        />
                                        <p className="text-[11px] text-amber-700 font-medium">
                                            * SLTDA Registration is mandatory for all Nilathra luxury tourist guides serving VIP clients.
                                        </p>
                                    </div>
                                </div>

                                {/* Languages & Specializations */}
                                <div className="space-y-4 pt-4 border-t border-neutral-100">
                                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2 flex items-center gap-2">
                                        <Globe size={16} className="text-brand-gold" /> Languages & Specializations
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2">
                                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={germanProficiency}
                                                    onChange={(e) => setGermanProficiency(e.target.checked)}
                                                    className="w-5 h-5 accent-brand-gold rounded"
                                                />
                                                <div>
                                                    <span className="font-bold text-sm text-brand-charcoal block">German Language Proficient</span>
                                                    <span className="text-xs text-neutral-500">Fluent in German guiding for European luxury travelers.</span>
                                                </div>
                                            </label>
                                        </div>

                                        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2">
                                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={frenchProficiency}
                                                    onChange={(e) => setFrenchProficiency(e.target.checked)}
                                                    className="w-5 h-5 accent-brand-gold rounded"
                                                />
                                                <div>
                                                    <span className="font-bold text-sm text-brand-charcoal block">French Language Proficient</span>
                                                    <span className="text-xs text-neutral-500">Fluent in French guiding for European luxury travelers.</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-neutral-700 mb-2">Languages Spoken</label>
                                        <div className="flex flex-wrap gap-3">
                                            {AVAILABLE_LANGUAGES.map(lang => (
                                                <label key={lang} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all select-none ${languages.includes(lang) ? 'bg-brand-gold/20 border-brand-gold text-brand-charcoal' : 'bg-neutral-50 border-neutral-200 text-neutral-600'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={languages.includes(lang)}
                                                        onChange={() => toggleLanguage(lang)}
                                                        className="hidden"
                                                    />
                                                    <span>{lang}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Guiding Experience (Years)</label>
                                            <input
                                                type="number"
                                                value={experienceYears}
                                                onChange={(e) => setExperienceYears(e.target.value)}
                                                placeholder="e.g. 8"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Preferred Per Day Rate ($ / LKR)</label>
                                            <input
                                                type="number"
                                                value={dailyRate}
                                                onChange={(e) => setDailyRate(e.target.value)}
                                                placeholder="e.g. 50"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                            <p className="text-[11px] text-neutral-400 mt-1">Nilathra offers pay rates above industry average for high-standard guides.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Bank Payment Details */}
                                <div className="space-y-4 pt-4 border-t border-neutral-100">
                                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2 flex items-center gap-2">
                                        <CreditCard size={16} className="text-brand-gold" /> Bank Account Details (For Direct Allowances)
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Bank Name</label>
                                            <input
                                                type="text"
                                                value={bankName}
                                                onChange={(e) => setBankName(e.target.value)}
                                                placeholder="e.g. Bank of Ceylon"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Branch Name</label>
                                            <input
                                                type="text"
                                                value={branchName}
                                                onChange={(e) => setBranchName(e.target.value)}
                                                placeholder="e.g. Kandy Super Grade Branch"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Account Name</label>
                                            <input
                                                type="text"
                                                value={accountName}
                                                onChange={(e) => setAccountName(e.target.value)}
                                                placeholder="e.g. K. A. Nimal Perera"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Account Number</label>
                                            <input
                                                type="text"
                                                value={accountNumber}
                                                onChange={(e) => setAccountNumber(e.target.value)}
                                                placeholder="e.g. 7001928374"
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
                                                Save Guide Registration
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
                                    Tour Guide Profile Saved Successfully!
                                </h2>
                                <p className="text-neutral-600 text-sm max-w-md mx-auto">
                                    Post validating your record, we will inform you a date to come and have a formal chat to get to know you better.
                                </p>
                            </div>

                            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 max-w-md mx-auto text-xs text-neutral-500 font-mono">
                                Registered NIC: <span className="font-bold text-brand-charcoal">{nic}</span>
                                <br />
                                SLTDA License: <span className="font-bold text-brand-gold">{sltdaRegNumber}</span>
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
