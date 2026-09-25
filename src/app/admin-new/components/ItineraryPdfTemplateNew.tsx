import React from 'react';
import { InternalItineraryBlock } from '@/other/interfaces';
import { TouristDataDTO } from '@/dtos/tourist-data.dto';
import { TravelStyle, ItineraryBlockTypes, TierSettingDefinitions, TravelStylePolicyKeys, TRAVEL_STYLES, GUIDE_RATE_KEYS, TravelStyleSettingKeys, Settings } from '@/types/types';
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
      if (block.type === ItineraryBlockTypes.ACTIVITY) {
        if (block.hotelId) {
          const h = masterData.hotels?.find((x: any) => x.id === block.hotelId);
          let label = `Hotel Provider: ${h?.name || block.hotelName || 'Linked Hotel'}`;
          return {
            label,
            type: ItineraryBlockTypes.ACTIVITY,
          };
        }
        if (block.vendorId || block.vendorActivityId || block.activityId) {
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
      }
      if (block.type === ItineraryBlockTypes.TRAVEL && (block.driverId || block.transportId || block.vehicleId)) {
        const d = masterData.drivers?.find((x: any) => x.id === block.driverId);
        const p = masterData.transportProviders?.find((x: any) => x.id === block.transportId);
        const v = p?.transport_vehicles?.find((x: any) => x.id === block.vehicleId);

        let label = p?.name || 'Transport';
        if (v) {
          label = `${p?.name || ''} — ${[v.make, v.model].filter(Boolean).join(' ') || v.make_and_model || v.vehicle_type}`;
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

    // Calculate overall itinerary costs summary using InvoiceCalculationService
    const simplifiedItinerary = itinerary.map(b => ({
      id: b.id,
      type: b.type,
      agreedPrice: b.agreedPrice,
      hotelId: b.hotelId,
      quantity: b.quantity || (b as any).headCount || b.transportQuantity || b.restaurantQuantity || totalPax || 1,
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
      pax: totalPax,
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

    console.log("PDF calculation debug:", {
      travelStyle,
      chauffeurNeeded,
      guideNeeded,
      pax: totalPax,
      durationDays,
      appSettingsExists: !!appSettings,
      appSettingsKeys: appSettings ? Object.keys(appSettings) : [],
      simplifiedItineraryLength: simplifiedItinerary.length,
      invoiceItems
    });

    const grandTotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);

    // Calculate total price of hotel blocks in the skeleton itinerary, considering overrides
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

    // Select activity cover images (prioritize itinerary images if available, else pool)
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
              top: "16mm",
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
          <div className="z-10 text-center flex flex-col items-center mt-36">
            <span className="text-[#D4AF37] text-[10px] tracking-[0.5em] uppercase font-light">
              The Collection
            </span>
            <div className="w-16 h-[1px] bg-[#D4AF37]/40 mt-4 mb-2"></div>
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

                {/* 3. TRIP BLUEPRINT / METRICS OVERVIEW */}
                <div className="print-page-break w-full px-8 py-6 box-border">
                  <div className="text-center mb-8">
                    <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] block mb-2">The Blueprint</span>
                    <h3 className="text-3xl font-serif text-[#111827] font-light italic">Journey Details</h3>
                  </div>

                  <div className="bg-[#FAF9F6] border border-[#EBE6DC] rounded-2xl p-8 space-y-8">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-8">

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
                            <span className="col-span-2 text-right pr-2">Overall for Your Trip</span>
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
                  // Coordinate lookup dictionary for Sri Lanka cities
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
                    'yala': { lat: 6.3725, lng: 81.5165 },
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

                  // Helper function to resolve (lat, lng) for a location string
                  const resolveLocationCoords = (locName: string): { lat: number; lng: number } => {
                    const clean = locName.toLowerCase().trim();
                    for (const [key, coords] of Object.entries(SRI_LANKA_CITY_COORDS)) {
                      if (clean.includes(key) || key.includes(clean)) {
                        return coords;
                      }
                    }
                    // Fallback to center-west default if unknown
                    return { lat: 7.0, lng: 80.2 };
                  };

                  // Project (lat, lng) to SVG viewBox coordinates (width: 320, height: 440)
                  const projectToMap = (lat: number, lng: number): { x: number; y: number } => {
                    const minLat = 5.7;
                    const maxLat = 9.8;
                    const minLng = 79.3;
                    const maxLng = 82.1;

                    const minX = 40;
                    const maxX = 280;
                    const minY = 40;
                    const maxY = 400;

                    const x = minX + ((lng - minLng) / (maxLng - minLng)) * (maxX - minX);
                    const y = maxY - ((lat - minLat) / (maxLat - minLat)) * (maxY - minY);
                    return { x: Math.round(x), y: Math.round(y) };
                  };

                  // Group itinerary blocks by unique location/coordinates
                  const sortedBlocks = [...itinerary].sort((a, b) => a.dayNumber - b.dayNumber);
                  const cityStopsMap = new Map<string, {
                    name: string;
                    startDay: number;
                    endDay: number;
                    coords: { lat: number; lng: number };
                    mapXY: { x: number; y: number };
                    hotelName?: string;
                  }>();

                  sortedBlocks.forEach(block => {
                    const rawLoc = block.locationName || block.hotelName || block.name || '';
                    if (!rawLoc || rawLoc.toLowerCase().includes('travel') || rawLoc.toLowerCase().includes('transfer')) return;

                    let cityName = rawLoc.split('-')[0].split(',')[0].trim();
                    if (!cityName) return;

                    const coords = resolveLocationCoords(cityName);
                    const cityKey = `${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}`;
                    const mapXY = projectToMap(coords.lat, coords.lng);

                    if (cityStopsMap.has(cityKey)) {
                      const existing = cityStopsMap.get(cityKey)!;
                      existing.startDay = Math.min(existing.startDay, block.dayNumber);
                      existing.endDay = Math.max(existing.endDay, block.dayNumber);
                      if (block.type === ItineraryBlockTypes.SLEEP && block.hotelName) {
                        existing.hotelName = block.hotelName;
                      }
                    } else {
                      cityStopsMap.set(cityKey, {
                        name: cityName,
                        startDay: block.dayNumber,
                        endDay: block.dayNumber,
                        coords,
                        mapXY,
                        hotelName: block.type === ItineraryBlockTypes.SLEEP ? block.hotelName : undefined
                      });
                    }
                  });

                  const locationStops = Array.from(cityStopsMap.values()).sort((a, b) => a.startDay - b.startDay);

                  if (locationStops.length === 0) return null;

                  const pathPointsString = locationStops.map(s => `${s.mapXY.x},${s.mapXY.y}`).join(' L ');

                  return (
                    <div className="print-page-break w-full px-8 py-6 box-border">
                      <div className="text-center mb-6">
                        <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] block mb-1">Spatial Blueprint</span>
                        <h3 className="text-2xl font-serif text-[#111827] font-light italic">Route Map & Destination Sequence</h3>
                      </div>

                      <div className="bg-[#FAF9F6] border border-[#EBE6DC] rounded-2xl p-6">
                        <div className="w-full bg-white rounded-xl border border-[#E8DFD1] p-6 flex flex-col items-center justify-center relative shadow-sm min-h-[680px]">
                          <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#8C6D3F] font-bold block mb-4 text-center">
                            Sri Lanka Private Tour Route • {locationStops.length} Destination Hubs
                          </span>

                          <svg
                            viewBox="0 0 320 440"
                            className="w-full h-auto max-h-[620px] drop-shadow-sm"
                            style={{ overflow: 'visible' }}
                          >
                            <defs>
                              <linearGradient id="sriLankaBg" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#F5F2EA" />
                                <stop offset="100%" stopColor="#EBE5D8" />
                              </linearGradient>
                              <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                              </filter>
                            </defs>

                            {/* Stylized Vector Path of Sri Lanka Silhouette */}
                            <path
                              d="M 142,42 C 150,38 165,40 174,48 C 182,56 186,66 180,78 C 174,88 158,94 153,105 C 148,116 150,126 146,138 C 140,154 122,165 112,180 C 102,195 98,215 94,235 C 90,255 88,275 86,295 C 84,315 83,335 82,350 C 81,365 82,380 86,395 C 92,410 102,422 115,432 C 128,442 145,448 165,450 C 185,451 205,448 225,441 C 242,434 256,420 268,402 C 278,386 284,365 285,344 C 286,323 282,302 278,282 C 274,262 272,242 270,222 C 267,202 261,182 252,163 C 244,144 233,126 218,111 C 206,97 192,83 182,68 C 172,55 158,45 142,42 Z"
                              fill="url(#sriLankaBg)"
                              stroke="#D4AF37"
                              strokeWidth="1.5"
                              strokeLinejoin="round"
                            />

                            {/* Coastal Grid Reference Lines */}
                            <circle cx="160" cy="240" r="180" stroke="#D4AF37" strokeWidth="0.5" strokeDasharray="2,4" fill="none" opacity="0.25" />
                            <circle cx="160" cy="240" r="120" stroke="#D4AF37" strokeWidth="0.5" strokeDasharray="2,4" fill="none" opacity="0.2" />

                            {/* Route Trajectory Polyline */}
                            {locationStops.length > 1 && (
                              <path
                                d={`M ${pathPointsString}`}
                                stroke="#D4AF37"
                                strokeWidth="2.5"
                                strokeDasharray="5,4"
                                fill="none"
                                filter="url(#goldGlow)"
                              />
                            )}

                            {/* Location Pins showing Day numbers */}
                            {locationStops.map((stop, sIdx) => {
                              const isStart = sIdx === 0;
                              const isEnd = sIdx === locationStops.length - 1;
                              const pinColor = isStart ? "#0A251D" : isEnd ? "#8C6D3F" : "#111827";
                              const dayLabel = stop.startDay === stop.endDay 
                                ? `D${stop.startDay}` 
                                : `D${stop.startDay}-${stop.endDay}`;

                              return (
                                <g key={sIdx}>
                                  {/* Circle Pin Badge */}
                                  <circle
                                    cx={stop.mapXY.x}
                                    cy={stop.mapXY.y}
                                    r="14"
                                    fill={pinColor}
                                    stroke="#D4AF37"
                                    strokeWidth="1.5"
                                  />
                                  <text
                                    x={stop.mapXY.x}
                                    y={stop.mapXY.y + 3.5}
                                    fill="#FFFFFF"
                                    fontSize="8"
                                    fontWeight="bold"
                                    fontFamily="sans-serif"
                                    textAnchor="middle"
                                  >
                                    {dayLabel}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 3.4 CONCIERGES & DESTINATION SUPPORT PAGES */}
                {(() => {
                  const CONCIERGE_ITEMS_PER_PAGE = 9;
                  const hasConcierges = enrichedTourConcierges && enrichedTourConcierges.length > 0;
                  const conciergeChunks: any[][] = [];

                  if (hasConcierges) {
                    for (let i = 0; i < enrichedTourConcierges.length; i += CONCIERGE_ITEMS_PER_PAGE) {
                      conciergeChunks.push(enrichedTourConcierges.slice(i, i + CONCIERGE_ITEMS_PER_PAGE));
                    }
                  } else {
                    conciergeChunks.push([]);
                  }

                  return conciergeChunks.map((chunk, chunkIdx) => (
                    <div key={`concierge-chunk-page-${chunkIdx}`} className="print-page-break w-full px-8 py-6 box-border">
                      <div className="text-center mb-6">
                        <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] block mb-1">Exclusive Services</span>
                        <h3 className="text-2xl font-serif text-[#111827] font-light italic">
                          Concierges & Destination Support {conciergeChunks.length > 1 ? `(Page ${chunkIdx + 1} of ${conciergeChunks.length})` : ''}
                        </h3>
                      </div>

                      {chunk.length > 0 ? (
                        <div className="bg-[#FAF9F6] border border-[#EBE6DC] rounded-2xl p-6 space-y-4">
                          <div className="text-center max-w-lg mx-auto mb-1">
                            <span className="text-[9px] font-sans uppercase tracking-[0.25em] text-[#8C6D3F] font-bold block mb-0.5">
                              Tailored Concierge Services
                            </span>
                            <p className="text-xs text-neutral-500 font-serif italic">
                              Bespoke concierge services and VIP support protocols integrated into your Ceylon journey for {clientName}.
                            </p>
                          </div>

                          <div className="bg-white rounded-xl border border-[#E8DFD1] overflow-hidden shadow-sm">
                            <div className="bg-[#FAF8F5] border-b border-[#E8DFD1] px-5 py-2.5 flex justify-between items-center text-[9px] font-sans uppercase tracking-widest text-[#8C6D3F] font-bold">
                              <span>Service & Category</span>
                              <div className="flex items-center gap-12 pr-2">
                                <span>Service Basis</span>
                                <span>Quantity</span>
                              </div>
                            </div>

                            <div className="divide-y divide-neutral-100">
                              {chunk.map((item: any, idx: number) => {
                                const title = item.cost_item?.title || item.title || 'Bespoke Concierge Service';
                                const details = item.cost_item?.details || item.details || '';
                                const category = item.cost_item?.category || item.category || 'Support';
                                const rawBasis = (item.costing_basis || item.cost_item?.costing_basis || 'per_service').toLowerCase();
                                const costingBasis = rawBasis.includes('day') ? 'Per Day' : (rawBasis.includes('person') ? 'Per Guest' : 'Per Service');
                                const qty = item.quantity || 1;

                                return (
                                  <div key={idx} className="px-5 py-2.5 flex justify-between items-start text-left hover:bg-neutral-50/50 transition-colors">
                                    <div className="space-y-0.5 max-w-md">
                                      <div className="flex items-center gap-2">
                                        <span className="font-serif font-bold text-sm text-[#111827]">{title}</span>
                                        <span className="text-[7.5px] font-sans uppercase tracking-[0.2em] text-[#8C6D3F] bg-[#FAF8F5] border border-[#E8DFD1] px-1.5 py-0.5 rounded font-bold">
                                          {category}
                                        </span>
                                      </div>
                                      {details && (
                                        <p className="text-[11px] text-neutral-500 font-sans leading-normal">
                                          {details}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-12 text-xs font-sans text-right pt-0.5">
                                      <span className="text-neutral-500 font-medium text-[11px] min-w-[70px]">{costingBasis}</span>
                                      <span className="font-mono font-bold text-neutral-800 bg-neutral-100 px-2.5 py-0.5 rounded text-xs min-w-[50px] text-center">
                                        {qty} {qty > 1 ? 'Pax' : 'Unit'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#FAF9F6] border border-[#EBE6DC] rounded-2xl p-8 text-center space-y-3">
                          <span className="text-[9px] font-sans uppercase tracking-[0.25em] text-[#8C6D3F] font-bold block mb-1">
                            Complimentary Destination Support Included
                          </span>
                          <p className="text-xs text-neutral-600 font-serif italic max-w-md mx-auto">
                            24/7 dedicated local concierge manager on standby, airport coordination, luxury transfer logistics, and real-time itinerary support throughout your Ceylon travel experience.
                          </p>
                        </div>
                      )}
                    </div>
                  ));
                })()}

                {/* 3.5 FINANCIAL BLUEPRINT / ESTIMATED PACKAGE COST OVERVIEW PAGE */}
                <div className="print-page-break w-full px-8 py-6 box-border">
                  <div className="text-center mb-8">
                    <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] block mb-2">Commercial Overview</span>
                    <h3 className="text-3xl font-serif text-[#111827] font-light italic">Estimated Package Cost Overview</h3>
                  </div>

                  <div className="bg-[#FAF9F6] border border-[#EBE6DC] rounded-2xl p-8 space-y-6">
                    <div className="text-center max-w-md mx-auto mb-4">
                      <span className="text-[9px] font-sans uppercase tracking-[0.25em] text-[#8C6D3F] font-bold block mb-1">
                        Investment Summary
                      </span>
                      <p className="text-xs text-neutral-500 font-serif italic">
                        Bespoke package cost estimation structured for {clientName} ({totalPax} Guest{totalPax > 1 ? 's' : ''} &bull; {durationDays} Days)
                      </p>
                    </div>

                    {invoiceItems.length > 0 && grandTotal > 0 ? (
                      <div className="space-y-3 bg-white p-6 rounded-xl border border-[#E8DFD1] text-left text-xs font-sans text-neutral-600 shadow-sm">
                        <div className="uppercase tracking-widest text-[9.5px] font-bold text-[#D4AF37] font-serif border-b border-neutral-100 pb-2.5 flex justify-between items-center">
                          <span>Category Description</span>
                          <span>Estimated Cost (USD)</span>
                        </div>

                        <div className="space-y-2 pt-1">
                          {invoiceItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center border-b border-neutral-100 pb-2 text-xs">
                              <span className="text-neutral-700 font-medium">{item.description}</span>
                              <span className="font-semibold text-neutral-900 font-mono text-sm">${item.amount.toFixed(2)} USD</span>
                            </div>
                          ))}
                        </div>

                        {invoiceItems.length > 1 && (
                          <div className="flex justify-between items-center pt-2 px-1 text-xs font-semibold text-neutral-600">
                            <span className="uppercase tracking-wider text-[10px] text-neutral-500 font-sans">Subtotal (Direct Services)</span>
                            <span className="font-mono text-sm text-neutral-800">${invoiceItems.filter(i => !i.description.includes('Tax &')).reduce((sum, i) => sum + i.amount, 0).toFixed(2)} USD</span>
                          </div>
                        )}

                        <div className="border-t-2 border-[#D4AF37]/40 pt-4 mt-2 flex justify-between items-center text-base font-serif font-black text-neutral-900 bg-[#FAF8F5] p-4 rounded-xl border border-[#E8DFD1]">
                          <div className="flex flex-col">
                            <span className="uppercase tracking-wider text-[11px] text-[#8C6D3F]">Estimated Grand Total</span>
                            <span className="text-[9px] font-sans text-neutral-400 font-normal uppercase tracking-widest">Inclusive of taxes & concierge coordination</span>
                          </div>
                          <span className="text-2xl font-mono text-[#0A251D] font-extrabold">${grandTotal.toFixed(2)} USD</span>
                        </div>

                        <div className="flex justify-between text-[10.5px] text-neutral-500 font-medium pt-2 border-t border-neutral-100">
                          <span>Per Head Cost (Trip Total — {totalPax} Pax):</span>
                          <span className="font-semibold text-neutral-700 font-mono">${(grandTotal / (totalPax || 1)).toFixed(2)} USD</span>
                        </div>
                        <div className="flex justify-between text-[10.5px] text-neutral-500 font-medium">
                          <span>Per Head Cost (Per Day):</span>
                          <span className="font-semibold text-neutral-700 font-mono">${(grandTotal / (totalPax || 1) / (durationDays || 1)).toFixed(2)} USD</span>
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

                  </div>
                </div>

                {/* 3.6 ACCOMMODATION SUMMARY PAGES */}
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
                          Sanctuaries & Stay Schedule {sleepChunks.length > 1 ? `(Page ${chunkIdx + 1} of ${sleepChunks.length})` : ''}
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
                            <span className="col-span-2">Star Rating</span>
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

                                const hName = block.hotelName || block.name || hotelDetail?.name || 'Pending Assignment';
                                const starClass = hotelDetail?.hotel_class || hotelDetail?.star_rating || (travelStyle === 'Ultra VIP' ? '5 Star Super Luxury' : '5 Star Luxury');
                                const mealPlan = block.mealPlan || 'HB';
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
                                          {mealPlan} Basis
                                        </span>
                                      </div>
                                    </div>

                                    {/* Room Options Breakdown Table (Room Category / Type | Meal Plan | Quantity / Rooms | Rate (USD)) */}
                                    {(() => {
                                      const acc = accommodations?.find((a: any) => Number(a.nightIndex) === Number(block.dayNumber));
                                      const selectedRooms = acc?.selectedRooms || (block as any).selectedRooms || [];

                                      let roomRows: Array<{ category: string; mealPlan: string; qty: number; rate?: number }> = [];

                                      if (selectedRooms.length > 0) {
                                        roomRows = selectedRooms.map((sr: any) => ({
                                          category: [sr.reqId, sr.roomName].filter(Boolean).join(' - ') || 'Standard Room',
                                          mealPlan: sr.mealPlan || acc?.mealPlan || block.mealPlan || mealPlan || 'HB',
                                          qty: sr.quantity || 1,
                                          rate: sr.pricePerNight || sr.contractedPrice
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
                                            <span className="col-span-4 text-right pr-2">Quantity / Rooms</span>
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

                {/* 3.7 PRIVATE TRANSPORT & CHAUFFEUR LOGISTICS PAGE */}
                <div className="print-page-break w-full px-8 py-6 box-border">
                  <div className="text-center mb-8">
                    <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.4em] block mb-2">Transport & Chauffeur</span>
                    <h3 className="text-3xl font-serif text-[#111827] font-light italic">Private Vehicles & Chauffeur Logistics</h3>
                  </div>

                  <div className="bg-[#FAF9F6] border border-[#EBE6DC] rounded-2xl p-8 space-y-6">
                    <div className="text-center max-w-lg mx-auto mb-2">
                      <span className="text-[9px] font-sans uppercase tracking-[0.25em] text-[#8C6D3F] font-bold block mb-1">
                        Private Fleet & Logistics
                      </span>
                      <p className="text-xs text-neutral-500 font-serif italic">
                        Private vehicle specification, comfort amenities, and dedicated chauffeur logistics assigned for {clientName}.
                      </p>
                    </div>

                    {(() => {
                      const formatDayNumbers = (days: number[], durationDays: number): string => {
                        const sorted = Array.from(new Set(days.map(Number).filter(d => !isNaN(d) && d > 0))).sort((a, b) => a - b);
                        if (sorted.length === 0) {
                          return `Days 01 to ${String(durationDays).padStart(2, '0')}`;
                        }
                        if (sorted.length === durationDays && sorted[0] === 1 && sorted[sorted.length - 1] === durationDays) {
                          return `Days 01 to ${String(durationDays).padStart(2, '0')}`;
                        }

                        const ranges: Array<{ start: number; end: number }> = [];
                        let currentStart = sorted[0];
                        let currentEnd = sorted[0];

                        for (let i = 1; i < sorted.length; i++) {
                          if (sorted[i] === currentEnd + 1) {
                            currentEnd = sorted[i];
                          } else {
                            ranges.push({ start: currentStart, end: currentEnd });
                            currentStart = sorted[i];
                            currentEnd = sorted[i];
                          }
                        }
                        ranges.push({ start: currentStart, end: currentEnd });

                        const parts = ranges.map(r => {
                          const sStr = String(r.start).padStart(2, '0');
                          const eStr = String(r.end).padStart(2, '0');
                          if (r.start === r.end) {
                            return sStr;
                          } else if (r.end === r.start + 1) {
                            return `${sStr} & ${eStr}`;
                          } else {
                            return `${sStr} to ${eStr}`;
                          }
                        });

                        if (ranges.length === 1 && ranges[0].start === ranges[0].end) {
                          return `Day ${parts[0]}`;
                        }

                        return `Days ${parts.join(', ')}`;
                      };

                      // Collect assigned vehicles with specific day numbers
                      const vehicleDaysMap = new Map<string, { vehicleObj: any; days: Set<number> }>();

                      if (dailyVehicleAssignments) {
                        Object.entries(dailyVehicleAssignments).forEach(([dayStr, assList]) => {
                          const dayNum = Number(dayStr);
                          if (isNaN(dayNum) || !Array.isArray(assList)) return;
                          assList.forEach((ass: any) => {
                            const vId = ass.vehicle_id || ass.vehicleId;
                            const vObj = masterData?.transportVehicles?.find((mv: any) => mv.id === vId) || ass.vehicles || ass.vehicle;
                            const key = vId || ass.vehicle_name || 'default_veh';
                            if (vObj || ass.vehicle_name) {
                              const itemObj = vObj || { name: ass.vehicle_name, license_plate: ass.registration_number };
                              if (!vehicleDaysMap.has(key)) {
                                vehicleDaysMap.set(key, { vehicleObj: itemObj, days: new Set<number>() });
                              }
                              vehicleDaysMap.get(key)!.days.add(dayNum);
                            }
                          });
                        });
                      }

                      itinerary.filter(b => b.type === 'travel' || b.type === 'train').forEach(block => {
                        if (block.vehicleId && masterData?.transportVehicles) {
                          const vObj = masterData.transportVehicles.find((v: any) => v.id === block.vehicleId);
                          if (vObj) {
                            const key = vObj.id || block.vehicleId;
                            if (!vehicleDaysMap.has(key)) {
                              vehicleDaysMap.set(key, { vehicleObj: vObj, days: new Set<number>() });
                            }
                            if (block.dayNumber) {
                              vehicleDaysMap.get(key)!.days.add(block.dayNumber);
                            }
                          }
                        }
                      });

                      const assignedVehicleList = Array.from(vehicleDaysMap.values());

                      // Collect assigned drivers with specific day numbers
                      const driverDaysMap = new Map<string, { driverObj: any; days: Set<number> }>();

                      if (dailyDriverAssignments) {
                        Object.entries(dailyDriverAssignments).forEach(([dayStr, assList]) => {
                          const dayNum = Number(dayStr);
                          if (isNaN(dayNum) || !Array.isArray(assList)) return;
                          assList.forEach((ass: any) => {
                            const dId = ass.driver_id || ass.driverId;
                            const dObj = masterData?.drivers?.find((md: any) => md.id === dId) || ass.driver;
                            const key = dId || ass.driver_name || 'default_drv';
                            if (dObj || ass.driver_name) {
                              const itemObj = dObj || { first_name: ass.driver_name, phone: ass.phone };
                              if (!driverDaysMap.has(key)) {
                                driverDaysMap.set(key, { driverObj: itemObj, days: new Set<number>() });
                              }
                              driverDaysMap.get(key)!.days.add(dayNum);
                            }
                          });
                        });
                      }

                      itinerary.filter(b => b.type === 'travel' || b.type === 'train').forEach(block => {
                        if (block.driverId && masterData?.drivers) {
                          const dObj = masterData.drivers.find((d: any) => d.id === block.driverId);
                          if (dObj) {
                            const key = dObj.id || block.driverId;
                            if (!driverDaysMap.has(key)) {
                              driverDaysMap.set(key, { driverObj: dObj, days: new Set<number>() });
                            }
                            if (block.dayNumber) {
                              driverDaysMap.get(key)!.days.add(block.dayNumber);
                            }
                          }
                        }
                      });

                      const assignedDriverList = Array.from(driverDaysMap.values());

                      // Fallback vehicle category description if none explicitly bound yet
                      const vehicleCategoryName = totalPax <= 2 
                        ? 'Luxury Air-Conditioned Executive Sedan (Toyota Premier / Mercedes Class)'
                        : totalPax <= 4
                          ? 'Luxury Air-Conditioned Mini-Van (Toyota KDH Luxury VIP Edition)'
                          : 'Luxury Executive Passenger Coach / VIP Van';

                      return (
                        <div className="space-y-6">
                          {/* Vehicles Table */}
                          <div className="bg-white rounded-xl border border-[#E8DFD1] overflow-hidden shadow-sm">
                            <div className="bg-[#FAF8F5] border-b border-[#E8DFD1] px-5 py-3 grid grid-cols-12 text-[9px] font-sans uppercase tracking-widest text-[#8C6D3F] font-bold text-left">
                              <span className="col-span-4">Vehicle Category & Model</span>
                              <span className="col-span-3">Reg. / License Plate</span>
                              <span className="col-span-2">Service Period</span>
                              <span className="col-span-3 text-right pr-2">Comfort & Amenities</span>
                            </div>

                            <div className="divide-y divide-neutral-100">
                              {assignedVehicleList.length > 0 ? (
                                assignedVehicleList.map(({ vehicleObj: veh, days }, vIdx) => {
                                  const vName = veh.name || veh.model || veh.vehicle_name || 'Executive Private Vehicle';
                                  const vPlate = veh.license_plate || veh.registration_number || veh.plate_number || 'Assigned Fleet';
                                  const vType = veh.vehicle_type || veh.type || 'Fully Air-Conditioned';
                                  const servicePeriodStr = formatDayNumbers(Array.from(days), durationDays);

                                  return (
                                    <div key={vIdx} className="px-5 py-4 grid grid-cols-12 items-center text-left hover:bg-neutral-50/50 transition-colors text-xs">
                                      <div className="col-span-4 space-y-0.5">
                                        <span className="font-serif font-bold text-sm text-[#111827] block">{vName}</span>
                                        <span className="text-[9px] text-[#8C6D3F] uppercase tracking-wider font-semibold block">{vType}</span>
                                      </div>
                                      <div className="col-span-3 font-mono font-bold text-xs text-neutral-700">
                                        {vPlate}
                                      </div>
                                      <div className="col-span-2 text-xs font-semibold text-neutral-600">
                                        {servicePeriodStr}
                                      </div>
                                      <div className="col-span-3 text-right pr-2 text-[10px] text-neutral-500 font-serif italic">
                                        Air-Conditioned, Chilled Water, Wi-Fi
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="px-5 py-4 grid grid-cols-12 items-center text-left text-xs">
                                  <div className="col-span-4 space-y-0.5">
                                    <span className="font-serif font-bold text-sm text-[#111827] block">{vehicleCategoryName}</span>
                                    <span className="text-[9px] text-[#8C6D3F] uppercase tracking-wider font-semibold block">Dedicated Private Fleet</span>
                                  </div>
                                  <div className="col-span-3 font-mono font-bold text-xs text-neutral-700">
                                    Assigned Executive Vehicle
                                  </div>
                                  <div className="col-span-2 text-xs font-semibold text-neutral-600">
                                    Days 01 to {durationDays}
                                  </div>
                                  <div className="col-span-3 text-right pr-2 text-[10px] text-neutral-500 font-serif italic">
                                    A/C, Chilled Towels, Refreshments
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Chauffeur / Driver Table */}
                          <div className="bg-white rounded-xl border border-[#E8DFD1] overflow-hidden shadow-sm">
                            <div className="bg-[#FAF8F5] border-b border-[#E8DFD1] px-5 py-3 grid grid-cols-12 text-[9px] font-sans uppercase tracking-widest text-[#8C6D3F] font-bold text-left">
                              <span className="col-span-4">Chauffeur / Driver Name</span>
                              <span className="col-span-3">Contact Phone</span>
                              <span className="col-span-2">Service Period</span>
                              <span className="col-span-3 text-right pr-2">Licensing & Languages</span>
                            </div>

                            <div className="divide-y divide-neutral-100">
                              {assignedDriverList.length > 0 ? (
                                assignedDriverList.map(({ driverObj: drv, days }, dIdx) => {
                                  const dName = drv.first_name ? `${drv.first_name} ${drv.last_name || ''}`.trim() : (drv.driver_name || drv.name || 'Private Chauffeur');
                                  const dPhone = drv.phone || drv.contact_number || 'Direct Operational Hotline';
                                  const dLangs = Array.isArray(drv.languages) ? drv.languages.join(', ') : (drv.languages || 'English Speaking');
                                  const servicePeriodStr = formatDayNumbers(Array.from(days), durationDays);

                                  return (
                                    <div key={dIdx} className="px-5 py-4 grid grid-cols-12 items-center text-left hover:bg-neutral-50/50 transition-colors text-xs">
                                      <div className="col-span-4 space-y-0.5">
                                        <span className="font-serif font-bold text-sm text-[#111827] block">{dName}</span>
                                        <span className="text-[9px] text-[#8C6D3F] uppercase tracking-wider font-semibold block">National Tourist Chauffeur</span>
                                      </div>
                                      <div className="col-span-3 font-mono font-bold text-xs text-neutral-700">
                                        {dPhone}
                                      </div>
                                      <div className="col-span-2 text-xs font-semibold text-neutral-600">
                                        {servicePeriodStr}
                                      </div>
                                      <div className="col-span-3 text-right pr-2 text-[10px] text-neutral-500 font-serif italic">
                                        {dLangs} &bull; SLTDA Certified
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="px-5 py-4 grid grid-cols-12 items-center text-left text-xs">
                                  <div className="col-span-4 space-y-0.5">
                                    <span className="font-serif font-bold text-sm text-[#111827] block">Dedicated National Tourist Chauffeur</span>
                                    <span className="text-[9px] text-[#8C6D3F] uppercase tracking-wider font-semibold block">Professional Chauffeur Service</span>
                                  </div>
                                  <div className="col-span-3 font-mono font-bold text-xs text-neutral-700">
                                    Provided at Airport Arrival
                                  </div>
                                  <div className="col-span-2 text-xs font-semibold text-neutral-600">
                                    Full Trip Duration ({durationDays} Days)
                                  </div>
                                  <div className="col-span-3 text-right pr-2 text-[10px] text-neutral-500 font-serif italic">
                                    English Speaking &bull; Tourist Board Licensed
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Transport Inclusions Footer Box */}
                          <div className="bg-[#FAF8F5] border border-[#E8DFD1] p-4 rounded-xl text-left flex flex-wrap justify-between items-center gap-4 text-[10.5px] text-[#8C6D3F] font-medium">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                              <span>Fuel, Express Highway Tolls & Parking Included</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                              <span>Chauffeur Meals & Night Accommodation Covered</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                              <span>Unlimited Mileage for Itinerary Program</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* 4. CHRONOLOGY - DAY-BY-DAY TIMELINE */}
                <div className="w-full px-8 py-6 box-border">
                  <div className="text-center mb-10">
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
                        <div key={dayNum} className="print-page-break space-y-6">

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
                              {(() => {
                                if (!sleepBlock) {
                                  return (
                                    <div className="text-[10px] text-neutral-400 italic">
                                      Accommodation: Pending Assignment
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
                                const starClass = hotelDetail?.hotel_class;

                                return (
                                  <div className="text-[10px] text-neutral-600 font-sans leading-relaxed space-y-1">
                                    <div className="font-bold text-[#8C6D3F] text-[11px] mb-0.5">
                                      {sleepBlock.hotelName || sleepBlock.name} {starClass ? `• ${starClass}` : ''}
                                    </div>

                                    {sleepBlock.locationName && (
                                      <div className="text-neutral-400 font-bold uppercase tracking-wider text-[8px] mb-1">
                                        Location: {sleepBlock.locationName}
                                      </div>
                                    )}

                                    {(() => {
                                      const acc = accommodations?.find((a: any) => Number(a.nightIndex) === Number(sleepBlock.dayNumber));
                                      const selectedRooms = acc?.selectedRooms || (sleepBlock as any).selectedRooms || [];

                                      let roomRows: Array<{ category: string; mealPlan: string; qty: number; rate?: number }> = [];

                                      if (selectedRooms.length > 0) {
                                        roomRows = selectedRooms.map((sr: any) => ({
                                          category: [sr.reqId, sr.roomName].filter(Boolean).join(' - ') || 'Standard Room',
                                          mealPlan: sr.mealPlan || acc?.mealPlan || sleepBlock.mealPlan || 'HB',
                                          qty: sr.quantity || 1,
                                          rate: sr.pricePerNight || sr.contractedPrice
                                        }));
                                      } else {
                                        if (singleRoomsCount > 0) roomRows.push({ category: 'Single Room', mealPlan: sleepBlock.mealPlan || 'HB', qty: singleRoomsCount });
                                        if (doubleRoomsCount > 0) roomRows.push({ category: 'Double Room', mealPlan: sleepBlock.mealPlan || 'HB', qty: doubleRoomsCount });
                                        if (tripleRoomsCount > 0) roomRows.push({ category: 'Triple Room', mealPlan: sleepBlock.mealPlan || 'HB', qty: tripleRoomsCount });
                                        if (familyRoomsCount > 0) roomRows.push({ category: 'Family Room', mealPlan: sleepBlock.mealPlan || 'HB', qty: familyRoomsCount });
                                        if (roomRows.length === 0 && sleepBlock.roomName) {
                                          roomRows.push({ category: sleepBlock.roomName, mealPlan: sleepBlock.mealPlan || 'HB', qty: 1 });
                                        }
                                      }

                                      if (roomRows.length === 0) {
                                        return (
                                          <div className="font-medium">
                                            Standard Room &bull; {sleepBlock.mealPlan || 'HB'} Basis
                                          </div>
                                        );
                                      }

                                      return (
                                        <div className="bg-[#FAF8F5] rounded border border-[#E8DFD1] p-1.5 text-[9px] font-sans mt-1">
                                          <div className="grid grid-cols-12 gap-1 uppercase tracking-wider font-bold text-[#8C6D3F] text-[7.5px] border-b border-[#E8DFD1] pb-0.5 mb-1">
                                            <span className="col-span-5">Room Category / Type</span>
                                            <span className="col-span-3 text-center">Meal Plan</span>
                                            <span className="col-span-4 text-right pr-2">Quantity / Rooms</span>
                                          </div>
                                          <div className="divide-y divide-[#E8DFD1]/40">
                                            {roomRows.map((r, rIdx) => (
                                              <div key={rIdx} className="grid grid-cols-12 gap-1 items-center py-0.5 text-neutral-800">
                                                <span className="col-span-5 font-semibold text-neutral-900">{r.category}</span>
                                                <span className="col-span-3 text-center font-mono font-bold text-emerald-855 bg-emerald-50 border border-emerald-200/60 rounded px-1 text-[8px]">{r.mealPlan}</span>
                                                <span className="col-span-4 text-right pr-2 font-medium">{r.qty} {r.qty > 1 ? 'Rooms' : 'Room'}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                );
                              })()}

                            </div>
                          </div>

                          {/* Itinerary Events Flow - Full Width, Box-free */}
                          <div className="space-y-2">
                            {dayBlocks.map((block) => {
                              return (
                                <div key={block.id} className="print-avoid-break pb-1">

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
                                  <div className="flex justify-between items-baseline py-0.5 text-sm border-b border-neutral-100">
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
                                      <div className="mt-1 px-2.5 py-1 bg-[#FAF9F6] border border-[#EBE6DC] rounded-xl flex items-center justify-between text-[10.5px] text-neutral-700 font-sans">
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

                                  {/* Row 2: Notes / Additional Data (Only rendered when content exists) */}
                                  {(() => {
                                    const hasNotes = Boolean(block.internalNotes && block.internalNotes.trim());
                                    const hasDistance = Boolean(block.distance);

                                    if (!hasNotes && !hasDistance) return null;

                                    return (
                                      <div className="py-0.5 text-xs text-neutral-500 flex flex-wrap gap-4 justify-between items-start leading-relaxed">
                                        {/* Notes / Description */}
                                        <div className="flex-1 min-w-[200px] text-left font-light text-[11px]">
                                          {hasNotes ? block.internalNotes : null}
                                        </div>

                                        {/* Distance */}
                                        {hasDistance && (
                                          <div className="flex flex-col items-end shrink-0 space-y-0.5 text-[9.5px]">
                                            <span className="font-semibold text-neutral-500">
                                              Distance: {block.distance}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}

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
                  const genericPolicyText = appSettings?.[Settings.Policy_Generic] || '';
                  const tierKey = travelStyle ? getTierPolicyKey(travelStyle) : null;
                  const tierPolicyText = (tierKey && appSettings?.[tierKey]) || '';

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

                  const rawPolicies = isDraft
                    ? parsePolicyLines(appSettings?.[Settings.Policy_Draft] || '')
                    : [
                      ...parsePolicyLines(genericPolicyText),
                      ...parsePolicyLines(tierPolicyText)
                    ];

                  const allPolicies = rawPolicies.filter(p => {
                    if (!p) return false;
                    const cleaned = p.replace(/[\uE000-\uF8FF]/g, '').replace(/^["'\s]+|["'\s]+$/g, '').trim();
                    return /[a-zA-Z0-9]/.test(cleaned);
                  });

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
                                <li key={idx} className="relative pl-6">
                                  <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                                  <span className="font-medium text-[11.5px] text-[#374151]">{policy}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-16 pt-8 border-t border-[#E8DFD1]/55 text-center pb-8 break-inside-avoid max-w-[850px] mx-auto">
                        <div className="mb-6">
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
