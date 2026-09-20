import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/client';
import {
    CreateActivityBookingDTO,
    ConfirmActivityBookingDTO,
    UpdateActivityBookingStatusDTO
} from '@/dtos/activity-booking.dto';
import { ActivityBooking, ActivityBookingItem } from '@/types/activity-booking.type';
import { EmailService } from './email.service';

export class ActivityBookingService {
    /**
     * Submits a new multi-activity booking request.
     * Auto-detects logged-in user or creates/links tourist account in users and tourist_profiles.
     */
    static async createBooking(dto: CreateActivityBookingDTO, currentUserId?: string): Promise<ActivityBooking> {
        const supabase = createAdminClient();
        let touristId = currentUserId;
        let generatedPassword: string | null = null;

        // 1. Resolve or Create Tourist Account & Profile
        if (!touristId) {
            // Check if user exists by email
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', dto.email)
                .maybeSingle();

            if (existingUser) {
                touristId = existingUser.id;
            } else {
                // Create new Supabase Auth User
                generatedPassword = Math.random().toString(36).slice(-8) + 'A1!';
                const { data: authUser, error: createErr } = await supabase.auth.admin.createUser({
                    email: dto.email,
                    password: generatedPassword,
                    email_confirm: true,
                    user_metadata: { first_name: dto.first_name, last_name: dto.last_name }
                });

                if (createErr || !authUser.user) {
                    throw new Error(createErr?.message || "Failed to create tourist account");
                }
                touristId = authUser.user.id;
            }

            // Ensure public.users record exists
            await supabase.from('users').upsert({ id: touristId, email: dto.email });
        }


        // 2. Upsert Tourist Profile with details
        if (touristId) {
            const profileData: Record<string, any> = {
                id: touristId,
                updated_at: new Date().toISOString()
            };
            if (dto.first_name !== undefined) profileData.first_name = dto.first_name;
            if (dto.last_name !== undefined) profileData.last_name = dto.last_name;
            if (dto.phone !== undefined) profileData.phone = dto.phone;
            if (dto.country !== undefined) profileData.country = dto.country;
            if (dto.passport_number !== undefined) profileData.passport_number = dto.passport_number;
            if (dto.departure_country !== undefined) profileData.departure_country = dto.departure_country;
            if (dto.arrival_date !== undefined) profileData.arrival_date = dto.arrival_date;
            if (dto.departure_date !== undefined) profileData.departure_date = dto.departure_date;
            if (dto.medical_conditions !== undefined) profileData.medical_conditions = dto.medical_conditions;
            if (dto.language_preference !== undefined) profileData.language_preference = dto.language_preference;
            if (dto.special_notes !== undefined) profileData.special_notes = dto.special_notes;

            await supabase
                .from('tourist_profiles')
                .upsert(profileData);
        }

        // 3. Create Activity Booking Header
        const bookingNumber = `ACT-${Date.now().toString().slice(-6)}`;
        const bookingId = crypto.randomUUID();

        const { data: bookingHeader, error: bookingErr } = await supabase
            .from('activity_bookings')
            .insert([{
                id: bookingId,
                booking_number: bookingNumber,
                tourist_id: touristId,
                status: 'Pending Assignment',
                currency: 'USD'
            }])
            .select()
            .single();

        if (bookingErr) throw bookingErr;

        // 4. Create Activity Booking Items
        const itemsToInsert = dto.items.map(item => ({
            id: crypto.randomUUID(),
            booking_id: bookingId,
            activity_id: item.activity_id,
            booking_date: item.booking_date,
            preferred_time_slot: item.preferred_time_slot || 'Flexible',
            adults: item.adults || 1,
            children: item.children || 0,
            infants: item.infants || 0,
            status: 'Pending Assignment'
        }));

        const { data: insertedItems, error: itemsErr } = await supabase
            .from('activity_booking_items')
            .insert(itemsToInsert)
            .select();

        if (itemsErr) throw itemsErr;

        // 5. Send Email Notification to Tourist
        try {
            await EmailService.sendTouristActivityRequestReceipt({
                email: dto.email,
                name: `${dto.first_name || ''} ${dto.last_name || ''}`.trim() || 'Valued Tourist',
                bookingNumber: bookingNumber,
                itemCount: dto.items.length,
                loginPassword: generatedPassword
            });
        } catch (emailErr) {
            console.error("Failed to send tourist activity receipt email:", emailErr);
        }

        return {
            ...bookingHeader,
            items: insertedItems as ActivityBookingItem[]
        };
    }

    /**
     * Gets all activity booking requests for the authenticated tourist.
     */
    static async getMyActivityBookings(touristId: string): Promise<ActivityBooking[]> {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('activity_bookings')
            .select(`
                *,
                items:activity_booking_items(
                    *,
                    activity:activities(
                        id,
                        activity_name,
                        category,
                        location_name,
                        district,
                        duration_hours,
                        description,
                        optimal_start_time,
                        optimal_end_time
                    ),
                    vendor:vendors(
                        id,
                        name,
                        phone,
                        email,
                        address
                    )
                )
            `)
            .eq('tourist_id', touristId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as ActivityBooking[];
    }

    /**
     * Gets all activity booking requests for the Admin Panel.
     */
    static async getAllBookings(filters?: { status?: string; search?: string }): Promise<ActivityBooking[]> {
        const supabase = createAdminClient();

        let query = supabase
            .from('activity_bookings')
            .select(`
                *,
                items:activity_booking_items(
                    *,
                    activity:activities(
                        id,
                        activity_name,
                        category,
                        location_name,
                        district,
                        duration_hours,
                        description,
                        optimal_start_time,
                        optimal_end_time
                    ),
                    vendor:vendors(
                        id,
                        name,
                        phone,
                        email,
                        address
                    )
                ),
                user:users(
                    id,
                    email
                )
            `)
            .order('created_at', { ascending: false });

        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (error) throw error;

        const bookings = (data || []) as ActivityBooking[];
        if (bookings.length > 0) {
            const touristIds = Array.from(new Set(bookings.map(b => b.tourist_id).filter(Boolean)));
            if (touristIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('tourist_profiles')
                    .select('id, first_name, last_name, phone, country, passport_number, departure_country, arrival_date, departure_date, medical_conditions, language_preference, special_notes')
                    .in('id', touristIds);

                const profileMap = new Map((profiles || []).map(p => [p.id, p]));
                bookings.forEach(b => {
                    b.tourist_profile = profileMap.get(b.tourist_id) || null;
                });
            }
        }

        return bookings;
    }

    /**
     * Gets a single activity booking details by ID.
     */
    static async getBookingById(bookingId: string): Promise<ActivityBooking> {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('activity_bookings')
            .select(`
                *,
                items:activity_booking_items(
                    *,
                    activity:activities(
                        id,
                        activity_name,
                        category,
                        location_name,
                        district,
                        duration_hours,
                        description,
                        optimal_start_time,
                        optimal_end_time
                    ),
                    vendor:vendors(
                        id,
                        name,
                        phone,
                        email,
                        address
                    )
                ),
                user:users(
                    id,
                    email
                )
            `)
            .eq('id', bookingId)
            .single();

        if (error) throw error;
        const booking = data as ActivityBooking;
        if (booking && booking.tourist_id) {
            const { data: profile } = await supabase
                .from('tourist_profiles')
                .select('first_name, last_name, phone, country, passport_number, departure_country, arrival_date, departure_date, medical_conditions, language_preference, special_notes')
                .eq('id', booking.tourist_id)
                .maybeSingle();

            booking.tourist_profile = profile || null;
        }

        return booking;
    }

    /**
     * Admin action: Confirms activity prices, assigns vendors, and triggers dual emails.
     */
    static async confirmBookingAndAssignVendors(dto: ConfirmActivityBookingDTO): Promise<boolean> {
        const supabase = createAdminClient();

        let calculatedSubtotal = 0;

        // 1. Process item assignments
        for (const assign of dto.item_assignments) {
            const itemUpdate: Record<string, any> = {
                status: 'Assigned',
                updated_at: new Date().toISOString()
            };

            if (assign.vendor_id) {
                itemUpdate.assigned_vendor_id = assign.vendor_id;
                itemUpdate.assigned_at = new Date().toISOString();
            }
            if (assign.item_price !== undefined) {
                itemUpdate.item_price = assign.item_price;
                calculatedSubtotal += (Number(assign.item_price) || 0);
            }
            if (assign.agreed_vendor_price !== undefined) {
                itemUpdate.agreed_vendor_price = assign.agreed_vendor_price;
            }

            await supabase
                .from('activity_booking_items')
                .update(itemUpdate)
                .eq('id', assign.item_id);

            // Trigger Email to Assigned Vendor if vendor set
            if (assign.vendor_id) {
                try {
                    const { data: itemWithVendor } = await supabase
                        .from('activity_booking_items')
                        .select(`
                            *,
                            activity:activities(activity_name, location_name, district, duration_hours),
                            vendor:vendors(name, email, phone),
                            booking:activity_bookings(booking_number)
                        `)
                        .eq('id', assign.item_id)
                        .single();

                    if (itemWithVendor?.vendor?.email) {
                        await EmailService.sendVendorActivityAssignmentNotification({
                            vendorEmail: itemWithVendor.vendor.email,
                            vendorName: itemWithVendor.vendor.name,
                            bookingNumber: itemWithVendor.booking?.booking_number || 'ACT-XXXXXX',
                            activityName: itemWithVendor.activity?.activity_name || 'Activity Experience',
                            location: itemWithVendor.activity?.location_name || '',
                            bookingDate: itemWithVendor.booking_date,
                            preferredTimeSlot: itemWithVendor.preferred_time_slot,
                            adults: itemWithVendor.adults,
                            children: itemWithVendor.children,
                            infants: itemWithVendor.infants,
                            agreedVendorPrice: assign.agreed_vendor_price || 0
                        });
                    }
                } catch (vendorEmailErr) {
                    console.error("Failed to send vendor assignment email:", vendorEmailErr);
                }
            }
        }

        const totalPrice = dto.total_price !== undefined ? dto.total_price : calculatedSubtotal;

        // 2. Update Booking Header
        const { data: updatedHeader, error: headerErr } = await supabase
            .from('activity_bookings')
            .update({
                total_price: totalPrice,
                admin_notes: dto.admin_notes || null,
                status: 'Confirmed',
                updated_at: new Date().toISOString()
            })
            .eq('id', dto.booking_id)
            .select(`
                *,
                user:users(email)
            `)
            .single();

        if (headerErr) throw headerErr;

        if (updatedHeader && updatedHeader.tourist_id) {
            const { data: prof } = await supabase
                .from('tourist_profiles')
                .select('first_name, last_name')
                .eq('id', updatedHeader.tourist_id)
                .maybeSingle();

            updatedHeader.tourist_profile = prof || null;
        }

        // 3. Send Price Confirmation Email to Tourist
        if (updatedHeader?.user?.email) {
            try {
                await EmailService.sendTouristActivityPriceConfirmation({
                    email: updatedHeader.user.email,
                    name: `${updatedHeader.tourist_profile?.first_name || ''} ${updatedHeader.tourist_profile?.last_name || ''}`.trim() || 'Valued Tourist',
                    bookingNumber: updatedHeader.booking_number,
                    totalPrice: totalPrice,
                    currency: updatedHeader.currency || 'USD'
                });
            } catch (touristEmailErr) {
                console.error("Failed to send tourist price confirmation email:", touristEmailErr);
            }
        }

        return true;
    }

    /**
     * Updates booking status (e.g. Completed or Cancelled).
     */
    static async updateBookingStatus(dto: UpdateActivityBookingStatusDTO): Promise<boolean> {
        const supabase = createAdminClient();

        const { error } = await supabase
            .from('activity_bookings')
            .update({
                status: dto.status,
                admin_notes: dto.admin_notes || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', dto.booking_id);

        if (error) throw error;
        return true;
    }

    /**
     * Gets all active activities from master data for public catalog browsing.
     */
    static async getPublicActivities(filters?: { category?: string; district?: string; search?: string }) {
        const supabase = createAdminClient();

        let query = supabase.from('activities').select('*').order('activity_name', { ascending: true });

        if (filters?.category && filters.category !== 'all') {
            query = query.ilike('category', `%${filters.category}%`);
        }
        if (filters?.district && filters.district !== 'all') {
            query = query.eq('district', filters.district);
        }
        if (filters?.search && filters.search.trim()) {
            const term = filters.search.trim();
            query = query.or(`activity_name.ilike.%${term}%,description.ilike.%${term}%,location_name.ilike.%${term}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }
}
