"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createAgentAction } from "@/actions/admin.actions";

export default function CreateAgentPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        const result = await createAgentAction(formData);

        if (result.error) {
            setError(result.error);
        } else if (result.success) {
            setSuccess(result.message || "Agent successfully created.");
            // Reset form
            const form = document.getElementById("create-agent-form") as HTMLFormElement;
            if (form) form.reset();
        }

        setIsLoading(false);
    }

    return (
        <div className="max-w-4xl mx-auto p-10 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-8">
                <Link href="/admin/user-management" className="text-sm text-neutral-500 hover:text-brand-charcoal transition-colors">
                    &larr; Back to Users
                </Link>
            </div>

            <div className="mb-8">
                <h1 className="text-3xl font-bold font-playfair text-[#2B2B2B] flex items-center gap-3">
                    <UserPlus className="text-brand-gold" size={32} />
                    Create New Agent
                </h1>
                <p className="text-[#6B7280] mt-2">Provision a new travel agent account. They will receive the password entered below to log in securely.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
                <form id="create-agent-form" action={handleSubmit} className="p-8 space-y-6">

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
                            <AlertCircle className="shrink-0 mt-0.5" size={20} />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-start gap-3">
                            <CheckCircle2 className="shrink-0 mt-0.5" size={20} />
                            <p className="text-sm font-medium">{success}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-brand-charcoal">First Name</label>
                            <input
                                required
                                type="text"
                                name="first_name"
                                placeholder="e.g. Jane"
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-brand-charcoal">Last Name</label>
                            <input
                                required
                                type="text"
                                name="last_name"
                                placeholder="e.g. Doe"
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-brand-charcoal">Email Address</label>
                            <input
                                required
                                type="email"
                                name="email"
                                placeholder="agent@nilathra.com"
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-brand-charcoal">Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="+1 (555) 000-0000"
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 border-t border-neutral-100 pt-6">
                        <label className="text-sm font-bold text-brand-charcoal">Temporary Password</label>
                        <p className="text-xs text-neutral-500 mb-2">Provide a robust password for their first login. They can change it later.</p>
                        <input
                            required
                            type="password"
                            name="password"
                            placeholder="Must be at least 6 characters"
                            className="w-full md:w-1/2 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all"
                        />
                    </div>

                    <div className="pt-6 border-t border-neutral-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-brand-charcoal text-white px-8 py-3 rounded-xl font-bold hover:bg-neutral-800 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Creating Agent...
                                </>
                            ) : (
                                "Create Agent Account"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
