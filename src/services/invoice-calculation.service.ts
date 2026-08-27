import { TRAVEL_STYLES, TravelStyleSettingKeys, GUIDE_RATE_KEYS, Settings } from '@/types/types';

export interface InvoiceItem {
  description: string;
  amount: number;
  dailyActivityIds?: string[];
}

export interface InvoiceCalculationParams {
  itinerary: {
    id?: string;
    type: string;
    agreedPrice?: number;
    hotelId?: string;
    quantity?: number;
    dayNumber: number;
  }[];
  travelStyle: string;
  chauffeurNeeded: boolean;
  guideNeeded: boolean;
  appSettings: any;
  pax: number;
  durationDays: number;
  flightsQuotedSeparately?: boolean;
  flightsQuotedPrice?: number;
  customServiceFee?: number;
  dayCostOverrides?: Record<number, {
    hotel?: number;
    meals?: number;
    transport?: number;
    concierge?: number;
    agencyFeePercent?: number;
    agencyFee?: number;
    total?: number;
  }>;
  dailyDriverAssignments?: Record<number, any[]>;
  dailyVehicleAssignments?: Record<number, any[]>;
  dbActivities?: any[];
  tourConcierges?: any[];
}

export class InvoiceCalculationService {
  static calculateInvoiceItems(params: InvoiceCalculationParams): InvoiceItem[] {
    const {
      itinerary,
      travelStyle,
      chauffeurNeeded,
      guideNeeded,
      appSettings,
      pax,
      durationDays,
      flightsQuotedSeparately = false,
      flightsQuotedPrice = 0,
      customServiceFee,
      dayCostOverrides = {},
      dailyDriverAssignments = {},
      dailyVehicleAssignments = {},
      dbActivities = [],
      tourConcierges
    } = params;

    const invoiceItems: InvoiceItem[] = [];
    const styleKey = (TravelStyleSettingKeys as Record<string, string>)[travelStyle] || 'luxury';

    // --- Resolve lunch/meals default rates ---
    const lunchCostKey = `${styleKey}_lunch_cost`;
    const lunchCostPerHead = appSettings && appSettings[lunchCostKey] !== undefined 
      ? Number(appSettings[lunchCostKey]) 
      : 15;

    // --- Calculate base transport rates ---
    const isGuideActive = Boolean(guideNeeded) && (guideNeeded as any) !== 'false';
    const isChauffeurActive = Boolean(chauffeurNeeded) && (chauffeurNeeded as any) !== 'false';

    let baseDailyTransportCost = 0;
    if (appSettings && (isChauffeurActive || isGuideActive)) {
      if (isChauffeurActive) {
        const vehicleDayRateKey = `${styleKey}_vehicle_day_rate`;
        const vehicleDayRate = Number(appSettings[vehicleDayRateKey]) || 0;
        const transportMarkupPercent = Number(appSettings[Settings.Transport_Markup]) || 0;
        const transportMarkup = transportMarkupPercent / 100;
        const vehicleCost = vehicleDayRate * (1 + transportMarkup);

        const chauffeurDayRateKey = `${styleKey}_chauffeur_day_rate`;
        const chauffeurDayRate = Number(appSettings[chauffeurDayRateKey]) || 0;
        const driverMarkupPercent = appSettings[Settings.Diver_Markup] !== undefined 
          ? Number(appSettings[Settings.Diver_Markup]) 
          : (Number(appSettings[Settings.Driver_Markup]) || 0);
        const driverMarkup = driverMarkupPercent / 100;
        const chauffeurCost = chauffeurDayRate * (1 + driverMarkup);

        baseDailyTransportCost += vehicleCost + chauffeurCost;
      }

      if (isGuideActive) {
        let guideDayRateKey: string = GUIDE_RATE_KEYS.NATIONAL;
        if (travelStyle === TRAVEL_STYLES.REGULAR) {
          guideDayRateKey = GUIDE_RATE_KEYS.LOCATION;
        } else if (travelStyle === TRAVEL_STYLES.PREMIUM) {
          guideDayRateKey = GUIDE_RATE_KEYS.REGULAR;
        } else if (travelStyle === TRAVEL_STYLES.LUXURY || travelStyle === TRAVEL_STYLES.ULTRA_VIP) {
          guideDayRateKey = GUIDE_RATE_KEYS.NATIONAL;
        }

        const guideDayRate = Number(appSettings[guideDayRateKey]) || 0;
        const tourGuideMarkupPercent = Number(appSettings[Settings.Tour_Guide_Markup]) || 0;
        const tourGuideMarkup = tourGuideMarkupPercent / 100;
        const guideCost = guideDayRate * (1 + tourGuideMarkup);

        baseDailyTransportCost += guideCost;
      }
    }

    // --- Iterative Day-by-Day calculations ---
    let hotelTotal = 0;
    let mealsTotal = 0;
    let transportTotal = 0;
    let conciergeTotal = 0;
    let agencyFeeTotal = 0;

    // Calculate concierge total from tourConcierges table items if passed and has items
    let hasCustomConcierge = false;
    if (tourConcierges !== undefined && tourConcierges !== null && tourConcierges.length > 0) {
      const calculatedCustomConcierge = (tourConcierges || []).reduce((sum, item) => {
        const cost = Number(item.cost ?? item.default_cost ?? item.cost_item?.default_cost ?? 0);
        const qty = Number(item.quantity || 1);
        const lineCost = cost * qty;

        const costingBasis = (item.costing_basis || item.cost_item?.costing_basis || '').toLowerCase();
        const isDaily = costingBasis.includes('day') || costingBasis.includes('daily');
        const isSpecificDay = Boolean(item.tour_itinerary_id);

        const effectiveCost = isDaily && !isSpecificDay ? lineCost * durationDays : lineCost;
        return sum + effectiveCost;
      }, 0);

      if (calculatedCustomConcierge > 0) {
        conciergeTotal = calculatedCustomConcierge;
        hasCustomConcierge = true;
      }
    }

    const conciergeCostKey = `${styleKey}_concierge_cost`;
    const conciergeCostPerHead = appSettings && appSettings[conciergeCostKey] !== undefined 
      ? Number(appSettings[conciergeCostKey]) 
      : 40;

    const serviceFeeKey = `${styleKey}_service_fee`;
    const serviceFeePercent = appSettings && appSettings[serviceFeeKey] !== undefined 
      ? Number(appSettings[serviceFeeKey]) 
      : 10;

    const sleepBlocks = itinerary.filter(b => b.type === 'sleep');
    const nights = Math.min(sleepBlocks.length, Math.max(0, durationDays - 1));

    let baseSubtotalTotal = 0;

    for (let d = 1; d <= durationDays; d++) {
      const overrides = dayCostOverrides[d] || {};

      // 1. Accommodation
      const daySleepBlocks = itinerary.filter(b => b.dayNumber === d && b.type === 'sleep');
      const baseHotelCost = daySleepBlocks.reduce((sum, b) => sum + (Number(b.agreedPrice) || 0), 0);
      const hotelCost = overrides.hotel !== undefined ? overrides.hotel : baseHotelCost;
      hotelTotal += hotelCost;

      // 2. Meals (only include explicit meal costs from dbActivities, itinerary agreedPrice, or overrides)
      let baseMealsCost = 0;
      if (dbActivities && dbActivities.length > 0) {
        const dayMealActs = dbActivities.filter(da => {
          const actDay = da.tour_itineraries?.day_number || da.day_number || da.dayNumber || 1;
          const actType = da.activity_type || da.type || '';
          return actType === 'meal' && Number(actDay) === Number(d);
        });
        baseMealsCost = dayMealActs.reduce((sum, da) => sum + (Number(da.charged_total_price ?? da.agreedPrice ?? da.total_price ?? 0)), 0);
      } else {
        const dayMealBlocks = itinerary.filter(b => b.dayNumber === d && b.type === 'meal');
        baseMealsCost = dayMealBlocks.reduce((sum, b) => sum + (Number(b.agreedPrice) || 0), 0);
      }
      const mealsCost = overrides.meals !== undefined ? overrides.meals : baseMealsCost;
      mealsTotal += mealsCost;

      // 3. Transport
      let dayTransportCost = 0;
      const assignedDrivers = dailyDriverAssignments[d] || [];
      const assignedVehicles = dailyVehicleAssignments[d] || [];

      if (assignedDrivers.length > 0 || assignedVehicles.length > 0) {
        assignedDrivers.forEach((drv: any) => {
          dayTransportCost += Number(drv.charged_per_day_rate ?? drv.contracted_per_day_rate ?? drv.per_day_rate ?? 0);
        });
        assignedVehicles.forEach((veh: any) => {
          dayTransportCost += Number(veh.charged_per_day_rate ?? veh.contracted_per_day_rate ?? veh.per_day_rate ?? 0);
        });
      } else {
        dayTransportCost = baseDailyTransportCost;
      }

      // Fallback transport cost using KM rate if dayTransportCost is still 0
      if (dayTransportCost === 0) {
        const kmRateKey = `${styleKey}_vehicle_km_rate`;
        const kmRate = Number(appSettings?.[kmRateKey]) || 0.50;
        const dayBlocks = itinerary.filter(b => b.dayNumber === d);
        const dayKm = dayBlocks.reduce((sum, b) => {
          if (!(b as any).distance) return sum;
          const parsed = parseFloat((b as any).distance.toString().replace(/[^\d.]/g, ''));
          return sum + (isNaN(parsed) ? 0 : parsed);
        }, 0);
        dayTransportCost = dayKm * kmRate;
      }

      if (overrides.transport !== undefined) {
        dayTransportCost = overrides.transport;
      }
      transportTotal += dayTransportCost;

      // 4. Concierge (only include explicit custom concierges or overrides)
      let conciergeCost = overrides.concierge !== undefined ? overrides.concierge : 0;
      if (hasCustomConcierge && overrides.concierge === undefined && durationDays > 0) {
        conciergeCost = conciergeTotal / durationDays;
      }

      // 5. Daily Agency Fee (applied to hotel, meals, transport, concierge)
      const subtotalDaily = hotelCost + mealsCost + dayTransportCost + conciergeCost;
      baseSubtotalTotal += subtotalDaily;
      const feePercent = overrides.agencyFeePercent !== undefined ? overrides.agencyFeePercent : serviceFeePercent;
      const dayAgencyFee = overrides.agencyFee !== undefined ? overrides.agencyFee : (subtotalDaily * (feePercent / 100));
      agencyFeeTotal += dayAgencyFee;
    }

    // --- CATEGORY 1: ACCOMMODATION ---
    if (hotelTotal > 0 || sleepBlocks.length > 0) {
      const description = nights > 0 
        ? `Luxury Accommodation throughout (${nights} Night${nights > 1 ? 's' : ''})`
        : "Luxury Accommodation throughout";
      invoiceItems.push({
        description,
        amount: hotelTotal,
        dailyActivityIds: sleepBlocks.map(b => b.id).filter(Boolean) as string[]
      });
    }

    // --- CATEGORY 2: DINING & MEALS ---
    const mealBlocks = itinerary.filter(b => b.type === 'meal');
    if (mealsTotal > 0) {
      invoiceItems.push({
        description: "Bespoke Dining & Culinary Experiences",
        amount: mealsTotal,
        dailyActivityIds: mealBlocks.map(b => b.id).filter(Boolean) as string[]
      });
    }

    // --- CATEGORY 3: PRIVATE TRANSFERS & TRANSPORT ---
    const trainBlocks = itinerary.filter(b => b.type === 'train');
    const trainTotal = trainBlocks.reduce((sum, b) => sum + (Number(b.agreedPrice) || 0), 0);

    transportTotal += trainTotal;

    const dailyActivityIdsTransport: string[] = [];
    const travelBlocks = itinerary.filter(b => b.type === 'travel' || b.type === 'train');
    travelBlocks.forEach(b => {
      if (b.id) dailyActivityIdsTransport.push(b.id);
    });

    if (transportTotal > 0 || travelBlocks.length > 0 || isChauffeurActive || isGuideActive) {
      let description = "Private Transfers & Transport Logistics throughout";
      if (isChauffeurActive && isGuideActive) {
        description = "Private Chauffeur-driven transfers & National Guide services throughout";
      } else if (isChauffeurActive) {
        description = "Private Chauffeur-driven transfers throughout";
      } else if (isGuideActive) {
        description = "National Guide services throughout";
      } else if (trainTotal > 0) {
        description = "Private transfers & train travel throughout";
      }

      invoiceItems.push({
        description,
        amount: transportTotal,
        dailyActivityIds: dailyActivityIdsTransport
      });
    }

    // --- CATEGORY 4: CURATED ACTIVITIES & EXPERIENCES ---
    const experienceBlocks = itinerary.filter(b => b.type === 'activity' || b.type === 'custom');
    const itineraryActTotal = experienceBlocks.reduce((sum, b) => sum + (Number(b.agreedPrice) || 0), 0);
    
    let dbActTotal = 0;
    if (dbActivities && dbActivities.length > 0) {
      const actItems = dbActivities.filter(da => {
        const actType = da.activity_type || da.type || '';
        return actType !== 'meal' && actType !== 'sleep' && actType !== 'travel';
      });
      dbActTotal = actItems.reduce((sum, da) => sum + (Number(da.charged_total_price ?? da.total_price ?? 0)), 0);
    }

    const experienceTotal = Math.max(itineraryActTotal, dbActTotal);

    if (experienceTotal > 0 || experienceBlocks.length > 0) {
      invoiceItems.push({
        description: "Curated Activities & Experiences throughout",
        amount: experienceTotal,
        dailyActivityIds: experienceBlocks.map(b => b.id).filter(Boolean) as string[]
      });
    }

    // --- CATEGORY 5: FLIGHTS ---
    if (flightsQuotedSeparately) {
      invoiceItems.push({
        description: flightsQuotedPrice > 0 ? "International Airfare — Booked & Confirmed" : "International airfare excluded",
        amount: flightsQuotedPrice,
        dailyActivityIds: []
      });
    }

    // --- CATEGORY 6: CONCIERGE & SUPPORT ---
    if (conciergeTotal > 0) {
      invoiceItems.push({
        description: "Bespoke Concierge & Destination Support",
        amount: conciergeTotal,
        dailyActivityIds: []
      });
    }

    // --- CATEGORY 7: TAX & SERVICE FEE ---
    const serviceFeeAmount = customServiceFee !== undefined 
      ? customServiceFee 
      : agencyFeeTotal;

    const effectiveFeePercent = baseSubtotalTotal > 0
      ? parseFloat(((serviceFeeAmount / baseSubtotalTotal) * 100).toFixed(2))
      : serviceFeePercent;

    const effectiveFeePercentStr = (effectiveFeePercent % 1 === 0)
      ? effectiveFeePercent.toFixed(0)
      : effectiveFeePercent.toFixed(1);

    const curationTypes = ['guide', 'driver', 'buffer', 'wait'];
    const curationBlocks = itinerary.filter(b => curationTypes.includes(b.type || ''));
    
    invoiceItems.push({
      description: `Tax & Nilathra Collection Service Fee (${effectiveFeePercentStr}%)`,
      amount: serviceFeeAmount,
      dailyActivityIds: curationBlocks.map(b => b.id).filter(Boolean) as string[]
    });

    return invoiceItems;
  }
}
