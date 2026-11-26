'use client';

import React, { useMemo, useState } from 'react';
import {
    ArrowDown,
    ArrowUp,
    Calendar,
    Check,
    Compass,
    GripVertical,
    MapPin,
    Plus,
    Trash2,
} from 'lucide-react';
import type { TourRouteStopDTO } from '@/dtos/tour-planning.dto';

export const ACTIVITY_PREFERENCE_CATEGORIES = [
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
] as const;

export const SRI_LANKA_TOUR_LOCATIONS = [
    // All 25 Sri Lanka Districts
    'Ampara',
    'Anuradhapura',
    'Badulla',
    'Batticaloa',
    'Colombo',
    'Galle',
    'Gampaha',
    'Hambantota',
    'Jaffna',
    'Kalutara',
    'Kandy',
    'Kegalle',
    'Kilinochchi',
    'Kurunegala',
    'Mannar',
    'Matale',
    'Matara',
    'Monaragala',
    'Mullaitivu',
    'Nuwara Eliya',
    'Polonnaruwa',
    'Puttalam',
    'Ratnapura',
    'Trincomalee',
    'Vavuniya',
    // Iconic Sri Lanka Tour Destinations & Towns
    'Ahangama',
    'Ahungalla',
    'Arugam Bay',
    'Bentota',
    'Beruwala',
    'Bundala',
    'Chilaw',
    'Dambulla',
    'Dikwella',
    'Ella',
    'Habarana',
    'Haputale',
    'Hatton',
    'Hikkaduwa',
    'Hiriketiya',
    'Horton Plains',
    'Kalpitiya',
    'Kataragama',
    'Katunayake (BIA Airport)',
    'Kitulgala',
    'Knuckles Mountain Range',
    'Koggala',
    'Minneriya',
    'Mirissa',
    'Negombo',
    'Nilaveli',
    'Pasikudah',
    'Pinnawala',
    'Sigiriya',
    'Sinharaja Rainforest',
    'Tangalle',
    'Tissamaharama',
    'Udawalawe',
    'Unawatuna',
    'Weligama',
    'Wilpattu',
    'Yala',
] as const;

function addDays(isoDate: string, days: number): string {
    if (!isoDate) return '';
    const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return '';
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

function computeDayNumber(arrivalDate: string | undefined, tourDate: string, fallback: number): number {
    if (!arrivalDate || !tourDate) return fallback;
    const start = new Date(`${arrivalDate.slice(0, 10)}T00:00:00Z`);
    const cur = new Date(`${tourDate.slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(cur.getTime())) return fallback;
    const diff = Math.round((cur.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff >= 1 ? diff : fallback;
}

interface TouristActivityAndRoutePreferencesProps {
    selectedCategories: string[];
    onCategoriesChange: (categories: string[]) => void;
    travelLocations: string[];
    onTravelLocationsChange: (locations: string[]) => void;
    travelRoute: TourRouteStopDTO[];
    onTravelRouteChange: (stops: TourRouteStopDTO[]) => void;
    arrivalDate?: string;
    extraCategories?: string[];
    extraLocations?: string[];
}

export default function TouristActivityAndRoutePreferences({
    selectedCategories,
    onCategoriesChange,
    travelLocations,
    onTravelLocationsChange,
    travelRoute,
    onTravelRouteChange,
    arrivalDate,
    extraCategories = [],
    extraLocations = [],
}: TouristActivityAndRoutePreferencesProps) {
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

    // Normalize route stops from travelRoute (falling back to travelLocations if travelRoute is empty)
    const routeStops: TourRouteStopDTO[] = useMemo(() => {
        if (travelRoute && travelRoute.length > 0) return travelRoute;
        return (travelLocations || []).map((loc, idx) => ({
            stop_order: idx + 1,
            location_name: loc,
            tour_date: arrivalDate ? addDays(arrivalDate, idx) : '',
            day_number: idx + 1,
        }));
    }, [travelRoute, travelLocations, arrivalDate]);

    const suggestedNextDate = useMemo(() => {
        if (routeStops.length > 0) {
            const lastDated = [...routeStops].reverse().find((s) => s.tour_date);
            if (lastDated?.tour_date) return addDays(lastDated.tour_date, 1);
        }
        return arrivalDate ? addDays(arrivalDate, routeStops.length) : '';
    }, [routeStops, arrivalDate]);

    const allCategories = useMemo(() => {
        const merged = new Set<string>([...ACTIVITY_PREFERENCE_CATEGORIES]);
        extraCategories.forEach((c) => {
            if (c && c.trim() && c.trim() !== 'All') merged.add(c.trim());
        });
        return Array.from(merged);
    }, [extraCategories]);

    const allLocations = useMemo(() => {
        const merged = new Set<string>([...SRI_LANKA_TOUR_LOCATIONS]);
        extraLocations.forEach((loc) => {
            if (loc && loc.trim()) merged.add(loc.trim());
        });
        return Array.from(merged).sort((a, b) => a.localeCompare(b));
    }, [extraLocations]);

    const commitStops = (nextStops: TourRouteStopDTO[]) => {
        const normalized = nextStops.map((s, idx) => ({
            ...s,
            stop_order: idx + 1,
            day_number: computeDayNumber(arrivalDate, s.tour_date, idx + 1),
        }));
        onTravelRouteChange(normalized);
        onTravelLocationsChange(normalized.map((s) => s.location_name));
    };

    const toggleCategory = (cat: string) => {
        if (selectedCategories.includes(cat)) {
            onCategoriesChange(selectedCategories.filter((c) => c !== cat));
        } else {
            onCategoriesChange([...selectedCategories, cat]);
        }
    };

    const handleAddLocation = () => {
        const loc = selectedLocation.trim();
        if (!loc) return;
        const dateToUse = selectedDate || suggestedNextDate || '';
        commitStops([
            ...routeStops,
            {
                stop_order: routeStops.length + 1,
                location_name: loc,
                tour_date: dateToUse,
                day_number: computeDayNumber(arrivalDate, dateToUse, routeStops.length + 1),
            },
        ]);
        setSelectedLocation('');
        setSelectedDate('');
    };

    const handleDateChange = (index: number, newDate: string) => {
        const next = routeStops.map((stop, i) =>
            i === index ? { ...stop, tour_date: newDate } : stop
        );
        commitStops(next);
    };

    const handleMoveLocation = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= routeStops.length) return;
        const next = [...routeStops];
        const [item] = next.splice(index, 1);
        next.splice(target, 0, item);
        commitStops(next);
    };

    const handleRemoveLocation = (index: number) => {
        commitStops(routeStops.filter((_, i) => i !== index));
    };

    const handleDrop = (targetIdx: number) => {
        if (draggedIdx === null || draggedIdx === targetIdx) {
            setDraggedIdx(null);
            setDragOverIdx(null);
            return;
        }
        const next = [...routeStops];
        const [moved] = next.splice(draggedIdx, 1);
        next.splice(targetIdx, 0, moved);
        commitStops(next);
        setDraggedIdx(null);
        setDragOverIdx(null);
    };

    return (
        <div className="md:col-span-3 space-y-6 pt-2">
            {/* 1. Activity Category Preferences */}
            <div className="bg-neutral-50/70 border border-neutral-200 rounded-2xl p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide flex items-center gap-1.5">
                            <Compass className="w-4 h-4 text-emerald-800" />
                            Activity Preferences
                            {selectedCategories.length > 0 && (
                                <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-800 text-white text-[10px] font-bold">
                                    {selectedCategories.length} selected
                                </span>
                            )}
                        </label>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                            Select the activity categories this tourist is interested in (matches the Activity Selection step).
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onCategoriesChange([...allCategories])}
                            className="text-[10px] font-bold text-emerald-800 hover:underline"
                        >
                            Select All
                        </button>
                        {selectedCategories.length > 0 && (
                            <>
                                <span className="text-neutral-300">·</span>
                                <button
                                    type="button"
                                    onClick={() => onCategoriesChange([])}
                                    className="text-[10px] font-bold text-neutral-500 hover:text-rose-600 hover:underline"
                                >
                                    Clear
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                    {allCategories.map((cat) => {
                        const checked = selectedCategories.includes(cat);
                        return (
                            <label
                                key={cat}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all ${
                                    checked
                                        ? 'bg-emerald-50 border-emerald-700 text-emerald-900 shadow-2xs'
                                        : 'bg-white border-neutral-200 text-neutral-600 hover:border-emerald-400'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleCategory(cat)}
                                    className="sr-only"
                                />
                                <span
                                    className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                                        checked
                                            ? 'bg-emerald-800 border-emerald-800 text-white'
                                            : 'bg-white border-neutral-300'
                                    }`}
                                >
                                    {checked && <Check className="w-3 h-3" />}
                                </span>
                                <span className="truncate">{cat}</span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* 2. Ordered Travel Route / Locations with Tour Dates */}
            <div className="bg-neutral-50/70 border border-neutral-200 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-emerald-800" />
                            Preferred Travel Route &amp; Tour Dates
                            {routeStops.length > 0 && (
                                <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-800 text-white text-[10px] font-bold">
                                    {routeStops.length} stop{routeStops.length === 1 ? '' : 's'}
                                </span>
                            )}
                        </label>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                            Add Sri Lankan districts or tour destinations with their tour dates. Duplicates are allowed (e.g., Colombo on arrival &amp; departure), and stops can be reordered.
                        </p>
                    </div>
                    {routeStops.length > 0 && (
                        <button
                            type="button"
                            onClick={() => commitStops([])}
                            className="text-[10px] font-bold text-neutral-500 hover:text-rose-600 hover:underline"
                        >
                            Clear Route
                        </button>
                    )}
                </div>

                {/* Location Dropdown + Date Picker + Add Button */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                    <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-800 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/20"
                    >
                        <option value="">Select a Sri Lanka district or tour location…</option>
                        {allLocations.map((loc) => (
                            <option key={loc} value={loc}>
                                {loc}
                            </option>
                        ))}
                    </select>
                    <input
                        type="date"
                        min={arrivalDate || undefined}
                        value={selectedDate || suggestedNextDate || arrivalDate || ''}
                        onFocus={() => {
                            if (!selectedDate && arrivalDate) {
                                setSelectedDate(suggestedNextDate || arrivalDate);
                            }
                        }}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        title="Tour date for this location"
                        className="sm:w-44 px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs font-mono font-semibold text-neutral-800 focus:outline-none focus:border-emerald-800"
                    />
                    <button
                        type="button"
                        onClick={handleAddLocation}
                        disabled={!selectedLocation}
                        className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-40 shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        Add to Route
                    </button>
                </div>

                {/* Ordered Route List */}
                {routeStops.length === 0 ? (
                    <div className="bg-white border border-dashed border-neutral-200 rounded-xl p-5 text-center text-xs text-neutral-400">
                        No travel locations added yet. Choose a location and tour date above, then click <strong>Add to Route</strong>.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Visual Route Preview (hidden on mobile to keep Tourist Data compact) */}
                        <div className="hidden sm:flex bg-emerald-50/70 border border-emerald-200/70 rounded-xl px-3.5 py-2.5 text-xs text-emerald-900 font-medium flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mr-1">Route:</span>
                            {routeStops.map((stop, idx) => (
                                <React.Fragment key={`preview-${idx}-${stop.location_name}`}>
                                    <span className="font-semibold">
                                        {stop.location_name}
                                        {stop.tour_date && (
                                            <span className="text-[10px] font-mono text-emerald-700/80 ml-1">({stop.tour_date})</span>
                                        )}
                                    </span>
                                    {idx < routeStops.length - 1 && (
                                        <span className="text-emerald-500 font-bold">→</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Reorderable Stop Items */}
                        <div className="space-y-2">
                            {routeStops.map((stop, idx) => (
                                <div
                                    key={`stop-${idx}-${stop.location_name}-${stop.tour_date}`}
                                    draggable
                                    onDragStart={() => setDraggedIdx(idx)}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragOverIdx(idx);
                                    }}
                                    onDragLeave={() => setDragOverIdx(null)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        handleDrop(idx);
                                    }}
                                    onDragEnd={() => {
                                        setDraggedIdx(null);
                                        setDragOverIdx(null);
                                    }}
                                    className={`flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border bg-white transition-all cursor-grab active:cursor-grabbing ${
                                        dragOverIdx === idx
                                            ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/40'
                                            : draggedIdx === idx
                                                ? 'opacity-50 border-neutral-300'
                                                : 'border-neutral-200 hover:border-neutral-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <GripVertical className="w-4 h-4 text-neutral-300 shrink-0" />
                                        <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                            {idx + 1}
                                        </span>
                                        <span className="text-sm font-semibold text-neutral-800 truncate">{stop.location_name}</span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1">
                                            <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                            <input
                                                type="date"
                                                min={arrivalDate || undefined}
                                                value={stop.tour_date || arrivalDate || ''}
                                                onFocus={() => {
                                                    if (!stop.tour_date && arrivalDate) {
                                                        handleDateChange(idx, arrivalDate);
                                                    }
                                                }}
                                                onChange={(e) => handleDateChange(idx, e.target.value)}
                                                className="text-xs font-mono font-semibold text-neutral-700 bg-transparent focus:outline-none"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleMoveLocation(idx, -1)}
                                            disabled={idx === 0}
                                            title="Move up"
                                            className="p-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:text-emerald-800 hover:bg-emerald-50 disabled:opacity-30 transition-colors"
                                        >
                                            <ArrowUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleMoveLocation(idx, 1)}
                                            disabled={idx === routeStops.length - 1}
                                            title="Move down"
                                            className="p-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:text-emerald-800 hover:bg-emerald-50 disabled:opacity-30 transition-colors"
                                        >
                                            <ArrowDown className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveLocation(idx)}
                                            title="Remove stop"
                                            className="p-1.5 rounded-lg border border-rose-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
