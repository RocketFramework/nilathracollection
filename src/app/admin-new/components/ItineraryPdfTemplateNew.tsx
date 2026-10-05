import React from 'react';
import { InternalItineraryBlock } from '@/other/interfaces';
import { TouristDataDTO } from '@/dtos/tourist-data.dto';
import { TravelStyle, ItineraryBlockTypes, Settings } from '@/types/types';
import { InvoiceCalculationService } from '@/services/invoice-calculation.service';
import { WeatherService } from '@/services/weather.service';

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
  dailyDriverAssignments?: Record<number, any>;
  dailyVehicleAssignments?: Record<number, any>;
  dbActivities?: any[];
  tourConcierges?: any[];
  accommodations?: any[];
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
    dayCostOverrides,
    dailyDriverAssignments,
    dailyVehicleAssignments,
    dbActivities,
    tourConcierges,
    accommodations
  }, ref) => {

    const getAbsoluteUrl = (path: string) => {
      if (typeof window !== 'undefined' && path && path.startsWith('/')) {
        return `${window.location.origin}${path}`;
      }
      return path;
    };

    const clientName = touristData.profile
      ? `${touristData.profile.first_name || ''} ${touristData.profile.last_name || ''}`.trim() || 'Valued Guest'
      : 'Valued Guest';

    const adults = touristData.preferences?.adults || 0;
    const children = touristData.preferences?.children || 0;
    const infants = touristData.preferences?.infants || 0;
    const totalPax = adults + children + infants;

    const arrivalDate = touristData.preferences?.arrival_date || '';
    const departureDate = touristData.preferences?.departure_date || '';
    const calculatedDateDays = (arrivalDate && departureDate) ? (() => {
      const arr = new Date(arrivalDate);
      const dep = new Date(departureDate);
      if (!isNaN(arr.getTime()) && !isNaN(dep.getTime()) && dep >= arr) {
        return Math.ceil(Math.abs(dep.getTime() - arr.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }
      return 0;
    })() : 0;
    const maxItineraryDay = itinerary.reduce((max, b) => Math.max(max, b.dayNumber), 0);
    const durationDays = Math.max(
      calculatedDateDays,
      touristData.preferences?.duration_days || 0,
      maxItineraryDay,
      1
    );

    // Calculate overall journey metrics
    let totalDistance = 0;
    let activityCount = 0;
    const destinations = new Set<string>();

    itinerary.forEach(block => {
      if (block.type === ItineraryBlockTypes.ACTIVITY) activityCount++;
      if (block.locationName && block.locationName.trim() !== '') {
        destinations.add(block.locationName.trim());
      }
      if (block.distance) {
        const distVal = parseFloat(block.distance.replace(/[^\d.]/g, ''));
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
      highlightsSentence = `Every accommodation, experience, and pathway curated in this proposal has been structured to honor your personal pacing. Whether ${highlightText}, this proposal serves as your travel blueprint.`;
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
      highlightsSentence = `Every accommodation, experience, and pathway curated in this proposal has been structured to honor your personal pacing. ${singlePhrase}, this proposal serves as your travel blueprint.`;
    } else {
      highlightsSentence = `Every accommodation, experience, and pathway curated in this proposal has been structured to honor your personal pacing. This proposal serves as your travel blueprint to guide your journey.`;
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

    // Calculate overall itinerary costs summary using InvoiceCalculationService
    const simplifiedItinerary = itinerary.map(b => ({
      id: b.id,
      type: b.type,
      agreedPrice: b.agreedPrice,
      hotelId: b.hotelId,
      quantity: b.quantity || (b as any).headCount || b.transportQuantity || b.restaurantQuantity || (adults + children) || 1,
      dayNumber: b.dayNumber
    }));

    const enrichedTourConcierges = (tourConcierges || []).map((v: any) => {
      const costObj = (masterData?.conciergeCosts || []).find((c: any) => c.id === v.concierge_cost_item_id) ||
        v.cost_item;
      return {
        ...v,
        costing_basis: v.costing_basis || v.cost_item?.costing_basis || costObj?.costing_basis || '',
        cost_item: v.cost_item || costObj
      };
    });

    const invoiceItems = InvoiceCalculationService.calculateInvoiceItems({
      itinerary: simplifiedItinerary,
      travelStyle,
      chauffeurNeeded,
      guideNeeded,
      appSettings,
      pax: adults + children,
      durationDays,
      flightsQuotedSeparately: false,
      flightsQuotedPrice: 0,
      customServiceFee: undefined,
      dayCostOverrides: dayCostOverrides || {},
      dailyDriverAssignments: dailyDriverAssignments || {},
      dailyVehicleAssignments: dailyVehicleAssignments || {},
      dbActivities: dbActivities || [],
      tourConcierges: enrichedTourConcierges,
      accommodations: accommodations || []
    });

    const grandTotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);

    const hotelPriceTotal = Array.from(new Set(itinerary.map(b => b.dayNumber))).reduce((sum, dayNum) => {
      const override = dayCostOverrides?.[dayNum]?.hotel;
      if (override !== undefined) return sum + override;
      const daySleepBlocks = itinerary.filter(b => b.dayNumber === dayNum && b.type === ItineraryBlockTypes.SLEEP);
      return sum + daySleepBlocks.reduce((s, b) => {
        const acc = accommodations?.find((a: any) => Number(a.nightIndex) === Number(dayNum));
        const selectedRoomsTotal = (acc?.selectedRooms || []).reduce((rSum: number, r: any) => {
          const rRate = r.pricePerNight !== undefined && r.pricePerNight !== null ? Number(r.pricePerNight) : Number(r.contractedPrice || 0);
          const rQty = Number(r.quantity || 1);
          return rSum + (rRate * rQty);
        }, 0);

        if (selectedRoomsTotal > 0) return s + selectedRoomsTotal;
        if (b.agreedPrice !== undefined && b.agreedPrice !== null && Number(b.agreedPrice) > 0) return s + Number(b.agreedPrice);
        if (acc?.customContractedTotalPrice !== undefined && acc?.customContractedTotalPrice !== null && Number(acc.customContractedTotalPrice) > 0) return s + Number(acc.customContractedTotalPrice);
        return s + (Number(b.agreedPrice || b.baseRoomRate) || 0);
      }, 0);
    }, 0);

    // Select activity cover images for cover grid
    const coverImagesPool = [
      '/images/activities/nine_arch_bridge_visit.webp',
      '/images/activities/whale_watching_mirissa.webp',
      '/images/activities/scenic_hill_country_drive.webp',
      '/images/activities/colombo_galle_coastal_train.webp',
      '/images/activities/jeep_safari_udawalawe_national_park.webp',
      '/images/activities/wilpattu_park_saffari.webp',
      '/images/activities/swimming_with_whales.webp',
      '/images/activities/dolphin_watch_kalpitiya.webp'
    ];

    const coverImages = React.useMemo(() => {
      const itinImages = itinerary
        .map(b => b.imageUrl)
        .filter((url): url is string => Boolean(url && url !== 'none'));

      const combined = Array.from(new Set([...itinImages, ...coverImagesPool]));
      const strToHash = clientName + (arrivalDate || '');
      const hash = strToHash.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

      const shuffled = [...combined].sort((a, b) => {
        const hA = (a + hash).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const hB = (b + hash).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        return (hA % 100) - (hB % 100);
      });
      return shuffled.slice(0, 4);
    }, [itinerary, clientName, arrivalDate]);

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
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body { 
              background: white !important; 
              margin: 0 !important; 
              padding: 0 !important; 
            }
            .print-page-break { 
              page-break-after: always; 
              break-after: page;
              padding-top: 12mm !important;
            }
            .print-avoid-break { 
              page-break-inside: avoid; 
              break-inside: avoid;
            }
            .print-header-spacer { 
              height: 18mm !important; 
            }
            .print-footer-spacer { 
              height: 15mm !important; 
            }
          }
        `}} />

        {/* 1. COVER PAGE - Premium Emerald and Gold Theme with Background Images */}
        <div
          className="print-page-break flex flex-col items-center justify-between p-12 box-border relative overflow-hidden"
          style={{
            height: "297mm",
            backgroundColor: "#0A251D",
            color: "#FFFFFF",
            padding: "30mm 20mm"
          }}
        >
          {/* Background Activity Image Grid */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr",
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 1
            }}
          >
            {coverImages.map((imgSrc, idx) => (
              <div
                key={idx}
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  overflow: "hidden",
                  border: "0.5px solid rgba(212, 175, 55, 0.25)"
                }}
              >
                <img
                  src={imgSrc}
                  alt="Sri Lanka Activity"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    filter: "brightness(0.75) contrast(1.1)"
                  }}
                />
              </div>
            ))}
          </div>

          {/* Luxury Soft Radial Vignette Overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "radial-gradient(circle at center, rgba(10, 37, 29, 0.35) 0%, rgba(10, 37, 29, 0.75) 100%)",
              pointerEvents: "none",
              zIndex: 2
            }}
          />

          {/* Subtle gold frames */}
          <div className="absolute inset-8 border-[0.5px] border-[#D4AF37]/35 pointer-events-none z-10"></div>
          <div className="absolute inset-[36px] border border-[#D4AF37]/10 pointer-events-none z-10"></div>

          {/* Full-width Logo Color Stripe matching exact logo color (#222f65) */}
          <div
            style={{
              position: "absolute",
              top: "29mm",
              left: 0,
              right: 0,
              height: "140px",
              backgroundColor: "#222f65",
              borderTop: "1.5px solid rgba(212, 175, 55, 0.6)",
              borderBottom: "1.5px solid rgba(212, 175, 55, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px 0",
              zIndex: 10,
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.35)",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact"
            }}
          >
            <img
              src={getAbsoluteUrl("/images/nilathra_logo-02.webp")}
              alt="Nilathra Collection"
              style={{
                height: "128px",
                width: "auto",
                maxWidth: "85%",
                objectFit: "contain"
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.insertAdjacentHTML('afterbegin', '<h1 style="font-family: serif; color: white; text-transform: uppercase; letter-spacing: 0.35em; font-size: 2.2rem; margin: 0;">NILATHRA</h1>');
              }}
            />
          </div>

          {/* Header Subtitle Area */}
          <div className="z-10 text-center flex flex-col items-center mt-52">
            <span className="text-[#D4AF37] text-[10px] tracking-[0.5em] uppercase font-light">
              The Collection
            </span>
            <div className="w-16 h-[1px] bg-[#D4AF37]/40 mt-4 mb-2"></div>
          </div>

          {/* Central Title Block */}
          <div className="z-10 text-center flex flex-col items-center my-auto space-y-8 max-w-lg">
            <span className="text-[#D4AF37] text-[10px] tracking-[0.4em] uppercase font-semibold">
              Curated Private Journey Proposal
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
                <div className="print-footer-spacer flex items-end justify-between px-8 pb-4 text-[8px] uppercase tracking-[0.2em] text-[#9CA3AF] font-sans">
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
                <div className="print-page-break w-full px-8 py-6 box-border">
                  <div className="text-center mb-12">
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

                {/* 3. TRIP BLUEPRINT & WHAT YOUR TRIP INCLUDES OVERVIEW */}
                <div className="print-page-break w-full px-8 py-6 box-border">
                  <div className="text-center mb-6">
                    <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] block mb-1">The Blueprint</span>
                    <h3 className="text-3xl font-serif text-[#111827] font-light italic">Journey Details & Inclusions</h3>
                  </div>

                  <div className="space-y-6">
                    {/* Journey Details Summary Grid */}
                    <div className="bg-[#FAF9F6] border border-[#EBE6DC] rounded-2xl p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-6">

                        <div className="border-l-[1.5px] border-[#D4AF37] pl-4">
                          <span className="text-[8px] font-sans uppercase tracking-[0.2em] text-neutral-400 block mb-1">Party Details</span>
                          <span className="font-serif text-base text-neutral-800 font-medium">
                            {adults} Adults {children > 0 ? `• ${children} Children` : ''} {infants > 0 ? `• ${infants} Infants` : ''} ({totalPax} Pax)
                          </span>
                        </div>

                        <div className="border-l-[1.5px] border-[#D4AF37] pl-4">
                          <span className="text-[8px] font-sans uppercase tracking-[0.2em] text-neutral-400 block mb-1">Duration</span>
                          <span className="font-serif text-base text-neutral-800 font-medium">
                            {durationDays} Days / {durationDays > 1 ? durationDays - 1 : 1} Nights
                          </span>
                        </div>

                        <div className="border-l-[1.5px] border-[#D4AF37] pl-4">
                          <span className="text-[8px] font-sans uppercase tracking-[0.2em] text-neutral-400 block mb-1">Style & Character</span>
                          <span className="font-serif text-base text-neutral-800 font-medium">
                            {travelStyle} Travel Tier
                          </span>
                        </div>

                        <div className="border-l-[1.5px] border-[#D4AF37] pl-4">
                          <span className="text-[8px] font-sans uppercase tracking-[0.2em] text-neutral-400 block mb-1">Travel Window</span>
                          <span className="font-serif text-base text-neutral-800 font-medium">
                            {arrivalDate ? `${new Date(arrivalDate).toLocaleDateString()} to ${new Date(departureDate).toLocaleDateString()}` : 'Dates to be confirmed'}
                          </span>
                        </div>

                        <div className="border-l-[1.5px] border-[#D4AF37] pl-4">
                          <span className="text-[8px] font-sans uppercase tracking-[0.2em] text-neutral-400 block mb-1">Chauffeur & Guide Service</span>
                          <span className="font-serif text-base text-neutral-700 font-medium">
                            {chauffeurNeeded ? '✓ Private Vehicle & Licensed Chauffeur ' : ''}
                            {guideNeeded ? '• ✓ National Tour Guide ' : ''}
                            {!guideNeeded && !chauffeurNeeded ? 'Standard Package' : ''}
                          </span>
                        </div>

                        <div className="border-l-[1.5px] border-[#D4AF37] pl-4">
                          <span className="text-[8px] font-sans uppercase tracking-[0.2em] text-neutral-400 block mb-1">Accommodations Requested</span>
                          <span className="font-serif text-base text-neutral-700 font-medium">
                            {[
                              singleRoomsCount > 0 ? `${singleRoomsCount} Single` : null,
                              doubleRoomsCount > 0 ? `${doubleRoomsCount} Double` : null,
                              tripleRoomsCount > 0 ? `${tripleRoomsCount} Triple` : null,
                              familyRoomsCount > 0 ? `${familyRoomsCount} Family` : null,
                            ].filter(Boolean).join(', ') || 'Bespoke Selection'}
                          </span>
                        </div>

                      </div>

                      <div className="h-[0.5px] bg-[#E8DFD1] w-full"></div>

                      {/* Quick Stats Grid */}
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <span className="font-serif text-3xl text-neutral-800 block font-light">{destinations.size}</span>
                          <span className="text-[8px] font-sans uppercase tracking-[0.2em] text-neutral-400">Destinations Visited</span>
                        </div>
                        <div>
                          <span className="font-serif text-3xl text-neutral-800 block font-light">{activityCount}</span>
                          <span className="text-[8px] font-sans uppercase tracking-[0.2em] text-neutral-400">Curated Activities</span>
                        </div>
                        <div>
                          <span className="font-serif text-3xl text-neutral-800 block font-light">{totalDistance > 0 ? `${Math.round(totalDistance)} km` : 'TBD'}</span>
                          <span className="text-[8px] font-sans uppercase tracking-[0.2em] text-neutral-400">Estimated Road Travel</span>
                        </div>
                      </div>
                    </div>

                    {/* What Your Package Includes & Excludes */}
                    <div className="bg-[#FAF9F6] border border-[#EBE6DC] rounded-2xl p-6 space-y-4">
                      <div className="text-center">
                        <span className="text-[9px] font-sans uppercase tracking-[0.25em] text-[#8C6D3F] font-bold block mb-1">
                          Transparency & Value Promise
                        </span>
                        <h4 className="text-xl font-serif text-[#111827] italic">What Your Package Includes</h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs font-sans text-neutral-700 pt-2">
                        {/* Included Column */}
                        <div className="bg-white p-5 rounded-xl border border-[#E8DFD1] space-y-3">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[#0A251D] block border-b border-neutral-100 pb-2">
                            ✓ All-Inclusive Amenities Covered
                          </span>
                          <ul className="space-y-2.5 text-[11px] leading-relaxed text-neutral-600">
                            <li className="flex items-start gap-2">
                              <span className="text-[#D4AF37] font-bold">✓</span>
                              <span><strong>Bespoke Accommodations:</strong> {(() => {
                                const planLabels: Record<string, string> = {
                                  RO: 'Room Only',
                                  BB: 'Bed & Breakfast',
                                  HB: 'Half-Board (Breakfast & Dinner)',
                                  FB: 'Full-Board (Breakfast, Lunch & Dinner)',
                                  AI: 'All-Inclusive'
                                };
                                const counts: Record<string, number> = {};
                                const seenDays = new Set<number>();
                                itinerary.forEach(b => {
                                  if (b.type !== ItineraryBlockTypes.SLEEP || seenDays.has(b.dayNumber)) return;
                                  seenDays.add(b.dayNumber);
                                  const raw = String(b.mealPlan || '').trim().toUpperCase();
                                  const plan = planLabels[raw] ? raw : 'RO';
                                  counts[plan] = (counts[plan] || 0) + 1;
                                });
                                const parts = ['BB', 'HB', 'FB', 'AI', 'RO']
                                  .filter(p => counts[p])
                                  .map(p => `${counts[p]} night${counts[p] > 1 ? 's' : ''} on ${planLabels[p]} basis`);
                                return parts.length > 0
                                  ? `Luxury stay sanctuaries — ${parts.join('; ')}.`
                                  : 'Luxury stay sanctuaries as per your itinerary.';
                              })()}</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-[#D4AF37] font-bold">✓</span>
                              <span><strong>Private Luxury Vehicle:</strong> Dedicated air-conditioned executive transport with unlimited tour mileage.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-[#D4AF37] font-bold">✓</span>
                              <span><strong>Licensed Chauffeur:</strong> Tourist Board certified English-speaking chauffeur (all meals, lodging & allowances included).</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-[#D4AF37] font-bold">✓</span>
                              <span><strong>Transit Logistics & Tolls:</strong> Express highway toll fees, fuel costs, and airport parking fees.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-[#D4AF37] font-bold">✓</span>
                              <span><strong>Sightseeing & Activities:</strong> Scheduled entrance tickets, safari jeeps, and guided experiences.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-[#D4AF37] font-bold">✓</span>
                              <span><strong>24/7 Nilathra Concierge:</strong> Airport assistance, bottled water, transfer refreshments & local concierge hotline.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-[#D4AF37] font-bold">✓</span>
                              <span><strong>Taxes & Charges:</strong> All Sri Lankan government taxes, service charges & levies.</span>
                            </li>
                          </ul>
                        </div>

                        {/* Excluded Column */}
                        <div className="bg-white p-5 rounded-xl border border-[#E8DFD1] space-y-3">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C6D3F] block border-b border-neutral-100 pb-2">
                            ✕ Exclusions & Personal Expense
                          </span>
                          <ul className="space-y-2.5 text-[11px] leading-relaxed text-neutral-600">
                            <li className="flex items-start gap-2">
                              <span className="text-neutral-400">✕</span>
                              <span><strong>International Flights:</strong> International air tickets to/from Sri Lanka (quoted separately upon request).</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-neutral-400">✕</span>
                              <span><strong>Visa Entry Fees:</strong> Sri Lanka Electronic Travel Authorization (ETA) visa fees.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-neutral-400">✕</span>
                              <span><strong>Unspecified Lunches & Beverages:</strong> Lunches on leisure days and alcoholic beverages unless specified.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-neutral-400">✕</span>
                              <span><strong>Optional Gratuities:</strong> Tipping for chauffeur, national guide, hotel staff, and safari drivers.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-neutral-400">✕</span>
                              <span><strong>Personal Expenses:</strong> Souvenirs, laundry, phone calls, and travel insurance.</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3.2 SEASONAL WEATHER & ACTIVITY GUIDE */}
                {(() => {
                  const weatherReport = WeatherService.generateWeatherReport(arrivalDate, departureDate, itinerary, masterData);

                  if (!weatherReport.items || weatherReport.items.length === 0) return null;

                  const renderStarRating = (rating: number) => {
                    if (rating <= 0) return <span className="text-neutral-300 font-mono text-xs">—</span>;
                    const fullStars = Math.floor(rating);
                    const hasHalf = rating % 1 !== 0;

                    return (
                      <div className="inline-flex items-center gap-0.5 text-[#D4AF37] font-sans text-xs">
                        {Array.from({ length: fullStars }).map((_, i) => (
                          <span key={`full-${i}`}>★</span>
                        ))}
                        {hasHalf && <span key="half" className="text-[10px] font-bold">½★</span>}
                      </div>
                    );
                  };

                  return (
                    <div className="print-page-break w-full px-8 py-6 box-border">
                      <div className="text-center mb-6">
                        <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] block mb-1">Seasonal Advisory</span>
                        <h3 className="text-2xl font-serif text-[#111827] font-light italic">Weather & Activity Suitability</h3>
                        <span className="text-[10px] font-sans font-bold text-[#8C6D3F] uppercase tracking-widest mt-1 block">
                          {weatherReport.periodLabel}
                        </span>
                      </div>

                      <div className="bg-[#FAF9F6] border border-[#EBE6DC] rounded-2xl p-6 space-y-4">
                        <div className="bg-white rounded-xl border border-[#E8DFD1] overflow-hidden shadow-sm">
                          <div className="bg-[#FAF8F5] border-b border-[#E8DFD1] px-5 py-3 grid grid-cols-12 text-[9px] font-sans uppercase tracking-widest text-[#8C6D3F] font-bold text-left">
                            <span className="col-span-3">Location</span>
                            <span className="col-span-2">Swimming</span>
                            <span className="col-span-2">Snorkelling / Outdoor</span>
                            <span className="col-span-2">{weatherReport.monthName} Weather</span>
                            <span className="col-span-3 text-right pr-2">Overall for Your Trip</span>
                          </div>

                          <div className="divide-y divide-neutral-100">
                            {weatherReport.items.map((item, idx) => (
                              <div key={idx} className="px-5 py-3.5 grid grid-cols-12 items-center text-left hover:bg-neutral-50/50 transition-colors text-xs">
                                <div className="col-span-3 space-y-0.5">
                                  <span className="font-serif font-bold text-sm text-[#111827] block">{item.location}</span>
                                  <span className="text-[8.5px] font-sans uppercase tracking-wider font-semibold text-[#8C6D3F]">
                                    {item.category === 'seaside' ? 'Seaside Coastal' : 'Inland / Highlands'}
                                  </span>
                                </div>

                                <div className="col-span-2">
                                  {item.category === 'seaside' ? renderStarRating(item.swimmingRating) : <span className="text-neutral-300 font-mono text-xs">—</span>}
                                </div>

                                <div className="col-span-2">
                                  {renderStarRating(item.activityRating)}
                                </div>

                                <div className="col-span-2">
                                  {renderStarRating(item.weatherReliabilityRating)}
                                </div>

                                <div className="col-span-3 text-right pr-2 text-[10.5px] font-serif font-medium text-neutral-700 leading-snug">
                                  {item.overallTripAdvice}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-[#FAF8F5] border border-[#E8DFD1] p-3.5 rounded-xl text-left flex items-center justify-between text-[10px] text-[#8C6D3F] font-medium">
                          <span>* Ratings reflect historical seasonal averages and monsoon transition cycles for Sri Lanka.</span>
                          <span className="font-bold">Nilathra Bespoke Seasonal Advisory</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 3.3 SRI LANKA ROUTE MAP & DESTINATION SEQUENCE */}
                {(() => {
                  const SRI_LANKA_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
                    'colombo': { lat: 6.9271, lng: 79.8612 },
                    'negombo': { lat: 7.1895, lng: 79.8897 },
                    'katunayake': { lat: 7.1800, lng: 79.8841 },
                    'bandaranaike': { lat: 7.1800, lng: 79.8841 },
                    'kandy': { lat: 7.2906, lng: 80.6337 },
                    'nuwara eliya': { lat: 6.9497, lng: 80.7891 },
                    'sigiriya': { lat: 7.9570, lng: 80.7603 },
                    'dambulla': { lat: 7.8742, lng: 80.6511 },
                    'anuradhapura': { lat: 8.3114, lng: 80.4037 },
                    'polonnaruwa': { lat: 7.9403, lng: 81.0188 },
                    'galle': { lat: 6.0535, lng: 80.2210 },
                    'bentota': { lat: 6.4255, lng: 79.9972 },
                    'beruwala': { lat: 6.4788, lng: 79.9828 },
                    'wadduwa': { lat: 6.6667, lng: 79.9333 },
                    'hikkaduwa': { lat: 6.1394, lng: 80.1063 },
                    'weligama': { lat: 5.9722, lng: 80.4286 },
                    'mirissa': { lat: 5.9483, lng: 80.4578 },
                    'tangalle': { lat: 6.0243, lng: 80.7941 },
                    'hambantota': { lat: 6.1241, lng: 81.1185 },
                    'yala': { lat: 6.3300, lng: 81.5200 },
                    'tissamaharama': { lat: 6.2843, lng: 81.3320 },
                    'kataragama': { lat: 6.4133, lng: 81.3344 },
                    'ella': { lat: 6.8667, lng: 81.0466 },
                    'badulla': { lat: 6.9934, lng: 81.0550 },
                    'hatton': { lat: 6.8919, lng: 80.5969 },
                    'dickoya': { lat: 6.8667, lng: 80.6000 },
                    'trincomalee': { lat: 8.5874, lng: 81.2152 },
                    'pasikuda': { lat: 7.9252, lng: 81.5623 },
                    'batticaloa': { lat: 7.7170, lng: 81.7000 },
                    'arugam bay': { lat: 6.8417, lng: 81.8333 },
                    'jaffna': { lat: 9.6615, lng: 80.0255 },
                    'udawalawe': { lat: 6.4402, lng: 80.8872 },
                    'wilpattu': { lat: 8.4485, lng: 80.0076 },
                    'kitulgala': { lat: 6.9986, lng: 80.4208 },
                    'kalpitiya': { lat: 8.2325, lng: 79.7644 },
                    'habarana': { lat: 8.0347, lng: 80.7516 },
                    'minneriya': { lat: 8.0333, lng: 80.9000 },
                    'kaudulla': { lat: 8.1333, lng: 80.9167 },
                    'ratnapura': { lat: 6.6828, lng: 80.3992 },
                    'belihuloya': { lat: 6.7167, lng: 80.7667 }
                  };

                  const getHubCityName = (locStr: string, hotelStr?: string): string => {
                    const combined = `${locStr || ''} ${hotelStr || ''}`.toLowerCase();
                    for (const cityKey of Object.keys(SRI_LANKA_CITY_COORDS)) {
                      if (combined.includes(cityKey)) {
                        return cityKey.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                      }
                    }
                    const clean = (locStr || hotelStr || 'Sri Lanka').split('-')[0].split(',')[0].trim();
                    return clean || 'Sri Lanka';
                  };

                  const resolveLocationCoords = (cityName: string): { lat: number; lng: number } => {
                    const clean = cityName.toLowerCase().trim();
                    for (const [key, coords] of Object.entries(SRI_LANKA_CITY_COORDS)) {
                      if (clean.includes(key) || key.includes(clean)) {
                        return coords;
                      }
                    }
                    return { lat: 7.0, lng: 80.2 };
                  };

                  const projectToMap = (lat: number, lng: number): { x: number; y: number } => {
                    const minLat = 5.85;
                    const maxLat = 9.85;
                    const minLng = 79.60;
                    const maxLng = 81.95;

                    const minX = 115;
                    const maxX = 295;
                    const minY = 55;
                    const maxY = 435;

                    const x = minX + ((lng - minLng) / (maxLng - minLng)) * (maxX - minX);
                    const y = maxY - ((lat - minLat) / (maxLat - minLat)) * (maxY - minY);
                    return { x: Math.round(x), y: Math.round(y) };
                  };

                  const dailyBreakdown: Array<{
                    dayNum: number;
                    shortDate: string;
                    fullDate: string;
                    cityName: string;
                    locationName: string;
                    hotelName: string;
                    coords: { lat: number; lng: number };
                    mapXY: { x: number; y: number };
                    activitiesCount: number;
                  }> = [];

                  for (let d = 1; d <= durationDays; d++) {
                    const dayBlocks = itinerary.filter(b => b.dayNumber === d);
                    const sleepBlock = dayBlocks.find(b => b.type === ItineraryBlockTypes.SLEEP);
                    const accObj = accommodations?.find((a: any) => Number(a.nightIndex) === Number(d));

                    const locBlock = sleepBlock || dayBlocks.find(b => b.locationName && !b.locationName.toLowerCase().includes('travel') && !b.locationName.toLowerCase().includes('transfer')) || dayBlocks[0];

                    const rawLoc = locBlock?.locationName || sleepBlock?.locationName || accObj?.address || '';
                    const hotelName = sleepBlock?.hotelName || accObj?.hotelName || '';
                    const cityName = getHubCityName(rawLoc, hotelName);
                    const coords = resolveLocationCoords(cityName);
                    const mapXY = projectToMap(coords.lat, coords.lng);

                    dailyBreakdown.push({
                      dayNum: d,
                      shortDate: getShortFormattedDate(d),
                      fullDate: getLongFormattedDate(d),
                      cityName,
                      locationName: rawLoc || cityName,
                      hotelName,
                      coords,
                      mapXY,
                      activitiesCount: dayBlocks.filter(b => b.type === ItineraryBlockTypes.ACTIVITY).length
                    });
                  }

                  const cityStopsMap = new Map<string, {
                    name: string;
                    startDay: number;
                    endDay: number;
                    coords: { lat: number; lng: number };
                    mapXY: { x: number; y: number };
                    days: Array<{ dayNum: number; shortDate: string; fullDate: string; hotelName: string }>;
                    hotelName: string;
                  }>();

                  dailyBreakdown.forEach(dayObj => {
                    const cityKey = `${dayObj.coords.lat.toFixed(2)},${dayObj.coords.lng.toFixed(2)}`;
                    if (cityStopsMap.has(cityKey)) {
                      const existing = cityStopsMap.get(cityKey)!;
                      existing.startDay = Math.min(existing.startDay, dayObj.dayNum);
                      existing.endDay = Math.max(existing.endDay, dayObj.dayNum);
                      existing.days.push({
                        dayNum: dayObj.dayNum,
                        shortDate: dayObj.shortDate,
                        fullDate: dayObj.fullDate,
                        hotelName: dayObj.hotelName
                      });
                      if (dayObj.hotelName && !existing.hotelName) {
                        existing.hotelName = dayObj.hotelName;
                      }
                    } else {
                      cityStopsMap.set(cityKey, {
                        name: dayObj.cityName,
                        startDay: dayObj.dayNum,
                        endDay: dayObj.dayNum,
                        coords: dayObj.coords,
                        mapXY: dayObj.mapXY,
                        days: [{
                          dayNum: dayObj.dayNum,
                          shortDate: dayObj.shortDate,
                          fullDate: dayObj.fullDate,
                          hotelName: dayObj.hotelName
                        }],
                        hotelName: dayObj.hotelName
                      });
                    }
                  });

                  const locationStops = Array.from(cityStopsMap.values()).sort((a, b) => a.startDay - b.startDay);
                  if (locationStops.length === 0) return null;

                  const usedLeftY: number[] = [];
                  const usedRightY: number[] = [];

                  return (
                    <div className="print-page-break w-full px-8 py-6 box-border">
                      <div className="text-center mb-6">
                        <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] block mb-1">Spatial Blueprint</span>
                        <h3 className="text-2xl font-serif text-[#111827] font-light italic">Route Map & Destination Sequence</h3>
                      </div>

                      <div className="bg-[#FAF9F6] border border-[#EBE6DC] rounded-2xl p-6 space-y-6">
                        <div className="w-full bg-white rounded-xl border border-[#E8DFD1] p-6 flex flex-col items-center justify-center relative shadow-sm min-h-[640px]">
                          <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#8C6D3F] font-bold block mb-4 text-center">
                            Sri Lanka Private Tour Route • {locationStops.length} Destination Hubs ({durationDays} Days / {durationDays > 1 ? durationDays - 1 : 1} Nights)
                          </span>

                          <svg
                            viewBox="0 0 380 480"
                            className="w-full h-auto max-h-[600px] drop-shadow-sm"
                            style={{ overflow: 'visible' }}
                          >
                            <defs>
                              <linearGradient id="sriLankaBg" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#F5F2EA" />
                                <stop offset="100%" stopColor="#EBE5D8" />
                              </linearGradient>
                            </defs>

                            {/* Stylized Vector Path of Sri Lanka Silhouette */}
                            <path
                              d="M 162,52 C 170,48 185,50 194,58 C 202,66 206,76 200,88 C 194,98 178,104 173,115 C 168,126 170,136 166,148 C 160,164 142,175 132,190 C 122,205 118,225 114,245 C 110,265 108,285 106,305 C 104,325 103,345 102,360 C 101,375 102,390 106,405 C 112,420 122,432 135,442 C 148,452 165,458 185,460 C 205,461 225,458 245,451 C 262,444 276,430 288,412 C 298,396 304,375 305,354 C 306,333 302,312 298,292 C 294,272 292,252 290,232 C 287,212 281,192 272,173 C 264,154 253,136 238,121 C 226,107 212,93 202,78 C 192,65 178,55 162,52 Z"
                              fill="url(#sriLankaBg)"
                              stroke="#D4AF37"
                              strokeWidth="1.5"
                              strokeLinejoin="round"
                            />

                            <circle cx="190" cy="250" r="190" stroke="#D4AF37" strokeWidth="0.5" strokeDasharray="2,4" fill="none" opacity="0.2" />
                            <circle cx="190" cy="250" r="130" stroke="#D4AF37" strokeWidth="0.5" strokeDasharray="2,4" fill="none" opacity="0.15" />

                            {locationStops.map((stop, sIdx) => {
                              const isWest = stop.mapXY.x < 180;

                              const dayPillWidth = 48;
                              const boxWidth = Math.max(115, stop.days.length * dayPillWidth + 12);
                              const boxHeight = stop.hotelName ? 42 : 28;

                              let calloutX = isWest ? Math.max(8, stop.mapXY.x - boxWidth - 25) : Math.min(372 - boxWidth, stop.mapXY.x + 25);
                              let calloutY = stop.mapXY.y;

                              const yList = isWest ? usedLeftY : usedRightY;
                              while (yList.some(y => Math.abs(y - calloutY) < 44)) {
                                calloutY += 46;
                              }
                              yList.push(calloutY);

                              const leaderStartX = isWest ? calloutX + boxWidth : calloutX;
                              const leaderStartY = calloutY;

                              return (
                                <g key={sIdx}>
                                  <line
                                    x1={leaderStartX}
                                    y1={leaderStartY}
                                    x2={stop.mapXY.x}
                                    y2={stop.mapXY.y}
                                    stroke="#D4AF37"
                                    strokeWidth="1.2"
                                    strokeDasharray="3,3"
                                    opacity="0.9"
                                  />

                                  <circle cx={stop.mapXY.x} cy={stop.mapXY.y} r="6" fill="#0A251D" stroke="#D4AF37" strokeWidth="1.5" />
                                  <circle cx={stop.mapXY.x} cy={stop.mapXY.y} r="2.5" fill="#D4AF37" />

                                  <rect
                                    x={calloutX}
                                    y={calloutY - 16}
                                    width={boxWidth}
                                    height={boxHeight}
                                    rx="5"
                                    ry="5"
                                    fill="#FFFFFF"
                                    stroke="#D4AF37"
                                    strokeWidth="1"
                                    style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.08))" }}
                                  />

                                  <text
                                    x={calloutX + 6}
                                    y={calloutY - 5}
                                    fill="#0A251D"
                                    fontSize="8.5"
                                    fontWeight="bold"
                                    fontFamily="serif"
                                  >
                                    {stop.name}
                                  </text>

                                  {stop.days.map((dayObj, dIdx) => (
                                    <g key={dIdx} transform={`translate(${calloutX + 6 + dIdx * dayPillWidth}, ${calloutY + 1})`}>
                                      <rect x="0" y="0" width="44" height="12" rx="3" fill="#0A251D" stroke="#D4AF37" strokeWidth="0.5" />
                                      <text x="22" y="8.5" fill="#FFFFFF" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                                        D{dayObj.dayNum} • {dayObj.shortDate}
                                      </text>
                                    </g>
                                  ))}

                                  {stop.hotelName && (
                                    <text
                                      x={calloutX + 6}
                                      y={calloutY + 22}
                                      fill="#4B5563"
                                      fontSize="6.5"
                                      fontFamily="sans-serif"
                                    >
                                      🏨 {stop.hotelName.length > 22 ? stop.hotelName.substring(0, 20) + '…' : stop.hotelName}
                                    </text>
                                  )}
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 3.4 ACCOMMODATIONS PORTFOLIO */}
                {(() => {
                  const SLEEP_ITEMS_PER_PAGE = 9;
                  const sleepBlocks = itinerary.filter(b => b.type === ItineraryBlockTypes.SLEEP).sort((a, b) => a.dayNumber - b.dayNumber);
                  const sleepChunks: any[][] = [];

                  if (sleepBlocks.length > 0) {
                    for (let i = 0; i < sleepBlocks.length; i += SLEEP_ITEMS_PER_PAGE) {
                      sleepChunks.push(sleepBlocks.slice(i, i + SLEEP_ITEMS_PER_PAGE));
                    }
                  } else {
                    sleepChunks.push([]);
                  }

                  return sleepChunks.map((chunk, chunkIdx) => (
                    <div key={`sleep-chunk-page-${chunkIdx}`} className="print-page-break w-full px-8 py-6 box-border">
                      <div className="text-center mb-6">
                        <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] block mb-1">Accommodations</span>
                        <h3 className="text-2xl font-serif text-[#111827] font-light italic">
                          Stay Sanctuaries & Accommodations {sleepChunks.length > 1 ? `(Page ${chunkIdx + 1} of ${sleepChunks.length})` : ''}
                        </h3>
                      </div>

                      <div className="bg-[#FAF9F6] border border-[#EBE6DC] rounded-2xl p-6 space-y-4">
                        <div className="text-center max-w-lg mx-auto mb-1">
                          <span className="text-[9px] font-sans uppercase tracking-[0.25em] text-[#8C6D3F] font-bold block mb-0.5">
                            Curated Hotel Portfolio
                          </span>
                          <p className="text-xs text-neutral-500 font-serif italic">
                            Hand-selected luxury accommodations and room arrangements for {clientName}.
                          </p>
                        </div>

                        <div className="bg-white rounded-xl border border-[#E8DFD1] overflow-hidden shadow-sm">
                          <div className="bg-[#FAF8F5] border-b border-[#E8DFD1] px-5 py-2.5 grid grid-cols-12 text-[9px] font-sans uppercase tracking-widest text-[#8C6D3F] font-bold text-left">
                            <span className="col-span-3">Night & Date</span>
                            <span className="col-span-4">Hotel Sanctuary</span>
                            <span className="col-span-2">Star Tier</span>
                            <span className="col-span-3 text-right pr-2">Meal Plan</span>
                          </div>

                          <div className="divide-y divide-neutral-100">
                            {chunk.length === 0 ? (
                              <div className="p-6 text-center text-xs text-neutral-400 font-serif italic">
                                Accommodations are currently being finalized.
                              </div>
                            ) : (
                              chunk.map((block, idx) => {
                                const hotelDetail = masterData?.hotels
                                  ? masterData.hotels.find((x: any) =>
                                    (block.hotelId && x.id === block.hotelId) ||
                                    (block.hotelName && x.name?.toLowerCase() === block.hotelName.toLowerCase()) ||
                                    (block.name && x.name?.toLowerCase() === block.name.toLowerCase())
                                  )
                                  : null;

                                const hName = block.hotelName || block.name || hotelDetail?.name || 'Bespoke Selection';
                                const starClass = hotelDetail?.hotel_class || hotelDetail?.star_rating || (travelStyle === 'Ultra VIP' ? '5 Star Super Luxury' : '5 Star Luxury');
                                const mealPlan = block.mealPlan || 'HB (Half Board)';
                                const dateFormatted = getShortFormattedDate(block.dayNumber);

                                return (
                                  <div key={idx} className="px-5 py-3 hover:bg-neutral-50/50 transition-colors text-xs border-b border-neutral-100 last:border-b-0 space-y-2">
                                    <div className="grid grid-cols-12 items-center text-left">
                                      <div className="col-span-3 space-y-0.5">
                                        <span className="font-bold text-[#111827] block">Night {String(block.dayNumber).padStart(2, '0')}</span>
                                        <span className="text-[10px] text-neutral-500 font-sans block">{dateFormatted !== `Day ${block.dayNumber}` ? dateFormatted : `Day ${block.dayNumber}`}</span>
                                      </div>

                                      <div className="col-span-4 space-y-0.5">
                                        <span className="font-serif font-bold text-sm text-[#111827] block">{hName}</span>
                                        {block.locationName && (
                                          <span className="text-[9px] text-[#8C6D3F] uppercase tracking-wider font-semibold block">{block.locationName}</span>
                                        )}
                                      </div>

                                      <div className="col-span-2">
                                        <span className="text-[10px] font-sans font-semibold text-[#8C6D3F] bg-[#FAF8F5] border border-[#E8DFD1] px-2 py-0.5 rounded inline-block">
                                          {starClass}
                                        </span>
                                      </div>

                                      <div className="col-span-3 text-right pr-2">
                                        <span className="font-mono font-bold text-neutral-800 bg-neutral-100 px-2.5 py-1 rounded text-xs inline-block">
                                          {mealPlan}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Room Options Breakdown */}
                                    {(() => {
                                      const acc = accommodations?.find((a: any) => Number(a.nightIndex) === Number(block.dayNumber));
                                      const selectedRooms = acc?.selectedRooms || (block as any).selectedRooms || [];

                                      let roomRows: Array<{ category: string; mealPlan: string; qty: number }> = [];

                                      if (selectedRooms.length > 0) {
                                        roomRows = selectedRooms.map((sr: any) => ({
                                          category: [sr.reqId, sr.roomName].filter(Boolean).join(' - ') || 'Standard Room',
                                          mealPlan: sr.mealPlan || acc?.mealPlan || block.mealPlan || mealPlan || 'HB',
                                          qty: sr.quantity || 1,
                                        }));
                                      } else {
                                        if (singleRoomsCount > 0) roomRows.push({ category: 'Single Room', mealPlan: mealPlan, qty: singleRoomsCount });
                                        if (doubleRoomsCount > 0) roomRows.push({ category: 'Double Room', mealPlan: mealPlan, qty: doubleRoomsCount });
                                        if (tripleRoomsCount > 0) roomRows.push({ category: 'Triple Room', mealPlan: mealPlan, qty: tripleRoomsCount });
                                        if (familyRoomsCount > 0) roomRows.push({ category: 'Family Room', mealPlan: mealPlan, qty: familyRoomsCount });
                                        if (roomRows.length === 0 && block.roomName) {
                                          roomRows.push({ category: block.roomName, mealPlan: mealPlan, qty: 1 });
                                        }
                                      }

                                      if (roomRows.length === 0) return null;

                                      return (
                                        <div className="bg-[#FAF8F5] rounded-lg border border-[#E8DFD1] p-2 text-[9.5px] font-sans">
                                          <div className="grid grid-cols-12 gap-2 uppercase tracking-wider font-bold text-[#8C6D3F] text-[8px] border-b border-[#E8DFD1] pb-1 mb-1">
                                            <span className="col-span-5">Room Category / Type</span>
                                            <span className="col-span-3 text-center">Meal Plan</span>
                                            <span className="col-span-4 text-right pr-2">Rooms Assigned</span>
                                          </div>
                                          <div className="divide-y divide-[#E8DFD1]/50">
                                            {roomRows.map((r, rIdx) => (
                                              <div key={rIdx} className="grid grid-cols-12 gap-2 items-center py-1 text-neutral-800">
                                                <span className="col-span-5 font-semibold text-neutral-900">{r.category}</span>
                                                <span className="col-span-3 text-center font-mono font-bold text-emerald-855 bg-emerald-50 border border-emerald-200/60 rounded py-0.5 px-1 inline-block mx-auto text-[8.5px]">{r.mealPlan}</span>
                                                <span className="col-span-4 text-right pr-2 font-medium">{r.qty} {r.qty > 1 ? 'Rooms' : 'Room'}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ));
                })()}

                {/* 3.4.5 CURATED EXPERIENCES & ACTIVITIES PORTFOLIO */}
                {(() => {
                  const getActivityImage = (block: any) => {
                    if (block.imageUrl && block.imageUrl !== 'none' && block.imageUrl.trim() !== '') {
                      return block.imageUrl;
                    }
                    const resolvedActId = block.activityId;
                    const v = block.vendorId ? masterData?.vendors?.find((x: any) => x.id === block.vendorId) : null;
                    const va = v?.vendor_activities?.find((x: any) => x.id === block.vendorActivityId) ||
                      (resolvedActId ? v?.vendor_activities?.find((x: any) => Number(x.activity_id) === Number(resolvedActId)) : null);
                    const activityDetail = masterData?.activities?.find((a: any) => Number(a.id) === Number(resolvedActId || va?.activity_id)) ||
                      dbActivities?.find((a: any) => Number(a.id) === Number(resolvedActId || va?.activity_id));

                    const img = activityDetail?.image_url || activityDetail?.imageUrl || activityDetail?.image || va?.image_url || va?.imageUrl;
                    if (img && img !== 'none' && img.trim() !== '') {
                      return img;
                    }
                    return null;
                  };

                  const ACTIVITY_ITEMS_PER_PAGE = 10;
                  const activityBlocks = itinerary
                    .filter(b => {
                      if (b.type !== ItineraryBlockTypes.ACTIVITY && String(b.type).toUpperCase() !== 'ACTIVITY') return false;
                      const hasImage = Boolean(getActivityImage(b));
                      const isBound = Boolean(b.activityId) || Boolean(b.vendorActivityId) || Boolean(b.vendorId);
                      return hasImage || isBound;
                    })
                    .sort((a, b) => a.dayNumber - b.dayNumber);

                  const activityChunks: any[][] = [];
                  if (activityBlocks.length > 0) {
                    for (let i = 0; i < activityBlocks.length; i += ACTIVITY_ITEMS_PER_PAGE) {
                      activityChunks.push(activityBlocks.slice(i, i + ACTIVITY_ITEMS_PER_PAGE));
                    }
                  } else {
                    activityChunks.push([]);
                  }

                  return activityChunks.map((chunk, chunkIdx) => (
                    <div key={`act-chunk-page-${chunkIdx}`} className="print-page-break w-full px-8 py-6 box-border">
                      <div className="text-center mb-6">
                        <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] block mb-1">Excursions & Experiences</span>
                        <h3 className="text-2xl font-serif text-[#111827] font-light italic">
                          Curated Activities Portfolio {activityChunks.length > 1 ? `(Page ${chunkIdx + 1} of ${activityChunks.length})` : ''}
                        </h3>
                      </div>

                      <div className="bg-[#FAF9F6] border border-[#EBE6DC] rounded-2xl p-6 space-y-4">
                        <div className="text-center max-w-lg mx-auto mb-1">
                          <span className="text-[9px] font-sans uppercase tracking-[0.25em] text-[#8C6D3F] font-bold block mb-0.5">
                            Excursions & Ticket Inclusions
                          </span>
                          <p className="text-xs text-neutral-500 font-serif italic">
                            Curated featured excursions, temple visits, entrance passes, safari charters, and guided experiences for {clientName}.
                          </p>
                        </div>

                        <div className="bg-white rounded-xl border border-[#E8DFD1] overflow-hidden shadow-sm">
                          <div className="bg-[#FAF8F5] border-b border-[#E8DFD1] px-5 py-2.5 grid grid-cols-12 text-[9px] font-sans uppercase tracking-widest text-[#8C6D3F] font-bold text-left">
                            <span className="col-span-2">Day & Date</span>
                            <span className="col-span-3">Location</span>
                            <span className="col-span-6">Experience / Excursion Name</span>
                            <span className="col-span-1 text-center">Included</span>
                          </div>

                          <div className="divide-y divide-neutral-100">
                            {chunk.length === 0 ? (
                              <div className="p-6 text-center text-xs text-neutral-400 font-serif italic">
                                No specific featured excursions or bound activities listed. Leisure & scenic travel days.
                              </div>
                            ) : (
                              chunk.map((block, idx) => {
                                const resolvedActId = block.activityId;
                                const v = block.vendorId ? masterData?.vendors?.find((x: any) => x.id === block.vendorId) : null;
                                const va = v?.vendor_activities?.find((x: any) => x.id === block.vendorActivityId) ||
                                  (resolvedActId ? v?.vendor_activities?.find((x: any) => Number(x.activity_id) === Number(resolvedActId)) : null);
                                const activityDetail = masterData?.activities?.find((a: any) => Number(a.id) === Number(resolvedActId || va?.activity_id)) ||
                                  dbActivities?.find((a: any) => Number(a.id) === Number(resolvedActId || va?.activity_id));

                                const actName = block.name || activityDetail?.activity_name || block.title || 'Curated Excursion';
                                const actLoc = block.locationName || activityDetail?.location_name || 'Sri Lanka';
                                const actCat = activityDetail?.category || block.category || 'Sightseeing';
                                const dateFormatted = getShortFormattedDate(block.dayNumber);

                                return (
                                  <div key={idx} className="px-5 py-3.5 hover:bg-neutral-50/50 transition-colors text-xs grid grid-cols-12 items-center text-left">
                                    <div className="col-span-2 space-y-0.5">
                                      <span className="font-bold text-[#111827] block">Day {String(block.dayNumber).padStart(2, '0')}</span>
                                      <span className="text-[10px] text-neutral-500 font-sans block">{dateFormatted !== `Day ${block.dayNumber}` ? dateFormatted : `Day ${block.dayNumber}`}</span>
                                    </div>

                                    <div className="col-span-3 space-y-0.5 pr-2">
                                      <span className="font-serif font-bold text-sm text-[#111827] block">{actLoc}</span>
                                      <span className="text-[8.5px] font-sans uppercase tracking-wider font-semibold text-[#8C6D3F] bg-[#FAF8F5] border border-[#E8DFD1] px-1.5 py-0.5 rounded inline-block">
                                        {actCat}
                                      </span>
                                    </div>

                                    <div className="col-span-6 space-y-0.5 pr-4">
                                      <span className="font-medium text-neutral-900 text-xs block font-serif">{actName}</span>
                                      {block.description && (
                                        <span className="text-[9.5px] text-neutral-500 font-serif italic block">{block.description}</span>
                                      )}
                                    </div>

                                    <div className="col-span-1 text-center">
                                      <span
                                        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 font-bold text-xs shadow-xs mx-auto"
                                        title="Included in Package"
                                      >
                                        ✓
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        <div className="bg-[#FAF8F5] border border-[#E8DFD1] p-3.5 rounded-xl text-left flex items-center justify-between text-[10px] text-[#8C6D3F] font-medium">
                          <span>* All entrance tickets, site passes, private safari jeeps, and local guides specified above are included in your luxury tour package investment.</span>
                          <span className="font-bold">Nilathra All-Inclusive Standard</span>
                        </div>
                      </div>
                    </div>
                  ));
                })()}

                {/* 3.5 PRIVATE TRANSPORT & LOGISTICS SUMMARY PAGE */}
                <div className="print-page-break w-full px-8 py-6 box-border">
                  <div className="text-center mb-6">
                    <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] block mb-1">Transport & Logistics</span>
                    <h3 className="text-3xl font-serif text-[#111827] font-light italic">Private Chauffeur & Fleet Experience</h3>
                  </div>

                  <div className="bg-[#FAF9F6] border border-[#EBE6DC] rounded-2xl p-8 space-y-6">
                    <div className="text-center max-w-lg mx-auto mb-2">
                      <span className="text-[9px] font-sans uppercase tracking-[0.25em] text-[#8C6D3F] font-bold block mb-1">
                        Private Chauffeur Fleet Services
                      </span>
                      <p className="text-xs text-neutral-500 font-serif italic">
                        Dedicated private executive vehicle, licensed tourist chauffeur, and full travel logistics for {clientName}.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Vehicle & Chauffeur Main Summary Card */}
                      <div className="bg-white p-6 rounded-xl border border-[#E8DFD1] space-y-4 shadow-sm text-left">
                        <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                          <div>
                            <span className="text-[9px] font-sans uppercase tracking-[0.25em] text-[#8C6D3F] font-bold block">Assigned Transport Class</span>
                            <h4 className="text-lg font-serif font-bold text-[#111827] mt-0.5">
                              {totalPax <= 2
                                ? 'Executive Luxury Sedan (Toyota Premier / Mercedes Class)'
                                : totalPax <= 4
                                  ? 'Luxury VIP Mini-Van (Toyota KDH Luxury VIP Edition)'
                                  : 'Luxury Executive Passenger Coach / VIP Van'}
                            </h4>
                          </div>
                          <span className="px-3 py-1 bg-emerald-50 border border-emerald-200/60 text-emerald-800 rounded-full text-[10px] font-bold font-mono">
                            Full Trip Duration ({durationDays} Days)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs font-sans text-neutral-600 pt-1">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">Vehicle Features</span>
                            <p className="text-neutral-800 font-medium">Fully Air-Conditioned, Leather Reclining Seating, High-Speed Wi-Fi Router, Extra Luggage Space.</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">Chauffeur Service</span>
                            <p className="text-neutral-800 font-medium">Tourist Board Certified, English-Speaking, Experienced in Sri Lanka Travel Routes & VIP Hospitality.</p>
                          </div>
                        </div>
                      </div>

                      {/* Inclusions Banner */}
                      <div className="bg-[#FAF8F5] border border-[#E8DFD1] p-5 rounded-xl text-left space-y-3">
                        <span className="text-[9px] font-sans uppercase tracking-[0.25em] text-[#8C6D3F] font-bold block">
                          Transport Package Inclusions
                        </span>
                        <div className="grid grid-cols-2 gap-3 text-[11px] text-neutral-700 font-medium">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                            <span>All Fuel & Unlimited Mileage for Itinerary Program</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                            <span>All Express Highway Tolls & Airport Parking Charges</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                            <span>Chauffeur Meals, Lodging & Daily Allowances Covered</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                            <span>Chilled King Coconuts & Bottled Water on Transfer Days</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3.6 FINANCIAL BLUEPRINT / ESTIMATED PACKAGE COST OVERVIEW PAGE */}
                <div className="print-page-break w-full px-8 py-6 box-border">
                  <div className="text-center mb-6">
                    <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] block mb-1">Commercial Overview</span>
                    <h3 className="text-3xl font-serif text-[#111827] font-light italic">Package Investment Summary</h3>
                  </div>

                  <div className="bg-[#FAF9F6] border border-[#EBE6DC] rounded-2xl p-8 space-y-6">
                    <div className="text-center max-w-md mx-auto mb-2">
                      <span className="text-[9px] font-sans uppercase tracking-[0.25em] text-[#8C6D3F] font-bold block mb-1">
                        Commercial Proposal
                      </span>
                      <p className="text-xs text-neutral-500 font-serif italic">
                        All-inclusive private Ceylon tour package crafted for {clientName} ({totalPax} Guest{totalPax > 1 ? 's' : ''} &bull; {durationDays} Days / {durationDays > 1 ? durationDays - 1 : 1} Nights)
                      </p>
                    </div>

                    {invoiceItems.length > 0 && grandTotal > 0 ? (
                      <div className="space-y-4 bg-white p-6 rounded-xl border border-[#E8DFD1] text-left text-xs font-sans text-neutral-600 shadow-sm">
                        <div className="uppercase tracking-widest text-[9.5px] font-bold text-[#D4AF37] font-serif border-b border-neutral-100 pb-2.5 flex justify-between items-center">
                          <span>Category Description</span>
                          <span>Estimated Cost (USD)</span>
                        </div>

                        <div className="space-y-2 pt-1">
                          {invoiceItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center border-b border-neutral-100 pb-2 text-xs">
                              <span className="text-neutral-700 font-medium">{item.description}</span>
                              <span className="font-semibold text-neutral-900 font-mono text-sm">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                            </div>
                          ))}
                        </div>

                        {invoiceItems.length > 1 && (
                          <div className="flex justify-between items-center pt-2 px-1 text-xs font-semibold text-neutral-600 border-t border-neutral-100">
                            <span className="uppercase tracking-wider text-[10px] text-neutral-500 font-sans">Subtotal (Direct Services)</span>
                            <span className="font-mono text-sm text-neutral-800">${invoiceItems.filter(i => !i.description.includes('Tax &')).reduce((sum, i) => sum + i.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                          </div>
                        )}

                        {/* Grand Total Highlight Banner */}
                        <div className="border-t-2 border-[#D4AF37]/40 pt-4 mt-2 flex justify-between items-center text-base font-serif font-black text-neutral-900 bg-[#FAF8F5] p-4 rounded-xl border border-[#E8DFD1]">
                          <div className="flex flex-col">
                            <span className="uppercase tracking-wider text-[11px] text-[#8C6D3F]">Estimated Grand Total</span>
                            <span className="text-[9px] font-sans text-neutral-400 font-normal uppercase tracking-widest">Inclusive of taxes & concierge coordination</span>
                          </div>
                          <span className="text-2xl font-mono text-[#0A251D] font-extrabold">${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                        </div>

                        {/* Per Person & Per Day Metrics */}
                        <div className="grid grid-cols-2 gap-4 text-[11px] text-neutral-600 font-medium pt-3 border-t border-neutral-100">
                          <div className="bg-[#FAF9F6] p-3 rounded-lg border border-[#EBE6DC] flex justify-between items-center">
                            <span>Per Guest Investment ({totalPax} Pax):</span>
                            <span className="font-bold text-neutral-900 font-mono text-sm">${(grandTotal / (totalPax || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                          </div>
                          <div className="bg-[#FAF9F6] p-3 rounded-lg border border-[#EBE6DC] flex justify-between items-center">
                            <span>Per Guest (Per Day Rate):</span>
                            <span className="font-bold text-neutral-900 font-mono text-sm">${(grandTotal / (totalPax || 1) / (durationDays || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      hotelPriceTotal > 0 && (
                        <div className="bg-white p-6 rounded-xl border border-[#E8DFD1] flex justify-between items-center text-sm font-serif font-bold text-neutral-800">
                          <span className="uppercase tracking-widest text-[10px] text-[#D4AF37]">Estimated Hotel Cost Summary</span>
                          <span className="text-lg text-neutral-900 font-sans font-bold">${hotelPriceTotal.toFixed(2)} USD</span>
                        </div>
                      )
                    )}

                    {/* Booking Terms Notice */}
                    <div className="text-[10px] text-neutral-400 font-serif italic text-center">
                      * All prices are quoted in US Dollars (USD) and include all applicable taxes, service charges, fuel tolls, and concierge coordination. Rates are guaranteed upon confirmation.
                    </div>
                  </div>
                </div>

                {/* 4. CHRONOLOGY - DAY-BY-DAY TIMELINE */}
                <div className="w-full px-8 py-6 box-border">
                  <div className="text-center mb-8">
                    <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] block mb-1">Chronology</span>
                    <h3 className="text-3xl font-serif text-[#111827] font-light italic">Your Custom Itinerary</h3>
                  </div>

                  <div className="space-y-8">
                    {Array.from(new Set(itinerary.map(b => b.dayNumber))).sort((a, b) => a - b).map(dayNum => {

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
                        <div key={dayNum} className="print-page-break space-y-4">

                          {/* Centered Day Header */}
                          <div className="text-center flex flex-col items-center">
                            <div className="border border-[#E8DFD1] bg-[#FAF8F5] p-4 rounded-2xl max-w-xl w-full text-center shadow-sm">
                              <span className="text-[9px] uppercase tracking-[0.25em] text-[#8C6D3F] font-sans font-bold block mb-0.5">
                                Day {String(dayNum).padStart(2, '0')}
                              </span>
                              <h4 className="text-lg font-serif text-[#111827] font-bold mb-1">
                                {getLongFormattedDate(dayNum)}
                              </h4>
                              {weatherInfo && (
                                <span className="text-[9px] font-sans font-semibold text-neutral-500 bg-white border border-[#E8DFD1]/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 mb-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-amber-500">
                                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
                                  </svg>
                                  {weatherInfo}
                                </span>
                              )}
                              <div className="h-[0.5px] bg-[#E8DFD1] my-1.5 w-full"></div>
                              {(() => {
                                if (!sleepBlock) {
                                  return (
                                    <div className="text-[10px] text-neutral-400 italic">
                                      Accommodation: Bespoke Selection
                                    </div>
                                  );
                                }

                                const hotelDetail = masterData?.hotels
                                  ? masterData.hotels.find((x: any) =>
                                    (sleepBlock.hotelId && x.id === sleepBlock.hotelId) ||
                                    (sleepBlock.hotelName && x.name.toLowerCase() === sleepBlock.hotelName.toLowerCase()) ||
                                    (sleepBlock.name && x.name.toLowerCase() === sleepBlock.name.toLowerCase())
                                  )
                                  : null;
                                const starClass = hotelDetail?.hotel_class || hotelDetail?.star_rating;

                                return (
                                  <div className="text-[10px] text-neutral-600 font-sans leading-relaxed">
                                    <div className="font-bold text-[#8C6D3F] text-[11px]">
                                      🏨 {sleepBlock.hotelName || sleepBlock.name} {starClass ? `• ${starClass}` : ''}
                                    </div>
                                    <div className="text-neutral-500 font-medium text-[9px] mt-0.5">
                                      {sleepBlock.locationName ? `${sleepBlock.locationName} • ` : ''}{sleepBlock.mealPlan || 'HB (Half Board)'} Basis
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Itinerary Events Flow */}
                          <div className="space-y-3">
                            {dayBlocks.map((block) => {
                              return (
                                <div key={block.id} className="print-avoid-break bg-white p-4 rounded-xl border border-[#E8DFD1] shadow-xs hover:shadow-sm transition-all space-y-2 text-left">

                                  {/* Event Image */}
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
                                      <div className="w-full mb-2 overflow-hidden rounded-lg">
                                        <img
                                          src={imgUrl}
                                          alt={block.name}
                                          className="w-full object-cover max-h-[45mm]"
                                        />
                                      </div>
                                    );
                                  })()}

                                  {/* Title & Time Header */}
                                  <div className="flex justify-between items-start gap-4 border-b border-neutral-100 pb-2">
                                    <div>
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[7.5px] font-sans uppercase tracking-[0.2em] text-[#8C6D3F] bg-[#FAF8F5] border border-[#E8DFD1] px-1.5 py-0.5 rounded font-bold">
                                          {block.type === 'sleep' ? 'Stay Sanctuary' : (block.type === 'meal' ? 'Dining' : (block.type === 'travel' ? 'Private Transfer' : 'Experience'))}
                                        </span>
                                        {block.locationName && (
                                          <span className="text-[10px] text-[#D4AF37] font-serif italic">
                                            {block.locationName}
                                          </span>
                                        )}
                                      </div>
                                      <h5 className="text-sm font-bold text-neutral-900 font-serif">
                                        {block.name}
                                      </h5>
                                    </div>

                                    {block.startTime && (
                                      <span className="text-[9.5px] font-sans font-bold text-neutral-500 bg-neutral-100 px-2 py-1 rounded shrink-0">
                                        {block.startTime} {block.endTime ? `— ${block.endTime}` : ''}
                                      </span>
                                    )}
                                  </div>

                                  {/* Notes & Description */}
                                  {block.internalNotes && block.internalNotes.trim() !== '' && (
                                    <p className="text-[11px] text-neutral-600 font-sans leading-relaxed font-light">
                                      {block.internalNotes}
                                    </p>
                                  )}

                                  {/* Distance Indicator */}
                                  {block.distance && (
                                    <div className="text-[9.5px] font-sans font-medium text-neutral-400 text-right">
                                      Travel Distance: {block.distance}
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
                  const genericPolicyText = appSettings?.[Settings.Policy_Generic] || '';

                  const parsePolicyLines = (text: string) => {
                    if (!text) return [];
                    return text
                      .split('\n')
                      .map(line => line.replace(/[\uE000-\uF8FF]/g, '').trim())
                      .filter(line => {
                        const cleaned = line.replace(/^["'\s]+|["'\s]+$/g, '').trim();
                        return /[a-zA-Z0-9]/.test(cleaned);
                      });
                  };

                  const rawPolicies = parsePolicyLines(genericPolicyText);
                  const allPolicies = rawPolicies.length > 0 ? rawPolicies : [
                    "Deposit & Confirmation: A deposit is required to confirm hotel reservations and driver assignments.",
                    "Cancellation Policy: Cancellations made within 30 days of arrival are subject to hotel cancellation fees.",
                    "Travel Insurance: Comprehensive personal travel insurance is strongly recommended for all guests."
                  ];

                  return (
                    <div className="print-avoid-break">
                      <div className="px-16 py-10 max-w-[850px] mx-auto border-t border-[#E8DFD1]/55 mt-8">
                        <div className="text-center mb-6">
                          <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] block mb-1">
                            Terms & Conditions
                          </span>
                          <h3 className="text-2xl font-serif text-[#111827] font-light italic">
                            Proposal Terms & Booking Conditions
                          </h3>
                        </div>

                        <div className="bg-[#FAF9F6] border border-[#EBE6DC] rounded-2xl p-6 space-y-3 font-sans text-xs text-[#4B5563] leading-relaxed relative text-left">
                          <div className="absolute left-0 top-6 bottom-6 w-[2px] bg-gradient-to-b from-[#D4AF37]/20 via-[#D4AF37] to-[#D4AF37]/20"></div>
                          <ul className="space-y-2.5 pl-4 list-none">
                            {allPolicies.map((policy, idx) => {
                              const isHeader = policy.trim().endsWith(':');
                              if (isHeader) {
                                return (
                                  <li key={idx} className="pt-2 pb-0.5 pl-0 font-serif font-bold text-xs uppercase tracking-wider text-[#8C6D3F]">
                                    {policy}
                                  </li>
                                );
                              }
                              return (
                                <li key={idx} className="relative pl-5">
                                  <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                                  <span className="font-medium text-[11px] text-[#374151]">{policy}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-12 pt-6 border-t border-[#E8DFD1]/55 text-center pb-8 break-inside-avoid max-w-[850px] mx-auto">
                        <div className="mb-4">
                          <img src="/images/nilathra_logo-02.webp" alt="Nilathra" className="w-12 mx-auto opacity-20 filter grayscale" onError={(e) => e.currentTarget.style.display = 'none'} />
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
