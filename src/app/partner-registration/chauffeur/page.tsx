"use client";

import React, { useState } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { onboardDriverAction } from "@/actions/partner-registration.actions";
import { validateSriLankanNIC, NICValidationResult } from "@/utils/nic-validation";
import { UserCheck, ShieldCheck, CheckCircle2, Loader2, ArrowLeft, CreditCard, Car, Award } from "lucide-react";

export default function ChauffeurOnboardingPage() {
    const [step, setStep] = useState<'verify' | 'form' | 'success'>('verify');

    // Gate inputs
    const [nic, setNic] = useState("");
    const [code, setCode] = useState("");
    const [nicValidationInfo, setNicValidationInfo] = useState<NICValidationResult | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState("");

    // Form inputs
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [licenseNumber, setLicenseNumber] = useState("");
    const [perDayRate, setPerDayRate] = useState<number | string>(15);
    const [licenseImageUrl, setLicenseImageUrl] = useState("");

    // Bank Details
    const [bankName, setBankName] = useState("");
    const [branchName, setBranchName] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [swiftCode, setSwiftCode] = useState("");

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
                setCode("NILATHRA-CHAUFFEUR-2026");
                setVerifyError("");
            }
        } else {
            setNicValidationInfo(null);
        }
    };

    // Step 1: Verify Code & NIC
    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        setVerifyError("");

        const validation = validateSriLankanNIC(nic);
        if (!validation.isValid) {
            setVerifyError(validation.error || "Invalid Sri Lankan National ID (NIC) Number.");
            return;
        }

        setVerifying(true);
        setTimeout(() => {
            setVerifying(false);
            setStep('form');
        }, 400);
    };

    // Step 2: Submit Form
    const handleSubmitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");

        if (!firstName.trim()) {
            setSubmitError("First Name is required.");
            return;
        }

        if (!phone.trim()) {
            setSubmitError("Phone Number is required.");
            return;
        }

        if (!licenseNumber.trim()) {
            setSubmitError("SLTDA Chauffeur / Driving License Number is required.");
            return;
        }

        setSubmitting(true);

        try {
            const dto = {
                first_name: firstName,
                last_name: lastName || undefined,
                phone,
                nic_number: nic,
                license_number: licenseNumber,
                per_day_rate: Number(perDayRate) || 15.00,
                license_image_url: licenseImageUrl || undefined,
                bank_name: bankName || undefined,
                branch_name: branchName || undefined,
                account_name: accountName || undefined,
                account_number: accountNumber || undefined,
                swift_code: swiftCode || undefined
            };

            const res = await onboardDriverAction(dto);
            if (res.success) {
                setStep('success');
            } else {
                setSubmitError(res.error || "Failed to submit Chauffeur registration.");
            }
        } catch (err: any) {
            setSubmitError(err.message || "An error occurred while saving profile.");
        } finally {
            setSubmitting(false);
        }
    };

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

                    {/* GATE STEP: Enter Code & NIC */}
                    {step === 'verify' && (
                        <div className="bg-white rounded-3xl border border-neutral-200 shadow-md overflow-hidden animate-in fade-in duration-300">
                            <div className="bg-brand-charcoal p-8 text-white flex items-center gap-4">
                                <div className="p-3 bg-brand-gold/20 rounded-2xl text-brand-gold">
                                    <Car size={32} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-serif font-bold">Chauffeur Registration Portal</h1>
                                    <p className="text-xs text-neutral-300 mt-1">Register as an SLTDA-approved Chauffeur Driver for Nilathra luxury tours.</p>
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
                                            placeholder="e.g. 852612573V or 198526125738"
                                            className={`w-full bg-neutral-50 border ${nicValidationInfo ? (nicValidationInfo.isValid ? 'border-green-500 ring-1 ring-green-500/20' : 'border-red-400') : 'border-neutral-300'} rounded-xl p-3.5 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none font-mono text-sm uppercase`}
                                        />
                                        <p className="text-[11px] text-neutral-400 mt-1">Enter your valid National ID number for identity verification.</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Award size={14} className="text-brand-gold" /> Onboarding Campaign Code *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            placeholder="e.g. NILATHRA-CHAUFFEUR-2026"
                                            className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3.5 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none font-mono text-sm uppercase tracking-wider"
                                        />
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
                                            Verify & Continue
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* FORM STEP: Registration Form */}
                    {step === 'form' && (
                        <div className="bg-white rounded-3xl border border-neutral-200 shadow-md overflow-hidden animate-in fade-in duration-300">
                            <div className="bg-brand-charcoal p-6 text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Car className="text-brand-gold" size={24} />
                                    <div>
                                        <h2 className="text-xl font-serif font-bold">New Chauffeur Registration</h2>
                                        <p className="text-xs text-neutral-300">
                                            NIC Number: <span className="font-mono text-brand-gold font-bold">{nic}</span>
                                        </p>
                                    </div>
                                </div>
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
                                                placeholder="e.g. Suneth"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Last Name</label>
                                            <input
                                                type="text"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                placeholder="e.g. Fernando"
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
                                                placeholder="e.g. +94 71 987 6543"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* SLTDA Accreditation & License Details */}
                                <div className="space-y-4 pt-4 border-t border-neutral-100">
                                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2 flex items-center gap-2">
                                        <Award size={16} className="text-brand-gold" /> Accreditation & License Details
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">SLTDA License / Driving License No *</label>
                                            <input
                                                type="text"
                                                required
                                                value={licenseNumber}
                                                onChange={(e) => setLicenseNumber(e.target.value)}
                                                placeholder="e.g. B-98127394 or SLTDA/CH-884"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm font-mono focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Per Day Allowance Rate ($ / USD)</label>
                                            <input
                                                type="number"
                                                value={perDayRate}
                                                onChange={(e) => setPerDayRate(e.target.value)}
                                                placeholder="15.00"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                            <p className="text-[11px] text-neutral-400 mt-1">Default contract daily allowance rate ($15.00 per day).</p>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Driving License Photo / Image Link (Optional)</label>
                                            <input
                                                type="url"
                                                value={licenseImageUrl}
                                                onChange={(e) => setLicenseImageUrl(e.target.value)}
                                                placeholder="e.g. https://drive.google.com/your-license-photo.jpg"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Bank Payment Details */}
                                <div className="space-y-4 pt-4 border-t border-neutral-100">
                                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-2 flex items-center gap-2">
                                        <CreditCard size={16} className="text-brand-gold" /> Bank Account Details (For Payouts)
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
                                                placeholder="e.g. Colombo Main Branch"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Account Name</label>
                                            <input
                                                type="text"
                                                value={accountName}
                                                onChange={(e) => setAccountName(e.target.value)}
                                                placeholder="e.g. S. Fernando"
                                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-neutral-700 mb-1">Account Number</label>
                                            <input
                                                type="text"
                                                value={accountNumber}
                                                onChange={(e) => setAccountNumber(e.target.value)}
                                                placeholder="e.g. 8001928374"
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
                                                Submitting Registration...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={18} className="text-brand-gold" />
                                                Save Chauffeur Profile
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
                                    Chauffeur Onboarding Submitted!
                                </h2>
                                <p className="text-neutral-600 text-sm max-w-md mx-auto">
                                    Your application has been received and set to Pending Approval. Our operations team will verify your SLTDA license details shortly.
                                </p>
                            </div>

                            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 max-w-md mx-auto text-xs text-neutral-500 font-mono">
                                NIC: <span className="font-bold text-brand-charcoal">{nic}</span>
                                <br />
                                License No: <span className="font-bold text-brand-gold">{licenseNumber}</span>
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
