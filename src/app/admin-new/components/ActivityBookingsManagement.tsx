"use client";

import { useState, useEffect } from "react";
import {
    Search, Filter, CheckCircle2, Clock, MapPin, Users,
    X, ChevronRight, AlertCircle, Loader2, Mail, Phone,
    User, DollarSign, Calendar, Edit3, Send
} from "lucide-react";
import { ActivityBooking, ActivityBookingItem } from "@/types/activity-booking.type";
import { confirmActivityBookingAction, updateActivityBookingStatusAction, getAllActivityBookingsAction } from "@/actions/activity-booking.actions";
import { createClient } from "@/utils/supabase/client";

export default function ActivityBookingsManagement() {
    const [bookings, setBookings] = useState<ActivityBooking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Selected booking for Drawer management
    const [selectedBooking, setSelectedBooking] = useState<ActivityBooking | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Registered Master Vendors & Vendor Activities mapping
    const [allVendors, setAllVendors] = useState<any[]>([]);
    const [vendorActivitiesMap, setVendorActivitiesMap] = useState<Record<number, any[]>>({});

    // Form inputs for pricing & vendor assignment per item
    const [itemAssignments, setItemAssignments] = useState<Record<string, {
        vendor_id: string;
        item_price: number;
        agreed_vendor_price: number;
    }>>({});
    const [customTotalPrice, setCustomTotalPrice] = useState<number>(0);
    const [adminNotes, setAdminNotes] = useState<string>("");

    const fetchBookings = async () => {
        setIsLoading(true);
        try {
            const res = await getAllActivityBookingsAction();
            if (res.success && res.data) {
                setBookings(res.data);
            }
        } catch (err) {
            console.error("Failed to load activity bookings for admin:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchVendors = async () => {
        try {
            const supabase = createClient();
            // Fetch all active vendors
            const { data: vData } = await supabase
                .from('vendors')
                .select('id, name, phone, email, address')
                .eq('is_suspended', false);

            setAllVendors(vData || []);

            // Fetch vendor_activities mappings with price
            const { data: vaData } = await supabase
                .from('vendor_activities')
                .select('vendor_id, activity_id, vendor_price, vendors(id, name, phone, email)');

            const map: Record<number, any[]> = {};
            (vaData || []).forEach((va: any) => {
                if (!map[va.activity_id]) map[va.activity_id] = [];
                map[va.activity_id].push({
                    vendor_id: va.vendor_id,
                    vendor_name: va.vendors?.name || 'Vendor',
                    vendor_price: va.vendor_price
                });
            });
            setVendorActivitiesMap(map);

        } catch (err) {
            console.error("Failed to load master vendors:", err);
        }
    };

    useEffect(() => {
        fetchBookings();
        fetchVendors();
    }, []);

    const openManagementDrawer = (booking: ActivityBooking) => {
        setSelectedBooking(booking);
        setAdminNotes(booking.admin_notes || "");
        setFeedbackMessage(null);

        // Pre-populate item assignments form state
        const initialAssignments: Record<string, any> = {};
        let runningTotal = 0;

        (booking.items || []).forEach(item => {
            const currentItemPrice = item.item_price !== null && item.item_price !== undefined ? Number(item.item_price) : 0;
            const currentVendorPrice = item.agreed_vendor_price !== null && item.agreed_vendor_price !== undefined ? Number(item.agreed_vendor_price) : 0;
            runningTotal += currentItemPrice;

            initialAssignments[item.id] = {
                vendor_id: item.assigned_vendor_id || '',
                item_price: currentItemPrice,
                agreed_vendor_price: currentVendorPrice
            };
        });

        setItemAssignments(initialAssignments);
        setCustomTotalPrice(booking.total_price !== null && booking.total_price !== undefined ? Number(booking.total_price) : runningTotal);
        setIsDrawerOpen(true);
    };

    const handleItemAssignmentChange = (itemId: string, field: string, value: any) => {
        setItemAssignments(prev => {
            const updated = {
                ...prev,
                [itemId]: {
                    ...prev[itemId],
                    [field]: value
                }
            };

            // Recalculate total price if customer item price changed
            if (field === 'item_price') {
                let sum = 0;
                Object.values(updated).forEach(assign => {
                    sum += (Number(assign.item_price) || 0);
                });
                setCustomTotalPrice(sum);
            }

            return updated;
        });
    };

    const handleConfirmAndAssign = async () => {
        if (!selectedBooking) return;
        setIsSaving(true);
        setFeedbackMessage(null);

        try {
            const assignments = Object.entries(itemAssignments).map(([itemId, assign]) => ({
                item_id: itemId,
                vendor_id: assign.vendor_id,
                item_price: Number(assign.item_price) || 0,
                agreed_vendor_price: Number(assign.agreed_vendor_price) || 0
            }));

            const res = await confirmActivityBookingAction({
                booking_id: selectedBooking.id,
                total_price: Number(customTotalPrice) || 0,
                item_assignments: assignments,
                admin_notes: adminNotes
            });

            if (res.success) {
                setFeedbackMessage({ type: 'success', text: 'Booking confirmed! Price sent to tourist & assignment emails dispatched to vendors.' });
                await fetchBookings();
                setTimeout(() => {
                    setIsDrawerOpen(false);
                }, 1500);
            } else {
                setFeedbackMessage({ type: 'error', text: res.error || 'Failed to confirm booking.' });
            }
        } catch (err: any) {
            setFeedbackMessage({ type: 'error', text: err.message || 'Error executing confirmation.' });
        } finally {
            setIsSaving(false);
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
        const q = searchQuery.toLowerCase().trim();
        const touristName = `${b.tourist_profile?.first_name || ''} ${b.tourist_profile?.last_name || ''}`.toLowerCase();
        const email = (b.user?.email || '').toLowerCase();
        const num = b.booking_number.toLowerCase();

        const matchesSearch = !q || (touristName.includes(q) || email.includes(q) || num.includes(q));
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="space-y-6">

            {/* Top Filter & Search Bar */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search booking #, tourist name, email..."
                            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-brand-gold"
                        />
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    {['all', 'Pending Assignment', 'Assigned', 'Confirmed', 'Completed', 'Cancelled'].map(st => (
                        <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${statusFilter === st
                                ? 'bg-brand-green text-white shadow-xs'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                }`}
                        >
                            {st === 'all' ? 'All Bookings' : st}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
                    <h3 className="font-serif font-bold text-lg text-brand-charcoal">Public Activity Bookings</h3>
                    <span className="text-xs text-neutral-500 font-medium">
                        {filteredBookings.length} Record{filteredBookings.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {isLoading ? (
                    <div className="p-16 flex justify-center text-brand-gold">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="p-16 text-center text-neutral-400">
                        <p className="text-sm font-medium">No activity bookings found matching your search.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-50 text-[10px] uppercase font-bold tracking-widest text-neutral-400 border-b border-neutral-200">
                                    <th className="py-3.5 px-6">Booking Ref</th>
                                    <th className="py-3.5 px-6">Tourist Info</th>
                                    <th className="py-3.5 px-6">Requested Sessions</th>
                                    <th className="py-3.5 px-6">Total Price</th>
                                    <th className="py-3.5 px-6">Status</th>
                                    <th className="py-3.5 px-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 text-xs">
                                {filteredBookings.map(booking => {
                                    const profile = booking.tourist_profile;
                                    const touristName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Tourist Guest';
                                    const itemCount = booking.items?.length || 0;

                                    return (
                                        <tr key={booking.id} className="hover:bg-neutral-50/80 transition-colors">
                                            <td className="py-4 px-6 font-mono font-bold text-brand-charcoal">
                                                {booking.booking_number}
                                                <span className="block text-[10px] font-sans text-neutral-400 font-normal">
                                                    {new Date(booking.created_at || '').toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="font-bold text-brand-charcoal">{touristName}</p>
                                                <p className="text-neutral-500 text-[11px]">{booking.user?.email || 'N/A'}</p>
                                                {profile?.country && (
                                                    <p className="text-neutral-400 text-[10px]">{profile.country}</p>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="font-bold text-brand-charcoal">{itemCount} Experience{itemCount > 1 ? 's' : ''}</span>
                                                <p className="text-neutral-500 text-[11px] truncate max-w-xs">
                                                    {booking.items?.map(i => i.activity?.activity_name).filter(Boolean).join(', ')}
                                                </p>
                                            </td>
                                            <td className="py-4 px-6 font-serif font-bold text-brand-green">
                                                {booking.total_price !== null && booking.total_price !== undefined ? (
                                                    `$${Number(booking.total_price).toLocaleString()} USD`
                                                ) : (
                                                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Quote Needed</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${booking.status === 'Confirmed' || booking.status === 'Completed'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : booking.status === 'Assigned'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => openManagementDrawer(booking)}
                                                    className="px-4 py-2 bg-brand-green text-white font-bold text-xs rounded-xl hover:bg-brand-green/90 transition-colors shadow-2xs"
                                                >
                                                    Manage & Assign
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Management & Vendor Assignment Drawer */}
            {isDrawerOpen && selectedBooking && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl min-h-screen shadow-2xl flex flex-col justify-between border-l border-neutral-200 animate-in slide-in-from-right duration-300">

                        {/* Drawer Header */}
                        <div className="p-6 bg-brand-green text-white relative">
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                className="absolute top-6 right-6 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <span className="text-[10px] uppercase font-bold tracking-widest bg-brand-gold/20 text-brand-gold border border-brand-gold/30 px-3 py-1 rounded-full">
                                Booking Management
                            </span>
                            <h3 className="text-2xl font-serif font-bold mt-2">{selectedBooking.booking_number}</h3>
                            <p className="text-xs text-white/80 mt-0.5">
                                Review tourist info, set customer prices, and assign registered Activity Vendors.
                            </p>
                        </div>

                        {/* Drawer Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">

                            {feedbackMessage && (
                                <div className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-3 ${feedbackMessage.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-red-50 text-red-800 border border-red-200'
                                    }`}>
                                    <AlertCircle size={16} />
                                    <span>{feedbackMessage.text}</span>
                                </div>
                            )}

                            {/* Tourist Profile Section */}
                            <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gold flex items-center gap-1.5">
                                    <User size={14} /> Tourist Profile Details
                                </h4>

                                <div className="grid grid-cols-2 gap-3 text-xs text-neutral-700">
                                    <div>
                                        <span className="text-neutral-400 block text-[10px]">Name</span>
                                        <strong className="text-brand-charcoal">
                                            {selectedBooking.tourist_profile?.first_name} {selectedBooking.tourist_profile?.last_name}
                                        </strong>
                                    </div>
                                    <div>
                                        <span className="text-neutral-400 block text-[10px]">Email</span>
                                        <strong className="text-brand-charcoal">{selectedBooking.user?.email}</strong>
                                    </div>
                                    <div>
                                        <span className="text-neutral-400 block text-[10px]">Phone / WhatsApp</span>
                                        <strong>{selectedBooking.tourist_profile?.phone || 'N/A'}</strong>
                                    </div>
                                    <div>
                                        <span className="text-neutral-400 block text-[10px]">Country / Passport</span>
                                        <strong>{selectedBooking.tourist_profile?.country || 'N/A'} · {selectedBooking.tourist_profile?.passport_number || 'N/A'}</strong>
                                    </div>
                                    <div>
                                        <span className="text-neutral-400 block text-[10px]">Arrival / Departure</span>
                                        <strong>{selectedBooking.tourist_profile?.arrival_date || 'N/A'} → {selectedBooking.tourist_profile?.departure_date || 'N/A'}</strong>
                                    </div>
                                    <div>
                                        <span className="text-neutral-400 block text-[10px]">Language Preference</span>
                                        <strong>{selectedBooking.tourist_profile?.language_preference || 'English'}</strong>
                                    </div>
                                </div>

                                {selectedBooking.tourist_profile?.special_notes && (
                                    <div className="pt-2 border-t border-neutral-200 text-xs text-neutral-600">
                                        <span className="font-bold text-neutral-700">Special Notes: </span>
                                        {selectedBooking.tourist_profile.special_notes}
                                    </div>
                                )}
                            </div>

                            {/* Activity Items Session Pricing & Vendor Assignment */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                                    Requested Sessions & Vendor Assignment ({selectedBooking.items?.length || 0})
                                </h4>

                                {(selectedBooking.items || []).map((item, idx) => {
                                    const act = item.activity;
                                    const assign = itemAssignments[item.id] || { vendor_id: '', item_price: 0, agreed_vendor_price: 0 };
                                    const mappedVendors = (act?.id && vendorActivitiesMap[act.id]) || [];

                                    return (
                                        <div key={item.id} className="p-5 bg-white rounded-2xl border border-neutral-200 space-y-4 shadow-2xs">
                                            <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-3">
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">
                                                        Item #{idx + 1} · {act?.category || 'Activity'}
                                                    </span>
                                                    <h5 className="font-serif font-bold text-base text-brand-charcoal">
                                                        {act?.activity_name || 'Activity Session'}
                                                    </h5>
                                                    <p className="text-xs text-neutral-500">
                                                        {act?.location_name}, {act?.district} · {item.booking_date} ({item.preferred_time_slot || 'Flexible'})
                                                    </p>
                                                    <p className="text-xs text-neutral-500 font-medium">
                                                        Guests: {item.adults} Adults{item.children > 0 ? `, ${item.children} Children` : ''}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Vendor Selection & Pricing Fields */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">

                                                {/* Vendor Selector */}
                                                <div className="sm:col-span-3">
                                                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                                                        Assign Activity Vendor *
                                                    </label>
                                                    <select
                                                        value={assign.vendor_id}
                                                        onChange={(e) => handleItemAssignmentChange(item.id, 'vendor_id', e.target.value)}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:border-brand-gold bg-white"
                                                    >
                                                        <option value="">-- Select Vendor --</option>
                                                        {mappedVendors.length > 0 && (
                                                            <optgroup label="Mapped Vendors for Activity (Contracted Rates)">
                                                                {mappedVendors.map(v => (
                                                                    <option key={v.vendor_id} value={v.vendor_id}>
                                                                        {v.vendor_name} {v.vendor_price ? `(Contracted: $${v.vendor_price})` : ''}
                                                                    </option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                        <optgroup label="All Master Vendors">
                                                            {allVendors.map(v => (
                                                                <option key={v.id} value={v.id}>{v.name} ({v.phone || v.email || 'Vendor'})</option>
                                                            ))}
                                                        </optgroup>
                                                    </select>
                                                </div>

                                                {/* Customer Item Price */}
                                                <div>
                                                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                                                        Customer Item Price ($)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={assign.item_price}
                                                        onChange={(e) => handleItemAssignmentChange(item.id, 'item_price', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:border-brand-gold"
                                                    />
                                                </div>

                                                {/* Agreed Vendor Price */}
                                                <div>
                                                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                                                        Agreed Vendor Price ($)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={assign.agreed_vendor_price}
                                                        onChange={(e) => handleItemAssignmentChange(item.id, 'agreed_vendor_price', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:border-brand-gold"
                                                    />
                                                </div>

                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Total Customer Price & Admin Notes */}
                            <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                                        Total Confirmed Customer Price ($ USD)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={customTotalPrice}
                                        onChange={(e) => setCustomTotalPrice(parseFloat(e.target.value) || 0)}
                                        className="w-full px-4 py-2.5 text-base font-serif font-bold text-brand-green rounded-xl border border-neutral-300 focus:outline-none focus:border-brand-gold bg-white"
                                    />
                                    <p className="text-[11px] text-neutral-400 mt-1">This is the final quote price sent to the tourist email.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 mb-1">Admin Notes</label>
                                    <textarea
                                        rows={2}
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="Internal notes regarding vendor confirmation, timing, or payment..."
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:border-brand-gold bg-white resize-none"
                                    />
                                </div>
                            </div>

                        </div>

                        {/* Drawer Footer Actions */}
                        <div className="p-6 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                className="px-4 py-2.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAndAssign}
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-brand-green text-white font-bold text-xs rounded-xl hover:bg-brand-green/90 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" /> Saving & Sending Emails...
                                    </>
                                ) : (
                                    <>
                                        <Send size={14} /> Confirm Quote & Assign Vendors
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
