"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Compass, Calendar, Clock, MapPin, Users, ChevronDown, ChevronUp, Plus, CheckCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function TouristActivitiesPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchBookings = async () => {
            setIsLoading(true);
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { getMyActivityBookingsAction } = await import('@/actions/activity-booking.actions');
                const res = await getMyActivityBookingsAction(user.id);
                if (res.success && res.data) {
                    setBookings(res.data);
                    if (res.data.length > 0) {
                        setExpandedBookingId(res.data[0].id);
                    }
                }

            } catch (error) {
                console.error("Failed to load tourist activity bookings:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBookings();
    }, []);

    const toggleExpand = (id: string) => {
        setExpandedBookingId(prev => (prev === id ? null : id));
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header Banner */}
            <div className="bg-brand-green rounded-3xl p-8 sm:p-10 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="relative z-10">
                    <span className="px-3 py-1 bg-brand-gold/20 text-brand-gold font-bold text-xs uppercase tracking-widest rounded-full border border-brand-gold/30 mb-3 inline-block">
                        Tourist Dashboard
                    </span>
                    <h1 className="text-3xl md:text-4xl font-serif font-bold">My Activity Bookings</h1>
                    <p className="text-white/80 text-sm sm:text-base mt-2 max-w-xl">
                        Track your requested activity sessions, check status updates, and review confirmed price quotes from our concierge team.
                    </p>
                </div>

                <Link
                    href="/activities"
                    className="relative z-10 px-6 py-3.5 bg-brand-gold text-white font-bold text-sm rounded-2xl hover:bg-brand-gold/90 transition-all shadow-md flex items-center gap-2 self-start md:self-auto whitespace-nowrap"
                >
                    <Plus size={16} /> Request New Activities
                </Link>
            </div>

            {/* Bookings List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                    <h2 className="text-2xl font-serif font-bold text-brand-charcoal">Activity Requests</h2>
                    <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
                        {bookings.length} Request{bookings.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {isLoading ? (
                    <div className="p-16 flex justify-center text-brand-gold">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center text-neutral-400 bg-white rounded-3xl border border-neutral-200 shadow-sm">
                        <Compass size={56} className="mb-4 text-brand-gold opacity-60" />
                        <h3 className="text-lg font-bold text-brand-charcoal mb-1">No Activity Requests Yet</h3>
                        <p className="text-sm text-center text-neutral-500 max-w-md mb-6">
                            You have not requested any standalone activity sessions yet. Browse our handpicked Sri Lankan experiences and request sessions online.
                        </p>
                        <Link
                            href="/activities"
                            className="px-6 py-3 bg-brand-green text-white font-bold text-sm rounded-xl hover:bg-brand-green/90 transition-colors shadow-sm"
                        >
                            Browse Experiences Catalog
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {bookings.map(booking => {
                            const isExpanded = expandedBookingId === booking.id;
                            const isConfirmed = booking.status === 'Confirmed' || booking.status === 'Completed';

                            return (
                                <div
                                    key={booking.id}
                                    className="bg-white rounded-3xl border border-neutral-200 shadow-sm hover:border-brand-gold/40 transition-all duration-300 overflow-hidden"
                                >
                                    {/* Booking Summary Header */}
                                    <div
                                        onClick={() => toggleExpand(booking.id)}
                                        className="p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-neutral-50/60 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center font-mono font-bold text-lg flex-shrink-0">
                                                <Compass size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="font-mono font-bold text-sm text-brand-charcoal">{booking.booking_number}</span>
                                                    <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full border ${isConfirmed
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-neutral-500">
                                                    Requested on {new Date(booking.created_at).toLocaleDateString()} · {booking.items?.length || 0} Experience{(booking.items?.length || 0) > 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">Confirmed Price</span>
                                                {booking.total_price !== null && booking.total_price !== undefined ? (
                                                    <span className="text-xl font-serif font-bold text-brand-green">
                                                        ${Number(booking.total_price).toLocaleString()} {booking.currency || 'USD'}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full inline-block mt-0.5">
                                                        Quote Pending
                                                    </span>
                                                )}
                                            </div>

                                            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">
                                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Activity Items List */}
                                    {isExpanded && (
                                        <div className="p-6 bg-neutral-50/70 border-t border-neutral-200 space-y-4">
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                                                Requested Experience Sessions
                                            </h4>

                                            <div className="space-y-3">
                                                {(booking.items || []).map((item: any, idx: number) => {
                                                    const act = item.activity;

                                                    return (
                                                        <div key={item.id || idx} className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-2xs space-y-3">
                                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                                                <div>
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">
                                                                        Session #{idx + 1} · {act?.category || 'Activity'}
                                                                    </span>
                                                                    <h5 className="text-base font-serif font-bold text-brand-charcoal">
                                                                        {act?.activity_name || 'Activity Session'}
                                                                    </h5>
                                                                    <p className="text-xs text-neutral-500 mt-0.5">
                                                                        {act?.location_name}, {act?.district}
                                                                    </p>
                                                                </div>

                                                                {item.item_price !== null && item.item_price !== undefined && (
                                                                    <div className="text-sm font-bold text-brand-green font-serif bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl self-start">
                                                                        ${Number(item.item_price).toLocaleString()} USD
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-100 text-xs text-neutral-600">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Calendar size={13} className="text-brand-gold" />
                                                                    <span><strong>Date:</strong> {item.booking_date}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Clock size={13} className="text-brand-gold" />
                                                                    <span><strong>Time Slot:</strong> {item.preferred_time_slot || 'Flexible'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Users size={13} className="text-brand-gold" />
                                                                    <span><strong>Guests:</strong> {item.adults} Adults{item.children > 0 ? `, ${item.children} Children` : ''}</span>
                                                                </div>
                                                            </div>

                                                            {item.vendor?.name && (
                                                                <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100 text-xs flex items-center justify-between text-neutral-600">
                                                                    <span>Assigned Activity Partner: <strong className="text-brand-charcoal">{item.vendor.name}</strong></span>
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-1">
                                                                        <CheckCircle size={12} /> Confirmed
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Status Message */}
                                            {!isConfirmed ? (
                                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-start gap-3">
                                                    <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <strong className="block font-bold">Price Quote Under Concierge Review</strong>
                                                        Our team is calculating the total price and coordinating with our verified local vendors. You will receive an email notification as soon as your quote is ready.
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-3">
                                                    <CheckCircle size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <strong className="block font-bold">Booking Confirmed by Nilathra Concierge</strong>
                                                        Your activity sessions are confirmed. Offline payment processing instructions have been dispatched to your email.
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
