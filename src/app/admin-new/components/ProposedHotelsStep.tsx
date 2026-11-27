'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertCircle,
    ArrowDown,
    ArrowUp,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    Compass,
    Loader2,
    MapPin,
    Plus,
    Save,
    Search,
    Star,
    Trash2,
    X,
} from 'lucide-react';
import type {
    HotelImageDTO,
    ProposedHotelOptionDTO,
    TourProposedHotelDTO,
    TourRouteStopDTO,
} from '@/dtos/tour-planning.dto';
import {
    listAllHotelsForProposalAction,
    saveTourProposedHotelsAction,
} from '@/actions/tour-planning.actions';
import { getHotelImagesBatchAction } from '@/actions/hotel-image.actions';
import HotelImagesManager from '@/components/hotels/HotelImagesManager';

interface ProposedHotelsStepProps {
    tourId: string;
    arrivalDate?: string;
    departureDate?: string;
    durationDays?: number;
    travelRoute: TourRouteStopDTO[];
    hotels?: any[];
    selectedActivities: Array<{ id: number; activity_name: string; location_name?: string; category?: string }>;
    activityDateMap: Record<number, string>;
    proposedHotels: TourProposedHotelDTO[];
    onProposedHotelsChange: (next: TourProposedHotelDTO[]) => void;
    onSaveOverride?: (items: TourProposedHotelDTO[]) => Promise<{ success: boolean; error?: string }>;
    allowImageEditing?: boolean;
    disabled?: boolean;
}

interface DaySlot {
    date: string;
    dayNumber: number;
    location: string;
}

function addDays(isoDate: string, days: number): string {
    const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return '';
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

interface SearchableHotelDropdownProps {
    hotels: ProposedHotelOptionDTO[];
    value: string;
    onChange: (hotelId: string) => void;
    placeholder: string;
    loading?: boolean;
    disabled?: boolean;
}

function SearchableHotelDropdown({
    hotels,
    value,
    onChange,
    placeholder,
    loading = false,
    disabled = false,
}: SearchableHotelDropdownProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selected = useMemo(
        () => hotels.find((h) => h.id === value) ?? null,
        [hotels, value]
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return hotels;
        return hotels.filter(
            (h) =>
                (h.name || '').toLowerCase().includes(q) ||
                (h.closest_city || '').toLowerCase().includes(q) ||
                (h.location_address || '').toLowerCase().includes(q) ||
                (h.hotel_class || '').toLowerCase().includes(q)
        );
    }, [hotels, query]);

    const visibleItems = useMemo(() => filtered.slice(0, 100), [filtered]);

    useEffect(() => {
        if (!open) return;
        const onMouseDown = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    useEffect(() => {
        if (open) {
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [open]);

    return (
        <div ref={containerRef} className="relative flex-1 min-w-0">
            <button
                type="button"
                disabled={disabled || loading}
                onClick={() => setOpen((prev) => !prev)}
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs text-left hover:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 disabled:opacity-50"
            >
                <span className={`truncate ${selected ? 'font-semibold text-neutral-800' : 'text-neutral-500'}`}>
                    {loading
                        ? 'Loading all hotels...'
                        : selected
                            ? `${selected.name}${selected.closest_city ? ` — ${selected.closest_city}` : ''}${selected.hotel_class ? ` (${selected.hotel_class})` : ''}`
                            : placeholder}
                </span>
                <span className="flex items-center gap-1 shrink-0 text-neutral-400">
                    {value && (
                        <span
                            role="button"
                            tabIndex={0}
                            aria-label="Clear selected hotel"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange('');
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onChange('');
                                }
                            }}
                            className="p-0.5 rounded hover:bg-neutral-100 hover:text-neutral-700"
                        >
                            <X className="w-3.5 h-3.5" />
                        </span>
                    )}
                    <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                </span>
            </button>

            {open && (
                <div className="absolute left-0 right-0 mt-1 z-50 bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-2.5 border-b border-neutral-200 flex items-center gap-2 bg-neutral-50">
                        <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={`Search all ${hotels.length} hotels by name, city, address, or class...`}
                            className="w-full text-xs bg-transparent focus:outline-none text-neutral-800 placeholder:text-neutral-400"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="text-neutral-400 hover:text-neutral-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="px-3 py-1.5 bg-neutral-50/60 border-b border-neutral-100 text-[10px] font-semibold text-neutral-400 flex items-center justify-between">
                        <span>
                            {filtered.length} matching hotel{filtered.length === 1 ? '' : 's'}
                        </span>
                        {filtered.length > 100 && (
                            <span>Showing first 100 — type to narrow</span>
                        )}
                    </div>

                    <div className="max-h-64 overflow-y-auto py-1">
                        {visibleItems.length === 0 ? (
                            <div className="px-3 py-6 text-xs text-center text-neutral-400">
                                No hotels match &ldquo;{query}&rdquo;
                            </div>
                        ) : (
                            visibleItems.map((h) => {
                                const isSelected = h.id === value;
                                return (
                                    <button
                                        key={h.id}
                                        type="button"
                                        onClick={() => {
                                            onChange(h.id);
                                            setOpen(false);
                                            setQuery('');
                                        }}
                                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 hover:bg-emerald-50/50 transition-colors ${
                                            isSelected ? 'bg-emerald-50/70' : ''
                                        }`}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className={`truncate ${isSelected ? 'font-bold text-emerald-900' : 'font-semibold text-neutral-800'}`}>
                                                    {h.name}
                                                </span>
                                                {h.hotel_class && (
                                                    <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold shrink-0">
                                                        {h.hotel_class}
                                                    </span>
                                                )}
                                            </div>
                                            {(h.closest_city || h.location_address) && (
                                                <div className="text-[10px] text-neutral-500 truncate mt-0.5">
                                                    {h.closest_city || h.location_address}
                                                </div>
                                            )}
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ProposedHotelsStep({
    tourId,
    arrivalDate,
    departureDate,
    durationDays = 0,
    travelRoute,
    hotels: fallbackHotels = [],
    selectedActivities,
    activityDateMap,
    proposedHotels,
    onProposedHotelsChange,
    onSaveOverride,
    allowImageEditing = true,
    disabled = false,
}: ProposedHotelsStepProps) {
    const [allDbHotels, setAllDbHotels] = useState<ProposedHotelOptionDTO[]>([]);
    const [hotelImagesMap, setHotelImagesMap] = useState<Record<string, HotelImageDTO[]>>({});
    const [loadingHotels, setLoadingHotels] = useState<boolean>(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
    const [pickerHotelByDate, setPickerHotelByDate] = useState<Record<string, string>>({});
    const [manualDate, setManualDate] = useState('');
    const [manualLocation, setManualLocation] = useState('');
    const [extraSlots, setExtraSlots] = useState<DaySlot[]>([]);

    // Fetch an independent, complete list of ALL hotels in the database
    useEffect(() => {
        let alive = true;
        setLoadingHotels(true);
        listAllHotelsForProposalAction()
            .then((res) => {
                if (!alive) return;
                if (res.success && Array.isArray(res.data)) {
                    setAllDbHotels(res.data);
                } else {
                    setAllDbHotels(fallbackHotels as ProposedHotelOptionDTO[]);
                }
            })
            .catch(() => {
                if (alive) setAllDbHotels(fallbackHotels as ProposedHotelOptionDTO[]);
            })
            .finally(() => {
                if (alive) setLoadingHotels(false);
            });
        return () => {
            alive = false;
        };
    }, []);

    const catalogHotels = useMemo(() => {
        const source = allDbHotels.length > 0 ? allDbHotels : (fallbackHotels as ProposedHotelOptionDTO[]);
        return [...source].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [allDbHotels, fallbackHotels]);

    const hotelById = useMemo(() => {
        const m = new Map<string, ProposedHotelOptionDTO>();
        catalogHotels.forEach((h) => m.set(h.id, h));
        return m;
    }, [catalogHotels]);

    // Fetch up to 3 images per hotel from shared hotel_images table for all proposed hotels
    const proposedHotelIdsKey = useMemo(
        () => Array.from(new Set(proposedHotels.map((p) => p.hotel_id).filter(Boolean))).sort().join(','),
        [proposedHotels]
    );

    useEffect(() => {
        if (!proposedHotelIdsKey) return;
        const ids = proposedHotelIdsKey.split(',').filter(Boolean);
        let alive = true;
        getHotelImagesBatchAction(ids)
            .then((res) => {
                if (alive && res.success && res.data) {
                    setHotelImagesMap((prev) => ({ ...prev, ...res.data }));
                }
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, [proposedHotelIdsKey]);

    // Build ordered tour date slots from travelRoute + arrival/departure dates + already-saved proposedHotels
    const daySlots: DaySlot[] = useMemo(() => {
        const byDate = new Map<string, DaySlot>();

        (travelRoute || []).forEach((stop, idx) => {
            const d = stop.tour_date ? stop.tour_date.slice(0, 10) : (arrivalDate ? addDays(arrivalDate, idx) : '');
            if (!d) return;
            if (!byDate.has(d)) {
                byDate.set(d, {
                    date: d,
                    dayNumber: stop.day_number ?? idx + 1,
                    location: stop.location_name || '',
                });
            } else if (stop.location_name && !byDate.get(d)!.location) {
                byDate.get(d)!.location = stop.location_name;
            }
        });

        if (arrivalDate) {
            const start = new Date(`${arrivalDate.slice(0, 10)}T00:00:00Z`);
            let totalNights = 0;
            if (departureDate) {
                const end = new Date(`${departureDate.slice(0, 10)}T00:00:00Z`);
                if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start) {
                    totalNights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                }
            }
            if (totalNights <= 0 && durationDays > 1) {
                totalNights = durationDays - 1;
            }
            for (let i = 0; i < totalNights; i++) {
                const d = addDays(arrivalDate, i);
                if (d && !byDate.has(d)) {
                    byDate.set(d, {
                        date: d,
                        dayNumber: i + 1,
                        location: '',
                    });
                }
            }
        }

        proposedHotels.forEach((ph) => {
            if (ph.tour_date && !byDate.has(ph.tour_date)) {
                byDate.set(ph.tour_date, {
                    date: ph.tour_date,
                    dayNumber: ph.day_number ?? byDate.size + 1,
                    location: ph.location_name || '',
                });
            }
        });
        extraSlots.forEach((s) => {
            if (s.date && !byDate.has(s.date)) {
                byDate.set(s.date, s);
            }
        });

        return Array.from(byDate.values())
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((slot, idx) => ({ ...slot, dayNumber: idx + 1 }));
    }, [travelRoute, arrivalDate, departureDate, durationDays, proposedHotels, extraSlots]);

    const getOptionsForDate = (date: string) =>
        proposedHotels
            .filter((p) => p.tour_date === date)
            .sort((a, b) => a.option_rank - b.option_rank);

    const handleAddHotelOption = (slot: DaySlot) => {
        const hotelId = pickerHotelByDate[slot.date];
        if (!hotelId) return;
        const current = getOptionsForDate(slot.date);
        if (current.length >= 5) return;
        if (current.some((p) => p.hotel_id === hotelId)) return;

        const nextItem: TourProposedHotelDTO = {
            tour_date: slot.date,
            day_number: slot.dayNumber,
            location_name: slot.location || hotelById.get(hotelId)?.closest_city || '',
            hotel_id: hotelId,
            option_rank: current.length + 1,
            is_selected: current.length === 0,
            notes: '',
        };
        onProposedHotelsChange([...proposedHotels, nextItem]);
        setPickerHotelByDate((prev) => ({ ...prev, [slot.date]: '' }));
    };

    const handleRemoveHotelOption = (date: string, hotelId: string) => {
        const remainingForDate = getOptionsForDate(date)
            .filter((p) => p.hotel_id !== hotelId)
            .map((p, idx) => ({ ...p, option_rank: idx + 1 }));
        const others = proposedHotels.filter((p) => p.tour_date !== date);
        onProposedHotelsChange([...others, ...remainingForDate]);
    };

    const handleMoveRank = (date: string, hotelId: string, dir: -1 | 1) => {
        const list = getOptionsForDate(date);
        const idx = list.findIndex((p) => p.hotel_id === hotelId);
        const target = idx + dir;
        if (idx === -1 || target < 0 || target >= list.length) return;
        const reordered = [...list];
        const [item] = reordered.splice(idx, 1);
        reordered.splice(target, 0, item);
        const ranked = reordered.map((p, i) => ({ ...p, option_rank: i + 1 }));
        const others = proposedHotels.filter((p) => p.tour_date !== date);
        onProposedHotelsChange([...others, ...ranked]);
    };

    const handleTogglePrimary = (date: string, hotelId: string) => {
        onProposedHotelsChange(
            proposedHotels.map((p) =>
                p.tour_date === date ? { ...p, is_selected: p.hotel_id === hotelId } : p
            )
        );
    };

    const handleNoteChange = (date: string, hotelId: string, notes: string) => {
        onProposedHotelsChange(
            proposedHotels.map((p) =>
                p.tour_date === date && p.hotel_id === hotelId ? { ...p, notes } : p
            )
        );
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveMessage(null);
        try {
            const res = onSaveOverride
                ? await onSaveOverride(proposedHotels)
                : await saveTourProposedHotelsAction(tourId, proposedHotels);
            if (res.success) {
                setSaveMessage({ type: 'ok', text: 'Proposed hotel options saved successfully.' });
            } else {
                setSaveMessage({ type: 'err', text: res.error || 'Failed to save proposed hotels.' });
            }
        } catch (err: any) {
            setSaveMessage({ type: 'err', text: err?.message || 'Unexpected error saving proposed hotels.' });
        } finally {
            setSaving(false);
        }
    };

    const handleAddManualDate = () => {
        if (!manualDate) return;
        setExtraSlots((prev) => [
            ...prev,
            { date: manualDate, dayNumber: daySlots.length + 1, location: manualLocation.trim() },
        ]);
        setManualDate('');
        setManualLocation('');
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Top Header */}
            <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-md flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-emerald-800" />
                        <h3 className="text-xl font-serif font-bold text-neutral-800">
                            Proposed Hotels by Tour Date
                        </h3>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                        Select <strong>3 to 5 hotel options</strong> for each tour night from the full hotel database.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || disabled}
                    className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{saving ? 'Saving...' : 'Save Proposed Hotels'}</span>
                </button>
            </div>

            {saveMessage && (
                <div
                    className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                        saveMessage.type === 'ok'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}
                >
                    {saveMessage.type === 'ok' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{saveMessage.text}</span>
                </div>
            )}

            {/* Add custom tour date */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-neutral-600 uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-800" />
                    Add Extra Stay Date:
                </span>
                <input
                    type="date"
                    min={arrivalDate || undefined}
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-mono font-semibold text-neutral-800"
                />
                <input
                    type="text"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    placeholder="Location / District (optional)"
                    className="px-3 py-1.5 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-800 flex-1 min-w-[180px]"
                />
                <button
                    type="button"
                    onClick={handleAddManualDate}
                    disabled={!manualDate}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-emerald-800/30 hover:border-emerald-800 text-emerald-800 text-xs font-bold flex items-center gap-1 disabled:opacity-40"
                >
                    <Plus className="w-3.5 h-3.5" /> Add Date
                </button>
            </div>

            {/* Day-by-Day Proposed Hotel Cards */}
            {daySlots.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-neutral-300 p-12 text-center space-y-2">
                    <Calendar className="w-10 h-10 text-neutral-300 mx-auto" />
                    <p className="text-sm font-bold text-neutral-600">No tour dates found yet</p>
                    <p className="text-xs text-neutral-400">
                        Set the tourist&apos;s Arrival/Departure dates or Travel Route dates in <strong>Tourist Data → Preferences</strong>, or add a stay date above.
                    </p>
                </div>
            ) : (
                <div className="space-y-5">
                    {daySlots.map((slot) => {
                        const options = getOptionsForDate(slot.date);
                        const hasMinOptions = options.length >= 3;
                        const isFull = options.length >= 5;
                        const dateActivities = selectedActivities.filter(
                            (a) => activityDateMap[a.id] === slot.date
                        );
                        const availableHotels = catalogHotels.filter(
                            (h) => !options.some((o) => o.hotel_id === h.id)
                        );

                        return (
                            <div
                                key={slot.date}
                                className="bg-white rounded-3xl border border-neutral-200 shadow-sm"
                            >
                                {/* Day Card Header */}
                                <div className="px-6 py-4 bg-neutral-50/80 border-b border-neutral-200/80 rounded-t-3xl flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="px-3 py-1 rounded-xl bg-emerald-800 text-white text-xs font-extrabold">
                                            Day {slot.dayNumber}
                                        </span>
                                        <span className="text-sm font-mono font-bold text-neutral-800 flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4 text-emerald-700" />
                                            {slot.date}
                                        </span>
                                        {slot.location && (
                                            <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                                                {slot.location}
                                            </span>
                                        )}
                                    </div>

                                    <span
                                        className={`hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                                            hasMinOptions
                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                : 'bg-amber-50 text-amber-800 border-amber-200'
                                        }`}
                                    >
                                        {options.length} / 3–5 Hotel Options
                                    </span>
                                </div>

                                <div className="p-6 space-y-4">
                                    {/* Planned Activities for this Date */}
                                    {dateActivities.length > 0 && (
                                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl px-4 py-2.5 flex flex-wrap items-center gap-2 text-xs">
                                            <span className="font-bold text-indigo-800 flex items-center gap-1">
                                                <Compass className="w-3.5 h-3.5" />
                                                Activities on {slot.date}:
                                            </span>
                                            {dateActivities.map((act) => (
                                                <span
                                                    key={act.id}
                                                    className="px-2.5 py-0.5 rounded-full bg-white border border-indigo-200 text-indigo-900 font-semibold text-[11px]"
                                                >
                                                    {act.activity_name}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Independent Searchable Hotel Dropdown (all DB hotels) */}
                                    {!isFull && (
                                        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                                            <SearchableHotelDropdown
                                                hotels={availableHotels}
                                                value={pickerHotelByDate[slot.date] || ''}
                                                onChange={(hotelId) =>
                                                    setPickerHotelByDate((prev) => ({
                                                        ...prev,
                                                        [slot.date]: hotelId,
                                                    }))
                                                }
                                                placeholder={`Search and select hotel option #${options.length + 1}…`}
                                                loading={loadingHotels}
                                                disabled={disabled}
                                            />
                                            <button
                                                type="button"
                                                disabled={disabled || !pickerHotelByDate[slot.date]}
                                                onClick={() => handleAddHotelOption(slot)}
                                                className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 shrink-0"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Add Option
                                            </button>
                                        </div>
                                    )}

                                    {/* Proposed Hotel Option Rows */}
                                    {options.length === 0 ? (
                                        <div className="border border-dashed border-neutral-200 rounded-2xl p-6 text-center text-xs text-neutral-400">
                                            No hotel options added for <strong>{slot.date}</strong> yet. Search and add 3 to 5 hotel options above.
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {options.map((opt, idx) => {
                                                const h = hotelById.get(opt.hotel_id);
                                                const imgs: HotelImageDTO[] =
                                                    hotelImagesMap[opt.hotel_id] !== undefined
                                                        ? hotelImagesMap[opt.hotel_id]
                                                        : h?.photo_url
                                                            ? [{ id: `master-${opt.hotel_id}`, hotel_id: opt.hotel_id, image_url: h.photo_url, is_primary: true, sort_order: 1 }]
                                                            : [];
                                                return (
                                                    <div
                                                        key={opt.hotel_id}
                                                        className={`p-3.5 rounded-2xl border space-y-3 transition-all ${
                                                            opt.is_selected
                                                                ? 'border-emerald-400 bg-emerald-50/40'
                                                                : 'border-neutral-200 bg-neutral-50/40'
                                                        }`}
                                                    >
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                <span className="w-7 h-7 rounded-xl bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                                                    #{idx + 1}
                                                                </span>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="text-sm font-bold text-neutral-800 truncate">
                                                                            {h?.name || 'Hotel'}
                                                                        </span>
                                                                        {h?.hotel_class && (
                                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                                                                {h.hotel_class}
                                                                            </span>
                                                                        )}
                                                                        {opt.is_selected && (
                                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-800 text-white">
                                                                                Primary Choice
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[11px] text-neutral-500 truncate">
                                                                        {h?.closest_city || opt.location_name || h?.location_address || 'Location not specified'}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                                                <input
                                                                    type="text"
                                                                    value={opt.notes || ''}
                                                                    onChange={(e) => handleNoteChange(slot.date, opt.hotel_id, e.target.value)}
                                                                    placeholder="Option note (e.g. Lake view)..."
                                                                    className="w-44 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-700 focus:outline-none focus:border-emerald-700"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleTogglePrimary(slot.date, opt.hotel_id)}
                                                                    title="Mark as Primary Choice"
                                                                    className={`p-1.5 rounded-lg border transition-colors ${
                                                                        opt.is_selected
                                                                            ? 'bg-amber-100 border-amber-300 text-amber-700'
                                                                            : 'bg-white border-neutral-200 text-neutral-400 hover:text-amber-600'
                                                                    }`}
                                                                >
                                                                    <Star className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleMoveRank(slot.date, opt.hotel_id, -1)}
                                                                    disabled={idx === 0}
                                                                    title="Move up"
                                                                    className="p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-emerald-800 disabled:opacity-30"
                                                                >
                                                                    <ArrowUp className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleMoveRank(slot.date, opt.hotel_id, 1)}
                                                                    disabled={idx === options.length - 1}
                                                                    title="Move down"
                                                                    className="p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-emerald-800 disabled:opacity-30"
                                                                >
                                                                    <ArrowDown className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveHotelOption(slot.date, opt.hotel_id)}
                                                                    title="Remove option"
                                                                    className="p-1.5 rounded-lg border border-rose-200 bg-white text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Shared Multi-Image Hotel Gallery (up to 3 WebP images synced with Master Data) */}
                                                        <div className="pl-0 sm:pl-10">
                                                            <HotelImagesManager
                                                                hotelId={opt.hotel_id}
                                                                images={imgs}
                                                                editable={allowImageEditing && !disabled}
                                                                compact
                                                                onChange={(nextImgs) => {
                                                                    setHotelImagesMap((prev) => ({
                                                                        ...prev,
                                                                        [opt.hotel_id]: nextImgs,
                                                                    }));
                                                                    const primary = nextImgs.find((i) => i.is_primary) || nextImgs[0] || null;
                                                                    setAllDbHotels((prev) =>
                                                                        prev.map((item) =>
                                                                            item.id === opt.hotel_id
                                                                                ? { ...item, photo_url: primary?.image_url || null }
                                                                                : item
                                                                        )
                                                                    );
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
