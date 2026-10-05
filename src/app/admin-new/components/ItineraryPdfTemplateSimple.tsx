import React from 'react';
import { InternalItineraryBlock } from '@/other/interfaces';
import { TouristDataDTO } from '@/dtos/tourist-data.dto';
import { TravelStyle, ItineraryBlockTypes } from '@/types/types';
import { computePdfCostSummary, PdfCostSummaryBlock } from './PdfCostSummary';

interface ItineraryPdfTemplateSimpleProps {
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
  // Accepted for prop-compatibility with the detailed template
  singleRoomsCount?: number;
  doubleRoomsCount?: number;
  tripleRoomsCount?: number;
  familyRoomsCount?: number;
  tripStatus?: string;
}

const typeLabel: Record<string, string> = {
  [ItineraryBlockTypes.ACTIVITY]: 'Activity',
  [ItineraryBlockTypes.SLEEP]: 'Stay',
  [ItineraryBlockTypes.MEAL]: 'Meal',
  [ItineraryBlockTypes.TRAVEL]: 'Transfer',
  [ItineraryBlockTypes.TRAIN]: 'Train'
};

/** Simplified, text-first proposal. Cost summary is shared with the detailed template. */
export const ItineraryPdfTemplateSimple = React.forwardRef<HTMLDivElement, ItineraryPdfTemplateSimpleProps>(
  (props, ref) => {
    const { itinerary, touristData, travelStyle, guideNeeded, chauffeurNeeded } = props;

    const clientName = touristData.profile
      ? `${touristData.profile.first_name || ''} ${touristData.profile.last_name || ''}`.trim() || 'Valued Guest'
      : 'Valued Guest';

    const costSummary = computePdfCostSummary({
      itinerary,
      touristData,
      travelStyle,
      guideNeeded,
      chauffeurNeeded,
      appSettings: props.appSettings,
      masterData: props.masterData,
      dayCostOverrides: props.dayCostOverrides,
      dailyDriverAssignments: props.dailyDriverAssignments,
      dailyVehicleAssignments: props.dailyVehicleAssignments,
      dbActivities: props.dbActivities,
      tourConcierges: props.tourConcierges,
      accommodations: props.accommodations
    });
    const { durationDays, totalPax } = costSummary;

    const adults = touristData.preferences?.adults || 0;
    const children = touristData.preferences?.children || 0;
    const infants = touristData.preferences?.infants || 0;
    const arrivalDate = touristData.preferences?.arrival_date || '';
    const departureDate = touristData.preferences?.departure_date || '';

    const dayDate = (dayNum: number) => {
      if (!arrivalDate) return '';
      const d = new Date(arrivalDate);
      if (isNaN(d.getTime())) return '';
      d.setDate(d.getDate() + (dayNum - 1));
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const days = Array.from({ length: durationDays }, (_, i) => i + 1);

    return (
      <div
        ref={ref}
        className="bg-white mx-auto font-sans antialiased text-[#1F2937]"
        style={{ width: '210mm', minHeight: '297mm', backgroundColor: '#FFFFFF', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white !important; margin: 0 !important; padding: 0 !important; }
            .print-page-break { page-break-after: always; break-after: page; }
            .print-avoid-break { page-break-inside: avoid; break-inside: avoid; }
          }
        ` }} />

        {/* Header */}
        <div className="print-avoid-break px-10 pt-10 pb-6 border-b-2 border-[#D4AF37]">
          <span className="text-[10px] text-[#8C6D3F] uppercase tracking-[0.35em] font-bold block">Nilathra Collection</span>
          <h1 className="text-3xl font-serif text-[#111827] mt-2">Private Journey Proposal — {clientName}</h1>
          <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-neutral-600">
            <span><strong>Guests:</strong> {adults} Adults{children > 0 ? `, ${children} Children` : ''}{infants > 0 ? `, ${infants} Infants` : ''}</span>
            <span><strong>Duration:</strong> {durationDays} Days / {durationDays > 1 ? durationDays - 1 : 1} Nights</span>
            <span><strong>Style:</strong> {travelStyle}</span>
            <span><strong>Travel Window:</strong> {arrivalDate ? `${new Date(arrivalDate).toLocaleDateString()} to ${departureDate ? new Date(departureDate).toLocaleDateString() : 'TBD'}` : 'Dates to be confirmed'}</span>
            <span><strong>Services:</strong> {[chauffeurNeeded ? 'Private chauffeur' : null, guideNeeded ? 'National guide' : null].filter(Boolean).join(' & ') || 'Standard package'}</span>
          </div>
        </div>

        {/* Day by day */}
        <div className="px-10 py-6 space-y-5">
          {days.map(dayNum => {
            const blocks = itinerary.filter(b => b.dayNumber === dayNum);
            return (
              <div key={dayNum} className="print-avoid-break">
                <div className="flex items-baseline justify-between border-b border-neutral-200 pb-1 mb-2">
                  <h2 className="text-sm font-bold text-[#0A251D] uppercase tracking-wider">Day {dayNum}</h2>
                  <span className="text-[10px] text-neutral-500">{dayDate(dayNum)}</span>
                </div>
                {blocks.length === 0 ? (
                  <p className="text-[11px] text-neutral-400 italic">Leisure / no scheduled items.</p>
                ) : (
                  <ul className="space-y-1">
                    {blocks.map(b => (
                      <li key={b.id} className="text-[11px] text-neutral-700 flex gap-3">
                        <span className="w-24 shrink-0 text-neutral-500 font-mono">
                          {b.startTime ? `${b.startTime}${b.endTime ? ` – ${b.endTime}` : ''}` : ''}
                        </span>
                        <span className="w-16 shrink-0 text-[#8C6D3F] uppercase text-[9px] tracking-wider pt-[1px]">
                          {typeLabel[b.type] || 'Item'}
                        </span>
                        <span className="flex-1">
                          {b.type === ItineraryBlockTypes.SLEEP ? (b.hotelName || b.name) : b.name}
                          {b.type === ItineraryBlockTypes.SLEEP && b.mealPlan ? ` (${b.mealPlan})` : ''}
                          {b.locationName ? <span className="text-neutral-400"> · {b.locationName}</span> : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* Shared cost summary (identical to the detailed template and the invoice) */}
        <PdfCostSummaryBlock summary={costSummary} clientName={clientName} />
      </div>
    );
  }
);

ItineraryPdfTemplateSimple.displayName = 'ItineraryPdfTemplateSimple';
