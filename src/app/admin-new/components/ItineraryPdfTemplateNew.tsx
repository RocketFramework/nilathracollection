import React from 'react';
import { InternalItineraryBlock } from '@/other/interfaces';
import { TouristDataDTO } from '@/dtos/tourist-data.dto';
import { TravelStyle, ItineraryBlockTypes, TierSettingDefinitions, TravelStylePolicyKeys } from '@/types/types';

interface ItineraryPdfTemplateNewProps {
  itinerary: InternalItineraryBlock[];
  touristData: TouristDataDTO;
  travelStyle: TravelStyle;
  singleRoomsCount: number;
  doubleRoomsCount: number;
  tripleRoomsCount: number;
  familyRoomsCount: number;
  guideNeeded: boolean;
  chauffeurNeeded: boolean;
  appSettings?: any;
  masterData?: any;
  tripStatus?: string;
  dayCostOverrides?: Record<number, any>;
}

export const ItineraryPdfTemplateNew = React.forwardRef<HTMLDivElement, ItineraryPdfTemplateNewProps>(
  ({
    itinerary,
    touristData,
    travelStyle,
    singleRoomsCount,
    doubleRoomsCount,
    tripleRoomsCount,
    familyRoomsCount,
    guideNeeded,
    chauffeurNeeded,
    appSettings,
    masterData,
    tripStatus,
    dayCostOverrides
  }, ref) => {
    
    const clientName = touristData.profile 
      ? `${touristData.profile.first_name || ''} ${touristData.profile.last_name || ''}`.trim() || 'Valued Guest'
      : 'Valued Guest';

    const adults = touristData.preferences?.adults || 0;
    const children = touristData.preferences?.children || 0;
    const infants = touristData.preferences?.infants || 0;
    const totalPax = adults + children + infants;

    const arrivalDate = touristData.preferences?.arrival_date || '';
    const departureDate = touristData.preferences?.departure_date || '';
    const durationDays = touristData.preferences?.duration_days || itinerary.reduce((max, b) => Math.max(max, b.dayNumber), 0) || 5;

    // Calculate metrics
    let totalDistance = 0;
    let activityCount = 0;
    const destinations = new Set<string>();

    itinerary.forEach(block => {
      if (block.type === ItineraryBlockTypes.ACTIVITY) activityCount++;
      if (block.locationName && block.locationName.trim() !== '') {
        destinations.add(block.locationName.trim());
      }
      if (block.distance) {
        const distVal = parseInt(block.distance.replace(/[^0-9]/g, ''));
        if (!isNaN(distVal)) {
          totalDistance += distVal;
        }
      }
    });

    // Analyze active activities in the itinerary to customize the prologue
    let hasWildlife = false;
    let hasCoastline = false;
    let hasHeritage = false;
    let hasSigiriya = false;
    let hasHighlands = false;

    itinerary.forEach(block => {
      if (block.type === ItineraryBlockTypes.ACTIVITY) {
        const resolvedActId = block.activityId;
        const v = block.vendorId ? masterData?.vendors?.find((x: any) => x.id === block.vendorId) : null;
        const va = v?.vendor_activities?.find((x: any) => x.id === block.vendorActivityId) ||
                   (resolvedActId ? v?.vendor_activities?.find((x: any) => Number(x.activity_id) === Number(resolvedActId)) : null);
        const activityDetail = masterData?.activities?.find((a: any) => Number(a.id) === Number(resolvedActId || va?.activity_id));
        
        if (activityDetail) {
          const cat = activityDetail.category;
          const nameLower = (activityDetail.activity_name || '').toLowerCase();
          const locLower = (activityDetail.location_name || '').toLowerCase();

          if (cat === 'Wildlife' || cat === 'Nature & Wildlife') {
            hasWildlife = true;
          }
          if (cat === 'Beach') {
            hasCoastline = true;
          }
          if (cat === 'Cultural') {
            hasHeritage = true;
            if (nameLower.includes('sigiriya') || locLower.includes('sigiriya')) {
              hasSigiriya = true;
            }
          }
          if (
            nameLower.includes('tea') ||
            nameLower.includes('ella') ||
            nameLower.includes('nuwara eliya') ||
            nameLower.includes('hakgala') ||
            nameLower.includes('horton plains') ||
            locLower.includes('ella') ||
            locLower.includes('nuwara eliya') ||
            locLower.includes('hakgala')
          ) {
            hasHighlands = true;
          }
        }
      }
    });

    const blendElements: string[] = [];
    if (hasHeritage) blendElements.push("ancient heritage");
    if (hasHighlands) blendElements.push("emerald tea valleys");
    if (hasWildlife) blendElements.push("rare wild encounters");
    if (hasCoastline) blendElements.push("pristine coastlines");
    blendElements.push("unhurried luxury");

    let blendText = "";
    if (blendElements.length === 1) {
      blendText = blendElements[0];
    } else if (blendElements.length === 2) {
      blendText = `${blendElements[0]} and ${blendElements[1]}`;
    } else {
      blendText = `${blendElements.slice(0, -1).join(', ')}, and ${blendElements[blendElements.length - 1]}`;
    }

    const welcomeText = `Welcome to your personalized Ceylon journey, crafted by Nilathra Collection. We have designed this itinerary to ensure you experience Sri Lanka at its absolute finest—a seamless blend of ${blendText}.`;

    const highlightElements: string[] = [];
    if (hasSigiriya) {
      highlightElements.push("climbing Sigiriya's mist-covered steps");
    } else if (hasHeritage) {
      highlightElements.push("exploring sacred ancient temples");
    }
    if (hasHighlands) {
      highlightElements.push("wandering through emerald tea valleys");
    }
    if (hasWildlife) {
      highlightElements.push("seeking rare wildlife on private safaris");
    }
    if (hasCoastline) {
      highlightElements.push("resting in boutique oceanfront pavilions");
    }

    let highlightsSentence = "";
    if (highlightElements.length >= 2) {
      let highlightText = "";
      if (highlightElements.length === 2) {
        highlightText = `${highlightElements[0]} or ${highlightElements[1]}`;
      } else {
        highlightText = `${highlightElements.slice(0, -1).join(', ')}, or ${highlightElements[highlightElements.length - 1]}`;
      }
      highlightsSentence = `Every accommodation, experience, and pathway curated in this proposal has been structured to honor your personal pacing. Whether ${highlightText}, this draft serves as your travel blueprint.`;
    } else if (highlightElements.length === 1) {
      let singlePhrase = "";
      if (hasSigiriya) {
        singlePhrase = "As you climb Sigiriya's mist-covered steps";
      } else if (hasHeritage) {
        singlePhrase = "As you explore sacred ancient temples";
      } else if (hasHighlands) {
        singlePhrase = "As you wander through emerald tea valleys";
      } else if (hasWildlife) {
        singlePhrase = "As you seek rare wildlife on private safaris";
      } else if (hasCoastline) {
        singlePhrase = "As you rest in boutique oceanfront pavilions";
      }
      highlightsSentence = `Every accommodation, experience, and pathway curated in this proposal has been structured to honor your personal pacing. ${singlePhrase}, this draft serves as your travel blueprint.`;
    } else {
      highlightsSentence = `Every accommodation, experience, and pathway curated in this proposal has been structured to honor your personal pacing. This draft serves as your travel blueprint to guide your journey.`;
    }


    const getShortFormattedDate = (dayNum: number) => {
      if (!arrivalDate) return `Day ${dayNum}`;
      try {
        const d = new Date(arrivalDate);
        if (isNaN(d.getTime())) return `Day ${dayNum}`;
        d.setDate(d.getDate() + (dayNum - 1));
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      } catch (e) {
        return `Day ${dayNum}`;
      }
    };

    const getLongFormattedDate = (dayNum: number) => {
      if (!arrivalDate) return '';
      try {
        const d = new Date(arrivalDate);
        if (isNaN(d.getTime())) return '';
        d.setDate(d.getDate() + (dayNum - 1));
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      } catch (e) {
        return '';
      }
    };

    // Helper to calculate daily cost summary
    const calculateDayTotal = (dayNum: number) => {
      const overrides = dayCostOverrides?.[dayNum] || {};
      const blocksForDay = itinerary.filter(b => b.dayNumber === dayNum);
      
      // 1. Hotel Cost
      const hotel = overrides.hotel !== undefined 
        ? overrides.hotel 
        : blocksForDay
            .filter(b => b.type === ItineraryBlockTypes.SLEEP)
            .reduce((sum, b) => sum + (Number(b.agreedPrice) || 0), 0);

      // 2. Pax Count
      const pax = (adults || 0) + (children || 0);

      // Helper to get settings keys
      const getTierValue = (setting: typeof TierSettingDefinitions[keyof typeof TierSettingDefinitions]) => {
        if (!appSettings) return setting.defaultValue;
        const key = travelStyle?.toLowerCase().replace(' ', '_') || 'luxury';
        const fullKey = `${key}_${setting.key}`;
        return appSettings[fullKey] !== undefined ? Number(appSettings[fullKey]) : setting.defaultValue;
      };

      // 3. Meal Cost (Lunch cost per tourist * pax)
      const lunchCostPerHead = getTierValue(TierSettingDefinitions.LUNCH_COST);
      const meals = overrides.meals !== undefined 
        ? overrides.meals 
        : pax * lunchCostPerHead;

      // 4. Transport Cost
      const kmRate = getTierValue(TierSettingDefinitions.VEHICLE_KM_RATE);
      const getBlockKm = (block: InternalItineraryBlock) => {
        if (!block.distance) return 0;
        const parsed = parseFloat(block.distance.toString().replace(/[^\d.]/g, ''));
        return isNaN(parsed) ? 0 : parsed;
      };
      const km = blocksForDay.reduce((sum, b) => sum + getBlockKm(b), 0);
      const transport = overrides.transport !== undefined 
        ? overrides.transport 
        : km * kmRate;

      // 5. Concierge Cost (ticket, refreshment, seamless concierge)
      const conciergeCostPerHead = getTierValue(TierSettingDefinitions.CONCIERGE_COST);
      const concierge = overrides.concierge !== undefined 
        ? overrides.concierge 
        : pax * conciergeCostPerHead;

      // 6. Agency Fee & Tax
      const agencyFeePercent = overrides.agencyFeePercent !== undefined
        ? overrides.agencyFeePercent
        : getTierValue(TierSettingDefinitions.SERVICE_FEE);
        
      const subtotal = hotel + meals + transport + concierge;
      const agencyFee = overrides.agencyFee !== undefined
        ? overrides.agencyFee
        : subtotal * (agencyFeePercent / 100);

      const total = overrides.total !== undefined
        ? overrides.total
        : subtotal + agencyFee;

      return {
        hotel,
        meals,
        km,
        transport,
        concierge,
        agencyFeePercent,
        agencyFee,
        total
      };
    };

    const getResolvedBindingDisplay = (block: InternalItineraryBlock) => {
      if (!masterData) return null;

      if (block.type === ItineraryBlockTypes.SLEEP && block.hotelId) {
        const h = masterData.hotels?.find((x: any) => x.id === block.hotelId);
        let label = h?.name || block.hotelName || 'Linked Hotel';
        if (block.roomName) {
          label += ` — Room: ${block.roomName}`;
        }
        if (block.mealPlan) {
          label += ` (${block.mealPlan})`;
        }
        return {
          label,
          type: ItineraryBlockTypes.SLEEP,
        };
      }
      if (block.type === ItineraryBlockTypes.MEAL && block.restaurantId) {
        const r = masterData.restaurants?.find((x: any) => x.id === block.restaurantId);
        let label = r?.name || 'Linked Restaurant';
        if (block.mealType) {
          label += ` — ${block.mealType}`;
        }
        return {
          label,
          type: ItineraryBlockTypes.MEAL,
        };
      }
      if (block.type === ItineraryBlockTypes.ACTIVITY && (block.vendorId || block.vendorActivityId || block.activityId)) {
        const v = masterData.vendors?.find((x: any) => x.id === block.vendorId);
        const resolvedActId = block.activityId;
        const va = v?.vendor_activities?.find((x: any) => x.id === block.vendorActivityId) ||
                   v?.vendor_activities?.find((x: any) => Number(x.activity_id) === Number(resolvedActId));
        
        const activityLabel = va?.activity_name || block.name || 'Activity';
        let label = v ? `${v.name} — ${activityLabel}` : (block.name || 'Activity');
        return {
          label,
          type: ItineraryBlockTypes.ACTIVITY,
        };
      }
      if (block.type === ItineraryBlockTypes.TRAVEL && (block.driverId || block.transportId || block.vehicleId)) {
        const d = masterData.drivers?.find((x: any) => x.id === block.driverId);
        const p = masterData.transportProviders?.find((x: any) => x.id === block.transportId);
        const v = p?.transport_vehicles?.find((x: any) => x.id === block.vehicleId);

        let label = p?.name || 'Transport';
        if (v) {
          label = `${p?.name || ''} — ${v.make_and_model || v.vehicle_type}`;
          if (block.transportQuantity) {
            label += ` [${block.transportQuantity} ${block.transportRateType === 'km' ? 'KM' : 'Day(s)'}]`;
          }
          if (v.with_driver) {
            label += ' [Incl. Driver]';
          } else if (d) {
            label += ` [Driver: ${d.first_name}]`;
          }
        } else if (d) {
          label = `Driver: ${d.first_name} ${d.last_name}`;
        }
        return {
          label,
          type: ItineraryBlockTypes.TRAVEL,
        };
      }
      if (block.type === ItineraryBlockTypes.GUIDE && block.guideId) {
        const g = masterData.guides?.find((x: any) => x.id === block.guideId);
        return {
          label: g ? `Guide: ${g.first_name} ${g.last_name}` : 'Linked Guide',
          type: ItineraryBlockTypes.GUIDE,
        };
      }
      return null;
    };

    // Calculate overall itinerary costs summary
    const uniqueDays = Array.from(new Set(itinerary.map(b => b.dayNumber))).filter(d => d > 0).sort((a, b) => a - b);
    const overallCostSummary = uniqueDays.reduce((totals, dayNum) => {
      const dayCosts = calculateDayTotal(dayNum);
      return {
        hotel: totals.hotel + dayCosts.hotel,
        meals: totals.meals + dayCosts.meals,
        transport: totals.transport + dayCosts.transport,
        concierge: totals.concierge + dayCosts.concierge,
        agencyFee: totals.agencyFee + dayCosts.agencyFee,
        total: totals.total + dayCosts.total
      };
    }, { hotel: 0, meals: 0, transport: 0, concierge: 0, agencyFee: 0, total: 0 });

    // Calculate total price of hotel blocks in the skeleton itinerary
    const hotelPriceTotal = itinerary
      .filter(b => b.type === ItineraryBlockTypes.SLEEP && b.agreedPrice !== undefined)
      .reduce((sum, b) => sum + (b.agreedPrice || 0), 0);

    return (
      <div 
        ref={ref} 
        className="bg-white mx-auto font-sans antialiased text-[#1F2937]"
        style={{ 
          WebkitPrintColorAdjust: "exact", 
          printColorAdjust: "exact", 
          width: "210mm", 
          minHeight: "297mm",
          backgroundColor: "#FFFFFF"
        }}
      >
        {/* Style sheet for printable overrides */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { 
              background: white !important; 
              margin: 0 !important; 
              padding: 0 !important; 
            }
            .print-page-break { 
              page-break-after: always; 
              break-after: page;
            }
            .print-avoid-break { 
              page-break-inside: avoid; 
              break-inside: avoid;
            }
            .print-header-spacer { 
              height: 20mm; 
            }
            .print-footer-spacer { 
              height: 25mm; 
            }
          }
        `}} />

        {/* 1. COVER PAGE - Premium Emerald and Gold Theme */}
        <div 
          className="print-page-break flex flex-col items-center justify-between p-12 box-border relative overflow-hidden"
          style={{ 
            height: "297mm", 
            backgroundColor: "#0A251D", 
            color: "#FFFFFF",
            padding: "30mm 20mm"
          }}
        >
          {/* Subtle gold frames */}
          <div className="absolute inset-8 border-[0.5px] border-[#D4AF37]/35 pointer-events-none"></div>
          <div className="absolute inset-[36px] border border-[#D4AF37]/10 pointer-events-none"></div>
          
          {/* Header Area */}
          <div className="z-10 text-center flex flex-col items-center mt-8">
            <div className="mb-4">
              <img 
                src="/images/nilathra_logo-02.png" 
                alt="Nilathra Collection" 
                className="w-48 opacity-90 relative z-10 filter brightness-200" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.insertAdjacentHTML('afterbegin', '<h1 class="text-3xl font-serif text-white uppercase tracking-[0.35em] mb-2">NILATHRA</h1>');
                }} 
              />
            </div>
            <span className="text-[#D4AF37] text-[9px] tracking-[0.5em] uppercase font-light">
              The Collection
            </span>
            <div className="w-16 h-[1px] bg-[#D4AF37]/40 mt-6 mb-2"></div>
          </div>

          {/* Central Title Block */}
          <div className="z-10 text-center flex flex-col items-center my-auto space-y-8 max-w-lg">
            <span className="text-[#D4AF37] text-[10px] tracking-[0.4em] uppercase font-semibold">
              Curated Private Journey
            </span>
            <h2 className="text-5xl font-serif text-white font-extralight italic leading-tight tracking-wide">
              {clientName}
            </h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-[0.5px] bg-[#D4AF37]/30"></div>
              <span className="text-[#D4AF37]/80 text-[8px] tracking-[0.25em] uppercase font-mono">
                Sri Lanka
              </span>
              <div className="w-10 h-[0.5px] bg-[#D4AF37]/30"></div>
            </div>
          </div>

          {/* Cover Footer */}
          <div className="z-10 text-center flex flex-col items-center mb-8 space-y-2">
            <span className="text-white/60 text-[9px] uppercase tracking-[0.25em]">
              {destinations.size} Destinations &bull; {durationDays} Days / {durationDays > 1 ? durationDays - 1 : 1} Nights
            </span>
            <span className="text-[#D4AF37] text-[9px] uppercase tracking-[0.2em] font-semibold">
              {arrivalDate ? new Date(arrivalDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Dates to be confirmed'}
            </span>
            <span className="text-white/30 text-[7px] uppercase tracking-[0.3em] pt-4 block">
              Private & Confidential
            </span>
          </div>
        </div>

        {/* PRINT LAYOUT OUTER WRAPPER WITH TABLE FOR HEADER/FOOTER PAGINATION */}
        <table className="w-full">
          {/* Spacer header at top of pages when printing */}
          <thead className="hidden print:table-header-group">
            <tr>
              <td>
                <div className="print-header-spacer"></div>
              </td>
            </tr>
          </thead>

          {/* Spacer footer at bottom of pages when printing */}
          <tfoot className="hidden print:table-footer-group">
            <tr>
              <td>
                <div className="print-footer-spacer flex items-end justify-between px-16 pb-8 text-[8px] uppercase tracking-[0.2em] text-[#9CA3AF] font-sans">
                  <span>Nilathra Collection</span>
                  <span>Private & Confidential Itinerary</span>
                </div>
              </td>
            </tr>
          </tfoot>

          <tbody className="table-row-group">
            <tr>
              <td>
                
                {/* 2. PROLOGUE / WELCOME PAGE */}
                <div className="print-page-break px-16 py-12 max-w-[850px] mx-auto min-h-[250mm]">
                  <div className="text-center mb-16">
                    <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] block mb-2">Prologue</span>
                    <div className="w-10 h-[1px] bg-[#D4AF37] mx-auto"></div>
                  </div>
                  
                  <div className="prose prose-neutral max-w-none text-[#4B5563] leading-[2.2] font-serif text-justify text-base pl-8 relative">
                    {/* Gold vertical line accent */}
                    <div className="absolute left-0 top-1 bottom-1 w-[1.5px] bg-gradient-to-b from-[#D4AF37]/20 via-[#D4AF37] to-[#D4AF37]/20"></div>
                    
                    <p className="mb-6 text-xl text-[#111827] font-normal tracking-wide">
                      Ayubowan, Dear {clientName},
                    </p>
                    <p className="mb-6 font-light">
                      {welcomeText}
                    </p>
                    <p className="mb-6 font-light">
                      {highlightsSentence}
                    </p>
                    <p className="mb-10 font-light">
                      As your concierge hosts, we remain entirely at your disposal to refine these dates, hotels, or events to your perfect liking. We look forward to guiding you through this exquisite journey.
                    </p>
                    
                    <div className="mt-16 pt-6">
                      <p className="text-[#111827] font-serif italic text-lg mb-1">Warmest Greetings,</p>
                      <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-sans font-bold">The Nilathra Concierge Team</p>
                    </div>
                  </div>
                </div>

                {/* 3. TRIP BLUEPRINT / METRICS OVERVIEW */}
                <div className="print-page-break px-16 py-12 max-w-[850px] mx-auto min-h-[250mm]">
                  <div className="text-center mb-12">
                    <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] block mb-2">The Blueprint</span>
                    <h3 className="text-3xl font-serif text-[#111827] font-light italic">Journey Details</h3>
                  </div>

                  <div className="bg-[#FAF9F6] border border-[#EBE6DC] rounded-2xl p-10 space-y-10">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-10">
                      
                      <div className="border-l-[1.5px] border-[#D4AF37] pl-4">
                        <span className="text-[8px] font-sans uppercase tracking-[0.2em] text-neutral-400 block mb-1">Party Details</span>
                        <span className="font-serif text-lg text-neutral-800 font-medium">
                          {adults} Adults {children > 0 ? `• ${children} Children` : ''} {infants > 0 ? `• ${infants} Infants` : ''} ({totalPax} Pax)
                        </span>
                      </div>

                      <div className="border-l-[1.5px] border-[#D4AF37] pl-4">
                        <span className="text-[8px] font-sans uppercase tracking-[0.2em] text-neutral-400 block mb-1">Duration</span>
                        <span className="font-serif text-lg text-neutral-800 font-medium">
                          {durationDays} Days / {durationDays > 1 ? durationDays - 1 : 1} Nights
                        </span>
                      </div>

                      <div className="border-l-[1.5px] border-[#D4AF37] pl-4">
                        <span className="text-[8px] font-sans uppercase tracking-[0.2em] text-neutral-400 block mb-1">Style & Character</span>
                        <span className="font-serif text-lg text-neutral-800 font-medium">
                          {travelStyle} Travel Style
                        </span>
                      </div>

                      <div className="border-l-[1.5px] border-[#D4AF37] pl-4">
                        <span className="text-[8px] font-sans uppercase tracking-[0.2em] text-neutral-400 block mb-1">Proposed Window</span>
                        <span className="font-serif text-lg text-neutral-800 font-medium">
                          {arrivalDate ? `${new Date(arrivalDate).toLocaleDateString()} to ${new Date(departureDate).toLocaleDateString()}` : 'Dates to be determined'}
                        </span>
                      </div>

                      <div className="border-l-[1.5px] border-[#D4AF37] pl-4">
                        <span className="text-[8px] font-sans uppercase tracking-[0.2em] text-neutral-400 block mb-1">Services Included</span>
                        <span className="font-serif text-base text-neutral-700 font-medium">
                          {guideNeeded ? '✓ National Tour Guide ' : ''} 
                          {chauffeurNeeded ? '✓ Chauffeur Driven Vehicle ' : ''}
                          {!guideNeeded && !chauffeurNeeded ? 'Standard Package' : ''}
                        </span>
                      </div>

                      <div className="border-l-[1.5px] border-[#D4AF37] pl-4">
                        <span className="text-[8px] font-sans uppercase tracking-[0.2em] text-neutral-400 block mb-1">Required Accommodations</span>
                        <span className="font-serif text-base text-neutral-700 font-medium">
                          {[
                            singleRoomsCount > 0 ? `${singleRoomsCount} Single` : null,
                            doubleRoomsCount > 0 ? `${doubleRoomsCount} Double` : null,
                            tripleRoomsCount > 0 ? `${tripleRoomsCount} Triple` : null,
                            familyRoomsCount > 0 ? `${familyRoomsCount} Family` : null,
                          ].filter(Boolean).join(', ') || 'Not Specified'}
                        </span>
                      </div>

                    </div>

                    <div className="h-[0.5px] bg-[#E8DFD1] w-full"></div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-6 text-center">
                      <div>
                        <span className="font-serif text-3xl text-neutral-800 block font-light">{destinations.size}</span>
                        <span className="text-[8px] font-sans uppercase tracking-[0.2em] text-neutral-400">Cities Visited</span>
                      </div>
                      <div>
                        <span className="font-serif text-3xl text-neutral-800 block font-light">{activityCount}</span>
                        <span className="text-[8px] font-sans uppercase tracking-[0.2em] text-neutral-400">Curated Activities</span>
                      </div>
                      <div>
                        <span className="font-serif text-3xl text-neutral-800 block font-light">{totalDistance > 0 ? `${totalDistance} km` : 'TBD'}</span>
                        <span className="text-[8px] font-sans uppercase tracking-[0.2em] text-neutral-400">Total Road Travel</span>
                      </div>
                    </div>

                    {appSettings && overallCostSummary.total > 0 ? (
                      <div className="mt-6 pt-4 border-t border-[#E8DFD1] space-y-2 text-xs font-sans text-neutral-600 bg-white p-4 rounded-xl border border-[#E8DFD1]/55 text-left">
                        <div className="uppercase tracking-widest text-[9px] font-bold text-[#D4AF37] font-serif mb-2">Estimated Package Cost Overview</div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[10.5px]">
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Total Accommodation Cost:</span>
                            <span className="font-semibold text-neutral-700">${overallCostSummary.hotel.toFixed(2)} USD</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Total Meal Cost ({adults + children} Pax):</span>
                            <span className="font-semibold text-neutral-700">${overallCostSummary.meals.toFixed(2)} USD</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Total Transport Cost:</span>
                            <span className="font-semibold text-neutral-700">${overallCostSummary.transport.toFixed(2)} USD</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Total Concierge & Seamless Support:</span>
                            <span className="font-semibold text-neutral-700">${overallCostSummary.concierge.toFixed(2)} USD</span>
                          </div>
                          <div className="col-span-2 border-t border-neutral-100 pt-2 mt-1 flex justify-between font-bold text-neutral-800">
                            <span>Subtotal:</span>
                            <span>${(overallCostSummary.hotel + overallCostSummary.meals + overallCostSummary.transport + overallCostSummary.concierge).toFixed(2)} USD</span>
                          </div>
                          <div className="col-span-2 flex justify-between text-[10.5px] text-neutral-500 font-medium">
                            <span>Agency Fee, Tax & Support Fee:</span>
                            <span>${overallCostSummary.agencyFee.toFixed(2)} USD</span>
                          </div>
                          <div className="col-span-2 border-t border-neutral-300 pt-2 mt-1 flex justify-between items-center text-sm font-serif font-black text-neutral-900 bg-[#FAF9F6] p-2.5 rounded-lg border border-[#E8DFD1]/55">
                            <span className="uppercase tracking-wider text-[10px] text-[#8C6D3F]">Estimated Grand Total</span>
                            <span>${overallCostSummary.total.toFixed(2)} USD</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      hotelPriceTotal > 0 && (
                        <div className="mt-4 pt-4 border-t border-[#E8DFD1] flex justify-between items-center text-xs font-serif font-bold text-neutral-800 bg-[#FAFAF9] p-3 rounded-lg border border-[#E8DFD1]/55">
                          <span className="uppercase tracking-widest text-[9px] text-[#D4AF37]">Estimated Hotel Cost Summary</span>
                          <span className="text-sm text-neutral-900 font-sans font-bold">${hotelPriceTotal.toFixed(2)} USD</span>
                        </div>
                      )
                    )}

                  </div>
                </div>

                {/* 4. CHRONOLOGY - DAY-BY-DAY TIMELINE */}
                <div className="px-16 py-12 max-w-[850px] mx-auto">
                  <div className="text-center mb-12">
                    <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] block mb-2">Chronology</span>
                    <h3 className="text-3xl font-serif text-[#111827] font-light italic">Your Custom Itinerary</h3>
                  </div>

                  <div className="space-y-10">
                    {Array.from(new Set(itinerary.map(b => b.dayNumber))).sort((a, b) => a - b).map(dayNum => {
                      
                      // Filter blocks for active day, sorted by time
                      const timeToMins = (timeStr?: string, type?: string) => {
                        if (!timeStr || !timeStr.includes(':')) return type === ItineraryBlockTypes.SLEEP ? 1440 : -1;
                        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
                        if (!match) return type === ItineraryBlockTypes.SLEEP ? 1440 : -1;
                        let h = parseInt(match[1], 10);
                        const m = parseInt(match[2], 10);
                        if (isNaN(h) || isNaN(m)) return type === ItineraryBlockTypes.SLEEP ? 1440 : -1;
                        const period = match[3]?.toUpperCase();
                        if (period === 'PM' && h < 12) h += 12;
                        if (period === 'AM' && h === 12) h = 0;
                        return h * 60 + m;
                      };

                      const dayBlocks = itinerary
                        .filter(b => b.dayNumber === dayNum)
                        .sort((a, b) => timeToMins(a.startTime, a.type) - timeToMins(b.startTime, b.type));

                      if (dayBlocks.length === 0) return null;

                      const weatherInfo = dayBlocks[0]?.weather;
                      const sleepBlock = dayBlocks.find(b => b.type === ItineraryBlockTypes.SLEEP);

                      return (
                        <div key={dayNum} className="print-avoid-break space-y-6">
                          
                          {/* Centered Day Header with Day, Weather, and stay details */}
                          <div className="text-center flex flex-col items-center">
                            <div className="border border-[#E8DFD1] bg-[#FAF8F5] p-5 rounded-2xl max-w-xl w-full text-center shadow-sm">
                              <span className="text-[9px] uppercase tracking-[0.25em] text-[#8C6D3F] font-sans font-bold block mb-1">
                                Day {String(dayNum).padStart(2, '0')}
                              </span>
                              <h4 className="text-lg font-serif text-[#111827] font-bold mb-1">
                                {getLongFormattedDate(dayNum)}
                              </h4>
                              {weatherInfo && (
                                <span className="text-[9px] font-sans font-semibold text-neutral-500 bg-white border border-[#E8DFD1]/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 mb-2.5">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-amber-500">
                                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
                                  </svg>
                                  {weatherInfo}
                                </span>
                              )}
                              <div className="h-[0.5px] bg-[#E8DFD1] my-2 w-full"></div>
                              {sleepBlock ? (
                                <div className="text-[10px] text-neutral-600 font-sans leading-relaxed">
                                  <div className="font-bold text-[#8C6D3F] text-[10.5px] mb-0.5">
                                    {sleepBlock.hotelName || sleepBlock.name}
                                  </div>
                                  <div className="font-medium">
                                    {sleepBlock.roomName || 'Standard Room'} &bull; {sleepBlock.mealPlan || 'HB'} Basis
                                  </div>
                                  {sleepBlock.locationName && (
                                    <div className="text-neutral-400 font-bold uppercase tracking-wider text-[8px] mt-0.5">
                                      Location: {sleepBlock.locationName}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-[10px] text-neutral-400 italic">
                                  Accommodation: Pending Assignment
                                </div>
                              )}
                              {appSettings && (() => {
                                const costData = calculateDayTotal(dayNum);
                                return (
                                  <div className="text-[10px] text-neutral-600 font-sans leading-relaxed text-left grid grid-cols-2 gap-x-4 gap-y-1 mt-3 bg-white p-2.5 rounded-lg border border-[#E8DFD1]/50 shadow-inner">
                                    <div className="col-span-2 border-b border-neutral-100 pb-1 mb-1 flex justify-between font-bold text-[#8C6D3F]">
                                      <span>Cost Breakdown Summary</span>
                                      <span>Total: ${costData.total.toFixed(2)} USD</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-neutral-400">Hotel Cost:</span>
                                      <span className="font-semibold text-neutral-700">${costData.hotel.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-neutral-400">Meal Cost ({adults + children} Pax):</span>
                                      <span className="font-semibold text-neutral-700">${costData.meals.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-neutral-400">Transport ({costData.km.toFixed(0)} km):</span>
                                      <span className="font-semibold text-neutral-700">${costData.transport.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-neutral-400">Concierge & Tickets:</span>
                                      <span className="font-semibold text-neutral-700">${costData.concierge.toFixed(2)}</span>
                                    </div>
                                    <div className="col-span-2 border-t border-neutral-100 pt-1 mt-1 flex justify-between text-neutral-500 text-[9px]">
                                      <span>Agency Fee & Tax ({costData.agencyFeePercent}%):</span>
                                      <span className="font-semibold">${costData.agencyFee.toFixed(2)}</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Itinerary Events Flow - Full Width, Box-free */}
                          <div className="space-y-4">
                            {dayBlocks.map((block) => {
                              return (
                                <div key={block.id} className="print-avoid-break pb-2">
                                  
                                  {/* Event Image (rendered above data) */}
                                  {(() => {
                                    let imgUrl = block.imageUrl;
                                    if (imgUrl === 'none') {
                                      return null;
                                    }
                                    if (!imgUrl && block.type === ItineraryBlockTypes.SLEEP && block.hotelId) {
                                      const h = masterData.hotels?.find((x: any) => x.id === block.hotelId);
                                      if (h) {
                                        imgUrl = (h.images && h.images.length > 0) ? h.images[0] : (h.photo_url || '');
                                      }
                                    }
                                    if (!imgUrl && block.type === ItineraryBlockTypes.MEAL && block.restaurantId) {
                                      const r = masterData.restaurants?.find((x: any) => x.id === block.restaurantId);
                                      if (r) {
                                        imgUrl = (r.images && r.images.length > 0) ? r.images[0] : (r.photo_url || '');
                                      }
                                    }
                                    if (!imgUrl && block.type === ItineraryBlockTypes.ACTIVITY) {
                                      const resolvedActId = block.activityId;
                                      const v = block.vendorId ? masterData.vendors?.find((x: any) => x.id === block.vendorId) : null;
                                      const va = v?.vendor_activities?.find((x: any) => x.id === block.vendorActivityId) ||
                                                 (resolvedActId ? v?.vendor_activities?.find((x: any) => Number(x.activity_id) === Number(resolvedActId)) : null);
                                      const activityDetail = masterData.activities?.find((a: any) => Number(a.id) === Number(resolvedActId || va?.activity_id));
                                      if (activityDetail) {
                                        imgUrl = (activityDetail.images && activityDetail.images.length > 0) ? activityDetail.images[0] : '';
                                      }
                                    }

                                    if (!imgUrl) return null;
                                    return (
                                      <div className="w-full mb-3 overflow-hidden rounded-xl">
                                        <img 
                                          src={imgUrl} 
                                          alt={block.name} 
                                          className="w-full object-cover max-h-[60mm]" 
                                        />
                                      </div>
                                    );
                                  })()}

                                  {/* Row 1: Location, Description/Name, Time (from - to) */}
                                  <div className="flex justify-between items-baseline py-1 text-sm border-b border-neutral-100">
                                    {/* Location (Left) */}
                                    <div className="w-1/3 text-left text-[#D4AF37] font-serif italic tracking-wide text-[11.5px] font-semibold truncate">
                                      {block.locationName || 'TBD Location'}
                                    </div>
                                    {/* Description / Title (Center) */}
                                    <div className="w-5/12 text-center text-neutral-800 font-bold text-[12.5px]">
                                      {block.name}
                                    </div>
                                    {/* Time (Right) */}
                                    <div className="w-1/4 text-right text-neutral-400 font-sans font-bold tracking-wider text-[9.5px] uppercase">
                                      {block.startTime || 'TBD'} {block.endTime ? `— ${block.endTime}` : ''}
                                    </div>
                                  </div>

                                  {/* Bound Item Details (if any) */}
                                  {(() => {
                                    const bind = getResolvedBindingDisplay(block);
                                    if (!bind) return null;
                                    return (
                                      <div className="mt-1.5 px-3 py-1.5 bg-[#FAF9F6] border border-[#EBE6DC] rounded-xl flex items-center justify-between text-[10.5px] text-neutral-700 font-sans">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[7.5px] font-sans uppercase tracking-[0.25em] text-[#8C6D3F] bg-[#FAF8F5] border border-[#E8DFD1] px-1.5 py-0.5 rounded font-bold">
                                            {bind.type.charAt(0).toUpperCase() + bind.type.slice(1)}
                                          </span>
                                          <span className="font-semibold">{bind.label}</span>
                                        </div>
                                        {block.agreedPrice !== undefined && block.agreedPrice !== null && block.type !== ItineraryBlockTypes.SLEEP && !block.restaurantId && !block.vendorId && (
                                          <span className="font-bold text-[#8C6D3F] text-[10px]">
                                            ${block.agreedPrice.toLocaleString()} USD
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {/* Row 2: Other Data */}
                                  <div className="py-1.5 text-xs text-neutral-500 flex flex-wrap gap-4 justify-between items-start leading-relaxed">
                                    {/* Notes / Description */}
                                    <div className="flex-1 min-w-[200px] text-left font-light text-[11px]">
                                      {block.internalNotes || <span className="italic text-neutral-300">No additional details recorded.</span>}
                                    </div>
                                    
                                    {/* Distance, sleep specific price, type badge */}
                                    <div className="flex flex-col items-end shrink-0 space-y-0.5 text-[9.5px]">
                                      <span className="text-[8px] uppercase tracking-wider font-bold text-neutral-400">
                                        Type: {block.type}
                                      </span>
                                      {block.distance && (
                                        <span className="font-semibold text-neutral-500">
                                          Distance: {block.distance}
                                        </span>
                                      )}
                                      {block.type === ItineraryBlockTypes.SLEEP && block.agreedPrice !== undefined && !block.hotelId && (
                                        <span className="font-extrabold text-neutral-800">
                                          Calculated Price: ${block.agreedPrice.toFixed(2)} USD
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Agent Comments */}
                                  {block.comments && block.comments.length > 0 && (
                                    <div className="mt-1 text-[9.5px] italic text-[#8C6D3F] bg-[#FAF8F5] p-2 rounded-lg border border-[#E8DFD1]/30 pl-6 relative w-full text-left">
                                      <span className="absolute left-2 top-0.5 text-[#D4AF37] font-serif font-black text-xs">“</span>
                                      {block.comments.map(c => c.text).join(' | ')}
                                    </div>
                                  )}

                                </div>
                              );
                            })}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5. POLICIES & IMPORTANT TERMS */}
                {(() => {
                  const getTierPolicyKey = (style: string) => {
                    return TravelStylePolicyKeys[style as keyof typeof TravelStylePolicyKeys] || null;
                  };

                  const isDraft = tripStatus?.toLowerCase() === 'draft';
                  const genericPolicyText = appSettings?.policy_generic || '';
                  const tierKey = travelStyle ? getTierPolicyKey(travelStyle) : null;
                  const tierPolicyText = (tierKey && appSettings?.[tierKey]) || '';

                  const parsePolicyLines = (text: string) => {
                    if (!text) return [];
                    return text
                      .split('\n')
                      .map(line => line.trim())
                      .filter(line => line.length > 0);
                  };

                  const allPolicies = isDraft
                    ? parsePolicyLines(appSettings?.policy_draft || '')
                    : [
                        ...parsePolicyLines(genericPolicyText),
                        ...parsePolicyLines(tierPolicyText)
                      ];

                  if (allPolicies.length === 0) return null;

                  return (
                    <div className="print-avoid-break">
                      <div className="px-16 py-12 max-w-[850px] mx-auto border-t border-[#E8DFD1]/55 mt-8">
                        <div className="text-center mb-8">
                          <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] block mb-2">
                            {isDraft ? "Draft Itinerary Terms" : "Policies & Terms"}
                          </span>
                          <h3 className="text-3xl font-serif text-[#111827] font-light italic">
                            {isDraft ? "Proposal Terms" : "Important Information"}
                          </h3>
                        </div>

                        <div className="bg-[#FAF9F6] border border-[#EBE6DC] rounded-2xl p-8 space-y-4 font-sans text-xs text-[#4B5563] leading-relaxed relative text-left">
                          <div className="absolute left-0 top-6 bottom-6 w-[2px] bg-gradient-to-b from-[#D4AF37]/20 via-[#D4AF37] to-[#D4AF37]/20"></div>
                          <ul className="space-y-3 pl-4 list-none">
                            {allPolicies.map((policy, idx) => (
                              <li key={idx} className="relative pl-6">
                                <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                                <span className="font-medium text-[11.5px] text-[#374151]">{policy}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-16 pt-8 border-t border-[#E8DFD1]/55 text-center pb-8 break-inside-avoid max-w-[850px] mx-auto">
                        <div className="mb-6">
                          <img src="/images/nilathra_logo-02.png" alt="Nilathra" className="w-12 mx-auto opacity-20 filter grayscale" onError={(e) => e.currentTarget.style.display = 'none'} />
                        </div>
                        <div className="flex justify-center items-center gap-8 text-[8px] uppercase tracking-[0.2em] font-sans">
                          <a href="https://www.nilathra.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] border-b border-[#D4AF37]/30 pb-1">Privacy Policy</a>
                          <span className="text-[#E5E7EB]">|</span>
                          <a href="https://www.nilathra.com/terms" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] border-b border-[#D4AF37]/30 pb-1">Terms of Service</a>
                          <span className="text-[#E5E7EB]">|</span>
                          <a href="https://www.nilathra.com/booking-conditions" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] border-b border-[#D4AF37]/30 pb-1">Booking Conditions</a>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </td>
            </tr>
          </tbody>
        </table>

      </div>
    );
  }
);

ItineraryPdfTemplateNew.displayName = 'ItineraryPdfTemplateNew';
