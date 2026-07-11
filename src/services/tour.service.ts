
import { CreateTourDTO, AddActivityDTO } from '../dtos/tour.dto';
import { Settings } from '@/types/types';
import { TripData, Traveler, TravelStyle } from '@/app/admin/(authenticated)/planner/types';
import { createClient as createSupabaseClient } from '@/utils/supabase/client';
import { createAdminClient } from '@/utils/supabase/admin';
import { RequestService } from './request.service';

const supabase = createSupabaseClient();

const isUuid = (val: any) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

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
            .select('*')
            .eq('id', requestId)
            .single();

        if (reqError) throw reqError;
        if (!requestMsg) throw new Error("Request not found");

        const details = {
            package_name: requestMsg.name || `Custom Tour - ${requestMsg.email || 'Client'}`,
            start_date: requestMsg.start_date || null,
            end_date: requestMsg.start_date ? new Date(new Date(requestMsg.start_date).setDate(new Date(requestMsg.start_date).getDate() + (requestMsg.duration_nights || 1))).toISOString().split('T')[0] : null,
            nights: requestMsg.duration_nights || 1
        };

        // 3. Create the Tour
        const { data: newTour, error: insertError } = await supabaseAdmin
            .from('tours')
            .insert([{
                request_id: requestId,
                tourist_id: requestMsg.tourist_id || null, // Will need non-null tourist_id in future based on schema, if anonymous request this might fail unless triggered
                agent_id: requestMsg.admin_assigned_to || null,
                title: details.package_name,
                status: 'Draft',
                start_date: details.start_date,
                end_date: details.end_date,
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
                    service_date: dayDate || null,
                    title: 'New Activity',
                    activity_type: 'activity',
                    time_start: '09:00:00',
                    time_end: '10:00:00',
                    adults: requestMsg.adults || 0,
                    children: requestMsg.children || 0,
                    infants: requestMsg.infants || 0,
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
                    infants
                ),
                tourist:users!tours_tourist_id_fkey(
                    email,
                    tourist_profile:tourist_profiles(
                        first_name, last_name, phone, country, passport_number, address,
                        adults, children, infants, arrival_date, departure_date, duration_days,
                        budget_total, budget_per_person, travel_style, departure_country,
                        dietary_requirements, medical_conditions, accessibility_requirements,
                        language_preference, special_notes
                    )
                )
            `)
            .eq('id', tourId)
            .single();

        if (error) throw error;

        // Query the travelers from tourist_team table
        const { data: teamRows } = await supabaseAdmin
            .from('tourist_team')
            .select('*')
            .eq('tour_id', tourId);

        const travelers: Traveler[] = (teamRows || []).map(row => ({
            id: row.id,
            fullName: row.full_name,
            passportNumber: row.passport_number || '',
            nationality: row.nationality || '',
            dateOfBirth: row.date_of_birth || '',
            gender: row.gender || undefined,
            dietaryPreferences: row.dietary_preferences || '',
            mealPreference: row.meal_preference || 'Standard',
            roomPreference: row.room_preference || 'Double',
            sharedWithIds: row.shared_with_ids || [],
            medicalNotes: row.medical_notes || ''
        }));

        const plannerData = tourMsg.planner_data;
        const tourist = tourMsg.tourist;
        const touristProfileRaw = tourist?.tourist_profile;
        const touristProfile = (Array.isArray(touristProfileRaw) ? touristProfileRaw[0] : touristProfileRaw) || {};

        const clientName = touristProfile.first_name 
            ? `${touristProfile.first_name}${touristProfile.last_name ? ' ' + touristProfile.last_name : ''}`
            : (tourMsg.request?.name || tourist?.email || 'New Client Inquiry');

        const mergedProfile = {
            adults: touristProfile.adults !== null && touristProfile.adults !== undefined ? touristProfile.adults : 2,
            children: touristProfile.children !== null && touristProfile.children !== undefined ? touristProfile.children : 0,
            infants: touristProfile.infants !== null && touristProfile.infants !== undefined ? touristProfile.infants : 0,
            arrivalDate: touristProfile.arrival_date || tourMsg.start_date || tourMsg.request?.start_date || '',
            departureDate: touristProfile.departure_date || tourMsg.end_date || '',
            durationDays: touristProfile.duration_days || 0,
            budgetTotal: touristProfile.budget_total || 0,
            budgetPerPerson: touristProfile.budget_per_person || 0,
            travelStyle: (touristProfile.travel_style || 'Luxury') as TravelStyle,
            departureCountry: touristProfile.departure_country || '',
            specialConditions: {
                dietary: touristProfile.dietary_requirements || '',
                medical: touristProfile.medical_conditions || '',
                accessibility: touristProfile.accessibility_requirements || '',
                language: touristProfile.language_preference || 'English',
                occasion: touristProfile.special_notes || ''
            }
        };

        let tripData: TripData;

        // If the planner data has already been saved before, return it perfectly mapped
        if (plannerData && Object.keys(plannerData).length > 0) {
            tripData = { ...plannerData, id: tourId } as TripData;
            // Overwrite Step 2 and Step 3 details with relational table data
            tripData.clientName = clientName;
            tripData.clientPassport = touristProfile.passport_number || '';
            tripData.clientPhone = touristProfile.phone || '';
            tripData.clientAddress = touristProfile.address || '';
            tripData.profile = { ...tripData.profile, ...mergedProfile };
            tripData.travelers = travelers;
        } else {
            // Otherwise seed it from the requests table
            const reqInfo = tourMsg.request;

            tripData = {
                id: tourId,
                clientName: clientName,
                clientEmail: reqInfo?.email || tourist?.email || '',
                clientPhone: touristProfile.phone || reqInfo?.phone_number?.toString() || '',
                clientPassport: touristProfile.passport_number || '',
                clientAddress: touristProfile.address || '',
                status: tourMsg.status as TripData['status'],
                profile: {
                    adults: touristProfile.adults !== null && touristProfile.adults !== undefined ? touristProfile.adults : (reqInfo?.adults || 2),
                    children: touristProfile.children !== null && touristProfile.children !== undefined ? touristProfile.children : (reqInfo?.children || 0),
                    infants: touristProfile.infants !== null && touristProfile.infants !== undefined ? touristProfile.infants : 0,
                    arrivalDate: touristProfile.arrival_date || reqInfo?.start_date || '',
                    departureDate: touristProfile.departure_date || (() => {
                        const start = reqInfo?.start_date;
                        const nights = reqInfo?.duration_nights;
                        if (start && nights) {
                            const d = new Date(start);
                            d.setDate(d.getDate() + nights);
                            return d.toISOString().split('T')[0];
                        }
                        return '';
                    })(),
                    durationDays: touristProfile.duration_days || (reqInfo?.duration_nights || 0) + (reqInfo?.start_date ? 1 : 0),
                    budgetTotal: touristProfile.budget_total || reqInfo?.budget || 0,
                    budgetPerPerson: touristProfile.budget_per_person || (
                        reqInfo?.budget && reqInfo?.adults
                            ? reqInfo.budget / reqInfo.adults
                            : 0
                    ),
                    travelStyle: (touristProfile.travel_style || 'Luxury') as TravelStyle,
                    departureCountry: touristProfile.departure_country || '',
                    specialConditions: {
                        dietary: touristProfile.dietary_requirements || '',
                        medical: touristProfile.medical_conditions || '',
                        accessibility: touristProfile.accessibility_requirements || '',
                        language: touristProfile.language_preference || 'English',
                        occasion: touristProfile.special_notes || reqInfo?.note || ''
                    }
                },
                serviceScopes: [],
                flights: [], accommodations: [], transports: [], activities: [], itinerary: [],
                travelers: travelers,
                financials: {
                    costs: { flights: 0, hotels: 0, transport: 0, activities: 0, guide: 0, misc: 0, commission: 0, tax: 0 },
                    purchaseOrders: [],
                    supplierInvoices: [],
                    sellingPrice: reqInfo?.budget || 0
                }
            };
        }

        // Check if there is any draft version in draft_itinerary_versions to pull from
        const { data: latestDraft } = await supabaseAdmin
            .from('draft_itinerary_versions')
            .select('*')
            .eq('tour_id', tourId)
            .order('version_number', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (latestDraft && latestDraft.itinerary_data) {
            const draftTime = latestDraft.created_at ? new Date(latestDraft.created_at).getTime() : 0;
            const tourTime = tourMsg.updated_at ? new Date(tourMsg.updated_at).getTime() : 0;

            if (draftTime >= tourTime) {
                tripData.itinerary = latestDraft.itinerary_data;
                if (latestDraft.adults !== null && latestDraft.adults !== undefined) {
                    if (!tripData.profile) tripData.profile = {} as any;
                    tripData.profile.adults = latestDraft.adults;
                }
                if (latestDraft.children !== null && latestDraft.children !== undefined) {
                    if (!tripData.profile) tripData.profile = {} as any;
                    tripData.profile.children = latestDraft.children;
                }
                if (latestDraft.infants !== null && latestDraft.infants !== undefined) {
                    if (!tripData.profile) tripData.profile = {} as any;
                    tripData.profile.infants = latestDraft.infants;
                }
                tripData.manualSingle = latestDraft.single_rooms ?? 0;
                tripData.manualDouble = latestDraft.double_rooms ?? 1;
                tripData.manualTriple = latestDraft.triple_rooms ?? 0;
                tripData.manualFamily = latestDraft.family_rooms ?? 0;
            } else if (plannerData) {
                // Restore manual rooms if they were saved in tours.planner_data
                tripData.manualSingle = plannerData.manualSingle ?? 0;
                tripData.manualDouble = plannerData.manualDouble ?? 1;
                tripData.manualTriple = plannerData.manualTriple ?? 0;
                tripData.manualFamily = plannerData.manualFamily ?? 0;
            }
        } else if (plannerData) {
            // Restore manual rooms if they were saved in tours.planner_data
            tripData.manualSingle = plannerData.manualSingle ?? 0;
            tripData.manualDouble = plannerData.manualDouble ?? 1;
            tripData.manualTriple = plannerData.manualTriple ?? 0;
            tripData.manualFamily = plannerData.manualFamily ?? 0;
        }

        return { tripData, tourMsg };
    }

    /**
     * Saves the robust TripData UI state perfectly into a JSONB column to prevent data loss.
     * Also systematically maps `tripData.itinerary` to `tour_itineraries` and `daily_activities` 
     * table rows for reporting / operations!
     */
    static async saveTour(tourId: string, tripData: TripData) {
        const fs = require('fs');
        const logMsg = `[${new Date().toISOString()}] saveTour called for tourId: ${tourId}\n` +
                       `tripData itinerary length: ${tripData?.itinerary?.length}\n` +
                       `tripData accommodations length: ${tripData?.accommodations?.length}\n\n`;
        fs.appendFileSync('save_tour_debug.log', logMsg);

        const supabaseAdmin = createAdminClient();

        // Fetch existing quotation mappings before any deletions
        // Fetch existing itineraries for this tour to cover any mapping rows with null tour_id
        const { data: existingItins } = await supabaseAdmin
            .from('tour_itineraries')
            .select('id, day_number')
            .eq('tour_id', tourId);
        
        const itinIds = existingItins?.map(i => i.id) || [];
        
        const existingMappings: any[] = [];

        // Fetch existing PO block mappings before any deletions
        const { data: tourBlocks } = await supabaseAdmin
            .from('po_blocks')
            .select('id')
            .eq('tour_id', tourId);
        
        const tourBlockIds = tourBlocks?.map(b => b.id) || [];
        let existingPOBlockMappings: any[] = [];
        if (tourBlockIds.length > 0) {
            const { data: mappingsData } = await supabaseAdmin
                .from('po_block_daily_activities')
                .select('po_block_id, daily_activity_id')
                .in('po_block_id', tourBlockIds);
            existingPOBlockMappings = mappingsData || [];
        }

        const allInsertedActivities: any[] = [];
        const { data: dbActivities } = await supabaseAdmin.from('activities').select('id, activity_name');

        const { data: rawSettings } = await supabaseAdmin.from('app_settings').select('setting_key, setting_value');
        const settingsMap: Record<string, number> = {};
        if (rawSettings) {
            rawSettings.forEach(s => settingsMap[s.setting_key] = Number(s.setting_value) || 0);
        }
        const roomMarkup = settingsMap[Settings.Room_Markup] || 10;
        const transportMarkup = settingsMap[Settings.Transport_Markup] || 10;
        const restaurantMarkup = settingsMap[Settings.Restaurant_Markup] || 10;
        const activityMarkup = settingsMap[Settings.Vendor_Activity_Markup] || 10;
        
        const travelStyle = tripData.profile?.travelStyle || 'Standard';
        let vehicleKmRate = settingsMap[Settings.Regular_Vehicle_Km_Rate] || 0;
        if (travelStyle === 'Premium') vehicleKmRate = settingsMap[Settings.Premium_Vehicle_Km_Rate] || 0;
        else if (travelStyle === 'Luxury') vehicleKmRate = settingsMap[Settings.Luxury_Vehicle_Km_Rate] || 0;
        else if (travelStyle === 'Ultra VIP') vehicleKmRate = settingsMap[Settings.Ultra_Vip_Vehicle_Km_Rate] || 0;

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

        // 1. SAVE BASIC RELATIONAL TOUR INFO
        const { data: tourData, error: tourErr } = await supabaseAdmin
            .from('tours')
            .update({
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
            .select('request_id, status, tourist_id')
            .single();

        if (tourErr) throw tourErr;

        const touristId = tourData.tourist_id;
        if (touristId) {
            // Split name into first and last name
            const nameParts = (tripData.clientName || '').trim().split(/\s+/);
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            // Upsert tourist_profile to ensure it exists and is updated
            const { error: profileErr } = await supabaseAdmin
                .from('tourist_profiles')
                .upsert({
                    id: touristId,
                    first_name: firstName,
                    last_name: lastName,
                    phone: tripData.clientPhone || null,
                    passport_number: tripData.clientPassport || null,
                    address: tripData.clientAddress || null,
                    adults: tripData.profile?.adults ?? 2,
                    children: tripData.profile?.children ?? 0,
                    infants: tripData.profile?.infants ?? 0,
                    arrival_date: tripData.profile?.arrivalDate || null,
                    departure_date: tripData.profile?.departureDate || null,
                    duration_days: tripData.profile?.durationDays ?? 0,
                    budget_total: tripData.profile?.budgetTotal ?? 0,
                    budget_per_person: tripData.profile?.budgetPerPerson ?? 0,
                    travel_style: tripData.profile?.travelStyle || 'Luxury',
                    departure_country: tripData.profile?.departureCountry || null,
                    dietary_requirements: tripData.profile?.specialConditions?.dietary || null,
                    medical_conditions: tripData.profile?.specialConditions?.medical || null,
                    accessibility_requirements: tripData.profile?.specialConditions?.accessibility || null,
                    language_preference: tripData.profile?.specialConditions?.language || 'English',
                    special_notes: tripData.profile?.specialConditions?.occasion || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', touristId);

            if (profileErr) {
                console.error("Failed to save tourist profile relational data:", profileErr);
            }

            // Sync tourist_team
            // 1. Delete old team members for this tour
            const { error: deleteTeamErr } = await supabaseAdmin
                .from('tourist_team')
                .delete()
                .eq('tour_id', tourId);

            if (deleteTeamErr) {
                console.error("Failed to clear tourist team rows:", deleteTeamErr);
            }

            // 2. Insert new team members
            if (tripData.travelers && tripData.travelers.length > 0) {
                const teamRows = tripData.travelers.map(t => ({
                    id: isUuid(t.id) ? t.id : undefined, // Keep existing UUID if valid
                    tour_id: tourId,
                    tourist_id: touristId,
                    full_name: t.fullName,
                    passport_number: t.passportNumber || null,
                    nationality: t.nationality || null,
                    date_of_birth: t.dateOfBirth || null,
                    gender: t.gender || null,
                    dietary_preferences: t.dietaryPreferences || null,
                    meal_preference: t.mealPreference || 'Standard',
                    room_preference: t.roomPreference || 'Double',
                    shared_with_ids: t.sharedWithIds || [],
                    medical_notes: t.medicalNotes || null
                }));

                const { error: insertTeamErr } = await supabaseAdmin
                    .from('tourist_team')
                    .insert(teamRows);

                if (insertTeamErr) {
                    console.error("Failed to insert tourist team rows:", insertTeamErr);
                }
            }
        }

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
        // Map TripData.itinerary into days
        if (!tripData.itinerary || tripData.itinerary.length === 0) return;

        // Group the flat itinerary list by dayNumber
        const blocksByDay: Record<number, typeof tripData.itinerary> = {};
        for (const block of tripData.itinerary) {
            if (!blocksByDay[block.dayNumber]) blocksByDay[block.dayNumber] = [];
            blocksByDay[block.dayNumber].push(block);
        }

        const days = Object.keys(blocksByDay).map(Number).sort((a, b) => a - b);

        let grandTotalCost = 0;
        const allActivitiesToUpsert: any[] = [];

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
            let dbHotelId = (matchingHotel?.hotelId && isUuid(matchingHotel.hotelId)) ? matchingHotel.hotelId : null;

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

            // A) Create/Update 'tour_itineraries' header for the day
            const existingItin = existingItins?.find(i => i.day_number === day);
            let dbItin: any = null;
            let itinErr: any = null;

            if (existingItin) {
                const { data, error } = await supabaseAdmin
                    .from('tour_itineraries')
                    .update({
                        date: dayDate,
                        title: `Day ${day}`,
                        hotel_id: dbHotelId
                    })
                    .eq('id', existingItin.id)
                    .select('id')
                    .single();
                dbItin = data;
                itinErr = error;
            } else {
                const { data, error } = await supabaseAdmin
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
                dbItin = data;
                itinErr = error;
            }

            if (!dbItin) {
                const err = itinErr || new Error("Unknown error creating/updating tour_itineraries");
                console.error("Failed to map day", day, err);
                throw new Error(`Failed to save itinerary day ${day}: ${err.message}`);
            }

            // Room markup is now fetched at the beginning of saveTour

            const blocks = blocksByDay[day];

            // B) Insert all blocks for this day into 'daily_activities'
            // Attempt to resolve supplier names to actual vendor UUIDs
            const activitiesToInsert = [];

            for (const b of blocks) {
                // Safeguard: Ensure block ID is a valid UUID
                if (!b.id || !isUuid(b.id)) {
                    console.warn("Skipping invalid block ID during relational save:", b.id, b.name);
                    continue;
                }

                // Prioritize the new vendorId field, fallback to linkedSupplierId for legacy or name-based resolution
                let vendorId = b.vendorId || null;

                // UUID Validation for vendorId
                if (vendorId && !isUuid(vendorId)) {
                    vendorId = null; // Prevent DB error if it's a legacy name string instead of UUID
                }

                if (!vendorId && b.linkedSupplierId && typeof b.linkedSupplierId === 'string') {
                    if (!isUuid(b.linkedSupplierId)) {
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

                // Auto-resolve vendor_activity_id and other critical activity identifiers
                let vendorActivityId = b.vendorActivityId || null;
                let activityId = b.activityId !== undefined && b.activityId !== null ? Number(b.activityId) : null;

                if (!activityId && b.name && dbActivities && dbActivities.length > 0) {
                    const cleanWords = (str: string) => {
                        return str.toLowerCase()
                            .replace(/[^\w\s]/g, '')
                            .split(/\s+/)
                            .filter(w => w.length > 2 && !['visit', 'explore', 'climb', 'tour', 'the', 'and', 'for', 'with', 'to', 'in', 'at'].includes(w));
                    };
                    const blockWords = cleanWords(b.name);
                    if (blockWords.length > 0) {
                        let bestMatch: any = null;
                        let maxOverlap = 0;
                        for (const a of dbActivities) {
                            const actWords = cleanWords(a.activity_name);
                            const overlap = blockWords.filter(w => actWords.includes(w)).length;
                            if (overlap > maxOverlap) {
                                maxOverlap = overlap;
                                bestMatch = a;
                            }
                        }
                        if (maxOverlap > 0 && bestMatch) {
                            activityId = Number(bestMatch.id);
                            b.activityId = activityId;
                        }
                    }
                }

                if (vendorActivityId) {
                    const { data: vaMatches } = await supabaseAdmin
                        .from('vendor_activities')
                        .select('vendor_id, activity_id')
                        .eq('id', vendorActivityId)
                        .limit(1);
                    if (vaMatches && vaMatches.length > 0) {
                        if (!vendorId) {
                            vendorId = vaMatches[0].vendor_id;
                            b.vendorId = vendorId ?? undefined;
                        }
                        if (!activityId) {
                            activityId = Number(vaMatches[0].activity_id);
                            b.activityId = activityId;
                        }
                    }
                } else if (vendorId && activityId) {
                    const { data: vaMatches } = await supabaseAdmin
                        .from('vendor_activities')
                        .select('id')
                        .eq('vendor_id', vendorId)
                        .eq('activity_id', activityId)
                        .limit(1);
                    if (vaMatches && vaMatches.length > 0) {
                        vendorActivityId = vaMatches[0].id;
                        b.vendorActivityId = vendorActivityId ?? undefined;
                    }
                }

                // Sync resolved values back to the block reference so it persists to tours.planner_data
                if (vendorId) b.vendorId = vendorId;
                if (activityId) b.activityId = activityId;

                let basePayload: any = {
                    id: b.id, // Bind directly to the JSON block ID to ensure 1:1 mapping with the UI
                    tour_id: tourId,
                    itinerary_id: dbItin.id,
                    service_date: dayDate || null,
                    title: b.name,
                    activity_type: b.type || null,
                    location_name: b.locationName || null,
                    distance: (b.distance !== undefined && b.distance !== null && b.distance !== '') ? String(b.distance) : null,
                    description: b.comments && b.comments.length > 0 ? JSON.stringify(b.comments) : (b.internalNotes || ''),
                    time_start: b.startTime || null,
                    time_end: b.endTime || null,
                    vendor_id: vendorId, // Map to the resolved UUID
                    activity_id: activityId,
                    vendor_activity_id: vendorActivityId,
                    contracted_price: b.contractedPrice,
                    charged_unit_price: b.agreedPrice,
                    charged_total_price: b.agreedPrice,
                    transport_id: (b.transportId && isUuid(b.transportId)) ? b.transportId : (b.type === 'travel' ? (tripData.defaultTransportId || null) : null),
                    driver_id: (b.driverId && isUuid(b.driverId)) ? b.driverId : (tripData.defaultDriverId || null),
                    guide_id: (b.guideId && isUuid(b.guideId)) ? b.guideId : (tripData.defaultGuideId || null),
                    restaurant_id: (b.restaurantId && isUuid(b.restaurantId)) ? b.restaurantId : null,
                    hotel_id: (b.hotelId && isUuid(b.hotelId)) ? b.hotelId : null,
                    driver_meal_included: b.driverMealIncluded || false,
                    driver_acc_included: b.driverAccIncluded || false,
                    guide_room_discount: b.guideRoomDiscount || null,
                    parking_included: b.parkingIncluded || false,
                    price_finalized: b.priceFinalized || false,
                    transport_requirement_id: b.transport_requirement_id || null,
                    // Pax counts — sourced from tripData.profile which is seeded from requests table
                    adults: tripData.profile?.adults ?? 0,
                    children: tripData.profile?.children ?? 0,
                    infants: tripData.profile?.infants ?? 0,
                };


                if (b.isCustomPO) {
                    basePayload.vendor_id = null;
                    basePayload.transport_id = null;
                    basePayload.driver_id = null;
                    basePayload.guide_id = null;
                    basePayload.activity_id = null;
                    basePayload.restaurant_id = null;
                    basePayload.vendor_activity_id = null;
                    basePayload.hotel_room_id = null;
                    basePayload.meal_plan = null;
                    basePayload.single_room_id = null;
                    basePayload.single_room_count = null;
                    basePayload.double_room_id = null;
                    basePayload.double_room_count = null;
                    basePayload.twin_room_id = null;
                    basePayload.twin_room_count = null;
                    basePayload.triple_room_id = null;
                    basePayload.triple_room_count = null;
                    basePayload.family_room_id = null;
                    basePayload.family_room_count = null;
                    
                    basePayload.hotel_id = b.hotelId || null;

                    const quantity = b.quantity || 1;
                    const contractedPrice = b.contractedPrice || 0;
                    const agreedUnitPrice = b.agreedPrice || 0;
                    const agreedTotalPrice = agreedUnitPrice * quantity;

                    b.contractedPrice = contractedPrice;
                    b.agreedPrice = agreedUnitPrice;

                    activitiesToInsert.push({
                        ...basePayload,
                        quantity: quantity,
                        contracted_price: contractedPrice,
                        contracted_total_price: contractedPrice * quantity,
                        charged_unit_price: agreedUnitPrice,
                        charged_total_price: agreedTotalPrice,
                        meal_plan: null
                    });
                    continue;
                }

                if (b.type === 'sleep') {
                    const acc = tripData.accommodations?.find(a => a.nightIndex === day);
                    if (acc && acc.selectedRooms && acc.selectedRooms.length > 0) {
                        let totalAgreedPrice = 0;
                        let totalContractedPrice = 0;
                        let totalRooms = 0;
                        let mealPlan = null;

                        if (!basePayload.hotel_id && isUuid(acc.hotelId)) {
                            basePayload.hotel_id = acc.hotelId;
                        }

                        for (const room of acc.selectedRooms) {
                            const reqType = (room as any).reqId?.split('-')[0]; // Extract 'Single', 'Double', 'Family' etc.
                            const validRoomId = isUuid(room.roomId) ? room.roomId : null;
                            totalRooms += room.quantity;

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

                            const baseContractedUnit = (room as any).contractedPrice !== undefined ? (room as any).contractedPrice : room.pricePerNight;
                            const roomContractedTotal = baseContractedUnit * room.quantity;
                            totalContractedPrice += roomContractedTotal;

                            // Calculate agreed price dynamically using fetched markup
                            const dynamicAgreedUnit = baseContractedUnit * (1 + (roomMarkup / 100));
                            const roomAgreedTotal = (room as any).agreedTotal !== undefined ? (room as any).agreedTotal : (dynamicAgreedUnit * room.quantity);
                            totalAgreedPrice += roomAgreedTotal;
                            
                            // Mutate the original room object so it persists to JSON for the Negotiation UI
                            (room as any).agreedTotal = roomAgreedTotal;

                            if (room.mealPlan && !mealPlan) mealPlan = room.mealPlan;
                        }

                        let primaryRoomId = (acc.roomId && isUuid(acc.roomId)) ? acc.roomId : null;
                        if (!primaryRoomId) {
                            const firstRoom = acc.selectedRooms.find(r => isUuid(r.roomId));
                            if (firstRoom) {
                                primaryRoomId = firstRoom.roomId;
                            }
                        }
                        if (basePayload.hotel_id && primaryRoomId) {
                            basePayload.hotel_room_id = primaryRoomId;
                        }

                        basePayload.charged_total_price = totalAgreedPrice > 0 ? totalAgreedPrice : null;
                        basePayload.quantity = totalRooms > 0 ? totalRooms : 1;
                        basePayload.charged_unit_price = totalAgreedPrice > 0 && totalRooms > 0 ? totalAgreedPrice / totalRooms : null;

                        // Apply custom contracted overrides if present (e.g. special buying rates)
                        if (acc.customContractedUnitPrice !== undefined || acc.customContractedTotalPrice !== undefined) {
                            const overriddenUnit = acc.customContractedUnitPrice ?? (acc.customContractedTotalPrice ? acc.customContractedTotalPrice / (totalRooms || 1) : null);
                            const overriddenTotal = acc.customContractedTotalPrice ?? (acc.customContractedUnitPrice ? acc.customContractedUnitPrice * (totalRooms || 1) : null);
                            
                            basePayload.contracted_price = overriddenUnit;
                            basePayload.contracted_total_price = overriddenTotal;
                        } else {
                            basePayload.contracted_price = totalContractedPrice > 0 && totalRooms > 0 ? totalContractedPrice / totalRooms : null;
                            basePayload.contracted_total_price = totalContractedPrice > 0 ? totalContractedPrice : null;
                        }

                        basePayload.meal_plan = mealPlan;

                        if (acc.customRateNote) {
                            basePayload.description = acc.customRateNote;
                        }
                        
                        b.agreedPrice = basePayload.charged_total_price ?? undefined;
                        activitiesToInsert.push(basePayload);
                    } else if (acc) {
                        // Legacy single-room fallback mapping targeting standard double default
                        const assumedRoomId = acc.roomId && isUuid(acc.roomId) ? acc.roomId : null;
                        const assumedQty = acc.numberOfRooms || 1;
                        if (!basePayload.hotel_id && isUuid(acc.hotelId)) {
                            basePayload.hotel_id = acc.hotelId;
                        }
                        if (basePayload.hotel_id && assumedRoomId) {
                            basePayload.hotel_room_id = assumedRoomId;
                        }
                        basePayload.double_room_id = assumedRoomId;
                        basePayload.double_room_count = assumedQty;
                        basePayload.quantity = assumedQty;
                        basePayload.charged_unit_price = acc.pricePerNight || null;
                        basePayload.charged_total_price = (acc.pricePerNight && assumedQty) ? acc.pricePerNight * assumedQty : null;
                        
                        // Apply custom contracted overrides if present (e.g. special buying rates)
                        if (acc.customContractedUnitPrice !== undefined || acc.customContractedTotalPrice !== undefined) {
                            const overriddenUnit = acc.customContractedUnitPrice ?? (acc.customContractedTotalPrice ? acc.customContractedTotalPrice / (assumedQty || 1) : null);
                            const overriddenTotal = acc.customContractedTotalPrice ?? (acc.customContractedUnitPrice ? acc.customContractedUnitPrice * (assumedQty || 1) : null);
                            
                            basePayload.contracted_price = overriddenUnit;
                            basePayload.contracted_total_price = overriddenTotal;
                        } else {
                            basePayload.contracted_price = b.contractedPrice || null;
                            basePayload.contracted_total_price = (b.contractedPrice != null && assumedQty != null) ? b.contractedPrice * assumedQty : null;
                        }

                        basePayload.meal_plan = acc.mealPlan || null;

                        if (acc.customRateNote) {
                            basePayload.description = acc.customRateNote;
                        }
                        
                        b.agreedPrice = basePayload.charged_total_price ?? undefined;
                        activitiesToInsert.push(basePayload);
                    } else {
                        basePayload.quantity = b.quantity || 1;
                        basePayload.contracted_price = b.contractedPrice || 0;
                        basePayload.contracted_total_price = b.contractedTotalPrice || ((b.contractedPrice || 0) * basePayload.quantity);
                        basePayload.charged_unit_price = b.agreedPrice || 0;
                        basePayload.charged_total_price = (b.agreedPrice || 0) * basePayload.quantity;
                        activitiesToInsert.push(basePayload);
                    }
                } else {
                    let quantity = b.quantity || b.headCount || b.transportQuantity || ((tripData.profile?.adults || 0) + (tripData.profile?.children || 0)) || 1;
                    if (b.type === 'meal' && b.restaurantQuantity) {
                        quantity = b.restaurantQuantity;
                    }
                    
                    let contractedPrice = b.contractedPrice;
                    
                    // Extract unit and total price correctly based on block type semantics
                    // For meals and activities, UI treats b.agreedPrice as the UNIT PRICE.
                    // For travel and guides, UI and logic expects b.agreedPrice as the TOTAL PRICE.
                    let agreedTotalPrice = b.agreedPrice || null;
                    let agreedUnitPrice = agreedTotalPrice ? agreedTotalPrice / quantity : null;

                    if (b.type === 'meal' || b.type === 'activity') {
                        agreedUnitPrice = b.agreedPrice || null;
                        agreedTotalPrice = agreedUnitPrice ? agreedUnitPrice * quantity : null;
                    }

                    if (b.type === 'travel') {
                        // Dynamically calculate based on km and travel style if we have a distance
                        let distanceNum = 0;
                        if (b.distance) {
                            const d = parseInt(b.distance.toString().replace(/[^0-9]/g, ''));
                            if (!isNaN(d)) distanceNum = d;
                        }
                        
                        if (distanceNum > 0) {
                            // Vehicle km rate from app settings (vehicle is tracked via transport_requirement_vehicles)
                            const dynamicVehicleKmRate = vehicleKmRate;

                            // Always enforce the global km rate as the contracted base unit rate
                            contractedPrice = dynamicVehicleKmRate;
                            
                            quantity = distanceNum > 0 ? distanceNum : 1; // Distance is the multiplier (quantity)
                            
                            // Respect manually negotiated agreed TOTAL price if it exists
                            if (b.agreedPrice) {
                                agreedTotalPrice = b.agreedPrice;
                                agreedUnitPrice = agreedTotalPrice / quantity;
                            } else {
                                agreedUnitPrice = (contractedPrice || 0) * (1 + (transportMarkup / 100));
                                agreedTotalPrice = agreedUnitPrice * quantity;
                            }
                        }
                    } else if (b.type === 'meal') {
                        if (contractedPrice !== undefined && contractedPrice !== null && !b.agreedPrice) {
                            agreedUnitPrice = contractedPrice * (1 + (restaurantMarkup / 100));
                            agreedTotalPrice = agreedUnitPrice * quantity;
                        }
                    } else if (b.type === 'activity') {
                        if (contractedPrice !== undefined && contractedPrice !== null && !b.agreedPrice) {
                            agreedUnitPrice = contractedPrice * (1 + (activityMarkup / 100));
                            agreedTotalPrice = agreedUnitPrice * quantity;
                        }
                    }

                    // Enforce mutations on the original block reference so it persists to JSON planner_data
                    b.contractedPrice = contractedPrice;
                    b.agreedPrice = (b.type === 'meal' || b.type === 'activity') ? (agreedUnitPrice ?? undefined) : (agreedTotalPrice ?? undefined); // Store properly so UI doesn't blow up
                    if (b.type === 'travel') {
                        b.transportQuantity = quantity;
                    } else if (b.type === 'meal') {
                        b.restaurantQuantity = quantity;
                    } else if (b.type === 'activity') {
                        b.quantity = quantity;
                    }

                    activitiesToInsert.push({
                        ...basePayload,
                        quantity: quantity,
                        contracted_price: contractedPrice,
                        contracted_total_price: (contractedPrice != null && quantity != null) ? contractedPrice * quantity : null,
                        charged_unit_price: agreedUnitPrice,
                        charged_total_price: agreedTotalPrice,
                        meal_plan: b.mealType || null
                    });
                }
            }

            // Accumulate active activities
            for (const act of activitiesToInsert) {
                if (act.charged_total_price) {
                    grandTotalCost += act.charged_total_price;
                }
                allActivitiesToUpsert.push(act);
                allInsertedActivities.push(act);
            }
        }

        // C) Delete removed itineraries
        if (days.length > 0) {
            const { error: itinDelErr } = await supabaseAdmin
                .from('tour_itineraries')
                .delete()
                .eq('tour_id', tourId)
                .not('day_number', 'in', `(${days.join(',')})`);
            if (itinDelErr) {
                console.error("Failed to delete removed itineraries:", itinDelErr);
            }
        } else {
            await supabaseAdmin.from('tour_itineraries').delete().eq('tour_id', tourId);
        }

        // D) Delete removed daily activities & upsert active ones
        const activeActivityIds = allActivitiesToUpsert.map(act => act.id).filter(Boolean);
        if (activeActivityIds.length > 0) {
            const { error: actDelErr } = await supabaseAdmin
                .from('daily_activities')
                .delete()
                .eq('tour_id', tourId)
                .not('id', 'in', `(${activeActivityIds.join(',')})`);
            if (actDelErr) {
                console.error("Failed to delete removed daily activities:", actDelErr);
            }
        } else {
            await supabaseAdmin.from('daily_activities').delete().eq('tour_id', tourId);
        }

        if (allActivitiesToUpsert.length > 0) {
            console.log("Upserting daily activities:", allActivitiesToUpsert.map(a => ({ id: a.id, title: a.title, type: a.activity_type, hotel_id: a.hotel_id })));
            const { error: upsertErr } = await supabaseAdmin
                .from('daily_activities')
                .upsert(allActivitiesToUpsert);

            if (upsertErr) {
                console.error("Failed to upsert daily activities:", upsertErr);
                throw new Error(`Failed to save daily activities: ${upsertErr.message}`);
            }
        }

        // E) Restore po_block_daily_activities mappings
        const insertedActivityIds = new Set(allInsertedActivities.map(act => act.id).filter(Boolean));
        
        const poMappingsToReinsert = (existingPOBlockMappings || [])
            .filter(m => insertedActivityIds.has(m.daily_activity_id))
            .map(m => ({
                po_block_id: m.po_block_id,
                daily_activity_id: m.daily_activity_id
            }));

        // Auto-link custom hotel items:
        // Any inserted activity that has hotel_id and is not a sleep activity
        // should be linked to the same PO block as the hotel sleep activity.
        const mappedActivityIds = new Set(poMappingsToReinsert.map(m => m.daily_activity_id));
        
        const hotelBlockMap = new Map<string, string>();
        allInsertedActivities.forEach(act => {
            if (act.hotel_id && (act.activity_type === 'sleep' || act.activity_type === 'accommodation')) {
                const mapping = poMappingsToReinsert.find(m => m.daily_activity_id === act.id);
                if (mapping) {
                    hotelBlockMap.set(act.hotel_id, mapping.po_block_id);
                }
            }
        });

        allInsertedActivities.forEach(act => {
            if (act.hotel_id && act.activity_type !== 'sleep' && !mappedActivityIds.has(act.id)) {
                const poBlockId = hotelBlockMap.get(act.hotel_id);
                if (poBlockId) {
                    poMappingsToReinsert.push({
                        po_block_id: poBlockId,
                        daily_activity_id: act.id
                    });
                    mappedActivityIds.add(act.id);
                }
            }
        });

        if (poMappingsToReinsert.length > 0) {
            if (tourBlockIds.length > 0) {
                const { error: clearMappingsErr } = await supabaseAdmin
                    .from('po_block_daily_activities')
                    .delete()
                    .in('po_block_id', tourBlockIds);
                if (clearMappingsErr) {
                    console.error("Failed to clear old po_block_daily_activities mappings:", clearMappingsErr);
                }
            }

            const { error: poReinsertErr } = await supabaseAdmin
                .from('po_block_daily_activities')
                .insert(poMappingsToReinsert);
            
            if (poReinsertErr) {
                console.error("Failed to restore po_block_daily_activities mappings:", poReinsertErr);
            }
        }

        // Final update for total_cost AND fully enriched planner_data JSON
        await supabaseAdmin.from('tours').update({ 
            total_cost: grandTotalCost,
            planner_data: { ...tripData, id: tourId }
        }).eq('id', tourId);
    }

    static async updateChangedHotel(
        tourId: string,
        stayIds: string[],
        newHotelId: string,
        selectedRooms: any[]
    ) {
        const supabaseAdmin = createAdminClient();
        const selectedRoomIds = selectedRooms.map(r => r.roomId).filter(Boolean);

        // FIX D: Run all independent initial fetches in parallel (was 5 serial round-trips)
        const [
            newHotelResult,
            ratesResult,
            firstStayResult,
            markupResult,
            staysResult
        ] = await Promise.all([
            supabaseAdmin.from('hotels').select('name, location_address').eq('id', newHotelId).single(),
            selectedRoomIds.length > 0
                ? supabaseAdmin.from('room_rates').select('*').in('hotel_room_id', selectedRoomIds)
                : Promise.resolve({ data: [] as any[], error: null }),
            supabaseAdmin.from('daily_activities').select('hotel_id').in('id', stayIds).limit(1).single(),
            supabaseAdmin.from('app_settings').select('setting_value').eq('setting_key', 'room_markup').single(),
            supabaseAdmin.from('daily_activities').select('id, itinerary_id').in('id', stayIds)
        ]);

        if (newHotelResult.error || !newHotelResult.data) throw new Error("New hotel not found: " + newHotelResult.error?.message);
        const newHotel = newHotelResult.data;
        const ratesData: any[] = (ratesResult as any).data || [];
        const firstStay = firstStayResult.data;
        const markup = markupResult.data ? Number((markupResult.data as any).setting_value) || 10 : 10;
        const stays: any[] = (staysResult as any).data || [];
        if (stays.length === 0) throw new Error("No stays found matching provided IDs");

        // Second parallel round: depends on firstStay.hotel_id and itinIds from first round
        const itinIds = stays.map((s: any) => s.itinerary_id).filter(Boolean);
        const [oldHotelResult, itinerariesResult] = await Promise.all([
            firstStay?.hotel_id
                ? supabaseAdmin.from('hotels').select('name').eq('id', firstStay.hotel_id).single()
                : Promise.resolve({ data: null, error: null }),
            itinIds.length > 0
                ? supabaseAdmin.from('tour_itineraries').select('id, day_number, date').in('id', itinIds)
                : Promise.resolve({ data: [] as any[], error: null })
        ]);

        const oldHotelName: string = (oldHotelResult.data as any)?.name ?? "Originally planned hotel";
        const itineraries: any[] = ((itinerariesResult as any).data) || [];

        const dayNumbers: number[] = [];
        let avgContractedPriceAcrossStays = 0;
        let avgChargedPriceAcrossStays = 0;
        let totalRoomsAcrossStays = 0;

        // FIX E: Build all per-stay payloads and fire all DB updates in parallel
        await Promise.all(stays.map(async (stay: any) => {
            const itin = itineraries.find((i: any) => i.id === stay.itinerary_id);
            const stayDate = itin?.date || null;
            if (itin?.day_number) dayNumbers.push(Number(itin.day_number));

            let totalContracted = 0;
            let totalRooms = 0;

            const roomUpdatePayload: any = {
                hotel_id: newHotelId,
                location_name: newHotel.location_address || '',
                description: `${oldHotelName} changed due to ${newHotel.name} due to availability`,
                single_room_id: null,  single_room_count: null,
                double_room_id: null,  double_room_count: null,
                twin_room_id: null,    twin_room_count: null,
                triple_room_id: null,  triple_room_count: null,
                family_room_id: null,  family_room_count: null,
                meal_plan: selectedRooms[0]?.mealPlan || 'BB'
            };

            for (const room of selectedRooms) {
                const reqType = room.reqId;
                totalRooms += room.quantity;
                if (reqType === 'Single')      { roomUpdatePayload.single_room_id = room.roomId; roomUpdatePayload.single_room_count = room.quantity; }
                else if (reqType === 'Double') { roomUpdatePayload.double_room_id = room.roomId; roomUpdatePayload.double_room_count = room.quantity; }
                else if (reqType === 'Twin')   { roomUpdatePayload.twin_room_id   = room.roomId; roomUpdatePayload.twin_room_count   = room.quantity; }
                else if (reqType === 'Triple') { roomUpdatePayload.triple_room_id = room.roomId; roomUpdatePayload.triple_room_count = room.quantity; }
                else if (reqType === 'Family') { roomUpdatePayload.family_room_id = room.roomId; roomUpdatePayload.family_room_count = room.quantity; }

                const roomRates = ratesData.filter((r: any) => r.hotel_room_id === room.roomId);
                let baseRate = room.contractedPrice || 0;
                const stayDateStr = stayDate ? String(stayDate) : "";

                const applicableRates = roomRates.filter((r: any) => {
                    if (!stayDateStr) return true;
                    if (r.start_date) {
                        if (stayDateStr < r.start_date) return false;
                        if (r.end_date && stayDateStr > r.end_date) return false;
                        return true;
                    }
                    return true;
                }).sort((a: any, b: any) => (b.start_date ? 1 : 0) - (a.start_date ? 1 : 0));

                const ratesToSearch = applicableRates.length > 0 ? applicableRates : roomRates;
                if (ratesToSearch.length > 0) {
                    let prefix = 'dbl';
                    if (reqType === 'Single') prefix = 'sgl';
                    else if (reqType === 'Triple') prefix = 'tpl';
                    else if (reqType === 'Family') prefix = 'qud';
                    const fieldName = `${prefix}_${room.mealPlan.toLowerCase()}_rate`;
                    const matrixRateObj = ratesToSearch.find((r: any) => r[fieldName] !== undefined && r[fieldName] !== null && r[fieldName] > 0);
                    if (matrixRateObj) baseRate = matrixRateObj[fieldName];
                }

                totalContracted += baseRate * room.quantity;
            }

            const avgContracted = totalRooms > 0 ? totalContracted / totalRooms : 0;
            const chargedUnit = avgContracted * (1 + markup / 100);

            roomUpdatePayload.hotel_room_id = selectedRooms[0]?.roomId || null;
            roomUpdatePayload.quantity = totalRooms;
            roomUpdatePayload.contracted_price = avgContracted;
            roomUpdatePayload.contracted_total_price = totalContracted;
            roomUpdatePayload.charged_unit_price = chargedUnit;
            roomUpdatePayload.charged_total_price = chargedUnit * totalRooms;

            avgContractedPriceAcrossStays = avgContracted;
            avgChargedPriceAcrossStays = chargedUnit;
            totalRoomsAcrossStays = totalRooms;

            // Fire daily_activities + tour_itineraries update for this stay in parallel
            await Promise.all([
                supabaseAdmin.from('daily_activities').update(roomUpdatePayload).eq('id', stay.id),
                stay.itinerary_id
                    ? supabaseAdmin.from('tour_itineraries').update({ hotel_id: newHotelId }).eq('id', stay.itinerary_id)
                    : Promise.resolve()
            ]);
        }));

        // Update custom PO daily activities on the same days under the old hotel
        if (firstStay?.hotel_id && dayNumbers.length > 0) {
            await supabaseAdmin
                .from('daily_activities')
                .update({ hotel_id: newHotelId, location_name: newHotel.location_address || '' })
                .eq('tour_id', tourId)
                .eq('hotel_id', firstStay.hotel_id)
                .in('day_number', dayNumbers)
                .is('hotel_room_id', null);
        }

        // Fetch tours.planner_data, latest draft, and po_block junction in parallel
        const [tourRecord, latestDraftResult, junctionResult] = await Promise.all([
            supabaseAdmin.from('tours').select('planner_data').eq('id', tourId).single(),
            supabaseAdmin.from('draft_itinerary_versions').select('id, itinerary_data').eq('tour_id', tourId).order('version_number', { ascending: false }).limit(1).single(),
            supabaseAdmin.from('po_block_daily_activities').select('po_block_id').in('daily_activity_id', stayIds)
        ]);

        // Fire all final writes in parallel
        const finalWrites: PromiseLike<any>[] = [];

        if (tourRecord.data?.planner_data) {
            const pData = tourRecord.data.planner_data as any;
            if (Array.isArray(pData.itinerary)) {
                pData.itinerary = pData.itinerary.map((b: any) => {
                    if (b.type === 'sleep' && dayNumbers.includes(Number(b.dayNumber))) {
                        return { ...b, hotelId: newHotelId, hotelName: newHotel.name, roomName: selectedRooms[0]?.roomName || '', mealPlan: selectedRooms[0]?.mealPlan || 'BB', agreedPrice: avgChargedPriceAcrossStays * totalRoomsAcrossStays, contractedPrice: avgContractedPriceAcrossStays, description: `${oldHotelName} changed due to ${newHotel.name} due to availability` };
                    }
                    if (b.isCustomPO && b.hotelId === firstStay?.hotel_id && dayNumbers.includes(Number(b.dayNumber))) {
                        return { ...b, hotelId: newHotelId, hotelName: newHotel.name, locationName: newHotel.location_address || '' };
                    }
                    return b;
                });
            }
            if (Array.isArray(pData.accommodations)) {
                pData.accommodations = pData.accommodations.map((a: any) => {
                    if (dayNumbers.includes(Number(a.nightIndex))) {
                        return { ...a, hotelId: newHotelId, hotelName: newHotel.name, selectedRooms, roomId: selectedRooms[0]?.roomId || '', roomName: selectedRooms[0]?.roomName || '', mealPlan: selectedRooms[0]?.mealPlan || 'BB', pricePerNight: avgChargedPriceAcrossStays };
                    }
                    return a;
                });
            }
            finalWrites.push(supabaseAdmin.from('tours').update({ planner_data: pData }).eq('id', tourId).then(r => r));
        }

        if (latestDraftResult.data && Array.isArray((latestDraftResult.data as any).itinerary_data)) {
            const updatedDraft = (latestDraftResult.data as any).itinerary_data.map((b: any) => {
                if (b.type === 'sleep' && dayNumbers.includes(Number(b.dayNumber))) {
                    return { ...b, hotelId: newHotelId, hotelName: newHotel.name, roomName: selectedRooms[0]?.roomName || '', mealPlan: selectedRooms[0]?.mealPlan || 'BB', agreedPrice: avgChargedPriceAcrossStays * totalRoomsAcrossStays, contractedPrice: avgContractedPriceAcrossStays, description: `${oldHotelName} changed due to ${newHotel.name} due to availability` };
                }
                return b;
            });
            finalWrites.push(supabaseAdmin.from('draft_itinerary_versions').update({ itinerary_data: updatedDraft }).eq('id', (latestDraftResult.data as any).id).then(r => r));
        }

        const poBlockIds = Array.from(new Set((junctionResult.data || []).map((r: any) => r.po_block_id).filter(Boolean)));
        if (poBlockIds.length > 0) {
            finalWrites.push(supabaseAdmin.from('po_blocks').update({ name: `${newHotel.name} Block`, updated_at: new Date().toISOString() }).in('id', poBlockIds).then(r => r));
        }

        await Promise.all(finalWrites);
    }

    /**
     * Updates all meal daily_activities in a block to point at a new restaurant,
     * recalculates per-head contracted rates from the restaurant's rate card,
     * and syncs tours.planner_data + draft versions.
     */
    static async updateChangedRestaurant(
        tourId: string,
        mealActivityIds: string[],
        newRestaurantId: string
    ) {
        const supabaseAdmin = createAdminClient();

        // Parallel initial fetches
        const [restaurantResult, activitiesResult] = await Promise.all([
            supabaseAdmin.from('restaurants').select('name, address, city, cuisine_type, breakfast_rate_per_head, lunch_rate_per_head, dinner_rate_per_head, tea_cafe_rate_per_head, coffee_cafe_rate_per_head, juice_bar_rate_per_head').eq('id', newRestaurantId).single(),
            supabaseAdmin.from('daily_activities').select('id, itinerary_id, title, meal_type, quantity').in('id', mealActivityIds)
        ]);

        if (restaurantResult.error || !restaurantResult.data) throw new Error("Restaurant not found: " + restaurantResult.error?.message);
        const restaurant = restaurantResult.data as any;
        const activities: any[] = activitiesResult.data || [];
        if (activities.length === 0) throw new Error("No meal activities found matching provided IDs");

        // Helper: pick rate based on meal type string
        const getRateForMealType = (mealType: string): number => {
            const t = (mealType || '').toLowerCase();
            if (t.includes('breakfast') || t.includes('bb') || t.includes('hb')) return restaurant.breakfast_rate_per_head || 0;
            if (t.includes('dinner') || t.includes('hb')) return restaurant.dinner_rate_per_head || 0;
            if (t.includes('tea')) return restaurant.tea_cafe_rate_per_head || 0;
            if (t.includes('coffee')) return restaurant.coffee_cafe_rate_per_head || 0;
            if (t.includes('juice')) return restaurant.juice_bar_rate_per_head || 0;
            return restaurant.lunch_rate_per_head || 0; // default to lunch
        };

        const itinIds = activities.map((a: any) => a.itinerary_id).filter(Boolean);

        // Parallel: update all meal activities + fetch itineraries for day_number
        const [, itinerariesResult] = await Promise.all([
            Promise.all(activities.map(async (act: any) => {
                const mealType = act.meal_type || act.title || 'Lunch';
                const unitRate = getRateForMealType(mealType);
                const qty = act.quantity || 1;
                return supabaseAdmin.from('daily_activities').update({
                    restaurant_id: newRestaurantId,
                    location_name: restaurant.city || restaurant.address || '',
                    contracted_price: unitRate,
                    contracted_total_price: unitRate * qty,
                    charged_unit_price: unitRate,
                    charged_total_price: unitRate * qty,
                }).eq('id', act.id);
            })),
            itinIds.length > 0
                ? supabaseAdmin.from('tour_itineraries').select('id, day_number').in('id', itinIds)
                : Promise.resolve({ data: [] as any[], error: null })
        ]);

        const itineraries: any[] = (itinerariesResult as any).data || [];
        const dayNumbers = itineraries.map((i: any) => Number(i.day_number)).filter(Boolean);

        // Update tour_itineraries.restaurant_id for matched itinIds
        const itinUpdates: PromiseLike<any>[] = [];
        if (itinIds.length > 0) {
            itinUpdates.push(supabaseAdmin.from('tour_itineraries').update({ restaurant_id: newRestaurantId }).in('id', itinIds));
        }

        // Fetch po_block junction + tours planner_data + latest draft in parallel
        const [junctionResult, tourRecord, latestDraftResult] = await Promise.all([
            supabaseAdmin.from('po_block_daily_activities').select('po_block_id').in('daily_activity_id', mealActivityIds),
            supabaseAdmin.from('tours').select('planner_data').eq('id', tourId).single(),
            supabaseAdmin.from('draft_itinerary_versions').select('id, itinerary_data').eq('tour_id', tourId).order('version_number', { ascending: false }).limit(1).single()
        ]);

        const finalWrites: PromiseLike<any>[] = [...itinUpdates];

        // Update po_blocks name
        const poBlockIds = Array.from(new Set((junctionResult.data || []).map((r: any) => r.po_block_id).filter(Boolean)));
        if (poBlockIds.length > 0) {
            finalWrites.push(supabaseAdmin.from('po_blocks').update({ name: `${restaurant.name} Block`, updated_at: new Date().toISOString() }).in('id', poBlockIds).then(r => r));
        }

        // Update tours.planner_data — update restaurant references in itinerary blocks
        if (tourRecord.data?.planner_data) {
            const pData = tourRecord.data.planner_data as any;
            if (Array.isArray(pData.itinerary)) {
                pData.itinerary = pData.itinerary.map((b: any) => {
                    if (b.type === 'meal' && dayNumbers.includes(Number(b.dayNumber))) {
                        return { ...b, restaurantId: newRestaurantId, restaurantName: restaurant.name, locationName: restaurant.city || restaurant.address || '' };
                    }
                    return b;
                });
            }
            finalWrites.push(supabaseAdmin.from('tours').update({ planner_data: pData }).eq('id', tourId).then(r => r));
        }

        // Update latest draft
        if (latestDraftResult.data && Array.isArray((latestDraftResult.data as any).itinerary_data)) {
            const updatedDraft = (latestDraftResult.data as any).itinerary_data.map((b: any) => {
                if (b.type === 'meal' && dayNumbers.includes(Number(b.dayNumber))) {
                    return { ...b, restaurantId: newRestaurantId, restaurantName: restaurant.name };
                }
                return b;
            });
            finalWrites.push(supabaseAdmin.from('draft_itinerary_versions').update({ itinerary_data: updatedDraft }).eq('id', (latestDraftResult.data as any).id).then(r => r));
        }

        await Promise.all(finalWrites);
    }

    /**
     * Updates all activity daily_activities in a block to point at a new vendor,
     * recalculates contracted rates from vendor_activities pricing,
     * and syncs tours.planner_data + draft versions.
     */
    static async updateChangedVendor(
        tourId: string,
        activityIds: string[],
        newVendorId: string
    ) {
        const supabaseAdmin = createAdminClient();

        // Parallel initial fetches
        const [vendorResult, activitiesResult] = await Promise.all([
            supabaseAdmin.from('vendors').select('id, name, city, email, phone, vendor_activities(id, activity_id, vendor_price)').eq('id', newVendorId).single(),
            supabaseAdmin.from('daily_activities').select('id, itinerary_id, activity_id, quantity').in('id', activityIds)
        ]);

        if (vendorResult.error || !vendorResult.data) throw new Error('Vendor not found: ' + vendorResult.error?.message);
        const vendor = vendorResult.data as any;
        const activities: any[] = activitiesResult.data || [];
        if (activities.length === 0) throw new Error('No activities found matching provided IDs');

        const vendorActivities: any[] = vendor.vendor_activities || [];

        const itinIds = activities.map((a: any) => a.itinerary_id).filter(Boolean);

        // Update all activities + fetch itineraries in parallel
        const [, itinerariesResult] = await Promise.all([
            Promise.all(activities.map(async (act: any) => {
                const va = vendorActivities.find((v: any) => Number(v.activity_id) === Number(act.activity_id));
                const unitRate = va?.vendor_price || 0;
                const qty = act.quantity || 1;
                return supabaseAdmin.from('daily_activities').update({
                    vendor_id: newVendorId,
                    location_name: vendor.city || '',
                    contracted_price: unitRate,
                    contracted_total_price: unitRate * qty,
                    charged_unit_price: unitRate,
                    charged_total_price: unitRate * qty,
                }).eq('id', act.id);
            })),
            itinIds.length > 0
                ? supabaseAdmin.from('tour_itineraries').select('id, day_number').in('id', itinIds)
                : Promise.resolve({ data: [] as any[], error: null })
        ]);

        const itineraries: any[] = (itinerariesResult as any).data || [];
        const dayNumbers = itineraries.map((i: any) => Number(i.day_number)).filter(Boolean);

        // Fetch po_block junction + tours planner_data + latest draft in parallel
        const [junctionResult, tourRecord, latestDraftResult] = await Promise.all([
            supabaseAdmin.from('po_block_daily_activities').select('po_block_id').in('daily_activity_id', activityIds),
            supabaseAdmin.from('tours').select('planner_data').eq('id', tourId).single(),
            supabaseAdmin.from('draft_itinerary_versions').select('id, itinerary_data').eq('tour_id', tourId).order('version_number', { ascending: false }).limit(1).single()
        ]);

        const finalWrites: PromiseLike<any>[] = [];

        // Update po_blocks name
        const poBlockIds = Array.from(new Set((junctionResult.data || []).map((r: any) => r.po_block_id).filter(Boolean)));
        if (poBlockIds.length > 0) {
            finalWrites.push(supabaseAdmin.from('po_blocks').update({ name: `${vendor.name} Block`, updated_at: new Date().toISOString() }).in('id', poBlockIds));
        }

        // Update tours.planner_data
        if (tourRecord.data?.planner_data) {
            const pData = tourRecord.data.planner_data as any;
            if (Array.isArray(pData.itinerary)) {
                pData.itinerary = pData.itinerary.map((b: any) => {
                    if (b.type === 'activity' && dayNumbers.includes(Number(b.dayNumber))) {
                        return { ...b, vendorId: newVendorId, vendorName: vendor.name, locationName: vendor.city || '' };
                    }
                    return b;
                });
            }
            finalWrites.push(supabaseAdmin.from('tours').update({ planner_data: pData }).eq('id', tourId));
        }

        // Update latest draft
        if (latestDraftResult.data && Array.isArray((latestDraftResult.data as any).itinerary_data)) {
            const updatedDraft = (latestDraftResult.data as any).itinerary_data.map((b: any) => {
                if (b.type === 'activity' && dayNumbers.includes(Number(b.dayNumber))) {
                    return { ...b, vendorId: newVendorId, vendorName: vendor.name };
                }
                return b;
            });
            finalWrites.push(supabaseAdmin.from('draft_itinerary_versions').update({ itinerary_data: updatedDraft }).eq('id', (latestDraftResult.data as any).id));
        }

        if (finalWrites.length > 0) await Promise.all(finalWrites);
    }

    /**
     * Updates all travel daily_activities in a block to point at a new transport provider,
     * and syncs tours.planner_data + draft versions.
     * Note: vehicle assignment is tracked via the transport_requirement_vehicles junction table.
     */
    static async updateChangedTransportProvider(
        tourId: string,
        travelActivityIds: string[],
        newProviderId: string
    ) {
        const supabaseAdmin = createAdminClient();

        // Parallel initial fetches
        const [providerResult, activitiesResult] = await Promise.all([
            supabaseAdmin.from('transport_providers').select('id, name, address, transport_vehicles(id, vehicle_type, km_rate, day_rate, with_driver)').eq('id', newProviderId).single(),
            supabaseAdmin.from('daily_activities').select('id, itinerary_id').in('id', travelActivityIds)
        ]);

        if (providerResult.error || !providerResult.data) throw new Error('Transport provider not found: ' + providerResult.error?.message);
        const provider = providerResult.data as any;
        const activities: any[] = activitiesResult.data || [];
        if (activities.length === 0) throw new Error('No travel activities found matching provided IDs');

        const itinIds = activities.map((a: any) => a.itinerary_id).filter(Boolean);

        // Update all travel activities + fetch itineraries in parallel
        const [, itinerariesResult] = await Promise.all([
            supabaseAdmin.from('daily_activities').update({
                transport_id: newProviderId,
                location_name: provider.address || '',
            }).in('id', travelActivityIds),
            itinIds.length > 0
                ? supabaseAdmin.from('tour_itineraries').select('id, day_number').in('id', itinIds)
                : Promise.resolve({ data: [] as any[], error: null })
        ]);

        const itineraries: any[] = (itinerariesResult as any).data || [];
        const dayNumbers = itineraries.map((i: any) => Number(i.day_number)).filter(Boolean);

        // Fetch po_block junction + tours planner_data + latest draft in parallel
        const [junctionResult, tourRecord, latestDraftResult] = await Promise.all([
            supabaseAdmin.from('po_block_daily_activities').select('po_block_id').in('daily_activity_id', travelActivityIds),
            supabaseAdmin.from('tours').select('planner_data').eq('id', tourId).single(),
            supabaseAdmin.from('draft_itinerary_versions').select('id, itinerary_data').eq('tour_id', tourId).order('version_number', { ascending: false }).limit(1).single()
        ]);

        const finalWrites: PromiseLike<any>[] = [];

        // Update po_blocks name
        const poBlockIds = Array.from(new Set((junctionResult.data || []).map((r: any) => r.po_block_id).filter(Boolean)));
        if (poBlockIds.length > 0) {
            finalWrites.push(supabaseAdmin.from('po_blocks').update({ name: `${provider.name} Block`, updated_at: new Date().toISOString() }).in('id', poBlockIds));
        }

        // Update tours.planner_data
        if (tourRecord.data?.planner_data) {
            const pData = tourRecord.data.planner_data as any;
            if (Array.isArray(pData.itinerary)) {
                pData.itinerary = pData.itinerary.map((b: any) => {
                    if (b.type === 'travel' && dayNumbers.includes(Number(b.dayNumber))) {
                        return { ...b, transportId: newProviderId, transportName: provider.name };
                    }
                    return b;
                });
            }
            finalWrites.push(supabaseAdmin.from('tours').update({ planner_data: pData }).eq('id', tourId));
        }

        // Update latest draft
        if (latestDraftResult.data && Array.isArray((latestDraftResult.data as any).itinerary_data)) {
            const updatedDraft = (latestDraftResult.data as any).itinerary_data.map((b: any) => {
                if (b.type === 'travel' && dayNumbers.includes(Number(b.dayNumber))) {
                    return { ...b, transportId: newProviderId, transportName: provider.name };
                }
                return b;
            });
            finalWrites.push(supabaseAdmin.from('draft_itinerary_versions').update({ itinerary_data: updatedDraft }).eq('id', (latestDraftResult.data as any).id));
        }

        if (finalWrites.length > 0) await Promise.all(finalWrites);
    }

    static async updateChangedGuide(
        tourId: string,
        oldGuideId: string,
        newGuideId: string
    ) {
        const supabaseAdmin = createAdminClient();

        // 1. Fetch new guide details
        const { data: newGuide, error: guideErr } = await supabaseAdmin
            .from('tour_guides')
            .select('id, first_name, last_name')
            .eq('id', newGuideId)
            .single();
        if (guideErr || !newGuide) throw new Error("New guide not found: " + guideErr?.message);
        
        const newGuideName = `${newGuide.first_name || ''} ${newGuide.last_name || ''}`.trim();

        // 2. Fetch old guide name (if any)
        const { data: oldGuide } = await supabaseAdmin
            .from('tour_guides')
            .select('first_name, last_name')
            .eq('id', oldGuideId)
            .single();
        const oldGuideName = oldGuide ? `${oldGuide.first_name || ''} ${oldGuide.last_name || ''}`.trim() : 'Unassigned Guide';

        // 3. Update guide_id in daily_activities for this tour
        await supabaseAdmin
            .from('daily_activities')
            .update({ guide_id: newGuideId })
            .eq('tour_id', tourId)
            .eq('guide_id', oldGuideId);

        // 4. Update the po_blocks table name
        const oldBlockNamePattern = `% | ID: ${oldGuideId}`;
        const newBlockName = `Guide: ${newGuideName} | ID: ${newGuideId}`;
        await supabaseAdmin
            .from('po_blocks')
            .update({ name: newBlockName, updated_at: new Date().toISOString() })
            .eq('tour_id', tourId)
            .eq('block_type', 'guide')
            .like('name', oldBlockNamePattern);

        // 5. Update tours planner_data
        const { data: tourRecord } = await supabaseAdmin
            .from('tours')
            .select('planner_data')
            .eq('id', tourId)
            .single();

        const finalWrites: PromiseLike<any>[] = [];

        if (tourRecord?.planner_data) {
            const pData = tourRecord.planner_data as any;
            let changed = false;
            if (pData.defaultGuideId === oldGuideId) {
                pData.defaultGuideId = newGuideId;
                pData.defaultGuideName = newGuideName;
                changed = true;
            }
            if (Array.isArray(pData.itinerary)) {
                pData.itinerary = pData.itinerary.map((b: any) => {
                    if (b.guideId === oldGuideId) {
                        changed = true;
                        return { ...b, guideId: newGuideId, guideName: newGuideName };
                    }
                    return b;
                });
            }
            if (changed) {
                finalWrites.push(supabaseAdmin.from('tours').update({ planner_data: pData }).eq('id', tourId));
            }
        }

        // 6. Update latest draft
        const { data: latestDraft } = await supabaseAdmin
            .from('draft_itinerary_versions')
            .select('id, itinerary_data')
            .eq('tour_id', tourId)
            .order('version_number', { ascending: false })
            .limit(1)
            .single();

        if (latestDraft && Array.isArray((latestDraft as any).itinerary_data)) {
            let changed = false;
            const updatedDraft = (latestDraft as any).itinerary_data.map((b: any) => {
                if (b.guideId === oldGuideId) {
                    changed = true;
                    return { ...b, guideId: newGuideId, guideName: newGuideName };
                }
                return b;
            });
            if (changed) {
                finalWrites.push(supabaseAdmin.from('draft_itinerary_versions').update({ itinerary_data: updatedDraft }).eq('id', (latestDraft as any).id));
            }
        }

        if (finalWrites.length > 0) await Promise.all(finalWrites);
    }

    static async updateChangedDriver(
        tourId: string,
        oldDriverId: string,
        newDriverId: string
    ) {
        const supabaseAdmin = createAdminClient();

        // 1. Fetch new driver details
        const { data: newDriver, error: driverErr } = await supabaseAdmin
            .from('drivers')
            .select('id, first_name, last_name')
            .eq('id', newDriverId)
            .single();
        if (driverErr || !newDriver) throw new Error("New driver not found: " + driverErr?.message);
        
        const newDriverName = `${newDriver.first_name || ''} ${newDriver.last_name || ''}`.trim();

        // 2. Fetch old driver name (if any)
        const { data: oldDriver } = await supabaseAdmin
            .from('drivers')
            .select('first_name, last_name')
            .eq('id', oldDriverId)
            .single();
        const oldDriverName = oldDriver ? `${oldDriver.first_name || ''} ${oldDriver.last_name || ''}`.trim() : 'Unassigned Driver';

        // 3. Update driver_id in daily_activities for this tour
        await supabaseAdmin
            .from('daily_activities')
            .update({ driver_id: newDriverId })
            .eq('tour_id', tourId)
            .eq('driver_id', oldDriverId);

        // 4. Update the po_blocks table name
        const oldBlockNamePattern = `% | ID: ${oldDriverId}`;
        const newBlockName = `Driver: ${newDriverName} | ID: ${newDriverId}`;
        await supabaseAdmin
            .from('po_blocks')
            .update({ name: newBlockName, updated_at: new Date().toISOString() })
            .eq('tour_id', tourId)
            .eq('block_type', 'driver')
            .like('name', oldBlockNamePattern);

        // 5. Update tours planner_data
        const { data: tourRecord } = await supabaseAdmin
            .from('tours')
            .select('planner_data')
            .eq('id', tourId)
            .single();

        const finalWrites: PromiseLike<any>[] = [];

        if (tourRecord?.planner_data) {
            const pData = tourRecord.planner_data as any;
            let changed = false;
            if (pData.defaultDriverId === oldDriverId) {
                pData.defaultDriverId = newDriverId;
                pData.defaultDriverName = newDriverName;
                changed = true;
            }
            if (Array.isArray(pData.itinerary)) {
                pData.itinerary = pData.itinerary.map((b: any) => {
                    if (b.driverId === oldDriverId) {
                        changed = true;
                        return { ...b, driverId: newDriverId, driverName: newDriverName };
                    }
                    return b;
                });
            }
            if (changed) {
                finalWrites.push(supabaseAdmin.from('tours').update({ planner_data: pData }).eq('id', tourId));
            }
        }

        // 6. Update latest draft
        const { data: latestDraft } = await supabaseAdmin
            .from('draft_itinerary_versions')
            .select('id, itinerary_data')
            .eq('tour_id', tourId)
            .order('version_number', { ascending: false })
            .limit(1)
            .single();

        if (latestDraft && Array.isArray((latestDraft as any).itinerary_data)) {
            let changed = false;
            const updatedDraft = (latestDraft as any).itinerary_data.map((b: any) => {
                if (b.driverId === oldDriverId) {
                    changed = true;
                    return { ...b, driverId: newDriverId, driverName: newDriverName };
                }
                return b;
            });
            if (changed) {
                finalWrites.push(supabaseAdmin.from('draft_itinerary_versions').update({ itinerary_data: updatedDraft }).eq('id', (latestDraft as any).id));
            }
        }

        if (finalWrites.length > 0) await Promise.all(finalWrites);
    }
}
