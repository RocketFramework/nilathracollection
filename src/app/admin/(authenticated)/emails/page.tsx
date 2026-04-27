"use client";

import { useState } from "react";
import { Mail, Send, CheckCircle, AlertCircle, User, MessageSquare, Type } from "lucide-react";
import { sendCustomEmailAction } from "@/actions/admin.actions";

export default function SendEmailPage() {
    const [to, setTo] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        setMessage(null);

        try {
            const res = await sendCustomEmailAction(to, subject, body);
            if (res.success) {
                setMessage({ type: 'success', text: "Email sent successfully!" });
                setTo("");
                setSubject("");
                setBody("");
            } else {
                setMessage({ type: 'error', text: res.error || "Failed to send email." });
            }
        } catch (error) {
            setMessage({ type: 'error', text: "An unexpected error occurred." });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-10 animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-playfair text-brand-charcoal mb-2">Concierge Communication</h1>
                <p className="text-neutral-500">Send direct, branded emails to clients and partners using the Nilathra Collection mail system.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
                <div className="bg-brand-charcoal p-6 text-white flex items-center gap-3">
                    <Mail className="text-brand-gold" size={24} />
                    <h2 className="text-xl font-medium font-playfair tracking-wide">Compose New Message</h2>
                </div>

                <div className="p-8">
                    {message && (
                        <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
                            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            <p className="font-medium">{message.text}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                                    <User size={14} className="text-brand-gold" /> Recipient Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                    placeholder="client@example.com"
                                    className="w-full bg-neutral-50 border border-neutral-200 text-brand-charcoal rounded-xl p-3 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                                    <Type size={14} className="text-brand-gold" /> Subject Line
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Regarding your upcoming journey..."
                                    className="w-full bg-neutral-50 border border-neutral-200 text-brand-charcoal rounded-xl p-3 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                                <MessageSquare size={14} className="text-brand-gold" /> Message Body
                            </label>
                            <textarea
                                required
                                rows={10}
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Type your message here... (Support basic formatting like new lines)"
                                className="w-full bg-neutral-50 border border-neutral-200 text-brand-charcoal rounded-xl p-4 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="pt-4 border-t border-neutral-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSending}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold tracking-wide transition-all ${
                                    isSending 
                                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' 
                                    : 'bg-brand-charcoal text-white hover:bg-black shadow-lg hover:shadow-xl'
                                }`}
                            >
                                {isSending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Send Message
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="mt-8 p-6 bg-brand-gold/5 border border-brand-gold/10 rounded-2xl">
                <h3 className="text-brand-gold font-bold text-sm uppercase tracking-widest mb-3">Professional Standards</h3>
                <ul className="text-sm text-neutral-600 space-y-2 list-disc list-inside">
                    <li>Emails sent from this interface will use the official <strong>Nilathra Collection</strong> branded template.</li>
                    <li>The recipient will see the sender as your configured system email address.</li>
                    <li>Ensure all communication follows Nilathra's luxury brand voice and concierge guidelines.</li>
                </ul>
            </div>
        </div>
    );
}
