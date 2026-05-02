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

        // Calculate dynamic metrics
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

        return (
            <div ref={ref} className="bg-white text-[#1D265A] mx-auto pdf-container font-sans" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                
                {/* 1. Cover Page - Rich Opulent Editorial */}
                <div className="h-[1050px] print:h-[100vh] flex flex-col items-center justify-center relative break-after-page bg-gradient-to-br from-[#12183A] via-[#1D265A] to-[#12183A] p-16 box-border overflow-hidden">
                    {/* Background Texture / Abstract Circles */}
                    <div className="absolute top-[-15%] right-[-15%] w-[600px] h-[600px] rounded-full border-[1px] border-[#C5A572] opacity-10"></div>
                    <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] rounded-full border-[1px] border-[#C5A572] opacity-[0.05]"></div>
                    <div className="absolute bottom-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full border-[1px] border-[#C5A572] opacity-10"></div>
                    <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] rounded-full border-[1px] border-[#C5A572] opacity-[0.05]"></div>
                    
                    {/* Ornate Frame */}
                    <div className="absolute inset-8 border border-[#C5A572]/30 z-0"></div>
                    <div className="absolute inset-[36px] border border-[#C5A572]/10 z-0"></div>
                    
                    {/* Golden Corner Accents */}
                    <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-[#C5A572]/80 z-0"></div>
                    <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-[#C5A572]/80 z-0"></div>
                    <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-[#C5A572]/80 z-0"></div>
                    <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-[#C5A572]/80 z-0"></div>
                    
                    <div className="z-10 flex flex-col items-center text-center max-w-2xl relative">
                        {/* Elegant White Plaque for Logo (ensures perfect print rendering) */}
                        <div className="bg-white px-12 py-10 mb-20 flex flex-col items-center justify-center border-2 border-[#C5A572]/40 shadow-2xl relative">
                            {/* Inner delicate line on the plaque */}
                            <div className="absolute inset-2 border border-[#1D265A]/10"></div>
                            
                            <img src="/images/nilathra-logo.png" alt="Nilathra Collection" className="w-48 relative z-10" onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.insertAdjacentHTML('afterbegin', '<h1 class="text-3xl font-serif text-[#1D265A] uppercase tracking-[0.3em] text-center relative z-10">Nilathra<br/><span class="text-sm text-[#C5A572] mt-3 block tracking-[0.4em]">Collection</span></h1>');
                            }} />
                        </div>
                        
                        <div className="h-20 w-px bg-gradient-to-b from-[#C5A572]/0 via-[#C5A572]/80 to-[#C5A572]/0 mb-10"></div>

                        <p className="text-[#C5A572] text-[10px] tracking-[0.5em] uppercase mb-6 font-medium">Exclusively Curated For</p>
                        <h2 className="text-5xl font-serif text-white mb-10 leading-tight font-light italic">{tripData.clientName}</h2>
                        
                        <div className="h-20 w-px bg-gradient-to-b from-[#C5A572]/0 via-[#C5A572]/80 to-[#C5A572]/0 mt-4 mb-14"></div>
                        
                        <h1 className="text-[11px] font-sans text-white/70 uppercase tracking-[0.4em]">A Bespoke Journey</h1>
                    </div>
                </div>

                <table className="w-full">
                    <thead className="table-header-group">
                        <tr><td><div className="h-[25mm]"></div></td></tr>
                    </thead>
                    <tfoot className="table-footer-group">
                        <tr>
                            <td>
                                <div className="h-[20mm] flex items-end justify-center pb-8">
                                    <span className="text-[8px] font-sans uppercase tracking-[0.4em] text-[#1D265A]/40">
                                        Strictly Confidential &bull; Nilathra Collection
                                    </span>
                                </div>
                            </td>
                        </tr>
                    </tfoot>
                    <tbody className="table-row-group">
                        <tr>
                            <td>
                                {/* 2. Welcome & Overview */}
                                <div className="px-24 pb-20 max-w-[900px] mx-auto break-after-page print:break-after-auto">
                    
                    <div className="text-center mb-20">
                        <h3 className="text-sm text-[#C5A572] uppercase tracking-[0.4em] font-semibold mb-6">Journey Overview</h3>
                        <p className="text-3xl font-serif text-[#1D265A] font-light leading-relaxed max-w-2xl mx-auto italic">
                            "A curated exploration designed to capture the essence of luxury, wilderness, and serenity."
                        </p>
                    </div>
                    
                    {/* Minimalist Data Grid */}
                    <div className="border-y border-[#1D265A]/10 py-8 mb-16 space-y-8">
                        {/* Row 1 */}
                        <div className="grid grid-cols-4 gap-0">
                            <div className="text-center border-r border-[#1D265A]/10 px-2">
                                <strong className="text-[#C5A572] uppercase text-[9px] tracking-[0.3em] block mb-3">Guests</strong>
                                <span className="font-serif text-lg text-[#1D265A]">{profile.adults} Adults {profile.children > 0 ? `• ${profile.children} Ch` : ''}</span>
                            </div>
                            <div className="text-center border-r border-[#1D265A]/10 px-2">
                                <strong className="text-[#C5A572] uppercase text-[9px] tracking-[0.3em] block mb-3">Pace</strong>
                                <span className="font-serif text-lg text-[#1D265A]">{profile.travelStyle}</span>
                            </div>
                            <div className="text-center border-r border-[#1D265A]/10 px-2">
                                <strong className="text-[#C5A572] uppercase text-[9px] tracking-[0.3em] block mb-3">Duration</strong>
                                <span className="font-serif text-lg text-[#1D265A]">{profile.durationDays} Days</span>
                            </div>
                            <div className="text-center px-2">
                                <strong className="text-[#C5A572] uppercase text-[9px] tracking-[0.3em] block mb-3">Arrival</strong>
                                <span className="font-serif text-lg text-[#1D265A]">{profile.arrivalDate || 'TBD'}</span>
                            </div>
                        </div>
                        
                        {/* Row 2 */}
                        <div className="grid grid-cols-3 gap-0 border-t border-[#1D265A]/5 pt-8">
                            <div className="text-center border-r border-[#1D265A]/10 px-2">
                                <strong className="text-[#C5A572] uppercase text-[9px] tracking-[0.3em] block mb-3">Destinations</strong>
                                <span className="font-serif text-lg text-[#1D265A]">{metrics.cities} Cities</span>
                            </div>
                            <div className="text-center border-r border-[#1D265A]/10 px-2">
                                <strong className="text-[#C5A572] uppercase text-[9px] tracking-[0.3em] block mb-3">Curated Acts</strong>
                                <span className="font-serif text-lg text-[#1D265A]">{metrics.activities} Experiences</span>
                            </div>
                            <div className="text-center px-2">
                                <strong className="text-[#C5A572] uppercase text-[9px] tracking-[0.3em] block mb-3">Est. Travel</strong>
                                <span className="font-serif text-lg text-[#1D265A]">{metrics.distance > 0 ? `${metrics.distance} km` : 'TBD'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="prose prose-neutral max-w-none text-[#1D265A]/80 leading-[2.2] font-serif text-justify text-lg">
                        <p className="mb-6"><span className="text-3xl float-left mr-3 leading-none text-[#C5A572]">D</span>ear {tripData.clientName},</p>
                        <p className="mb-6">
                            Thank you for entrusting Nilathra Collection with your upcoming journey. We are thrilled to present this meticulously curated itinerary, designed specifically to reflect your unique preferences and desires.
                        </p>
                        <p>
                            Every detail within these pages—from the luxurious accommodations to the immersive experiences—has been selected by our experts to ensure absolute comfort and exclusivity. We invite you to review this proposal, knowing that our dedicated team remains at your disposal to refine any aspect until it perfectly aligns with your vision.
                        </p>
                        
                        <div className="mt-16 border-t border-[#1D265A]/10 pt-8 flex justify-between items-center">
                            <span className="text-[10px] font-sans tracking-[0.2em] uppercase text-[#C5A572]">Ref: {tripData.id?.split('-')[0].toUpperCase() || 'DRAFT'}</span>
                            <span className="text-[10px] font-sans tracking-[0.2em] uppercase text-[#1D265A]/50">Nilathra Collection</span>
                        </div>
                    </div>
                </div>

                {/* 3. The Itinerary */}
                <div className="px-24 pb-16 max-w-[900px] mx-auto break-before-page print:break-before-auto">
                    <div className="mb-20 text-center">
                        <h3 className="text-xs text-[#C5A572] uppercase tracking-[0.4em] font-semibold mb-4">Chronology</h3>
                        <h2 className="text-4xl font-serif text-[#1D265A] font-light">The Itinerary</h2>
                    </div>

                    <div className="relative">
                        {/* Timeline Spine */}
                        <div className="absolute left-[23px] top-4 bottom-0 w-px bg-[#C5A572]/30"></div>

                        <div className="space-y-16">
                            {Array.from(new Set(itinerary.map(b => b.dayNumber))).sort((a, b) => a - b).map(dayNum => {
                                const timeToMins = (timeStr?: string, blockType?: string) => {
                                    if (!timeStr || !timeStr.includes(':')) {
                                        if (blockType === 'sleep') return 1440; // Push sleep blocks to end of day if no time
                                        return -1; // Push other untimed blocks to top
                                    }
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
                                    const timeA = timeToMins(a.startTime, a.type);
                                    const timeB = timeToMins(b.startTime, b.type);
                                    return timeA - timeB;
                                });

                                return (
                                    <div key={dayNum} className="relative break-inside-avoid">
                                        <div className="flex items-start gap-6">
                                            {/* Day Marker */}
                                            <div className="flex flex-col items-center bg-white z-10 w-[48px]">
                                                <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A572] mb-1">Day</span>
                                                <span className="text-4xl font-serif text-[#1D265A] leading-none mb-4">{dayNum}</span>
                                                <div className="w-2 h-2 rounded-full bg-[#1D265A]"></div>
                                            </div>

                                            {/* Day Content */}
                                            <div className="flex-1 pt-1">
                                                <div className="space-y-10">
                                                    {dayBlocks.map((block, idx) => (
                                                        <div key={block.id} className="group">
                                                            <div className="flex justify-between items-baseline border-b border-[#1D265A]/5 pb-3 mb-3">
                                                                <h5 className="font-serif text-xl text-[#1D265A] font-medium">{block.name}</h5>
                                                                {block.startTime && (
                                                                    <div className="flex items-center gap-2 text-[10px] font-sans tracking-[0.2em] text-[#C5A572] uppercase">
                                                                        <Clock size={10} />
                                                                        {block.startTime} {block.endTime ? `- ${block.endTime}` : ''}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            {block.locationName && (
                                                                <p className="text-[11px] font-sans text-[#1D265A]/60 flex items-center gap-1.5 uppercase tracking-[0.2em] mb-4">
                                                                    <MapPin size={10} className="text-[#C5A572]" /> {block.locationName}
                                                                </p>
                                                            )}
                                                            
                                                            {block.clientVisibleNotes && (
                                                                <p className="text-sm font-serif text-[#1D265A]/70 leading-relaxed italic mb-4">
                                                                    {block.clientVisibleNotes}
                                                                </p>
                                                            )}

                                                            {/* Render Bound Logistics Data */}
                                                            {masterData && (block.transportId || block.driverId || block.guideId || block.vendorId) && (
                                                                <div className="mt-4 pt-3 border-t border-[#C5A572]/20 flex flex-wrap gap-x-6 gap-y-2">
                                                                    {block.transportId && masterData.transportProviders && (
                                                                        <span className="text-[10px] font-sans text-[#1D265A]/80 flex items-center gap-1 uppercase tracking-[0.1em]">
                                                                            <span className="text-[#C5A572] font-semibold">Transport:</span>
                                                                            {masterData.transportProviders.find((p:any) => p.id === block.transportId)?.name || 'Assigned'}
                                                                        </span>
                                                                    )}
                                                                    {block.driverId && masterData.drivers && (() => {
                                                                        const d = masterData.drivers.find((x:any) => x.id === block.driverId);
                                                                        return d && (
                                                                            <span className="text-[10px] font-sans text-[#1D265A]/80 flex items-center gap-1 uppercase tracking-[0.1em]">
                                                                                <span className="text-[#C5A572] font-semibold">Chauffeur:</span>
                                                                                {`${d.first_name} ${d.last_name}`.trim()}
                                                                            </span>
                                                                        );
                                                                    })()}
                                                                    {block.guideId && masterData.guides && (() => {
                                                                        const g = masterData.guides.find((x:any) => x.id === block.guideId);
                                                                        return g && (
                                                                            <span className="text-[10px] font-sans text-[#1D265A]/80 flex items-center gap-1 uppercase tracking-[0.1em]">
                                                                                <span className="text-[#C5A572] font-semibold">Guide:</span>
                                                                                {`${g.first_name} ${g.last_name}`.trim()}
                                                                            </span>
                                                                        );
                                                                    })()}
                                                                    {block.vendorId && masterData.vendors && (
                                                                        <span className="text-[10px] font-sans text-[#1D265A]/80 flex items-center gap-1 uppercase tracking-[0.1em]">
                                                                            <span className="text-[#C5A572] font-semibold">Partner:</span>
                                                                            {masterData.vendors.find((v:any) => v.id === block.vendorId)?.name || 'Assigned'}
                                                                        </span>
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

                {/* 4. Options & Commercials */}
                {hasCommercials && (
                    <div className="px-24 pb-16 max-w-[900px] mx-auto break-before-page">
                        
                        <div className="mb-24">
                            <div className="text-center mb-16">
                                <h3 className="text-xs text-[#C5A572] uppercase tracking-[0.4em] font-semibold mb-4">Curation</h3>
                                <h2 className="text-4xl font-serif text-[#1D265A] font-light">Residences & Logistics</h2>
                            </div>
                            
                            {hasValidHotels && (
                                <div className="mb-16">
                                    <h4 className="text-[10px] font-sans text-[#1D265A] uppercase tracking-[0.4em] border-b border-[#1D265A]/20 pb-4 mb-8 text-center">Accommodations</h4>
                                    <div className="space-y-6">
                                        {[...validAccommodations].sort((a, b) => a.nightIndex - b.nightIndex).map((acc, idx) => {
                                            const roomSummaries = acc.selectedRooms && acc.selectedRooms.length > 0
                                                ? acc.selectedRooms.map((sr: any) => `${sr.quantity}x ${sr.roomName || sr.roomStandard}`).join(', ')
                                                : (acc.roomName || acc.roomStandard || 'Standard Room');
                                                
                                            const mealPlans = acc.selectedRooms && acc.selectedRooms.length > 0
                                                ? Array.from(new Set(acc.selectedRooms.map((sr: any) => sr.mealPlan || 'BB'))).join(' / ')
                                                : (acc.mealPlan || 'BB');

                                            return (
                                                <div key={idx} className="flex justify-between items-center py-4 border-b border-[#1D265A]/5">
                                                    <div>
                                                        <strong className="block text-xl font-serif text-[#1D265A] mb-2">{acc.hotelName || 'Pending Assignment'}</strong>
                                                        <span className="text-[10px] text-[#1D265A]/50 font-sans uppercase tracking-[0.2em]">
                                                            Night {acc.nightIndex} &nbsp;|&nbsp; {roomSummaries}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[9px] font-sans text-[#C5A572] uppercase tracking-[0.3em] border border-[#C5A572]/30 px-3 py-1 rounded-full">
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
                                    <h4 className="text-[10px] font-sans text-[#1D265A] uppercase tracking-[0.4em] border-b border-[#1D265A]/20 pb-4 mb-8 text-center">Transportation</h4>
                                    <div className="space-y-6">
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
                                                <div key={idx} className="flex justify-between items-start py-4 border-b border-[#1D265A]/5">
                                                    <div>
                                                        <strong className="block text-xl font-serif text-[#1D265A] mb-2 capitalize">{t.mode.replace(/_/g, ' ')}</strong>
                                                        
                                                        {displaySupplier && (
                                                            <div className="text-[11px] font-sans text-[#1D265A]/80 mb-1">
                                                                <span className="font-semibold text-[#C5A572]">Provider:</span> {displaySupplier} {displayVehicle ? `(${displayVehicle})` : ''}
                                                            </div>
                                                        )}
                                                        
                                                        {displayDriver && (
                                                            <div className="text-[11px] font-sans text-[#1D265A]/80 mb-1">
                                                                <span className="font-semibold text-[#C5A572]">Chauffeur:</span> {displayDriver} {displayDriverContact ? `• ${displayDriverContact}` : ''}
                                                            </div>
                                                        )}
                                                        
                                                        {displayGuideAssigned && displayGuide && (
                                                            <div className="text-[11px] font-sans text-[#1D265A]/80 mb-1">
                                                                <span className="font-semibold text-[#C5A572]">Guide:</span> {displayGuide}
                                                            </div>
                                                        )}

                                                        <span className="text-[9px] text-[#1D265A]/50 font-sans uppercase tracking-[0.2em] mt-2 block">
                                                            {displayGuideAssigned ? 'With Professional Guide' : 'Chauffeur Driven'}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[9px] font-sans text-[#1D265A]/50 uppercase tracking-[0.3em]">
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

                        {/* 5. Costs Table */}
                        {financials && hasValidHotels && (
                            <div className="mb-24 break-inside-avoid">
                                <div className="text-center mb-12">
                                    <h3 className="text-xs text-[#C5A572] uppercase tracking-[0.4em] font-semibold mb-4">Commercials</h3>
                                    <h2 className="text-3xl font-serif text-[#1D265A] font-light">Investment Summary</h2>
                                </div>
                                
                                <div className="border-t border-b border-[#1D265A] py-2">
                                    <table className="w-full text-sm">
                                        <tbody>
                                            <tr className="border-b border-[#1D265A]/10">
                                                <td className="py-8 font-serif text-xl text-[#1D265A]">Total Package Investment</td>
                                                <td className="py-8 text-right font-serif text-2xl text-[#1D265A]">${financials.sellingPrice?.toLocaleString() || 0}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-6 text-[#1D265A]/50 font-sans uppercase tracking-[0.2em] text-[10px]">Estimated Per Person</td>
                                                <td className="py-6 text-right font-sans text-[#C5A572] text-sm tracking-widest">${pax > 0 ? (financials.sellingPrice / pax).toFixed(0).toLocaleString() : 0}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* 6. Policy Note */}
                        <div className="mt-32 pt-16 border-t border-[#C5A572]/20 text-center pb-16">
                            <img src="/images/nilathra-logo.png" alt="Nilathra" className="w-12 mx-auto mb-8 opacity-20 grayscale" onError={(e) => e.currentTarget.style.display = 'none'} />
                            <p className="text-[#C5A572] mb-4 uppercase tracking-[0.3em] text-[8px] font-semibold">Validity & Terms</p>
                            <p className="text-[11px] text-[#1D265A]/50 font-sans leading-relaxed max-w-xl mx-auto uppercase tracking-wider">
                                This customized itinerary is valid for a period of two weeks from issuance. Pricing and availability are subject to change upon final confirmation.
                            </p>
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
