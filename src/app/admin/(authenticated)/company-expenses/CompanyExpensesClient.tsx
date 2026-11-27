'use client';

import React, { useMemo, useState } from 'react';
import {
    Plus,
    Search,
    Receipt,
    FileText,
    Upload,
    Trash2,
    Pencil,
    ExternalLink,
    X,
    CheckCircle2,
    AlertCircle,
    Download,
    Loader2,
    Paperclip,
    Building2,
} from 'lucide-react';
import { CompanyExpenseDTO } from '@/dtos/company-expense.dto';
import {
    COMPANY_EXPENSE_CATEGORIES,
    COMPANY_EXPENSE_PAYMENT_METHODS,
    CompanyExpenseCategory,
} from '@/types/types';
import {
    listCompanyExpensesAction,
    saveCompanyExpenseAction,
    deleteCompanyExpenseAction,
    uploadCompanyExpenseDocumentAction,
    getCompanyExpenseDocumentUrlAction,
} from '@/actions/company-expense.actions';

interface Props {
    initialExpenses: CompanyExpenseDTO[];
    initialError: string | null;
    isAdmin: boolean;
}

const CURRENCIES = ['LKR', 'USD', 'EUR', 'GBP', 'AED'] as const;

const emptyForm = (): CompanyExpenseDTO => ({
    category: 'Admin',
    description: '',
    vendor_or_payee: '',
    voucher_number: '',
    amount: 0,
    currency: 'LKR',
    exchange_rate: 1,
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'Bank Transfer',
    payment_reference: '',
    bill_voucher_url: null,
    bank_transfer_slip_url: null,
    signed_voucher_url: null,
    notes: '',
});

const CATEGORY_BADGE_COLORS: Record<string, string> = {
    'Admin': 'bg-slate-100 text-slate-700 border-slate-200',
    'Stationery': 'bg-sky-50 text-sky-700 border-sky-200',
    'Laptop & Equipment Rent': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Building Rent': 'bg-amber-50 text-amber-800 border-amber-200',
    'Marketing Expense': 'bg-pink-50 text-pink-700 border-pink-200',
    'Sales Expenses': 'bg-purple-50 text-purple-700 border-purple-200',
    'Entertainment': 'bg-rose-50 text-rose-700 border-rose-200',
    'Repair & Maintenance': 'bg-orange-50 text-orange-700 border-orange-200',
    'Official Travel': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'Meeting Room Cost': 'bg-teal-50 text-teal-700 border-teal-200',
    'Refreshment': 'bg-lime-50 text-lime-700 border-lime-200',
    'Office Welfare': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function lkrValue(e: CompanyExpenseDTO): number {
    const rate = e.currency === 'LKR' ? 1 : (Number(e.exchange_rate) > 0 ? Number(e.exchange_rate) : 1);
    return Number(e.amount || 0) * rate;
}

function fmtAmount(amount: number, currency = 'LKR'): string {
    return `${currency} ${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CompanyExpensesClient({ initialExpenses, initialError, isAdmin }: Props) {
    const [expenses, setExpenses] = useState<CompanyExpenseDTO[]>(initialExpenses);
    const [errorBanner, setErrorBanner] = useState<string | null>(initialError);
    const [successBanner, setSuccessBanner] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [monthFilter, setMonthFilter] = useState<string>('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState<CompanyExpenseDTO>(emptyForm());
    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [uploadingKind, setUploadingKind] = useState<'bill' | 'slip' | 'signed' | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [openingDocKey, setOpeningDocKey] = useState<string | null>(null);

    const refreshList = async () => {
        const res = await listCompanyExpensesAction();
        if (res.success) {
            setExpenses(res.expenses);
            setErrorBanner(null);
        } else {
            setErrorBanner(res.error || 'Failed to refresh company expenses.');
        }
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return expenses.filter((e) => {
            if (categoryFilter !== 'All' && e.category !== categoryFilter) return false;
            if (monthFilter && !e.expense_date.startsWith(monthFilter)) return false;
            if (q) {
                const hay = [
                    e.description,
                    e.vendor_or_payee,
                    e.voucher_number,
                    e.payment_reference,
                    e.category,
                    e.notes,
                    e.recorded_by_name,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [expenses, search, categoryFilter, monthFilter]);

    const summary = useMemo(() => {
        let totalLkr = 0;
        let withDocs = 0;
        const byCat = new Map<string, number>();

        for (const e of filtered) {
            const val = lkrValue(e);
            totalLkr += val;
            byCat.set(e.category, (byCat.get(e.category) || 0) + val);
            if (e.bill_voucher_url || e.bank_transfer_slip_url || e.signed_voucher_url) {
                withDocs += 1;
            }
        }

        let topCategory = '—';
        let topAmount = 0;
        byCat.forEach((amt, cat) => {
            if (amt > topAmount) {
                topAmount = amt;
                topCategory = cat;
            }
        });

        return { totalLkr, count: filtered.length, withDocs, topCategory, topAmount };
    }, [filtered]);

    const openCreateModal = () => {
        setForm(emptyForm());
        setModalError(null);
        setIsModalOpen(true);
    };

    const openEditModal = (exp: CompanyExpenseDTO) => {
        setForm({
            ...exp,
            vendor_or_payee: exp.vendor_or_payee || '',
            voucher_number: exp.voucher_number || '',
            payment_reference: exp.payment_reference || '',
            notes: exp.notes || '',
        });
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleFileUpload = async (kind: 'bill' | 'slip' | 'signed', file: File | null) => {
        if (!file) return;
        setUploadingKind(kind);
        setModalError(null);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('docKind', kind);
            const res = await uploadCompanyExpenseDocumentAction(fd);
            if (!res.success || !res.path) {
                setModalError(res.error || 'Document upload failed.');
                return;
            }
            setForm((prev) => ({
                ...prev,
                bill_voucher_url: kind === 'bill' ? res.path! : prev.bill_voucher_url,
                bank_transfer_slip_url: kind === 'slip' ? res.path! : prev.bank_transfer_slip_url,
                signed_voucher_url: kind === 'signed' ? res.path! : prev.signed_voucher_url,
            }));
        } catch (err: any) {
            setModalError(err?.message || 'Document upload failed.');
        } finally {
            setUploadingKind(null);
        }
    };

    const handleOpenDocument = async (path: string, key: string) => {
        setOpeningDocKey(key);
        try {
            const res = await getCompanyExpenseDocumentUrlAction(path);
            if (res.success && res.url) {
                window.open(res.url, '_blank', 'noopener,noreferrer');
            } else {
                alert(res.error || 'Could not open document.');
            }
        } finally {
            setOpeningDocKey(null);
        }
    };

    const handleSave = async (ev: React.FormEvent) => {
        ev.preventDefault();
        setModalError(null);
        if (!form.description.trim()) {
            setModalError('Please enter an expense description.');
            return;
        }
        if (Number(form.amount) <= 0) {
            setModalError('Please enter a valid expense amount greater than 0.');
            return;
        }

        setSaving(true);
        try {
            const res = await saveCompanyExpenseAction({
                ...form,
                amount: Number(form.amount),
                exchange_rate: form.currency === 'LKR' ? 1 : Number(form.exchange_rate || 1),
            });
            if (!res.success) {
                setModalError(res.error || 'Failed to save expense.');
                return;
            }
            setIsModalOpen(false);
            setSuccessBanner(form.id ? 'Company expense updated.' : 'Company expense recorded.');
            setTimeout(() => setSuccessBanner(null), 4000);
            await refreshList();
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (exp: CompanyExpenseDTO) => {
        if (!exp.id) return;
        if (!confirm(`Delete expense "${exp.description}" (${fmtAmount(exp.amount, exp.currency)})?`)) return;
        setDeletingId(exp.id);
        try {
            const res = await deleteCompanyExpenseAction(exp.id);
            if (!res.success) {
                setErrorBanner(res.error || 'Failed to delete expense.');
                return;
            }
            setExpenses((prev) => prev.filter((item) => item.id !== exp.id));
            setSuccessBanner('Expense deleted.');
            setTimeout(() => setSuccessBanner(null), 3000);
        } finally {
            setDeletingId(null);
        }
    };

    const handleExportCsv = () => {
        const headers = [
            'Date',
            'Category',
            'Voucher No',
            'Description',
            'Paid To / Vendor',
            'Payment Method',
            'Payment Reference',
            'Currency',
            'Amount',
            'Exchange Rate',
            'LKR Equivalent',
            'Bill/Voucher Attached',
            'Bank Slip Attached',
            'Signed Voucher Attached',
            'Recorded By',
            'Notes',
        ];
        const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const rows = filtered.map((e) => [
            e.expense_date,
            e.category,
            e.voucher_number || '',
            e.description,
            e.vendor_or_payee || '',
            e.payment_method,
            e.payment_reference || '',
            e.currency,
            e.amount,
            e.exchange_rate,
            lkrValue(e).toFixed(2),
            e.bill_voucher_url ? 'Yes' : 'No',
            e.bank_transfer_slip_url ? 'Yes' : 'No',
            e.signed_voucher_url ? 'Yes' : 'No',
            e.recorded_by_name || '',
            e.notes || '',
        ]);
        const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `company-expenses-${monthFilter || 'all'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-[#2B2B2B] text-[#D4AF37] shadow-sm">
                            <Building2 size={20} />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold font-playfair text-[#2B2B2B]">
                            Company Expenses
                        </h1>
                    </div>
                    <p className="text-sm text-[#6B7280] mt-1">
                        Record and audit general company operating expenses (excludes tour-specific costs &amp; staff salaries).
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        disabled={filtered.length === 0}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D1D5DB] bg-white text-sm font-medium text-[#374151] hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-xs"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2B2B2B] hover:bg-[#1F1F1F] text-[#D4AF37] text-sm font-semibold transition-colors shadow-sm"
                    >
                        <Plus size={17} />
                        Record Expense
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {errorBanner && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
                    <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
                    <div className="flex-1">{errorBanner}</div>
                    <button type="button" onClick={() => setErrorBanner(null)} className="text-red-500 hover:text-red-700">
                        <X size={16} />
                    </button>
                </div>
            )}
            {successBanner && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <span>{successBanner}</span>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Total Expenses (LKR Eq.)</p>
                    <p className="text-2xl font-bold text-[#2B2B2B] mt-1.5">{fmtAmount(summary.totalLkr, 'LKR')}</p>
                    <p className="text-xs text-[#6B7280] mt-1">{monthFilter ? `For ${monthFilter}` : 'All recorded periods'}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Expense Records</p>
                    <p className="text-2xl font-bold text-[#2B2B2B] mt-1.5">{summary.count}</p>
                    <p className="text-xs text-[#6B7280] mt-1">Matching current filters</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Top Category</p>
                    <p className="text-lg font-bold text-[#2B2B2B] mt-1.5 truncate" title={summary.topCategory}>{summary.topCategory}</p>
                    <p className="text-xs text-[#6B7280] mt-1">{summary.topAmount > 0 ? fmtAmount(summary.topAmount, 'LKR') : 'No data'}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Supporting Docs Attached</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1.5">
                        {summary.withDocs} <span className="text-sm font-normal text-[#6B7280]">/ {summary.count}</span>
                    </p>
                    <p className="text-xs text-[#6B7280] mt-1">Bills, slips, or signed vouchers</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search description, vendor/payee, voucher #, reference..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                >
                    <option value="All">All Categories</option>
                    {COMPANY_EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <input
                    type="month"
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                />
                {(search || categoryFilter !== 'All' || monthFilter) && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearch('');
                            setCategoryFilter('All');
                            setMonthFilter('');
                        }}
                        className="px-3 py-2 text-xs font-medium text-[#6B7280] hover:text-[#2B2B2B] underline"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E7EB] text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                                <th className="py-3.5 px-4">Date</th>
                                <th className="py-3.5 px-4">Category</th>
                                <th className="py-3.5 px-4">Description &amp; Payee</th>
                                <th className="py-3.5 px-4">Payment</th>
                                <th className="py-3.5 px-4 text-right">Amount</th>
                                <th className="py-3.5 px-4">Documents</th>
                                {isAdmin && <th className="py-3.5 px-4 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0EFEA] text-sm">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-[#6B7280]">
                                        <Receipt size={32} className="mx-auto text-gray-300 mb-2" />
                                        <p className="font-medium text-[#2B2B2B]">No company expenses recorded yet</p>
                                        <p className="text-xs mt-1">Click &ldquo;Record Expense&rdquo; to add an office or overhead expense with supporting bills and slips.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((exp) => {
                                    const badgeCls = CATEGORY_BADGE_COLORS[exp.category] || 'bg-stone-100 text-stone-700 border-stone-200';
                                    return (
                                        <tr key={exp.id} className="hover:bg-[#FAF8F5]/70 transition-colors align-top">
                                            <td className="py-3.5 px-4 whitespace-nowrap text-xs font-medium text-[#374151]">
                                                <div>{exp.expense_date}</div>
                                                {exp.voucher_number && (
                                                    <div className="text-[11px] text-[#6B7280] mt-0.5">#{exp.voucher_number}</div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${badgeCls}`}>
                                                    {exp.category}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 max-w-xs">
                                                <div className="font-medium text-[#2B2B2B]">{exp.description}</div>
                                                {exp.vendor_or_payee && (
                                                    <div className="text-xs text-[#6B7280] mt-0.5">Paid to: {exp.vendor_or_payee}</div>
                                                )}
                                                {exp.notes && (
                                                    <div className="text-[11px] text-[#6B7280] italic mt-0.5 line-clamp-2">{exp.notes}</div>
                                                )}
                                                {exp.recorded_by_name && (
                                                    <div className="text-[10px] text-gray-400 mt-1">Recorded by {exp.recorded_by_name}</div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#374151]">
                                                <div className="font-medium">{exp.payment_method}</div>
                                                {exp.payment_reference && (
                                                    <div className="text-[11px] text-[#6B7280] mt-0.5">Ref: {exp.payment_reference}</div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                                <div className="font-semibold text-[#2B2B2B]">{fmtAmount(exp.amount, exp.currency)}</div>
                                                {exp.currency !== 'LKR' && (
                                                    <div className="text-[11px] text-[#6B7280] mt-0.5">
                                                        ≈ {fmtAmount(lkrValue(exp), 'LKR')}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {exp.bill_voucher_url && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenDocument(exp.bill_voucher_url!, `${exp.id}-bill`)}
                                                            disabled={openingDocKey === `${exp.id}-bill`}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-[11px] font-medium transition-colors"
                                                        >
                                                            {openingDocKey === `${exp.id}-bill` ? <Loader2 size={11} className="animate-spin" /> : <FileText size={11} />}
                                                            Bill/Voucher
                                                        </button>
                                                    )}
                                                    {exp.bank_transfer_slip_url && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenDocument(exp.bank_transfer_slip_url!, `${exp.id}-slip`)}
                                                            disabled={openingDocKey === `${exp.id}-slip`}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-medium transition-colors"
                                                        >
                                                            {openingDocKey === `${exp.id}-slip` ? <Loader2 size={11} className="animate-spin" /> : <Paperclip size={11} />}
                                                            Bank Slip
                                                        </button>
                                                    )}
                                                    {exp.signed_voucher_url && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenDocument(exp.signed_voucher_url!, `${exp.id}-signed`)}
                                                            disabled={openingDocKey === `${exp.id}-signed`}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-[11px] font-medium transition-colors"
                                                        >
                                                            {openingDocKey === `${exp.id}-signed` ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                                                            Signed Voucher
                                                        </button>
                                                    )}
                                                    {!exp.bill_voucher_url && !exp.bank_transfer_slip_url && !exp.signed_voucher_url && (
                                                        <span className="text-[11px] text-gray-400">No docs</span>
                                                    )}
                                                </div>
                                            </td>
                                            {isAdmin && (
                                                <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                                    <div className="inline-flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(exp)}
                                                            title="Edit expense"
                                                            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#2B2B2B] hover:bg-gray-100 transition-colors"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(exp)}
                                                            disabled={deletingId === exp.id}
                                                            title="Delete expense"
                                                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                                                        >
                                                            {deletingId === exp.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-[#E5E7EB] my-8 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 bg-[#2B2B2B] text-white">
                            <div>
                                <h2 className="text-lg font-semibold font-playfair text-[#D4AF37]">
                                    {form.id ? 'Edit Company Expense' : 'Record Company Expense'}
                                </h2>
                                <p className="text-xs text-gray-300 mt-0.5">
                                    General company overheads only (non-tour, non-salary)
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            {modalError && (
                                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                                    <AlertCircle size={15} className="shrink-0" />
                                    <span>{modalError}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#374151] mb-1">Expense Category *</label>
                                    <select
                                        required
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value as CompanyExpenseCategory })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                                    >
                                        {COMPANY_EXPENSE_CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#374151] mb-1">Expense Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={form.expense_date}
                                        onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#374151] mb-1">Description *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Monthly office rent for Nawala HQ, Meta Ads campaign, Printer repair..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#374151] mb-1">Paid To / Vendor</label>
                                    <input
                                        type="text"
                                        placeholder="Vendor, landlord, or supplier name"
                                        value={form.vendor_or_payee || ''}
                                        onChange={(e) => setForm({ ...form, vendor_or_payee: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#374151] mb-1">Voucher / Bill Number</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., PV-2026-041 or INV-882"
                                        value={form.voucher_number || ''}
                                        onChange={(e) => setForm({ ...form, voucher_number: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#374151] mb-1">Currency *</label>
                                    <select
                                        value={form.currency}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                currency: e.target.value,
                                                exchange_rate: e.target.value === 'LKR' ? 1 : form.exchange_rate,
                                            })
                                        }
                                        className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                                    >
                                        {CURRENCIES.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#374151] mb-1">Amount *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={form.amount || ''}
                                        onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#374151] mb-1">
                                        {form.currency === 'LKR' ? 'Rate to LKR' : `1 ${form.currency} in LKR`}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        disabled={form.currency === 'LKR'}
                                        value={form.currency === 'LKR' ? 1 : form.exchange_rate}
                                        onChange={(e) => setForm({ ...form, exchange_rate: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-sm disabled:bg-gray-100 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#374151] mb-1">Payment Method *</label>
                                    <select
                                        value={form.payment_method}
                                        onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                                    >
                                        {COMPANY_EXPENSE_PAYMENT_METHODS.map((pm) => (
                                            <option key={pm} value={pm}>{pm}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#374151] mb-1">Payment / Bank Reference</label>
                                    <input
                                        type="text"
                                        placeholder="Bank txn ID, cheque no., card last 4"
                                        value={form.payment_reference || ''}
                                        onChange={(e) => setForm({ ...form, payment_reference: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                                    />
                                </div>
                            </div>

                            {/* Supporting Documents Section */}
                            <div className="pt-2">
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-2.5">
                                    Supporting Documents (PDF, JPG, PNG, WebP — max 10 MB)
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {(
                                        [
                                            {
                                                kind: 'bill' as const,
                                                label: 'Bill / Voucher',
                                                field: 'bill_voucher_url' as const,
                                                value: form.bill_voucher_url,
                                            },
                                            {
                                                kind: 'slip' as const,
                                                label: 'Bank Transfer Slip',
                                                field: 'bank_transfer_slip_url' as const,
                                                value: form.bank_transfer_slip_url,
                                            },
                                            {
                                                kind: 'signed' as const,
                                                label: 'Signed Voucher / Bill',
                                                field: 'signed_voucher_url' as const,
                                                value: form.signed_voucher_url,
                                            },
                                        ]
                                    ).map((slot) => (
                                        <div
                                            key={slot.kind}
                                            className="rounded-xl border border-dashed border-[#D1D5DB] bg-[#FAF8F5] p-3 flex flex-col justify-between gap-2"
                                        >
                                            <div className="text-xs font-semibold text-[#2B2B2B]">{slot.label}</div>
                                            {slot.value ? (
                                                <div className="flex items-center justify-between gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenDocument(slot.value!, `modal-${slot.kind}`)}
                                                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline truncate"
                                                    >
                                                        <ExternalLink size={12} />
                                                        View file
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setForm((prev) => ({ ...prev, [slot.field]: null }))}
                                                        className="text-[11px] text-red-600 hover:underline"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-[#6B7280]">Not uploaded</span>
                                            )}
                                            <label className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-[#D1D5DB] text-xs font-medium text-[#374151] hover:bg-gray-50 cursor-pointer transition-colors">
                                                {uploadingKind === slot.kind ? (
                                                    <>
                                                        <Loader2 size={13} className="animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload size={13} />
                                                        {slot.value ? 'Replace' : 'Upload PDF / Image'}
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="application/pdf,image/jpeg,image/png,image/webp"
                                                    className="hidden"
                                                    disabled={uploadingKind !== null}
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0] || null;
                                                        handleFileUpload(slot.kind, f);
                                                        e.target.value = '';
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#374151] mb-1">Notes</label>
                                <textarea
                                    rows={2}
                                    placeholder="Optional approval notes or additional context..."
                                    value={form.notes || ''}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-[#D1D5DB] text-sm font-medium text-[#374151] hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || uploadingKind !== null}
                                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2B2B2B] hover:bg-[#1F1F1F] text-[#D4AF37] text-sm font-semibold disabled:opacity-50"
                                >
                                    {saving && <Loader2 size={15} className="animate-spin" />}
                                    {form.id ? 'Update Expense' : 'Save Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
