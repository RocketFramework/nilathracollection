import React, { useState, useEffect } from 'react';
import { TripData } from "../types";
import { MapPin, Clock, Bed, Compass, Utensils, Car, Info, Calendar } from "lucide-react";
import { getBookingTermsAction } from "@/actions/terms.actions";

export const ItineraryPdfTemplate = React.forwardRef<HTMLDivElement, { tripData: TripData, masterData?: any }>(
    ({ tripData, masterData }, ref) => {
        const { profile, itinerary, accommodations, transports, financials } = tripData;
        const [luxuryTerms, setLuxuryTerms] = useState<any>(null);

        useEffect(() => {
            getBookingTermsAction().then(res => {
                if (res.success && res.terms) {
                    const term = res.terms.find((t: any) => t.tier === 'luxury');
                    if (term) setLuxuryTerms(term);
                }
            });
        }, []);

        const getFormattedDate = (dayNum: number) => {
            if (!profile.arrivalDate) return '';
            try {
                const d = new Date(profile.arrivalDate);
                d.setDate(d.getDate() + (dayNum - 1));
                if (isNaN(d.getTime())) return '';
                return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            } catch (e) {
                return '';
            }
        };

        const getShortFormattedDate = (dayNum: number) => {
            if (!profile.arrivalDate) return '';
            try {
                const d = new Date(profile.arrivalDate);
                d.setDate(d.getDate() + (dayNum - 1));
                if (isNaN(d.getTime())) return '';
                return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
            } catch (e) {
                return '';
            }
        };

        const getBlockTypeConfig = (type: string) => {
            switch (type) {
                case 'sleep':
                    return {
                        bg: 'bg-[#FAF8F5]',
                        border: 'border-[#E8DFD1]',
                        accent: '#D4AF37',
                        badgeBg: 'bg-[#FAF8F5] text-[#8C6D3F] border-[#E8DFD1]',
                        label: 'Accommodation',
                        icon: <Bed className="w-3.5 h-3.5 text-[#8C6D3F]" />
                    };
                case 'activity':
                    return {
                        bg: 'bg-[#F4F8F6]',
                        border: 'border-[#E2ECE7]',
                        accent: '#2E5A44',
                        badgeBg: 'bg-[#F4F8F6] text-[#2E5A44] border-[#E2ECE7]',
                        label: 'Curated Experience',
                        icon: <Compass className="w-3.5 h-3.5 text-[#2E5A44]" />
                    };
                case 'meal':
                    return {
                        bg: 'bg-[#FDF8F6]',
                        border: 'border-[#F5E6E1]',
                        accent: '#A6654E',
                        badgeBg: 'bg-[#FDF8F6] text-[#A6654E] border-[#F5E6E1]',
                        label: 'Culinary Journey',
                        icon: <Utensils className="w-3.5 h-3.5 text-[#A6654E]" />
                    };
                case 'travel':
                    return {
                        bg: 'bg-[#F5F8FA]',
                        border: 'border-[#E5EDF2]',
                        accent: '#3B5973',
                        badgeBg: 'bg-[#F5F8FA] text-[#3B5973] border-[#E5EDF2]',
                        label: 'Private Transfer',
                        icon: <Car className="w-3.5 h-3.5 text-[#3B5973]" />
                    };
                default:
                    return {
                        bg: 'bg-[#F8F9FA]',
                        border: 'border-[#EAECEF]',
                        accent: '#707A8A',
                        badgeBg: 'bg-[#F8F9FA] text-[#5A6370] border-[#EAECEF]',
                        label: 'Journey Detail',
                        icon: <Info className="w-3.5 h-3.5 text-[#5A6370]" />
                    };
            }
        };

        const getImagesArray = (imagesField: any): string[] => {
            if (!imagesField) return [];
            if (Array.isArray(imagesField)) return imagesField;
            if (typeof imagesField === 'string') {
                try {
                    const parsed = JSON.parse(imagesField);
                    if (Array.isArray(parsed)) return parsed;
                } catch (e) {
                    if (imagesField.includes(',')) {
                        return imagesField.split(',').map((s: string) => s.trim()).filter(Boolean);
                    }
                    return [imagesField.trim()];
                }
            }
            return [];
        };

        const pax = (profile.adults || 0) + (profile.children || 0);

        const validAccommodations = accommodations.filter(acc => 
            (acc.hotelId && String(acc.hotelId).trim() !== '') || 
            (acc.hotelName && acc.hotelName.trim() !== 'Pending Assignment' && acc.hotelName.trim() !== 'Not Assigned' && acc.hotelName.trim() !== '')
        );
        const hasValidHotels = validAccommodations.length > 0;
        
        const hasValidTransports = transports.some(t => 
            (t.supplier && t.supplier.trim() !== '') || 
            (t.driverName && t.driverName.trim() !== '') || 
            (t.vehicleNumber && t.vehicleNumber.trim() !== '')
        ) || itinerary.some(b => 
            b.type === 'travel' && (b.transportId || b.driverId || b.vehicleId)
        );

        const hasCommercials = hasValidHotels || hasValidTransports;

        const calculateMetrics = () => {
            let cities = new Set<string>();
            let activitiesCount = 0;
            let distance = 0;

            itinerary.forEach(block => {
                if (block.locationName && block.locationName.trim() !== '') cities.add(block.locationName.trim());
                if (block.type === 'activity') activitiesCount++;
                if (block.distance) {
                    const distNum = parseInt(block.distance.replace(/\D/g, ''), 10);
                    if (!isNaN(distNum)) distance += distNum;
                }
            });

            return {
                cities: tripData.summary?.totalCities || cities.size,
                activities: tripData.summary?.totalActivities || activitiesCount,
                distance: tripData.summary?.totalDistanceKm || distance,
            };
        };
        const metrics = calculateMetrics();

        // High-end editorial CSS classes
        const primaryText = "text-[#111827]"; // almost black
        const secondaryText = "text-[#4B5563]"; // elegant gray
        const accentGold = "text-[#D4AF37]"; // rich gold
        const bgDark = "bg-[#0A0F1D]"; // deep navy black
        const fontSerif = "font-serif";
        const fontSans = "font-sans";

        return (
            <div ref={ref} className="bg-white mx-auto pdf-container font-sans antialiased selection:bg-[#D4AF37]/20" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact", width: "210mm", minHeight: "297mm" }}>
                
                {/* 1. COVER PAGE - Extremely Luxe & Minimal */}
                <div className={`h-[297mm] print:h-[297mm] flex flex-col items-center justify-center relative break-after-page ${bgDark} p-12 box-border overflow-hidden`}>
                    
                    {/* Golden Border Frame */}
                    <div className="absolute inset-8 border-[0.5px] border-[#D4AF37]/30 z-0 pointer-events-none"></div>
                    <div className="absolute inset-[36px] border border-[#D4AF37]/10 z-0 pointer-events-none"></div>
                    
                    {/* Central Design Element */}
                    <div className="z-10 flex flex-col items-center text-center max-w-3xl relative h-full justify-between py-24">
                        
                        <div className="flex flex-col items-center">
                            <div className="mb-4">
                                <img src="/images/nilathra_logo-02.png" alt="Nilathra Collection" className="w-48 opacity-90 relative z-10 filter brightness-200" onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement?.insertAdjacentHTML('afterbegin', '<h1 class="text-2xl font-serif text-white uppercase tracking-[0.4em] text-center">Nilathra</h1>');
                                }} />
                            </div>
                            <div className="w-[1px] h-16 bg-gradient-to-b from-[#D4AF37]/0 via-[#D4AF37]/50 to-[#D4AF37]/0 my-6"></div>
                            <span className="text-[#D4AF37] text-[10px] tracking-[0.4em] uppercase font-light">The Collection</span>
                        </div>

                        <div className="flex flex-col items-center justify-center space-y-12 my-auto">
                            <h1 className="text-[10px] font-sans text-white/50 uppercase tracking-[0.5em]">A Curated Itinerary</h1>
                            
                            <h2 className="text-6xl font-serif text-white leading-tight font-light italic text-center px-12">
                                {tripData.clientName}
                            </h2>
                            
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-[1px] bg-[#D4AF37]/40"></div>
                                <span className="text-[#D4AF37] text-[9px] tracking-[0.3em] uppercase">Private & Confidential</span>
                                <div className="w-12 h-[1px] bg-[#D4AF37]/40"></div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="text-white/40 text-[9px] uppercase tracking-[0.3em] mb-2">{metrics.cities} Destinations &bull; {profile.durationDays} Days</span>
                            <span className="text-white/20 text-[8px] uppercase tracking-[0.2em]">{profile.arrivalDate || 'Dates to be confirmed'}</span>
                        </div>

                    </div>
                </div>

                <table className="w-full">
                    <thead className="table-header-group">
                        <tr><td><div className="h-[20mm]"></div></td></tr>
                    </thead>
                    <tfoot className="table-footer-group">
                        <tr>
                            <td>
                                <div className="h-[25mm] flex items-end justify-between px-20 pb-10">
                                    <span className="text-[8px] font-sans uppercase tracking-[0.2em] text-[#111827]/30">
                                        Nilathra Collection
                                    </span>
                                    <span className="text-[8px] font-sans uppercase tracking-[0.2em] text-[#111827]/30">
                                        Private Itinerary
                                    </span>
                                </div>
                            </td>
                        </tr>
                    </tfoot>
                    <tbody className="table-row-group">
                        <tr>
                            <td>
                                {/* 2. THE WELCOME LETTER */}
                                <div className="px-24 pb-24 max-w-[900px] mx-auto break-after-page print:break-after-page">
                                    
                                    <div className="mb-20 text-center">
                                        <div className="inline-block border-b border-[#D4AF37] pb-3 mb-10">
                                            <h3 className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em]">Prologue</h3>
                                        </div>
                                    </div>
                                    
                                    <div className="prose prose-neutral max-w-none text-[#4B5563] leading-[2.4] font-serif text-justify text-lg pl-10 relative">
                                        {/* Golden decorative line */}
                                        <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-gradient-to-b from-[#D4AF37]/10 via-[#D4AF37] to-[#D4AF37]/10"></div>
                                        
                                        <p className="mb-8 font-light text-2xl text-[#111827]">
                                            Dear {tripData.clientName},
                                        </p>
                                        <p className="mb-8 font-light">
                                            It is an absolute honor to welcome you to the Nilathra Collection. We have carefully studied your preferences to craft a journey that transcends ordinary travel. Sri Lanka is a canvas of incredible diversity, and we have curated a sequence of experiences that capture its purest luxury, untold heritage, and breathtaking nature.
                                        </p>
                                        <p className="mb-12 font-light">
                                            Every detail within these pages—from the exclusive sanctuaries you will reside in, to the seamless logistics orchestrating your movement—has been hand-selected. We invite you to immerse yourself in this proposal. Our concierges await your thoughts to perfect it further.
                                        </p>
                                        
                                        <div className="mt-16 pt-8">
                                            <p className="text-[#111827] font-serif italic text-xl mb-1">Warmest Regards,</p>
                                            <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-sans">The Nilathra Concierge Team</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. TRIP SUMMARY - The Blueprint */}
                                <div className="px-24 pb-24 max-w-[900px] mx-auto break-after-page print:break-after-page">
                                    <div className="mb-16 text-center">
                                        <h3 className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] mb-4">The Blueprint</h3>
                                        <h2 className="text-4xl font-serif text-[#111827] font-light italic">Journey Overview</h2>
                                    </div>

                                    <div className="bg-[#FAFAF9] border border-[#E5E7EB] p-12">
                                        <div className="grid grid-cols-2 gap-y-16 gap-x-12">
                                            
                                            <div className="border-l-2 border-[#D4AF37] pl-6">
                                                <span className="text-[9px] font-sans uppercase tracking-[0.3em] text-[#6B7280] block mb-2">Guests</span>
                                                <span className="font-serif text-2xl text-[#111827]">{profile.adults} Adults {profile.children > 0 ? `• ${profile.children} Children` : ''}</span>
                                            </div>

                                            <div className="border-l-2 border-[#D4AF37] pl-6">
                                                <span className="text-[9px] font-sans uppercase tracking-[0.3em] text-[#6B7280] block mb-2">Duration</span>
                                                <span className="font-serif text-2xl text-[#111827]">{profile.durationDays} Days of Discovery</span>
                                            </div>

                                            <div className="border-l-2 border-[#D4AF37] pl-6">
                                                <span className="text-[9px] font-sans uppercase tracking-[0.3em] text-[#6B7280] block mb-2">Pace & Style</span>
                                                <span className="font-serif text-2xl text-[#111827]">{profile.travelStyle}</span>
                                            </div>

                                            <div className="border-l-2 border-[#D4AF37] pl-6">
                                                <span className="text-[9px] font-sans uppercase tracking-[0.3em] text-[#6B7280] block mb-2">Estimated Arrival</span>
                                                <span className="font-serif text-2xl text-[#111827]">{profile.arrivalDate || 'To Be Determined'}</span>
                                            </div>

                                        </div>

                                        <div className="h-[1px] w-full bg-[#E5E7EB] my-12"></div>

                                        <div className="grid grid-cols-3 gap-8 text-center">
                                            <div>
                                                <span className="font-serif text-4xl text-[#111827] block mb-2">{metrics.cities}</span>
                                                <span className="text-[9px] font-sans uppercase tracking-[0.3em] text-[#6B7280]">Destinations</span>
                                            </div>
                                            <div>
                                                <span className="font-serif text-4xl text-[#111827] block mb-2">{metrics.activities}</span>
                                                <span className="text-[9px] font-sans uppercase tracking-[0.3em] text-[#6B7280]">Curated Experiences</span>
                                            </div>
                                            <div>
                                                <span className="font-serif text-4xl text-[#111827] block mb-2">{metrics.distance > 0 ? `${metrics.distance}` : '--'}</span>
                                                <span className="text-[9px] font-sans uppercase tracking-[0.3em] text-[#6B7280]">Est. Kilometers</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. THE ITINERARY */}
                                <div className="pr-24 pl-12 pb-16 max-w-[900px] mx-auto break-before-page print:break-before-auto">
                                    <div className="mb-20 text-center">
                                        <h3 className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] mb-4">Chronology</h3>
                                        <h2 className="text-4xl font-serif text-[#111827] font-light italic">The Itinerary</h2>
                                    </div>

                                    <div className="relative">
                                        {/* Central Timeline Spine */}
                                        <div className="absolute left-[31px] top-6 bottom-0 w-[1px] bg-gradient-to-b from-[#D4AF37]/30 via-[#D4AF37]/15 to-[#D4AF37]/30"></div>

                                        <div className="space-y-12">
                                            {Array.from(new Set(itinerary.map(b => b.dayNumber))).sort((a, b) => a - b).map(dayNum => {
                                                const timeToMins = (timeStr?: string, blockType?: string) => {
                                                    if (!timeStr || !timeStr.includes(':')) return blockType === 'sleep' ? 1440 : -1;
                                                    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
                                                    if (!match) return blockType === 'sleep' ? 1440 : -1;
                                                    let h = parseInt(match[1], 10);
                                                    const m = parseInt(match[2], 10);
                                                    if (isNaN(h) || isNaN(m)) return blockType === 'sleep' ? 1440 : -1;
                                                    const period = match[3]?.toUpperCase();
                                                    if (period === 'PM' && h < 12) h += 12;
                                                    if (period === 'AM' && h === 12) h = 0;
                                                    return h * 60 + m;
                                                };

                                                const dayBlocks = itinerary.filter(b => b.dayNumber === dayNum).sort((a, b) => {
                                                    return timeToMins(a.startTime, a.type) - timeToMins(b.startTime, b.type);
                                                });

                                                return (
                                                    <div key={dayNum} className="relative break-inside-avoid">
                                                        <div className="flex items-start gap-12">
                                                            
                                                            {/* Minimal Day Marker */}
                                                            <div className="flex flex-col items-center bg-white z-10 w-[64px] py-2 border border-[#D4AF37]/20 rounded-xl shadow-sm">
                                                                <span className="text-[8px] uppercase tracking-[0.2em] text-[#6B7280] mb-0.5">Day</span>
                                                                <span className="text-2xl font-serif text-[#D4AF37] leading-none font-bold">{String(dayNum).padStart(2, '0')}</span>
                                                                {profile.arrivalDate && (() => {
                                                                    const shortDate = getShortFormattedDate(dayNum);
                                                                    return shortDate ? (
                                                                        <span className="text-[8.5px] uppercase tracking-wider text-[#6B7280] font-sans font-semibold border-t border-[#D4AF37]/20 pt-1 w-full text-center mt-1.5 px-1">
                                                                            {shortDate}
                                                                        </span>
                                                                    ) : null;
                                                                })()}
                                                            </div>

                                                            {/* Day Content */}
                                                            <div className="flex-1 pt-2">
                                                                {/* Day Date Header */}
                                                                {profile.arrivalDate && (() => {
                                                                    const dateStr = getFormattedDate(dayNum);
                                                                    return dateStr ? (
                                                                        <div className="mb-4 pb-1.5 border-b border-[#D4AF37]/20 flex items-center justify-between">
                                                                            <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">
                                                                                {dateStr}
                                                                            </span>
                                                                        </div>
                                                                    ) : null;
                                                                })()}
                                                                <div className="space-y-4">
                                                                    {dayBlocks.map((block) => {
                                                                        const config = getBlockTypeConfig(block.type);
                                                                        return (
                                                                            <div key={block.id} className={`p-4 rounded-xl border ${config.border} ${config.bg} shadow-sm transition-all hover:shadow-md relative overflow-hidden break-inside-avoid`}>
                                                                                {/* Top bar with time, type badge, etc. */}
                                                                                <div className="flex flex-wrap justify-between items-center gap-2 mb-2.5">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className={`flex items-center justify-center p-1 rounded-lg bg-white border ${config.border} shadow-sm`}>
                                                                                            {config.icon}
                                                                                        </span>
                                                                                        <span className={`text-[8px] font-sans uppercase tracking-[0.15em] font-bold px-1.5 py-0.5 rounded border ${config.badgeBg}`}>
                                                                                            {config.label}
                                                                                        </span>
                                                                                    </div>
                                                                                    {block.startTime && (
                                                                                        <div className="flex items-center gap-1 text-[8.5px] font-sans tracking-wider text-[#6B7280] font-semibold bg-white px-1.5 py-0.5 rounded border border-neutral-200/60 shadow-sm">
                                                                                            <Clock size={9} className="text-[#9CA3AF]" />
                                                                                            <span>{block.startTime} {block.endTime ? `— ${block.endTime}` : ''}</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                {/* Title */}
                                                                                <h5 className="font-serif text-[14px] text-[#111827] font-semibold mb-1 tracking-tight leading-snug">
                                                                                    {block.name}
                                                                                </h5>

                                                                                {/* Location */}
                                                                                {block.locationName && (
                                                                                    <p className="text-[8.5px] font-sans text-[#D4AF37] uppercase tracking-[0.15em] mb-2.5 flex items-center gap-1">
                                                                                        <MapPin size={9} className="text-[#D4AF37]" />
                                                                                        <span className="font-semibold">{block.locationName}</span>
                                                                                    </p>
                                                                                )}

                                                                                {/* Agent Comments */}
                                                                                {block.comments && block.comments.filter(c => c.role === 'agent').length > 0 && (
                                                                                    <div className="text-[10px] font-sans text-[#4B5563] leading-relaxed mb-2.5 font-light space-y-1 bg-white/70 p-2.5 rounded border border-neutral-100/60 italic">
                                                                                        {block.comments.filter(c => c.role === 'agent').map(c => (
                                                                                            <p key={c.id} className="relative pl-3">
                                                                                                <span className="absolute left-0 top-[-2px] text-[#D4AF37] font-serif font-black text-xs">“</span>
                                                                                                {c.text}
                                                                                            </p>
                                                                                        ))}
                                                                                    </div>
                                                                                )}

                                                                                {/* Block Details */}
                                                                                {block.type === 'sleep' && (() => {
                                                                                    const acc = accommodations.find(a => a.nightIndex === block.dayNumber);
                                                                                    if (!acc) return null;
                                                                                    const hasRooms = acc.selectedRooms && acc.selectedRooms.length > 0;
                                                                                    return (
                                                                                        <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-[9.5px] border-t border-[#E8DFD1] pt-2.5">
                                                                                            <div className="flex flex-col col-span-2 sm:col-span-1">
                                                                                                <span className="text-[8px] text-[#8C6D3F] uppercase tracking-[0.15em] font-bold mb-0.5">Hotel Sanctuary</span>
                                                                                                <span className="font-serif text-[#111827] font-semibold text-[10.5px]">{acc.hotelName} {acc.stayClass ? `(${acc.stayClass})` : ''}</span>
                                                                                            </div>
                                                                                            {hasRooms ? (
                                                                                                <div className="flex flex-col col-span-2 sm:col-span-1">
                                                                                                    <span className="text-[8px] text-[#8C6D3F] uppercase tracking-[0.15em] font-bold mb-0.5">Room & Dining</span>
                                                                                                    <div className="space-y-0.5">
                                                                                                        {acc.selectedRooms?.map((sr: any, idx: number) => (
                                                                                                            <div key={idx} className="font-sans text-[#4B5563] text-[9px] font-medium">
                                                                                                                {sr.quantity}x {sr.roomName || sr.roomStandard} ({sr.mealPlan || acc.mealPlan || 'BB'})
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <>
                                                                                                    {acc.roomName || acc.roomStandard ? (
                                                                                                        <div className="flex flex-col">
                                                                                                            <span className="text-[8px] text-[#8C6D3F] uppercase tracking-[0.15em] font-bold mb-0.5">Room Category</span>
                                                                                                            <span className="font-sans text-[#4B5563] font-medium">{acc.roomName || acc.roomStandard}</span>
                                                                                                        </div>
                                                                                                    ) : null}
                                                                                                    {acc.mealPlan ? (
                                                                                                        <div className="flex flex-col">
                                                                                                            <span className="text-[8px] text-[#8C6D3F] uppercase tracking-[0.15em] font-bold mb-0.5">Meal Arrangement</span>
                                                                                                            <span className="font-sans text-[#4B5563] font-medium">{acc.mealPlan}</span>
                                                                                                        </div>
                                                                                                    ) : null}
                                                                                                </>
                                                                                            )}
                                                                                            {acc.address && (
                                                                                                <div className="flex flex-col col-span-2">
                                                                                                    <span className="text-[8px] text-[#8C6D3F] uppercase tracking-[0.15em] font-bold mb-0.5">Location Address</span>
                                                                                                    <span className="font-sans text-[#6B7280]">{acc.address}</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })()}

                                                                                {block.type === 'meal' && (() => {
                                                                                    const rest = masterData?.restaurants?.find((r: any) => r.id === block.restaurantId);
                                                                                    return (
                                                                                        <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-[9.5px] border-t border-[#F5E6E1] pt-2.5">
                                                                                            <div className="flex flex-col col-span-2 sm:col-span-1">
                                                                                                <span className="text-[8px] text-[#A6654E] uppercase tracking-[0.15em] font-bold mb-0.5">Dining Venue</span>
                                                                                                <span className="font-serif text-[#111827] font-semibold text-[10.5px]">{rest?.name || 'Curated Restaurant'}</span>
                                                                                            </div>
                                                                                            {block.mealType && (
                                                                                                <div className="flex flex-col">
                                                                                                    <span className="text-[8px] text-[#A6654E] uppercase tracking-[0.15em] font-bold mb-0.5">Service Type</span>
                                                                                                    <span className="font-sans text-[#4B5563] font-medium">{block.mealType}</span>
                                                                                                </div>
                                                                                            )}
                                                                                            {rest?.cuisine_type && (
                                                                                                <div className="flex flex-col">
                                                                                                    <span className="text-[8px] text-[#A6654E] uppercase tracking-[0.15em] font-bold mb-0.5">Cuisine Type</span>
                                                                                                    <span className="font-sans text-[#4B5563] font-medium">{rest.cuisine_type}</span>
                                                                                                </div>
                                                                                            )}
                                                                                            {rest?.city && (
                                                                                                <div className="flex flex-col">
                                                                                                    <span className="text-[8px] text-[#A6654E] uppercase tracking-[0.15em] font-bold mb-0.5">Location City</span>
                                                                                                    <span className="font-sans text-[#4B5563] font-medium">{rest.city}</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })()}

                                                                                {block.type === 'activity' && (() => {
                                                                                    const relatedBooking = tripData.activities?.find((a: any) => 
                                                                                        (block.activityId && String(a.activityId) === String(block.activityId)) ||
                                                                                        (a.activityData?.activity_name && block.name && a.activityData.activity_name.trim().toLowerCase() === block.name.trim().toLowerCase())
                                                                                    );
                                                                                    
                                                                                    if (!relatedBooking) return null;
                                                                                    if (!block.activityId) return null;
                                                                                    if (String(block.activityId) !== String(relatedBooking.activityId)) return null;

                                                                                    const act = masterData?.activities?.find((a: any) => String(a.id) === String(block.activityId)) || 
                                                                                                relatedBooking.activityData;
                                                                                    if (!act) return null;
                                                                                    return (
                                                                                        <>
                                                                                            <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-[9.5px] border-t border-[#E2ECE7] pt-2.5">
                                                                                                {act.category && (
                                                                                                    <div className="flex flex-col">
                                                                                                        <span className="text-[8px] text-[#2E5A44] uppercase tracking-[0.15em] font-bold mb-0.5">Experience Category</span>
                                                                                                        <span className="font-sans text-[#4B5563] font-medium">{act.category}</span>
                                                                                                    </div>
                                                                                                )}
                                                                                                {block.durationHours && (
                                                                                                    <div className="flex flex-col">
                                                                                                        <span className="text-[8px] text-[#2E5A44] uppercase tracking-[0.15em] font-bold mb-0.5">Experience Duration</span>
                                                                                                        <span className="font-sans text-[#4B5563] font-medium">{block.durationHours} Hours</span>
                                                                                                    </div>
                                                                                                )}
                                                                                                {act.location_name && (
                                                                                                    <div className="flex flex-col col-span-2">
                                                                                                        <span className="text-[8px] text-[#2E5A44] uppercase tracking-[0.15em] font-bold mb-0.5">Venue Location</span>
                                                                                                        <span className="font-sans text-[#4B5563] font-medium">{act.location_name} {act.district ? `(${act.district})` : ''}</span>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                            {act.images && (() => {
                                                                                                const imgs = getImagesArray(act.images);
                                                                                                if (imgs.length === 0) return null;
                                                                                                const displayImgs = imgs.slice(0, 3);
                                                                                                return (
                                                                                                    <div className="mt-3 grid grid-cols-3 gap-2">
                                                                                                        {displayImgs.map((imgUrl, idx) => (
                                                                                                            <div key={idx} className="relative h-20 rounded-lg overflow-hidden border border-[#E2ECE7] shadow-sm">
                                                                                                                <img 
                                                                                                                    src={imgUrl} 
                                                                                                                    alt={`${block.name} - ${idx + 1}`} 
                                                                                                                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                                                                                                    onError={(e) => {
                                                                                                                        e.currentTarget.parentElement!.style.display = 'none';
                                                                                                                    }}
                                                                                                                />
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                );
                                                                                            })()}
                                                                                        </>
                                                                                    );
                                                                                })()}

                                                                                {block.type === 'travel' && (
                                                                                    <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-[9.5px] border-t border-[#E5EDF2] pt-2.5">
                                                                                        {block.distance && (
                                                                                            <div className="flex flex-col">
                                                                                                <span className="text-[8px] text-[#3B5973] uppercase tracking-[0.15em] font-bold mb-0.5">Transfer Distance</span>
                                                                                                <span className="font-sans text-[#4B5563] font-medium">{block.distance}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {block.durationHours && (
                                                                                            <div className="flex flex-col">
                                                                                                <span className="text-[8px] text-[#3B5973] uppercase tracking-[0.15em] font-bold mb-0.5">Est. Travel Duration</span>
                                                                                                <span className="font-sans text-[#4B5563] font-medium">{block.durationHours} Hours</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}

                                                                                {/* Bound Logistics Data integrated inside card */}
                                                                                {masterData && (block.transportId || block.driverId || block.guideId || block.vendorId) && (
                                                                                    <div className={`mt-2.5 pt-2.5 border-t grid grid-cols-2 gap-x-4 gap-y-2 text-[9.5px] ${
                                                                                        block.type === 'sleep' ? 'border-[#E8DFD1]' :
                                                                                        block.type === 'activity' ? 'border-[#E2ECE7]' :
                                                                                        block.type === 'meal' ? 'border-[#F5E6E1]' :
                                                                                        block.type === 'travel' ? 'border-[#E5EDF2]' : 'border-[#EAECEF]'
                                                                                    }`}>
                                                                                        {block.transportId && masterData.transportProviders && (
                                                                                            <div className="flex flex-col">
                                                                                                <span className={`text-[8px] uppercase tracking-[0.15em] font-bold mb-0.5 ${
                                                                                                    block.type === 'sleep' ? 'text-[#8C6D3F]' :
                                                                                                    block.type === 'activity' ? 'text-[#2E5A44]' :
                                                                                                    block.type === 'meal' ? 'text-[#A6654E]' :
                                                                                                    block.type === 'travel' ? 'text-[#3B5973]' : 'text-[#5A6370]'
                                                                                                }`}>Transport Provider</span>
                                                                                                <span className="font-serif text-[#111827] font-semibold">{masterData.transportProviders.find((p:any) => p.id === block.transportId)?.name || 'Assigned'}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {block.driverId && masterData.drivers && (() => {
                                                                                            const d = masterData.drivers.find((x:any) => x.id === block.driverId);
                                                                                            return d && (
                                                                                                <div className="flex flex-col">
                                                                                                    <span className={`text-[8px] uppercase tracking-[0.15em] font-bold mb-0.5 ${
                                                                                                        block.type === 'sleep' ? 'text-[#8C6D3F]' :
                                                                                                        block.type === 'activity' ? 'text-[#2E5A44]' :
                                                                                                        block.type === 'meal' ? 'text-[#A6654E]' :
                                                                                                        block.type === 'travel' ? 'text-[#3B5973]' : 'text-[#5A6370]'
                                                                                                    }`}>Private Chauffeur</span>
                                                                                                    <span className="font-serif text-[#111827] font-semibold">{`${d.first_name} ${d.last_name}`.trim()}</span>
                                                                                                </div>
                                                                                            );
                                                                                        })()}
                                                                                        {block.guideId && masterData.guides && (() => {
                                                                                            const g = masterData.guides.find((x:any) => x.id === block.guideId);
                                                                                            return g && (
                                                                                                <div className="flex flex-col">
                                                                                                    <span className={`text-[8px] uppercase tracking-[0.15em] font-bold mb-0.5 ${
                                                                                                        block.type === 'sleep' ? 'text-[#8C6D3F]' :
                                                                                                        block.type === 'activity' ? 'text-[#2E5A44]' :
                                                                                                        block.type === 'meal' ? 'text-[#A6654E]' :
                                                                                                        block.type === 'travel' ? 'text-[#3B5973]' : 'text-[#5A6370]'
                                                                                                    }`}>Expert Guide</span>
                                                                                                    <span className="font-serif text-[#111827] font-semibold">{`${g.first_name} ${g.last_name}`.trim()}</span>
                                                                                                </div>
                                                                                            );
                                                                                        })()}
                                                                                        {block.vendorId && masterData.vendors && (
                                                                                            <div className="flex flex-col">
                                                                                                <span className={`text-[8px] uppercase tracking-[0.15em] font-bold mb-0.5 ${
                                                                                                    block.type === 'sleep' ? 'text-[#8C6D3F]' :
                                                                                                    block.type === 'activity' ? 'text-[#2E5A44]' :
                                                                                                    block.type === 'meal' ? 'text-[#A6654E]' :
                                                                                                    block.type === 'travel' ? 'text-[#3B5973]' : 'text-[#5A6370]'
                                                                                                }`}>Local Partner</span>
                                                                                                <span className="font-serif text-[#111827] font-semibold">{masterData.vendors.find((v:any) => v.id === block.vendorId)?.name || 'Assigned'}</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>



                                {/* 6. Draft Cost Structure & Investment Summary */}
                                <div className="px-24 pb-16 max-w-[900px] mx-auto break-before-page print:break-before-auto">
                                    {financials && financials.draftCosts && financials.draftCosts.length > 0 && (
                                            <div className="mb-24 break-inside-avoid bg-[#FAFAF9] p-12 border border-[#E5E7EB]">
                                                <div className="text-center mb-10">
                                                    <h3 className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] mb-3">Commercials</h3>
                                                    <h2 className="text-3xl font-serif text-[#111827] font-light">Draft Cost Structure</h2>
                                                </div>
                                                
                                                <div className="mb-10">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="border-b border-[#E5E7EB]">
                                                                <th className="py-3 text-[10px] font-sans uppercase tracking-[0.2em] text-[#6B7280]">Service</th>
                                                                <th className="py-3 text-[10px] font-sans uppercase tracking-[0.2em] text-[#6B7280] text-center">Qty</th>
                                                                <th className="py-3 text-[10px] font-sans uppercase tracking-[0.2em] text-[#6B7280] text-right">Unit Price</th>
                                                                <th className="py-3 text-[10px] font-sans uppercase tracking-[0.2em] text-[#6B7280] text-right">Total Price</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {financials.draftCosts.map((item: any) => (
                                                                <tr key={item.id} className="border-b border-[#F3F4F6]">
                                                                    <td className="py-4 pr-4">
                                                                        <div className="font-serif text-[#111827]">{item.vendorName}</div>
                                                                        <div className="text-[11px] font-sans text-[#6B7280]">{item.serviceName}</div>
                                                                    </td>
                                                                    <td className="py-4 text-center font-sans text-sm text-[#4B5563]">{item.quantity}</td>
                                                                    <td className="py-4 text-right font-sans text-sm text-[#4B5563]">${item.unitPrice?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                                                    <td className="py-4 text-right font-sans text-sm text-[#111827] font-bold">${item.totalPrice?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                <div className="border-t-2 border-[#D4AF37] pt-6">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <span className="font-serif text-xl text-[#111827]">Total Package Investment</span>
                                                        <span className="font-serif text-3xl text-[#111827]">${financials.draftCosts.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#6B7280]">Estimated Per Person</span>
                                                        <span className="font-sans text-sm tracking-widest text-[#D4AF37]">${pax > 0 ? (financials.draftCosts.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0) / pax).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* 7. Enhanced Policy Note & Booking Terms */}
                                        <div className="mt-16 bg-amber-50/50 border border-[#D4AF37]/30 p-8 rounded-lg mb-16 break-inside-avoid">
                                            <div className="flex gap-4 items-start">
                                                <span className="text-xl">⏰</span>
                                                <div>
                                                    <h4 className="text-[#D4AF37] font-serif text-lg mb-2">Special Offer</h4>
                                                    <p className="text-[12px] text-[#4B5563] font-sans leading-relaxed tracking-wide">
                                                        This quotation is valid until June 30, 2026. Prices are subject to availability and may change based on hotel rate fluctuations. We recommend confirming soon to secure these rates.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {luxuryTerms && (
                                            <div className="mt-16 pt-16 border-t border-[#E5E7EB] text-left pb-16 break-inside-avoid">
                                                <h4 className="text-[#111827] font-serif text-2xl mb-8 text-center text-[#D4AF37]">Luxury Tier Booking Terms</h4>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                                    <div>
                                                        <h5 className="font-sans uppercase tracking-widest text-[10px] text-[#6B7280] mb-4">Booking & Payment</h5>
                                                        <div className="prose prose-sm prose-neutral text-[11px] leading-relaxed text-[#4B5563]" dangerouslySetInnerHTML={{ __html: luxuryTerms.booking_payment }} />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-sans uppercase tracking-widest text-[10px] text-[#6B7280] mb-4">Cancellation Policy</h5>
                                                        <div className="prose prose-sm prose-neutral text-[11px] leading-relaxed text-[#4B5563]" dangerouslySetInnerHTML={{ __html: luxuryTerms.cancellation_policy }} />
                                                    </div>
                                                </div>

                                                <div className="mt-12">
                                                    <h5 className="font-sans uppercase tracking-widest text-[10px] text-[#6B7280] mb-4">Important Notes</h5>
                                                    <div className="prose prose-sm prose-neutral text-[11px] leading-relaxed text-[#4B5563]" dangerouslySetInnerHTML={{ __html: luxuryTerms.important_notes }} />
                                                </div>

                                                <div className="mt-12">
                                                    <h5 className="font-sans uppercase tracking-widest text-[10px] text-[#6B7280] mb-4">Health & Safety</h5>
                                                    <div className="prose prose-sm prose-neutral text-[11px] leading-relaxed text-[#4B5563]" dangerouslySetInnerHTML={{ __html: luxuryTerms.health_safety }} />
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-16 pt-8 border-t border-[#E5E7EB] text-center pb-8 break-inside-avoid">
                                            <div className="mb-6">
                                                <img src="/images/nilathra-logo.png" alt="Nilathra" className="w-12 mx-auto opacity-20 filter grayscale" onError={(e) => e.currentTarget.style.display = 'none'} />
                                            </div>
                                            <div className="flex justify-center items-center gap-8 text-[8px] uppercase tracking-[0.2em]">
                                                <a href="https://www.nilathra.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] border-b border-[#D4AF37]/30 pb-1">Privacy Policy</a>
                                                <span className="text-[#E5E7EB]">|</span>
                                                <a href="https://www.nilathra.com/terms" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] border-b border-[#D4AF37]/30 pb-1">Terms of Service</a>
                                                <span className="text-[#E5E7EB]">|</span>
                                                <a href="https://www.nilathra.com/booking-conditions" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] border-b border-[#D4AF37]/30 pb-1">Booking Conditions</a>
                                            </div>
                                        </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
);

ItineraryPdfTemplate.displayName = 'ItineraryPdfTemplate';
