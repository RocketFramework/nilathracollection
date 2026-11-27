'use server';

import sharp from 'sharp';
import { createAdminClient } from '@/utils/supabase/admin';
import { HotelImageService } from '@/services/hotel-image.service';
import type { HotelImageDTO } from '@/dtos/tour-planning.dto';

export async function getHotelImagesAction(
    hotelId: string
): Promise<{ success: boolean; data?: HotelImageDTO[]; error?: string }> {
    try {
        const data = await HotelImageService.getImagesForHotel(hotelId);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to load hotel images.' };
    }
}

export async function getHotelImagesBatchAction(
    hotelIds: string[]
): Promise<{ success: boolean; data?: Record<string, HotelImageDTO[]>; error?: string }> {
    try {
        const data = await HotelImageService.getImagesForHotels(hotelIds);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to load hotel images.' };
    }
}

/**
 * Converts uploaded image file(s) to optimized WebP via sharp, uploads to Supabase Storage,
 * inserts into hotel_images (max 3 per hotel), and syncs hotels.photo_url with the primary image.
 */
export async function uploadAndAddHotelImageAction(
    hotelId: string,
    formData: FormData
): Promise<{ success: boolean; data?: HotelImageDTO[]; error?: string }> {
    try {
        const file = formData.get('file') as File | null;
        if (!file) {
            return { success: false, error: 'No image file provided.' };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const optimizedBuffer = await sharp(buffer)
            .resize({ width: 1600, withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer();

        const adminSupabase = createAdminClient();
        const filePath = `hotel-images/${hotelId}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}.webp`;

        const { error: uploadError } = await adminSupabase.storage
            .from('payment-proofs')
            .upload(filePath, optimizedBuffer, {
                contentType: 'image/webp',
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) throw uploadError;

        const { data: pub } = adminSupabase.storage
            .from('payment-proofs')
            .getPublicUrl(filePath);

        const updated = await HotelImageService.addHotelImage(hotelId, pub.publicUrl);
        return { success: true, data: updated };
    } catch (error: any) {
        console.error('Error in uploadAndAddHotelImageAction:', error);
        return { success: false, error: error.message || 'Failed to upload hotel image.' };
    }
}

export async function deleteHotelImageAction(
    hotelId: string,
    imageId: string
): Promise<{ success: boolean; data?: HotelImageDTO[]; error?: string }> {
    try {
        const data = await HotelImageService.deleteHotelImage(hotelId, imageId);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to delete hotel image.' };
    }
}

export async function setPrimaryHotelImageAction(
    hotelId: string,
    imageId: string
): Promise<{ success: boolean; data?: HotelImageDTO[]; error?: string }> {
    try {
        const data = await HotelImageService.setPrimaryHotelImage(hotelId, imageId);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to set primary hotel image.' };
    }
}

export async function saveHotelImageUrlsAction(
    hotelId: string,
    urls: string[]
): Promise<{ success: boolean; data?: HotelImageDTO[]; error?: string }> {
    try {
        const data = await HotelImageService.saveHotelImageUrls(hotelId, urls);
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to save hotel images.' };
    }
}
