import { createClient as createSupabaseClient } from '@/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

const supabase = createSupabaseClient();

export interface PaymentDetails {
    id?: string;
    bank_name?: string;
    branch_name?: string;
    account_name?: string;
    account_number?: string;
    swift_code?: string;
}

export interface VendorActivity {
    id?: string;
    vendor_id?: string;
    activity_id: number;
    vendor_price?: number;
    activity_name?: string; // Loaded from joining activities table
}

export interface Activity {
    id?: number;
    category: string;
    activity_name: string;
    location_name: string;
    district: string;
    lat?: number;
    lng?: number;
    description: string;
    duration_hours: number;
    optimal_start_time?: string;
    optimal_end_time?: string;
    time_flexible: boolean;
    price?: number;
}

export interface Vendor {
    id?: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    lat?: number;
    lng?: number;
    description?: string;
    is_suspended?: boolean;
    payment_detail_id?: string;
    payment_details?: PaymentDetails;
    vendor_activities?: VendorActivity[];
}

export interface Driver {
    id?: string;
    first_name: string;
    last_name?: string;
    phone?: string;
    license_number?: string;
    nic_number?: string;
    is_suspended?: boolean;
    per_day_rate?: number;
    payment_detail_id?: string;
    payment_details?: PaymentDetails;
}

export interface TransportVehicle {
    id?: string;
    provider_id?: string;
    vehicle_type: string;
    make_and_model?: string;
    year_of_manufacture?: number;
    vehicle_number?: string;
    with_driver?: boolean;
    km_rate?: number;
    day_rate?: number;
    max_km_per_day?: number;
    additional_km_rate?: number;
}

export interface TransportProvider {
    id?: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    lat?: number;
    lng?: number;
    nic_number?: string;
    is_suspended?: boolean;
    payment_detail_id?: string;
    payment_details?: PaymentDetails;
    transport_vehicles?: TransportVehicle[];
}

export interface TourGuide {
    id?: string;
    first_name: string;
    last_name?: string;
    phone?: string;
    languages?: string[];
    license_id?: string;
    is_suspended?: boolean;
    per_day_rate?: number;
    payment_detail_id?: string;
    payment_details?: PaymentDetails;
}
export interface Restaurant {
    id?: string;
    name: string;
    address?: string;
    city?: string;
    district?: string;
    cuisine_type?: string;
    contact_name?: string;
    contact_number?: string;
    email?: string;
    lat?: number;
    lng?: number;
    total_capacity?: number;
    has_breakfast: boolean;
    has_lunch: boolean;
    has_dinner: boolean;
    has_tea_cafe?: boolean;
    has_coffee_cafe?: boolean;
    has_juice_bar?: boolean;
    is_buffet: boolean;
    breakfast_rate_per_head?: number;
    lunch_rate_per_head?: number;
    dinner_rate_per_head?: number;
    tea_cafe_rate_per_head?: number;
    coffee_cafe_rate_per_head?: number;
    juice_bar_rate_per_head?: number;
    is_suspended?: boolean;
    payment_detail_id?: string;
    payment_details?: PaymentDetails;
}

// --- Helper to save Payment Details ---
async function savePaymentDetails(details: PaymentDetails, client?: any): Promise<string | undefined> {
    const dbClient = client || supabase;
    if (!details || Object.keys(details).length === 0 || (!details.bank_name && !details.account_number)) return undefined;

    if (details.id) {
        // Update
        const { error } = await dbClient.from('payment_details').update(details).eq('id', details.id);
        if (error) throw error;
        return details.id;
    } else {
        // Insert
        const { data, error } = await dbClient.from('payment_details').insert([details]).select().single();
        if (error) throw error;
        return data.id;
    }
}

export class MasterDataService {

    // ==========================================
    // Activities CRUD
    // ==========================================
    static async getActivities(options?: {
        searchTerm?: string;
        page?: number;
        pageSize?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        client?: SupabaseClient;
    }) {
        const supabaseClient = options?.client || supabase;
        let query = supabaseClient.from('activities').select('*', { count: 'exact' });

        if (options?.searchTerm) {
            query = query.or(`activity_name.ilike.%${options.searchTerm}%,location_name.ilike.%${options.searchTerm}%,category.ilike.%${options.searchTerm}%`);
        }

        if (options?.sortBy) {
            query = query.order(options.sortBy, { ascending: options.sortOrder !== 'desc' });
        } else {
            query = query.order('activity_name');
        }

        if (options?.page !== undefined && options?.pageSize !== undefined) {
            const from = options.page * options.pageSize;
            const to = from + options.pageSize - 1;
            query = query.range(from, to);
        }

        const { data, error, count } = await query;
        if (error) throw error;
        return { data: data as Activity[], count: count || 0 };
    }

    // ==========================================
    // Vendors CRUD
    // ==========================================
    static async getVendors(options?: {
        searchTerm?: string;
        page?: number;
        pageSize?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        client?: SupabaseClient;
    }) {
        const supabaseClient = options?.client || supabase;

        try {
            // 1. Initial Query for Vendors with count
            let query = supabaseClient.from('vendors').select('*, payment_details(*)', { count: 'exact' });

            if (options?.searchTerm) {
                query = query.or(`name.ilike.%${options.searchTerm}%,email.ilike.%${options.searchTerm}%,phone.ilike.%${options.searchTerm}%`);
            }

            if (options?.sortBy) {
                query = query.order(options.sortBy, { ascending: options.sortOrder !== 'desc' });
            } else {
                query = query.order('name');
            }

            if (options?.page !== undefined && options?.pageSize !== undefined) {
                const from = options.page * options.pageSize;
                const to = from + options.pageSize - 1;
                query = query.range(from, to);
            }

            const { data: vendors, error: vError, count } = await query;

            if (vError) throw vError;
            if (!vendors) return { data: [], count: 0 };

            // 2. Fetch Vendor Activities along with Activity names
            const vendorIds = vendors.map((v: Vendor) => v.id);
            const { data: vendorActivities, error: vaError } = await supabaseClient
                .from('vendor_activities')
                .select(`
                    *,
                    activities:activities (
                        activity_name,
                        location_name,
                        district
                    )
                `)
                .in('vendor_id', vendorIds);

            if (vaError) {
                console.error("Error fetching vendor_activities, returning vendors only:", vaError);
                return { data: vendors as Vendor[], count: count || 0 };
            }

            // 3. Join in memory
            const mappedVendors = (vendors as Vendor[]).map(v => ({
                ...v,
                vendor_activities: (vendorActivities || [])
                    .filter((va: any) => va.vendor_id === v.id)
                    .map((va: any) => {
                        const actData = va.activities || va.activity;
                        const actName = Array.isArray(actData)
                            ? actData[0]?.activity_name
                            : actData?.activity_name;

                        return {
                            ...va,
                            activity_name: actName || va.name || 'Specific Activity'
                        };
                    })
            }));

            return { data: mappedVendors as Vendor[], count: count || 0 };
        } catch (err) {
            console.error("Critical error in getVendors service:", err);
            // Minimal fallback for production stability (non-paginated if error occurs)
            const { data, count } = await supabaseClient.from('vendors').select('*', { count: 'exact' }).limit(50);
            return { data: (data || []) as Vendor[], count: count || 0 };
        }
    }

    static async getVendorsForActivity(activityId: number | string) {
        // 1. Go to vendor_activities table to filter by activity to select vendor id
        const { data: vaData, error: vaError } = await supabase
            .from('vendor_activities')
            .select('vendor_id, vendor_price')
            .eq('activity_id', Number(activityId));

        if (vaError) throw vaError;
        if (!vaData || vaData.length === 0) return [];

        const vendorIds = vaData.map(va => va.vendor_id);

        // 2. Go to vendors table to select all the vendors who support this activity
        const { data: vendorsData, error: vError } = await supabase
            .from('vendors')
            .select('*, payment_details(*)')
            .in('id', vendorIds)
            .eq('is_suspended', false);

        if (vError) throw vError;

        // 3. Re-attach the specific vendor activity price so the UI has it readily available
        return vendorsData.map(v => {
            const mappedVa = vaData.find(va => va.vendor_id === v.id);
            return {
                ...v,
                vendor_activities: mappedVa ? [{
                    activity_id: Number(activityId),
                    vendor_price: mappedVa.vendor_price,
                    vendor_id: v.id
                }] : []
            };
        }) as Vendor[];
    }

    static async getVendor(id: string) {
        const { data, error } = await supabase.from('vendors').select('*, payment_details(*)').eq('id', id).single();
        if (error) throw error;

        // Fetch vendor activities
        const { data: vActivities, error: vActsError } = await supabase
            .from('vendor_activities')
            .select(`
                id, vendor_id, activity_id, vendor_price,
                activities (activity_name)
            `).eq('vendor_id', id);

        if (vActsError) throw vActsError;

        const mappedActs = (vActivities as unknown as Array<{
            id: string;
            vendor_id: string;
            activity_id: number;
            vendor_price: number;
            activities: { activity_name: string } | Array<{ activity_name: string }> | null;
        }>).map((va) => {
            const actName = Array.isArray(va.activities)
                ? va.activities[0]?.activity_name
                : va.activities?.activity_name;
            return {
                id: va.id,
                vendor_id: va.vendor_id,
                activity_id: va.activity_id,
                vendor_price: va.vendor_price,
                activity_name: actName
            };
        });

        return { ...data, vendor_activities: mappedActs } as Vendor;
    }

    static async saveVendor(vendor: Vendor) {
        const { payment_details, vendor_activities, id, payment_detail_id, ...vendorData } = vendor;

        let activePaymentId = payment_detail_id;
        if (payment_details) {
            activePaymentId = await savePaymentDetails(payment_details);
        }

        const payload = { ...vendorData, payment_detail_id: activePaymentId };

        let savedVendorId = id;

        if (id) {
            // Update
            const { error } = await supabase.from('vendors').update(payload).eq('id', id);
            if (error) throw error;

            // Wipe existing mapped activities for simple rewrite
            await supabase.from('vendor_activities').delete().eq('vendor_id', id);
        } else {
            // Insert
            const { data, error } = await supabase.from('vendors').insert([payload]).select().single();
            if (error) throw error;
            savedVendorId = data.id;
        }

        // Insert Vendor Activities mapping
        if (vendor_activities && vendor_activities.length > 0 && savedVendorId) {
            const mappedToInsert = vendor_activities.map(va => ({
                vendor_id: savedVendorId,
                activity_id: va.activity_id,
                vendor_price: va.vendor_price
            }));
            const { error: actsError } = await supabase.from('vendor_activities').insert(mappedToInsert);
            if (actsError) throw actsError;
        }

        return savedVendorId;
    }

    static async deleteVendor(id: string) {
        const { error } = await supabase.from('vendors').delete().eq('id', id);
        if (error) throw error;
        return true;
    }

    // ==========================================
    // Transport Providers CRUD
    // ==========================================
    static async getTransportProviders(options?: {
        searchTerm?: string;
        page?: number;
        pageSize?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        client?: SupabaseClient;
    }) {
        const supabaseClient = options?.client || supabase;
        try {
            // 1. Initial Query for Transport Providers
            let query = supabaseClient.from('transport_providers').select('*, payment_details(*)', { count: 'exact' });

            if (options?.searchTerm) {
                query = query.or(`name.ilike.%${options.searchTerm}%,email.ilike.%${options.searchTerm}%,phone.ilike.%${options.searchTerm}%`);
            }

            if (options?.sortBy) {
                query = query.order(options.sortBy, { ascending: options.sortOrder !== 'desc' });
            } else {
                query = query.order('name');
            }

            if (options?.page !== undefined && options?.pageSize !== undefined) {
                const from = options.page * options.pageSize;
                const to = from + options.pageSize - 1;
                query = query.range(from, to);
            }

            const { data: providers, error: pError, count } = await query;

            if (pError) throw pError;
            if (!providers) return { data: [], count: 0 };

            // 2. Fetch associated vehicles
            const providerIds = providers.map((p: TransportProvider) => p.id);
            const { data: vehicles, error: vError } = await supabaseClient
                .from('transport_vehicles')
                .select('*')
                .in('provider_id', providerIds);

            if (vError) {
                console.error("Error fetching vehicles, returning providers only:", vError);
                return { data: providers as TransportProvider[], count: count || 0 };
            }

            // 3. Join in memory
            const mappedProviders = (providers as TransportProvider[]).map(p => ({
                ...p,
                transport_vehicles: (vehicles || []).filter((v: any) => v.provider_id === p.id)
            }));

            return { data: mappedProviders as TransportProvider[], count: count || 0 };
        } catch (err) {
            console.error("Error in getTransportProviders:", err);
            const { data, count } = await supabaseClient.from('transport_providers').select('*, payment_details(*)', { count: 'exact' }).limit(50);
            return { data: (data || []) as TransportProvider[], count: count || 0 };
        }
    }

    static async getTransportProvider(id: string) {
        const { data, error } = await supabase.from('transport_providers').select('*, payment_details(*), transport_vehicles(*)').eq('id', id).single();
        if (error) throw error;
        return data as TransportProvider;
    }

    static async saveTransportProvider(provider: TransportProvider, options?: { client?: any }) {
        const dbClient = options?.client || supabase;
        const { payment_details, transport_vehicles, id, payment_detail_id, ...providerData } = provider;

        let activePaymentId = payment_detail_id;
        if (payment_details) {
            activePaymentId = await savePaymentDetails(payment_details, dbClient);
        }

        const payload = { ...providerData, payment_detail_id: activePaymentId };

        let savedProviderId = id;

        if (id) {
            const { error } = await dbClient.from('transport_providers').update(payload).eq('id', id);
            if (error) throw error;

            await dbClient.from('transport_vehicles').delete().eq('provider_id', id);
        } else {
            const { data, error } = await dbClient.from('transport_providers').insert([payload]).select().single();
            if (error) throw error;
            savedProviderId = data.id;
        }

        if (transport_vehicles && transport_vehicles.length > 0 && savedProviderId) {
            const mappedVehicles = transport_vehicles.map(v => ({
                provider_id: savedProviderId,
                vehicle_type: v.vehicle_type,
                make_and_model: v.make_and_model,
                year_of_manufacture: v.year_of_manufacture,
                vehicle_number: v.vehicle_number,
                with_driver: v.with_driver !== undefined ? v.with_driver : true,
                km_rate: v.km_rate,
                day_rate: v.day_rate,
                max_km_per_day: v.max_km_per_day,
                additional_km_rate: v.additional_km_rate
            }));
            const { error: vehError } = await dbClient.from('transport_vehicles').insert(mappedVehicles);
            if (vehError) throw vehError;
        }

        return savedProviderId;
    }

    static async deleteTransportProvider(id: string) {
        const { error } = await supabase.from('transport_providers').delete().eq('id', id);
        if (error) throw error;
        return true;
    }

    // ==========================================
    // Drivers CRUD
    // ==========================================
    static async getDrivers(options?: {
        searchTerm?: string;
        page?: number;
        pageSize?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        client?: SupabaseClient;
    }) {
        const supabaseClient = options?.client || supabase;
        let query = supabaseClient.from('drivers').select('*, payment_details(*)', { count: 'exact' });

        if (options?.searchTerm) {
            query = query.or(`first_name.ilike.%${options.searchTerm}%,last_name.ilike.%${options.searchTerm}%,phone.ilike.%${options.searchTerm}%`);
        }

        if (options?.sortBy) {
            query = query.order(options.sortBy, { ascending: options.sortOrder !== 'desc' });
        } else {
            query = query.order('first_name');
        }

        if (options?.page !== undefined && options?.pageSize !== undefined) {
            const from = options.page * options.pageSize;
            const to = from + options.pageSize - 1;
            query = query.range(from, to);
        }

        const { data, error, count } = await query;
        if (error) throw error;
        return { data: data as Driver[], count: count || 0 };
    }

    static async getDriver(id: string) {
        const { data, error } = await supabase.from('drivers').select('*, payment_details(*)').eq('id', id).single();
        if (error) throw error;
        return data as Driver;
    }

    static async saveDriver(driver: Driver) {
        const { payment_details, id, payment_detail_id, ...driverData } = driver;

        let activePaymentId = payment_detail_id;
        if (payment_details) {
            activePaymentId = await savePaymentDetails(payment_details);
        }

        const payload = { ...driverData, payment_detail_id: activePaymentId };

        let savedId = id;
        if (id) {
            const { error } = await supabase.from('drivers').update(payload).eq('id', id);
            if (error) throw error;
        } else {
            const { data, error } = await supabase.from('drivers').insert([payload]).select().single();
            if (error) throw error;
            savedId = data.id;
        }
        return savedId;
    }

    static async deleteDriver(id: string) {
        const { error } = await supabase.from('drivers').delete().eq('id', id);
        if (error) throw error;
        return true;
    }

    // ==========================================
    // Tour Guides CRUD
    // ==========================================
    static async getTourGuides(options?: {
        searchTerm?: string;
        page?: number;
        pageSize?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        client?: SupabaseClient;
    }) {
        const supabaseClient = options?.client || supabase;
        let query = supabaseClient.from('tour_guides').select('*, payment_details(*)', { count: 'exact' });

        if (options?.searchTerm) {
            query = query.or(`first_name.ilike.%${options.searchTerm}%,last_name.ilike.%${options.searchTerm}%,phone.ilike.%${options.searchTerm}%`);
        }

        if (options?.sortBy) {
            query = query.order(options.sortBy, { ascending: options.sortOrder !== 'desc' });
        } else {
            query = query.order('first_name');
        }

        if (options?.page !== undefined && options?.pageSize !== undefined) {
            const from = options.page * options.pageSize;
            const to = from + options.pageSize - 1;
            query = query.range(from, to);
        }

        const { data, error, count } = await query;
        if (error) throw error;
        return { data: data as TourGuide[], count: count || 0 };
    }

    static async getTourGuide(id: string) {
        const { data, error } = await supabase.from('tour_guides').select('*, payment_details(*)').eq('id', id).single();
        if (error) throw error;
        return data as TourGuide;
    }

    static async saveTourGuide(guide: TourGuide) {
        const { payment_details, id, payment_detail_id, ...guideData } = guide;

        let activePaymentId = payment_detail_id;
        if (payment_details) {
            activePaymentId = await savePaymentDetails(payment_details);
        }

        const payload = { ...guideData, payment_detail_id: activePaymentId };

        let savedId = id;
        if (id) {
            const { error } = await supabase.from('tour_guides').update(payload).eq('id', id);
            if (error) throw error;
        } else {
            const { data, error } = await supabase.from('tour_guides').insert([payload]).select().single();
            if (error) throw error;
            savedId = data.id;
        }
        return savedId;
    }

    static async deleteTourGuide(id: string) {
        const { error } = await supabase.from('tour_guides').delete().eq('id', id);
        if (error) throw error;
        return true;
    }

    // ==========================================
    // Restaurants CRUD
    // ==========================================
    static async getRestaurants(options?: {
        searchTerm?: string;
        page?: number;
        pageSize?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        client?: SupabaseClient;
    }) {
        const supabaseClient = options?.client || supabase;
        let query = supabaseClient.from('restaurants').select('*, payment_details(*)', { count: 'exact' });

        if (options?.searchTerm) {
            query = query.or(`name.ilike.%${options.searchTerm}%,address.ilike.%${options.searchTerm}%,email.ilike.%${options.searchTerm}%`);
        }

        if (options?.sortBy) {
            query = query.order(options.sortBy, { ascending: options.sortOrder !== 'desc' });
        } else {
            query = query.order('name');
        }

        if (options?.page !== undefined && options?.pageSize !== undefined) {
            const from = options.page * options.pageSize;
            const to = from + options.pageSize - 1;
            query = query.range(from, to);
        }

        const { data, error, count } = await query;
        if (error) throw error;
        return { data: data as Restaurant[], count: count || 0 };
    }

    static async getRestaurant(id: string) {
        const { data, error } = await supabase.from('restaurants').select('*, payment_details(*)').eq('id', id).single();
        if (error) throw error;
        return data as Restaurant;
    }

    static async saveRestaurant(restaurant: Restaurant) {
        const { payment_details, id, payment_detail_id, ...restaurantData } = restaurant;

        let activePaymentId = payment_detail_id;
        if (payment_details) {
            activePaymentId = await savePaymentDetails(payment_details);
        }

        const payload = { ...restaurantData, payment_detail_id: activePaymentId };

        let savedId = id;
        if (id) {
            const { error } = await supabase.from('restaurants').update(payload).eq('id', id);
            if (error) throw error;
        } else {
            const { data, error } = await supabase.from('restaurants').insert([payload]).select().single();
            if (error) throw error;
            savedId = data.id;
        }
        return savedId;
    }

    static async deleteRestaurant(id: string) {
        const { error } = await supabase.from('restaurants').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
}
