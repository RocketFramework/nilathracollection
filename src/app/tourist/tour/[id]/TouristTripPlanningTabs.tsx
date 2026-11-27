'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Compass,
    Loader2,
    MapPin,
    Plus,
    Save,
    Search,
    Sparkles,
    Trash2,
    User,
    UserPlus,
    Users,
} from 'lucide-react';
import type { TouristDataDTO, TouristTeamMemberDTO, TravelPreferencesDTO } from '@/dtos/tourist-data.dto';
import type {
    ProposedHotelOptionDTO,
    TourProposedHotelDTO,
    TourRouteStopDTO,
} from '@/dtos/tour-planning.dto';
import { TRAVEL_STYLES, type Gender, type TravelStyle } from '@/types/types';
import {
    getTouristTripPlanningDataAction,
    saveTouristOwnActivitiesAction,
    saveTouristOwnDataAction,
    saveTouristOwnProposedHotelsAction,
} from '@/actions/tourist.actions';
import TouristActivityAndRoutePreferences from '@/app/admin-new/components/TouristActivityAndRoutePreferences';
import ProposedHotelsStep from '@/app/admin-new/components/ProposedHotelsStep';

export type TouristPlanningScreen = 'tourist-data' | 'activity-selection' | 'proposed-hotels';

interface TouristTripPlanningTabsProps {
    tourId: string;
    activeScreen: TouristPlanningScreen;
}

const ACTIVITY_FILTER_CATS = [
    'All',
    'Adventure',
    'Beach',
    'Cultural & Heritage',
    'Nature',
    'Casino',
    'Food & Drink',
    'Urban',
    'Nature & Wildlife',
    'Cultural',
    'Wildlife',
    'Wellness',
    'Food',
    'Water Sports',
];

export default function TouristTripPlanningTabs({
    tourId,
    activeScreen,
}: TouristTripPlanningTabsProps) {
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [touristData, setTouristData] = useState<TouristDataDTO | null>(null);
    const [activitiesList, setActivitiesList] = useState<any[]>([]);
    const [hotelsList, setHotelsList] = useState<ProposedHotelOptionDTO[]>([]);
    const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
    const [activityDateMap, setActivityDateMap] = useState<Record<number, string>>({});
    const [proposedHotels, setProposedHotels] = useState<TourProposedHotelDTO[]>([]);

    // Tourist Data sub-tab
    const [dataTab, setDataTab] = useState<'profile' | 'preferences' | 'team'>('profile');
    const [savingData, setSavingData] = useState(false);
    const [dataMsg, setDataMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    // Companion add form
    const [addingMember, setAddingMember] = useState(false);
    const [newMember, setNewMember] = useState<Omit<TouristTeamMemberDTO, 'id'>>({
        full_name: '',
        passport_number: '',
        nationality: '',
        date_of_birth: '',
        gender: 'Male' as Gender,
        dietary_preferences: '',
        meal_preference: 'Standard',
        room_preference: 'Double',
        medical_notes: '',
    });

    // Activity Selection UI state
    const [activitySearch, setActivitySearch] = useState('');
    const [activityCat, setActivityCat] = useState('All');
    const [mobileActPane, setMobileActPane] = useState<'browse' | 'selected'>('selected');
    const [savingActs, setSavingActs] = useState(false);
    const [actMsg, setActMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
    const [activeAlertId, setActiveAlertId] = useState<number | null>(null);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setLoadError('');
        getTouristTripPlanningDataAction(tourId)
            .then((res) => {
                if (!alive) return;
                if (!res.success || !res.data) {
                    setLoadError(res.error || 'Could not load your trip details.');
                    return;
                }
                setTouristData(res.data.touristData);
                setActivitiesList(res.data.activities || []);
                setHotelsList(res.data.hotels || []);
                setProposedHotels(res.data.schedule?.proposedHotels || []);

                const dbActs = res.data.schedule?.activitySelections || [];
                setSelectedActivityIds(dbActs.map((a) => a.activity_id));
                const dMap: Record<number, string> = {};
                dbActs.forEach((a) => {
                    if (a.tour_date) dMap[a.activity_id] = a.tour_date;
                });
                setActivityDateMap(dMap);
            })
            .catch((e: any) => {
                if (alive) setLoadError(e?.message || 'Failed to load trip planning data.');
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [tourId]);

    const preferredCategories = touristData?.preferences?.activity_preferences || [];

    const routeStops: TourRouteStopDTO[] = useMemo(() => {
        if (!touristData) return [];
        if (touristData.preferences.travel_route && touristData.preferences.travel_route.length > 0) {
            return touristData.preferences.travel_route;
        }
        return (touristData.preferences.travel_locations || []).map((loc, idx) => ({
            stop_order: idx + 1,
            location_name: loc,
            tour_date: '',
            day_number: idx + 1,
        }));
    }, [touristData]);

    const selectedActivities = useMemo(() => {
        const byId = new Map<number, any>();
        activitiesList.forEach((a) => byId.set(a.id, a));
        return selectedActivityIds.map((id) => byId.get(id)).filter(Boolean);
    }, [selectedActivityIds, activitiesList]);

    const activityDaySlots = useMemo(() => {
        const byDate = new Map<string, { date: string; dayNumber: number; location: string }>();
        const addDays = (isoDate: string, days: number) => {
            const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
            if (Number.isNaN(d.getTime())) return '';
            d.setUTCDate(d.getUTCDate() + days);
            return d.toISOString().slice(0, 10);
        };
        const arrival = touristData?.preferences?.arrival_date || '';
        const departure = touristData?.preferences?.departure_date || '';
        const dur = touristData?.preferences?.duration_days || 0;

        routeStops.forEach((stop, idx) => {
            const d = stop.tour_date ? stop.tour_date.slice(0, 10) : (arrival ? addDays(arrival, idx) : '');
            if (!d) return;
            if (!byDate.has(d)) {
                byDate.set(d, { date: d, dayNumber: stop.day_number ?? idx + 1, location: stop.location_name || '' });
            } else if (stop.location_name && !byDate.get(d)!.location) {
                byDate.get(d)!.location = stop.location_name;
            }
        });

        if (arrival) {
            const start = new Date(`${arrival.slice(0, 10)}T00:00:00Z`);
            let totalDays = dur;
            if (departure) {
                const end = new Date(`${departure.slice(0, 10)}T00:00:00Z`);
                if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end >= start) {
                    totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                }
            }
            for (let i = 0; i < totalDays; i++) {
                const d = addDays(arrival, i);
                if (d && !byDate.has(d)) {
                    byDate.set(d, { date: d, dayNumber: i + 1, location: '' });
                }
            }
        }

        selectedActivities.forEach((act) => {
            const d = activityDateMap[act.id];
            if (d && !byDate.has(d)) {
                byDate.set(d, { date: d, dayNumber: byDate.size + 1, location: act.location_name || act.district || '' });
            }
        });

        return Array.from(byDate.values())
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((slot, idx) => ({ ...slot, dayNumber: idx + 1 }));
    }, [routeStops, touristData?.preferences?.arrival_date, touristData?.preferences?.departure_date, touristData?.preferences?.duration_days, selectedActivities, activityDateMap]);

    const filteredActivities = useMemo(() => {
        const q = activitySearch.trim().toLowerCase();
        return activitiesList.filter((a) => {
            const matchCat = activityCat === 'All' || a.category === activityCat;
            if (!matchCat) return false;
            if (!q) return true;
            return (
                (a.activity_name || '').toLowerCase().includes(q) ||
                (a.location_name || '').toLowerCase().includes(q) ||
                (a.district || '').toLowerCase().includes(q) ||
                (a.description || '').toLowerCase().includes(q)
            );
        });
    }, [activitiesList, activitySearch, activityCat]);

    const resolveAutoDateForActivity = (
        actId: number,
        existingIds: number[],
        currentMap: Record<number, string>
    ): string => {
        const act = activitiesList.find((a) => a.id === actId);
        if (!act || routeStops.length === 0) return '';
        const norm = (v?: string | null) => String(v || '').trim().toLowerCase();
        const actLoc = norm(act.location_name);
        const actDist = norm(act.district);

        const matchingDates = Array.from(
            new Set(
                routeStops
                    .filter((stop) => {
                        if (!stop.tour_date) return false;
                        const stopLoc = norm(stop.location_name);
                        if (!stopLoc) return false;
                        return (
                            (actLoc && (stopLoc === actLoc || actLoc.includes(stopLoc) || stopLoc.includes(actLoc))) ||
                            (actDist && (stopLoc === actDist || actDist.includes(stopLoc) || stopLoc.includes(actDist)))
                        );
                    })
                    .sort((a, b) => a.tour_date.localeCompare(b.tour_date) || a.stop_order - b.stop_order)
                    .map((s) => s.tour_date.slice(0, 10))
            )
        );
        if (matchingDates.length === 0) return '';
        if (matchingDates.length === 1) return matchingDates[0];

        const counts: Record<string, number> = {};
        matchingDates.forEach((d) => {
            counts[d] = 0;
        });
        existingIds.forEach((eid) => {
            if (eid === actId) return;
            const d = currentMap[eid];
            if (d && counts[d] !== undefined) counts[d] += 1;
        });

        let best = matchingDates[0];
        for (const d of matchingDates) {
            if (counts[d] < counts[best]) best = d;
        }
        return best;
    };

    const handleToggleActivity = (id: number) => {
        if (selectedActivityIds.includes(id)) {
            setSelectedActivityIds((prev) => prev.filter((x) => x !== id));
        } else {
            const autoDate = resolveAutoDateForActivity(id, selectedActivityIds, activityDateMap);
            setSelectedActivityIds((prev) => [...prev, id]);
            if (autoDate) {
                setActivityDateMap((prev) => (prev[id] ? prev : { ...prev, [id]: autoDate }));
            }
        }
    };

    const updateProfile = (key: keyof TouristDataDTO['profile'], val: string) => {
        setTouristData((prev) => (prev ? { ...prev, profile: { ...prev.profile, [key]: val } } : prev));
    };

    const updatePref = <K extends keyof TravelPreferencesDTO>(key: K, val: TravelPreferencesDTO[K]) => {
        setTouristData((prev) => {
            if (!prev) return prev;
            const nextPrefs = { ...prev.preferences, [key]: val };
            if (key === 'budget_total' || key === 'adults') {
                const pax = Math.max(Number(nextPrefs.adults || 1), 1);
                nextPrefs.budget_per_person = Math.round((Number(nextPrefs.budget_total || 0) / pax) * 100) / 100;
            }
            if ((key === 'arrival_date' || key === 'departure_date') && nextPrefs.arrival_date && nextPrefs.departure_date) {
                const a = new Date(nextPrefs.arrival_date);
                const d = new Date(nextPrefs.departure_date);
                if (!Number.isNaN(a.getTime()) && !Number.isNaN(d.getTime()) && d >= a) {
                    nextPrefs.duration_days = Math.round((d.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                }
            }
            return { ...prev, preferences: nextPrefs };
        });
    };

    const handleSaveTouristData = async () => {
        if (!touristData) return;
        setSavingData(true);
        setDataMsg(null);
        try {
            const res = await saveTouristOwnDataAction(tourId, touristData);
            if (res.success) {
                setDataMsg({ type: 'ok', text: 'Your details and travel preferences have been saved.' });
            } else {
                setDataMsg({ type: 'err', text: res.error || 'Failed to save your details.' });
            }
        } finally {
            setSavingData(false);
        }
    };

    const handleSaveActivities = async () => {
        setSavingActs(true);
        setActMsg(null);
        try {
            const payload = selectedActivities.map((act, idx) => ({
                activity_id: act.id,
                tour_date: activityDateMap[act.id] || '',
                sort_order: idx + 1,
            }));
            const res = await saveTouristOwnActivitiesAction(tourId, payload);
            if (res.success) {
                setActMsg({ type: 'ok', text: 'Your selected activities and dates have been saved.' });
            } else {
                setActMsg({ type: 'err', text: res.error || 'Failed to save activities.' });
            }
        } finally {
            setSavingActs(false);
        }
    };

    const handleAddCompanion = () => {
        if (!touristData || !newMember.full_name.trim()) return;
        const member: TouristTeamMemberDTO = {
            id: crypto.randomUUID(),
            ...newMember,
        };
        setTouristData((prev) => (prev ? { ...prev, team: [...prev.team, member] } : prev));
        setNewMember({
            full_name: '',
            passport_number: '',
            nationality: '',
            date_of_birth: '',
            gender: 'Male' as Gender,
            dietary_preferences: '',
            meal_preference: 'Standard',
            room_preference: 'Double',
            medical_notes: '',
        });
        setAddingMember(false);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-3xl border border-neutral-200 p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
                <p className="text-sm text-neutral-500 font-medium">Loading your trip workspace...</p>
            </div>
        );
    }

    if (loadError || !touristData) {
        return (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-700 text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{loadError || 'Unable to load trip data.'}</span>
            </div>
        );
    }

    const inputCls =
        'w-full px-3.5 py-3 rounded-xl border border-neutral-200 bg-white text-base sm:text-sm text-neutral-800 font-medium focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20';

    /* =========================================================================
     * SCREEN 1: TOURIST DATA (Mobile-First Profile, Preferences & Companions)
     * ========================================================================= */
    if (activeScreen === 'tourist-data') {
        return (
            <div className="space-y-4 pb-20 sm:pb-6">
                {/* Mobile-friendly Segmented Sub-tabs */}
                <div className="bg-white p-1.5 rounded-2xl border border-neutral-200 shadow-xs grid grid-cols-3 gap-1">
                    {[
                        { id: 'profile', label: 'My Profile', icon: User },
                        { id: 'preferences', label: 'Preferences', icon: Sparkles },
                        { id: 'team', label: `Companions (${touristData.team.length})`, icon: Users },
                    ].map((t) => {
                        const Icon = t.icon;
                        const active = dataTab === t.id;
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setDataTab(t.id as any)}
                                className={`min-h-[44px] px-2 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                    active
                                        ? 'bg-brand-green text-white shadow-sm'
                                        : 'text-neutral-600 hover:bg-neutral-100'
                                }`}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                <span className="truncate">{t.label}</span>
                            </button>
                        );
                    })}
                </div>

                {dataMsg && (
                    <div
                        className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                            dataMsg.type === 'ok'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}
                    >
                        {dataMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                        <span>{dataMsg.text}</span>
                    </div>
                )}

                {dataTab === 'profile' && (
                    <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 space-y-4 shadow-xs">
                        <h3 className="text-lg font-serif font-bold text-neutral-800">Personal Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">First Name</label>
                                <input className={inputCls} value={touristData.profile.first_name} onChange={(e) => updateProfile('first_name', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Last Name</label>
                                <input className={inputCls} value={touristData.profile.last_name} onChange={(e) => updateProfile('last_name', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Email</label>
                                <input className={inputCls + ' bg-neutral-50 text-neutral-500'} value={touristData.profile.email} disabled />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Phone / WhatsApp</label>
                                <input className={inputCls} value={touristData.profile.phone} onChange={(e) => updateProfile('phone', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Country</label>
                                <input className={inputCls} value={touristData.profile.country} onChange={(e) => updateProfile('country', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Passport Number</label>
                                <input className={inputCls} value={touristData.profile.passport_number} onChange={(e) => updateProfile('passport_number', e.target.value)} />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Address</label>
                                <textarea rows={2} className={inputCls} value={touristData.profile.address} onChange={(e) => updateProfile('address', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                {dataTab === 'preferences' && (
                    <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 space-y-5 shadow-xs">
                        <div>
                            <h3 className="text-lg font-serif font-bold text-neutral-800">Travel Preferences &amp; Route</h3>
                            <p className="text-xs text-neutral-500 mt-0.5">Update your travel style, dates, activity interests, and preferred Sri Lanka route.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Travel Style</label>
                                <select
                                    value={touristData.preferences.travel_style}
                                    onChange={(e) => updatePref('travel_style', e.target.value as TravelStyle)}
                                    className={inputCls}
                                >
                                    {TRAVEL_STYLES.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Arrival Date</label>
                                <input type="date" className={inputCls} value={touristData.preferences.arrival_date} onChange={(e) => updatePref('arrival_date', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Departure Date</label>
                                <input type="date" className={inputCls} value={touristData.preferences.departure_date} onChange={(e) => updatePref('departure_date', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-3 gap-2 sm:col-span-3">
                                <div>
                                    <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Adults</label>
                                    <input type="number" min={1} className={inputCls} value={touristData.preferences.adults} onChange={(e) => updatePref('adults', Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Children</label>
                                    <input type="number" min={0} className={inputCls} value={touristData.preferences.children} onChange={(e) => updatePref('children', Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Infants</label>
                                    <input type="number" min={0} className={inputCls} value={touristData.preferences.infants} onChange={(e) => updatePref('infants', Number(e.target.value))} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Total Budget ($)</label>
                                <input type="number" className={inputCls} value={touristData.preferences.budget_total} onChange={(e) => updatePref('budget_total', Number(e.target.value))} />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Language</label>
                                <input className={inputCls} value={touristData.preferences.language_preference} onChange={(e) => updatePref('language_preference', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Departure Country</label>
                                <input className={inputCls} value={touristData.preferences.departure_country} onChange={(e) => updatePref('departure_country', e.target.value)} />
                            </div>

                            {/* Activity Categories & Ordered Dated Travel Route */}
                            <TouristActivityAndRoutePreferences
                                selectedCategories={touristData.preferences.activity_preferences || []}
                                onCategoriesChange={(cats) => updatePref('activity_preferences', cats)}
                                travelLocations={touristData.preferences.travel_locations || []}
                                onTravelLocationsChange={(locs) => updatePref('travel_locations', locs)}
                                travelRoute={touristData.preferences.travel_route || []}
                                onTravelRouteChange={(stops) =>
                                    setTouristData((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  preferences: {
                                                      ...prev.preferences,
                                                      travel_route: stops,
                                                      travel_locations: stops.map((s) => s.location_name),
                                                  },
                                              }
                                            : prev
                                    )
                                }
                                arrivalDate={touristData.preferences.arrival_date}
                                extraCategories={activitiesList.map((a) => a.category).filter(Boolean)}
                                extraLocations={activitiesList.map((a) => a.district).filter(Boolean)}
                            />

                            <div className="sm:col-span-3">
                                <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Dietary Requirements</label>
                                <textarea rows={2} className={inputCls} value={touristData.preferences.dietary_requirements} onChange={(e) => updatePref('dietary_requirements', e.target.value)} placeholder="e.g. Vegetarian, Halal, allergies" />
                            </div>
                            <div className="sm:col-span-3">
                                <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Medical / Accessibility Notes</label>
                                <textarea rows={2} className={inputCls} value={touristData.preferences.medical_conditions} onChange={(e) => updatePref('medical_conditions', e.target.value)} placeholder="Any health or mobility requirements" />
                            </div>
                            <div className="sm:col-span-3">
                                <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1">Special Notes</label>
                                <textarea rows={2} className={inputCls} value={touristData.preferences.special_notes} onChange={(e) => updatePref('special_notes', e.target.value)} placeholder="Celebrations, room view requests, etc." />
                            </div>
                        </div>
                    </div>
                )}

                {dataTab === 'team' && (
                    <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 space-y-4 shadow-xs">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg font-serif font-bold text-neutral-800">Travel Companions</h3>
                            <button
                                type="button"
                                onClick={() => setAddingMember((v) => !v)}
                                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5"
                            >
                                <UserPlus className="w-4 h-4" /> Add Companion
                            </button>
                        </div>

                        {addingMember && (
                            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input className={inputCls} placeholder="Full Name *" value={newMember.full_name} onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })} />
                                    <input className={inputCls} placeholder="Nationality" value={newMember.nationality} onChange={(e) => setNewMember({ ...newMember, nationality: e.target.value })} />
                                    <input className={inputCls} placeholder="Passport Number" value={newMember.passport_number} onChange={(e) => setNewMember({ ...newMember, passport_number: e.target.value })} />
                                    <input type="date" className={inputCls} value={newMember.date_of_birth} onChange={(e) => setNewMember({ ...newMember, date_of_birth: e.target.value })} />
                                    <input className={inputCls} placeholder="Dietary Preferences" value={newMember.dietary_preferences} onChange={(e) => setNewMember({ ...newMember, dietary_preferences: e.target.value })} />
                                    <input className={inputCls} placeholder="Room Preference (Double / Single)" value={newMember.room_preference} onChange={(e) => setNewMember({ ...newMember, room_preference: e.target.value })} />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setAddingMember(false)} className="px-4 py-2 text-xs font-bold text-neutral-500">Cancel</button>
                                    <button type="button" onClick={handleAddCompanion} className="px-4 py-2 rounded-xl bg-brand-green text-white text-xs font-bold">Add</button>
                                </div>
                            </div>
                        )}

                        {touristData.team.length === 0 ? (
                            <p className="text-xs text-neutral-400 text-center py-8 border border-dashed border-neutral-200 rounded-2xl">
                                No companions added yet. Tap <strong>Add Companion</strong> to include family or group travelers.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {touristData.team.map((m) => (
                                    <div key={m.id} className="p-4 rounded-2xl border border-neutral-200 flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="font-bold text-sm text-neutral-800">{m.full_name}</div>
                                            <div className="text-xs text-neutral-500 mt-0.5">
                                                {m.nationality || 'Nationality N/A'} · Room: {m.room_preference || 'Double'}
                                            </div>
                                            {m.dietary_preferences && (
                                                <div className="text-xs text-amber-700 mt-1">Dietary: {m.dietary_preferences}</div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setTouristData((prev) => (prev ? { ...prev, team: prev.team.filter((x) => x.id !== m.id) } : prev))}
                                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50"
                                            title="Remove companion"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Sticky Mobile Save Bar */}
                <div className="sticky bottom-3 z-30">
                    <button
                        type="button"
                        onClick={handleSaveTouristData}
                        disabled={savingData}
                        className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-brand-green hover:bg-emerald-900 text-white text-sm font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {savingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>{savingData ? 'Saving...' : 'Save My Details & Preferences'}</span>
                    </button>
                </div>
            </div>
        );
    }

    /* =========================================================================
     * SCREEN 2: ACTIVITY SELECTION (Mobile-First Browse + Selected Toggle)
     * ========================================================================= */
    if (activeScreen === 'activity-selection') {
        return (
            <div className="space-y-4 pb-20 sm:pb-6">
                {/* Route Preview Strip (hidden on mobile) */}
                {routeStops.length > 0 && (
                    <div className="hidden sm:flex bg-emerald-50/80 border border-emerald-200/80 rounded-2xl px-3.5 py-2.5 text-xs text-emerald-900 font-medium flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mr-1">Route:</span>
                        {routeStops.map((stop, idx) => (
                            <React.Fragment key={`t-route-${idx}-${stop.location_name}`}>
                                <span className="font-semibold">
                                    {stop.location_name}
                                    {stop.tour_date && (
                                        <span className="text-[10px] font-mono text-emerald-700/80 ml-1">({stop.tour_date})</span>
                                    )}
                                </span>
                                {idx < routeStops.length - 1 && <span className="text-emerald-500 font-bold">→</span>}
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {actMsg && (
                    <div
                        className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                            actMsg.type === 'ok'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}
                    >
                        {actMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                        <span>{actMsg.text}</span>
                    </div>
                )}

                {/* Mobile Switcher: Selected first, Browse second */}
                <div className="lg:hidden bg-white p-1.5 rounded-2xl border border-neutral-200 grid grid-cols-2 gap-1">
                    <button
                        type="button"
                        onClick={() => setMobileActPane('selected')}
                        className={`min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
                            mobileActPane === 'selected' ? 'bg-brand-green text-white shadow-sm' : 'text-neutral-600'
                        }`}
                    >
                        <Check className="w-4 h-4" /> Selected ({selectedActivities.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobileActPane('browse')}
                        className={`min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
                            mobileActPane === 'browse' ? 'bg-brand-green text-white shadow-sm' : 'text-neutral-600'
                        }`}
                    >
                        <Compass className="w-4 h-4" /> Browse ({filteredActivities.length})
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Browse Column (displayed second on desktop via lg:order-2) */}
                    <div className={`lg:col-span-7 lg:order-2 space-y-4 ${mobileActPane === 'selected' ? 'hidden lg:block' : ''}`}>
                        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200 shadow-xs space-y-3">
                            <div className="relative">
                                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                                <input
                                    type="text"
                                    value={activitySearch}
                                    onChange={(e) => setActivitySearch(e.target.value)}
                                    placeholder="Search activities, cities, or districts..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-base sm:text-sm focus:outline-none focus:border-brand-green"
                                />
                            </div>
                            {/* Horizontally scrollable category pills on mobile */}
                            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
                                {ACTIVITY_FILTER_CATS.map((cat) => {
                                    const isPreferred = cat !== 'All' && preferredCategories.includes(cat);
                                    const isActive = activityCat === cat;
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setActivityCat(cat)}
                                            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-all ${
                                                isActive
                                                    ? isPreferred
                                                        ? 'bg-amber-600 text-white ring-2 ring-amber-300'
                                                        : 'bg-brand-green text-white'
                                                    : isPreferred
                                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                                        : 'bg-neutral-100 text-neutral-600'
                                            }`}
                                        >
                                            {isPreferred && <span>★</span>}
                                            <span>{cat}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {filteredActivities.slice(0, 60).map((act) => {
                                const isSelected = selectedActivityIds.includes(act.id);
                                const isOutside = isSelected && preferredCategories.length > 0 && !preferredCategories.includes(act.category);
                                return (
                                    <div
                                        key={act.id}
                                        className={`bg-white rounded-3xl overflow-hidden border shadow-xs transition-all ${
                                            isOutside
                                                ? 'border-amber-400 bg-amber-50/20'
                                                : isSelected
                                                    ? 'border-emerald-600/40 bg-emerald-50/10'
                                                    : 'border-neutral-200'
                                        }`}
                                    >
                                        {act.images?.[0] && (
                                            <div className="relative h-40 w-full bg-neutral-100">
                                                <img src={act.images[0]} alt={act.activity_name} className="w-full h-full object-cover" />
                                                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-[10px] font-bold uppercase text-neutral-700 shadow-xs">
                                                    {act.category}
                                                </span>
                                            </div>
                                        )}
                                        <div className="p-4 space-y-2.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="font-serif font-bold text-base text-neutral-900 leading-snug">
                                                    {act.activity_name}
                                                </h4>
                                                {isOutside && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveAlertId((prev) => (prev === act.id ? null : act.id))}
                                                        className="p-1 text-amber-600 shrink-0"
                                                        title={`Outside your preferred activity categories (${act.category})`}
                                                    >
                                                        <AlertCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            {isOutside && activeAlertId === act.id && (
                                                <div className="text-[11px] bg-amber-100 text-amber-900 border border-amber-300 rounded-xl px-3 py-2 font-medium">
                                                    Note: &ldquo;{act.activity_name}&rdquo; ({act.category}) is outside your saved preferred activity categories.
                                                </div>
                                            )}
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-brand-gold" /> {act.location_name || act.district}</span>
                                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-neutral-400" /> {act.duration_hours} hrs</span>
                                            </div>
                                            {act.description && (
                                                <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">{act.description}</p>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleToggleActivity(act.id)}
                                                className={`w-full min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                                    isSelected
                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                        : 'bg-brand-green text-white'
                                                }`}
                                            >
                                                {isSelected ? <><Check className="w-4 h-4" /> Selected (Tap to Remove)</> : <><Plus className="w-4 h-4" /> Add to My Tour</>}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selected Activities Column — displayed first (lg:order-1) */}
                    <div className={`lg:col-span-5 lg:order-1 space-y-4 ${mobileActPane === 'browse' ? 'hidden lg:block' : ''}`}>
                        <div className="bg-white rounded-3xl border border-neutral-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="text-base font-serif font-bold text-neutral-800 flex items-center gap-2">
                                    <Compass className="w-5 h-5 text-emerald-800" />
                                    My Selected Activities
                                </h3>
                                <p className="text-xs text-neutral-400 mt-0.5">Organized by tour day and location.</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleSaveActivities}
                                disabled={savingActs}
                                className="min-h-[40px] px-4 py-2 rounded-xl bg-brand-green hover:bg-emerald-900 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                            >
                                {savingActs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                <span>{savingActs ? 'Saving...' : 'Save Activities'}</span>
                            </button>
                        </div>

                        {selectedActivities.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-dashed border-neutral-200 py-10 px-6 text-center text-xs text-neutral-400">
                                No activities selected yet. Switch to <strong>Browse</strong> to add experiences.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activityDaySlots
                                    .filter((slot) => selectedActivities.some((a) => activityDateMap[a.id] === slot.date))
                                    .map((slot) => {
                                        const dayActs = selectedActivities.filter((a) => activityDateMap[a.id] === slot.date);
                                        const displayLocation =
                                            slot.location ||
                                            dayActs[0]?.location_name ||
                                            dayActs[0]?.district ||
                                            '';
                                        return (
                                            <div
                                                key={slot.date}
                                                className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden"
                                            >
                                                {/* Day Card Header (matching Proposed Hotels template) */}
                                                <div className="px-5 py-3.5 bg-neutral-50/80 border-b border-neutral-200/80 flex flex-wrap items-center gap-2.5">
                                                    <span className="px-3 py-1 rounded-xl bg-emerald-800 text-white text-xs font-extrabold">
                                                        Day {slot.dayNumber}
                                                    </span>
                                                    <span className="text-sm font-mono font-bold text-neutral-800 flex items-center gap-1.5">
                                                        <Calendar className="w-4 h-4 text-emerald-700" />
                                                        {slot.date}
                                                    </span>
                                                    {displayLocation && (
                                                        <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1">
                                                            <MapPin className="w-3.5 h-3.5 text-amber-600" />
                                                            {displayLocation}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Day Activities with Images */}
                                                <div className="p-4 space-y-3">
                                                    {dayActs.map((act) => {
                                                        const isOutside = preferredCategories.length > 0 && !preferredCategories.includes(act.category);
                                                        return (
                                                            <div
                                                                key={act.id}
                                                                className={`rounded-2xl border overflow-hidden transition-all ${
                                                                    isOutside
                                                                        ? 'border-amber-300 bg-amber-50/30'
                                                                        : 'border-neutral-200 bg-neutral-50/40'
                                                                }`}
                                                            >
                                                                {act.images?.[0] ? (
                                                                    <div className="relative h-36 w-full bg-neutral-100">
                                                                        <img
                                                                            src={act.images[0]}
                                                                            alt={act.activity_name}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                        {act.category && (
                                                                            <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white/95 text-[10px] font-bold uppercase text-neutral-700 shadow-xs">
                                                                                {act.category}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="h-20 w-full bg-neutral-100 flex items-center justify-center text-neutral-300">
                                                                        <Compass className="w-6 h-6" />
                                                                    </div>
                                                                )}

                                                                <div className="p-3.5 space-y-2">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="min-w-0">
                                                                            <h4 className="text-sm font-serif font-bold text-neutral-900 leading-snug">
                                                                                {act.activity_name}
                                                                            </h4>
                                                                            <div className="flex flex-wrap items-center gap-2.5 mt-1 text-[11px] text-neutral-500 font-medium">
                                                                                <span className="flex items-center gap-1">
                                                                                    <MapPin className="w-3 h-3 text-brand-gold" />
                                                                                    {act.location_name || act.district || 'Sri Lanka'}
                                                                                </span>
                                                                                <span className="flex items-center gap-1">
                                                                                    <Clock className="w-3 h-3 text-neutral-400" />
                                                                                    {act.duration_hours} hrs
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleToggleActivity(act.id)}
                                                                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 shrink-0"
                                                                            title="Remove activity"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>

                                                                    {act.description && (
                                                                        <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                                                                            {act.description}
                                                                        </p>
                                                                    )}

                                                                    {isOutside && (
                                                                        <div className="text-[11px] text-amber-800 bg-amber-100/70 border border-amber-200 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 font-medium">
                                                                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                                                                            <span>Outside your preferred categories ({act.category})</span>
                                                                        </div>
                                                                    )}

                                                                    <div className="flex items-center gap-2 pt-1">
                                                                        <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                                                        <input
                                                                            type="date"
                                                                            min={touristData.preferences.arrival_date || undefined}
                                                                            value={activityDateMap[act.id] || ''}
                                                                            onChange={(e) => setActivityDateMap((prev) => ({ ...prev, [act.id]: e.target.value }))}
                                                                            className="flex-1 px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-mono font-semibold text-neutral-800"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}

                                {/* Unscheduled Activities (if any selected activity has no date assigned yet) */}
                                {(() => {
                                    const unscheduled = selectedActivities.filter((a) => !activityDateMap[a.id]);
                                    if (unscheduled.length === 0) return null;
                                    return (
                                        <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
                                            <div className="px-5 py-3.5 bg-neutral-50/80 border-b border-neutral-200/80 flex items-center gap-2">
                                                <span className="px-3 py-1 rounded-xl bg-neutral-700 text-white text-xs font-extrabold">
                                                    Unscheduled
                                                </span>
                                                <span className="text-xs text-neutral-500 font-medium">Pick a tour date below</span>
                                            </div>
                                            <div className="p-4 space-y-3">
                                                {unscheduled.map((act) => {
                                                    const isOutside = preferredCategories.length > 0 && !preferredCategories.includes(act.category);
                                                    return (
                                                        <div
                                                            key={act.id}
                                                            className={`rounded-2xl border overflow-hidden ${
                                                                isOutside ? 'border-amber-300 bg-amber-50/30' : 'border-neutral-200 bg-neutral-50/40'
                                                            }`}
                                                        >
                                                            {act.images?.[0] && (
                                                                <div className="relative h-32 w-full bg-neutral-100">
                                                                    <img src={act.images[0]} alt={act.activity_name} className="w-full h-full object-cover" />
                                                                </div>
                                                            )}
                                                            <div className="p-3.5 space-y-2">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="min-w-0">
                                                                        <h4 className="text-sm font-serif font-bold text-neutral-900">{act.activity_name}</h4>
                                                                        <div className="text-[11px] text-neutral-500 mt-0.5">
                                                                            {act.location_name || act.district} · {act.duration_hours} hrs
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleToggleActivity(act.id)}
                                                                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 shrink-0"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                                                    <input
                                                                        type="date"
                                                                        min={touristData.preferences.arrival_date || undefined}
                                                                        value={activityDateMap[act.id] || ''}
                                                                        onChange={(e) => setActivityDateMap((prev) => ({ ...prev, [act.id]: e.target.value }))}
                                                                        className="flex-1 px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-mono font-semibold text-neutral-800"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /* =========================================================================
     * SCREEN 3: PROPOSED HOTELS (Reusing full-DB searchable ProposedHotelsStep)
     * ========================================================================= */
    return (
        <div className="pb-16 sm:pb-6">
            <ProposedHotelsStep
                tourId={tourId}
                arrivalDate={touristData.preferences.arrival_date}
                departureDate={touristData.preferences.departure_date}
                durationDays={touristData.preferences.duration_days}
                travelRoute={routeStops}
                hotels={hotelsList}
                selectedActivities={selectedActivities}
                activityDateMap={activityDateMap}
                proposedHotels={proposedHotels}
                onProposedHotelsChange={setProposedHotels}
                onSaveOverride={(items) => saveTouristOwnProposedHotelsAction(tourId, items)}
                allowImageEditing={false}
            />
        </div>
    );
}
