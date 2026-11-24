'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock, Loader2, Mail, X } from 'lucide-react';
import {
    logRfqEmailAction,
    sendHotelCourtesyHoldEmailAction,
} from '@/actions/admin.actions';

export interface HotelCourtesyHoldModalProps {
    isOpen: boolean;
    onClose: () => void;
    tourId: string;
    tourCode?: string;
    blockId: string;
    hotel: any;
    stays: any[];
    defaultAdults?: number;
    defaultChildren?: number;
    defaultInfants?: number;
    agentName?: string;
    onSent: () => void;
}

function computeStaySummary(
    stays: any[],
    defaultAdults = 0,
    defaultChildren = 0,
    defaultInfants = 0
) {
    const standardStays = (stays || []).filter((s: any) => !s?.is_custom_hotel_item);
    const list = standardStays.length > 0 ? standardStays : stays || [];

    const dates = list
        .map((s: any) => s?.activity_date || s?.tour_itineraries?.date)
        .filter(Boolean)
        .map((d: string) => String(d).slice(0, 10))
        .sort();

    let checkIn = 'TBC';
    let checkOut = 'TBC';
    let nights = list.length;

    if (dates.length > 0) {
        checkIn = dates[0];
        const last = new Date(`${dates[dates.length - 1]}T00:00:00Z`);
        last.setUTCDate(last.getUTCDate() + 1);
        checkOut = last.toISOString().slice(0, 10);
        nights = new Set(dates).size;
    }

    const first = list[0];
    const adults = Number(first?.adults ?? defaultAdults ?? 0);
    const children = Number(first?.children ?? defaultChildren ?? 0);
    const infants = Number(first?.infants ?? defaultInfants ?? 0);

    const paxParts: string[] = [];
    if (adults > 0) paxParts.push(`${adults} Adult${adults === 1 ? '' : 's'}`);
    if (children > 0) paxParts.push(`${children} Child${children === 1 ? '' : 'ren'}`);
    if (infants > 0) paxParts.push(`${infants} Infant${infants === 1 ? '' : 's'}`);
    const paxSummary = paxParts.length > 0 ? paxParts.join(', ') : 'TBC';

    const roomCounts: Record<string, number> = {};
    const mealPlans = new Set<string>();
    const perDateRooms: Record<string, Record<string, number>> = {};

    list.forEach((s: any) => {
        const dKey = String(s?.activity_date || s?.tour_itineraries?.date || 'day').slice(0, 10);
        const roomLabel = s?.room_type || s?.room_category || s?.title || 'Room';
        const qty = Number(s?.quantity || 1);
        if (!perDateRooms[dKey]) perDateRooms[dKey] = {};
        perDateRooms[dKey][roomLabel] = (perDateRooms[dKey][roomLabel] || 0) + qty;
        if (s?.meal_plan) mealPlans.add(s.meal_plan);
    });

    Object.values(perDateRooms).forEach((dayMap) => {
        Object.entries(dayMap).forEach(([label, count]) => {
            roomCounts[label] = Math.max(roomCounts[label] || 0, count);
        });
    });

    const roomLines = Object.entries(roomCounts).map(
        ([label, count]) => `${count} x ${label}`
    );

    return {
        checkIn,
        checkOut,
        nights,
        paxSummary,
        roomSummary: roomLines.length > 0 ? roomLines.join(', ') : 'As discussed',
        mealPlan: Array.from(mealPlans).join(' / ') || 'As discussed',
    };
}

function defaultHoldUntilDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
}

function buildHoldBody(params: {
    hotelName: string;
    contactName: string;
    tourCode?: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    paxSummary: string;
    roomSummary: string;
    mealPlan: string;
    holdUntil: string;
    agentName: string;
}): string {
    const greeting = params.contactName.trim()
        ? `Dear ${params.contactName.trim()},`
        : `Dear Reservations Team at ${params.hotelName},`;
    const callRef = params.contactName.trim()
        ? `Thank you for speaking with us over the phone earlier today and confirming room availability at ${params.hotelName}.`
        : `Further to our telephone conversation earlier today confirming room availability at ${params.hotelName}, we kindly request a courtesy room hold for the stay details below while we finalize confirmation with our guest.`;

    const lines = [
        greeting,
        '',
        callRef,
        '',
        ...(params.contactName.trim()
            ? ['As discussed, we kindly request a courtesy booking / provisional room hold for the following stay while we confirm final details with our guest:', '']
            : []),
        'Provisional Hold Details:',
        ...(params.tourCode ? [`- Tour Reference: ${params.tourCode}`] : []),
        `- Property: ${params.hotelName}`,
        `- Check-in: ${params.checkIn}`,
        `- Check-out: ${params.checkOut} (${params.nights} night${params.nights === 1 ? '' : 's'})`,
        `- Rooms: ${params.roomSummary}`,
        `- Meal Plan: ${params.mealPlan}`,
        `- Guests: ${params.paxSummary}`,
        ...(params.holdUntil ? [`- Requested Hold Until: ${params.holdUntil}`] : []),
        '',
        'Kindly reply with your provisional hold confirmation / booking reference number and the cut-off date so we can issue our formal Purchase Order as soon as our guest confirms.',
        '',
        'Thank you very much for your kind assistance and continued support.',
        '',
        'Warm regards,',
        params.agentName,
        'Nilathra Collection',
    ];
    return lines.join('\n');
}

export default function HotelCourtesyHoldModal({
    isOpen,
    onClose,
    tourId,
    tourCode,
    blockId,
    hotel,
    stays,
    defaultAdults = 0,
    defaultChildren = 0,
    defaultInfants = 0,
    agentName = 'Nilathra Collection Reservations',
    onSent,
}: HotelCourtesyHoldModalProps) {
    const [emailTo, setEmailTo] = useState('');
    const [contactName, setContactName] = useState('');
    const [holdUntil, setHoldUntil] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [bodyManuallyEdited, setBodyManuallyEdited] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const staySummary = useMemo(
        () => computeStaySummary(stays, defaultAdults, defaultChildren, defaultInfants),
        [stays, defaultAdults, defaultChildren, defaultInfants]
    );

    useEffect(() => {
        if (!isOpen || !hotel) return;
        const recipient = hotel.reservation_email || hotel.sales_email || hotel.email || '';
        const contact = hotel.reservation_agent_name || hotel.sales_agent_name || '';
        const holdDate = defaultHoldUntilDate();
        setEmailTo(recipient);
        setContactName(contact);
        setHoldUntil(holdDate);
        setSubject(
            `Courtesy Room Hold Request - ${hotel.name}${tourCode ? ` (${tourCode})` : ''} | ${staySummary.checkIn} to ${staySummary.checkOut}`
        );
        setBodyManuallyEdited(false);
        setError('');
    }, [isOpen, hotel?.id, tourCode, staySummary.checkIn, staySummary.checkOut]);

    useEffect(() => {
        if (!isOpen || !hotel || bodyManuallyEdited) return;
        setBody(
            buildHoldBody({
                hotelName: hotel.name || 'Hotel',
                contactName,
                tourCode,
                checkIn: staySummary.checkIn,
                checkOut: staySummary.checkOut,
                nights: staySummary.nights,
                paxSummary: staySummary.paxSummary,
                roomSummary: staySummary.roomSummary,
                mealPlan: staySummary.mealPlan,
                holdUntil,
                agentName,
            })
        );
    }, [isOpen, hotel, contactName, holdUntil, tourCode, staySummary, agentName, bodyManuallyEdited]);

    if (!isOpen || !hotel) return null;

    const handleSend = async () => {
        setError('');
        if (!emailTo.trim()) {
            setError('Please enter the hotel recipient email address.');
            return;
        }
        if (!subject.trim() || !body.trim()) {
            setError('Email subject and body are required.');
            return;
        }

        setSending(true);
        try {
            const res = await sendHotelCourtesyHoldEmailAction({
                to: emailTo,
                from: 'concierge@nilathra.com',
                subject,
                body,
            });

            if (!res.success) {
                setError(res.error || 'Failed to send courtesy hold email.');
                return;
            }

            try {
                await logRfqEmailAction(
                    tourId,
                    hotel.id || null,
                    emailTo,
                    'concierge@nilathra.com',
                    subject,
                    body,
                    [],
                    undefined,
                    blockId || undefined,
                    hotel.name || null,
                    'hotel'
                );
            } catch (logErr) {
                console.error('Failed to log courtesy hold email:', logErr);
            }

            alert(`Courtesy room hold request sent to ${emailTo}.`);
            onSent();
            onClose();
        } catch (err: any) {
            setError(err?.message || 'Unexpected error sending email.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-indigo-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-indigo-100 flex items-center justify-between bg-indigo-50/60">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-serif font-bold text-neutral-900">
                                Request Courtesy Booking / Room Hold
                            </h3>
                            <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                                {hotel.name} &bull; {staySummary.checkIn} → {staySummary.checkOut} ({staySummary.nights}N)
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={sending}
                        className="p-2 hover:bg-indigo-100/70 rounded-full transition-colors text-neutral-400 hover:text-neutral-700"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                                Hotel Recipient Email(s) *
                            </label>
                            <input
                                type="text"
                                value={emailTo}
                                onChange={(e) => setEmailTo(e.target.value)}
                                placeholder="reservations@hotel.com"
                                className="w-full text-xs font-mono border border-neutral-200 rounded-xl px-3 py-2 bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                                Contact Spoke With (Phone Call)
                            </label>
                            <input
                                type="text"
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                                placeholder="e.g. Nimal (Reservations)"
                                className="w-full text-xs border border-neutral-200 rounded-xl px-3 py-2 bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                                Email Subject *
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full text-xs border border-neutral-200 rounded-xl px-3 py-2 bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                                Hold Until Date
                            </label>
                            <input
                                type="date"
                                value={holdUntil}
                                onChange={(e) => setHoldUntil(e.target.value)}
                                className="w-full text-xs border border-neutral-200 rounded-xl px-3 py-2 bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                                Email Body
                            </label>
                            {bodyManuallyEdited && (
                                <button
                                    type="button"
                                    onClick={() => setBodyManuallyEdited(false)}
                                    className="text-[10px] font-bold text-indigo-700 hover:underline"
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
                            rows={11}
                            className="w-full text-xs font-sans leading-relaxed border border-neutral-200 rounded-xl px-3 py-2.5 bg-neutral-50 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

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
                        disabled={sending}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-200/70 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={sending}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {sending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Sending...</span>
                            </>
                        ) : (
                            <>
                                <Mail className="w-4 h-4" />
                                <span>Send Hold Request Email</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
