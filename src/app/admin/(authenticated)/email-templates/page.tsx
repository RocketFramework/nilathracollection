"use client";

import { useState, useEffect, useRef } from "react";
import { LayoutTemplate, Plus, Edit2, Trash2, CheckCircle, AlertCircle, RefreshCw, Code } from "lucide-react";
import { getEmailTemplatesAction, saveEmailTemplateAction, deleteEmailTemplateAction } from "@/actions/admin.actions";
import { EmailTemplate } from "@/services/email-template.service";

export default function EmailTemplatesPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showHtml, setShowHtml] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState<Partial<EmailTemplate>>({
        name: "",
        type: "CUSTOM",
        subject: "",
        body_html: "",
        from_email: "",
        variables: []
    });

    const fetchTemplates = async () => {
        setLoading(true);
        const res = await getEmailTemplatesAction();
        if (res.success && res.templates) {
            setTemplates(res.templates);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleOpenModal = (template?: EmailTemplate) => {
        if (template) {
            setEditingTemplate(template);
            setFormData({
                ...template,
                // ensure variables is array
                variables: template.variables || []
            });
        } else {
            setEditingTemplate(null);
            setFormData({
                name: "",
                type: "CUSTOM",
                subject: "",
                body_html: "",
                from_email: "",
                variables: []
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTemplate(null);
        setMessage(null);
        setShowHtml(false);
    };

    useEffect(() => {
        if (isModalOpen && !showHtml && editorRef.current) {
            editorRef.current.innerHTML = formData.body_html || '';
        }
    }, [isModalOpen, showHtml]);

    const handleInput = () => {
        if (editorRef.current) {
            setFormData(prev => ({ ...prev, body_html: editorRef.current!.innerHTML }));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        try {
            const templateToSave = {
                ...formData,
                id: editingTemplate?.id
            } as EmailTemplate;

            const res = await saveEmailTemplateAction(templateToSave);
            if (res.success) {
                setMessage({ type: 'success', text: "Template saved successfully." });
                fetchTemplates();
                setTimeout(handleCloseModal, 1500);
            } else {
                setMessage({ type: 'error', text: res.error || "Failed to save template." });
            }
        } catch (error) {
            setMessage({ type: 'error', text: "An unexpected error occurred." });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this template?")) return;
        
        try {
            const res = await deleteEmailTemplateAction(id);
            if (res.success) {
                fetchTemplates();
            } else {
                alert(res.error || "Failed to delete template");
            }
        } catch (error) {
            alert("An error occurred");
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-playfair text-brand-charcoal mb-2">Email Templates</h1>
                    <p className="text-neutral-500">Manage templates for automated and custom email communications.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-brand-charcoal hover:bg-black text-white px-6 py-2.5 rounded-xl font-medium tracking-wide flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                >
                    <Plus size={18} /> New Template
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center items-center">
                        <RefreshCw className="animate-spin text-brand-gold" size={32} />
                    </div>
                ) : templates.length === 0 ? (
                    <div className="p-12 text-center">
                        <LayoutTemplate className="mx-auto text-neutral-300 mb-4" size={48} />
                        <h3 className="text-lg font-medium text-brand-charcoal">No templates found</h3>
                        <p className="text-neutral-500 mt-2">Create your first email template to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-100 text-xs uppercase tracking-wider text-neutral-500 font-bold">
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Subject</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {templates.map((template) => (
                                    <tr key={template.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-brand-charcoal">{template.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-brand-gold/10 text-brand-gold px-2.5 py-1 rounded-md text-xs font-bold tracking-wide">
                                                {template.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600 truncate max-w-xs">{template.subject}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button onClick={() => handleOpenModal(template)} className="text-blue-600 hover:text-blue-800 transition-colors" title="Edit">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(template.id!)} className="text-red-500 hover:text-red-700 transition-colors" title="Delete">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-neutral-100 px-6 py-4 flex justify-between items-center z-10">
                            <h2 className="text-xl font-playfair font-bold text-brand-charcoal">
                                {editingTemplate ? 'Edit Template' : 'Create Template'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-600">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            {message && (
                                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                                    message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                }`}>
                                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                    <p className="font-medium">{message.text}</p>
                                </div>
                            )}

                            <form onSubmit={handleSave} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-500 mb-1">Template Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                                            placeholder="e.g. Rate Request"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-500 mb-1">Template Type</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                                            placeholder="e.g. RATE_REQUEST"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-neutral-500 mb-1">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                                        placeholder="Use {{variables}} for dynamic content"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-neutral-500 mb-1">Default From Email (Optional)</label>
                                    <input
                                        type="email"
                                        value={formData.from_email || ""}
                                        onChange={e => setFormData({ ...formData, from_email: e.target.value })}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                                        placeholder="agent@nilathra.com"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-sm font-bold text-neutral-500">HTML Body</label>
                                        <button type="button" onClick={() => setShowHtml(!showHtml)} className="text-xs flex items-center gap-1 text-neutral-500 hover:text-brand-charcoal transition-colors">
                                            <Code size={14} /> {showHtml ? "View Formatted" : "View HTML Source"}
                                        </button>
                                    </div>
                                    
                                    {showHtml ? (
                                        <textarea
                                            required
                                            rows={8}
                                            value={formData.body_html}
                                            onChange={e => {
                                                setFormData({ ...formData, body_html: e.target.value });
                                                if (editorRef.current) {
                                                    editorRef.current.innerHTML = e.target.value;
                                                }
                                            }}
                                            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold font-mono text-sm"
                                            placeholder="Use HTML tags and {{variables}}"
                                        />
                                    ) : (
                                        <div
                                            ref={editorRef}
                                            contentEditable
                                            onInput={handleInput}
                                            onBlur={handleInput}
                                            className="w-full bg-neutral-50 border border-neutral-200 text-brand-charcoal rounded-lg p-3 focus:ring-1 focus:ring-brand-gold outline-none transition-all overflow-y-auto min-h-[200px] max-h-[400px] prose prose-sm max-w-none"
                                        />
                                    )}
                                    <p className="text-xs text-neutral-500 mt-2">
                                        Use <code>{'{{variableName}}'}</code> syntax to insert dynamic variables in the template.
                                    </p>
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button type="button" onClick={handleCloseModal} className="px-5 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg font-medium transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" className="bg-brand-gold hover:bg-brand-charcoal text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                        Save Template
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
