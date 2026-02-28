"use client";

import { TripData, InternalItineraryBlock, AccommodationBooking, TransportBooking } from "../types";
import { ListTree, MapPin, CalendarDays, Navigation, Utensils, BedDouble, AlertCircle, GripVertical, Rocket, RefreshCcw, ArrowUp, ArrowDown, Activity as ActivityIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { generateRoutePlan, GeoLocation } from "@/lib/route-engine";
import { useState } from "react";
import { Activity } from "@/data/activities";
import { fetchHotelInventory } from "@/data/hotels";

export function ItineraryBuilder({ tripData, updateData }: { tripData: TripData, updateData: (d: Partial<TripData>) => void }) {

    const [isGenerating, setIsGenerating] = useState(false);
    const [optScore, setOptScore] = useState<number | null>(null);

    const runEngine = async () => {
        setIsGenerating(true);
        try {
            // Extract selected activities to feed to the engine
            const chosenActivities: Activity[] = tripData.activities.map(a => a.activityData);

            // Build the GeoLocations from the selected activities
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

            // Map the engine output to InternalItineraryBlock
            const generatedBlocks: InternalItineraryBlock[] = [];

            routeResult.plan.forEach(day => {
                day.events.forEach(event => {
                    const block: InternalItineraryBlock = {
                        id: crypto.randomUUID(),
                        dayNumber: day.day,
                        type: event.type,
                        name: event.name,
                        startTime: event.startTime,
                        endTime: event.endTime,
                        bufferMins: 15, // Default buffer inserted by logic rules
                        durationHours: event.duration,
                        confirmationStatus: event.type === 'activity' || event.type === 'sleep' ? 'Pending' : 'Confirmed',
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

            // Fetch actual inventory
            const inventory = await fetchHotelInventory();

            const hotels: AccommodationBooking[] = [];
            const transports: TransportBooking[] = [];

            for (let i = 1; i <= routeResult.totalDays; i++) {

                // Find matching hotel based on preferred standard
                let matchingHotels = inventory.filter(h => h.standard === tripData.profile.travelStyle);
                if (matchingHotels.length === 0) matchingHotels = inventory; // Falback

                // For variety, just rotate through available matches
                const selectedHotel = matchingHotels[(i - 1) % matchingHotels.length];

                hotels.push({
                    id: crypto.randomUUID(),
                    nightIndex: i,
                    hotelName: selectedHotel.name,
                    stayClass: selectedHotel.stayClass,
                    address: selectedHotel.locations.join(", "),
                    mapLink: '',
                    contactPerson: selectedHotel.contactPerson,
                    contactNumber: selectedHotel.contactNumber,
                    email: selectedHotel.email,
                    rateCardUrl: '',
                    roomType: 'Standard Room',
                    numberOfRooms: 1,
                    pricePerNight: selectedHotel.baseRatePerNightUsd,
                    mealPlan: 'BB',
                    status: 'Tentative',
                    confirmationReference: '',
                    paymentStatus: 'Pending',
                    cancellationDeadline: '',
                    beddingConfiguration: 'Double',
                    specialRequests: ''
                });

                transports.push({
                    id: crypto.randomUUID(),
                    mode: tripData.profile.travelStyle === 'Ultra Luxury VIP' ? 'Luxury Van' : 'SUV',
                    supplier: 'Default Auto-Supplier',
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

    const updateBlock = (id: string, field: keyof InternalItineraryBlock, value: any) => {
        updateData({ itinerary: tripData.itinerary.map(b => b.id === id ? { ...b, [field]: value } : b) });
    };

    const moveBlock = (dayStr: string, index: number, direction: 'up' | 'down') => {
        const dayBlocks = [...days[Number(dayStr)]];
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

        // Reconstruct itinerary
        const otherDaysBlocks = tripData.itinerary.filter(b => b.dayNumber !== Number(dayStr));
        const newItinerary = [...otherDaysBlocks, ...dayBlocks].sort((a, b) => a.dayNumber - b.dayNumber);
        updateData({ itinerary: newItinerary });
    };

    const moveBlockDay = (blockId: string, direction: 'prev' | 'next') => {
        const block = tripData.itinerary.find(b => b.id === blockId);
        if (!block) return;

        let targetDay = block.dayNumber + (direction === 'next' ? 1 : -1);
        if (targetDay < 1) return; // Prevent moving before Day 1

        updateData({ itinerary: tripData.itinerary.map(b => b.id === blockId ? { ...b, dayNumber: targetDay } : b) });
    };

    const iconType = (type: string) => {
        switch (type) {
            case 'activity': return <MapPin size={16} className="text-orange-500" />;
            case 'travel': return <Navigation size={16} className="text-blue-500" />;
            case 'meal': return <Utensils size={16} className="text-green-500" />;
            case 'sleep': return <BedDouble size={16} className="text-indigo-500" />;
            default: return <ListTree size={16} className="text-neutral-500" />;
        }
    };

    // Group blocks by day
    const days = tripData.itinerary.reduce((acc, block) => {
        if (!acc[block.dayNumber]) acc[block.dayNumber] = [];
        acc[block.dayNumber].push(block);
        return acc;
    }, {} as Record<number, InternalItineraryBlock[]>);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-serif text-brand-green flex items-center gap-2">
                        <CalendarDays size={20} className="text-brand-gold" /> Minute-Level Builder
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">Generate AI structure and override manual operational timings.</p>
                </div>

                <div className="flex items-center gap-4">
                    {optScore !== null && (
                        <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                            <ActivityIcon size={14} className="text-green-600" />
                            <span className="text-xs font-bold text-green-700">Day Efficiency Optimization: {optScore.toFixed(1)}%</span>
                        </div>
                    )}
                    <button
                        onClick={runEngine}
                        disabled={isGenerating || tripData.activities.length === 0}
                        className="flex items-center gap-2 bg-gradient-to-r from-brand-charcoal to-brand-green text-white px-5 py-2.5 rounded-xl hover:shadow-md transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? <RefreshCcw className="animate-spin" size={16} /> : <Rocket size={16} className="text-brand-gold" />}
                        {isGenerating ? 'Structuring DB...' : 'Auto-Generate Route'}
                    </button>
                </div>
            </div>

            {tripData.itinerary.length === 0 ? (
                <div className="text-center py-16 bg-neutral-50 rounded-3xl border border-dashed border-neutral-300">
                    <ListTree className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                    <p className="text-neutral-500 font-medium">No itinerary structure generated yet.</p>
                    <p className="text-sm text-neutral-400 mt-1">Add activities in Step 3, then run the AI Route Engine above.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(days).sort(([a], [b]) => Number(a) - Number(b)).map(([dayStr, blocks]) => (
                        <div key={dayStr} className="bg-white rounded-3xl border border-brand-gold/20 shadow-sm overflow-hidden">
                            <div className="bg-brand-gold/10 px-6 py-4 border-b border-brand-gold/20 flex justify-between items-center text-brand-charcoal">
                                <h4 className="font-bold uppercase tracking-widest font-serif">Day {dayStr} Overview</h4>
                                <span className="text-xs font-semibold bg-white px-3 py-1 rounded-full border border-brand-gold/30">
                                    {blocks.length} Blocks Managed
                                </span>
                            </div>

                            <div className="divide-y divide-neutral-100">
                                {blocks.map((block, idx) => (
                                    <div key={block.id} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-neutral-50 transition-colors group">

                                        <div className="md:col-span-3 flex items-center gap-2">
                                            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => moveBlockDay(block.id, 'prev')} disabled={block.dayNumber === 1} className="text-neutral-400 hover:text-brand-gold disabled:opacity-30"><ChevronLeft size={14} /></button>
                                                <button onClick={() => moveBlockDay(block.id, 'next')} className="text-neutral-400 hover:text-brand-gold disabled:opacity-30"><ChevronRight size={14} /></button>
                                            </div>
                                            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => moveBlock(dayStr, idx, 'up')} disabled={idx === 0} className="text-neutral-400 hover:text-brand-gold disabled:opacity-30"><ArrowUp size={14} /></button>
                                                <button onClick={() => moveBlock(dayStr, idx, 'down')} disabled={idx === blocks.length - 1} className="text-neutral-400 hover:text-brand-gold disabled:opacity-30"><ArrowDown size={14} /></button>
                                            </div>
                                            {iconType(block.type)}
                                            <div>
                                                <input value={block.startTime} onChange={e => updateBlock(block.id, 'startTime', e.target.value)} className="w-16 text-xs font-mono font-bold text-center border-b border-dashed border-neutral-300 bg-transparent focus:outline-none focus:border-brand-gold" />
                                                <span className="text-neutral-400 mx-1">-</span>
                                                <input value={block.endTime} onChange={e => updateBlock(block.id, 'endTime', e.target.value)} className="w-16 text-xs font-mono font-bold text-center border-b border-dashed border-neutral-300 bg-transparent focus:outline-none focus:border-brand-gold" />
                                            </div>
                                        </div>

                                        <div className="md:col-span-4">
                                            <input value={block.name} onChange={e => updateBlock(block.id, 'name', e.target.value)} className="w-full text-sm font-semibold text-neutral-800 bg-transparent py-1 border-b border-transparent focus:border-brand-gold focus:outline-none" />
                                            {block.locationName && (
                                                <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                                                    <MapPin size={10} /> {block.locationName}
                                                </p>
                                            )}
                                        </div>

                                        <div className="md:col-span-5 flex flex-col gap-2 opacity-80 group-hover:opacity-100 transition-opacity py-1">
                                            <input
                                                value={block.serviceProvider || ''}
                                                onChange={e => updateBlock(block.id, 'serviceProvider', e.target.value)}
                                                placeholder="Service Provider Database Link (Custom Entry)..."
                                                className="w-full text-[11px] px-2 py-1.5 bg-blue-50/50 border border-blue-100 rounded text-blue-800 placeholder-blue-300 focus:bg-white focus:border-blue-300 focus:outline-none"
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    value={block.clientVisibleNotes}
                                                    onChange={e => updateBlock(block.id, 'clientVisibleNotes', e.target.value)}
                                                    placeholder="Print Note (Client)..."
                                                    className="w-full text-[11px] px-2 py-1 bg-brand-green/5 border border-brand-green/10 rounded focus:bg-white focus:border-brand-green focus:outline-none"
                                                />
                                                <input
                                                    value={block.internalNotes}
                                                    onChange={e => updateBlock(block.id, 'internalNotes', e.target.value)}
                                                    placeholder="Ops Note (Internal)..."
                                                    className="w-full text-[11px] px-2 py-1 bg-red-50 border border-red-100 rounded focus:bg-white focus:border-red-300 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
