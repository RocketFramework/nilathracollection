"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, User, Lock, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { AuthService } from "@/services/auth.service";

export default function TouristProfilePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [email, setEmail] = useState("");
    
    // Profile State
    const [profile, setProfile] = useState({
        first_name: "",
        last_name: "",
        phone: "",
        country: ""
    });

    // Password State
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                
                if (user) {
                    setEmail(user.email || "");
                    const { data, error } = await supabase
                        .from('tourist_profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();
                        
                    if (data) {
                        setProfile({
                            first_name: data.first_name || "",
                            last_name: data.last_name || "",
                            phone: data.phone || "",
                            country: data.country || ""
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to load profile:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setStatus(null);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase
                .from('tourist_profiles')
                .update({
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    phone: profile.phone,
                    country: profile.country,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;
            setStatus({ type: 'success', message: 'Profile updated successfully.' });
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Failed to update profile.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setStatus(null);

        if (password !== confirmPassword) {
            setStatus({ type: 'error', message: "Passwords do not match." });
            setIsSaving(false);
            return;
        }

        if (password.length < 6) {
            setStatus({ type: 'error', message: "Password must be at least 6 characters long." });
            setIsSaving(false);
            return;
        }

        try {
            await AuthService.setPassword(password);
            setStatus({ type: 'success', message: 'Password changed successfully.' });
            setPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Failed to change password.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4 text-sm font-medium text-neutral-500 mb-8">
                <Link href="/tourist" className="hover:text-brand-green flex items-center gap-1 transition-colors">
                    <ArrowLeft size={16} /> Dashboard
                </Link>
            </div>

            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center">
                    <User size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-serif text-brand-charcoal font-bold">Profile Management</h1>
                    <p className="text-neutral-500">{email}</p>
                </div>
            </div>

            {status && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <p className="font-medium text-sm">{status.message}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Details Form */}
                <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm">
                    <h2 className="text-xl font-serif font-bold text-brand-charcoal mb-6 flex items-center gap-2">
                        <User size={20} className="text-brand-gold" /> Personal Details
                    </h2>
                    
                    <form onSubmit={handleProfileUpdate} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">First Name</label>
                                <input 
                                    type="text" 
                                    value={profile.first_name}
                                    onChange={e => setProfile({...profile, first_name: e.target.value})}
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold focus:bg-white transition-all"
                                    placeholder="Enter first name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Last Name</label>
                                <input 
                                    type="text" 
                                    value={profile.last_name}
                                    onChange={e => setProfile({...profile, last_name: e.target.value})}
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold focus:bg-white transition-all"
                                    placeholder="Enter last name"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Phone Number</label>
                            <input 
                                type="tel" 
                                value={profile.phone}
                                onChange={e => setProfile({...profile, phone: e.target.value})}
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold focus:bg-white transition-all"
                                placeholder="+1 234 567 8900"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Country of Residence</label>
                            <input 
                                type="text" 
                                value={profile.country}
                                onChange={e => setProfile({...profile, country: e.target.value})}
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold focus:bg-white transition-all"
                                placeholder="e.g. United Kingdom"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="w-full flex justify-center items-center gap-2 bg-brand-charcoal text-white font-bold rounded-xl py-3 mt-4 hover:bg-neutral-800 transition-colors disabled:opacity-50"
                        >
                            <Save size={18} /> {isSaving ? "Saving..." : "Save Profile Details"}
                        </button>
                    </form>
                </div>

                {/* Password Form */}
                <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm h-fit">
                    <h2 className="text-xl font-serif font-bold text-brand-charcoal mb-6 flex items-center gap-2">
                        <Lock size={20} className="text-brand-gold" /> Security Settings
                    </h2>
                    
                    <form onSubmit={handlePasswordUpdate} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">New Password</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold focus:bg-white transition-all"
                                placeholder="Enter new password"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold focus:bg-white transition-all"
                                placeholder="Re-enter new password"
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSaving || !password}
                            className="w-full flex justify-center items-center gap-2 bg-brand-green text-white font-bold rounded-xl py-3 mt-4 hover:bg-brand-green/90 transition-colors disabled:opacity-50"
                        >
                            <Lock size={18} /> {isSaving ? "Updating..." : "Update Password"}
                        </button>
                        <p className="text-xs text-neutral-400 text-center mt-4">You will be required to use this new password next time you log in.</p>
                    </form>
                </div>
            </div>
        </div>
    );
}
