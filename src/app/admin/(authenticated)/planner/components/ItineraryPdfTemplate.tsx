import React from 'react';
import { TripData } from "../types";
import { MapPin, Clock } from "lucide-react";

export const ItineraryPdfTemplate = React.forwardRef<HTMLDivElement, { tripData: TripData, masterData?: any }>(
    ({ tripData, masterData }, ref) => {
        const { profile, itinerary, accommodations, transports, financials } = tripData;
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
            <div ref={ref} className="bg-white mx-auto pdf-container font-sans antialiased selection:bg-[#D4AF37]/20" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                
                {/* 1. COVER PAGE - Extremely Luxe & Minimal */}
                <div className={`h-[1050px] print:h-[100vh] flex flex-col items-center justify-center relative break-after-page ${bgDark} p-12 box-border overflow-hidden`}>
                    
                    {/* Golden Border Frame */}
                    <div className="absolute inset-8 border-[0.5px] border-[#D4AF37]/30 z-0 pointer-events-none"></div>
                    <div className="absolute inset-[36px] border border-[#D4AF37]/10 z-0 pointer-events-none"></div>
                    
                    {/* Central Design Element */}
                    <div className="z-10 flex flex-col items-center text-center max-w-3xl relative h-full justify-between py-24">
                        
                        <div className="flex flex-col items-center">
                            <div className="mb-4">
                                <img src="/images/nilathra-logo.png" alt="Nilathra Collection" className="w-32 opacity-90 relative z-10 filter brightness-200" onError={(e) => {
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
                                <div className="px-24 pb-16 max-w-[900px] mx-auto break-before-page print:break-before-auto">
                                    <div className="mb-20 text-center">
                                        <h3 className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] mb-4">Chronology</h3>
                                        <h2 className="text-4xl font-serif text-[#111827] font-light italic">The Itinerary</h2>
                                    </div>

                                    <div className="relative">
                                        {/* Central Timeline Spine */}
                                        <div className="absolute left-[31px] top-6 bottom-0 w-[1px] bg-[#E5E7EB]"></div>

                                        <div className="space-y-20">
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
                                                            <div className="flex flex-col items-center bg-white z-10 w-[64px] py-2">
                                                                <span className="text-[9px] uppercase tracking-[0.2em] text-[#6B7280] mb-1">Day</span>
                                                                <span className="text-3xl font-serif text-[#D4AF37] leading-none">{String(dayNum).padStart(2, '0')}</span>
                                                            </div>

                                                            {/* Day Content */}
                                                            <div className="flex-1 pt-2">
                                                                <div className="space-y-12">
                                                                    {dayBlocks.map((block) => (
                                                                        <div key={block.id} className="relative">
                                                                            <div className="flex justify-between items-baseline mb-2">
                                                                                <h5 className="font-serif text-2xl text-[#111827] font-light">{block.name}</h5>
                                                                                {block.startTime && (
                                                                                    <div className="text-[10px] font-sans tracking-[0.2em] text-[#6B7280] uppercase ml-4 whitespace-nowrap">
                                                                                        {block.startTime} {block.endTime ? `— ${block.endTime}` : ''}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            
                                                                            {block.locationName && (
                                                                                <p className="text-[10px] font-sans text-[#D4AF37] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                                                    <span className="w-1 h-1 bg-[#D4AF37] rounded-full"></span>
                                                                                    {block.locationName}
                                                                                </p>
                                                                            )}
                                                                            
                                                                            {block.clientVisibleNotes && (
                                                                                <p className="text-base font-serif text-[#4B5563] leading-relaxed mb-6 font-light">
                                                                                    {block.clientVisibleNotes}
                                                                                </p>
                                                                            )}

                                                                            {/* Bound Logistics Data */}
                                                                            {masterData && (block.transportId || block.driverId || block.guideId || block.vendorId) && (
                                                                                <div className="bg-[#FAFAF9] px-6 py-4 border-l border-[#E5E7EB] flex flex-wrap gap-x-8 gap-y-3 mt-4">
                                                                                    {block.transportId && masterData.transportProviders && (
                                                                                        <div className="flex flex-col">
                                                                                            <span className="text-[8px] text-[#6B7280] uppercase tracking-[0.2em] mb-1">Transport</span>
                                                                                            <span className="text-xs font-serif text-[#111827]">{masterData.transportProviders.find((p:any) => p.id === block.transportId)?.name || 'Assigned'}</span>
                                                                                        </div>
                                                                                    )}
                                                                                    {block.driverId && masterData.drivers && (() => {
                                                                                        const d = masterData.drivers.find((x:any) => x.id === block.driverId);
                                                                                        return d && (
                                                                                            <div className="flex flex-col">
                                                                                                <span className="text-[8px] text-[#6B7280] uppercase tracking-[0.2em] mb-1">Chauffeur</span>
                                                                                                <span className="text-xs font-serif text-[#111827]">{`${d.first_name} ${d.last_name}`.trim()}</span>
                                                                                            </div>
                                                                                        );
                                                                                    })()}
                                                                                    {block.guideId && masterData.guides && (() => {
                                                                                        const g = masterData.guides.find((x:any) => x.id === block.guideId);
                                                                                        return g && (
                                                                                            <div className="flex flex-col">
                                                                                                <span className="text-[8px] text-[#6B7280] uppercase tracking-[0.2em] mb-1">Guide</span>
                                                                                                <span className="text-xs font-serif text-[#111827]">{`${g.first_name} ${g.last_name}`.trim()}</span>
                                                                                            </div>
                                                                                        );
                                                                                    })()}
                                                                                    {block.vendorId && masterData.vendors && (
                                                                                        <div className="flex flex-col">
                                                                                            <span className="text-[8px] text-[#6B7280] uppercase tracking-[0.2em] mb-1">Partner</span>
                                                                                            <span className="text-xs font-serif text-[#111827]">{masterData.vendors.find((v:any) => v.id === block.vendorId)?.name || 'Assigned'}</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* 5. Options & Commercials */}
                                {hasCommercials && (
                                    <div className="px-24 py-16 max-w-[900px] mx-auto break-before-page">
                                        
                                        <div className="mb-24">
                                            <div className="text-center mb-16">
                                                <h3 className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] mb-4">Curation</h3>
                                                <h2 className="text-4xl font-serif text-[#111827] font-light italic">Residences & Logistics</h2>
                                            </div>
                                            
                                            {hasValidHotels && (
                                                <div className="mb-20">
                                                    <h4 className="text-[11px] font-sans text-[#111827] uppercase tracking-[0.4em] border-b border-[#E5E7EB] pb-4 mb-8">The Sanctuaries</h4>
                                                    <div className="space-y-8">
                                                        {[...validAccommodations].sort((a, b) => a.nightIndex - b.nightIndex).map((acc, idx) => {
                                                            const roomSummaries = acc.selectedRooms && acc.selectedRooms.length > 0
                                                                ? acc.selectedRooms.map((sr: any) => `${sr.quantity}x ${sr.roomName || sr.roomStandard}`).join(', ')
                                                                : (acc.roomName || acc.roomStandard || 'Standard Room');
                                                                
                                                            const mealPlans = acc.selectedRooms && acc.selectedRooms.length > 0
                                                                ? Array.from(new Set(acc.selectedRooms.map((sr: any) => sr.mealPlan || 'BB'))).join(' / ')
                                                                : (acc.mealPlan || 'BB');

                                                            return (
                                                                <div key={idx} className="flex justify-between items-end pb-6 border-b border-[#F3F4F6]">
                                                                    <div>
                                                                        <span className="text-[9px] text-[#D4AF37] font-sans uppercase tracking-[0.2em] mb-1 block">Night {String(acc.nightIndex).padStart(2, '0')}</span>
                                                                        <strong className="block text-2xl font-serif text-[#111827] font-light mb-2">{acc.hotelName || 'Pending Assignment'}</strong>
                                                                        <span className="text-[11px] text-[#6B7280] font-sans tracking-[0.1em] block">
                                                                            {roomSummaries}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="text-[9px] font-sans text-[#111827] uppercase tracking-[0.2em] bg-[#FAFAF9] border border-[#E5E7EB] px-4 py-2">
                                                                            {mealPlans}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {hasValidTransports && (
                                                <div>
                                                    <h4 className="text-[11px] font-sans text-[#111827] uppercase tracking-[0.4em] border-b border-[#E5E7EB] pb-4 mb-8">The Fleet</h4>
                                                    <div className="space-y-8">
                                                        {transports.map((t, idx) => {
                                                            let displaySupplier = t.supplier;
                                                            let displayVehicle = t.vehicleNumber;
                                                            let displayDriver = t.driverName;
                                                            let displayDriverContact = t.driverContact;
                                                            let displayGuide = t.guideDetails;
                                                            let displayGuideAssigned = t.guideAssigned;

                                                            if (!displaySupplier || !displayDriver || !displayGuide) {
                                                                itinerary.forEach(block => {
                                                                    if (!displaySupplier && block.transportId && masterData?.transportProviders) {
                                                                        const p = masterData.transportProviders.find((x:any) => x.id === block.transportId);
                                                                        if (p) displaySupplier = p.name;
                                                                    }
                                                                    if (!displayVehicle && block.vehicleId && masterData?.transportProviders) {
                                                                        masterData.transportProviders.forEach((p:any) => {
                                                                            const v = p.transport_vehicles?.find((vx:any) => vx.id === block.vehicleId);
                                                                            if (v) displayVehicle = v.vehicle_number || v.make_and_model;
                                                                        });
                                                                    }
                                                                    if (!displayDriver && block.driverId && masterData?.drivers) {
                                                                        const d = masterData.drivers.find((x:any) => x.id === block.driverId);
                                                                        if (d) {
                                                                            displayDriver = `${d.first_name} ${d.last_name}`.trim();
                                                                            displayDriverContact = d.phone || d.contact || '';
                                                                        }
                                                                    }
                                                                    if (!displayGuide && block.guideId && masterData?.guides) {
                                                                        const g = masterData.guides.find((x:any) => x.id === block.guideId);
                                                                        if (g) {
                                                                            displayGuide = `${g.first_name} ${g.last_name}`.trim();
                                                                            displayGuideAssigned = true;
                                                                        }
                                                                    }
                                                                });
                                                            }

                                                            return (
                                                                <div key={idx} className="flex justify-between items-start pb-6 border-b border-[#F3F4F6]">
                                                                    <div>
                                                                        <strong className="block text-2xl font-serif text-[#111827] font-light mb-4 capitalize">{t.mode.replace(/_/g, ' ')}</strong>
                                                                        
                                                                        <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                                                                            {displaySupplier && (
                                                                                <div className="text-[11px] font-sans text-[#4B5563]">
                                                                                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#D4AF37] block mb-1">Provider</span>
                                                                                    {displaySupplier} {displayVehicle ? `(${displayVehicle})` : ''}
                                                                                </div>
                                                                            )}
                                                                            
                                                                            {displayDriver && (
                                                                                <div className="text-[11px] font-sans text-[#4B5563]">
                                                                                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#D4AF37] block mb-1">Chauffeur</span>
                                                                                    {displayDriver} {displayDriverContact ? `• ${displayDriverContact}` : ''}
                                                                                </div>
                                                                            )}
                                                                            
                                                                            {displayGuideAssigned && displayGuide && (
                                                                                <div className="text-[11px] font-sans text-[#4B5563] col-span-2 mt-2">
                                                                                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#D4AF37] block mb-1">Professional Guide</span>
                                                                                    {displayGuide}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right pt-2">
                                                                        <span className="text-[9px] font-sans text-[#6B7280] uppercase tracking-[0.2em]">
                                                                            {t.status}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* 6. Costs Table */}
                                        {financials && hasValidHotels && (
                                            <div className="mb-24 break-inside-avoid bg-[#FAFAF9] p-12 border border-[#E5E7EB]">
                                                <div className="text-center mb-10">
                                                    <h3 className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] mb-3">Commercials</h3>
                                                    <h2 className="text-3xl font-serif text-[#111827] font-light">Investment Summary</h2>
                                                </div>
                                                
                                                <div className="border-t border-b border-[#E5E7EB] py-6">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <span className="font-serif text-xl text-[#111827]">Total Package Investment</span>
                                                        <span className="font-serif text-3xl text-[#111827]">${financials.sellingPrice?.toLocaleString() || 0}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#6B7280]">Estimated Per Person</span>
                                                        <span className="font-sans text-sm tracking-widest text-[#D4AF37]">${pax > 0 ? (financials.sellingPrice / pax).toFixed(0).toLocaleString() : 0}</span>
                                                    </div>
                                                </div>
                                                <p className="text-[9px] text-center uppercase tracking-[0.2em] text-[#6B7280] mt-8">All prices are strictly confidential.</p>
                                            </div>
                                        )}

                                        {/* 7. Enhanced Policy Note */}
                                        <div className="mt-32 pt-16 border-t border-[#E5E7EB] text-center pb-16">
                                            <div className="mb-10">
                                                <img src="/images/nilathra-logo.png" alt="Nilathra" className="w-16 mx-auto opacity-20 filter grayscale" onError={(e) => e.currentTarget.style.display = 'none'} />
                                            </div>
                                            
                                            <h4 className="text-[#111827] font-serif text-xl mb-6">Terms & Conditions</h4>
                                            
                                            <p className="text-[11px] text-[#6B7280] font-sans leading-relaxed max-w-2xl mx-auto tracking-[0.05em] mb-8">
                                                This bespoke itinerary is prepared exclusively for you and remains valid for two weeks from issuance. Pricing and specific accommodations are subject to availability upon formal confirmation.
                                            </p>
                                            
                                            <div className="flex justify-center items-center gap-8 text-[9px] uppercase tracking-[0.2em]">
                                                <a href="http://nilathra.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] border-b border-[#D4AF37]/30 pb-1">Privacy Policy</a>
                                                <span className="text-[#E5E7EB]">|</span>
                                                <a href="http://nilathra.com/terms" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] border-b border-[#D4AF37]/30 pb-1">Terms of Service</a>
                                                <span className="text-[#E5E7EB]">|</span>
                                                <a href="http://nilathra.com/booking-conditions" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] border-b border-[#D4AF37]/30 pb-1">Booking Conditions</a>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
);

ItineraryPdfTemplate.displayName = 'ItineraryPdfTemplate';
