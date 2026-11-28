'use client';

import React, { useMemo, useState } from 'react';
import {
    Plus,
    Search,
    CircleDollarSign,
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
} from 'lucide-react';
import { CompanyPaymentReceiptDTO } from '@/dtos/company-payment-receipt.dto';
import {
    COMPANY_PAYMENT_RECEIVE_METHODS,
    CompanyPaymentReceiveCategory,
} from '@/types/types';
import {
    listCompanyPaymentReceiptsAction,
    saveCompanyPaymentReceiptAction,
    deleteCompanyPaymentReceiptAction,
    uploadCompanyPaymentReceiptDocumentAction,
    getCompanyPaymentReceiptDocumentUrlAction,
} from '@/actions/company-payment-receipt.actions';

interface Props {
    initialReceipts: CompanyPaymentReceiptDTO[];
    categories: string[];
    initialError: string | null;
    isAdmin: boolean;
}

const CURRENCIES = ['LKR', 'USD', 'EUR', 'GBP', 'AED'] as const;

const emptyForm = (defaultCategory: string): CompanyPaymentReceiptDTO => ({
    category: defaultCategory,
    description: '',
    received_from: '',
    receipt_number: '',
    tour_code: '',
    amount: 0,
    currency: 'LKR',
    exchange_rate: 1,
    received_date: new Date().toISOString().split('T')[0],
    payment_method: 'Bank Transfer',
    payment_reference: '',
    bank_account: '',
    bank_slip_url: null,
    receipt_voucher_url: null,
    signed_document_url: null,
    notes: '',
});

const CATEGORY_BADGE_COLORS: Record<string, string> = {
    'Tour Customer Payment': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Advance / Deposit': 'bg-teal-50 text-teal-700 border-teal-200',
    'Balance Settlement': 'bg-sky-50 text-sky-700 border-sky-200',
    'Partner / Agent Commission Received': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Supplier Refund / Rebate': 'bg-amber-50 text-amber-800 border-amber-200',
    'Capital / Shareholder Injection': 'bg-purple-50 text-purple-700 border-purple-200',
    'Bank Interest / FX Gain': 'bg-lime-50 text-lime-700 border-lime-200',
    'Miscellaneous Income': 'bg-slate-100 text-slate-700 border-slate-200',
};

function lkrValue(r: CompanyPaymentReceiptDTO): number {
    const rate = r.currency === 'LKR' ? 1 : (Number(r.exchange_rate) > 0 ? Number(r.exchange_rate) : 1);
    return Number(r.amount || 0) * rate;
}

function fmtAmount(amount: number, currency = 'LKR'): string {
    return `${currency} ${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PaymentReceiveClient({ initialReceipts, categories, initialError, isAdmin }: Props) {
    const defaultCategory = categories[0] || '';
    const [receipts, setReceipts] = useState<CompanyPaymentReceiptDTO[]>(initialReceipts);
    const [errorBanner, setErrorBanner] = useState<string | null>(initialError);
    const [successBanner, setSuccessBanner] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [monthFilter, setMonthFilter] = useState<string>('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState<CompanyPaymentReceiptDTO>(emptyForm(defaultCategory));
    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [uploadingKind, setUploadingKind] = useState<'slip' | 'receipt' | 'signed' | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [openingDocKey, setOpeningDocKey] = useState<string | null>(null);

    const refreshList = async () => {
        const res = await listCompanyPaymentReceiptsAction();
        if (res.success) {
            setReceipts(res.receipts);
            setErrorBanner(null);
        } else {
            setErrorBanner(res.error || 'Failed to refresh payment receipts.');
        }
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return receipts.filter((r) => {
            if (categoryFilter !== 'All' && r.category !== categoryFilter) return false;
            if (monthFilter && !r.received_date.startsWith(monthFilter)) return false;
            if (q) {
                const hay = [
                    r.description,
                    r.received_from,
                    r.receipt_number,
                    r.tour_code,
                    r.payment_reference,
                    r.bank_account,
                    r.category,
                    r.notes,
                    r.recorded_by_name,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [receipts, search, categoryFilter, monthFilter]);

    const summary = useMemo(() => {
        let totalLkr = 0;
        let withDocs = 0;
        const byCat = new Map<string, number>();

        for (const r of filtered) {
            const val = lkrValue(r);
            totalLkr += val;
            byCat.set(r.category, (byCat.get(r.category) || 0) + val);
            if (r.bank_slip_url || r.receipt_voucher_url || r.signed_document_url) {
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
        setForm(emptyForm(defaultCategory));
        setModalError(null);
        setIsModalOpen(true);
    };

    const openEditModal = (rec: CompanyPaymentReceiptDTO) => {
        setForm({
            ...rec,
            received_from: rec.received_from || '',
            receipt_number: rec.receipt_number || '',
            tour_code: rec.tour_code || '',
            payment_reference: rec.payment_reference || '',
            bank_account: rec.bank_account || '',
            notes: rec.notes || '',
        });
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleFileUpload = async (kind: 'slip' | 'receipt' | 'signed', file: File | null) => {
        if (!file) return;
        setUploadingKind(kind);
        setModalError(null);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('docKind', kind);
            const res = await uploadCompanyPaymentReceiptDocumentAction(fd);
            if (!res.success || !res.path) {
                setModalError(res.error || 'Document upload failed.');
                return;
            }
            setForm((prev) => ({
                ...prev,
                bank_slip_url: kind === 'slip' ? res.path! : prev.bank_slip_url,
                receipt_voucher_url: kind === 'receipt' ? res.path! : prev.receipt_voucher_url,
                signed_document_url: kind === 'signed' ? res.path! : prev.signed_document_url,
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
            const res = await getCompanyPaymentReceiptDocumentUrlAction(path);
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
            setModalError('Please enter a payment description.');
            return;
        }
        if (Number(form.amount) <= 0) {
            setModalError('Please enter a valid payment amount greater than 0.');
            return;
        }

        setSaving(true);
        try {
            const res = await saveCompanyPaymentReceiptAction({
                ...form,
                amount: Number(form.amount),
                exchange_rate: form.currency === 'LKR' ? 1 : Number(form.exchange_rate || 1),
            });
            if (!res.success) {
                setModalError(res.error || 'Failed to save payment receipt.');
                return;
            }
            setIsModalOpen(false);
            setSuccessBanner(form.id ? 'Payment receipt updated.' : 'Payment receipt recorded.');
            setTimeout(() => setSuccessBanner(null), 4000);
            await refreshList();
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (rec: CompanyPaymentReceiptDTO) => {
        if (!rec.id) return;
        if (!confirm(`Delete payment receipt "${rec.description}" (${fmtAmount(rec.amount, rec.currency)})?`)) return;
        setDeletingId(rec.id);
        try {
            const res = await deleteCompanyPaymentReceiptAction(rec.id);
            if (!res.success) {
                setErrorBanner(res.error || 'Failed to delete payment receipt.');
                return;
            }
            setReceipts((prev) => prev.filter((item) => item.id !== rec.id));
            setSuccessBanner('Payment receipt deleted.');
            setTimeout(() => setSuccessBanner(null), 3000);
        } finally {
            setDeletingId(null);
        }
    };

    const handleExportCsv = () => {
        const headers = [
            'Date',
            'Category',
            'Receipt No',
            'Tour Code',
            'Description',
            'Received From',
            'Payment Method',
            'Bank / Account',
            'Payment Reference',
            'Currency',
            'Amount',
            'Exchange Rate',
            'LKR Equivalent',
            'Bank Slip Attached',
            'Receipt Copy Attached',
            'Signed Doc Attached',
            'Recorded By',
            'Notes',
        ];
        const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const rows = filtered.map((r) => [
            r.received_date,
            r.category,
            r.receipt_number || '',
            r.tour_code || '',
            r.description,
            r.received_from || '',
            r.payment_method,
            r.bank_account || '',
            r.payment_reference || '',
            r.currency,
            r.amount,
            r.exchange_rate,
            lkrValue(r).toFixed(2),
            r.bank_slip_url ? 'Yes' : 'No',
            r.receipt_voucher_url ? 'Yes' : 'No',
            r.signed_document_url ? 'Yes' : 'No',
            r.recorded_by_name || '',
            r.notes || '',
        ]);
        const csv = [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment-receive-${monthFilter || 'all'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-900 text-[#D4AF37] shadow-sm">
                            <CircleDollarSign size={20} />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold font-playfair text-[#2B2B2B]">
                            Payment Receive
                        </h1>
                    </div>
                    <p className="text-sm text-[#6B7280] mt-1">
                        Record and audit all incoming company payments with bank transfer slips, receipts, and signed documents.
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
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-[#D4AF37] text-sm font-semibold transition-colors shadow-sm"
                    >
                        <Plus size={17} />
                        Record Payment
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
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Total Received (LKR Eq.)</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1.5">{fmtAmount(summary.totalLkr, 'LKR')}</p>
                    <p className="text-xs text-[#6B7280] mt-1">{monthFilter ? `For ${monthFilter}` : 'All recorded periods'}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Payment Records</p>
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
                    <p className="text-xs text-[#6B7280] mt-1">Bank slips, receipts, or signed docs</p>
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
                        placeholder="Search description, payer, receipt #, tour code, bank reference..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                >
                    <option value="All">All Categories</option>
                    {categories.map((cat) => (
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
                                <th className="py-3.5 px-4">Description &amp; Payer</th>
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
                                        <CircleDollarSign size={32} className="mx-auto text-gray-300 mb-2" />
                                        <p className="font-medium text-[#2B2B2B]">No payments recorded yet</p>
                                        <p className="text-xs mt-1">Click &ldquo;Record Payment&rdquo; to log an incoming payment with supporting slips and receipts.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((rec) => {
                                    const badgeCls = CATEGORY_BADGE_COLORS[rec.category] || 'bg-emerald-50 text-emerald-800 border-emerald-200';
                                    return (
                                        <tr key={rec.id} className="hover:bg-[#FAF8F5]/70 transition-colors align-top">
                                            <td className="py-3.5 px-4 whitespace-nowrap text-xs font-medium text-[#374151]">
                                                <div>{rec.received_date}</div>
                                                {rec.receipt_number && (
                                                    <div className="text-[11px] text-[#6B7280] mt-0.5">#{rec.receipt_number}</div>
                                                )}
                                                {rec.tour_code && (
                                                    <div className="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold">
                                                        {rec.tour_code}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${badgeCls}`}>
                                                    {rec.category}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 max-w-xs">
                                                <div className="font-medium text-[#2B2B2B]">{rec.description}</div>
                                                {rec.received_from && (
                                                    <div className="text-xs text-[#6B7280] mt-0.5">From: {rec.received_from}</div>
                                                )}
                                                {rec.notes && (
                                                    <div className="text-[11px] text-[#6B7280] italic mt-0.5 line-clamp-2">{rec.notes}</div>
                                                )}
                                                {rec.recorded_by_name && (
                                                    <div className="text-[10px] text-gray-400 mt-1">Recorded by {rec.recorded_by_name}</div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#374151]">
                                                <div className="font-medium">{rec.payment_method}</div>
                                                {rec.bank_account && (
                                                    <div className="text-[11px] text-[#374151] mt-0.5">{rec.bank_account}</div>
                                                )}
                                                {rec.payment_reference && (
                                                    <div className="text-[11px] text-[#6B7280] mt-0.5">Ref: {rec.payment_reference}</div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                                <div className="font-semibold text-emerald-700">{fmtAmount(rec.amount, rec.currency)}</div>
                                                {rec.currency !== 'LKR' && (
                                                    <div className="text-[11px] text-[#6B7280] mt-0.5">
                                                        ≈ {fmtAmount(lkrValue(rec), 'LKR')}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {rec.bank_slip_url && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenDocument(rec.bank_slip_url!, `${rec.id}-slip`)}
                                                            disabled={openingDocKey === `${rec.id}-slip`}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-medium transition-colors"
                                                        >
                                                            {openingDocKey === `${rec.id}-slip` ? <Loader2 size={11} className="animate-spin" /> : <Paperclip size={11} />}
                                                            Bank Slip
                                                        </button>
                                                    )}
                                                    {rec.receipt_voucher_url && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenDocument(rec.receipt_voucher_url!, `${rec.id}-receipt`)}
                                                            disabled={openingDocKey === `${rec.id}-receipt`}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-[11px] font-medium transition-colors"
                                                        >
                                                            {openingDocKey === `${rec.id}-receipt` ? <Loader2 size={11} className="animate-spin" /> : <FileText size={11} />}
                                                            Receipt / Invoice
                                                        </button>
                                                    )}
                                                    {rec.signed_document_url && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenDocument(rec.signed_document_url!, `${rec.id}-signed`)}
                                                            disabled={openingDocKey === `${rec.id}-signed`}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-[11px] font-medium transition-colors"
                                                        >
                                                            {openingDocKey === `${rec.id}-signed` ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                                                            Signed Doc
                                                        </button>
                                                    )}
                                                    {!rec.bank_slip_url && !rec.receipt_voucher_url && !rec.signed_document_url && (
                                                        <span className="text-[11px] text-gray-400">No docs</span>
                                                    )}
                                                </div>
                                            </td>
                                            {isAdmin && (
                                                <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                                    <div className="inline-flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(rec)}
                                                            title="Edit payment receipt"
                                                            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#2B2B2B] hover:bg-gray-100 transition-colors"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(rec)}
                                                            disabled={deletingId === rec.id}
                                                            title="Delete payment receipt"
                                                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                                                        >
                                                            {deletingId === rec.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
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
                        <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white">
                            <div>
                                <h2 className="text-lg font-semibold font-playfair text-[#D4AF37]">
                                    {form.id ? 'Edit Payment Receipt' : 'Record Payment Received'}
                                </h2>
                                <p className="text-xs text-emerald-100/80 mt-0.5">
                                    Log incoming funds with bank slips, receipts, and signed confirmations
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
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
                                    <label className="block text-xs font-semibold text-[#374151] mb-1">Payment Category *</label>
                                    <select
                                        required
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value as CompanyPaymentReceiveCategory })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                                    >
                                        {form.category && !categories.includes(form.category) && (
                                            <option value={form.category}>{form.category}</option>
                                        )}
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#374151] mb-1">Received Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={form.received_date}
                                        onChange={(e) => setForm({ ...form, received_date: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#374151] mb-1">Description *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., 50% advance deposit for Tour NC-2026-042, Partner commission settlement..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#374151] mb-1">Received From (Payer)</label>
                                    <input
                                        type="text"
                                        placeholder="Client, partner, or bank name"
                                        value={form.received_from || ''}
                                        onChange={(e) => setForm({ ...form, received_from: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#374151] mb-1">Receipt / Invoice No.</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., REC-2026-019"
                                        value={form.receipt_number || ''}
                                        onChange={(e) => setForm({ ...form, receipt_number: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#374151] mb-1">Tour Code (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., NC-2026-042"
                                        value={form.tour_code || ''}
                                        onChange={(e) => setForm({ ...form, tour_code: e.target.value })}
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
                                    <label className="block text-xs font-semibold text-[#374151] mb-1">Amount Received *</label>
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

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#374151] mb-1">Payment Method *</label>
                                    <select
                                        value={form.payment_method}
                                        onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                                    >
                                        {COMPANY_PAYMENT_RECEIVE_METHODS.map((pm) => (
                                            <option key={pm} value={pm}>{pm}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#374151] mb-1">Deposited To (Bank / Account)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., HNB USD, HNB LKR, Cash"
                                        value={form.bank_account || ''}
                                        onChange={(e) => setForm({ ...form, bank_account: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#374151] mb-1">Bank / Txn Reference</label>
                                    <input
                                        type="text"
                                        placeholder="SWIFT / bank txn / cheque no."
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
                                                kind: 'slip' as const,
                                                label: 'Bank Transfer Slip',
                                                field: 'bank_slip_url' as const,
                                                value: form.bank_slip_url,
                                            },
                                            {
                                                kind: 'receipt' as const,
                                                label: 'Receipt / Invoice Copy',
                                                field: 'receipt_voucher_url' as const,
                                                value: form.receipt_voucher_url,
                                            },
                                            {
                                                kind: 'signed' as const,
                                                label: 'Signed Confirmation / Doc',
                                                field: 'signed_document_url' as const,
                                                value: form.signed_document_url,
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
                                    placeholder="Optional bank reconciliation or verification notes..."
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
                                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-[#D4AF37] text-sm font-semibold disabled:opacity-50"
                                >
                                    {saving && <Loader2 size={15} className="animate-spin" />}
                                    {form.id ? 'Update Payment' : 'Save Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
