import React from 'react';
import { InternalItineraryBlock } from '@/other/interfaces';
import { TouristDataDTO } from '@/dtos/tourist-data.dto';
import { TravelStyle, ItineraryBlockTypes } from '@/types/types';
import { InvoiceCalculationService, InvoiceItem } from '@/services/invoice-calculation.service';

/**
 * Single source of truth for the cost summary printed on EVERY PDF template.
 * Any PDF layout must call computePdfCostSummary() and render <PdfCostSummaryBlock />
 * so that the figures are identical across templates (and match the customer invoice,
 * which uses the same InvoiceCalculationService).
 */
export interface PdfCostSummaryInput {
  itinerary: InternalItineraryBlock[];
  touristData: TouristDataDTO;
  travelStyle: TravelStyle;
  guideNeeded: boolean;
  chauffeurNeeded: boolean;
  appSettings?: any;
  masterData?: any;
  dayCostOverrides?: Record<number, any>;
  dailyDriverAssignments?: Record<number, any>;
  dailyVehicleAssignments?: Record<number, any>;
  dbActivities?: any[];
  tourConcierges?: any[];
  accommodations?: any[];
}

export interface PdfCostSummary {
  invoiceItems: InvoiceItem[];
  grandTotal: number;
  hotelPriceTotal: number;
  durationDays: number;
  totalPax: number;
  guests: number;
}

export function computePdfCostSummary(input: PdfCostSummaryInput): PdfCostSummary {
  const {
    itinerary, touristData, travelStyle, guideNeeded, chauffeurNeeded, appSettings, masterData,
    dayCostOverrides, dailyDriverAssignments, dailyVehicleAssignments, dbActivities, tourConcierges, accommodations
  } = input;

  const adults = touristData.preferences?.adults || 0;
  const children = touristData.preferences?.children || 0;
  const infants = touristData.preferences?.infants || 0;
  const totalPax = adults + children + infants;
  const guests = adults + children;

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

  const simplifiedItinerary = itinerary.map(b => ({
    id: b.id,
    type: b.type,
    agreedPrice: b.agreedPrice,
    hotelId: b.hotelId,
    quantity: b.quantity || (b as any).headCount || b.transportQuantity || b.restaurantQuantity || guests || 1,
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
    pax: guests,
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

  return { invoiceItems, grandTotal, hotelPriceTotal, durationDays, totalPax, guests };
}

const usd = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;

/** The one and only rendering of the cost summary, used by every PDF template. */
export const PdfCostSummaryBlock: React.FC<{
  summary: PdfCostSummary;
  clientName: string;
}> = ({ summary, clientName }) => {
  const { invoiceItems, grandTotal, hotelPriceTotal, durationDays, totalPax } = summary;
  return (
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
                  <span className="font-semibold text-neutral-900 font-mono text-sm">{usd(item.amount)}</span>
                </div>
              ))}
            </div>

            {invoiceItems.length > 1 && (
              <div className="flex justify-between items-center pt-2 px-1 text-xs font-semibold text-neutral-600 border-t border-neutral-100">
                <span className="uppercase tracking-wider text-[10px] text-neutral-500 font-sans">Subtotal (Direct Services)</span>
                <span className="font-mono text-sm text-neutral-800">
                  {usd(invoiceItems.filter(i => !i.description.includes('Tax &')).reduce((sum, i) => sum + i.amount, 0))}
                </span>
              </div>
            )}

            <div className="border-t-2 border-[#D4AF37]/40 pt-4 mt-2 flex justify-between items-center text-base font-serif font-black text-neutral-900 bg-[#FAF8F5] p-4 rounded-xl border border-[#E8DFD1]">
              <div className="flex flex-col">
                <span className="uppercase tracking-wider text-[11px] text-[#8C6D3F]">Estimated Grand Total</span>
                <span className="text-[9px] font-sans text-neutral-400 font-normal uppercase tracking-widest">Inclusive of taxes &amp; concierge coordination</span>
              </div>
              <span className="text-2xl font-mono text-[#0A251D] font-extrabold">{usd(grandTotal)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[11px] text-neutral-600 font-medium pt-3 border-t border-neutral-100">
              <div className="bg-[#FAF9F6] p-3 rounded-lg border border-[#EBE6DC] flex justify-between items-center">
                <span>Per Guest Investment ({totalPax} Pax):</span>
                <span className="font-bold text-neutral-900 font-mono text-sm">{usd(grandTotal / (totalPax || 1))}</span>
              </div>
              <div className="bg-[#FAF9F6] p-3 rounded-lg border border-[#EBE6DC] flex justify-between items-center">
                <span>Per Guest (Per Day Rate):</span>
                <span className="font-bold text-neutral-900 font-mono text-sm">{usd(grandTotal / (totalPax || 1) / (durationDays || 1))}</span>
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

        <div className="text-[10px] text-neutral-400 font-serif italic text-center">
          * All prices are quoted in US Dollars (USD) and include all applicable taxes, service charges, fuel tolls, and concierge coordination. Rates are guaranteed upon confirmation.
        </div>
      </div>
    </div>
  );
};
