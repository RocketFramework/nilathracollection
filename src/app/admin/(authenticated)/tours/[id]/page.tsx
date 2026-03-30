"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Calendar, Users, MapPin, Navigation, DollarSign,
    Car, Contact, UserCog, Bus, Coffee, Utensils
} from "lucide-react";
import Link from "next/link";
import { getTourDataAction } from "@/actions/admin.actions";
import { TripData } from "@/app/admin/(authenticated)/planner/types";

export default function TourDetailViewPage() {
    const params = useParams();
    const router = useRouter();
    const tourId = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [tripData, setTripData] = useState<TripData | null>(null);
    const [tourMsg, setTourMsg] = useState<any>(null);
    const [activeDay, setActiveDay] = useState<number>(1);

    const loadData = async () => {
        setIsLoading(true);
        const res = await getTourDataAction(tourId);
        if (res.success && res.data) {
            setTripData(res.data.tripData as TripData);
            setTourMsg(res.data.tourMsg);
        } else {
            console.error(res.error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [tourId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-screen">
                <div className="flex flex-col items-center justify-center gap-4 text-brand-gold">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-gold"></div>
                    <p className="font-semibold text-brand-charcoal">Loading Tour Details...</p>
                </div>
            </div>
        );
    }

    if (!tripData) {
        return (
            <div className="p-20 text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Tour Not Found</h2>
                <Link href="/admin/tours" className="text-neutral-500 underline">Return to Tours</Link>
            </div>
        );
    }

    // Process Days Data
    const durationDays = tripData.profile?.durationDays || 1;
    const days = Array.from({ length: durationDays }, (_, i) => i + 1);

    // Group itinerary by day
    const itineraryByDay: Record<number, any[]> = {};
    if (tripData.itinerary) {
        tripData.itinerary.forEach((block) => {
            if (!itineraryByDay[block.dayNumber]) {
                itineraryByDay[block.dayNumber] = [];
            }
            itineraryByDay[block.dayNumber].push(block);
        });
    }

    // Default operations (take first transport booking if exists)
    const transport = tripData.transports?.[0] || null;

    return (
        <div className="max-w-7xl mx-auto p-10 animate-in fade-in duration-500 pb-32">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <Link href="/admin/tours" className="text-sm text-neutral-500 hover:text-brand-charcoal transition-colors">
                            &larr; Back to Tours
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold font-playfair text-[#2B2B2B] mt-2 flex items-center gap-3">
                        {tripData.clientName}
                        <span className={`text-xs px-3 py-1 rounded-full uppercase tracking-widest font-bold whitespace-nowrap
                            ${tripData.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                tripData.status === 'Archived' ? 'bg-neutral-200 text-neutral-600' :
                                    'bg-brand-gold/20 text-brand-gold'}`}>
                            {tripData.status}
                        </span>
                    </h1>
                    <p className="text-[#6B7280] mt-1">{tourMsg?.title || 'Custom Tour'}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.push(`/admin/planner?tourId=${tourId}`)}
                        className="bg-neutral-100 text-brand-charcoal text-sm font-bold border border-neutral-200 px-5 py-2.5 rounded-lg hover:bg-neutral-200 transition-colors"
                    >
                        Edit in Planner
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Metrics Summary Card */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6">
                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6">Tour Summary</h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5"><Calendar size={14} /> Dates</span>
                            <span className="font-bold text-brand-charcoal text-sm">
                                {tripData.profile?.arrivalDate ? new Date(tripData.profile.arrivalDate).toLocaleDateString() : 'TBD'} -
                                <br />{tripData.profile?.departureDate ? new Date(tripData.profile.departureDate).toLocaleDateString() : 'TBD'}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5"><Users size={14} /> Pax</span>
                            <span className="font-bold text-brand-charcoal">
                                {tripData.profile?.adults} Adults
                                {tripData.profile?.children ? `, ${tripData.profile.children} Ch` : ''}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5"><Navigation size={14} /> Overview</span>
                            <span className="font-bold text-brand-charcoal">
                                {tourMsg?.total_cities || 0} Cities<br />
                                {tourMsg?.total_activities || 0} Act
                            </span>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 text-brand-green"><DollarSign size={14} /> Total Price</span>
                            <span className="font-bold text-brand-green text-lg">
                                ${tripData.financials?.sellingPrice?.toLocaleString() || 0}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Operations Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-brand-gold/30 p-6 bg-brand-gold/5">
                    <h3 className="text-sm font-bold text-brand-gold uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Contact size={16} /> Operations Contact
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-brand-gold shrink-0 border border-brand-gold/20">
                                <Bus size={14} />
                            </div>
                            <div>
                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Transport Provider</p>
                                <p className="font-semibold text-brand-charcoal text-sm">{transport?.supplier || 'Not Assigned'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-brand-gold shrink-0 border border-brand-gold/20">
                                <Car size={14} />
                            </div>
                            <div>
                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Driver Contact</p>
                                <p className="font-semibold text-brand-charcoal text-sm">{transport?.driverName || 'Not Assigned'}</p>
                                {transport?.driverContact && <p className="text-xs text-neutral-600 font-mono mt-0.5">{transport.driverContact}</p>}
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-gold text-white flex items-center justify-center shrink-0 shadow-sm">
                                <UserCog size={14} />
                            </div>
                            <div>
                                <p className="text-[10px] text-brand-gold font-bold uppercase tracking-wider">Tour Guide</p>
                                {transport?.guideAssigned ? (
                                    <>
                                        <p className="font-semibold text-brand-charcoal text-sm">{transport.guideDetails || 'Assigned (No Details)'}</p>
                                    </>
                                ) : (
                                    <p className="font-semibold text-neutral-400 text-sm">No Dedicated Guide</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Day by Day Itinerary */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
                <div className="flex border-b border-[#E5E7EB] overflow-x-auto scrollbar-hide">
                    {days.map(day => (
                        <button
                            key={day}
                            onClick={() => setActiveDay(day)}
                            className={`px-6 py-4 font-bold text-sm whitespace-nowrap transition-colors border-b-2 
                                ${activeDay === day
                                    ? 'border-brand-gold text-brand-charcoal bg-brand-gold/5'
                                    : 'border-transparent text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'}`}
                        >
                            Day {day}
                        </button>
                    ))}
                </div>

                <div className="p-8">
                    {/* Hotel for the Day */}
                    <div className="mb-8">
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <MapPin size={14} /> Accommodation & Meals
                        </h4>

                        {tripData.accommodations?.find(h => h.nightIndex === activeDay) ? (
                            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h5 className="font-bold text-brand-charcoal text-lg">
                                        {tripData.accommodations.find(h => h.nightIndex === activeDay)?.hotelName}
                                    </h5>
                                    <p className="text-sm text-neutral-500 flex items-center gap-2 mt-1">
                                        <MapPin size={12} />
                                        {tripData.accommodations.find(h => h.nightIndex === activeDay)?.address || 'Address pending'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 bg-white px-4 py-2 border border-neutral-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Utensils size={16} className="text-neutral-400" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Meal Plan</span>
                                            <span className="font-bold text-brand-charcoal text-sm">
                                                {tripData.accommodations.find(h => h.nightIndex === activeDay)?.mealPlan || 'BB'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-neutral-200"></div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Room Type</span>
                                            <span className="font-bold text-brand-charcoal text-sm">
                                                {tripData.accommodations.find(h => h.nightIndex === activeDay)?.roomStandard || 'Standard'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-neutral-50 border border-neutral-100 border-dashed rounded-xl p-5 text-center text-neutral-500 text-sm">
                                No accommodation set for Day {activeDay}.
                            </div>
                        )}
                    </div>

                    {/* Itinerary Blocks */}
                    <div>
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Activities & Flow</h4>

                        <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
                            {(itineraryByDay[activeDay] || []).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')).map((block, idx) => (
                                <div key={idx} className="relative">
                                    {/* Timeline dot */}
                                    <div className={`absolute -left-[29px] top-1 w-3 h-3 rounded-full border-2 border-white 
                                        ${block.type === 'activity' ? 'bg-brand-gold' :
                                            block.type === 'travel' ? 'bg-blue-400' :
                                                block.type === 'meal' ? 'bg-orange-400' :
                                                    'bg-neutral-400'}`}
                                    />

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="sm:w-24 shrink-0 pt-0.5">
                                            <span className="font-bold text-brand-charcoal text-sm">{block.startTime || 'Time TBA'}</span>
                                            <p className="text-[10px] text-neutral-400 font-bold uppercase mt-0.5">{block.durationHours ? `${block.durationHours}h` : ''} {block.type}</p>
                                        </div>

                                        <div className="flex-1 bg-white border border-neutral-200 rounded-xl p-4 shadow-sm hover:border-brand-gold/50 transition-colors group">
                                            <div className="flex justify-between items-start">
                                                <h5 className="font-bold text-brand-charcoal">{block.name}</h5>
                                                {block.confirmationStatus === 'Confirmed' && (
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase">Confirmed</span>
                                                )}
                                            </div>

                                            {block.locationName && (
                                                <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5 font-medium">
                                                    <MapPin size={12} /> {block.locationName}
                                                </p>
                                            )}

                                            {(block.clientVisibleNotes || block.internalNotes) && (
                                                <div className="mt-3 text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                                                    {block.clientVisibleNotes || block.internalNotes}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {(!itineraryByDay[activeDay] || itineraryByDay[activeDay].length === 0) && (
                                <p className="text-sm text-neutral-400 italic">No activities planned for this day.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

