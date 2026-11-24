'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, Mail, X, XCircle } from 'lucide-react';
import {
    logRfpEmailAction,
    sendPurchaseOrderCancellationEmailAction,
} from '@/actions/admin.actions';

export interface CancelHotelPoModalProps {
    isOpen: boolean;
    onClose: () => void;
    tourId: string;
    tourCode?: string;
    blockId: string;
    hotel: any;
    stays: any[];
    candidatePos: any[];
    initialPoId?: string;
    touristName?: string;
    agentName?: string;
    onCancelled: () => void;
}

const PRESET_REASONS = [
    'Itinerary / Date Change',
    'Guest Changed Hotel',
    'Tour Cancelled',
    'Revised / Duplicate Purchase Order',
];

function computeStayRange(stays: any[]): { checkIn: string; checkOut: string; nights: number } {
    const dates = (stays || [])
        .map((s: any) => s?.activity_date || s?.tour_itineraries?.date)
        .filter(Boolean)
        .map((d: string) => String(d).slice(0, 10))
        .sort();

    if (dates.length === 0) {
        return { checkIn: 'N/A', checkOut: 'N/A', nights: (stays || []).length };
    }
    const checkIn = dates[0];
    const last = new Date(`${dates[dates.length - 1]}T00:00:00Z`);
    last.setUTCDate(last.getUTCDate() + 1);
    const checkOut = last.toISOString().slice(0, 10);
    return { checkIn, checkOut, nights: new Set(dates).size };
}

function buildCancellationBody(params: {
    hotelName: string;
    contactName?: string;
    poNumber: string;
    tourCode?: string;
    guestName?: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    reason: string;
    agentName?: string;
}): string {
    const greeting = params.contactName ? `Dear ${params.contactName},` : `Dear Reservations Team at ${params.hotelName},`;
    const reasonText = params.reason.trim() || 'Change in guest itinerary';
    const lines = [
        greeting,
        '',
        `Please treat this email as formal notice to CANCEL our Purchase Order ${params.poNumber}${params.tourCode ? ` (Tour ID: ${params.tourCode})` : ''} with immediate effect.`,
        '',
        'Cancellation Details:',
        `- Cancelled PO Number: ${params.poNumber}`,
        `- Property: ${params.hotelName}`,
        ...(params.guestName ? [`- Guest Name: ${params.guestName}`] : []),
        `- Original Stay Dates: ${params.checkIn} to ${params.checkOut} (${params.nights} night${params.nights === 1 ? '' : 's'})`,
        `- Reason for Cancellation: ${reasonText}`,
        '',
        `Kindly acknowledge receipt of this cancellation notice in writing and confirm that the reservation has been released${params.poNumber ? ` under reference ${params.poNumber}` : ''}, advising us of any applicable cancellation terms or confirming cancellation without charge.`,
        '',
        'We sincerely apologize for any inconvenience caused and look forward to continuing our partnership on upcoming bookings.',
        '',
        'Warm regards,',
        params.agentName || 'Nilathra Collection Reservations',
        'Nilathra Collection',
    ];
    return lines.join('\n');
}

export default function CancelHotelPoModal({
    isOpen,
    onClose,
    tourId,
    tourCode,
    blockId,
    hotel,
    stays,
    candidatePos,
    initialPoId,
    touristName,
    agentName,
    onCancelled,
}: CancelHotelPoModalProps) {
    const [selectedPoId, setSelectedPoId] = useState<string>('');
    const [emailTo, setEmailTo] = useState<string>('');
    const [reason, setReason] = useState<string>('Itinerary / Date Change');
    const [subject, setSubject] = useState<string>('');
    const [body, setBody] = useState<string>('');
    const [sendEmail, setSendEmail] = useState<boolean>(true);
    const [bodyManuallyEdited, setBodyManuallyEdited] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const selectedPo = useMemo(
        () => candidatePos.find((p) => p.id === selectedPoId) || candidatePos[0] || null,
        [candidatePos, selectedPoId]
    );

    const stayRange = useMemo(() => computeStayRange(stays), [stays]);

    useEffect(() => {
        if (!isOpen) return;
        const defaultPo =
            (initialPoId && candidatePos.find((p) => p.id === initialPoId)) ||
            candidatePos[0] ||
            null;
        setSelectedPoId(defaultPo?.id || '');
        setReason('Itinerary / Date Change');
        setSendEmail(true);
        setBodyManuallyEdited(false);
        setError('');
    }, [isOpen, initialPoId, candidatePos]);

    useEffect(() => {
        if (!isOpen || !selectedPo) return;
        const defaultRecipient =
            selectedPo.sent_email ||
            hotel?.reservation_email ||
            hotel?.sales_email ||
            hotel?.email ||
            '';
        setEmailTo(defaultRecipient);
        const poNum = selectedPo.po_number || selectedPo.id.slice(0, 8).toUpperCase();
        setSubject(`Cancellation of Purchase Order ${poNum} - ${hotel?.name || selectedPo.vendor_name || 'Hotel'}`);
        setBodyManuallyEdited(false);
    }, [isOpen, selectedPo?.id]);

    useEffect(() => {
        if (!isOpen || !selectedPo || bodyManuallyEdited) return;
        const poNum = selectedPo.po_number || selectedPo.id.slice(0, 8).toUpperCase();
        setBody(
            buildCancellationBody({
                hotelName: hotel?.name || selectedPo.vendor_name || 'Hotel',
                contactName: hotel?.reservation_agent_name || hotel?.sales_agent_name,
                poNumber: poNum,
                tourCode,
                guestName: touristName,
                checkIn: stayRange.checkIn,
                checkOut: stayRange.checkOut,
                nights: stayRange.nights,
                reason,
                agentName,
            })
        );
    }, [isOpen, selectedPo, reason, hotel, tourCode, touristName, agentName, stayRange, bodyManuallyEdited]);

    if (!isOpen || !selectedPo) return null;

    const poNumber = selectedPo.po_number || selectedPo.id.slice(0, 8).toUpperCase();

    const handleConfirmCancel = async () => {
        setError('');
        if (!reason.trim()) {
            setError('Please enter a reason for cancellation.');
            return;
        }
        if (sendEmail && !emailTo.trim()) {
            setError('Please enter the hotel recipient email address.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await sendPurchaseOrderCancellationEmailAction({
                to: emailTo,
                from: 'concierge@nilathra.com',
                subject,
                body,
                poId: selectedPo.id,
                reason: reason.trim(),
                sendEmail,
            });

            if (!res.success) {
                setError(res.error || 'Failed to cancel Purchase Order.');
                return;
            }

            if (sendEmail) {
                try {
                    await logRfpEmailAction(
                        tourId,
                        selectedPo.id,
                        emailTo,
                        'concierge@nilathra.com',
                        subject,
                        body,
                        [],
                        blockId || undefined,
                        hotel?.id || null,
                        hotel?.name || selectedPo.vendor_name || null,
                        'hotel'
                    );
                } catch (logErr) {
                    console.error('Failed to log PO cancellation email:', logErr);
                }
            }

            alert(
                sendEmail
                    ? `Purchase Order ${poNumber} cancelled and cancellation email sent to ${emailTo}.`
                    : `Purchase Order ${poNumber} marked as Cancelled.`
            );
            onCancelled();
            onClose();
        } catch (err: any) {
            setError(err?.message || 'Unexpected error cancelling Purchase Order.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-rose-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-rose-100 flex items-center justify-between bg-rose-50/60">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700">
                            <XCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-serif font-bold text-neutral-900">
                                Cancel Hotel Purchase Order
                            </h3>
                            <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                                {poNumber} &bull; {hotel?.name || selectedPo.vendor_name}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="p-2 hover:bg-rose-100/70 rounded-full transition-colors text-neutral-400 hover:text-neutral-700"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-4">
                    {/* Select PO when multiple active POs exist on this hotel block */}
                    {candidatePos.length > 1 && (
                        <div>
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                                Purchase Order to Cancel
                            </label>
                            <select
                                value={selectedPo.id}
                                onChange={(e) => setSelectedPoId(e.target.value)}
                                className="w-full text-xs border border-neutral-200 rounded-xl px-3 py-2 bg-neutral-50 text-neutral-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                            >
                                {candidatePos.map((po) => (
                                    <option key={po.id} value={po.id}>
                                        {po.po_number} · {po.currency || 'USD'} {Number(po.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · Status: {po.status}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* PO Summary Banner */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs">
                        <div>
                            <span className="text-[9px] font-bold text-neutral-400 uppercase block">PO Number</span>
                            <span className="font-mono font-bold text-neutral-800">{poNumber}</span>
                        </div>
                        <div>
                            <span className="text-[9px] font-bold text-neutral-400 uppercase block">Current Status</span>
                            <span className="font-bold text-amber-700">{selectedPo.status}</span>
                        </div>
                        <div>
                            <span className="text-[9px] font-bold text-neutral-400 uppercase block">PO Total</span>
                            <span className="font-mono font-bold text-neutral-800">
                                {selectedPo.currency || 'USD'} {Number(selectedPo.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div>
                            <span className="text-[9px] font-bold text-neutral-400 uppercase block">Stay Dates</span>
                            <span className="font-mono text-[11px] font-semibold text-neutral-700">
                                {stayRange.checkIn} → {stayRange.checkOut}
                            </span>
                        </div>
                    </div>

                    {/* Cancellation Reason */}
                    <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1.5">
                            Cancellation Reason *
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {PRESET_REASONS.map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setReason(preset)}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${reason === preset
                                        ? 'bg-rose-600 text-white border-rose-600'
                                        : 'bg-white text-neutral-600 border-neutral-200 hover:border-rose-300'
                                        }`}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={2}
                            placeholder="Explain why this hotel Purchase Order is being cancelled..."
                            className="w-full text-xs border border-neutral-200 rounded-xl px-3 py-2 bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                        />
                    </div>

                    {/* Toggle Send Email */}
                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={sendEmail}
                            onChange={(e) => setSendEmail(e.target.checked)}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                        />
                        <div className="text-xs">
                            <span className="font-bold text-neutral-800">Send formal PO cancellation email to hotel</span>
                            <span className="block text-[10px] text-neutral-500">
                                Sends an official cancellation notice via concierge@nilathra.com and logs it in this block&apos;s email history.
                            </span>
                        </div>
                    </label>

                    {sendEmail && (
                        <div className="space-y-3 pt-1">
                            <div>
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                                    Hotel Recipient Email(s) *
                                </label>
                                <input
                                    type="text"
                                    value={emailTo}
                                    onChange={(e) => setEmailTo(e.target.value)}
                                    placeholder="reservations@hotel.com"
                                    className="w-full text-xs font-mono border border-neutral-200 rounded-xl px-3 py-2 bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                                    Email Subject
                                </label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full text-xs border border-neutral-200 rounded-xl px-3 py-2 bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                                        Cancellation Email Body
                                    </label>
                                    {bodyManuallyEdited && (
                                        <button
                                            type="button"
                                            onClick={() => setBodyManuallyEdited(false)}
                                            className="text-[10px] font-bold text-emerald-700 hover:underline"
                                        >
                                            Reset to template
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    value={body}
                                    onChange={(e) => {
                                        setBodyManuallyEdited(true);
                                        setBody(e.target.value);
                                    }}
                                    rows={9}
                                    className="w-full text-xs font-sans leading-relaxed border border-neutral-200 rounded-xl px-3 py-2.5 bg-neutral-50 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-neutral-100 bg-neutral-50/70 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-200/70 transition-colors"
                    >
                        Keep PO Active
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmCancel}
                        disabled={submitting}
                        className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>{sendEmail ? 'Sending & Cancelling...' : 'Cancelling...'}</span>
                            </>
                        ) : (
                            <>
                                <Mail className="w-4 h-4" />
                                <span>{sendEmail ? 'Send Cancellation & Cancel PO' : 'Cancel PO Only'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
