"use client";

import { useState, useEffect } from "react";
import { Inbox as InboxIcon, MailOpen, Mail, RefreshCw, Clock, ArrowLeft, MoreHorizontal, User } from "lucide-react";
import { getInboxEmailsAction, markEmailAsReadAction } from "@/actions/admin.actions";
import type { GmailMessage } from "@/services/gmail.service";

export default function InboxPage() {
    const [emails, setEmails] = useState<GmailMessage[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEmails = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getInboxEmailsAction();
            if (res.success && res.emails) {
                setEmails(res.emails);
            } else {
                setError(res.error || "Failed to load emails. Have you set up Google Cloud credentials?");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmails();
    }, []);

    const handleSelectEmail = async (email: GmailMessage) => {
        setSelectedEmail(email);
        
        // Mark as read locally
        if (email.isUnread) {
            setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isUnread: false } : e));
            // Mark as read on server
            await markEmailAsReadAction(email.id);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const extractNameAndEmail = (fromStr: string) => {
        const match = fromStr.match(/(.*?)<([^>]+)>/);
        if (match) {
            return { name: match[1].replace(/"/g, '').trim(), email: match[2].trim() };
        }
        return { name: fromStr, email: '' };
    };

    return (
        <div className="flex h-full animate-in fade-in duration-500 bg-white">
            {/* Left Sidebar - Email List */}
            <div className={`w-full md:w-1/3 lg:w-96 border-r border-neutral-200 flex flex-col h-full bg-[#FAFAFA] ${selectedEmail ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 border-b border-neutral-200 bg-white sticky top-0 z-10 shadow-sm flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold font-playfair text-brand-charcoal flex items-center gap-2">
                            <InboxIcon className="text-brand-gold" size={24} /> 
                            Inbox
                        </h1>
                        <p className="text-xs text-neutral-500 tracking-wider uppercase mt-1 font-semibold">Concierge Routing</p>
                    </div>
                    <button 
                        onClick={fetchEmails} 
                        disabled={loading}
                        className="p-2 text-neutral-400 hover:text-brand-gold bg-neutral-50 hover:bg-neutral-100 rounded-full transition-all"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-400 space-y-4">
                            <RefreshCw className="animate-spin text-brand-gold" size={32} />
                            <p className="text-sm font-medium tracking-wide">Syncing with Gmail...</p>
                        </div>
                    ) : error ? (
                        <div className="p-6 text-center">
                            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 shadow-sm">
                                <p className="font-bold mb-2">Connection Error</p>
                                <p>{error}</p>
                                <p className="mt-4 text-xs opacity-80">Make sure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN are in .env.local</p>
                            </div>
                        </div>
                    ) : emails.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-400 p-8 text-center">
                            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                <MailOpen size={28} className="text-neutral-300" />
                            </div>
                            <p className="text-lg font-medium text-brand-charcoal mb-1 font-playfair">All caught up!</p>
                            <p className="text-sm">Your inbox is currently empty.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-neutral-100">
                            {emails.map((email) => {
                                const { name } = extractNameAndEmail(email.from);
                                return (
                                    <li 
                                        key={email.id}
                                        onClick={() => handleSelectEmail(email)}
                                        className={`p-4 cursor-pointer transition-all hover:bg-neutral-50 ${selectedEmail?.id === email.id ? 'bg-brand-gold/5 border-l-4 border-l-brand-gold' : 'border-l-4 border-l-transparent'} ${email.isUnread ? 'bg-white' : 'opacity-80'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1 gap-2">
                                            <h3 className={`font-semibold truncate text-sm ${email.isUnread ? 'text-brand-charcoal' : 'text-neutral-600'}`}>
                                                {name}
                                            </h3>
                                            <span className="text-xs text-neutral-400 whitespace-nowrap flex-shrink-0 font-medium">{formatDate(email.date)}</span>
                                        </div>
                                        <h4 className={`text-sm mb-1 truncate ${email.isUnread ? 'font-bold text-brand-charcoal' : 'text-neutral-600'}`}>
                                            {email.subject}
                                        </h4>
                                        <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                                            {email.snippet}
                                        </p>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {/* Right Side - Email Content */}
            <div className={`flex-1 h-full flex flex-col bg-white ${!selectedEmail ? 'hidden md:flex' : 'flex'}`}>
                {selectedEmail ? (
                    <>
                        {/* Header */}
                        <div className="p-6 md:p-8 border-b border-neutral-100 flex flex-col shadow-sm z-10 bg-white">
                            <div className="flex items-center gap-4 mb-6 md:hidden">
                                <button 
                                    onClick={() => setSelectedEmail(null)}
                                    className="p-2 hover:bg-neutral-100 rounded-full text-neutral-500 transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <span className="font-medium text-neutral-500">Back to Inbox</span>
                            </div>
                            
                            <h2 className="text-2xl md:text-3xl font-playfair font-bold text-brand-charcoal mb-6 leading-tight">
                                {selectedEmail.subject}
                            </h2>
                            
                            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-brand-charcoal flex items-center justify-center text-brand-gold font-bold text-lg shadow-md shrink-0">
                                        {extractNameAndEmail(selectedEmail.from).name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-bold text-brand-charcoal text-base">
                                                {extractNameAndEmail(selectedEmail.from).name}
                                            </p>
                                            <span className="text-sm text-neutral-500 hidden sm:inline">&lt;{extractNameAndEmail(selectedEmail.from).email}&gt;</span>
                                        </div>
                                        <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1 font-medium">
                                            <User size={12} /> to {extractNameAndEmail(selectedEmail.to).email || 'me'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium ml-16 md:ml-0 bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-100">
                                    <Clock size={14} />
                                    {formatDate(selectedEmail.date)}
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#FAFAFA]">
                            <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-neutral-100 max-w-4xl mx-auto">
                                {selectedEmail.bodyHtml ? (
                                    <div 
                                        className="prose prose-neutral max-w-none prose-a:text-brand-gold prose-a:no-underline hover:prose-a:underline prose-headings:font-playfair prose-headings:text-brand-charcoal"
                                        dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }} 
                                    />
                                ) : (
                                    <div className="whitespace-pre-wrap font-sans text-neutral-700 leading-relaxed">
                                        {selectedEmail.bodyText || "No content available."}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-300 bg-[#FAFAFA]">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-neutral-100 mb-6">
                            <Mail size={40} className="text-neutral-200" />
                        </div>
                        <p className="text-xl font-medium text-neutral-400 font-playfair">Select an email to read</p>
                        <p className="text-sm mt-2 text-neutral-400 max-w-xs text-center leading-relaxed">Incoming routed messages will appear here securely from your Google Workspace.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
