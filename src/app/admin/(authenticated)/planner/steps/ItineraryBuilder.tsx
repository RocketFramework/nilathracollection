"use client";

import { TripData, InternalItineraryBlock, AccommodationBooking, TransportBooking } from "../types";
import {
    ListTree, MapPin, CalendarDays, Navigation, Utensils, BedDouble, AlertCircle, GripVertical,
    Rocket, RefreshCcw, ArrowUp, ArrowDown, Activity as ActivityIcon, ChevronLeft, ChevronRight,
    Trash2, Link, Link2Off, UserCheck, ShieldCheck, Car as CarIcon, Coffee, Info, Calculator,
    CheckCircle2, AlertTriangle, Search, X, Check, XCircle, PlusCircle, Waves, Wifi, Briefcase, HeartPulse, Plane, Phone, Printer
} from "lucide-react";
import { generateRoutePlan, GeoLocation } from "@/lib/route-engine";
import { generateAIRoutePlan } from "@/lib/ai-route-engine";
import { useState, useEffect, useMemo } from "react";
import { Activity } from "@/data/activities";
import {
    getHotelsListAction,
    getVendorsAction,
    getTransportProvidersAction,
    getDriversAction,
    getTourGuidesAction,
    getRestaurantsAction,
    getActivitiesAction,
    getAIRulesAction,
    saveAIRuleAction
} from "@/actions/admin.actions";
import { AIRule } from "@/types/ai";
import { ItineraryPdfTemplate } from "../components/ItineraryPdfTemplate";

import {
    Vendor,
    TransportProvider,
    Driver,
    TourGuide,
    Restaurant,
    Activity as MasterActivity
} from "@/services/master-data.service";
import { HotelRoom } from "@/services/hotel.service";

// Local component for time input to prevent jumping while typing
function TimeInput({ value, onChange, disabled }: { value: string, onChange: (val: string) => void, disabled?: boolean }) {
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
            disabled={disabled}
            onKeyDown={e => {
                if (e.key === 'Enter') {
                    e.currentTarget.blur();
                }
            }}
            className="w-16 text-xs font-mono font-bold text-center border-b border-dashed border-neutral-300 bg-transparent focus:outline-none focus:border-brand-gold disabled:opacity-70 disabled:cursor-not-allowed"
        />
    );
}

function DebouncedInput({ value, onChange, className, placeholder, disabled }: { value: string, onChange: (val: string) => void, className?: string, placeholder?: string, disabled?: boolean }) {
    const [localVal, setLocalVal] = useState(value);

    useEffect(() => {
        setLocalVal(value);
    }, [value]);

    return (
        <input
            value={localVal}
            onChange={e => setLocalVal(e.target.value)}
            onBlur={() => { if (localVal !== value) onChange(localVal) }}
            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
            disabled={disabled}
            className={`${className} disabled:opacity-70 disabled:cursor-not-allowed`}
            placeholder={placeholder}
        />
    );
}

export function ItineraryBuilder({ 
    tripData, 
    updateData, 
    readOnly = false,
    currentUserRole = 'agent',
    onAddComment
}: { 
    tripData: TripData, 
    updateData: (d: Partial<TripData>) => void,
    readOnly?: boolean,
    currentUserRole?: 'agent' | 'tourist',
    onAddComment?: (blockId: string, text: string) => Promise<void> | void
}) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [optScore, setOptScore] = useState<number | null>(null);
    const [engineChoice, setEngineChoice] = useState<'standard' | 'ai'>('standard');
    const [showAIRules, setShowAIRules] = useState(false);
    const [aiRules, setAiRules] = useState<{ generic: string, specific: string }>({ generic: '', specific: '' });
    const [isSavingRules, setIsSavingRules] = useState(false);
    const [activeRuleTab, setActiveRuleTab] = useState<'generic' | 'specific'>('generic');


    // Master Data State
    const [masterData, setMasterData] = useState<{
        hotels: any[];
        vendors: Vendor[];
        drivers: Driver[];
        guides: TourGuide[];
        restaurants: Restaurant[];
        transportProviders: TransportProvider[];
        activities: MasterActivity[];
    }>({
        hotels: [],
        vendors: [],
        drivers: [],
        guides: [],
        restaurants: [],
        transportProviders: [],
        activities: []
    });

    const [loadingMaster, setLoadingMaster] = useState(false);
    const [activeAssignment, setActiveAssignment] = useState<{ blockId: string, type: string } | null>(null);
    const [pendingRoomState, setPendingRoomState] = useState<Record<string, { count?: number, mealPlan?: string }>>({});
    const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
    const [savingNote, setSavingNote] = useState<string | null>(null);

    const handleAddComment = async (blockId: string) => {
        const text = commentDrafts[blockId];
        if (!text?.trim()) return;

        if (onAddComment) {
            setSavingNote(blockId);
            try {
                await onAddComment(blockId, text.trim());
                setCommentDrafts(prev => ({ ...prev, [blockId]: '' }));
            } finally {
                setSavingNote(null);
            }
        } else {
            const block = tripData.itinerary.find(b => b.id === blockId);
            if (block) {
                const newComment = {
                    id: crypto.randomUUID(),
                    role: currentUserRole as any,
                    text: text.trim(),
                    timestamp: new Date().toISOString()
                };
                const comments = block.comments ? [...block.comments, newComment] : [newComment];
                updateBlock(blockId, { comments });
                setCommentDrafts(prev => ({ ...prev, [blockId]: '' }));
            }
        }
    };

    useEffect(() => {
        async function loadData() {
            setLoadingMaster(true);
            try {
                const [h, v, d, g, r, tp, act] = await Promise.all([
                    getHotelsListAction(),
                    getVendorsAction(),
                    getDriversAction(),
                    getTourGuidesAction(),
                    getRestaurantsAction(),
                    getTransportProvidersAction(),
                    getActivitiesAction()
                ]);
                setMasterData({
                    hotels: h.success ? h.hotels : [],
                    vendors: v.success ? v.vendors : [],
                    drivers: d.success ? d.drivers : [],
                    guides: g.success ? g.guides : [],
                    restaurants: r.success ? r.restaurants : [],
                    transportProviders: tp.success ? tp.providers : [],
                    activities: act.success ? (act.data || (act as any).activities || []) : []
                });
            } catch (err) {
                console.error("Failed to load master data for assignment:", err);
            } finally {
                setLoadingMaster(false);
            }
        }
        loadData();
    }, []);

    // Load AI Rules
    useEffect(() => {
        async function loadRules() {
            try {
                const res = await getAIRulesAction(tripData.id);
                if (res.success && res.rules) {
                    const generic = res.rules.find((r: AIRule) => r.rule_type === 'generic')?.content || '';
                    const specific = res.rules.find((r: AIRule) => r.rule_type === 'specific')?.content || '';
                    setAiRules({ generic, specific });
                }
            } catch (err) {
                console.error("Failed to load AI rules:", err);
            }
        }
        if (engineChoice === 'ai') {
            loadRules();
        }
    }, [engineChoice, tripData.id]);


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

            let routeResult;
            if (engineChoice === 'standard') {
                routeResult = await generateRoutePlan(chosenActivities, locations, durationDays);
            } else {
                const combinedRules = `GENERIC RULES:\n${aiRules.generic}\n\nSPECIFIC RULES FOR THIS ITINERARY:\n${aiRules.specific}`;
                routeResult = await generateAIRoutePlan(chosenActivities, locations, durationDays, combinedRules);
            }


            const generatedBlocks: InternalItineraryBlock[] = [];
            routeResult.plan.forEach(day => {
                day.events.forEach(event => {
                    const block: InternalItineraryBlock = {
                        id: crypto.randomUUID(),
                        dayNumber: day.day,
                        type: event.type as any,
                        name: event.name,
                        activityId: event.activityId ? Number(event.activityId) : undefined, // Added this mapping
                        startTime: event.startTime,
                        endTime: event.endTime,
                        bufferMins: 15,
                        durationHours: event.duration,
                        confirmationStatus: 'Pending',
                        paymentStatus: 'Pending',
                        internalNotes: '',
                        comments: [],
                        locationName: event.locationName,
                        distance: event.distance,
                        lat: event.location?.lat,
                        lng: event.location?.lng
                    };
                    generatedBlocks.push(block);
                });
            });

            if (routeResult.droppedActivities && routeResult.droppedActivities.length > 0) {
                routeResult.droppedActivities.forEach(act => {
                    generatedBlocks.push({
                        id: crypto.randomUUID(),
                        dayNumber: 0,
                        type: 'activity',
                        name: act.activity_name,
                        startTime: '',
                        endTime: '',
                        bufferMins: 0,
                        durationHours: act.duration_hours || 2,
                        confirmationStatus: 'Pending',
                        paymentStatus: 'Pending',
                        internalNotes: 'This activity could not fit in the AI schedule.',
                        comments: [],
                        locationName: act.location_name,
                        distance: undefined,
                        lat: act.lat || undefined,
                        lng: act.lng || undefined
                    });
                });
            }

            setOptScore(routeResult.optimizationScore);

            const hotels: AccommodationBooking[] = [];
            const transports: TransportBooking[] = [];

            // Use the fetched master data for initial boilerplate
            const inventory = masterData.hotels;

            for (let i = 1; i <= routeResult.totalDays; i++) {
                const selectedHotel = inventory.find(h => h.hotel_class?.includes(tripData.profile.travelStyle)) || inventory[0];

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
                const defaultMode: TransportBooking['mode'] = tripData.profile.travelStyle === 'Ultra VIP' ? 'SMALL_ULTRA_VIP_EUROPE_SUV' : 'SMALL_PREMIUM_SEDAN';

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
        const rest = 0;
        let trans = 0;
        const pax = (tripData.profile.adults || 0) + (tripData.profile.children || 0);

        // Count hotel costs
        tripData.accommodations.forEach(h => {
            if (h.selectedRooms && h.selectedRooms.length > 0) {
                h.selectedRooms.forEach((sr: any) => {
                    hotels += sr.agreedTotal !== undefined ? sr.agreedTotal : ((sr.pricePerNight || 0) * (sr.quantity || 1));
                });
            } else {
                hotels += (h.pricePerNight || 0) * (h.numberOfRooms || 1);
            }
        });

        // Count transport costs
        // 1. Segment-specific costs
        tripData.itinerary.forEach(b => {
            if (b.type === 'travel' && b.transportId && b.vehicleId) {
                const provider = masterData.transportProviders.find(p => p.id === b.transportId);
                const vehicle = provider?.transport_vehicles?.find(v => v.id === b.vehicleId);
                const qty = b.transportQuantity || 1;

                if (vehicle) {
                    if (b.transportRateType === 'km') {
                        trans += (vehicle.km_rate || 0) * qty;
                    } else {
                        trans += (vehicle.day_rate || 0) * qty;
                    }

                    // Handle driver cost if not included
                    if (!vehicle.with_driver && b.driverId) {
                        const driver = masterData.drivers.find(d => d.id === b.driverId);
                        trans += (driver?.per_day_rate || 0) * qty;
                    }
                }
            }
        });

        // 2. Fallback: Default Vehicle Cost (only if no specific transport assigned to days)
        const daySetWithTransport = new Set(tripData.itinerary.filter(b => b.type === 'travel' && b.vehicleId).map(b => b.dayNumber));
        const daySetTotal = new Set(tripData.itinerary.map(b => b.dayNumber));
        const uncoveredDays = Array.from(daySetTotal).filter(d => !daySetWithTransport.has(d)).length || 0;

        if (uncoveredDays > 0 && tripData.defaultVehicleId) {
            const defaultVehicle = masterData.transportProviders
                .flatMap(p => p.transport_vehicles || [])
                .find(v => v.id === tripData.defaultVehicleId);

            if (defaultVehicle) {
                trans += (defaultVehicle.day_rate || 0) * uncoveredDays;

                if (!defaultVehicle.with_driver && tripData.defaultDriverId) {
                    const driver = masterData.drivers.find(d => d.id === tripData.defaultDriverId);
                    trans += (driver?.per_day_rate || 0) * uncoveredDays;
                }
            }
        }

        // Current block costs (Activities & Restaurants)
        tripData.itinerary.forEach(b => {
            if (b.type === 'activity' && (b.vendorId || b.vendorActivityId)) {
                const vendor = masterData.vendors.find(v => v.id === b.vendorId);
                const va = vendor?.vendor_activities?.find(va => va.id === b.vendorActivityId);
                const fallbackVa = vendor?.vendor_activities?.find(va => va.activity_id === b.activityId);
                acts += (b.agreedPrice || va?.vendor_price || fallbackVa?.vendor_price || 0);
            }
            if (b.type === 'meal' && b.restaurantId) {
                const rest = masterData.restaurants.find(r => r.id === b.restaurantId);
                acts += (rest?.lunch_rate_per_head || 25) * pax;
            }
        });

        return { hotels, activities: acts, transport: trans, total: hotels + acts + trans };
    }, [tripData.itinerary, tripData.accommodations, masterData, tripData.profile, tripData.defaultDriverId, tripData.defaultVehicleId]);

    const itinerarySummary = useMemo(() => {
        const blocks = tripData.itinerary || [];

        // 1. Total Distance (aggregate from all blocks that contain distance data)
        const processedDistances = new Set<string>();
        const totalKm = blocks.reduce((sum, b) => {
            if (b.distance) {
                const num = parseInt(b.distance.toString().replace(/[^0-9]/g, ''));
                if (isNaN(num) || num === 0) return sum;

                const dedupeKey = `${b.dayNumber}-${b.locationName}-${num}`;
                if (!processedDistances.has(dedupeKey)) {
                    processedDistances.add(dedupeKey);
                    return sum + num;
                }
            }
            return sum;
        }, 0);

        // 2. Total Cities/Districts (unique locationNames/districts)
        const citySet = new Set<string>();
        blocks.forEach(b => {
            if (b.locationName) citySet.add(b.locationName.split(',')[0].trim());
        });

        // 3. Total Activities & Mix
        let activityCount = 0;
        const mix: { [key: string]: number } = {};

        blocks.forEach(b => {
            if (b.type === 'activity') {
                activityCount++;
                const masterAct = masterData.activities.find(ma => ma.id === b.activityId);
                const category = masterAct?.category || 'General';
                mix[category] = (mix[category] || 0) + 1;
            }
        });

        return {
            totalDistanceKm: totalKm,
            totalCities: citySet.size,
            totalActivities: activityCount,
            activityTypeMix: mix
        };
    }, [tripData.itinerary, masterData.activities]);

    // Sync summary to parent state
    useEffect(() => {
        if (JSON.stringify(tripData.summary) !== JSON.stringify(itinerarySummary)) {
            updateData({ summary: itinerarySummary });
        }
    }, [itinerarySummary, tripData.summary, updateData]);

    // Sync calculated costs to financials if they differ
    useEffect(() => {
        if (!tripData.financials) return;

        const currentCosts = tripData.financials.costs;
        const needsSync =
            currentCosts.hotels !== totalCosts.hotels ||
            currentCosts.activities !== totalCosts.activities ||
            currentCosts.transport !== totalCosts.transport;

        if (needsSync) {
            updateData({
                financials: {
                    ...tripData.financials,
                    costs: {
                        ...currentCosts,
                        hotels: totalCosts.hotels,
                        activities: totalCosts.activities,
                        transport: totalCosts.transport
                    }
                }
            });
        }
    }, [totalCosts, tripData.financials, updateData]);

    // 🧠 AI LEARNING FOUNDATION 
    // This function captures manual agent corrections (moving blocks, changing days, deleting) 
    // and prepares them to be translated into RAG Rules for the AI Builder Engine.
    const recordAgentCorrection = (actionType: string, blockId: string, details: any) => {
        if (engineChoice !== 'ai') return; // Only learn if we are using the AI engine
        const block = tripData.itinerary.find(b => b.id === blockId);
        if (!block) return;

        console.log(`[AI Engine] Agent Correction Logged -> ${actionType}`, {
            activity: block.name,
            originalDay: block.dayNumber,
            originalTime: block.startTime,
            details
        });
        // PHASE 2: Send to Supabase 'ai_routing_rules' table.
    };

    const updateBlock = (id: string, fields: Partial<InternalItineraryBlock>) => {
        let updates: Partial<TripData> = {
            itinerary: tripData.itinerary.map(b => b.id === id ? { ...b, ...fields } : b)
        };

        // Sync to global transports if applicable
        if ((fields.transportId !== undefined || fields.driverId !== undefined || fields.guideId !== undefined || fields.vehicleId !== undefined) && tripData.transports && tripData.transports.length > 0) {
            let transportUpdates = { ...tripData.transports[0] };
            
            if (fields.transportId && masterData.transportProviders) {
                const p = masterData.transportProviders.find((x:any) => x.id === fields.transportId);
                if (p) transportUpdates.supplier = p.name;
            }
            
            if (fields.vehicleId && masterData.transportProviders) {
                const p = masterData.transportProviders.find((x:any) => x.id === fields.transportId || x.transport_vehicles?.some((v:any) => v.id === fields.vehicleId));
                if (p) {
                    const v = p.transport_vehicles?.find((vx:any) => vx.id === fields.vehicleId);
                    if (v) transportUpdates.vehicleNumber = v.vehicle_number || v.make_and_model || '';
                }
            }
            
            if (fields.driverId && masterData.drivers) {
                const d = masterData.drivers.find((x:any) => x.id === fields.driverId);
                if (d) {
                    transportUpdates.driverName = `${d.first_name} ${d.last_name}`.trim();
                    transportUpdates.driverContact = d.phone || '';
                }
            } else if (fields.driverId === null || fields.driverId === undefined && 'driverId' in fields) {
                 // if cleared
                 if ('driverId' in fields && fields.driverId === undefined) {
                     transportUpdates.driverName = '';
                     transportUpdates.driverContact = '';
                 }
            }
            
            if (fields.guideId && masterData.guides) {
                const g = masterData.guides.find((x:any) => x.id === fields.guideId);
                if (g) {
                    transportUpdates.guideAssigned = true;
                    transportUpdates.guideDetails = `${g.first_name} ${g.last_name}`.trim();
                }
            }
            
            updates.transports = [transportUpdates, ...tripData.transports.slice(1)];
        }

        updateData(updates);
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
        const targetDay = block.dayNumber + (direction === 'next' ? 1 : -1);
        if (targetDay < 0) return;
        recordAgentCorrection('MOVED_DAY', block.id, { from: block.dayNumber, to: targetDay });
        updateData({ itinerary: tripData.itinerary.map(b => b.id === blockId ? { ...b, dayNumber: targetDay } : b) });
    };

    const moveBlockPosition = (blockId: string, direction: 'up' | 'down') => {
        const block = tripData.itinerary.find(b => b.id === blockId);
        if (!block) return;

        const dayBlocks = tripData.itinerary.filter(b => b.dayNumber === block.dayNumber);
        const index = dayBlocks.findIndex(b => b.id === blockId);

        if (direction === 'up' && index > 0) {
            [dayBlocks[index], dayBlocks[index - 1]] = [dayBlocks[index - 1], dayBlocks[index]];
        } else if (direction === 'down' && index < dayBlocks.length - 1) {
            [dayBlocks[index], dayBlocks[index + 1]] = [dayBlocks[index + 1], dayBlocks[index]];
        } else {
            return;
        }

        recordAgentCorrection('REORDERED_TIME', block.id, { shift: direction });
        const otherDaysBlocks = tripData.itinerary.filter(b => b.dayNumber !== block.dayNumber);
        updateData({ itinerary: [...otherDaysBlocks, ...dayBlocks].sort((a, b) => a.dayNumber - b.dayNumber) });
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
        const h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);
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

        recordAgentCorrection('REMOVED_ACTIVITY', blockId, { fromDay: dayNumber });
        dayBlocks.splice(blockIndex, 1);

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

    const addNewBlock = (dayNumber: number, type: InternalItineraryBlock['type'] = 'activity') => {
        const dayBlocks = tripData.itinerary
            .filter(b => b.dayNumber === dayNumber)
            .sort((a, b) => timeToMins(a.endTime) - timeToMins(b.endTime));

        let startTime = "09:00";
        if (dayBlocks.length > 0) {
            startTime = dayBlocks[dayBlocks.length - 1].endTime;
        }

        const typeNames: Record<string, string> = {
            'activity': 'New Activity',
            'travel': 'New Transport',
            'meal': 'New Meal',
            'sleep': 'New Hotel Stay',
            'guide': 'Guided Segment',
            'custom': 'Custom Block'
        };

        const newBlock: InternalItineraryBlock = {
            id: crypto.randomUUID(),
            dayNumber,
            type,
            name: typeNames[type as string] || 'New Block',
            startTime,
            endTime: shiftTime(startTime, 60),
            bufferMins: 15,
            durationHours: 1,
            confirmationStatus: 'Pending',
            paymentStatus: 'Pending',
            internalNotes: '',
            comments: []
        };

        updateData({
            itinerary: [...tripData.itinerary, newBlock]
        });
    };

    const sortDayBlocks = (dayNum: number) => {
        const dayBlocks = tripData.itinerary.filter(b => b.dayNumber === dayNum);
        const otherDays = tripData.itinerary.filter(b => b.dayNumber !== dayNum);

        dayBlocks.sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));

        updateData({
            itinerary: [...otherDays, ...dayBlocks].sort((a, b) => a.dayNumber - b.dayNumber)
        });
    };

    const iconType = (type: string) => {
        switch (type) {
            case 'activity': return <ActivityIcon size={16} className="text-orange-500" />;
            case 'travel': return <Navigation size={16} className="text-blue-500" />;
            case 'meal': return <Utensils size={16} className="text-green-500" />;
            case 'sleep': return <BedDouble size={16} className="text-indigo-500" />;
            case 'guide': return <UserCheck size={16} className="text-amber-500" />;
            default: return <ListTree size={16} className="text-neutral-500" />;
        }
    };

    const days = useMemo(() => {
        return tripData.itinerary.reduce((acc, block) => {
            if (!acc[block.dayNumber]) acc[block.dayNumber] = [];
            acc[block.dayNumber].push(block);
            return acc;
        }, {} as Record<number, InternalItineraryBlock[]>);
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
                let newAccs = [...tripData.accommodations];
                const existingAccIndex = newAccs.findIndex(a => a.nightIndex === block.dayNumber);
                
                if (existingAccIndex >= 0) {
                    newAccs[existingAccIndex] = {
                        ...newAccs[existingAccIndex],
                        hotelId: hotel.id,
                        hotelName: hotel.name,
                        stayClass: hotel.hotel_class || newAccs[existingAccIndex].stayClass,
                        address: hotel.location_address || newAccs[existingAccIndex].address,
                        // Clear room specific selections if switching to a different hotel
                        ...(newAccs[existingAccIndex].hotelId !== hotel.id ? { roomId: undefined, roomName: '', roomStandard: '', mealPlan: undefined, pricePerNight: 0, selectedRooms: [] } : {})
                    };
                } else {
                    newAccs.push({
                        id: crypto.randomUUID(),
                        nightIndex: block.dayNumber,
                        hotelId: hotel.id,
                        hotelName: hotel.name,
                        stayClass: hotel.hotel_class || 'Standard',
                        address: hotel.location_address || '',
                        mapLink: '',
                        contactPerson: hotel.reservation_agent_name || '',
                        contactNumber: hotel.reservation_agent_contact || '',
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
                        specialRequests: '',
                        selectedRooms: []
                    });
                }
                updates.accommodations = newAccs;
            }
        }

        // Sync logic for transport defaults
        if (field === 'transportId' && block.type === 'travel') {
            const provider = masterData.transportProviders.find(p => p.id === value);
            if (provider) {
                updates.itinerary = tripData.itinerary.map(b => b.id === blockId ? {
                    ...b,
                    transportId: value,
                    transportRateType: 'day',
                    transportQuantity: 1
                } : b);
            }
        }

        updateData(updates);
    };

    const handleSaveRules = async () => {
        setIsSavingRules(true);
        try {
            // Save Generic Rule
            await saveAIRuleAction({
                rule_type: 'generic',
                content: aiRules.generic,
                tour_id: null
            });

            // Save Specific Rule
            await saveAIRuleAction({
                rule_type: 'specific',
                content: aiRules.specific,
                tour_id: tripData.id || null
            });

            setShowAIRules(false);
        } catch (error) {
            console.error("Failed to save AI rules:", error);
        } finally {
            setIsSavingRules(false);
        }
    };


    const filteredMasterData = useMemo(() => {
        if (!activeAssignment) return [];
        const terms = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);

        const checkMatch = (fields: (string | undefined | null)[]) => {
            if (terms.length === 0) return true;
            const combined = fields.filter(f => f).map(f => f!.toLowerCase()).join(' ');
            return terms.every(t => combined.includes(t));
        };

        switch (activeAssignment.type) {
            case 'sleep':
                return masterData.hotels.filter(h => checkMatch([h.name, h.closest_city, h.location_address]));
            case 'activity':
                return masterData.vendors.filter(v => {
                    const activityStrings = v.vendor_activities?.flatMap(va => {
                        const actData = (va as any).activities || (va as any).activity;
                        return [
                            va.activity_name,
                            actData?.location_name,
                            actData?.district
                        ];
                    }) || [];
                    return checkMatch([v.name, v.address, ...activityStrings]);
                });
            case 'meal':
                return masterData.restaurants.filter(r => checkMatch([r.name, r.address, r.city, r.district]));
            case 'travel':
                return {
                    providers: masterData.transportProviders.filter(p => checkMatch([p.name, p.address])),
                    drivers: masterData.drivers.filter(d => checkMatch([d.first_name, d.last_name]))
                };
            case 'guide':
                return masterData.guides.filter(g => checkMatch([g.first_name, g.last_name]));
            default:
                return [];
        }
    }, [activeAssignment, searchTerm, masterData]);

    const getBindingDisplay = (block: InternalItineraryBlock) => {
        if (block.type === 'sleep' && block.hotelId) {
            const h = masterData.hotels.find(x => x.id === block.hotelId);
            const acc = tripData.accommodations.find(a => a.nightIndex === block.dayNumber);
            let label = h?.name || 'Linked Hotel';
            if (acc?.selectedRooms && acc.selectedRooms.length > 0) {
                const roomSummaries = (acc.selectedRooms || []).map((sr: any) => `${sr.quantity}x ${sr.roomName || sr.roomStandard} (${sr.mealPlan || 'BB'})`);
                label += ` - ${roomSummaries.join(', ')}`;
            } else if (acc?.roomName || acc?.roomStandard) {
                label += ` - ${acc.roomName || acc.roomStandard}`;
                if (acc.mealPlan) label += ` (${acc.mealPlan})`;
                if ((acc.numberOfRooms || 1) > 1) label += ` [x${acc.numberOfRooms}]`;
            }
            return {
                name: label,
                icon: <BedDouble size={12} className="text-indigo-500" />,
                contact: h ? {
                    name: h.sales_agent_name || h.reservation_agent_name || h.gm_name || 'Reservations / Sales',
                    phone: h.sales_agent_contact || h.reservation_agent_contact || h.gm_contact || ''
                } : undefined
            };
        }
        if (block.type === 'activity' && (block.vendorId || block.vendorActivityId || block.activityId)) {
            const v = masterData.vendors.find(x => x.id === block.vendorId);
            const va = v?.vendor_activities?.find((x: any) => x.id === block.vendorActivityId);

            // If we have a vendor, show Vendor - Activity (Price)
            if (v) {
                const activityLabel = va?.activity_name || block.name || 'Activity';
                const price = va?.vendor_price || block.agreedPrice;

                let label = `${v.name} - ${activityLabel}`;
                if (price) label += ` (LKR ${price.toLocaleString()})`;
                return {
                    name: label,
                    icon: <ActivityIcon size={12} className="text-orange-500" />,
                    contact: { name: 'Vendor', phone: v.phone || '' }
                };
            }

            // Fallback: show block name + price even if vendor data is not yet loaded in UI
            let fallbackLabel = block.name || 'Linked Activity';
            if (block.agreedPrice) fallbackLabel += ` (LKR ${block.agreedPrice.toLocaleString()})`;

            return { name: fallbackLabel, icon: <ActivityIcon size={12} className="text-orange-500" /> };
        }
        if (block.type === 'travel' && (block.driverId || block.transportId || block.vehicleId)) {
            const d = masterData.drivers.find(x => x.id === block.driverId);
            const p = masterData.transportProviders.find(x => x.id === block.transportId);
            const v = p?.transport_vehicles?.find((x: any) => x.id === block.vehicleId);

            let label = p?.name || 'Transport Provider';
            let contact = undefined;
            if (v) {
                label = `${p?.name || ''} - ${v.make_and_model || v.vehicle_type}`;
                if (block.transportQuantity) {
                    label += ` [${block.transportQuantity} ${block.transportRateType === 'km' ? 'KM' : 'Day(s)'}]`;
                }
                if (v.with_driver) label += ' [Incl. Driver]';
                else if (d) label += ` [Driver: ${d.first_name}]`;

                if (d) contact = { name: `${d.first_name} (Driver)`, phone: d.phone || '' };
                else if (p) contact = { name: p.name, phone: p.phone || '' };

            } else if (d) {
                label = `Driver: ${d.first_name} ${d.last_name}`;
                contact = { name: `${d.first_name} (Driver)`, phone: d.phone || '' };
            } else if (p) {
                contact = { name: p.name, phone: p.phone || '' };
            }

            return { name: label, icon: <CarIcon size={12} className="text-blue-500" />, contact };
        }
        if (block.type === 'guide' && block.guideId) {
            const g = masterData.guides.find(x => x.id === block.guideId);
            return {
                name: g ? `${g.first_name} ${g.last_name}` : 'Linked Guide',
                icon: <UserCheck size={12} className="text-amber-500" />,
                contact: g ? { name: g.first_name, phone: g.phone || '' } : undefined
            };
        }
        if (block.type === 'meal' && block.restaurantId) {
            const r = masterData.restaurants.find(x => x.id === block.restaurantId);
            let label = r?.name || 'Linked Restaurant';
            if (block.mealType) label += ` - ${block.mealType}`;
            if (block.agreedPrice) label += ` (LKR ${block.agreedPrice.toLocaleString()})`;
            return {
                name: label,
                icon: <Utensils size={12} className="text-green-500" />,
                contact: r ? { name: r.contact_name || r.name, phone: r.contact_number || '' } : undefined
            };
        }
        return null;
    };

    return (
        <div className="relative">
            <div className="space-y-6">
                {/* Dashboard Header */}
                {!readOnly && (
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
                            <div className="flex items-center gap-3">
                                <select
                                    value={engineChoice}
                                    onChange={e => setEngineChoice(e.target.value as 'standard' | 'ai')}
                                    className="bg-neutral-50 border border-neutral-200 text-sm font-bold text-neutral-600 px-3 py-2.5 rounded-xl focus:ring-1 focus:ring-brand-gold outline-none"
                                >
                                    <option value="standard">Standard Engine</option>
                                    <option value="ai">AI Smart Builder ✦</option>
                                </select>

                                {engineChoice === 'ai' && (
                                    <button
                                        onClick={() => setShowAIRules(true)}
                                        className="flex items-center gap-2 bg-white border border-brand-gold/50 text-brand-gold px-4 py-2.5 rounded-xl hover:bg-brand-gold/5 transition-all font-bold text-sm shadow-sm"
                                    >
                                        <ShieldCheck size={16} />
                                        AI Rules
                                    </button>
                                )}

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
                    </div>
                )}


                {/* Itinerary Summary Dashboard */}
                {tripData.summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-brand-gold/10 shadow-sm flex items-center gap-3">
                            <div className="p-2 bg-orange-50 rounded-lg"><Navigation size={18} className="text-orange-500" /></div>
                            <div>
                                <p className="text-[10px] text-neutral-400 font-bold uppercase">Total Distance</p>
                                <p className="text-sm font-bold text-neutral-800">{tripData.summary.totalDistanceKm} KM</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-brand-gold/10 shadow-sm flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg"><MapPin size={18} className="text-blue-500" /></div>
                            <div>
                                <p className="text-[10px] text-neutral-400 font-bold uppercase">Cities Visited</p>
                                <p className="text-sm font-bold text-neutral-800">{tripData.summary.totalCities} Cities</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-brand-gold/10 shadow-sm flex items-center gap-3">
                            <div className="p-2 bg-green-50 rounded-lg"><ActivityIcon size={18} className="text-green-500" /></div>
                            <div>
                                <p className="text-[10px] text-neutral-400 font-bold uppercase">Activities</p>
                                <p className="text-sm font-bold text-neutral-800">{tripData.summary.totalActivities}</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-brand-gold/10 shadow-sm overflow-hidden">
                            <p className="text-[10px] text-neutral-400 font-bold uppercase mb-2">Activity Mix</p>
                            <div className="flex flex-wrap gap-1">
                                {Object.entries(tripData.summary.activityTypeMix).length > 0 ? (
                                    Object.entries(tripData.summary.activityTypeMix).map(([cat, count]) => (
                                        <span key={cat} className="text-[9px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-full font-bold">
                                            {cat}: {count}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-[9px] text-neutral-400 italic">No activities assigned</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Assignment Defaults */}
                {!readOnly && tripData.itinerary.length > 0 && (
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

                {!readOnly && tripData.itinerary.length > 0 && (
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
                        {Object.entries(days).sort(([a], [b]) => Number(a) - Number(b)).map(([dayStr, blocks]) => {
                            const dayNum = Number(dayStr);
                            const isUnscheduled = dayNum === 0;

                            let actualDate = "";
                            if (!isUnscheduled && tripData.profile.arrivalDate) {
                                try {
                                    const date = new Date(tripData.profile.arrivalDate);
                                    date.setDate(date.getDate() + (dayNum - 1));
                                    actualDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                } catch (e) {
                                    console.error("Error calculating date:", e);
                                }
                            }

                            return (
                                <div key={dayStr} className={`group/day relative pl-8 border-l-2 ml-4 pb-4 ${isUnscheduled ? 'border-orange-200 border-dashed bg-orange-50/10 -ml-4 pl-12 rounded-xl mt-8 pt-4' : 'border-neutral-100'}`}>
                                    <div className={`absolute ${isUnscheduled ? 'left-1' : '-left-3'} top-4 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center text-[10px] text-white font-bold ${isUnscheduled ? 'bg-orange-500' : 'bg-brand-gold'}`}>
                                        {isUnscheduled ? '!' : dayStr}
                                    </div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className={`text-lg font-serif font-bold tracking-tight ${isUnscheduled ? 'text-orange-600' : 'text-brand-charcoal'}`}>
                                            {isUnscheduled ? 'Unscheduled Holding Area' : `Day ${dayStr}`}
                                            {actualDate && <span className="text-sm font-sans text-neutral-400 font-normal ml-2">({actualDate})</span>}
                                            {isUnscheduled ? <span className="text-xs font-sans text-orange-400 ml-2 font-bold uppercase tracking-widest">(Needs Action)</span> : ' Journey'}
                                        </h4>
                                        {!readOnly && (
                                            <div className="flex gap-4 opacity-0 group-hover/day:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => sortDayBlocks(dayNum)}
                                                className="text-neutral-300 hover:text-brand-green font-bold text-[10px] uppercase tracking-widest flex items-center gap-1"
                                                title="Sort blocks chronologically"
                                            >
                                                <RefreshCcw size={10} /> Sort by Time
                                            </button>
                                            <button
                                                onClick={() => removeDay(dayStr)}
                                                className="text-neutral-300 hover:text-red-500 font-bold text-[10px] uppercase tracking-widest"
                                            >
                                                Remove Day
                                            </button>
                                        </div>
                                        )}
                                    </div>

                                    <div className="grid gap-3">
                                        {blocks.map((block, idx) => {
                                            const binding = getBindingDisplay(block);
                                            return (
                                                <div key={block.id} className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-sm hover:shadow-md hover:border-brand-gold/30 transition-all group flex flex-col md:flex-row gap-4 items-center">
                                                    <div className="flex items-center gap-4 flex-1 w-full">
                                                        <div className="w-20 text-center">
                                                            <TimeInput value={block.startTime} onChange={v => updateBlock(block.id, { startTime: v })} disabled={readOnly} />
                                                            <div className="h-4 w-[1px] bg-neutral-100 mx-auto my-1"></div>
                                                            <TimeInput value={block.endTime} onChange={v => updateBlock(block.id, { endTime: v })} disabled={readOnly} />
                                                        </div>

                                                        <div className="p-2.5 bg-neutral-50 rounded-xl">
                                                            {iconType(block.type)}
                                                        </div>

                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <DebouncedInput value={block.name} onChange={v => updateBlock(block.id, { name: v })} disabled={readOnly} className="font-bold text-neutral-800 bg-transparent border-none p-0 focus:ring-0 w-full" />
                                                            </div>
                                                            {block.type !== 'guide' && (
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <div className="flex items-center gap-1 flex-1 bg-neutral-50/50 rounded-md px-2 py-1 border border-transparent focus-within:border-neutral-200 focus-within:bg-white transition-colors">
                                                                        <MapPin size={10} className="text-neutral-400 shrink-0" />
                                                                        <DebouncedInput
                                                                            value={block.locationName || ''}
                                                                            onChange={v => updateBlock(block.id, { locationName: v })}
                                                                            placeholder="Location"
                                                                            disabled={readOnly}
                                                                            className="text-[10px] text-neutral-500 bg-transparent border-none p-0 focus:ring-0 w-full placeholder:text-neutral-300"
                                                                        />
                                                                    </div>
                                                                    {block.type === 'travel' && (
                                                                        <div className="flex items-center gap-1 w-24 bg-neutral-50/50 rounded-md px-2 py-1 border border-transparent focus-within:border-neutral-200 focus-within:bg-white transition-colors">
                                                                            <Navigation size={10} className="text-neutral-400 shrink-0" />
                                                                            <DebouncedInput
                                                                                value={block.distance || ''}
                                                                                onChange={v => updateBlock(block.id, { distance: v })}
                                                                                placeholder="Distance"
                                                                                disabled={readOnly}
                                                                                className="text-[10px] text-neutral-500 bg-transparent border-none p-0 focus:ring-0 w-full placeholder:text-neutral-300"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {block.type === 'sleep' && block.hotelId && activeAssignment?.blockId !== block.id && (() => {
                                                                const hotel = masterData.hotels.find(h => h.id === block.hotelId);
                                                                const acc = tripData.accommodations.find(a => a.nightIndex === block.dayNumber);
                                                                if (!hotel || !acc) return null;

                                                                let totalRooms = 0;
                                                                let totalPrice = 0;

                                                                return (
                                                                    <div className="mt-3 w-full bg-indigo-50/20 border border-indigo-100 rounded-xl overflow-hidden text-xs">
                                                                        <div className="bg-indigo-50/50 px-3 py-2 border-b border-indigo-100 flex justify-between items-center">
                                                                            <span className="font-bold text-indigo-900">{hotel.name} <span className="text-indigo-400 font-normal">({hotel.hotel_class || 'Unrated'} Star)</span></span>
                                                                            {hotel.sales_agent_contact || hotel.reservation_agent_contact || hotel.gm_contact ? (
                                                                                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-100/50 px-2 py-0.5 rounded-full border border-indigo-200">
                                                                                    📞 {hotel.sales_agent_contact || hotel.reservation_agent_contact || hotel.gm_contact}
                                                                                </span>
                                                                            ) : null}
                                                                        </div>
                                                                        <div className="p-3">
                                                                            {/* Room Details Table */}
                                                                            <div className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-2 pb-2 mb-2 border-b border-indigo-100 text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                                                                                <div>Type</div>
                                                                                <div>Room Name & Standard</div>
                                                                                <div className="text-center">Count</div>
                                                                                <div className="text-center">Meal Plan</div>
                                                                                <div className="text-right">Total Price</div>
                                                                            </div>
                                                                            {['Single', 'Double', 'Twin', 'Triple', 'Family'].map(rType => {
                                                                                const room = acc.selectedRooms?.find((sr: any) => sr.reqId === rType);
                                                                                if (!room || room.quantity === 0) return null;
                                                                                totalRooms += room.quantity;
                                                                                const price = room.agreedTotal !== undefined ? room.agreedTotal : (room.pricePerNight * room.quantity);
                                                                                totalPrice += price;
                                                                                return (
                                                                                    <div key={rType} className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-2 py-1 items-center text-indigo-900">
                                                                                        <div className="font-bold">{rType}</div>
                                                                                        <div className="truncate" title={`${room.roomName} (${room.roomStandard})`}>{room.roomName} <span className="text-indigo-400">({room.roomStandard})</span></div>
                                                                                        <div className="text-center">
                                                                                            <input 
                                                                                                type="number" 
                                                                                                min="0"
                                                                                                value={room.quantity}
                                                                                                disabled={readOnly}
                                                                                                onChange={(e) => {
                                                                                                    const newQty = parseInt(e.target.value) || 0;
                                                                                                    const newSelected = (acc.selectedRooms || []).map((sr: any) => sr.reqId === rType ? { ...sr, quantity: newQty } : sr).filter((sr: any) => sr.quantity > 0);
                                                                                                    updateData({ accommodations: tripData.accommodations.map((a: any) => a.nightIndex === block.dayNumber ? { ...a, selectedRooms: newSelected } : a) });
                                                                                                }}
                                                                                                className="w-12 text-center font-bold bg-white border border-indigo-200 rounded py-0.5 shadow-sm outline-none focus:border-indigo-500 disabled:bg-neutral-50"
                                                                                            />
                                                                                        </div>
                                                                                        <div className="text-center">
                                                                                            <select 
                                                                                                value={room.mealPlan}
                                                                                                disabled={readOnly}
                                                                                                onChange={(e) => {
                                                                                                    const newSelected = (acc.selectedRooms || []).map((sr: any) => sr.reqId === rType ? { ...sr, mealPlan: e.target.value } : sr);
                                                                                                    updateData({ accommodations: tripData.accommodations.map((a: any) => a.nightIndex === block.dayNumber ? { ...a, selectedRooms: newSelected } : a) });
                                                                                                }}
                                                                                                className="w-14 text-[10px] font-bold bg-white border border-indigo-200 rounded py-1 outline-none focus:border-indigo-500 disabled:bg-neutral-50"
                                                                                            >
                                                                                                <option value="BB">BB</option>
                                                                                                <option value="HB">HB</option>
                                                                                                <option value="FB">FB</option>
                                                                                                <option value="AI">AI</option>
                                                                                            </select>
                                                                                        </div>
                                                                                        <div className="text-right flex items-center justify-end gap-1">
                                                                                            <span className="text-indigo-400 font-bold">$</span>
                                                                                            <input 
                                                                                                type="number" 
                                                                                                min="0"
                                                                                                value={price}
                                                                                                disabled={readOnly}
                                                                                                onChange={(e) => {
                                                                                                    const newTotal = parseFloat(e.target.value) || 0;
                                                                                                    const newSelected = (acc.selectedRooms || []).map((sr: any) => sr.reqId === rType ? { ...sr, agreedTotal: newTotal } : sr);
                                                                                                    updateData({ accommodations: tripData.accommodations.map((a: any) => a.nightIndex === block.dayNumber ? { ...a, selectedRooms: newSelected } : a) });
                                                                                                }}
                                                                                                className="w-16 text-right font-bold bg-white border border-indigo-200 rounded py-0.5 shadow-sm outline-none focus:border-indigo-500 disabled:bg-neutral-50"
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                            {totalRooms === 0 && (
                                                                                <div className="text-center py-2 text-indigo-300 italic font-medium text-[10px]">No rooms configured. Select rooms in the binder drawer.</div>
                                                                            )}
                                                                            {totalRooms > 0 && (
                                                                                <div className="flex justify-between items-center pt-2 mt-2 border-t border-indigo-100 text-indigo-900 font-black">
                                                                                    <span>Total ({totalRooms} Rooms)</span>
                                                                                    <span>${totalPrice.toFixed(0)}</span>
                                                                                </div>
                                                                            )}

                                                                            {/* Logistics Configuration (Driver/Guide) */}
                                                                            <div className="mt-4 pt-3 border-t border-indigo-100 flex flex-wrap gap-4 text-[10px]">
                                                                                <label className="flex items-center gap-1.5 cursor-pointer">
                                                                                    <input type="checkbox" checked={!!block.driverMealIncluded} onChange={e => updateBlock(block.id, { driverMealIncluded: e.target.checked })} disabled={readOnly} className="rounded border-indigo-300 text-indigo-500 focus:ring-indigo-500 disabled:opacity-50" />
                                                                                    <span className="font-bold text-indigo-700">Driver Meal</span>
                                                                                </label>
                                                                                <label className="flex items-center gap-1.5 cursor-pointer">
                                                                                    <input type="checkbox" checked={!!block.driverAccIncluded} onChange={e => updateBlock(block.id, { driverAccIncluded: e.target.checked })} disabled={readOnly} className="rounded border-indigo-300 text-indigo-500 focus:ring-indigo-500 disabled:opacity-50" />
                                                                                    <span className="font-bold text-indigo-700">Driver Accommodation</span>
                                                                                </label>
                                                                                <label className="flex items-center gap-1.5 cursor-pointer">
                                                                                    <input type="checkbox" checked={!!block.parkingIncluded} onChange={e => updateBlock(block.id, { parkingIncluded: e.target.checked })} disabled={readOnly} className="rounded border-indigo-300 text-indigo-500 focus:ring-indigo-500 disabled:opacity-50" />
                                                                                    <span className="font-bold text-indigo-700">Parking</span>
                                                                                </label>
                                                                                <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
                                                                                    <span className="font-bold text-indigo-700">Guide Discount:</span>
                                                                                    <select value={block.guideRoomDiscount || ''} onChange={e => updateBlock(block.id, { guideRoomDiscount: e.target.value as any })} disabled={readOnly} className="bg-white border border-indigo-200 text-indigo-700 font-bold rounded px-2 py-0.5 outline-none focus:border-indigo-400 disabled:bg-neutral-50 disabled:opacity-50">
                                                                                        <option value="">None</option>
                                                                                        <option value="Half Price">Half Price</option>
                                                                                        <option value="Free">Free</option>
                                                                                    </select>
                                                                                </label>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}

                                                            {block.type === 'meal' && block.restaurantId && activeAssignment?.blockId !== block.id && (() => {
                                                                const restaurant = masterData.restaurants.find(r => r.id === block.restaurantId);
                                                                if (!restaurant) return null;

                                                                const quantity = block.restaurantQuantity || tripData.profile?.adults || 1;
                                                                const unitPrice = block.agreedPrice || 0;
                                                                const totalPrice = unitPrice * quantity;

                                                                return (
                                                                    <div className="mt-3 w-full bg-emerald-50/20 border border-emerald-100 rounded-xl overflow-hidden text-xs">
                                                                        <div className="bg-emerald-50/50 px-3 py-2 border-b border-emerald-100 flex justify-between items-center">
                                                                            <span className="font-bold text-emerald-900">{restaurant.name} <span className="text-emerald-500 font-normal">({restaurant.cuisine_type || 'General'} Cuisine)</span></span>
                                                                            {restaurant.contact_number ? (
                                                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                                                    📞 {restaurant.contact_number}
                                                                                </span>
                                                                            ) : null}
                                                                        </div>
                                                                        <div className="p-3">
                                                                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 pb-2 mb-2 border-b border-emerald-100 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                                                                                <div>Meal Type</div>
                                                                                <div className="text-center">Pax Count</div>
                                                                                <div className="text-right">Unit Price</div>
                                                                                <div className="text-right">Total Price</div>
                                                                            </div>
                                                                            
                                                                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 py-1 items-center text-emerald-900">
                                                                                <div className="font-bold">
                                                                                    {block.mealType || 'Meal'}
                                                                                </div>
                                                                                <div className="text-center">
                                                                                    <input 
                                                                                        type="number" 
                                                                                        min="1"
                                                                                        value={quantity}
                                                                                        disabled={readOnly}
                                                                                        onChange={(e) => {
                                                                                            const newQty = parseInt(e.target.value) || 1;
                                                                                            updateBlock(block.id, { restaurantQuantity: newQty });
                                                                                        }}
                                                                                        className="w-16 text-center font-bold bg-white border border-emerald-200 rounded py-0.5 shadow-sm outline-none focus:border-emerald-500 disabled:bg-neutral-50"
                                                                                    />
                                                                                </div>
                                                                                <div className="text-right flex items-center justify-end gap-1">
                                                                                    <span className="text-emerald-400 font-bold">LKR</span>
                                                                                    <input 
                                                                                        type="number" 
                                                                                        min="0"
                                                                                        value={unitPrice}
                                                                                        disabled={readOnly}
                                                                                        onChange={(e) => {
                                                                                            const newPrice = parseFloat(e.target.value) || 0;
                                                                                            updateBlock(block.id, { agreedPrice: newPrice });
                                                                                        }}
                                                                                        className="w-20 text-right font-bold bg-white border border-emerald-200 rounded py-0.5 shadow-sm outline-none focus:border-emerald-500 disabled:bg-neutral-50"
                                                                                    />
                                                                                </div>
                                                                                <div className="text-right font-black">
                                                                                    LKR {totalPrice.toLocaleString()}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}

                                                            <div className="mt-3 w-full border border-neutral-100 rounded-xl overflow-hidden bg-neutral-50/30">
                                                                <div className="bg-neutral-50 px-3 py-2 border-b border-neutral-100 flex justify-between items-center">
                                                                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Line-Item Discussion</span>
                                                                </div>
                                                                {block.comments && block.comments.length > 0 && (
                                                                    <div className="p-3 max-h-40 overflow-y-auto space-y-2 flex flex-col">
                                                                        {block.comments.map(c => {
                                                                            const isCurrentUser = c.role === currentUserRole;
                                                                            return (
                                                                                <div key={c.id} className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${isCurrentUser ? 'bg-brand-gold/10 border-brand-gold/20 text-brand-charcoal self-end' : 'bg-blue-50 border-blue-100 text-blue-900 self-start'} border`}>
                                                                                    <div className={`text-[9px] font-bold uppercase mb-1 ${isCurrentUser ? 'text-brand-gold' : 'text-blue-600'}`}>{c.role}</div>
                                                                                    <div>{c.text}</div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                                <div className="p-2 bg-white flex gap-2 border-t border-neutral-100">
                                                                    <input
                                                                        type="text"
                                                                        value={commentDrafts[block.id] || ''}
                                                                        onChange={e => setCommentDrafts(prev => ({ ...prev, [block.id]: e.target.value }))}
                                                                        onKeyDown={e => e.key === 'Enter' && handleAddComment(block.id)}
                                                                        placeholder="Add a reply..."
                                                                        disabled={savingNote === block.id}
                                                                        className="flex-1 text-xs bg-neutral-50 border border-neutral-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-brand-gold/50 disabled:opacity-50"
                                                                    />
                                                                    <button
                                                                        onClick={() => handleAddComment(block.id)}
                                                                        disabled={savingNote === block.id || !commentDrafts[block.id]?.trim()}
                                                                        className="px-3 py-1.5 bg-brand-gold text-white text-xs font-bold rounded-md hover:bg-brand-gold/90 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[50px]"
                                                                    >
                                                                        {savingNote === block.id ? <RefreshCcw size={12} className="animate-spin" /> : 'Send'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                                            {binding && (!readOnly || block.type !== 'sleep') ? (
                                                                <div className="flex flex-col items-end gap-1 shrink-0 max-w-[200px]">
                                                                    <button
                                                                        onClick={() => !readOnly && setActiveAssignment({ blockId: block.id, type: block.type })}
                                                                        className={`flex items-center gap-2 px-3 py-1.5 bg-brand-gold/5 border border-brand-gold/20 rounded-full text-[11px] font-bold text-brand-gold transition-colors w-full justify-center ${readOnly ? 'cursor-default' : 'hover:bg-brand-gold/10'}`}
                                                                    >
                                                                        {binding.icon}
                                                                        <span className="truncate" title={binding.name}>{binding.name}</span>
                                                                    </button>
                                                                    {binding.contact?.phone && (
                                                                        <a
                                                                            href={`tel:${binding.contact.phone}`}
                                                                            className="flex items-center justify-center gap-1.5 text-[9px] text-neutral-500 bg-neutral-50 hover:bg-neutral-100 hover:text-brand-green px-2 py-1 rounded-md border border-neutral-100 transition-colors mr-2 max-w-[190px]"
                                                                            title={`Call ${binding.contact.name || ''}`}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <Phone size={10} className="shrink-0" />
                                                                            <span className="truncate max-w-full leading-tight font-medium">
                                                                                {binding.contact.name ? <span className="text-neutral-400 mr-1">{binding.contact.name}:</span> : null}
                                                                                <span className="text-neutral-600 font-bold tracking-wider">{binding.contact.phone}</span>
                                                                            </span>
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            ) : !readOnly ? (
                                                                <button
                                                                    onClick={() => setActiveAssignment({ blockId: block.id, type: block.type })}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 border border-neutral-100 rounded-full text-[11px] font-bold text-neutral-400 hover:bg-neutral-100 transition-colors"
                                                                >
                                                                    <Link size={12} />
                                                                    Bind Provider
                                                                </button>
                                                            ) : null}

                                                            {!readOnly && (
                                                                <div className="flex gap-1 items-center">
                                                                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-all justify-center">
                                                                        <button
                                                                            onClick={() => moveBlockDay(block.id, 'prev')}
                                                                            className="p-1 text-neutral-300 hover:text-blue-500 disabled:opacity-30"
                                                                            disabled={block.dayNumber === 0}
                                                                            title="Move to Previous Day"
                                                                        >
                                                                            <ChevronLeft size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => moveBlockDay(block.id, 'next')}
                                                                            className="p-1 text-neutral-300 hover:text-blue-500 disabled:opacity-30"
                                                                            title="Move to Next Day"
                                                                        >
                                                                            <ChevronRight size={14} />
                                                                        </button>
                                                                    </div>

                                                                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-all">
                                                                        <button
                                                                            onClick={() => moveBlockPosition(block.id, 'up')}
                                                                            className="p-1 text-neutral-300 hover:text-brand-green disabled:opacity-30"
                                                                            disabled={idx === 0}
                                                                            title="Move Up"
                                                                        >
                                                                            <ArrowUp size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => moveBlockPosition(block.id, 'down')}
                                                                            className="p-1 text-neutral-300 hover:text-brand-green disabled:opacity-30"
                                                                            disabled={idx === blocks.length - 1}
                                                                            title="Move Down"
                                                                        >
                                                                            <ArrowDown size={14} />
                                                                        </button>
                                                                    </div>
                                                                    <button onClick={() => removeBlock(block.id, block.dayNumber)} className="p-1.5 text-neutral-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-1">
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {!readOnly && (
                                            <div className="mt-4 p-4 border-2 border-dashed border-neutral-100 rounded-[32px] bg-neutral-50/30">
                                                <p className="text-[10px] text-center font-bold text-neutral-400 uppercase tracking-[0.2em] mb-4">Manual Addition • Day {dayStr}</p>
                                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                                    {[
                                                        { type: 'activity', label: 'Activity', icon: <ActivityIcon size={14} />, color: 'orange' },
                                                        { type: 'sleep', label: 'Stay', icon: <BedDouble size={14} />, color: 'indigo' },
                                                        { type: 'travel', label: 'Journey', icon: <Navigation size={14} />, color: 'blue' },
                                                        { type: 'meal', label: 'Meal', icon: <Utensils size={14} />, color: 'green' },
                                                        { type: 'guide', label: 'Guide', icon: <UserCheck size={14} />, color: 'amber' },
                                                        { type: 'custom', label: 'Other', icon: <PlusCircle size={14} />, color: 'neutral' },
                                                    ].map((btn) => (
                                                        <button
                                                            key={btn.type}
                                                            onClick={() => addNewBlock(Number(dayStr), btn.type as any)}
                                                            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-white border border-neutral-100 hover:border-brand-gold/50 hover:shadow-sm transition-all group"
                                                        >
                                                            <div className={`text-${btn.color}-500 group-hover:scale-110 transition-transform`}>
                                                                {btn.icon}
                                                            </div>
                                                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-tight">{btn.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
                }
            </div>

            {/* AI Rules Modal */}
            {showAIRules && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-charcoal/40 backdrop-blur-md p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-br from-neutral-50 to-white">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-brand-gold/10 rounded-2xl">
                                    <ShieldCheck size={24} className="text-brand-gold" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-serif font-bold text-brand-green">AI Routing Intelligence</h3>
                                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-0.5">Constraint & Logic Configuration</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowAIRules(false)}
                                className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-400"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="flex gap-2 mb-8 bg-neutral-100/50 p-1.5 rounded-2xl">
                                <button
                                    onClick={() => setActiveRuleTab('generic')}
                                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeRuleTab === 'generic' ? 'bg-white text-brand-green shadow-sm ring-1 ring-black/5' : 'text-neutral-400 hover:text-neutral-600'}`}
                                >
                                    Global Master Rules
                                </button>
                                <button
                                    onClick={() => setActiveRuleTab('specific')}
                                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeRuleTab === 'specific' ? 'bg-white text-brand-green shadow-sm ring-1 ring-black/5' : 'text-neutral-400 hover:text-neutral-600'}`}
                                >
                                    Itinerary Specific
                                </button>
                            </div>

                            <div className="space-y-4">
                                {activeRuleTab === 'generic' ? (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Universal Logic</h4>
                                            <span className="text-[9px] bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded font-bold">Applies to ALL Itineraries</span>
                                        </div>
                                        <textarea
                                            value={aiRules.generic}
                                            onChange={e => setAiRules({ ...aiRules, generic: e.target.value })}
                                            placeholder="Example: Always include a 30-minute buffer after long drives. Never schedule activities before 9 AM unless it's a safari..."
                                            className="w-full h-64 p-6 bg-neutral-50 border border-neutral-100 rounded-3xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold/20 transition-all font-medium leading-relaxed placeholder:text-neutral-300"
                                        />
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Context Override</h4>
                                            <span className="text-[9px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded font-bold">Specific to this client</span>
                                        </div>
                                        <textarea
                                            value={aiRules.specific}
                                            onChange={e => setAiRules({ ...aiRules, specific: e.target.value })}
                                            placeholder="Example: Client prefers slow mornings. Prioritize wildlife sightings over museum visits for this trip..."
                                            className="w-full h-64 p-6 bg-neutral-50 border border-neutral-100 rounded-3xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold/20 transition-all font-medium leading-relaxed placeholder:text-neutral-300"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-8 bg-neutral-50/50 border-t border-neutral-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-neutral-400">
                                <Info size={14} />
                                <p className="text-[10px] font-bold uppercase tracking-tight">Changes are stored in the routing engine</p>
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setShowAIRules(false)}
                                    className="px-6 py-3 text-sm font-bold text-neutral-500 hover:text-neutral-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveRules}
                                    disabled={isSavingRules}
                                    className="flex items-center gap-2 bg-brand-green text-white px-8 py-3 rounded-2xl hover:shadow-lg hover:shadow-brand-green/20 transition-all font-black text-xs uppercase tracking-widest disabled:opacity-50"
                                >
                                    {isSavingRules ? <RefreshCcw className="animate-spin" size={16} /> : <Check size={16} />}
                                    Save Intelligence
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assignment Drawer Overlay */}

            {
                activeAssignment && (
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
                                    {activeAssignment.type === 'sleep' && (() => {
                                        const activeBlock = tripData.itinerary.find(b => b.id === activeAssignment.blockId);
                                        const dayNumber = activeBlock?.dayNumber || 1;
                                        let stayDate = "";
                                        if (tripData.profile?.arrivalDate) {
                                            const d = new Date(tripData.profile.arrivalDate);
                                            d.setDate(d.getDate() + (dayNumber - 1));
                                            stayDate = d.toISOString().split('T')[0];
                                        }

                                        return (
                                            <>
                                                <div className="grid grid-cols-1 gap-4 p-4">
                                                    {(filteredMasterData as any[]).map(h => {
                                                        const assignedHotelId = tripData.itinerary.find(b => b.id === activeAssignment.blockId)?.hotelId;
                                                        const isSelected = assignedHotelId === h.id;

                                                        const rooms = h.hotel_rooms || [];
                                                        const applicableRates = rooms.flatMap((r: any) => {
                                                            if (!r.room_rates || r.room_rates.length === 0) return [];
                                                            return r.room_rates.filter((rr: any) => {
                                                                if (!stayDate) return true;
                                                                if (rr.start_date && rr.end_date) {
                                                                    return stayDate >= rr.start_date && stayDate <= rr.end_date;
                                                                }
                                                                return true;
                                                            }).flatMap((rr: any) => [
                                                                rr.sgl_bb_rate, rr.sgl_hb_rate, rr.sgl_fb_rate, rr.sgl_ai_rate,
                                                                rr.dbl_bb_rate, rr.dbl_hb_rate, rr.dbl_fb_rate, rr.dbl_ai_rate,
                                                                rr.tpl_bb_rate, rr.tpl_hb_rate, rr.tpl_fb_rate, rr.tpl_ai_rate,
                                                                rr.qud_bb_rate, rr.qud_hb_rate, rr.qud_fb_rate, rr.qud_ai_rate,
                                                                rr.rate
                                                            ]);
                                                        }).filter((rate: any) => rate && rate > 0);

                                                        const minRate = applicableRates.length > 0 ? Math.min(...applicableRates) : (h.base_rate || 0);

                                                        const amenities = [
                                                            { key: 'internet', icon: <Wifi size={12} />, label: 'WiFi' },
                                                            { key: 'outdoor_pool', icon: <Waves size={12} />, label: 'Pool' },
                                                            { key: 'wellness', icon: <HeartPulse size={12} />, label: 'Spa' },
                                                            { key: 'business_facility', icon: <Briefcase size={12} />, label: 'Business' },
                                                            { key: 'airport_shuttle', icon: <Plane size={12} />, label: 'Shuttle' },
                                                            { key: 'parking', icon: <CarIcon size={12} />, label: 'Parking' },
                                                        ].filter(a => h[a.key]);

                                                        return (
                                                            <div key={h.id} className="space-y-3">
                                                                <button onClick={() => bindProvider(activeAssignment.blockId, 'hotelId', h.id)}
                                                                    className={`w-full p-4 rounded-xl border text-left transition-all flex flex-col gap-3 ${isSelected ? 'border-brand-gold bg-brand-gold/5 outline outline-2 outline-brand-gold/20' : 'border-neutral-200 bg-white hover:border-brand-gold/50'}`}>
                                                                    <div className="flex justify-between items-start w-full">
                                                                        <div className="flex-1 min-w-0 pr-4">
                                                                            <p className="font-bold text-sm text-neutral-800 truncate">{h.name}</p>
                                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                                <MapPin size={10} className="text-neutral-400" />
                                                                                <span className="text-[10px] text-neutral-500 font-medium">{h.closest_city}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right flex flex-col items-end">
                                                                            <span className="text-[9px] font-black text-brand-gold uppercase tracking-tighter">Starting From</span>
                                                                            <span className="text-sm font-black text-brand-charcoal">${minRate}</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {amenities.map(a => (
                                                                            <div key={a.key} className="flex items-center gap-1 px-2 py-0.5 bg-neutral-50 rounded-full border border-neutral-100">
                                                                                <span className="text-neutral-400">{a.icon}</span>
                                                                                <span className="text-[9px] font-bold text-neutral-500">{a.label}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    {isSelected && (
                                                                        <div className="flex items-center justify-center gap-1.5 py-1 bg-brand-gold/10 rounded-lg border border-brand-gold/20">
                                                                            <CheckCircle2 size={12} className="text-brand-gold" />
                                                                            <span className="text-[9px] font-black text-brand-gold uppercase">Currently Assigned</span>
                                                                        </div>
                                                                    )}
                                                                </button>

                                                                {isSelected && (
                                                                    <div className="space-y-4 px-1 pb-4 pt-2">
                                                                        {(() => {
                                                                            const roomTypes = ['Single', 'Double', 'Twin', 'Triple', 'Family'];
                                                                            const currentAcc = tripData.accommodations.find(a => a.nightIndex === activeBlock?.dayNumber) || {} as any;
                                                                            const selectedRooms = currentAcc.selectedRooms || [];

                                                                            return (
                                                                                <div className="space-y-4">
                                                                                    {roomTypes.map((rType) => {
                                                                                        const reqId = rType;
                                                                                        const stateKey = `${activeBlock?.id}-${reqId}`;
                                                                                        const assignedRoom = selectedRooms.find((sr: any) => sr.reqId === reqId);
                                                                                        const isReqMet = !!assignedRoom;
                                                                                        
                                                                                        const pendingState = pendingRoomState[stateKey] || {};
                                                                                        const currentMealPlan = assignedRoom?.mealPlan || pendingState.mealPlan || 'BB';
                                                                                        
                                                                                        // Calculate a default suggestion based on travelers if not currently assigned
                                                                                        let defaultCount = 0;
                                                                                        if (!isReqMet) {
                                                                                            const matchTravelers = (tripData.travelers || []).filter(t => t.roomPreference === rType);
                                                                                            if (matchTravelers.length > 0) {
                                                                                                const roomCount = matchTravelers.reduce((acc, t) => {
                                                                                                    const validLinks = (t.sharedWithIds || []).filter(id => matchTravelers.some(mt => mt.id === id));
                                                                                                    return acc + (1 / (1 + validLinks.length));
                                                                                                }, 0);
                                                                                                defaultCount = Math.ceil(roomCount);
                                                                                            }
                                                                                        }
                                                                                        const displayCount = assignedRoom?.quantity ?? pendingState.count ?? defaultCount ?? 0;

                                                                                        return (
                                                                                            <div key={reqId} className="border border-neutral-200 rounded-xl overflow-hidden shadow-sm bg-neutral-50/50">
                                                                                                <div className="bg-neutral-100/80 px-3 py-2 border-b border-neutral-200 flex justify-between items-center gap-4">
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <span className="text-[10px] font-bold text-neutral-600 uppercase whitespace-nowrap">{rType} Rooms</span>
                                                                                                        <input 
                                                                                                            type="number" 
                                                                                                            min="0" 
                                                                                                            value={displayCount}
                                                                                                            onChange={(e) => {
                                                                                                                const newQty = parseInt(e.target.value) || 0;
                                                                                                                if (assignedRoom) {
                                                                                                                    if (newQty === 0) {
                                                                                                                        // Remove room if qty goes to 0
                                                                                                                        const newSelected = selectedRooms.filter((sr: any) => sr.reqId !== reqId);
                                                                                                                        updateData({
                                                                                                                            accommodations: tripData.accommodations.map(a => a.nightIndex === activeBlock?.dayNumber ? { ...a, selectedRooms: newSelected } : a)
                                                                                                                        });
                                                                                                                    } else {
                                                                                                                        // Update quantity
                                                                                                                        const newSelected = selectedRooms.map((sr: any) => sr.reqId === reqId ? { ...sr, quantity: newQty } : sr);
                                                                                                                        updateData({
                                                                                                                            accommodations: tripData.accommodations.map(a => a.nightIndex === activeBlock?.dayNumber ? { ...a, selectedRooms: newSelected } : a)
                                                                                                                        });
                                                                                                                    }
                                                                                                                } else {
                                                                                                                    // Save pending quantity
                                                                                                                    setPendingRoomState(prev => ({ ...prev, [stateKey]: { ...prev[stateKey], count: newQty } }));
                                                                                                                }
                                                                                                            }}
                                                                                                            className="w-16 text-xs font-bold text-center py-1 px-2 border border-neutral-300 rounded focus:border-brand-gold outline-none"
                                                                                                        />
                                                                                                    </div>
                                                                                                    {isReqMet ? <span className="text-[9px] font-black text-brand-green px-1.5 py-0.5 bg-brand-green/10 rounded tracking-tight">ASSIGNED</span> : <span className="text-[9px] font-bold text-neutral-400 px-1.5 py-0.5 bg-neutral-100 rounded border border-neutral-200 tracking-tight">UNASSIGNED</span>}
                                                                                                </div>

                                                                                                {displayCount > 0 && (
                                                                                                <div className="p-2 space-y-2">
                                                                                                    {/* Assigned Room Meal Plan Toggle Header */}
                                                                                                    <div className="flex bg-neutral-200/50 p-1 rounded-xl gap-1 mb-2">
                                                                                                        {(['BB', 'HB', 'FB', 'AI'] as const).map(mp => (
                                                                                                            <button
                                                                                                                key={mp}
                                                                                                                onClick={(e) => {
                                                                                                                    e.preventDefault();
                                                                                                                    e.stopPropagation();
                                                                                                                    if (assignedRoom) {
                                                                                                                        const newSelected = selectedRooms.map((sr: any) => sr.reqId === reqId ? { ...sr, mealPlan: mp } : sr);
                                                                                                                        updateData({
                                                                                                                            accommodations: tripData.accommodations.map(a => a.nightIndex === activeBlock?.dayNumber ? { ...a, selectedRooms: newSelected } : a)
                                                                                                                        });
                                                                                                                    } else {
                                                                                                                        // Save pending meal plan
                                                                                                                        setPendingRoomState(prev => ({ ...prev, [stateKey]: { ...prev[stateKey], mealPlan: mp } }));
                                                                                                                    }
                                                                                                                }}
                                                                                                                className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${currentMealPlan === mp ? 'bg-white text-brand-green shadow-sm ring-1 ring-black/5' : 'text-neutral-500 hover:text-neutral-700'}`}
                                                                                                            >
                                                                                                                {mp}
                                                                                                            </button>
                                                                                                        ))}
                                                                                                    </div>

                                                                                                    <div className="grid grid-cols-1 gap-2">
                                                                                                        {h.hotel_rooms?.map((room: any) => {
                                                                                                            const isRoomSelectedHere = assignedRoom?.roomId === room.id;

                                                                                                            const calculateRoomPrice = (hotel: any, room: any, mealPlan: string, roomType: string) => {
                                                                                                                let baseRate = 0;
                                                                                                                let seasonLabel = "Standard";
                                                                                                                if (room.room_rates && room.room_rates.length > 0) {
                                                                                                                    const applicableRates = room.room_rates.filter((r: any) => {
                                                                                                                        if (!stayDate) return true;
                                                                                                                        if (r.start_date && r.end_date) {
                                                                                                                            return stayDate >= r.start_date && stayDate <= r.end_date;
                                                                                                                        }
                                                                                                                        return true;
                                                                                                                    });
                                                                                                                    
                                                                                                                    const rateObj = applicableRates[0] || room.room_rates[0];
                                                                                                                    
                                                                                                                    if (rateObj) {
                                                                                                                        let prefix = 'dbl';
                                                                                                                        if (roomType === 'Single') prefix = 'sgl';
                                                                                                                        else if (roomType === 'Double' || roomType === 'Twin') prefix = 'dbl';
                                                                                                                        else if (roomType === 'Triple') prefix = 'tpl';
                                                                                                                        else if (roomType === 'Family') prefix = 'qud';

                                                                                                                        const fieldName = `${prefix}_${mealPlan.toLowerCase()}_rate`;
                                                                                                                        
                                                                                                                        if (rateObj[fieldName] !== undefined && rateObj[fieldName] !== null && rateObj[fieldName] > 0) {
                                                                                                                            baseRate = rateObj[fieldName];
                                                                                                                        } else if (rateObj.meal_plan_type === mealPlan && rateObj.rate > 0) {
                                                                                                                            baseRate = rateObj.rate;
                                                                                                                        } else {
                                                                                                                            baseRate = rateObj.rate || 0;
                                                                                                                        }

                                                                                                                        if (rateObj.start_date && rateObj.end_date) {
                                                                                                                            seasonLabel = `Rate applied`;
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                                return { total: baseRate, seasonLabel };
                                                                                                            };

                                                                                                            const pricing = calculateRoomPrice(h, room, currentMealPlan, rType);

                                                                                                            return (
                                                                                                                <button
                                                                                                                    key={room.id}
                                                                                                                    onClick={(e) => {
                                                                                                                        e.preventDefault();
                                                                                                                        e.stopPropagation();
                                                                                                                        const newSelected = [...selectedRooms.filter((sr: any) => sr.reqId !== reqId)];
                                                                                                                        newSelected.push({
                                                                                                                            reqId: reqId,
                                                                                                                            roomId: room.id,
                                                                                                                            roomName: room.room_name,
                                                                                                                            roomStandard: room.room_standard,
                                                                                                                            quantity: displayCount,
                                                                                                                            pricePerNight: pricing.total,
                                                                                                                            mealPlan: currentMealPlan
                                                                                                                        });
                                                                                                                        // Overwrite legacy params dynamically for hybrid compatibility
                                                                                                                        updateData({
                                                                                                                            accommodations: tripData.accommodations.map(a => a.nightIndex === activeBlock?.dayNumber ? {
                                                                                                                                ...a,
                                                                                                                                selectedRooms: newSelected,
                                                                                                                                roomId: room.id,
                                                                                                                            } : a)
                                                                                                                        });
                                                                                                                    }}
                                                                                                                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all bg-white ${isRoomSelectedHere ? 'border-brand-green bg-brand-green/5 shadow-sm ring-1 ring-brand-green/20' : 'border-neutral-100 hover:border-neutral-200'}`}
                                                                                                                >
                                                                                                                    <div className="flex-1">
                                                                                                                        <div className="flex items-center gap-2">
                                                                                                                            <p className="text-xs font-bold text-neutral-800">{room.room_name}</p>
                                                                                                                            <span className="text-[9px] px-1.5 py-0.5 bg-neutral-100 text-neutral-500 rounded font-bold uppercase tracking-tighter">Max {room.max_guests} Pax</span>
                                                                                                                        </div>
                                                                                                                        <div className="flex flex-col mt-1 space-y-0.5">
                                                                                                                            <span className="text-[9px] text-neutral-400 font-medium uppercase tracking-tighter">{room.room_standard} • {pricing.seasonLabel}</span>
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                    <div className="text-right">
                                                                                                                        <p className="text-sm font-black text-brand-charcoal">${pricing.total?.toFixed(0)}</p>
                                                                                                                        <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-tighter">Per Night</p>
                                                                                                                    </div>
                                                                                                                </button>
                                                                                                            );
                                                                                                        })}
                                                                                                    </div>
                                                                                                </div>
                                                                                                )}
                                                                                            </div>
                                                                                        )
                                                                                    })}
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="p-6 sticky bottom-0 bg-white border-t">
                                                    <button onClick={() => { setActiveAssignment(null); setSearchTerm(""); }}
                                                        className="w-full py-3 bg-brand-green text-white font-bold rounded-xl shadow-lg hover:bg-brand-green/90 transition-all flex items-center justify-center gap-2">
                                                        <CheckCircle2 size={18} /> Finish Assignment
                                                    </button>
                                                </div>
                                            </>
                                        );
                                    })()}

                                    {activeAssignment.type === 'activity' && (() => {
                                        const currentBlock = tripData.itinerary.find(b => b.id === activeAssignment.blockId);
                                        const baseActivity = masterData.activities.find(a => a.id === currentBlock?.activityId) ||
                                            tripData.activities.find(a => a.activityId === currentBlock?.activityId)?.activityData;

                                        const specializedVendorsUnfiltered = masterData.vendors.filter(v =>
                                            v.vendor_activities?.some(va => va.activity_id === currentBlock?.activityId)
                                        );

                                        // Apply global search filter to specialized vendors
                                        const specializedVendors = specializedVendorsUnfiltered.filter(v =>
                                            (filteredMasterData as any[]).some(fv => fv.id === v.id)
                                        );

                                        // Compute remaining globally matching vendors (if user is specifically looking for an untracked vendor)
                                        const otherVendors = (filteredMasterData as any[]).filter(v =>
                                            !specializedVendorsUnfiltered.some(sv => sv.id === v.id)
                                        );

                                        return (
                                            <>
                                                {baseActivity && (
                                                    <div className="mx-4 mt-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                                                        <div className="flex items-start gap-3">
                                                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                                                <ActivityIcon size={20} className="text-orange-500" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <h5 className="text-sm font-bold text-neutral-800">{baseActivity.activity_name}</h5>
                                                                <p className="text-[10px] text-neutral-500 font-medium mt-0.5 flex items-center gap-1">
                                                                    <MapPin size={10} /> {baseActivity.location_name}, {baseActivity.district}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="p-3 bg-neutral-50 text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-y mt-4">
                                                    Specialist Vendors ({specializedVendors.length})
                                                </div>

                                                <div className="grid grid-cols-1 gap-3 p-4">
                                                    {specializedVendors.map(v => {
                                                        const isSelected = currentBlock?.vendorId === v.id;
                                                        const va = v.vendor_activities?.find(a => a.activity_id === currentBlock?.activityId);
                                                        return (
                                                            <button key={v.id} onClick={() => bindProvider(activeAssignment.blockId, 'vendorId', v.id)}
                                                                className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${isSelected ? 'border-brand-green bg-brand-green/5' : 'border-neutral-200 bg-white hover:border-brand-green/30'}`}>
                                                                <div className="flex-1">
                                                                    <p className="font-bold text-sm text-neutral-800">{v.name}</p>
                                                                    {va && <p className="text-xs font-black text-brand-green mt-1">LKR {va.vendor_price?.toLocaleString()}</p>}
                                                                </div>
                                                                <ChevronRight size={16} className={isSelected ? 'text-brand-green' : 'text-neutral-300'} />
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {otherVendors.length > 0 && (
                                                    <>
                                                        <div className="p-3 bg-neutral-50 text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-y mt-2 transition-opacity">
                                                            Other Matching Vendors ({otherVendors.length})
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-3 p-4">
                                                            {otherVendors.map(v => {
                                                                const isSelected = currentBlock?.vendorId === v.id;
                                                                return (
                                                                    <button key={'other-' + v.id} onClick={() => bindProvider(activeAssignment.blockId, 'vendorId', v.id)}
                                                                        className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between opacity-80 hover:opacity-100 ${isSelected ? 'border-brand-green bg-brand-green/5' : 'border-neutral-200 bg-white hover:border-brand-green/30'}`}>
                                                                        <div className="flex-1">
                                                                            <p className="font-bold text-sm text-neutral-800">{v.name}</p>
                                                                            <p className="text-xs font-black text-neutral-400 mt-1 flex items-center gap-1"><MapPin size={10} /> {v.address || 'Address Unknown'}</p>
                                                                        </div>
                                                                        <div className="text-[10px] uppercase font-bold text-neutral-400 px-2 py-1 bg-neutral-100 rounded-md">General Vendor</div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </>
                                                )}

                                                <div className="p-6 sticky bottom-0 bg-white border-t">
                                                    <button onClick={() => { setActiveAssignment(null); setSearchTerm(""); }}
                                                        className="w-full py-3 bg-brand-green text-white font-bold rounded-xl shadow-lg hover:bg-brand-green/90 transition-all flex items-center justify-center gap-2">
                                                        <CheckCircle2 size={18} /> Finish Assignment
                                                    </button>
                                                </div>
                                            </>
                                        );
                                    })()}

                                    {activeAssignment.type === 'travel' && (
                                        <>
                                            <div className="p-3 bg-neutral-50 text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-b">
                                                Transport Providers
                                            </div>
                                            <div className="grid grid-cols-1 gap-3 p-4">
                                                {((filteredMasterData as any).providers || []).map((tp: any) => {
                                                    const isSelected = tripData.itinerary.find(b => b.id === activeAssignment.blockId)?.transportId === tp.id;
                                                    return (
                                                        <div key={tp.id} className="space-y-2">
                                                            <button onClick={() => bindProvider(activeAssignment.blockId, 'transportId', tp.id)}
                                                                className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${isSelected ? 'border-blue-500 bg-blue-50/50' : 'border-neutral-200 bg-white hover:border-blue-300'}`}>
                                                                <div>
                                                                    <p className="font-bold text-sm text-neutral-800">{tp.name}</p>
                                                                    <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-tight">{tp.transport_vehicles?.length || 0} Assets Available</p>
                                                                </div>
                                                                {isSelected && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                                                            </button>

                                                            {isSelected && tp.transport_vehicles && tp.transport_vehicles.length > 0 && (
                                                                <div className="bg-neutral-50 rounded-2xl p-3 space-y-3 border border-neutral-100 mx-1 shadow-inner">
                                                                    <div className="grid grid-cols-1 gap-2">
                                                                        {tp.transport_vehicles.map((v: any) => {
                                                                            const block = tripData.itinerary.find(b => b.id === activeAssignment.blockId);
                                                                            const isVehicleSelected = block?.vehicleId === v.id;
                                                                            return (
                                                                                <button
                                                                                    key={v.id}
                                                                                    onClick={() => {
                                                                                        const updates: Partial<InternalItineraryBlock> = {
                                                                                            vehicleId: v.id,
                                                                                            transportId: tp.id,
                                                                                            transportRateType: 'day',
                                                                                            transportQuantity: 1
                                                                                        };
                                                                                        if (v.with_driver) {
                                                                                            updates.driverId = undefined;
                                                                                        }
                                                                                        updateBlock(activeAssignment.blockId, updates);
                                                                                    }}
                                                                                    className={`w-full p-3 rounded-xl border text-left transition-all flex flex-col gap-2 shadow-sm ${isVehicleSelected
                                                                                        ? 'bg-white border-brand-gold'
                                                                                        : 'bg-white/70 border-neutral-50 hover:border-brand-gold/30'
                                                                                        }`}
                                                                                >
                                                                                    <div className="flex justify-between items-start w-full">
                                                                                        <div className="flex-1">
                                                                                            <p className="text-xs font-bold text-neutral-800">{v.make_and_model || v.vehicle_type}</p>
                                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                                <span className="text-[9px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-500 font-bold uppercase tracking-wider">{v.vehicle_number}</span>
                                                                                                {v.with_driver && <span className="text-[9px] bg-green-100 px-1.5 py-0.5 rounded text-green-600 font-bold uppercase">Incl. Driver</span>}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="text-right shrink-0">
                                                                                            <p className="text-xs font-black text-brand-green">LKR {v.day_rate?.toLocaleString()}<span className="text-[10px] text-neutral-400 font-normal">/day</span></p>
                                                                                        </div>
                                                                                    </div>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="p-3 bg-neutral-50 text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-y mt-2">
                                                Chauffeur Database
                                            </div>
                                            <div className="grid grid-cols-1 gap-3 p-4">
                                                {((filteredMasterData as any).drivers || []).map((d: any) => {
                                                    const isSelected = tripData.itinerary.find(b => b.id === activeAssignment.blockId)?.driverId === d.id;
                                                    return (
                                                        <button key={d.id} onClick={() => updateBlock(activeAssignment.blockId, { driverId: d.id })}
                                                            className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${isSelected ? 'border-brand-gold bg-brand-gold/5' : 'border-neutral-200 bg-white hover:border-brand-gold/50'}`}>
                                                            <div>
                                                                <p className="font-bold text-sm text-neutral-800">{d.first_name} {d.last_name}</p>
                                                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight">Professional Driver</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs font-black text-brand-green">LKR {d.per_day_rate?.toLocaleString()}<span className="text-[10px] text-neutral-400 font-normal">/day</span></p>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <div className="p-6 sticky bottom-0 bg-white border-t">
                                                <button onClick={() => { setActiveAssignment(null); setSearchTerm(""); }}
                                                    className="w-full py-3 bg-brand-green text-white font-bold rounded-xl shadow-lg hover:bg-brand-green/90 transition-all flex items-center justify-center gap-2">
                                                    <CheckCircle2 size={18} /> Finish Assignment
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {activeAssignment.type === 'meal' && (
                                        <>
                                            <div className="grid grid-cols-1 gap-4 p-4">
                                                {(filteredMasterData as any[]).map(r => {
                                                    const currentBlock = tripData.itinerary.find(b => b.id === activeAssignment.blockId);
                                                    const isSelected = currentBlock?.restaurantId === r.id;
                                                    return (
                                                        <div key={r.id} className="space-y-3">
                                                            <button onClick={() => bindProvider(activeAssignment.blockId, 'restaurantId', r.id)}
                                                                className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${isSelected ? 'border-brand-green bg-brand-green/5' : 'border-neutral-200 bg-white hover:border-brand-green/30'}`}>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-bold text-sm text-neutral-800">{r.name}</p>
                                                                        {r.city && <span className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-500 rounded text-[9px] uppercase font-bold tracking-tight">{r.city}</span>}
                                                                    </div>
                                                                    <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight mt-1 flex flex-wrap gap-2 items-center">
                                                                        <span>{r.cuisine_type || 'General'} Cuisine</span>
                                                                        <span>•</span>
                                                                        <span>{r.is_buffet ? 'Buffet Available' : 'A La Carte Only'}</span>
                                                                        {r.total_capacity && (
                                                                            <>
                                                                                <span>•</span>
                                                                                <span>{r.total_capacity} Pax Capacity</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {isSelected && <div className="w-2 h-2 bg-brand-green rounded-full" />}
                                                            </button>
                                                            {isSelected && (
                                                                <div className="bg-neutral-50 rounded-2xl p-3 grid grid-cols-1 gap-3 border border-neutral-100 mx-1">
                                                                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-neutral-100">
                                                                        <span className="text-xs font-bold text-neutral-600 px-2">Pax Count</span>
                                                                        <input 
                                                                            type="number" 
                                                                            min="1"
                                                                            className="w-16 text-center text-sm font-bold bg-neutral-50 border border-neutral-200 rounded-md py-1 outline-none focus:border-brand-green"
                                                                            value={currentBlock?.restaurantQuantity || tripData.profile?.adults || 1}
                                                                            onChange={(e) => updateBlock(activeAssignment.blockId, { restaurantQuantity: parseInt(e.target.value) || 1 })}
                                                                        />
                                                                    </div>
                                                                    <div className="grid grid-cols-1 gap-2">
                                                                    {[
                                                                        { id: 'breakfast', label: 'Breakfast', active: r.has_breakfast, price: r.breakfast_rate_per_head },
                                                                        { id: 'lunch', label: 'Lunch', active: r.has_lunch, price: r.lunch_rate_per_head },
                                                                        { id: 'dinner', label: 'Dinner', active: r.has_dinner, price: r.dinner_rate_per_head }
                                                                    ].filter(m => m.active).map(meal => (
                                                                        <button key={meal.id} onClick={() => updateBlock(activeAssignment.blockId, { mealType: meal.label, agreedPrice: meal.price || 0 })}
                                                                            className={`p-3 rounded-lg flex items-center justify-between text-xs font-bold ${currentBlock?.mealType === meal.label ? 'bg-white border-brand-gold border shadow-sm' : 'bg-white/50 border-transparent hover:border-neutral-200 border'}`}>
                                                                            <span>{meal.label}</span>
                                                                            <span className="text-brand-green">LKR {(meal.price || 0).toLocaleString()}</span>
                                                                        </button>
                                                                    ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="p-6 sticky bottom-0 bg-white border-t">
                                                <button onClick={() => { setActiveAssignment(null); setSearchTerm(""); }}
                                                    className="w-full py-3 bg-brand-green text-white font-bold rounded-xl shadow-lg hover:bg-brand-green/90 transition-all flex items-center justify-center gap-2">
                                                    <CheckCircle2 size={18} /> Finish Assignment
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {activeAssignment.type === 'guide' && (
                                        <>
                                            <div className="grid grid-cols-1 gap-4 p-4">
                                                {(filteredMasterData as any[]).map(g => {
                                                    const isSelected = tripData.itinerary.find(b => b.id === activeAssignment.blockId)?.guideId === g.id;
                                                    return (
                                                        <button key={g.id} onClick={() => bindProvider(activeAssignment.blockId, 'guideId', g.id)}
                                                            className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-2 ${isSelected ? 'border-brand-gold bg-brand-gold/5' : 'border-neutral-200 bg-white hover:border-brand-gold/50'}`}>
                                                            <div className="flex justify-between items-start w-full">
                                                                <div>
                                                                    <p className="font-bold text-sm text-neutral-800">{g.first_name} {g.last_name}</p>
                                                                    <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{g.license_id ? `Lic: ${g.license_id}` : 'Professional Guide'}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-sm font-black text-brand-green">${g.per_day_rate || 0}<span className="text-[10px] text-neutral-400 font-normal">/day</span></p>
                                                                </div>
                                                            </div>
                                                            {g.languages && g.languages.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {g.languages.map((l: string) => (
                                                                        <span key={l} className="px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded text-[9px] font-bold uppercase tracking-tight">{l}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <div className="p-6 sticky bottom-0 bg-white border-t">
                                                <button onClick={() => { setActiveAssignment(null); setSearchTerm(""); }}
                                                    className="w-full py-3 bg-brand-green text-white font-bold rounded-xl shadow-lg hover:bg-brand-green/90 transition-all flex items-center justify-center gap-2">
                                                    <CheckCircle2 size={18} /> Finish Assignment
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {(() => {
                                        const noResults = activeAssignment.type === 'travel'
                                            ? ((filteredMasterData as any).providers?.length === 0 && (filteredMasterData as any).drivers?.length === 0)
                                            : (filteredMasterData as any[]).length === 0;

                                        if (noResults) {
                                            return (
                                                <div className="p-12 text-center text-neutral-400 italic text-sm">
                                                    No providers found matching &quot;{searchTerm}&quot;
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>

                                <div className="p-6 mt-auto">
                                    <button
                                        onClick={() => {
                                            const block = tripData.itinerary.find(b => b.id === activeAssignment.blockId);
                                            const fields: (keyof InternalItineraryBlock)[] = ['hotelId', 'vendorId', 'transportId', 'driverId', 'restaurantId', 'guideId', 'vehicleId'];
                                            const blockUpdates: Partial<InternalItineraryBlock> = {};
                                            fields.forEach(f => (blockUpdates as any)[f] = undefined);

                                            const updates: Partial<TripData> = {
                                                itinerary: tripData.itinerary.map(b => b.id === activeAssignment.blockId ? { ...b, ...blockUpdates } : b)
                                            };

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
                    </div>
                )
            }
            
            {/* Generate PDF Section */}
            <div className="mt-12 pt-8 border-t border-neutral-200 flex flex-col items-center justify-center">
                <button
                    onClick={() => {
                        const printContent = document.getElementById('print-container')?.innerHTML;
                        if (printContent) {
                            const iframe = document.createElement('iframe');
                            document.body.appendChild(iframe);
                            iframe.style.display = 'none';
                            const doc = iframe.contentWindow?.document;
                            if (doc) {
                                doc.open();
                                doc.write(`
                                    <html>
                                        <head>
                                            <title>Itinerary PDF</title>
                                            ${Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]')).map(n => n.outerHTML).join('\n')}
                                            <style>
                                                body { background: white !important; margin: 0; padding: 0; }
                                                @page { size: A4; margin: 0; }
                                                .pdf-container { padding: 0 !important; }
                                            </style>
                                        </head>
                                        <body>${printContent}</body>
                                    </html>
                                `);
                                doc.close();
                                iframe.contentWindow?.focus();
                                setTimeout(() => {
                                    iframe.contentWindow?.print();
                                    setTimeout(() => document.body.removeChild(iframe), 1000);
                                }, 500);
                            }
                        }
                    }}
                    className="flex items-center gap-3 px-8 py-4 bg-brand-green text-white font-bold rounded-2xl shadow-lg hover:bg-brand-green/90 transition-all active:scale-95"
                >
                    <Printer size={20} />
                    Download PDF
                </button>
                <p className="text-xs text-neutral-500 mt-3">Generates a branded PDF for the client</p>
            </div>

            {/* Hidden Print Container */}
            <div id="print-container" className="hidden">
                <ItineraryPdfTemplate tripData={tripData} masterData={masterData} />
            </div>

        </div>
    );
}
