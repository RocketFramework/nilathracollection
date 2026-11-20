import React from 'react';
import { InternalItineraryBlock } from '@/other/interfaces';
import { TouristDataDTO } from '@/dtos/tourist-data.dto';
import { TravelStyle, ItineraryBlockTypes } from '@/types/types';
import { computePdfCostSummary, PdfCostSummaryBlock } from './PdfCostSummary';

interface ItineraryPdfTemplateHotelsInvoiceProps {
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
  conciergeTotal?: number;
  singleRoomsCount?: number;
  doubleRoomsCount?: number;
  tripleRoomsCount?: number;
  familyRoomsCount?: number;
  tripStatus?: string;
}

interface GroupedHotelStay {
  key: string;
  hotelId?: string;
  hotelName: string;
  starClass: string;
  location: string;
  address: string;
  photoUrl: string;
  description: string;
  startDay: number;
  endDay: number;
  nightsCount: number;
  checkInDate: string;
  checkOutDate: string;
  mealPlans: string[];
  roomsSummary: Array<{ label: string; qty: number; mealPlan: string }>;
}

/**
 * Curated Hotels & Invoice Only PDF template for the AI Builder step.
 * Displays each hotel stay with a full-width hotel photograph, location, dates, class,
 * room categories & meal plan, followed by the shared InvoiceCalculationService cost summary.
 */
export const ItineraryPdfTemplateHotelsInvoice = React.forwardRef<
  HTMLDivElement,
  ItineraryPdfTemplateHotelsInvoiceProps
>((props, ref) => {
  const {
    itinerary,
    touristData,
    travelStyle,
    guideNeeded,
    chauffeurNeeded,
    masterData,
    accommodations
  } = props;

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
    conciergeTotal: props.conciergeTotal,
    accommodations: props.accommodations
  });
  const { durationDays } = costSummary;

  const adults = touristData.preferences?.adults || 0;
  const children = touristData.preferences?.children || 0;
  const infants = touristData.preferences?.infants || 0;
  const arrivalDate = touristData.preferences?.arrival_date || '';
  const departureDate = touristData.preferences?.departure_date || '';

  const getAbsoluteUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
    }
    return url;
  };

  const formatOffsetDate = (offsetDays: number) => {
    if (!arrivalDate) return '';
    const d = new Date(arrivalDate);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Collect sleep blocks ordered by dayNumber and group consecutive nights at the same hotel
  const sleepBlocks = [...itinerary]
    .filter((b) => b.type === ItineraryBlockTypes.SLEEP)
    .sort((a, b) => Number(a.dayNumber) - Number(b.dayNumber));

  const hotelStays: GroupedHotelStay[] = [];

  for (const block of sleepBlocks) {
    const dayNum = Number(block.dayNumber);
    const acc = accommodations?.find((a: any) => Number(a.nightIndex) === dayNum);
    const hotelDetail = masterData?.hotels?.find(
      (h: any) =>
        (block.hotelId && h.id === block.hotelId) ||
        (acc?.hotelId && h.id === acc.hotelId) ||
        (block.hotelName && h.name?.toLowerCase() === block.hotelName.toLowerCase()) ||
        (acc?.hotelName && h.name?.toLowerCase() === acc.hotelName.toLowerCase())
    );

    const resolvedHotelId = block.hotelId || acc?.hotelId || hotelDetail?.id;
    const resolvedHotelName =
      hotelDetail?.name || block.hotelName || acc?.hotelName || block.name || 'Curated Hotel Selection';
    const starClass =
      hotelDetail?.hotel_class ||
      hotelDetail?.star_rating ||
      acc?.stayClass ||
      '';
    const city = hotelDetail?.closest_city || block.locationName || '';
    const fullAddress = hotelDetail?.location_address || acc?.address || '';
    const location = city && fullAddress && !fullAddress.toLowerCase().includes(city.toLowerCase())
      ? `${city} — ${fullAddress}`
      : (fullAddress || city || 'Sri Lanka');

    const rawPhoto =
      (block.imageUrl && block.imageUrl !== 'none' ? block.imageUrl : '') ||
      (Array.isArray(hotelDetail?.images) && hotelDetail.images.length > 0 ? hotelDetail.images[0] : '') ||
      hotelDetail?.photo_url ||
      '';
    const photoUrl = rawPhoto ? getAbsoluteUrl(rawPhoto) : '';
    const description = hotelDetail?.description || hotelDetail?.short_description || '';

    const selRooms: any[] = Array.isArray(acc?.selectedRooms) && acc.selectedRooms.length > 0
      ? acc.selectedRooms.filter((r: any) => Number(r.quantity || 0) > 0)
      : [];

    const nightRooms: Array<{ label: string; qty: number; mealPlan: string }> =
      selRooms.length > 0
        ? selRooms.map((r: any) => ({
            label: r.roomName || r.room_name || r.reqId || r.roomStandard || 'Standard Room',
            qty: Number(r.quantity || 1),
            mealPlan: r.mealPlan || acc?.mealPlan || block.mealPlan || 'BB'
          }))
        : [
            {
              label: block.roomName || acc?.roomName || 'Standard Room',
              qty: Number(block.quantity || acc?.numberOfRooms || 1),
              mealPlan: block.mealPlan || acc?.mealPlan || 'BB'
            }
          ];

    const nightMealPlans = Array.from(new Set(nightRooms.map((r) => r.mealPlan).filter(Boolean)));

    const prev = hotelStays[hotelStays.length - 1];
    const isConsecutiveSameHotel =
      prev &&
      prev.endDay === dayNum - 1 &&
      ((resolvedHotelId && prev.hotelId && resolvedHotelId === prev.hotelId) ||
        prev.hotelName.toLowerCase() === resolvedHotelName.toLowerCase());

    if (isConsecutiveSameHotel) {
      prev.endDay = dayNum;
      prev.nightsCount += 1;
      prev.checkOutDate = formatOffsetDate(dayNum);
      nightMealPlans.forEach((mp) => {
        if (!prev.mealPlans.includes(mp)) prev.mealPlans.push(mp);
      });
      if (!prev.photoUrl && photoUrl) prev.photoUrl = photoUrl;
    } else {
      hotelStays.push({
        key: `${resolvedHotelId || resolvedHotelName}-${dayNum}`,
        hotelId: resolvedHotelId,
        hotelName: resolvedHotelName,
        starClass,
        location,
        address: fullAddress,
        photoUrl,
        description,
        startDay: dayNum,
        endDay: dayNum,
        nightsCount: 1,
        checkInDate: formatOffsetDate(dayNum - 1),
        checkOutDate: formatOffsetDate(dayNum),
        mealPlans: nightMealPlans,
        roomsSummary: nightRooms
      });
    }
  }

  return (
    <div
      ref={ref}
      className="bg-white mx-auto font-sans antialiased text-[#1F2937]"
      style={{
        width: '210mm',
        minHeight: '297mm',
        backgroundColor: '#FFFFFF',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body { background: white !important; margin: 0 !important; padding: 0 !important; }
              .print-page-break { page-break-after: always; break-after: page; }
              .print-page-before { page-break-before: always; break-before: page; }
              .print-avoid-break { page-break-inside: avoid; break-inside: avoid; }
            }
          `
        }}
      />

      {/* PAGE 1: Branded Header + Journey Summary + Accommodation Schedule Overview */}
      <div className={hotelStays.length > 0 ? 'print-page-break' : ''}>
        <div className="print-avoid-break px-10 pt-10 pb-7 border-b-2 border-[#D4AF37] bg-[#FAF9F6]">
          <div className="flex items-start justify-between gap-6">
            <div>
              <span className="text-[10px] text-[#8C6D3F] uppercase tracking-[0.35em] font-bold block">
                Nilathra Collection
              </span>
              <h1 className="text-2xl font-serif text-[#0A251D] mt-1.5 font-bold">
                Curated Hotels &amp; Investment Summary
              </h1>
              <p className="text-xs text-neutral-500 mt-1">
                Prepared exclusively for <strong className="text-[#111827]">{clientName}</strong>
              </p>
            </div>
            <img
              src={getAbsoluteUrl('/images/nilathra_logo-02.webp')}
              alt="Nilathra Collection"
              style={{ height: '60px', width: 'auto', objectFit: 'contain' }}
            />
          </div>

          <div className="mt-5 pt-4 border-t border-[#E8DFD1] grid grid-cols-2 gap-x-8 gap-y-2 text-[11px] text-neutral-600">
            <span>
              <strong className="text-[#0A251D]">Guests:</strong> {adults} Adults
              {children > 0 ? `, ${children} Children` : ''}
              {infants > 0 ? `, ${infants} Infants` : ''}
            </span>
            <span>
              <strong className="text-[#0A251D]">Duration:</strong> {durationDays} Days /{' '}
              {durationDays > 1 ? durationDays - 1 : 1} Nights
            </span>
            <span>
              <strong className="text-[#0A251D]">Travel Style:</strong> {travelStyle}
            </span>
            <span>
              <strong className="text-[#0A251D]">Travel Window:</strong>{' '}
              {arrivalDate
                ? `${new Date(arrivalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${
                    departureDate
                      ? new Date(departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'TBD'
                  }`
                : 'Dates to be confirmed'}
            </span>
            <span className="col-span-2">
              <strong className="text-[#0A251D]">Included Services:</strong>{' '}
              {[chauffeurNeeded ? 'Private Chauffeur' : null, guideNeeded ? 'National Guide' : null]
                .filter(Boolean)
                .join(' & ') || 'Standard Package'}
            </span>
          </div>
        </div>

        {/* At-a-Glance Accommodation Portfolio Summary Table */}
        <div className="px-10 py-8 space-y-4">
          <div className="flex items-baseline justify-between border-b border-[#E8DFD1] pb-2">
            <div>
              <span className="text-[9px] uppercase tracking-[0.28em] text-[#8C6D3F] font-bold block">
                Handpicked Stays Overview
              </span>
              <h2 className="text-lg font-serif font-bold text-[#0A251D] mt-0.5">
                Accommodation Portfolio ({hotelStays.length}{' '}
                {hotelStays.length === 1 ? 'Property' : 'Properties'})
              </h2>
            </div>
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
              {sleepBlocks.length} Total {sleepBlocks.length === 1 ? 'Night' : 'Nights'}
            </span>
          </div>

          {hotelStays.length === 0 ? (
            <p className="text-xs text-neutral-400 italic py-4">
              No hotels have been assigned to this itinerary yet.
            </p>
          ) : (
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-[#0A251D] text-white uppercase tracking-wider text-[9px]">
                  <th className="py-2.5 px-3 font-bold rounded-tl-lg">Stay</th>
                  <th className="py-2.5 px-3 font-bold">Hotel &amp; Class</th>
                  <th className="py-2.5 px-3 font-bold">Location</th>
                  <th className="py-2.5 px-3 font-bold">Dates</th>
                  <th className="py-2.5 px-3 font-bold text-center rounded-tr-lg">Nights</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFD1] border border-[#E8DFD1]">
                {hotelStays.map((stay, idx) => (
                  <tr key={`summary-${stay.key}`} className={idx % 2 === 1 ? 'bg-[#FAF9F6]' : 'bg-white'}>
                    <td className="py-2.5 px-3 font-bold text-[#8C6D3F] whitespace-nowrap">
                      {stay.startDay === stay.endDay ? `Day ${stay.startDay}` : `Days ${stay.startDay}–${stay.endDay}`}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[#111827]">{stay.hotelName}</div>
                      {stay.starClass && (
                        <div className="text-[9px] text-[#8C6D3F] font-semibold">{stay.starClass}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600">{stay.location}</td>
                    <td className="py-2.5 px-3 text-neutral-600 whitespace-nowrap">
                      {stay.checkInDate ? `${stay.checkInDate} → ${stay.checkOutDate}` : `Night ${stay.startDay}`}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-[#0A251D]">
                      {stay.nightsCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* DEDICATED FULL PAGE PER HOTEL */}
      {hotelStays.map((stay, idx) => (
        <div
          key={stay.key}
          className="print-page-break px-10 py-8 flex flex-col justify-between"
          style={{ minHeight: '285mm' }}
        >
          <div className="space-y-5">
            {/* Compact Top Running Header */}
            <div className="flex items-center justify-between border-b border-[#D4AF37] pb-3">
              <div>
                <span className="text-[9px] uppercase tracking-[0.3em] text-[#8C6D3F] font-bold block">
                  Nilathra Collection · Curated Stay {idx + 1} of {hotelStays.length}
                </span>
                <h2 className="text-xl font-serif font-bold text-[#0A251D] mt-0.5">
                  {stay.hotelName}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#0A251D] text-[#D4AF37] inline-block">
                  {stay.startDay === stay.endDay ? `Day ${stay.startDay}` : `Days ${stay.startDay}–${stay.endDay}`} · {stay.nightsCount} {stay.nightsCount === 1 ? 'Night' : 'Nights'}
                </span>
              </div>
            </div>

            {/* Full Uncropped Hotel Photograph (object-fit: contain so entire image is always visible) */}
            {stay.photoUrl ? (
              <div
                className="w-full rounded-2xl border border-[#E6DFD3] bg-[#FAF9F6] overflow-hidden flex items-center justify-center p-2"
                style={{ maxHeight: '145mm' }}
              >
                <img
                  src={stay.photoUrl}
                  alt={stay.hotelName}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '140mm',
                    objectFit: 'contain',
                    display: 'block',
                    borderRadius: '10px'
                  }}
                />
              </div>
            ) : (
              <div
                className="w-full rounded-2xl border border-[#E6DFD3] bg-[#F5F3EF] flex items-center justify-center text-xs text-neutral-400 italic"
                style={{ height: '70mm' }}
              >
                Hotel photograph not available
              </div>
            )}

            {/* Hotel Details Card */}
            <div className="rounded-2xl border border-[#E6DFD3] bg-white p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {stay.starClass && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#FAF3E0] text-[#8C6D3F] border border-[#E5D2A3]">
                        {stay.starClass}
                      </span>
                    )}
                    {stay.mealPlans.length > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {stay.mealPlans.join(' / ')} Basis
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-600">
                    <strong className="text-[#0A251D]">Location:</strong> {stay.location}
                  </p>
                </div>

                <div className="text-right shrink-0 bg-[#FAF9F6] border border-[#E8DFD1] rounded-xl px-4 py-2.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#8C6D3F] block">
                    Stay Dates ({stay.nightsCount} {stay.nightsCount === 1 ? 'Night' : 'Nights'})
                  </span>
                  {stay.checkInDate ? (
                    <div className="text-[11px] text-neutral-800 font-semibold mt-1 leading-snug">
                      <div>Check-in: {stay.checkInDate}</div>
                      <div>Check-out: {stay.checkOutDate}</div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-neutral-600 mt-1">
                      {stay.startDay === stay.endDay ? `Night ${stay.startDay}` : `Nights ${stay.startDay}–${stay.endDay}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Rooms Selected */}
              <div className="pt-3 border-t border-neutral-100 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                  Selected Room Categories
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {stay.roomsSummary.map((r, rIdx) => (
                    <span
                      key={rIdx}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-[#FAF9F6] border border-[#E5E7EB] text-neutral-800"
                    >
                      {r.qty} × {r.label} ({r.mealPlan})
                    </span>
                  ))}
                </div>
              </div>

              {stay.description && (
                <div className="pt-3 border-t border-neutral-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                    Property Highlights
                  </span>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {stay.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E8DFD1] flex items-center justify-between text-[9px] text-neutral-400 uppercase tracking-widest">
            <span>Nilathra Collection · Private Journey Proposal for {clientName}</span>
            <span>Property {idx + 1} of {hotelStays.length}</span>
          </div>
        </div>
      ))}

      {/* FINAL PAGE: Shared Invoice / Cost Summary (Identical to Detailed PDF, Simple PDF & Customer Invoice) */}
      <div className="print-avoid-break pt-4">
        <PdfCostSummaryBlock summary={costSummary} clientName={clientName} />
      </div>
    </div>
  );
});

ItineraryPdfTemplateHotelsInvoice.displayName = 'ItineraryPdfTemplateHotelsInvoice';
