import { createAdminClient } from '@/utils/supabase/admin';
import { TransportProviderOnboardingDTO, TourGuideOnboardingDTO, PartnerVerificationResultDTO } from '@/dtos/partner-onboarding.dto';
import { Settings } from '@/types/types';
import { validateSriLankanNIC } from '@/utils/nic-validation';

export class PartnerOnboardingService {
    /**
     * Verifies onboarding code and fetches existing record for the given NIC if present.
     */
    static async verifyAndFetch(
        partnerType: 'transport' | 'guide',
        code: string,
        nic: string,
        userIp: string
    ): Promise<PartnerVerificationResultDTO> {
        const adminSupabase = createAdminClient();
        const cleanNic = (nic || '').trim().toUpperCase();
        const cleanCode = (code || '').trim();

        if (!cleanNic) {
            return { success: false, error: 'Sri Lankan National ID (NIC) number is required.' };
        }

        // Validate Sri Lankan NIC format & day range using validator helper
        const nicVal = validateSriLankanNIC(cleanNic);
        if (!nicVal.isValid) {
            return {
                success: false,
                error: nicVal.error || 'Invalid Sri Lankan National ID (NIC) format.'
            };
        }

        if (!cleanCode) {
            return { success: false, error: 'Onboarding Code is required.' };
        }

        // 1. Fetch expected onboarding code from app_settings
        const settingKey = partnerType === 'transport'
            ? Settings.Transport_Partner_Onboarding_Code
            : Settings.Tour_Guide_Onboarding_Code;

        const defaultCode = partnerType === 'transport' ? 'NILATHRA-TRANS-2026' : 'NILATHRA-GUIDE-2026';

        const { data: settingData } = await adminSupabase
            .from('app_settings')
            .select('setting_value')
            .eq('setting_key', settingKey)
            .maybeSingle();

        const expectedCode = settingData?.setting_value?.trim() || defaultCode;

        // 2. Check for existing record by NIC
        if (partnerType === 'transport') {
            const { data: existingProvider, error: pError } = await adminSupabase
                .from('transport_providers')
                .select('*, payment_details(*), transport_vehicles(*)')
                .eq('nic_number', cleanNic)
                .maybeSingle();

            if (pError) {
                console.error("Error querying transport_providers by NIC:", pError);
                return { success: false, error: "Database verification failed. Please try again." };
            }

            if (existingProvider) {
                const savedCode = existingProvider.onboarding_code;
                const codeMatches = cleanCode.toLowerCase() === expectedCode.toLowerCase() ||
                    (savedCode && cleanCode.toLowerCase() === savedCode.toLowerCase());

                if (!codeMatches) {
                    return { success: false, error: 'Invalid Onboarding Code. Please verify the code provided in your marketing invitation.' };
                }

                return {
                    success: true,
                    isExisting: true,
                    partnerType: 'transport',
                    data: existingProvider
                };
            }

            // New registration: check campaign code
            if (cleanCode.toLowerCase() !== expectedCode.toLowerCase()) {
                return { success: false, error: 'Invalid Onboarding Code. Please verify the code provided in your marketing invitation.' };
            }

            // Anti-Spam Check for NEW records: Check if IP has already registered a DIFFERENT NIC
            if (userIp && userIp !== 'unknown') {
                const { data: ipRecords } = await adminSupabase
                    .from('transport_providers')
                    .select('id, nic_number')
                    .eq('created_ip', userIp);

                if (ipRecords && ipRecords.length > 0) {
                    const existsWithDiffNic = ipRecords.some(r => r.nic_number && r.nic_number !== cleanNic);
                    if (existsWithDiffNic) {
                        return {
                            success: false,
                            error: 'To prevent spamming, your IP address has already registered a partner record. Please use the original NIC to edit your registration.'
                        };
                    }
                }
            }

            return { success: true, isExisting: false, partnerType: 'transport' };

        } else {
            const { data: existingGuide, error: gError } = await adminSupabase
                .from('tour_guides')
                .select('*, payment_details(*)')
                .eq('nic_number', cleanNic)
                .maybeSingle();

            if (gError) {
                console.error("Error querying tour_guides by NIC:", gError);
                return { success: false, error: "Database verification failed. Please try again." };
            }

            if (existingGuide) {
                const savedCode = existingGuide.onboarding_code;
                const codeMatches = cleanCode.toLowerCase() === expectedCode.toLowerCase() ||
                    (savedCode && cleanCode.toLowerCase() === savedCode.toLowerCase());

                if (!codeMatches) {
                    return { success: false, error: 'Invalid Onboarding Code. Please verify the code provided in your marketing invitation.' };
                }

                return {
                    success: true,
                    isExisting: true,
                    partnerType: 'guide',
                    data: existingGuide
                };
            }

            // New registration: check campaign code
            if (cleanCode.toLowerCase() !== expectedCode.toLowerCase()) {
                return { success: false, error: 'Invalid Onboarding Code. Please verify the code provided in your marketing invitation.' };
            }

            // Anti-Spam Check for NEW records: Check if IP has already registered a DIFFERENT NIC
            if (userIp && userIp !== 'unknown') {
                const { data: ipRecords } = await adminSupabase
                    .from('tour_guides')
                    .select('id, nic_number')
                    .eq('created_ip', userIp);

                if (ipRecords && ipRecords.length > 0) {
                    const existsWithDiffNic = ipRecords.some(r => r.nic_number && r.nic_number !== cleanNic);
                    if (existsWithDiffNic) {
                        return {
                            success: false,
                            error: 'To prevent spamming, your IP address has already registered a partner record. Please use the original NIC to edit your registration.'
                        };
                    }
                }
            }

            return { success: true, isExisting: false, partnerType: 'guide' };
        }
    }

    /**
     * Save/Update Transport Provider Onboarding Registration.
     */
    static async saveTransportProvider(dto: TransportProviderOnboardingDTO, userIp: string) {
        const adminSupabase = createAdminClient();
        const cleanNic = (dto.nic_number || '').trim().toUpperCase();

        if (!dto.name || !dto.phone || !dto.email || !cleanNic) {
            throw new Error("Provider Name, Phone, Email, and NIC Number are required.");
        }

        const nicVal = validateSriLankanNIC(cleanNic);
        if (!nicVal.isValid) {
            throw new Error(nicVal.error || "Invalid Sri Lankan National ID (NIC) format.");
        }

        // Check if updating existing provider by NIC or ID
        const { data: existing } = await adminSupabase
            .from('transport_providers')
            .select('id, payment_detail_id')
            .eq('nic_number', cleanNic)
            .maybeSingle();

        // Anti-spam check (only for NEW registrations with a different NIC)
        if (!existing && userIp && userIp !== 'unknown') {
            const { data: ipRecords } = await adminSupabase
                .from('transport_providers')
                .select('id, nic_number')
                .eq('created_ip', userIp);

            if (ipRecords && ipRecords.length > 0) {
                const isDifferentNic = ipRecords.some(r => r.nic_number && r.nic_number !== cleanNic);
                if (isDifferentNic) {
                    throw new Error("Anti-spam restriction: An existing registration with a different NIC was created from this IP address.");
                }
            }
        }

        // Handle Payment Details
        let paymentDetailId: string | undefined = undefined;
        if (dto.bank_name || dto.account_number) {
            const { data: payData, error: payError } = await adminSupabase
                .from('payment_details')
                .insert([{
                    bank_name: dto.bank_name || null,
                    branch_name: dto.branch_name || null,
                    account_name: dto.account_name || null,
                    account_number: dto.account_number || null,
                    swift_code: dto.swift_code || null,
                }])
                .select()
                .single();

            if (payError) {
                console.error("Error creating payment details:", payError);
            } else if (payData) {
                paymentDetailId = payData.id;
            }
        }

        let providerId = existing?.id || dto.id;
        const activePaymentId = paymentDetailId || existing?.payment_detail_id;

        const payload: Record<string, any> = {
            name: dto.name,
            phone: dto.phone,
            email: dto.email,
            address: dto.address || null,
            contact_person: dto.contact_person || null,
            nic_number: cleanNic,
            sltda_registered_driver: dto.sltda_registered_driver ?? false,
            onboarding_code: dto.onboarding_code || null,
            approval_status: dto.approval_status || 'Pending',
            created_ip: userIp || 'unknown',
            status: 'Onboarding',
            payment_detail_id: activePaymentId || null,
            updated_at: new Date().toISOString()
        };

        if (providerId) {
            const { error: updateErr } = await adminSupabase
                .from('transport_providers')
                .update(payload)
                .eq('id', providerId);

            if (updateErr) throw updateErr;
        } else {
            const { data: inserted, error: insertErr } = await adminSupabase
                .from('transport_providers')
                .insert([payload])
                .select()
                .single();

            if (insertErr) throw insertErr;
            providerId = inserted.id;
        }

        // Save Vehicles if provided
        if (dto.vehicles && dto.vehicles.length > 0 && providerId) {
            const vehiclePayloads = dto.vehicles.map(v => ({
                id: v.id || crypto.randomUUID(),
                provider_id: providerId,
                vehicle_type: v.vehicle_type,
                make: v.make || null,
                model: v.model || null,
                make_and_model: [v.make, v.model].filter(Boolean).join(' ') || 'Standard Fleet',
                year_of_manufacture: v.year_of_manufacture ? Number(v.year_of_manufacture) : null,
                vehicle_number: v.vehicle_number || null,
                max_seat_capacity: v.max_seat_capacity ? Number(v.max_seat_capacity) : null,
                km_rate: v.km_rate ? Number(v.km_rate) : null,
                day_rate: v.day_rate ? Number(v.day_rate) : null,
                max_km_per_day: v.max_km_per_day ? Number(v.max_km_per_day) : null,
                additional_km_rate: v.additional_km_rate ? Number(v.additional_km_rate) : null,
                with_driver: v.with_driver ?? true,
                image_url: v.image_url || null,
                approval_status: v.approval_status || 'Pending',
                updated_at: new Date().toISOString()
            }));

            const { error: vehErr } = await adminSupabase
                .from('transport_vehicles')
                .upsert(vehiclePayloads, { onConflict: 'id' });

            if (vehErr) console.error("Error upserting vehicles:", vehErr);
        }

        return { success: true, id: providerId };
    }

    /**
     * Save/Update Tour Guide Onboarding Registration.
     */
    static async saveTourGuide(dto: TourGuideOnboardingDTO, userIp: string) {
        const adminSupabase = createAdminClient();
        const cleanNic = (dto.nic_number || '').trim().toUpperCase();

        if (!dto.first_name || !dto.phone || !cleanNic || !dto.sltda_registration_number) {
            throw new Error("First Name, Phone, NIC Number, and SLTDA Registration Number are required.");
        }

        const nicVal = validateSriLankanNIC(cleanNic);
        if (!nicVal.isValid) {
            throw new Error(nicVal.error || "Invalid Sri Lankan National ID (NIC) format.");
        }

        // Check if updating existing guide by NIC or ID
        const { data: existing } = await adminSupabase
            .from('tour_guides')
            .select('id, payment_detail_id')
            .eq('nic_number', cleanNic)
            .maybeSingle();

        // Anti-spam check (only for NEW registrations with a different NIC)
        if (!existing && userIp && userIp !== 'unknown') {
            const { data: ipRecords } = await adminSupabase
                .from('tour_guides')
                .select('id, nic_number')
                .eq('created_ip', userIp);

            if (ipRecords && ipRecords.length > 0) {
                const isDifferentNic = ipRecords.some(r => r.nic_number && r.nic_number !== cleanNic);
                if (isDifferentNic) {
                    throw new Error("Anti-spam restriction: An existing registration with a different NIC was created from this IP address.");
                }
            }
        }

        // Handle Payment Details
        let paymentDetailId: string | undefined = undefined;
        if (dto.bank_name || dto.account_number) {
            const { data: payData, error: payError } = await adminSupabase
                .from('payment_details')
                .insert([{
                    bank_name: dto.bank_name || null,
                    branch_name: dto.branch_name || null,
                    account_name: dto.account_name || null,
                    account_number: dto.account_number || null,
                    swift_code: dto.swift_code || null,
                }])
                .select()
                .single();

            if (payError) {
                console.error("Error creating payment details:", payError);
            } else if (payData) {
                paymentDetailId = payData.id;
            }
        }

        let guideId = existing?.id || dto.id;
        const activePaymentId = paymentDetailId || existing?.payment_detail_id;

        const payload: Record<string, any> = {
            first_name: dto.first_name,
            last_name: dto.last_name || null,
            phone: dto.phone,
            email: dto.email || null,
            address: dto.address || null,
            city: dto.city || null,
            district: dto.district || null,
            nic_number: cleanNic,
            license_id: dto.sltda_registration_number,
            sltda_registration_number: dto.sltda_registration_number,
            sltda_id_image_url: dto.sltda_id_image_url || null,
            approval_status: dto.approval_status || 'Pending',
            languages: dto.languages && dto.languages.length > 0 ? dto.languages : ['English'],
            german_proficiency: dto.german_proficiency ?? false,
            french_proficiency: dto.french_proficiency ?? false,
            experience_years: dto.experience_years ? Number(dto.experience_years) : 0,
            daily_rate: dto.daily_rate ? Number(dto.daily_rate) : 0,
            onboarding_code: dto.onboarding_code || null,
            created_ip: userIp || 'unknown',
            status: 'Onboarding',
            payment_detail_id: activePaymentId || null,
            updated_at: new Date().toISOString()
        };

        if (guideId) {
            const { error: updateErr } = await adminSupabase
                .from('tour_guides')
                .update(payload)
                .eq('id', guideId);

            if (updateErr) throw updateErr;
        } else {
            const { data: inserted, error: insertErr } = await adminSupabase
                .from('tour_guides')
                .insert([payload])
                .select()
                .single();

            if (insertErr) throw insertErr;
            guideId = inserted.id;
        }

        return { success: true, id: guideId };
    }
}
