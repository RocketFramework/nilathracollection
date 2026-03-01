import { createClient as createSupabaseClient } from '@/utils/supabase/client';

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
    payment_detail_id?: string;
    payment_details?: PaymentDetails;
}


// --- Helper to save Payment Details ---
async function savePaymentDetails(details: PaymentDetails): Promise<string | undefined> {
    if (!details || Object.keys(details).length === 0 || (!details.bank_name && !details.account_number)) return undefined;

    if (details.id) {
        // Update
        const { error } = await supabase.from('payment_details').update(details).eq('id', details.id);
        if (error) throw error;
        return details.id;
    } else {
        // Insert
        const { data, error } = await supabase.from('payment_details').insert([details]).select().single();
        if (error) throw error;
        return data.id;
    }
}

export class MasterDataService {

    // ==========================================
    // Activities CRUD
    // ==========================================
    static async getActivities() {
        const { data, error } = await supabase.from('activities').select('*').order('activity_name');
        if (error) throw error;
        return data as Activity[];
    }

    // ==========================================
    // Vendors CRUD
    // ==========================================
    static async getVendors() {
        const { data, error } = await supabase.from('vendors').select('*, payment_details(*), vendor_activities(*)').order('name');
        if (error) throw error;
        return data as Vendor[];
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

        const mappedActs = vActivities.map((va: any) => ({
            id: va.id,
            vendor_id: va.vendor_id,
            activity_id: va.activity_id,
            vendor_price: va.vendor_price,
            activity_name: va.activities?.activity_name
        }));

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

        return true;
    }

    static async deleteVendor(id: string) {
        const { error } = await supabase.from('vendors').delete().eq('id', id);
        if (error) throw error;
        return true;
    }

    // ==========================================
    // Transport Providers CRUD
    // ==========================================
    static async getTransportProviders() {
        const { data, error } = await supabase.from('transport_providers').select('*, payment_details(*), transport_vehicles(*)').order('name');
        if (error) throw error;
        return data as TransportProvider[];
    }

    static async getTransportProvider(id: string) {
        const { data, error } = await supabase.from('transport_providers').select('*, payment_details(*), transport_vehicles(*)').eq('id', id).single();
        if (error) throw error;
        return data as TransportProvider;
    }

    static async saveTransportProvider(provider: TransportProvider) {
        const { payment_details, transport_vehicles, id, payment_detail_id, ...providerData } = provider;

        let activePaymentId = payment_detail_id;
        if (payment_details) {
            activePaymentId = await savePaymentDetails(payment_details);
        }

        const payload = { ...providerData, payment_detail_id: activePaymentId };

        let savedProviderId = id;

        if (id) {
            const { error } = await supabase.from('transport_providers').update(payload).eq('id', id);
            if (error) throw error;

            await supabase.from('transport_vehicles').delete().eq('provider_id', id);
        } else {
            const { data, error } = await supabase.from('transport_providers').insert([payload]).select().single();
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
            const { error: vehError } = await supabase.from('transport_vehicles').insert(mappedVehicles);
            if (vehError) throw vehError;
        }

        return true;
    }

    static async deleteTransportProvider(id: string) {
        const { error } = await supabase.from('transport_providers').delete().eq('id', id);
        if (error) throw error;
        return true;
    }

    // ==========================================
    // Drivers CRUD
    // ==========================================
    static async getDrivers() {
        const { data, error } = await supabase.from('drivers').select('*, payment_details(*)').order('first_name');
        if (error) throw error;
        return data as Driver[];
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

        if (id) {
            const { error } = await supabase.from('drivers').update(payload).eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('drivers').insert([payload]);
            if (error) throw error;
        }
        return true;
    }

    static async deleteDriver(id: string) {
        const { error } = await supabase.from('drivers').delete().eq('id', id);
        if (error) throw error;
        return true;
    }

    // ==========================================
    // Tour Guides CRUD
    // ==========================================
    static async getTourGuides() {
        const { data, error } = await supabase.from('tour_guides').select('*, payment_details(*)').order('first_name');
        if (error) throw error;
        return data as TourGuide[];
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

        if (id) {
            const { error } = await supabase.from('tour_guides').update(payload).eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('tour_guides').insert([payload]);
            if (error) throw error;
        }
        return true;
    }

    static async deleteTourGuide(id: string) {
        const { error } = await supabase.from('tour_guides').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
}
