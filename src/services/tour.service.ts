
import { CreateTourDTO, AddActivityDTO } from '../dtos/tour.dto';
import { TripData } from '@/app/admin/(authenticated)/planner/types';
import { createClient as createSupabaseClient } from '@/utils/supabase/client';
import { createAdminClient } from '@/utils/supabase/admin';
import { RequestService } from './request.service';

const supabase = createSupabaseClient();

export class TourService {
    static async createTour(dto: CreateTourDTO) {
        const { data, error } = await supabase
            .from('tours')
            .insert({
                request_id: dto.request_id,
                tourist_id: dto.tourist_id,
                agent_id: dto.agent_id,
                title: dto.title,
                start_date: dto.start_date,
                end_date: dto.end_date,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async getToursByStatuses(statuses: string[]) {
        const supabaseAdmin = createAdminClient();
        const { data, error } = await supabaseAdmin
            .from('tours')
            .select(`
                *,
                tourist:users!tours_tourist_id_fkey(
                    email,
                    tourist_profile:tourist_profiles(first_name, last_name, phone)
                ),
                agent:users!tours_agent_id_fkey(
                    email,
                    admin_profile:admin_profiles(first_name, last_name),
                    agent_profile:agent_profiles(first_name, last_name)
                ),
                request:requests(name, email, budget, duration_nights)
            `)
            .in('status', statuses)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    static async updateTourStatus(tourId: string, status: string, userId: string) {
        // Logic to update tour and record history
        const { data: tour, error: tourErr } = await supabase
            .from('tours')
            .update({ status })
            .eq('id', tourId)
            .select()
            .single();
        if (tourErr) throw tourErr;

        await supabase.from('tour_status_history').insert({
            tour_id: tourId,
            status,
            changed_by: userId
        });

        return tour;
    }

    static async addActivity(dto: AddActivityDTO) {
        const { data, error } = await supabase
            .from('daily_activities')
            .insert(dto)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Finds a request and generates a Tour from it if it doesn't already exist.
     * Returns the Tour ID to be used by the Planner.
     */
    static async createTourFromRequest(requestId: string): Promise<string> {
        const supabaseAdmin = createAdminClient();

        // 1. Check if a tour already exists for this request
        const { data: existingTour, error: checkError } = await supabaseAdmin
            .from('tours')
            .select('id')
            .eq('request_id', requestId)
            .maybeSingle();

        if (checkError) throw checkError;
        if (existingTour) return existingTour.id;

        // 2. Fetch the request details
        const { data: requestMsg, error: reqError } = await supabaseAdmin
            .from('requests')
            .select(`
                *,
                details:request_details(*)
            `)
            .eq('id', requestId)
            .single();

        if (reqError) throw reqError;
        if (!requestMsg) throw new Error("Request not found");

        const details = requestMsg.details?.[0] || {};

        // 3. Create the Tour
        const { data: newTour, error: insertError } = await supabaseAdmin
            .from('tours')
            .insert([{
                request_id: requestId,
                tourist_id: requestMsg.tourist_id || null, // Will need non-null tourist_id in future based on schema, if anonymous request this might fail unless triggered
                agent_id: requestMsg.admin_assigned_to || null,
                title: details.package_name || `Custom Tour - ${requestMsg.email || 'Client'}`,
                status: 'Draft',
                start_date: details.start_date || null,
                end_date: details.end_date || null,
            }])
            .select('id')
            .single();

        if (insertError) throw insertError;

        // 3.5 Scaffold Tour Itineraries based on requested duration
        const duration = details.nights || 1;
        const currentDate = details.start_date ? new Date(details.start_date) : null;

        for (let i = 1; i <= duration; i++) {
            let dayDate = null;
            if (currentDate) {
                const d = new Date(currentDate);
                d.setDate(d.getDate() + (i - 1));
                dayDate = d.toISOString().split('T')[0];
            }

            const { data: itin, error: itinErr } = await supabaseAdmin
                .from('tour_itineraries')
                .insert([{
                    tour_id: newTour.id,
                    day_number: i,
                    date: dayDate,
                    title: `Day ${i}`
                }])
                .select('id')
                .single();

            if (!itinErr && itin) {
                // Insert an empty daily_activities record to scaffold the planner experience
                await supabaseAdmin.from('daily_activities').insert([{
                    tour_id: newTour.id,
                    itinerary_id: itin.id,
                    title: 'New Activity',
                    time_start: '09:00:00',
                    time_end: '10:00:00'
                }]);
            } else if (itinErr) {
                console.error(`Failed to scaffold itinerary day ${i}:`, itinErr);
            }
        }

        // 4. Update request status to reflect it's now being planned
        // This will trigger a status update email if the status actually changes
        await RequestService.updateRequestStatus(requestId, { status: 'Assigned' });

        return newTour.id;
    }

    /**
     * Fetches a Tour and reinstates the TripData JSON blob if it exists.
     * If navigating to a fresh tour, it seeds initial data from the request.
     */
    static async getTourData(tourId: string): Promise<{ tripData: Partial<TripData>, tourMsg: Record<string, any> }> {
        const supabaseAdmin = createAdminClient();
        const { data: tourMsg, error } = await supabaseAdmin
            .from('tours')
            .select(`
                *,
                request:requests(
                    email, 
                    name,
                    phone_number,
                    note,
                    budget,
                    start_date,
                    duration_nights,
                    adults,
                    children,
                    infants,
                    details:request_details(*)
                ),
                tourist:users!tours_tourist_id_fkey(
                    email,
                    tourist_profile:tourist_profiles(first_name, last_name, phone)
                )
            `)
            .eq('id', tourId)
            .single();

        if (error) throw error;

        const plannerData = tourMsg.planner_data;

        // If the planner data has already been saved before, return it perfectly mapped
        if (plannerData && Object.keys(plannerData).length > 0) {
            return { tripData: { ...plannerData, id: tourId } as TripData, tourMsg };
        }

        // Otherwise seed it from the request_details
        const reqInfo = tourMsg.request;
        const details = reqInfo?.details?.[0] || {};
        const tourist = tourMsg.tourist;
        const touristProfile = tourist?.tourist_profile?.[0] || {};

        const seedData: Partial<TripData> = {
            id: tourId,
            clientName: reqInfo?.name || (touristProfile.first_name ? `${touristProfile.first_name} ${touristProfile.last_name}` : (reqInfo?.email || 'New Client Inquiry')),
            clientEmail: reqInfo?.email || tourist?.email || '',
            clientPhone: reqInfo?.phone_number?.toString() || touristProfile.phone || '',
            status: tourMsg.status as TripData['status'],
            profile: {
                adults: reqInfo?.adults || details.adults || 2,
                children: reqInfo?.children || details.children || 0,
                infants: reqInfo?.infants || 0,
                arrivalDate: reqInfo?.start_date || details.start_date || '',
                departureDate: details.end_date || (() => {
                    const start = reqInfo?.start_date || details.start_date;
                    const nights = reqInfo?.duration_nights || details.nights;
                    if (start && nights) {
                        const d = new Date(start);
                        d.setDate(d.getDate() + nights);
                        return d.toISOString().split('T')[0];
                    }
                    return '';
                })(),
                durationDays: (reqInfo?.duration_nights || details.nights || 0) + ((reqInfo?.start_date || details.start_date) ? 1 : 0),
                budgetTotal: reqInfo?.budget || details.estimated_price || 0,
                budgetPerPerson: (reqInfo?.budget || details.estimated_price) && (reqInfo?.adults || details.adults)
                    ? (reqInfo?.budget || details.estimated_price) / (reqInfo?.adults || details.adults)
                    : 0,
                travelStyle: details.budget_tier ? 'Premium' : 'Luxury',
                specialConditions: {
                    dietary: details.special_requirements ? 'See internal notes' : '',
                    medical: '',
                    accessibility: '',
                    language: 'English',
                    occasion: reqInfo?.note || details?.special_requirements || ''
                }
            },
            serviceScopes: [],
            flights: [], accommodations: [], transports: [], activities: [], itinerary: [],
            financials: {
                costs: { flights: 0, hotels: 0, transport: 0, activities: 0, guide: 0, misc: 0, commission: 0, tax: 0 },
                purchaseOrders: [],
                supplierInvoices: [],
                sellingPrice: reqInfo?.budget || details.estimated_price || 0
            }
        };

        return { tripData: seedData, tourMsg };
    }

    /**
     * Saves the robust TripData UI state perfectly into a JSONB column to prevent data loss.
     * Also systematically maps `tripData.itinerary` to `tour_itineraries` and `daily_activities` 
     * table rows for reporting / operations!
     */
    static async saveTour(tourId: string, tripData: TripData) {
        const supabaseAdmin = createAdminClient();

        // Dynamically recalculate itinerary summary to prevent React state staleness
        const blocks = tripData.itinerary || [];
        const processedDistances = new Set<string>();

        let totalKm = 0;
        let totalCities = new Set<string>();
        let totalActivities = 0;
        const activityMix: Record<string, number> = {};

        // Fetch activity categories for mix computation
        const { data: actData } = await supabaseAdmin.from('activities').select('id, category');
        const catMap = new Map(actData?.map(a => [a.id, a.category]) || []);

        blocks.forEach(b => {
            if (b.distance) {
                const num = parseInt(b.distance.toString().replace(/[^0-9]/g, ''));
                if (!isNaN(num) && num > 0) {
                    const dedupeKey = `${b.dayNumber}-${b.locationName}-${num}`;
                    if (!processedDistances.has(dedupeKey)) {
                        processedDistances.add(dedupeKey);
                        totalKm += num;
                    }
                }
            }
            if (b.locationName) totalCities.add(b.locationName.split(',')[0].trim());
            if (b.type === 'activity') {
                totalActivities++;
                const cat = (b.activityId ? catMap.get(b.activityId) : null) || 'General';
                activityMix[cat] = (activityMix[cat] || 0) + 1;
            }
        });

        // 1. SAVE RAW JSONB STATE & BASIC RELATIONAL TOUR INFO
        const { data: tourData, error: tourErr } = await supabaseAdmin
            .from('tours')
            .update({
                planner_data: { ...tripData, id: tourId },
                title: tripData.clientName,
                status: tripData.status,
                start_date: tripData.profile?.arrivalDate || null,
                end_date: tripData.profile?.departureDate || null,
                total_km: totalKm,
                total_cities: totalCities.size,
                total_activities: totalActivities,
                activity_mix: activityMix
            })
            .eq('id', tourId)
            .select('request_id, status')
            .single();

        if (tourErr) throw tourErr;

        // Sync request status with tour progress
        if (tourData.request_id && tourData.status) {
            let requestStatus: "Active" | "Completed" | "Cancelled" | null = null;
            if (tourData.status === 'Confirmed' || tourData.status === 'Active') requestStatus = 'Active';
            else if (tourData.status === 'Completed') requestStatus = 'Completed';
            else if (tourData.status === 'Cancelled') requestStatus = 'Cancelled';
            
            if (requestStatus) {
                // This triggers the status update email automatically
                await RequestService.updateRequestStatus(tourData.request_id, { status: requestStatus });
            }
        }

        // 2. SYNC ITINERARY TO RELATIONAL TABLES
        // Delete old itineraries (Cascade deletes daily_activities)
        await supabaseAdmin.from('tour_itineraries').delete().eq('tour_id', tourId);

        // Map TripData.itinerary into days
        if (!tripData.itinerary || tripData.itinerary.length === 0) return;

        // Group the flat itinerary list by dayNumber
        const blocksByDay: Record<number, typeof tripData.itinerary> = {};
        for (const block of tripData.itinerary) {
            if (!blocksByDay[block.dayNumber]) blocksByDay[block.dayNumber] = [];
            blocksByDay[block.dayNumber].push(block);
        }

        const days = Object.keys(blocksByDay).map(Number).sort((a, b) => a - b);

        for (const day of days) {

            // Generate an approximate date for this itinerary day based on profile arrival
            let dayDate = null;
            if (tripData.profile?.arrivalDate) {
                const dateObj = new Date(tripData.profile.arrivalDate);
                dateObj.setDate(dateObj.getDate() + (day - 1));
                dayDate = dateObj.toISOString().split('T')[0];
            }

            // Look up the matching hotel for this day (nightIndex === day)
            const matchingHotel = tripData.accommodations?.find(h => h.nightIndex === day);
            let dbHotelId = (matchingHotel?.hotelId && matchingHotel.hotelId.includes('-')) ? matchingHotel.hotelId : null;

            // If a UUID was provided, double check it actually exists in the 'hotels' table to prevent ghost ID key errors
            if (dbHotelId) {
                const { data: exists } = await supabaseAdmin
                    .from('hotels')
                    .select('id')
                    .eq('id', dbHotelId)
                    .single();

                if (!exists) {
                    console.warn(`Hotel ID ${dbHotelId} not found in 'hotels' table. Falling back to name resolution for ${matchingHotel?.hotelName}`);
                    dbHotelId = null;
                }
            }

            if (!dbHotelId && matchingHotel && matchingHotel.hotelName) {
                // Try to resolve the text-based hotelName to a real UUID in the 'hotels' table as fallback
                const { data: hotelMatches } = await supabaseAdmin
                    .from('hotels')
                    .select('id')
                    .ilike('name', matchingHotel.hotelName)
                    .limit(1);

                if (hotelMatches && hotelMatches.length > 0) {
                    dbHotelId = hotelMatches[0].id;
                }
            }

            // A) Create 'tour_itineraries' header for the day
            const { data: dbItin, error: itinErr } = await supabaseAdmin
                .from('tour_itineraries')
                .insert([{
                    tour_id: tourId,
                    day_number: day,
                    date: dayDate,
                    title: `Day ${day}`,
                    hotel_id: dbHotelId
                }])
                .select('id')
                .single();

            if (!dbItin) {
                const err = itinErr || new Error("Unknown error creating tour_itineraries");
                console.error("Failed to map day", day, err);
                throw new Error(`Failed to save itinerary day ${day}: ${err.message}`);
            }

            const blocks = blocksByDay[day];

            // B) Insert all blocks for this day into 'daily_activities'
            // Attempt to resolve supplier names to actual vendor UUIDs
            const activitiesToInsert = [];

            for (const b of blocks) {
                // Safeguard: Ensure block ID is a valid UUID
                if (!b.id || !b.id.includes('-')) {
                    console.warn("Skipping invalid block ID during relational save:", b.id, b.name);
                    continue;
                }

                // Prioritize the new vendorId field, fallback to linkedSupplierId for legacy or name-based resolution
                let vendorId = b.vendorId || null;

                // UUID Validation for vendorId
                if (vendorId && !vendorId.includes('-')) {
                    vendorId = null; // Prevent DB error if it's a legacy name string instead of UUID
                }

                if (!vendorId && b.linkedSupplierId && typeof b.linkedSupplierId === 'string') {
                    if (!b.linkedSupplierId.includes('-')) {
                        // Looks like a name, not a UUID, let's try to grab the real UUID
                        const { data: vendorMatches } = await supabaseAdmin
                            .from('vendors')
                            .select('id')
                            .ilike('name', b.linkedSupplierId)
                            .limit(1);

                        if (vendorMatches && vendorMatches.length > 0) {
                            vendorId = vendorMatches[0].id;
                        }
                    } else {
                        vendorId = b.linkedSupplierId; // Trust it's a UUID
                    }
                }

                let basePayload: any = {
                    id: crypto.randomUUID(),
                    tour_id: tourId,
                    itinerary_id: dbItin.id,
                    title: b.name,
                    location_name: b.locationName || null,
                    distance: b.distance || null,
                    description: b.comments && b.comments.length > 0 ? JSON.stringify(b.comments) : (b.internalNotes || ''),
                    time_start: b.startTime || null,
                    time_end: b.endTime || null,
                    vendor_id: vendorId, // Map to the resolved UUID
                    activity_id: b.activityId,
                    vendor_activity_id: b.vendorActivityId,
                    agreed_price: b.agreedPrice,
                    transport_id: (b.transportId && b.transportId.includes('-')) ? b.transportId : (tripData.defaultTransportId || null),
                    vehicle_id: (b.vehicleId && b.vehicleId.includes('-')) ? b.vehicleId : (tripData.defaultVehicleId || null),
                    driver_id: (b.driverId && b.driverId.includes('-')) ? b.driverId : (tripData.defaultDriverId || null),
                    guide_id: (b.guideId && b.guideId.includes('-')) ? b.guideId : (tripData.defaultGuideId || null),
                    restaurant_id: (b.restaurantId && b.restaurantId.includes('-')) ? b.restaurantId : null,
                    hotel_id: (b.hotelId && b.hotelId.includes('-')) ? b.hotelId : null,
                    driver_meal_included: b.driverMealIncluded || false,
                    driver_acc_included: b.driverAccIncluded || false,
                    guide_room_discount: b.guideRoomDiscount || null,
                    parking_included: b.parkingIncluded || false
                };

                if (b.type === 'sleep') {
                    const acc = tripData.accommodations?.find(a => a.nightIndex === day);
                    if (acc && acc.selectedRooms && acc.selectedRooms.length > 0) {
                        let totalAgreedPrice = 0;
                        let mealPlan = null;

                        if (!basePayload.hotel_id && acc.hotelId?.includes('-')) {
                            basePayload.hotel_id = acc.hotelId;
                        }

                        for (const room of acc.selectedRooms) {
                            const reqType = (room as any).reqId?.split('-')[0]; // Extract 'Single', 'Double', 'Family' etc.
                            const validRoomId = room.roomId?.includes('-') ? room.roomId : null;

                            if (reqType === 'Single') {
                                basePayload.single_room_id = validRoomId;
                                basePayload.single_room_count = room.quantity;
                            } else if (reqType === 'Double') {
                                basePayload.double_room_id = validRoomId;
                                basePayload.double_room_count = room.quantity;
                            } else if (reqType === 'Twin') {
                                basePayload.twin_room_id = validRoomId;
                                basePayload.twin_room_count = room.quantity;
                            } else if (reqType === 'Triple') {
                                basePayload.triple_room_id = validRoomId;
                                basePayload.triple_room_count = room.quantity;
                            } else if (reqType === 'Family') {
                                basePayload.family_room_id = validRoomId;
                                basePayload.family_room_count = room.quantity;
                            }

                            const roomTotal = (room as any).agreedTotal !== undefined ? (room as any).agreedTotal : (room.pricePerNight * room.quantity);
                            if (roomTotal !== undefined) totalAgreedPrice += roomTotal;
                            if (room.mealPlan && !mealPlan) mealPlan = room.mealPlan;
                        }

                        basePayload.agreed_total_price = totalAgreedPrice > 0 ? totalAgreedPrice : null;
                        basePayload.meal_plan = mealPlan;
                        activitiesToInsert.push(basePayload);
                    } else if (acc) {
                        // Legacy single-room fallback mapping targeting standard double default
                        const assumedRoomId = acc.roomId && acc.roomId.includes('-') ? acc.roomId : null;
                        const assumedQty = acc.numberOfRooms || 1;
                        basePayload.double_room_id = assumedRoomId;
                        basePayload.double_room_count = assumedQty;
                        basePayload.agreed_total_price = (acc.pricePerNight && assumedQty) ? acc.pricePerNight * assumedQty : null;
                        basePayload.meal_plan = acc.mealPlan || null;
                        activitiesToInsert.push(basePayload);
                    } else {
                        activitiesToInsert.push(basePayload);
                    }
                } else {
                    let quantity = b.transportQuantity || tripData.profile?.adults || 1;
                    let agreedUnitPrice = b.agreedPrice || null;
                    activitiesToInsert.push({
                        ...basePayload,
                        single_room_count: quantity, // Fallback alias
                        agreed_total_price: agreedUnitPrice,
                        meal_plan: b.mealType || null
                    });
                }
            }

            if (activitiesToInsert.length > 0) {
                const { error: actErr } = await supabaseAdmin.from('daily_activities').insert(activitiesToInsert);
                if (actErr) {
                    console.error("Failed to insert activities for day", day, actErr);
                    throw new Error(`Failed to save activities for Day ${day}: ${actErr.message}`);
                }
            }
        }
    }
}
