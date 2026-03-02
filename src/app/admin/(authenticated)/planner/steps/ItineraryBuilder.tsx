"use client";

import { TripData, InternalItineraryBlock, AccommodationBooking, TransportBooking } from "../types";
import {
    ListTree, MapPin, CalendarDays, Navigation, Utensils, BedDouble, AlertCircle, GripVertical,
    Rocket, RefreshCcw, ArrowUp, ArrowDown, Activity as ActivityIcon, ChevronLeft, ChevronRight,
    Trash2, Link, Link2Off, UserCheck, ShieldCheck, Car as CarIcon, Coffee, Info, Calculator,
    CheckCircle2, AlertTriangle, Search, X, Check
} from "lucide-react";
import { generateRoutePlan, GeoLocation } from "@/lib/route-engine";
import { useState, useEffect, useMemo } from "react";
import { Activity } from "@/data/activities";
import {
    getHotelsListAction,
    getVendorsAction,
    getTransportProvidersAction,
    getDriversAction,
    getTourGuidesAction,
    getRestaurantsAction
} from "@/actions/admin.actions";
import { Vendor, TransportProvider, Driver, TourGuide, Restaurant } from "@/services/master-data.service";
import { HotelRoom } from "@/services/hotel.service";

// Local component for time input to prevent jumping while typing
function TimeInput({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    const [localVal, setLocalVal] = useState(value);

    // Sync from parent if changed externally
    useEffect(() => {
        setLocalVal(value);
    }, [value]);

    const handleCommit = () => {
        if (localVal !== value) {
            onChange(localVal);
        }
    };

    return (
        <input
            value={localVal}
            onChange={e => setLocalVal(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={e => {
                if (e.key === 'Enter') {
                    e.currentTarget.blur();
                }
            }}
            className="w-16 text-xs font-mono font-bold text-center border-b border-dashed border-neutral-300 bg-transparent focus:outline-none focus:border-brand-gold"
        />
    );
}

export function ItineraryBuilder({ tripData, updateData }: { tripData: TripData, updateData: (d: Partial<TripData>) => void }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [optScore, setOptScore] = useState<number | null>(null);

    // Master Data State
    const [masterData, setMasterData] = useState<{
        hotels: any[];
        vendors: Vendor[];
        drivers: Driver[];
        guides: TourGuide[];
        restaurants: Restaurant[];
        transportProviders: TransportProvider[];
    }>({
        hotels: [],
        vendors: [],
        drivers: [],
        guides: [],
        restaurants: [],
        transportProviders: []
    });

    const [loadingMaster, setLoadingMaster] = useState(false);
    const [activeAssignment, setActiveAssignment] = useState<{ blockId: string, type: string } | null>(null);

    useEffect(() => {
        async function loadData() {
            setLoadingMaster(true);
            try {
                const [h, v, d, g, r, tp] = await Promise.all([
                    getHotelsListAction(),
                    getVendorsAction(),
                    getDriversAction(),
                    getTourGuidesAction(),
                    getRestaurantsAction(),
                    getTransportProvidersAction()
                ]);
                setMasterData({
                    hotels: h.success ? h.hotels : [],
                    vendors: v.success ? v.vendors : [],
                    drivers: d.success ? d.drivers : [],
                    guides: g.success ? g.guides : [],
                    restaurants: r.success ? r.restaurants : [],
                    transportProviders: tp.success ? tp.providers : []
                });
            } catch (err) {
                console.error("Failed to load master data for assignment:", err);
            } finally {
                setLoadingMaster(false);
            }
        }
        loadData();
    }, []);

    const runEngine = async () => {
        setIsGenerating(true);
        try {
            const chosenActivities: Activity[] = tripData.activities.map(a => a.activityData);
            const locationsMap = new Map<string, GeoLocation>();
            chosenActivities.forEach(act => {
                if (act.lat && act.lng) {
                    const key = `${act.lat.toFixed(3)},${act.lng.toFixed(3)}`;
                    if (!locationsMap.has(key)) {
                        locationsMap.set(key, {
                            lat: act.lat,
                            lng: act.lng,
                            name: `${act.location_name}, ${act.district}`
                        });
                    }
                }
            });
            const locations = Array.from(locationsMap.values());
            const durationDays = tripData.profile.durationDays || 3;
            const routeResult = await generateRoutePlan(chosenActivities, locations, durationDays);

            const generatedBlocks: InternalItineraryBlock[] = [];
            routeResult.plan.forEach(day => {
                day.events.forEach(event => {
                    const block: InternalItineraryBlock = {
                        id: crypto.randomUUID(),
                        dayNumber: day.day,
                        type: event.type as any,
                        name: event.name,
                        startTime: event.startTime,
                        endTime: event.endTime,
                        bufferMins: 15,
                        durationHours: event.duration,
                        confirmationStatus: 'Pending',
                        paymentStatus: 'Pending',
                        internalNotes: '',
                        clientVisibleNotes: '',
                        locationName: event.locationName,
                        lat: event.location?.lat,
                        lng: event.location?.lng
                    };
                    generatedBlocks.push(block);
                });
            });

            setOptScore(routeResult.optimizationScore);

            const hotels: AccommodationBooking[] = [];
            const transports: TransportBooking[] = [];

            // Use the fetched master data for initial boilerplate
            const inventory = masterData.hotels;

            for (let i = 1; i <= routeResult.totalDays; i++) {
                let selectedHotel = inventory.find(h => h.hotel_class?.includes(tripData.profile.travelStyle)) || inventory[0];

                if (selectedHotel) {
                    hotels.push({
                        id: crypto.randomUUID(),
                        nightIndex: i,
                        hotelId: selectedHotel.id,
                        hotelName: selectedHotel.name,
                        stayClass: selectedHotel.hotel_class || 'Standard',
                        address: selectedHotel.location_address || '',
                        mapLink: '',
                        contactPerson: selectedHotel.reservation_agent_name || '',
                        contactNumber: selectedHotel.reservation_agent_contact || '',
                        email: '',
                        rateCardUrl: '',
                        roomStandard: 'Standard Room',
                        numberOfRooms: 1,
                        pricePerNight: 0,
                        mealPlan: 'BB',
                        status: 'Tentative',
                        confirmationReference: '',
                        paymentStatus: 'Pending',
                        cancellationDeadline: '',
                        beddingConfiguration: '',
                        specialRequests: ''
                    });
                }

                // Default transport mode based on new grouping
                const defaultMode: TransportBooking['mode'] = tripData.profile.travelStyle === 'Ultra Luxury VIP' ? 'SMALL_ULTRA_VIP_EUROPE_SUV' : 'SMALL_PREMIUM_SEDAN';

                transports.push({
                    id: crypto.randomUUID(),
                    mode: defaultMode,
                    supplier: '',
                    vehicleNumber: '',
                    driverName: '',
                    driverContact: '',
                    guideAssigned: true,
                    guideDetails: '',
                    status: 'Tentative',
                    bookingReference: '',
                    paymentStatus: 'Pending',
                    contractUrl: ''
                });
            }

            updateData({
                itinerary: generatedBlocks,
                accommodations: tripData.accommodations.length === 0 ? hotels : tripData.accommodations,
                transports: tripData.transports.length === 0 ? transports : tripData.transports
            });
        } catch (error) {
            console.error("AI Generation failed:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const totalCosts = useMemo(() => {
        let hotels = 0;
        let acts = 0;
        let rest = 0;
        let trans = 0;
        const pax = (tripData.profile.adults || 0) + (tripData.profile.children || 0);

        // Count hotel costs
        tripData.accommodations.forEach(h => {
            hotels += (h.pricePerNight || 0) * (h.numberOfRooms || 1);
        });

        // Count transport costs
        // 1. Vehicle Cost (Check blocks or default)
        const daySet = new Set(tripData.itinerary.map(b => b.dayNumber));
        const totalDays = daySet.size || tripData.profile.durationDays || 1;

        const defaultVehicle = masterData.transportProviders
            .flatMap(p => p.transport_vehicles || [])
            .find(v => v.id === tripData.defaultVehicleId);

        // Calculate based on days (simplified for now)
        if (defaultVehicle) {
            trans += (defaultVehicle.day_rate || 0) * totalDays;
        }

        // 2. Driver Cost (only if NOT with_driver)
        const vehicleIncludesDriver = defaultVehicle?.with_driver ?? false;
        if (!vehicleIncludesDriver && tripData.defaultDriverId) {
            const driver = masterData.drivers.find(d => d.id === tripData.defaultDriverId);
            trans += (driver?.per_day_rate || 15) * totalDays;
        }

        // Current block costs (Activities & Restaurants)
        tripData.itinerary.forEach(b => {
            if (b.type === 'activity' && (b.vendorId || b.vendorActivityId)) {
                const vendor = masterData.vendors.find(v => v.id === b.vendorId);
                const va = vendor?.vendor_activities?.find(va => va.id === b.vendorActivityId);
                const fallbackVa = vendor?.vendor_activities?.find(va => va.activity_id === b.activityId);
                acts += (va?.vendor_price || fallbackVa?.vendor_price || 0);
            }
            if (b.type === 'meal' && b.restaurantId) {
                const rest = masterData.restaurants.find(r => r.id === b.restaurantId);
                acts += (rest?.lunch_rate_per_head || 25) * pax;
            }
        });

        return { hotels, activities: acts, transport: trans, total: hotels + acts + trans };
    }, [tripData.itinerary, tripData.accommodations, masterData, tripData.profile, tripData.defaultDriverId, tripData.defaultVehicleId]);

    const updateBlock = (id: string, fields: Partial<InternalItineraryBlock>) => {
        updateData({
            itinerary: tripData.itinerary.map(b => b.id === id ? { ...b, ...fields } : b)
        });
    };

    const moveBlock = (dayStr: string, index: number, direction: 'up' | 'down') => {
        const dayNum = Number(dayStr);
        const dayBlocks = [...(days[dayNum] || [])];
        if (direction === 'up' && index > 0) {
            const temp = dayBlocks[index - 1];
            dayBlocks[index - 1] = dayBlocks[index];
            dayBlocks[index] = temp;
        } else if (direction === 'down' && index < dayBlocks.length - 1) {
            const temp = dayBlocks[index + 1];
            dayBlocks[index + 1] = dayBlocks[index];
            dayBlocks[index] = temp;
        } else {
            return;
        }

        const otherDaysBlocks = tripData.itinerary.filter(b => b.dayNumber !== dayNum);
        const newItinerary = [...otherDaysBlocks, ...dayBlocks].sort((a, b) => a.dayNumber - b.dayNumber);
        updateData({ itinerary: newItinerary });
    };

    const moveBlockDay = (blockId: string, direction: 'prev' | 'next') => {
        const block = tripData.itinerary.find(b => b.id === blockId);
        if (!block) return;
        let targetDay = block.dayNumber + (direction === 'next' ? 1 : -1);
        if (targetDay < 1) return;
        updateData({ itinerary: tripData.itinerary.map(b => b.id === blockId ? { ...b, dayNumber: targetDay } : b) });
    };

    const timeToMins = (timeStr: string) => {
        if (!timeStr || !timeStr.includes(':')) return 0;
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (!match) return 0;
        let h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        if (isNaN(h) || isNaN(m)) return 0;
        const period = match[3]?.toUpperCase();
        if (period === 'PM' && h < 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        return h * 60 + m;
    };

    const shiftTime = (timeStr: string, shiftMins: number) => {
        if (!timeStr || !timeStr.includes(':')) return timeStr;
        const [hStr, mStr] = timeStr.split(':');
        let h = parseInt(hStr, 10);
        let m = parseInt(mStr, 10);
        if (isNaN(h) || isNaN(m)) return timeStr;
        let totalMins = h * 60 + m + shiftMins;
        if (totalMins < 0) totalMins = (24 * 60) + (totalMins % (24 * 60));
        totalMins = totalMins % (24 * 60);
        const newH = Math.floor(totalMins / 60);
        const newM = totalMins % 60;
        return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    };

    const removeBlock = (blockId: string, dayNumber: number) => {
        const dayBlocks = tripData.itinerary.filter(b => b.dayNumber === dayNumber).sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));
        const blockIndex = dayBlocks.findIndex(b => b.id === blockId);
        if (blockIndex === -1) return;
        const blockToRemove = dayBlocks[blockIndex];
        let shiftMins = 0;
        if (blockIndex + 1 < dayBlocks.length) {
            const startMins = timeToMins(blockToRemove.startTime);
            const nextStartMins = timeToMins(dayBlocks[blockIndex + 1].startTime);
            shiftMins = nextStartMins - startMins;
            if (shiftMins < 0) shiftMins += 24 * 60;
        }
        dayBlocks.splice(blockIndex, 1);
        for (let i = blockIndex; i < dayBlocks.length; i++) {
            dayBlocks[i] = {
                ...dayBlocks[i],
                startTime: shiftTime(dayBlocks[i].startTime, -shiftMins),
                endTime: shiftTime(dayBlocks[i].endTime, -shiftMins)
            };
        }
        const otherDays = tripData.itinerary.filter(b => b.dayNumber !== dayNumber);
        updateData({ itinerary: [...otherDays, ...dayBlocks].sort((a, b) => a.dayNumber - b.dayNumber) });
    };

    const removeDay = (dayStr: string) => {
        const removedDayNum = Number(dayStr);
        const updatedItinerary = tripData.itinerary
            .filter(b => b.dayNumber !== removedDayNum)
            .map(b => (b.dayNumber > removedDayNum ? { ...b, dayNumber: b.dayNumber - 1 } : b));
        const updatedHotels = tripData.accommodations
            .filter(h => h.nightIndex !== removedDayNum)
            .map(h => (h.nightIndex > removedDayNum ? { ...h, nightIndex: h.nightIndex - 1 } : h));
        updateData({ itinerary: updatedItinerary, accommodations: updatedHotels });
    };

    const iconType = (type: string) => {
        switch (type) {
            case 'activity': return <ActivityIcon size={16} className="text-orange-500" />;
            case 'travel': return <Navigation size={16} className="text-blue-500" />;
            case 'meal': return <Utensils size={16} className="text-green-500" />;
            case 'sleep': return <BedDouble size={16} className="text-indigo-500" />;
            default: return <ListTree size={16} className="text-neutral-500" />;
        }
    };

    const days = useMemo(() => {
        const grouped = tripData.itinerary.reduce((acc, block) => {
            if (!acc[block.dayNumber]) acc[block.dayNumber] = [];
            acc[block.dayNumber].push(block);
            return acc;
        }, {} as Record<number, InternalItineraryBlock[]>);
        Object.keys(grouped).forEach(dayNum => {
            grouped[Number(dayNum)].sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));
        });
        return grouped;
    }, [tripData.itinerary]);

    const [searchTerm, setSearchTerm] = useState("");

    const bindProvider = (blockId: string, field: keyof InternalItineraryBlock, value: any) => {
        const block = tripData.itinerary.find(b => b.id === blockId);
        if (!block) return;

        const updates: Partial<TripData> = {
            itinerary: tripData.itinerary.map(b => b.id === blockId ? { ...b, [field]: value } : b)
        };

        // Sync logic for hotels
        if (field === 'hotelId' && block.type === 'sleep') {
            const hotel = masterData.hotels.find(h => h.id === value);
            if (hotel) {
                updates.accommodations = tripData.accommodations.map(acc => {
                    if (acc.nightIndex === block.dayNumber) {
                        return {
                            ...acc,
                            hotelId: hotel.id,
                            hotelName: hotel.name,
                            stayClass: hotel.hotel_class || acc.stayClass,
                            address: hotel.location_address || acc.address
                        };
                    }
                    return acc;
                });
            }
        }

        updateData(updates);

        // Only close if not transport or vendor (needs vehicle/activity selection)
        if (field !== 'transportId' && field !== 'vendorId') {
            setActiveAssignment(null);
            setSearchTerm("");
        }
    };

    const filteredMasterData = useMemo(() => {
        if (!activeAssignment) return [];
        const term = searchTerm.toLowerCase();

        switch (activeAssignment.type) {
            case 'sleep':
                return masterData.hotels.filter(h => h.name.toLowerCase().includes(term) || h.closest_city?.toLowerCase().includes(term));
            case 'activity':
                return masterData.vendors.filter(v => v.name.toLowerCase().includes(term));
            case 'meal':
                return masterData.restaurants.filter(r => r.name.toLowerCase().includes(term));
            case 'travel':
                return {
                    providers: masterData.transportProviders.filter(p => p.name.toLowerCase().includes(term)),
                    drivers: masterData.drivers.filter(d => d.first_name.toLowerCase().includes(term) || (d.last_name || '').toLowerCase().includes(term))
                };
            default:
                return [];
        }
    }, [activeAssignment, searchTerm, masterData]);

    const getBindingDisplay = (block: InternalItineraryBlock) => {
        if (block.type === 'sleep' && block.hotelId) {
            const h = masterData.hotels.find(x => x.id === block.hotelId);
            return { name: h?.name || 'Linked Hotel', icon: <BedDouble size={12} className="text-indigo-500" /> };
        }
        if (block.type === 'activity' && (block.vendorId || block.vendorActivityId)) {
            const v = masterData.vendors.find(x => x.id === block.vendorId);
            const va = v?.vendor_activities?.find((x: any) => x.id === block.vendorActivityId);

            let label = 'Linked Vendor';
            if (v && va) label = `${v.name} - ${va.activity_name}`;
            else if (va) label = va.activity_name || 'Specific Activity';
            else if (v) label = v.name;

            return { name: label, icon: <ActivityIcon size={12} className="text-orange-500" /> };
        }
        if (block.type === 'travel' && (block.driverId || block.transportId || block.vehicleId)) {
            const d = masterData.drivers.find(x => x.id === block.driverId);
            const p = masterData.transportProviders.find(x => x.id === block.transportId);
            const v = masterData.transportProviders
                .flatMap(pv => pv.transport_vehicles || [])
                .find(vh => vh.id === block.vehicleId);

            let label = 'Linked Transport';
            if (p && v) label = `${p.name} - ${v.make_and_model || v.vehicle_type} (${v.vehicle_number})`;
            else if (v) label = `${v.make_and_model || v.vehicle_type} (${v.vehicle_number})`;
            else if (d) label = `${d.first_name} (Driver)`;
            else if (p) label = p.name;

            return { name: label, icon: <CarIcon size={12} className="text-blue-500" /> };
        }
        if (block.type === 'meal' && block.restaurantId) {
            const r = masterData.restaurants.find(x => x.id === block.restaurantId);
            return { name: r?.name || 'Linked Restaurant', icon: <Utensils size={12} className="text-green-500" /> };
        }
        return null;
    };

    return (
        <div className="relative">
            <div className="space-y-6">
                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-brand-gold/20 shadow-sm">
                    <div>
                        <h3 className="text-xl font-serif text-brand-green flex items-center gap-2">
                            <CalendarDays size={20} className="text-brand-gold" /> Itinerary Assignment Stage
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider font-bold">Step 4: Bind Master Data to Operational Blocks</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex gap-4">
                            <div className="text-right">
                                <p className="text-[10px] text-neutral-400 uppercase font-bold">Planned Cost</p>
                                <p className="text-sm font-bold text-neutral-800">${totalCosts.total.toLocaleString()}</p>
                            </div>
                            <div className="text-right border-l pl-4">
                                <p className="text-[10px] text-neutral-400 uppercase font-bold">Quote Margin</p>
                                <p className="text-sm font-bold text-brand-green">
                                    {tripData.financials.sellingPrice > 0
                                        ? `${(((tripData.financials.sellingPrice - totalCosts.total) / tripData.financials.sellingPrice) * 100).toFixed(1)}%`
                                        : '0%'
                                    }
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={runEngine}
                            disabled={isGenerating || tripData.activities.length === 0}
                            className="flex items-center gap-2 bg-gradient-to-r from-brand-charcoal to-brand-green text-white px-5 py-2.5 rounded-xl hover:shadow-md transition-all font-semibold disabled:opacity-50"
                        >
                            {isGenerating ? <RefreshCcw className="animate-spin" size={16} /> : <Rocket size={16} className="text-brand-gold" />}
                            {tripData.itinerary.length > 0 ? 'Regenerate Base' : 'Auto-Generate Route'}
                        </button>
                    </div>
                </div>

                {/* Assignment Defaults */}
                {tripData.itinerary.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-center gap-4">
                            <div className="p-2 bg-white rounded-lg shadow-sm"><Rocket className="text-blue-500" size={18} /></div>
                            <div className="flex-1">
                                <p className="text-[10px] text-blue-600 uppercase font-bold">Transport Provider</p>
                                <select
                                    className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 w-full"
                                    value={tripData.defaultTransportId || ''}
                                    onChange={e => updateData({ defaultTransportId: e.target.value, defaultVehicleId: '' })}
                                >
                                    <option value="">Unassigned</option>
                                    {masterData.transportProviders.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-center gap-4">
                            <div className="p-2 bg-white rounded-lg shadow-sm"><CarIcon className="text-blue-500" size={18} /></div>
                            <div className="flex-1">
                                <p className="text-[10px] text-blue-600 uppercase font-bold">Trip Vehicle</p>
                                <select
                                    className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 w-full"
                                    value={tripData.defaultVehicleId || ''}
                                    onChange={e => {
                                        const vid = e.target.value;
                                        const vehicle = masterData.transportProviders
                                            .flatMap(p => p.transport_vehicles || [])
                                            .find(v => v.id === vid);

                                        if (vehicle?.with_driver) {
                                            updateData({ defaultVehicleId: vid, defaultDriverId: '' });
                                        } else {
                                            updateData({ defaultVehicleId: vid });
                                        }
                                    }}
                                    disabled={!tripData.defaultTransportId}
                                >
                                    <option value="">Unassigned</option>
                                    {masterData.transportProviders.find(p => p.id === tripData.defaultTransportId)?.transport_vehicles?.map(v => (
                                        <option key={v.id} value={v.id}>{v.make_and_model || v.vehicle_type} ({v.vehicle_number})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-center gap-4">
                            <div className="p-2 bg-white rounded-lg shadow-sm"><UserCheck className="text-blue-500" size={18} /></div>
                            <div className="flex-1">
                                <p className="text-[10px] text-blue-600 uppercase font-bold">Trip Driver</p>
                                {masterData.transportProviders
                                    .flatMap(p => p.transport_vehicles || [])
                                    .find(v => v.id === tripData.defaultVehicleId)?.with_driver ? (
                                    <p className="text-[10px] text-neutral-400 font-bold uppercase mt-1">Included with Vehicle</p>
                                ) : (
                                    <select
                                        className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 w-full"
                                        value={tripData.defaultDriverId || ''}
                                        onChange={e => updateData({ defaultDriverId: e.target.value })}
                                    >
                                        <option value="">Unassigned</option>
                                        {masterData.drivers.map(d => (
                                            <option key={d.id} value={d.id}>{d.first_name} {d.last_name || ''}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {tripData.itinerary.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 flex items-center gap-4">
                            <div className="p-2 bg-white rounded-lg shadow-sm"><UserCheck className="text-amber-500" size={18} /></div>
                            <div className="flex-1">
                                <p className="text-[10px] text-amber-600 uppercase font-bold">Trip Guide (Default)</p>
                                <select
                                    className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 w-full"
                                    value={tripData.defaultGuideId || ''}
                                    onChange={e => updateData({ defaultGuideId: e.target.value })}
                                >
                                    <option value="">Unassigned</option>
                                    {masterData.guides.map(g => (
                                        <option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100 flex items-center gap-4">
                            <div className="p-2 bg-white rounded-lg shadow-sm"><ShieldCheck className="text-green-500" size={18} /></div>
                            <div className="flex-1">
                                <p className="text-[10px] text-green-600 uppercase font-bold">Vehicle Type</p>
                                <p className="text-xs font-bold text-neutral-700">{tripData.transports[0]?.mode || 'Not Specified'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {tripData.itinerary.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-neutral-100 italic">
                        <ListTree className="mx-auto h-16 w-16 text-neutral-100 mb-4" />
                        <p className="text-neutral-400">Your itinerary story begins here. Click Generate to start.</p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {Object.entries(days).sort(([a], [b]) => Number(a) - Number(b)).map(([dayStr, blocks]) => (
                            <div key={dayStr} className="group/day relative pl-8 border-l-2 border-neutral-100 ml-4 pb-4">
                                <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-brand-gold border-4 border-white shadow-sm flex items-center justify-center text-[10px] text-white font-bold">
                                    {dayStr}
                                </div>
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-lg font-serif text-brand-charcoal font-bold tracking-tight">Day {dayStr} Journey</h4>
                                    <button onClick={() => removeDay(dayStr)} className="text-neutral-300 hover:text-red-500 transition-colors opacity-0 group-hover/day:opacity-100 font-bold text-[10px] uppercase tracking-widest">Remove Day</button>
                                </div>

                                <div className="grid gap-3">
                                    {blocks.map((block, idx) => {
                                        const binding = getBindingDisplay(block);
                                        return (
                                            <div key={block.id} className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-sm hover:shadow-md hover:border-brand-gold/30 transition-all group flex flex-col md:flex-row gap-4 items-center">
                                                <div className="flex items-center gap-4 flex-1 w-full">
                                                    <div className="w-20 text-center">
                                                        <TimeInput value={block.startTime} onChange={v => updateBlock(block.id, { startTime: v })} />
                                                        <div className="h-4 w-[1px] bg-neutral-100 mx-auto my-1"></div>
                                                        <TimeInput value={block.endTime} onChange={v => updateBlock(block.id, { endTime: v })} />
                                                    </div>

                                                    <div className="p-2.5 bg-neutral-50 rounded-xl">
                                                        {iconType(block.type)}
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <input value={block.name} onChange={e => updateBlock(block.id, { name: e.target.value })} className="font-bold text-neutral-800 bg-transparent border-none p-0 focus:ring-0 w-full" />
                                                        </div>
                                                        {block.locationName && <p className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5"><MapPin size={10} /> {block.locationName}</p>}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 w-full md:w-auto">
                                                    {binding ? (
                                                        <button
                                                            onClick={() => setActiveAssignment({ blockId: block.id, type: block.type })}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-brand-gold/5 border border-brand-gold/20 rounded-full text-[11px] font-bold text-brand-gold hover:bg-brand-gold/10 transition-colors"
                                                        >
                                                            {binding.icon}
                                                            <span className="truncate max-w-[120px]">{binding.name}</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => setActiveAssignment({ blockId: block.id, type: block.type })}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 border border-neutral-100 rounded-full text-[11px] font-bold text-neutral-400 hover:bg-neutral-100 transition-colors"
                                                        >
                                                            <Link size={12} />
                                                            Bind Provider
                                                        </button>
                                                    )}

                                                    <div className="flex gap-1">
                                                        <button onClick={() => moveBlock(dayStr, idx, 'up')} className="p-1.5 text-neutral-300 hover:text-brand-gold opacity-0 group-hover:opacity-100"><ArrowUp size={14} /></button>
                                                        <button onClick={() => moveBlock(dayStr, idx, 'down')} className="p-1.5 text-neutral-300 hover:text-brand-gold opacity-0 group-hover:opacity-100"><ArrowDown size={14} /></button>
                                                        <button onClick={() => removeBlock(block.id, block.dayNumber)} className="p-1.5 text-neutral-200 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Assignment Drawer Overlay */}
            {activeAssignment && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-brand-charcoal/20 backdrop-blur-sm">
                    <div className="w-full max-w-md h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden flex flex-col">
                        <div className="p-6 border-b flex items-center justify-between">
                            <div>
                                <h4 className="text-lg font-serif font-bold text-brand-green uppercase tracking-wide">Assign Specialist</h4>
                                <p className="text-xs text-neutral-400 mt-1">Provider Database for {activeAssignment.type.toUpperCase()} segments</p>
                            </div>
                            <button onClick={() => { setActiveAssignment(null); setSearchTerm(""); }} className="p-2 hover:bg-neutral-50 rounded-full transition-colors"><X size={20} /></button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-neutral-300" size={16} />
                                <input
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Search master data..."
                                    className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold transition-all"
                                />
                            </div>

                            <div className="divide-y border rounded-2xl overflow-hidden shadow-sm bg-white">
                                {activeAssignment.type === 'sleep' && (filteredMasterData as any[]).map(h => (
                                    <button key={h.id} onClick={() => bindProvider(activeAssignment.blockId, 'hotelId', h.id)} className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors text-left group">
                                        <div>
                                            <p className="font-bold text-sm text-neutral-800">{h.name}</p>
                                            <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-tight">{h.closest_city} • {h.hotel_class}</p>
                                        </div>
                                        <ChevronRight size={16} className="text-neutral-200 group-hover:text-brand-gold transform group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                                {activeAssignment.type === 'activity' && (
                                    <>
                                        {(filteredMasterData as any[]).map(v => (
                                            <div key={v.id} className="border-b last:border-0">
                                                <button onClick={() => bindProvider(activeAssignment.blockId, 'vendorId', v.id)} className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors text-left group">
                                                    <div>
                                                        <p className="font-bold text-sm text-neutral-800">{v.name}</p>
                                                        <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-tight">{v.vendor_activities?.length || 0} Activities Offered</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {tripData.itinerary.find(b => b.id === activeAssignment.blockId)?.vendorId === v.id && <div className="w-2 h-2 bg-brand-gold rounded-full" />}
                                                        <ChevronRight size={16} className="text-neutral-200 group-hover:text-brand-gold transform group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                </button>

                                                {/* Activity Selection if vendor is selected for this block */}
                                                {tripData.itinerary.find(b => b.id === activeAssignment.blockId)?.vendorId === v.id && v.vendor_activities && v.vendor_activities.length > 0 && (
                                                    <div className="bg-neutral-50/50 p-2 space-y-1 pb-4 px-4 border-t border-neutral-100">
                                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2">Select Specific Activity</p>
                                                        {v.vendor_activities.map((va: any) => (
                                                            <button
                                                                key={va.id}
                                                                onClick={() => {
                                                                    updateBlock(activeAssignment.blockId, {
                                                                        vendorActivityId: va.id,
                                                                        vendorId: v.id
                                                                    });
                                                                }}
                                                                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${tripData.itinerary.find(b => b.id === activeAssignment.blockId)?.vendorActivityId === va.id
                                                                    ? 'bg-white border-brand-gold shadow-sm'
                                                                    : 'bg-white/50 border-neutral-100 hover:border-neutral-200'
                                                                    }`}
                                                            >
                                                                <div>
                                                                    <p className="text-xs font-bold text-neutral-800">{va.activity_name}</p>
                                                                    <div className="flex gap-2 mt-1">
                                                                        <span className="text-[9px] bg-brand-gold/10 px-1.5 py-0.5 rounded text-brand-gold font-bold">LKR {va.vendor_price?.toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                                {tripData.itinerary.find(b => b.id === activeAssignment.blockId)?.vendorActivityId === va.id && (
                                                                    <div className="w-5 h-5 bg-brand-gold rounded-full flex items-center justify-center">
                                                                        <Check size={12} className="text-white" />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        <div className="p-6 sticky bottom-0 bg-white border-t mt-4">
                                            <button
                                                onClick={() => { setActiveAssignment(null); setSearchTerm(""); }}
                                                className="w-full py-3 bg-brand-green text-white font-bold rounded-xl shadow-lg hover:bg-brand-green/90 transition-all flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 size={18} />
                                                Finish Assignment
                                            </button>
                                        </div>
                                    </>
                                )}
                                {activeAssignment.type === 'travel' && (
                                    <>
                                        <div className="p-3 bg-neutral-50 text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-b">Transport Providers</div>
                                        {masterData.transportProviders.map((tp: any) => (
                                            <div key={tp.id} className="border-b last:border-0">
                                                <button onClick={() => bindProvider(activeAssignment.blockId, 'transportId', tp.id)} className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors text-left group">
                                                    <div>
                                                        <p className="font-bold text-sm text-neutral-800">{tp.name}</p>
                                                        <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-tight">{tp.transport_vehicles?.length || 0} Vehicles Available</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {tripData.itinerary.find(b => b.id === activeAssignment.blockId)?.transportId === tp.id && <div className="w-2 h-2 bg-brand-gold rounded-full" />}
                                                        <ChevronRight size={16} className="text-neutral-200 group-hover:text-brand-gold transform group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                </button>

                                                {/* Fleet Selection if provider is selected for this block */}
                                                {tripData.itinerary.find(b => b.id === activeAssignment.blockId)?.transportId === tp.id && tp.transport_vehicles && tp.transport_vehicles.length > 0 && (
                                                    <div className="bg-neutral-50/50 p-2 space-y-1 pb-4 px-4 border-t border-neutral-100">
                                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2">Select Vehicle</p>
                                                        {tp.transport_vehicles.map((v: any) => (
                                                            <button
                                                                key={v.id}
                                                                onClick={() => {
                                                                    const updates: Partial<InternalItineraryBlock> = {
                                                                        vehicleId: v.id,
                                                                        transportId: tp.id
                                                                    };
                                                                    if (v.with_driver) {
                                                                        updates.driverId = undefined;
                                                                    }
                                                                    updateBlock(activeAssignment.blockId, updates);
                                                                }}
                                                                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${tripData.itinerary.find(b => b.id === activeAssignment.blockId)?.vehicleId === v.id
                                                                    ? 'bg-white border-brand-gold shadow-sm'
                                                                    : 'bg-white/50 border-neutral-100 hover:border-neutral-200'
                                                                    }`}
                                                            >
                                                                <div>
                                                                    <p className="text-xs font-bold text-neutral-800">{v.make_and_model || v.vehicle_type}</p>
                                                                    <div className="flex gap-2 mt-1">
                                                                        <span className="text-[9px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-500 font-bold uppercase">{v.vehicle_number}</span>
                                                                        {v.with_driver && <span className="text-[9px] bg-green-100 px-1.5 py-0.5 rounded text-green-600 font-bold uppercase">Incl. Driver</span>}
                                                                    </div>
                                                                </div>
                                                                {tripData.itinerary.find(b => b.id === activeAssignment.blockId)?.vehicleId === v.id && (
                                                                    <div className="w-5 h-5 bg-brand-gold rounded-full flex items-center justify-center">
                                                                        <Check size={12} className="text-white" />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        <div className="p-3 bg-neutral-50 text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-y">Segment Driver</div>
                                        {masterData.transportProviders
                                            .flatMap(p => p.transport_vehicles || [])
                                            .find(v => v.id === tripData.itinerary.find(b => b.id === activeAssignment.blockId)?.vehicleId)?.with_driver ? (
                                            <div className="p-4 text-center">
                                                <div className="inline-block p-2 bg-green-50 rounded-lg mb-2"><UserCheck size={20} className="text-green-500" /></div>
                                                <p className="text-xs font-bold text-neutral-500 uppercase">Driver Included with Vehicle</p>
                                            </div>
                                        ) : (
                                            masterData.drivers.map(d => (
                                                <button key={d.id} onClick={() => updateBlock(activeAssignment.blockId, { driverId: d.id })} className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors text-left group">
                                                    <div>
                                                        <p className="font-bold text-sm text-neutral-800">{d.first_name} {d.last_name}</p>
                                                        <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-tight">Professional Chauffeur</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {tripData.itinerary.find(b => b.id === activeAssignment.blockId)?.driverId === d.id && <div className="w-2 h-2 bg-brand-gold rounded-full" />}
                                                        <ChevronRight size={16} className="text-neutral-200 group-hover:text-brand-gold transform group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                </button>
                                            ))
                                        )}

                                        <div className="p-6 sticky bottom-0 bg-white border-t mt-4">
                                            <button
                                                onClick={() => { setActiveAssignment(null); setSearchTerm(""); }}
                                                className="w-full py-3 bg-brand-green text-white font-bold rounded-xl shadow-lg hover:bg-brand-green/90 transition-all flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 size={18} />
                                                Finish Assignment
                                            </button>
                                        </div>
                                    </>
                                )}
                                {activeAssignment.type === 'meal' && (filteredMasterData as any[]).map(r => (
                                    <button key={r.id} onClick={() => bindProvider(activeAssignment.blockId, 'restaurantId', r.id)} className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors text-left group">
                                        <div>
                                            <p className="font-bold text-sm text-neutral-800">{r.name}</p>
                                            <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-tight">{r.is_buffet ? 'Buffet' : 'Set Menu'} specialist</p>
                                        </div>
                                        <ChevronRight size={16} className="text-neutral-200 group-hover:text-brand-gold transform group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                                {filteredMasterData && (Array.isArray(filteredMasterData) ? filteredMasterData.length === 0 : (filteredMasterData.providers.length === 0 && filteredMasterData.drivers.length === 0)) && (
                                    <div className="p-12 text-center text-neutral-400 italic text-sm">
                                        No providers found matching &quot;{searchTerm}&quot;
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    const block = tripData.itinerary.find(b => b.id === activeAssignment.blockId);
                                    const fields: (keyof InternalItineraryBlock)[] = ['hotelId', 'vendorId', 'transportId', 'driverId', 'restaurantId', 'guideId', 'vehicleId'];
                                    const blockUpdates: Partial<InternalItineraryBlock> = {};
                                    fields.forEach(f => (blockUpdates as any)[f] = undefined);

                                    const updates: Partial<TripData> = {
                                        itinerary: tripData.itinerary.map(b => b.id === activeAssignment.blockId ? { ...b, ...blockUpdates } : b)
                                    };

                                    // Clear hotel sync if needed
                                    if (block?.type === 'sleep') {
                                        updates.accommodations = tripData.accommodations.map(acc => {
                                            if (acc.nightIndex === block.dayNumber) {
                                                return {
                                                    ...acc,
                                                    hotelId: undefined,
                                                    hotelName: 'Not Assigned',
                                                    address: ''
                                                };
                                            }
                                            return acc;
                                        });
                                    }

                                    updateData(updates);
                                    setActiveAssignment(null);
                                    setSearchTerm("");
                                }}
                                className="w-full flex items-center justify-center gap-2 py-3 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all border border-red-100"
                            >
                                <Link2Off size={14} /> Clear Assignment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
