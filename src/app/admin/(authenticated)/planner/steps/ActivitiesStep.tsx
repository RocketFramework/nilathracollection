"use client";

import { TripData, ActivityBooking } from "../types";
import { Compass, Search, MapPin, Clock, Plus, Trash2, Check, AlertTriangle, Users, Calendar, Map, Activity as ActivityIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Activity, fetchActivities } from "@/data/activities";
import { MasterDataService, Vendor } from "@/services/master-data.service";

export function ActivitiesStep({ tripData, updateActivities }: { tripData: TripData, updateActivities: (acts: ActivityBooking[]) => void }) {

    const [allActivities, setAllActivities] = useState<Activity[]>([]);
    const [allVendors, setAllVendors] = useState<Vendor[]>([]);
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
                const [data, vendorResult] = await Promise.all([
                    fetchActivities(),
                    MasterDataService.getVendors()
                ]);
                setAllActivities(data);
                setAllVendors(vendorResult.data);
            } catch (error) {
                console.error("Failed to load activities and vendors", error);
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


    const filteredCatalog = allActivities.filter(a =>
        a.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const katunayake = { lat: 7.1725, lng: 79.8853 };
    const calculateRoadDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1.3;
    };

    let totalDistanceInfo = 0;
    let currentLoc = katunayake;
    let totalHours = 0;

    activities.forEach(booking => {
        const act = booking.activityData;
        totalHours += (act.duration_hours || 2);
        if (act.lat && act.lng) {
            totalDistanceInfo += calculateRoadDistance(currentLoc.lat, currentLoc.lng, act.lat, act.lng);
            currentLoc = { lat: act.lat, lng: act.lng };
        }
    });

    if (activities.length > 0) {
        totalDistanceInfo += calculateRoadDistance(currentLoc.lat, currentLoc.lng, katunayake.lat, katunayake.lng);
    }

    // Assuming average speed of 35 km/h for Sri Lanka roads as defined in route-engine CONSTANTS.AVG_SPEED
    const totalTravelHours = totalDistanceInfo > 0 ? totalDistanceInfo / 35 : 0;
    const totalRequiredHours = totalHours + totalTravelHours;

    // Estimate 8 active hours per day for activities + travel
    const daysNeeded = Math.ceil(totalRequiredHours / 8);

    const travelers = (tripData.profile.adults || 0) + (tripData.profile.children || 0) + (tripData.profile.infants || 0);
    const durationDays = tripData.profile.durationDays || 0;

    const daysAvailable = durationDays > 0 ? Math.max(0, durationDays - daysNeeded) : 0;

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-xl font-serif text-brand-green flex items-center gap-2">
                        <Compass size={20} className="text-brand-gold" /> Activity & Experience Curation
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">Select and group your activities. We'll handle routing and vendor assignment later.</p>
                </div>
            </div>

            {/* Trip Metrics Dashboard */}
            <div className="bg-white rounded-2xl p-5 border border-neutral-200 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 items-center shadow-sm">

                <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2.5 rounded-xl shrink-0">
                        <Calendar size={20} className="text-blue-500" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[9px] sm:text-[10px] text-neutral-400 font-bold uppercase tracking-wide truncate">Trip Duration</span>
                        <span className="text-sm sm:text-lg font-bold text-brand-charcoal leading-none mt-0.5">{durationDays} <span className="text-xs font-medium text-neutral-500">Days</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative before:content-[''] before:absolute before:-left-3 before:top-1 before:bottom-1 before:w-px before:bg-neutral-200 hidden md:flex">
                    <div className="bg-orange-50 p-2.5 rounded-xl shrink-0">
                        <ActivityIcon size={20} className="text-orange-500" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[9px] sm:text-[10px] text-neutral-400 font-bold uppercase tracking-wide truncate">Activity Time</span>
                        <span className="text-sm sm:text-lg font-bold text-brand-charcoal leading-none mt-0.5">{totalHours.toFixed(1)} <span className="text-xs font-medium text-neutral-500">hrs</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative before:content-[''] before:absolute before:-left-3 before:top-1 before:bottom-1 before:w-px before:bg-neutral-200 hidden lg:flex">
                    <div className="bg-brand-green/10 p-2.5 rounded-xl shrink-0">
                        <Map size={20} className="text-brand-green" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[9px] sm:text-[10px] text-neutral-400 font-bold uppercase tracking-wide truncate">Distance & Travel</span>
                        <span className="text-sm sm:text-lg font-bold text-brand-charcoal leading-none mt-0.5" title={`${Math.round(totalDistanceInfo)} km`}>
                            {totalTravelHours.toFixed(1)} <span className="text-xs font-medium text-neutral-500">hrs</span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative before:content-[''] before:absolute before:-left-3 before:top-1 before:bottom-1 before:w-px before:bg-neutral-200 hidden sm:flex">
                    <div className="bg-indigo-50 p-2.5 rounded-xl shrink-0">
                        <Clock size={20} className="text-indigo-500" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[9px] sm:text-[10px] text-neutral-400 font-bold uppercase tracking-wide truncate">Days Needed (8h/d)</span>
                        <span className="text-sm sm:text-lg font-bold text-indigo-700 leading-none mt-0.5">{daysNeeded} <span className="text-xs font-medium text-neutral-500">Days</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative before:content-[''] before:absolute before:-left-3 before:top-1 before:bottom-1 before:w-px before:bg-neutral-200 hidden lg:flex">
                    <div className={`p-2.5 rounded-xl shrink-0 ${daysAvailable > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <AlertTriangle size={20} className={daysAvailable > 0 ? 'text-green-500' : 'text-red-500'} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[9px] sm:text-[10px] text-neutral-400 font-bold uppercase tracking-wide truncate">Days Available</span>
                        <span className={`text-sm sm:text-lg font-bold leading-none mt-0.5 ${daysAvailable > 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {daysAvailable} <span className="text-xs font-medium opacity-70">Days</span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative lg:before:content-[''] lg:before:absolute lg:before:-left-3 lg:before:top-1 lg:before:bottom-1 lg:before:w-px lg:before:bg-neutral-200">
                    <div className="bg-purple-50 p-2.5 rounded-xl shrink-0">
                        <Users size={20} className="text-purple-500" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[9px] sm:text-[10px] text-neutral-400 font-bold uppercase tracking-wide truncate">Travelers</span>
                        <span className="text-sm sm:text-lg font-bold text-brand-charcoal leading-none mt-0.5">{travelers} <span className="text-xs font-medium text-neutral-500">Pax</span></span>
                    </div>
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

                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>


        </div>
    );
}
