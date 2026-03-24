"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/services/auth.service";
import { Mail, KeyRound, ArrowRight, Loader2, MapPin } from "lucide-react";

export default function TouristLogin() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loginMethod, setLoginMethod] = useState<"password" | "magic_link">("password");
    const [step, setStep] = useState<"form" | "sent">("form");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setIsLoading(true);
        setErrorMsg("");

        try {
            await AuthService.signInWithPassword(email, password);
            router.push("/tourist");
        } catch (error: any) {
            console.error("Login error:", error);
            setErrorMsg(error.message || "Invalid email or password.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        setErrorMsg("");

        const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/tourist` : undefined;

        try {
            await AuthService.registerTouristByEmail(email, redirectUrl);
            setStep("sent");
        } catch (error: any) {
            console.error("Login email error:", error);
            setErrorMsg(error.message || "Failed to send magic link. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-green/10 text-brand-green mb-4">
                        <MapPin size={32} />
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-brand-charcoal mb-2">Tourist Portal</h1>
                    <p className="text-neutral-500 text-sm">Access your finalized itinerary, chat with your specialist, and review your journey details.</p>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    {step === "form" ? (
                        <form onSubmit={loginMethod === "password" ? handlePasswordLogin : handleMagicLink} className="space-y-6 relative z-10">
                            <div>
                                <label className="block text-sm font-semibold text-brand-charcoal mb-2">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-neutral-400" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-colors bg-neutral-50"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            {loginMethod === "password" && (
                                <div>
                                    <label className="block text-sm font-semibold text-brand-charcoal mb-2">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <KeyRound className="h-5 w-5 text-neutral-400" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-colors bg-neutral-50"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            )}

                            {errorMsg && (
                                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{errorMsg}</p>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-green hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green transition-colors disabled:opacity-70"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (loginMethod === "password" ? "Sign In" : "Send Magic Link")}
                                {!isLoading && <ArrowRight className="w-4 h-4" />}
                            </button>

                            <div className="text-center mt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLoginMethod(prev => prev === "password" ? "magic_link" : "password");
                                        setErrorMsg("");
                                    }}
                                    className="text-sm font-medium text-neutral-500 hover:text-brand-green transition-colors"
                                >
                                    {loginMethod === "password"
                                        ? "Forgot password? Sign in with Magic Link"
                                        : "Have a password? Sign in here"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="text-center space-y-6 relative z-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-2">
                                <Mail className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-brand-charcoal">Check your email</h2>
                            <p className="text-neutral-500">
                                We've sent a magic link to <span className="font-semibold text-brand-charcoal">{email}</span>.
                                Click the link in the email to instantly sign in to your portal.
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    setStep("form");
                                    setErrorMsg("");
                                }}
                                className="mt-8 text-sm font-semibold text-brand-green hover:text-green-900 transition-colors"
                            >
                                Did not receive it? Try again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
