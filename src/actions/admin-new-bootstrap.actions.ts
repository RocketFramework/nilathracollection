'use server';

import {
  getTouristDataAction,
  getTourDataAction,
  getDraftVersionsAction,
  getDailyActivitiesAction,
  getQuotationRequestsForTourAction,
  getPurchaseOrdersAction,
  getVendorBookingsAction,
  getRfqEmailsForTourAction,
  getRfpEmailsForTourAction,
  getTourDailyDriversAction,
  getTourDailyTransportsAction,
  getTourDailyVehiclesAction,
  getTourItineraryCountAction,
  getSeamlessConciergeCostItemsAction,
  getTourConciergesAction,
  getItineraryDatesAction,
  getUserRoleAction,
  getAssignedHotelsAction,
  getAssignedRestaurantsAction,
  getVendorsAction,
  getDriversAction,
  getTourGuidesAction,
  getRestaurantsAction,
  getTransportProvidersAction,
  getActivitiesAction,
  getAppMarkupsAction,
  getTransportVehiclesAction,
  getCustomerInvoicesAction,
  getCustomerAdvancePaymentsAction,
  getGuideRfqDetailsAction,
} from '@/actions/admin.actions';
import {
  getPOBlocksAction,
  getTourPORebuildStatusAction,
  getGuideDailyActivitiesAction,
  getDriverDailyActivitiesAction,
} from '@/actions/po-block.actions';
import { getTourPlanningScheduleAction } from '@/actions/tour-planning.actions';
import { AppStateService } from '@/services/app-state.service';

/**
 * Single batched server round-trip for /admin-new initial hydration.
 * Replaces 40+ separate client-side Server Action HTTP POSTs with 1 parallel server execution.
 */
export async function bootstrapAdminNewAction(activeTourId: string, storageKey: string) {
  const hasRealTour = Boolean(activeTourId && activeTourId !== 'draft-tour');

  // Master data + user role always load in parallel
  const masterPromise = Promise.all([
    getVendorsAction(),
    getDriversAction(),
    getTourGuidesAction(),
    getRestaurantsAction(),
    getTransportProvidersAction(),
    getActivitiesAction(),
    getAppMarkupsAction(),
    getTransportVehiclesAction(),
    getUserRoleAction().catch(() => null),
  ]);

  if (!hasRealTour) {
    const [v, d, g, r, tp, act, markupRes, vehiclesRes, roleRes] = await masterPromise;
    return {
      hasRealTour: false,
      roleRes,
      master: {
        hotels: [] as any[],
        vendors: v.success ? v.vendors : [],
        drivers: d.success ? d.drivers : [],
        guides: g.success ? g.guides : [],
        restaurants: r.success ? r.restaurants : [],
        transportProviders: tp.success ? tp.providers : [],
        transportVehicles: vehiclesRes.success ? vehiclesRes.vehicles : [],
        activities: act.success ? (act.data || (act as any).activities || []) : [],
        markups: markupRes?.success ? markupRes.markups : null,
      },
      tour: null,
    };
  }

  const [
    [v, d, g, r, tp, act, markupRes, vehiclesRes, roleRes],
    touristRes,
    tourRes,
    versionsRes,
    daRes,
    appStateRaw,
    quotesRes,
    posRes,
    bookingsRes,
    rfqEmailsRes,
    rfpEmailsRes,
    blocksRes,
    rebuildStatusRes,
    dailyDriversRes,
    dailyTransportsRes,
    dailyVehiclesRes,
    itinCountRes,
    concItemsRes,
    savedConcRes,
    itinDatesRes,
    planningScheduleRes,
  ] = await Promise.all([
    masterPromise,
    getTouristDataAction(activeTourId),
    getTourDataAction(activeTourId),
    getDraftVersionsAction(activeTourId),
    getDailyActivitiesAction(activeTourId),
    AppStateService.getState(storageKey).catch(() => null),
    getQuotationRequestsForTourAction(activeTourId),
    getPurchaseOrdersAction(activeTourId),
    getVendorBookingsAction(activeTourId),
    getRfqEmailsForTourAction(activeTourId),
    getRfpEmailsForTourAction(activeTourId),
    getPOBlocksAction(activeTourId),
    getTourPORebuildStatusAction(activeTourId),
    getTourDailyDriversAction(activeTourId),
    getTourDailyTransportsAction(activeTourId),
    getTourDailyVehiclesAction(activeTourId),
    getTourItineraryCountAction(activeTourId),
    getSeamlessConciergeCostItemsAction({ pageSize: 100 }),
    getTourConciergesAction(activeTourId),
    getItineraryDatesAction(activeTourId),
    getTourPlanningScheduleAction(activeTourId),
  ]);

  // Resolve assigned hotels & restaurants right on the server to avoid a second client round-trip
  const itineraryBlocks: any[] = tourRes?.success && tourRes?.data?.tripData?.itinerary
    ? tourRes.data.tripData.itinerary
    : [];

  const hotelIds = Array.from(
    new Set(
      itineraryBlocks
        .filter((b: any) => b.type === 'sleep' && b.hotelId)
        .map((b: any) => b.hotelId as string)
    )
  );
  const restaurantIds = Array.from(
    new Set(
      itineraryBlocks
        .filter((b: any) => b.type === 'meal' && b.restaurantId)
        .map((b: any) => b.restaurantId as string)
    )
  );

  const [assignedHotelsRes, assignedRestaurantsRes] = await Promise.all([
    hotelIds.length > 0 ? getAssignedHotelsAction(hotelIds) : Promise.resolve({ success: true, hotels: [] }),
    restaurantIds.length > 0 ? getAssignedRestaurantsAction(restaurantIds) : Promise.resolve({ success: true, restaurants: [] }),
  ]);

  const baseRestaurants = r.success && r.restaurants ? r.restaurants : [];
  const existingRestIds = new Set(baseRestaurants.map((item: any) => item.id));
  const extraRestaurants = (assignedRestaurantsRes.success && assignedRestaurantsRes.restaurants ? assignedRestaurantsRes.restaurants : [])
    .filter((item: any) => !existingRestIds.has(item.id));

  return {
    hasRealTour: true,
    roleRes,
    master: {
      hotels: assignedHotelsRes.success && assignedHotelsRes.hotels ? assignedHotelsRes.hotels : [],
      vendors: v.success ? v.vendors : [],
      drivers: d.success ? d.drivers : [],
      guides: g.success ? g.guides : [],
      restaurants: [...baseRestaurants, ...extraRestaurants],
      transportProviders: tp.success ? tp.providers : [],
      transportVehicles: vehiclesRes.success ? vehiclesRes.vehicles : [],
      activities: act.success ? (act.data || (act as any).activities || []) : [],
      markups: markupRes?.success ? markupRes.markups : null,
    },
    tour: {
      touristRes,
      tourRes,
      versionsRes,
      daRes,
      appStateData: appStateRaw ? { state: appStateRaw } : null,
      quotesRes,
      posRes,
      bookingsRes,
      rfqEmailsRes,
      rfpEmailsRes,
      blocksRes,
      rebuildStatusRes,
      dailyDriversRes,
      dailyTransportsRes,
      dailyVehiclesRes,
      itinCountRes,
      concItemsRes,
      savedConcRes,
      itinDatesRes,
      planningScheduleRes,
    },
  };
}

/**
 * Single batched server round-trip for Final Track data loading.
 * Replaces 13 separate Server Action HTTP POSTs with 1 parallel server execution.
 */
export async function loadFinalTrackBundleAction(tid: string) {
  const [
    statusRes,
    blocksRes,
    dbActivitiesRes,
    quotesRes,
    posRes,
    bookingsRes,
    rfqEmailsRes,
    rfpEmailsRes,
    invRes,
    advRes,
    guideActivitiesRes,
    driverActivitiesRes,
    guideRfqRes,
  ] = await Promise.all([
    getTourPORebuildStatusAction(tid),
    getPOBlocksAction(tid),
    getDailyActivitiesAction(tid),
    getQuotationRequestsForTourAction(tid),
    getPurchaseOrdersAction(tid),
    getVendorBookingsAction(tid),
    getRfqEmailsForTourAction(tid),
    getRfpEmailsForTourAction(tid),
    getCustomerInvoicesAction(tid),
    getCustomerAdvancePaymentsAction(tid),
    getGuideDailyActivitiesAction(tid),
    getDriverDailyActivitiesAction(tid),
    getGuideRfqDetailsAction(tid),
  ]);

  return {
    statusRes,
    blocksRes,
    dbActivitiesRes,
    quotesRes,
    posRes,
    bookingsRes,
    rfqEmailsRes,
    rfpEmailsRes,
    invRes,
    advRes,
    guideActivitiesRes,
    driverActivitiesRes,
    guideRfqRes,
  };
}
