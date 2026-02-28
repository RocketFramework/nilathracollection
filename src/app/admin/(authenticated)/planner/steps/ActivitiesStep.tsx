"use client";

import { TripData, ActivityBooking } from "../types";
import { Compass, Search, MapPin, Clock, Plus, Trash2, Check, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { Activity, fetchActivities } from "@/data/activities";

export function ActivitiesStep({ tripData, updateActivities }: { tripData: TripData, updateActivities: (acts: ActivityBooking[]) => void }) {

    const [allActivities, setAllActivities] = useState<Activity[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    if (!tripData.serviceScopes.includes('Plan Activities & Experiences')) {
        return (
            <div className="bg-neutral-50 p-12 text-center rounded-3xl border border-dashed border-neutral-300">
                <Compass className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-600">Activities Planning Disabled</h3>
                <p className="text-sm text-neutral-400 mt-2">To select and book activities, enable "Plan Activities & Experiences" in Step 1.</p>
            </div>
        );
    }

    // Load activities from Supabase (or fallback logic as defined in data/activities.ts)
    useEffect(() => {
        async function load() {
            try {
                const data = await fetchActivities();
                setAllActivities(data);
            } catch (error) {
                console.error("Failed to load activities", error);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    const { activities } = tripData;

    const isSelected = (id: number) => {
        return activities.some(a => a.activityId === id);
    };

    const toggleActivity = (act: Activity) => {
        if (isSelected(act.id)) {
            updateActivities(activities.filter(a => a.activityId !== act.id));
        } else {
            const newBooking: ActivityBooking = {
                id: crypto.randomUUID(),
                activityId: act.id,
                activityData: act,
                status: 'Random / Walk-in',
                supplierContactPerson: '',
                paymentTerms: '',
                bookingReference: '',
                cutOffDate: ''
            };
            updateActivities([...activities, newBooking]);
        }
    };

    const updateBookingField = (id: string, field: keyof ActivityBooking, value: any) => {
        updateActivities(activities.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const filteredCatalog = allActivities.filter(a =>
        a.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-xl font-serif text-brand-green flex items-center gap-2">
                        <Compass size={20} className="text-brand-gold" /> Activity & Experience Curation
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">Select from catalog and track supplier bookings.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Catalog Browser */}
                <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm flex flex-col h-[600px] overflow-hidden">
                    <div className="bg-neutral-50 p-6 border-b border-neutral-200">
                        <h4 className="font-semibold text-neutral-800 text-sm uppercase tracking-wide mb-4">Experiential Catalog</h4>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Search by name, location, or tag..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm focus:ring-1 focus:ring-brand-gold"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full text-neutral-400 text-sm">Loading catalog...</div>
                        ) : filteredCatalog.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-neutral-400 text-sm italic">No activities match your search.</div>
                        ) : (
                            filteredCatalog.map(act => {
                                const active = isSelected(act.id);
                                return (
                                    <div
                                        key={act.id}
                                        onClick={() => toggleActivity(act)}
                                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center group
                                            ${active ? 'border-brand-green bg-brand-green/5' : 'border-neutral-100 bg-white hover:border-brand-gold/40 hover:shadow-sm'}`}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h5 className={`font-semibold text-sm ${active ? 'text-brand-green' : 'text-neutral-800'}`}>{act.activity_name}</h5>
                                                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-neutral-100 text-neutral-500">{act.category}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-neutral-400">
                                                <span className="flex items-center gap-1"><MapPin size={12} /> {act.location_name}</span>
                                                <span className="flex items-center gap-1"><Clock size={12} /> {act.duration_hours}h</span>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors
                                            ${active ? 'bg-brand-green border-brand-green text-white' : 'border-neutral-300 text-transparent group-hover:border-brand-gold/50'}`}>
                                            <Check size={14} />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Selected Worklist Tracker */}
                <div className="bg-white rounded-3xl border border-brand-gold/20 shadow-sm flex flex-col h-[600px] overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 w-64 h-64 opacity-[0.03] -z-10 pointer-events-none">
                        <Compass className="w-full h-full text-brand-gold" />
                    </div>
                    <div className="bg-brand-gold/10 p-6 border-b border-brand-gold/20 flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold text-brand-charcoal text-sm uppercase tracking-wide">Selected & Tracking</h4>
                            <p className="text-xs text-brand-gold/80 font-medium">({activities.length} items configured)</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {activities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-neutral-400 text-sm space-y-2">
                                <Plus size={32} className="text-neutral-300 opacity-50" />
                                <p>Select activities from the left to begin booking logistics.</p>
                            </div>
                        ) : (
                            activities.map((booking, idx) => (
                                <div key={booking.id} className="p-5 rounded-xl border border-neutral-200 bg-white shadow-sm space-y-4 relative overflow-hidden group">
                                    {/* Action Bar */}
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest leading-none mb-1">Item #{idx + 1}</p>
                                            <h5 className="font-semibold text-brand-charcoal">{booking.activityData.activity_name}</h5>
                                            <p className="text-xs text-neutral-500">{booking.activityData.location_name}</p>
                                        </div>
                                        <button onClick={() => updateActivities(activities.filter(a => a.id !== booking.id))} className="text-red-400 hover:text-red-600 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Bookng Grid */}
                                    <div className="grid grid-cols-2 gap-3 pb-3 border-b border-neutral-100">
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block mb-1">Status Level</label>
                                            <select
                                                value={booking.status}
                                                onChange={e => updateBookingField(booking.id, 'status', e.target.value)}
                                                className={`w-full text-xs font-medium cursor-pointer rounded-lg px-3 py-2 border focus:outline-none transition-colors appearance-none
                                                    ${booking.status === 'Voucher Issued' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        booking.status === 'Confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            booking.status === 'Random / Walk-in' ? 'bg-neutral-100 text-neutral-600 border-neutral-200' :
                                                                'bg-yellow-50 text-yellow-700 border-yellow-200'}`}
                                            >
                                                <option value="Random / Walk-in">Random / Walk-in (No Pre-booking req.)</option>
                                                <option value="Tentative Booking">Tentative Booking Hold</option>
                                                <option value="Confirmed">Confirmed Booking</option>
                                                <option value="Paid">Processed & Paid</option>
                                                <option value="Voucher Issued">🟢 Final Voucher Issued</option>
                                            </select>
                                        </div>
                                    </div>

                                    {booking.status !== 'Random / Walk-in' && (
                                        <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div>
                                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block mb-1">Reference</label>
                                                <input type="text" placeholder="REF-XYZ" value={booking.bookingReference} onChange={e => updateBookingField(booking.id, 'bookingReference', e.target.value)} className="w-full text-xs box-border rounded-md px-2 py-1.5 border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block mb-1">Cut-Off</label>
                                                <input type="date" value={booking.cutOffDate} onChange={e => updateBookingField(booking.id, 'cutOffDate', e.target.value)} className="w-full text-xs box-border rounded-md px-2 py-1.5 border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block mb-1 flex items-center gap-1">Supplier <AlertTriangle size={10} className="text-yellow-500" /></label>
                                                <div className="flex gap-2">
                                                    <input type="text" placeholder="Contact Person" value={booking.supplierContactPerson} onChange={e => updateBookingField(booking.id, 'supplierContactPerson', e.target.value)} className="flex-1 text-xs box-border rounded-md px-2 py-1.5 border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" />
                                                    <input type="text" placeholder="Pay Terms (e.g. Net30)" value={booking.paymentTerms} onChange={e => updateBookingField(booking.id, 'paymentTerms', e.target.value)} className="w-1/3 text-xs box-border rounded-md px-2 py-1.5 border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
