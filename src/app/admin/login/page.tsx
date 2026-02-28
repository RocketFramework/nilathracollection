'use client'

import { useActionState } from 'react';
import { loginAction } from '../../actions/auth';
import { Lock, Mail } from 'lucide-react';

export default function AdminLogin() {
    const [state, formAction, isPending] = useActionState(loginAction, null);

    return (
        <div className="min-h-screen bg-[#F5F3EF] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#E5E7EB] overflow-hidden">
                <div className="p-10 pb-8 text-center border-b border-[#E5E7EB]">
                    <h2 className="text-4xl font-bold tracking-wider uppercase font-playfair text-[#2B2B2B]">Nilathra</h2>
                    <p className="text-sm text-[#6B7280] uppercase tracking-widest mt-3">Admin Portal</p>
                </div>

                <div className="p-10">
                    <form action={formAction} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-[#4B5563] mb-2" htmlFor="email">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-[#9CA3AF]" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    required
                                    className="block w-full pl-12 pr-4 py-3.5 border border-[#D1D5DB] rounded-xl text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
                                    placeholder="admin@nilathra.com"
                                    disabled={isPending}
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-[#4B5563] mb-2" htmlFor="password">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-[#9CA3AF]" />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    id="password"
                                    required
                                    className="block w-full pl-12 pr-4 py-3.5 border border-[#D1D5DB] rounded-xl text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
                                    placeholder="••••••••"
                                    disabled={isPending}
                                />
                            </div>
                        </div>

                        {state?.error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 font-medium">
                                {state.error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-[#2B2B2B] text-white py-4 mt-6 rounded-xl font-medium tracking-wide hover:bg-[#1A1A1A] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4AF37] disabled:bg-[#6B7280] disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-md"
                        >
                            {isPending ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-10 text-center text-sm text-[#9CA3AF]">
                        <p>Protected area. Please log in with your credentials.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
