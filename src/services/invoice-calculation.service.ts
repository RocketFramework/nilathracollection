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
      customServiceFee
    } = params;

    const invoiceItems: InvoiceItem[] = [];

    // --- CATEGORY 1: ACCOMMODATION & MEALS ---
    const sleepBlocks = itinerary.filter(b => b.type === 'sleep' || b.hotelId);
    const nights = sleepBlocks.length;
    const hotelTotal = sleepBlocks.reduce((sum, b) => sum + (Number(b.agreedPrice) || 0), 0);

    const styleKey = (TravelStyleSettingKeys as Record<string, string>)[travelStyle] || 'luxury';
    
    // Calculate Meal Cost (Lunch cost per tourist * pax)
    const lunchCostKey = `${styleKey}_lunch_cost`;
    const lunchCostPerHead = appSettings && appSettings[lunchCostKey] !== undefined 
      ? Number(appSettings[lunchCostKey]) 
      : 15;

    // Check if there are explicit meal blocks in the itinerary
    const mealBlocks = itinerary.filter(b => b.type === 'meal');
    const mealsTotal = mealBlocks.length > 0
      ? mealBlocks.reduce((sum, b) => sum + (Number(b.agreedPrice) || 0), 0)
      : (pax * lunchCostPerHead * durationDays);

    const sleepMealTotal = hotelTotal + mealsTotal;

    if (sleepMealTotal > 0 || sleepBlocks.length > 0 || mealBlocks.length > 0) {
      const description = nights > 0 
        ? `Luxury Accommodation & Bespoke Dining throughout (${nights} Night${nights > 1 ? 's' : ''})`
        : "Luxury Accommodation & Bespoke Dining throughout";
      invoiceItems.push({
        description,
        amount: sleepMealTotal,
        dailyActivityIds: sleepBlocks.map(b => b.id).concat(mealBlocks.map(b => b.id)).filter(Boolean) as string[]
      });
    }

    // --- CATEGORY 2: PRIVATE TRANSFERS (TRANSPORT) ---
    let transportTotal = 0;
    const dailyActivityIdsTransport: string[] = [];

    if (appSettings && (chauffeurNeeded || guideNeeded)) {
      // Calculate Vehicle & Chauffeur if chauffeurNeeded is true
      if (chauffeurNeeded) {
        // Vehicle Cost
        const vehicleDayRateKey = `${styleKey}_vehicle_day_rate`;
        const vehicleDayRate = Number(appSettings[vehicleDayRateKey]) || 0;
        const transportMarkupPercent = Number(appSettings[Settings.Transport_Markup]) || 0;
        const transportMarkup = transportMarkupPercent / 100;
        const vehicleCost = vehicleDayRate * (1 + transportMarkup);

        // Chauffeur Cost
        const chauffeurDayRateKey = `${styleKey}_chauffeur_day_rate`;
        const chauffeurDayRate = Number(appSettings[chauffeurDayRateKey]) || 0;
        const driverMarkupPercent = appSettings[Settings.Diver_Markup] !== undefined 
          ? Number(appSettings[Settings.Diver_Markup]) 
          : (Number(appSettings[Settings.Driver_Markup]) || 0);
        const driverMarkup = driverMarkupPercent / 100;
        const chauffeurCost = chauffeurDayRate * (1 + driverMarkup);

        transportTotal += (vehicleCost + chauffeurCost) * durationDays;
      }

      // Calculate Guide if guideNeeded is true
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

        transportTotal += guideCost * durationDays;
      }
    }

    // Include any custom train blocks or explicit travel blocks if they have custom agreed prices
    const trainBlocks = itinerary.filter(b => b.type === 'train');
    const trainTotal = trainBlocks.reduce((sum, b) => sum + (Number(b.agreedPrice) || 0), 0);
    transportTotal += trainTotal;

    // Get travel block IDs
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

    // --- CATEGORY 5: SERVICE FEE / CONCIERGE & CURATION ---
    const conciergeCostKey = `${styleKey}_concierge_cost`;
    const conciergeCostPerHead = appSettings && appSettings[conciergeCostKey] !== undefined 
      ? Number(appSettings[conciergeCostKey]) 
      : 40;
    const conciergeTotal = pax * conciergeCostPerHead * durationDays;

    const subtotal = sleepMealTotal + transportTotal + experienceTotal;

    const serviceFeeKey = `${styleKey}_service_fee`;
    const serviceFeePercent = appSettings && appSettings[serviceFeeKey] !== undefined 
      ? Number(appSettings[serviceFeeKey]) 
      : 10;
    const agencyFee = (subtotal + conciergeTotal) * (serviceFeePercent / 100);

    const serviceFeeAmount = customServiceFee !== undefined 
      ? customServiceFee 
      : (conciergeTotal + agencyFee);

    // Get concierge/guide/driver block IDs for linkage
    const curationTypes = ['guide', 'driver', 'buffer', 'wait'];
    const curationBlocks = itinerary.filter(b => curationTypes.includes(b.type || ''));
    
    invoiceItems.push({
      description: "Tax, Support & Nilathra Collection service fee",
      amount: serviceFeeAmount,
      dailyActivityIds: curationBlocks.map(b => b.id).filter(Boolean) as string[]
    });

    return invoiceItems;
  }
}
