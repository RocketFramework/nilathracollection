"use client";

import { useState, useEffect, useRef } from "react";
import { Mail, Send, CheckCircle, AlertCircle, User, MessageSquare, Type, Paperclip, LayoutTemplate, X, Code, List, Bold, Italic, Underline } from "lucide-react";
import { sendCustomEmailAction, getEmailTemplatesAction, getUserRoleAction } from "@/actions/admin.actions";
import { EmailTemplate } from "@/services/email-template.service";
import { createClient } from "@/utils/supabase/client";

export default function SendEmailPage() {
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const editorRef = useRef<HTMLDivElement>(null);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [attachments, setAttachments] = useState<File[]>([]);
    const [showHtml, setShowHtml] = useState(false);
    
    const [loginEmail, setLoginEmail] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        async function fetchTemplates() {
            const res = await getEmailTemplatesAction();
            if (res.success && res.templates) {
                setTemplates(res.templates);
            }
            setIsLoadingTemplates(false);
        }
        
        async function fetchUser() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.email) {
                setFrom(user.email);
                setLoginEmail(user.email);
            }
            
            const roleRes = await getUserRoleAction();
            if (roleRes.success && roleRes.role === 'admin') {
                setIsAdmin(true);
            }
        }
        
        fetchTemplates();
        fetchUser();
    }, []);

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const tId = e.target.value;
        setSelectedTemplateId(tId);
        if (tId) {
            const template = templates.find(t => t.id === tId);
            if (template) {
                setSubject(template.subject);
                setBody(template.body_html);
                setFrom(template.from_email || loginEmail);
                if (editorRef.current) {
                    editorRef.current.innerHTML = template.body_html;
                }
            }
        } else {
            setSubject("");
            setBody("");
            setFrom(loginEmail);
            if (editorRef.current) {
                editorRef.current.innerHTML = "";
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    useEffect(() => {
        if (!showHtml && editorRef.current) {
            editorRef.current.innerHTML = body;
        }
    }, [showHtml]);

    const handleInput = () => {
        if (editorRef.current) {
            setBody(editorRef.current.innerHTML);
        }
    };

    const handleFormatText = (command: string, value: string = '') => {
        if (showHtml) {
            const textarea = document.querySelector('textarea[name="body_html_source"]') as HTMLTextAreaElement | null;
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = body;
                const selected = text.substring(start, end) || "Sample Text";
                
                let openTag = `<${command}>`;
                let closeTag = `</${command}>`;

                if (command === 'fontSize') {
                    const sizePxMap: Record<string, string> = { '2': '13px', '3': '16px', '5': '24px', '7': '32px' };
                    const px = sizePxMap[value] || '16px';
                    openTag = `<span style="font-size: ${px};">`;
                    closeTag = `</span>`;
                }

                const replacement = openTag + selected + closeTag;
                const newText = text.substring(0, start) + replacement + text.substring(end);
                setBody(newText);
                setTimeout(() => {
                    textarea.focus();
                    textarea.setSelectionRange(start + openTag.length, start + openTag.length + selected.length);
                }, 0);
            }
        } else {
            if (editorRef.current) {
                editorRef.current.focus();
                document.execCommand(command, false, value || undefined);
                handleInput();
            }
        }
    };

    const handleInsertBullet = (e: React.MouseEvent) => {
        e.preventDefault();
        if (showHtml) {
            const textarea = document.querySelector('textarea[name="body_html_source"]') as HTMLTextAreaElement | null;
            const bulletSnippet = "<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>";
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = body;
                const before = text.substring(0, start);
                const after = text.substring(end);
                const newText = before + bulletSnippet + after;
                setBody(newText);
                setTimeout(() => {
                    textarea.focus();
                    textarea.setSelectionRange(start + bulletSnippet.length, start + bulletSnippet.length);
                }, 0);
            } else {
                setBody(prev => prev + (prev ? "\n" : "") + bulletSnippet);
            }
        } else {
            if (editorRef.current) {
                editorRef.current.focus();
                document.execCommand('insertUnorderedList', false);
                handleInput();
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!body.trim()) {
            setMessage({ type: 'error', text: "Message body cannot be empty." });
            return;
        }
        
        setIsSending(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append('from', from);
            formData.append('to', to);
            formData.append('subject', subject);
            formData.append('body', body);

            attachments.forEach(file => {
                formData.append('attachments', file);
            });

            const res = await sendCustomEmailAction(formData);
            if (res.success) {
                setMessage({ type: 'success', text: "Email sent successfully!" });
                setTo("");
                setSubject("");
                setBody("");
                setSelectedTemplateId("");
                setAttachments([]);
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
                        {/* Hidden honeypot fields to trap aggressive browser autofill */}
                        <div style={{ display: 'none' }} aria-hidden="true">
                            <input type="email" name="fake_email_for_autofill" autoComplete="email" />
                            <input type="text" name="fake_username_for_autofill" autoComplete="username" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                                <LayoutTemplate size={14} className="text-brand-gold" /> Use Template (Optional)
                            </label>
                            <select
                                value={selectedTemplateId}
                                onChange={handleTemplateChange}
                                disabled={isLoadingTemplates}
                                className="w-full bg-neutral-50 border border-neutral-200 text-brand-charcoal rounded-xl p-3 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all"
                            >
                                <option value="">-- Start from scratch --</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                                    <User size={14} className="text-brand-gold" /> Sender Email (From)
                                </label>
                                <input
                                    type="text"
                                    name="sender_address_field"
                                    autoComplete="new-password"
                                    required
                                    value={from}
                                    onChange={(e) => setFrom(e.target.value)}
                                    disabled={!isAdmin}
                                    placeholder="your-email@nilathra.com"
                                    className={`w-full bg-neutral-50 border border-neutral-200 text-brand-charcoal rounded-xl p-3 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                                    <User size={14} className="text-brand-gold" /> Recipient Email
                                </label>
                                <input
                                    type="text"
                                    name="recipient_address_field"
                                    autoComplete="new-password"
                                    required
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                    placeholder="client@example.com"
                                    className="w-full bg-neutral-50 border border-neutral-200 text-brand-charcoal rounded-xl p-3 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
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
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                                    <MessageSquare size={14} className="text-brand-gold" /> Message Body
                                </label>
                                <button type="button" onClick={() => setShowHtml(!showHtml)} className="text-xs flex items-center gap-1 text-neutral-500 hover:text-brand-charcoal transition-colors">
                                    <Code size={14} /> {showHtml ? "View Formatted" : "View HTML Source"}
                                </button>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-neutral-100 border border-neutral-200 rounded-t-xl border-b-0">
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleFormatText('bold')}
                                    className="flex items-center gap-1 p-1.5 px-2 text-xs font-semibold text-brand-charcoal bg-white border border-neutral-200 rounded-lg shadow-xs hover:bg-neutral-50 hover:border-brand-gold/50 active:scale-95 transition-all"
                                    title="Bold"
                                >
                                    <Bold size={15} className="text-brand-gold" />
                                    <span className="hidden sm:inline">Bold</span>
                                </button>

                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleFormatText('italic')}
                                    className="flex items-center gap-1 p-1.5 px-2 text-xs font-semibold text-brand-charcoal bg-white border border-neutral-200 rounded-lg shadow-xs hover:bg-neutral-50 hover:border-brand-gold/50 active:scale-95 transition-all"
                                    title="Italic"
                                >
                                    <Italic size={15} className="text-brand-gold" />
                                    <span className="hidden sm:inline">Italic</span>
                                </button>

                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleFormatText('underline')}
                                    className="flex items-center gap-1 p-1.5 px-2 text-xs font-semibold text-brand-charcoal bg-white border border-neutral-200 rounded-lg shadow-xs hover:bg-neutral-50 hover:border-brand-gold/50 active:scale-95 transition-all"
                                    title="Underline"
                                >
                                    <Underline size={15} className="text-brand-gold" />
                                    <span className="hidden sm:inline">Underline</span>
                                </button>

                                <div className="h-4 w-px bg-neutral-300 mx-1" />

                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={handleInsertBullet}
                                    className="flex items-center gap-1 p-1.5 px-2 text-xs font-semibold text-brand-charcoal bg-white border border-neutral-200 rounded-lg shadow-xs hover:bg-neutral-50 hover:border-brand-gold/50 active:scale-95 transition-all"
                                    title="Bullet List"
                                >
                                    <List size={15} className="text-brand-gold" />
                                    <span className="hidden sm:inline">Bullet List</span>
                                </button>

                                <div className="h-4 w-px bg-neutral-300 mx-1" />

                                <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-lg px-2 py-1 text-xs">
                                    <Type size={14} className="text-brand-gold" />
                                    <select
                                        defaultValue="3"
                                        onChange={(e) => handleFormatText('fontSize', e.target.value)}
                                        className="bg-transparent text-xs font-medium text-brand-charcoal outline-none cursor-pointer"
                                        title="Font Size"
                                    >
                                        <option value="2">Small</option>
                                        <option value="3">Normal</option>
                                        <option value="5">Large</option>
                                        <option value="7">Huge</option>
                                    </select>
                                </div>
                            </div>

                            {showHtml ? (
                                <textarea
                                    name="body_html_source"
                                    required
                                    rows={10}
                                    value={body}
                                    onChange={(e) => {
                                        setBody(e.target.value);
                                        if (editorRef.current) {
                                            editorRef.current.innerHTML = e.target.value;
                                        }
                                    }}
                                    placeholder="Type your HTML message here..."
                                    className="w-full bg-neutral-50 border border-neutral-200 text-brand-charcoal rounded-b-xl rounded-t-none p-4 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all resize-none font-mono text-sm"
                                />
                            ) : (
                                <div
                                    ref={editorRef}
                                    contentEditable
                                    onInput={handleInput}
                                    onBlur={handleInput}
                                    className="w-full bg-neutral-50 border border-neutral-200 text-brand-charcoal rounded-b-xl rounded-t-none p-4 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all overflow-y-auto min-h-[250px] prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-1"
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                                <Paperclip size={14} className="text-brand-gold" /> Attachments
                            </label>
                            <div className="flex flex-col gap-3">
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-gold/10 file:text-brand-gold hover:file:bg-brand-gold/20 transition-all cursor-pointer"
                                />
                                {attachments.length > 0 && (
                                    <ul className="space-y-2 mt-2">
                                        {attachments.map((file, idx) => (
                                            <li key={idx} className="flex items-center justify-between bg-neutral-50 p-2 px-4 rounded-lg border border-neutral-200 text-sm">
                                                <span className="truncate text-brand-charcoal">{file.name}</span>
                                                <button type="button" onClick={() => removeAttachment(idx)} className="text-red-500 hover:text-red-700 transition-colors">
                                                    <X size={16} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
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
        </div>
    );
}
