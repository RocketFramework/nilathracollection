"use client";

import { TripData, InternalItineraryBlock } from "../types";
import { Handshake, Building2, Utensils, Car, Compass, UserCheck, RefreshCw, AlertTriangle, Info } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
    getHotelsListAction,
    getVendorsAction,
    getTransportProvidersAction,
    getTourGuidesAction,
    getRestaurantsAction,
} from "@/actions/admin.actions";

export function PriceNegotiationStep({ tripData, updateData }: { tripData: TripData, updateData: (d: Partial<TripData>) => void }) {
    const [isLoading, setIsLoading] = useState(true);

    const [masterHotels, setMasterHotels] = useState<any[]>([]);
    const [masterVendors, setMasterVendors] = useState<any[]>([]);
    const [masterTransports, setMasterTransports] = useState<any[]>([]);
    const [masterGuides, setMasterGuides] = useState<any[]>([]);
    const [masterRestaurants, setMasterRestaurants] = useState<any[]>([]);

    useEffect(() => {
        const fetchMasterData = async () => {
            setIsLoading(true);
            try {
                const [hotelsRes, vendorsRes, transportsRes, guidesRes, restRes] = await Promise.all([
                    getHotelsListAction(),
                    getVendorsAction(),
                    getTransportProvidersAction(),
                    getTourGuidesAction(),
                    getRestaurantsAction()
                ]);

                if (hotelsRes.success) setMasterHotels(hotelsRes.hotels || []);
                if (vendorsRes.success) setMasterVendors(vendorsRes.vendors || []);
                if (transportsRes.success) setMasterTransports(transportsRes.providers || []);
                if (guidesRes.success) setMasterGuides(guidesRes.guides || []);
                if (restRes.success) setMasterRestaurants(restRes.restaurants || []);
            } catch (err) {
                console.error("Failed to fetch initial data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMasterData();
    }, []);

    const negotiableBlocks = useMemo(() => {
        return tripData.itinerary.filter(b => {
            if (b.type === 'sleep' && b.hotelId) return true;
            if (b.type === 'meal' && b.restaurantId) return true;
            if (b.type === 'activity' && (b.vendorId || b.vendorActivityId)) return true;
            if (b.type === 'travel' && (b.transportId || b.vehicleId || b.driverId || tripData.defaultTransportId || tripData.defaultVehicleId || tripData.defaultDriverId)) return true;
            if (b.type === 'guide' && (b.guideId || tripData.defaultGuideId)) return true;
            return false;
        });
    }, [tripData.itinerary, tripData.defaultDriverId, tripData.defaultGuideId, tripData.defaultTransportId, tripData.defaultVehicleId]);


    const handleBlockUpdate = (blockId: string, updates: Partial<InternalItineraryBlock>) => {
        const updatedItinerary = tripData.itinerary.map(b =>
            b.id === blockId ? { ...b, ...updates } : b
        );
        updateData({ itinerary: updatedItinerary });
    };

    const getVendorDetails = (b: InternalItineraryBlock) => {
        let referencePrice = 0;
        let vendorName = "Unknown Vendor";
        let icon = <Compass size={18} />;

        if (b.type === 'sleep') {
            const hId = b.hotelId;
            const hotel = masterHotels.find(h => h.id === hId);
            if (hotel) vendorName = hotel.name;
            const acc = tripData.accommodations?.find(a => a.nightIndex === b.dayNumber && (a.hotelId === hId || a.hotelName === hotel?.name));
            if (acc) {
                if (acc.selectedRooms && acc.selectedRooms.length > 0) {
                    referencePrice = acc.selectedRooms.reduce((sum, r) => sum + ((r.pricePerNight || 0) * (r.quantity || 1)), 0);
                } else {
                    referencePrice = (acc.pricePerNight || 0) * (acc.numberOfRooms || 1);
                }
            }
            icon = <Building2 size={18} className="text-blue-500" />;
        } else if (b.type === 'meal') {
            const rId = b.restaurantId;
            const rest = masterRestaurants.find(r => r.id === rId);
            if (rest) {
                vendorName = rest.name;
                referencePrice = rest.lunch_rate_per_head || 0; // standard roughly
            }
            icon = <Utensils size={18} className="text-orange-500" />;
        } else if (b.type === 'travel') {
            const tId = b.transportId || tripData.defaultTransportId;
            const trans = masterTransports.find(t => t.id === tId);
            if (trans) {
                vendorName = trans.name;
                const vId = b.vehicleId || tripData.defaultVehicleId;
                const veh = trans.transport_vehicles?.find((v: any) => v.id === vId);
                if (veh) referencePrice = veh.day_rate || 0;
            }
            icon = <Car size={18} className="text-indigo-500" />;
        } else if (b.type === 'guide') {
            const gId = b.guideId || tripData.defaultGuideId;
            const guide = masterGuides.find(g => g.id === gId);
            if (guide) {
                vendorName = `${guide.first_name} ${guide.last_name || ''}`.trim();
                referencePrice = guide.per_day_rate || 0;
            }
            icon = <UserCheck size={18} className="text-purple-500" />;
        } else if (b.type === 'activity') {
            const vId = b.vendorId;
            const vend = masterVendors.find(v => v.id === vId);
            if (vend) {
                vendorName = vend.name;
            }
            icon = <Compass size={18} className="text-green-500" />;
            // To get reference price for activities, it's typically in the booking or we use 0
            const actBooking = tripData.activities.find(a => a.activityId === b.activityId);
            if (actBooking && (actBooking.activityData as any).price) {
                referencePrice = (actBooking.activityData as any).price;
            }
        }

        return { vendorName, referencePrice, icon };
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-neutral-200">
                <RefreshCw className="animate-spin text-brand-gold w-8 h-8 mb-4" />
                <p className="text-neutral-500 text-sm">Loading Vendor Master Data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-2xl font-serif text-brand-green flex items-center gap-2">
                        <Handshake className="text-brand-gold" /> Price Negotiation
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">Review reference prices, lock in negotiated supplier rates, and request driver/guide benefits.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="bg-neutral-50 p-6 border-b border-neutral-200 flex justify-between items-center">
                    <h4 className="font-semibold text-neutral-800 text-sm uppercase tracking-wide">Assigned Services</h4>
                    <span className="text-xs font-bold bg-brand-gold/10 text-brand-gold px-3 py-1 rounded-full uppercase tracking-widest">{negotiableBlocks.length} Items</span>
                </div>

                <div className="divide-y divide-neutral-100">
                    {negotiableBlocks.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center opacity-70">
                            <AlertTriangle className="text-neutral-400 w-12 h-12 mb-4" />
                            <p className="text-neutral-500 font-medium">No assigned vendors found.</p>
                            <p className="text-sm text-neutral-400 mt-1">Assign vendors in the Itinerary Builder first.</p>
                        </div>
                    ) : (
                        negotiableBlocks.map(b => {
                            const { vendorName, referencePrice, icon } = getVendorDetails(b);

                            return (
                                <div key={b.id} className="p-6 hover:bg-neutral-50/50 transition-colors">
                                    <div className="flex flex-col lg:flex-row gap-6 justify-between">

                                        {/* Left: Info */}
                                        <div className="flex gap-4 flex-1">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center shrink-0">
                                                {icon}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded uppercase tracking-wider">Day {b.dayNumber}</span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded uppercase tracking-wider">{b.type}</span>
                                                </div>
                                                <h5 className="font-bold text-brand-charcoal text-base">{b.name}</h5>
                                                <p className="text-sm text-neutral-500 mt-0.5 flex items-center gap-1">
                                                    <Building2 size={12} className="inline opacity-50" /> {vendorName}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Center/Right: Pricing & Negotiation */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:w-2/3 shrink-0">

                                            {/* Reference Price */}
                                            <div className="bg-neutral-50 px-4 py-2.5 rounded-xl border border-neutral-200 min-w[120px]">
                                                <span className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1">Reference Rate</span>
                                                <span className="block font-mono font-bold text-neutral-600">
                                                    {referencePrice > 0 ? (b.type === 'meal' ? `${referencePrice}/pax` : referencePrice) : 'N/A'}
                                                </span>
                                            </div>

                                            {/* Negotiated Price Input */}
                                            <div className="flex-1 min-w[150px]">
                                                <label className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1">Negotiated Final Price</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-sm">LKR</span>
                                                    <input
                                                        type="number"
                                                        value={b.agreedPrice || ''}
                                                        onChange={(e) => handleBlockUpdate(b.id, { agreedPrice: e.target.value ? Number(e.target.value) : undefined })}
                                                        className="w-full pl-12 pr-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm font-bold text-brand-charcoal focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold outline-none transition-all shadow-sm"
                                                        placeholder="Enter agreed amount..."
                                                    />
                                                </div>
                                            </div>

                                            {/* Specialized Flags */}
                                            <div className="flex-1 flex flex-col gap-2 border-l border-neutral-200 pl-6">
                                                {/* Meal Flags */}
                                                {(b.type === 'meal' || b.type === 'sleep' || b.type === 'activity') && (
                                                    <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer hover:text-brand-green transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!b.driverMealIncluded}
                                                            onChange={(e) => handleBlockUpdate(b.id, { driverMealIncluded: e.target.checked })}
                                                            className="rounded border-neutral-300 text-brand-green focus:ring-brand-green w-4 h-4"
                                                        />
                                                        <span className="font-medium">Driver Meal Included</span>
                                                    </label>
                                                )}

                                                {/* Sleep/Hotel Flags */}
                                                {b.type === 'sleep' && (
                                                    <>
                                                        <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer hover:text-brand-green transition-colors">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!b.driverAccIncluded}
                                                                onChange={(e) => handleBlockUpdate(b.id, { driverAccIncluded: e.target.checked })}
                                                                className="rounded border-neutral-300 text-brand-green focus:ring-brand-green w-4 h-4"
                                                            />
                                                            <span className="font-medium">Driver Accom. (FOC)</span>
                                                        </label>

                                                        <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer hover:text-brand-green transition-colors">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!b.parkingIncluded}
                                                                onChange={(e) => handleBlockUpdate(b.id, { parkingIncluded: e.target.checked })}
                                                                className="rounded border-neutral-300 text-brand-green focus:ring-brand-green w-4 h-4"
                                                            />
                                                            <span className="font-medium">Parking Included</span>
                                                        </label>

                                                        <div className="mt-1 pt-2 border-t border-neutral-100">
                                                            <span className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1.5">Guide Room Option</span>
                                                            <div className="flex gap-2">
                                                                {['Free', 'Half Price', 'None'].map(opt => (
                                                                    <button
                                                                        key={opt}
                                                                        onClick={() => handleBlockUpdate(b.id, { guideRoomDiscount: opt as any })}
                                                                        className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${b.guideRoomDiscount === opt ? 'bg-brand-gold text-white border-brand-gold' : 'bg-white text-neutral-500 border-neutral-200 hover:border-brand-gold/50'}`}
                                                                    >
                                                                        {opt}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {b.type !== 'meal' && b.type !== 'sleep' && b.type !== 'activity' && (
                                                    <span className="text-xs text-neutral-400 italic flex items-center gap-1">
                                                        <Info size={12} /> No specialized flags for this category.
                                                    </span>
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
