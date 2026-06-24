import { InvoiceCalculationService } from '../src/services/invoice-calculation.service';

const result = InvoiceCalculationService.calculateInvoiceItems({
  itinerary: [],
  travelStyle: 'Luxury',
  chauffeurNeeded: true,
  guideNeeded: true,
  appSettings: {
    luxury_vehicle_day_rate: 120,
    luxury_chauffeur_day_rate: 40,
    transport_markup: 10,
    driver_markup: 10,
    guide_national_day_rate: 50,
    tour_guide_markup: 10
  },
  pax: 2,
  durationDays: 5
});

console.log("Calculation Result:", JSON.stringify(result, null, 2));
