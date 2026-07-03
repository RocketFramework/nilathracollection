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
      dayCostOverrides = {}
    } = params;

    const invoiceItems: InvoiceItem[] = [];
    const styleKey = (TravelStyleSettingKeys as Record<string, string>)[travelStyle] || 'luxury';

    // --- Resolve lunch/meals default rates ---
    const lunchCostKey = `${styleKey}_lunch_cost`;
    const lunchCostPerHead = appSettings && appSettings[lunchCostKey] !== undefined 
      ? Number(appSettings[lunchCostKey]) 
      : 15;

    // --- Calculate base transport rates ---
    let baseDailyTransportCost = 0;
    if (appSettings && (chauffeurNeeded || guideNeeded)) {
      if (chauffeurNeeded) {
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

      if (guideNeeded) {
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

    const conciergeCostKey = `${styleKey}_concierge_cost`;
    const conciergeCostPerHead = appSettings && appSettings[conciergeCostKey] !== undefined 
      ? Number(appSettings[conciergeCostKey]) 
      : 40;

    const serviceFeeKey = `${styleKey}_service_fee`;
    const serviceFeePercent = appSettings && appSettings[serviceFeeKey] !== undefined 
      ? Number(appSettings[serviceFeeKey]) 
      : 10;

    const sleepBlocks = itinerary.filter(b => b.type === 'sleep' || b.hotelId);
    const nights = sleepBlocks.length;

    for (let d = 1; d <= durationDays; d++) {
      const overrides = dayCostOverrides[d] || {};

      // 1. Accommodation
      const daySleepBlocks = itinerary.filter(b => b.dayNumber === d && (b.type === 'sleep' || b.hotelId));
      const baseHotelCost = daySleepBlocks.reduce((sum, b) => sum + (Number(b.agreedPrice) || 0), 0);
      const hotelCost = overrides.hotel !== undefined ? overrides.hotel : baseHotelCost;
      hotelTotal += hotelCost;

      // 2. Meals
      const dayMealBlocks = itinerary.filter(b => b.dayNumber === d && b.type === 'meal');
      const baseMealsCost = dayMealBlocks.length > 0
        ? dayMealBlocks.reduce((sum, b) => sum + (Number(b.agreedPrice) || 0), 0)
        : (pax * lunchCostPerHead);
      const mealsCost = overrides.meals !== undefined ? overrides.meals : baseMealsCost;
      mealsTotal += mealsCost;

      // 3. Transport
      const dayTransportCost = overrides.transport !== undefined ? overrides.transport : baseDailyTransportCost;
      transportTotal += dayTransportCost;

      // 4. Concierge
      const baseConciergeCost = pax * conciergeCostPerHead;
      const conciergeCost = overrides.concierge !== undefined ? overrides.concierge : baseConciergeCost;
      conciergeTotal += conciergeCost;

      // 5. Daily Agency Fee (applied only to hotel, meals, transport, concierge)
      const subtotalDaily = hotelCost + mealsCost + dayTransportCost + conciergeCost;
      const feePercent = overrides.agencyFeePercent !== undefined ? overrides.agencyFeePercent : serviceFeePercent;
      const dayAgencyFee = overrides.agencyFee !== undefined ? overrides.agencyFee : (subtotalDaily * (feePercent / 100));
      agencyFeeTotal += dayAgencyFee;
    }

    // --- CATEGORY 1: ACCOMMODATION & MEALS ---
    const sleepMealTotal = hotelTotal + mealsTotal;
    if (sleepMealTotal > 0 || sleepBlocks.length > 0) {
      const description = nights > 0 
        ? `Luxury Accommodation & Bespoke Dining throughout (${nights} Night${nights > 1 ? 's' : ''})`
        : "Luxury Accommodation & Bespoke Dining throughout";
      invoiceItems.push({
        description,
        amount: sleepMealTotal,
        dailyActivityIds: sleepBlocks.map(b => b.id).filter(Boolean) as string[]
      });
    }

    // --- CATEGORY 2: PRIVATE TRANSFERS (TRANSPORT) ---
    // Add custom train blocks or explicit travel blocks if they have custom agreed prices
    const trainBlocks = itinerary.filter(b => b.type === 'train');
    const trainTotal = trainBlocks.reduce((sum, b) => sum + (Number(b.agreedPrice) || 0), 0);
    transportTotal += trainTotal;

    const dailyActivityIdsTransport: string[] = [];
    const travelBlocks = itinerary.filter(b => b.type === 'travel' || b.type === 'train');
    travelBlocks.forEach(b => {
      if (b.id) dailyActivityIdsTransport.push(b.id);
    });

    if (transportTotal > 0 || travelBlocks.length > 0) {
      let description = "Chauffeur-driven transfers throughout";
      if (chauffeurNeeded && guideNeeded) {
        description = "Private Chauffeur-driven transfers & National Guide services throughout";
      } else if (chauffeurNeeded) {
        description = "Chauffeur-driven transfers throughout";
      } else if (guideNeeded) {
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

    // --- CATEGORY 3: EXPERIENCES ---
    const experienceBlocks = itinerary.filter(b => b.type === 'activity' || b.type === 'custom');
    const experienceTotal = experienceBlocks.reduce((sum, b) => sum + (Number(b.agreedPrice) || 0), 0);
    if (experienceTotal > 0 || experienceBlocks.length > 0) {
      invoiceItems.push({
        description: "Curated Activities & Experiences throughout",
        amount: experienceTotal,
        dailyActivityIds: experienceBlocks.map(b => b.id).filter(Boolean) as string[]
      });
    }

    // --- CATEGORY 4: FLIGHTS ---
    if (flightsQuotedSeparately) {
      invoiceItems.push({
        description: flightsQuotedPrice > 0 ? "International Airfare — Booked & Confirmed" : "International airfare excluded",
        amount: flightsQuotedPrice,
        dailyActivityIds: []
      });
    }

    // --- CATEGORY 5: CONCIERGE & SUPPORT ---
    if (conciergeTotal > 0) {
      invoiceItems.push({
        description: "Bespoke Concierge & Destination Support",
        amount: conciergeTotal,
        dailyActivityIds: []
      });
    }

    // --- CATEGORY 6: SERVICE FEE ---
    const serviceFeeAmount = customServiceFee !== undefined 
      ? customServiceFee 
      : agencyFeeTotal;

    // Get concierge/guide/driver block IDs for linkage
    const curationTypes = ['guide', 'driver', 'buffer', 'wait'];
    const curationBlocks = itinerary.filter(b => curationTypes.includes(b.type || ''));
    
    invoiceItems.push({
      description: `Nilathra Collection Service Fee (${serviceFeePercent}%)`,
      amount: serviceFeeAmount,
      dailyActivityIds: curationBlocks.map(b => b.id).filter(Boolean) as string[]
    });

    return invoiceItems;
  }
}
