import { createAdminClient } from '@/utils/supabase/admin';
import type { HotelImageDTO } from '@/dtos/tour-planning.dto';

export const MAX_HOTEL_IMAGES = 3;

export class HotelImageService {
    private static db() {
        return createAdminClient();
    }

    /**
     * Syncs hotels.photo_url with the primary image (or first image, or null if empty).
     */
    private static async syncMasterPhotoUrl(hotelId: string, images: HotelImageDTO[]): Promise<void> {
        const primary = images.find((i) => i.is_primary) || images[0] || null;
        const { error } = await this.db()
            .from('hotels')
            .update({ photo_url: primary ? primary.image_url : null })
            .eq('id', hotelId);
        if (error) {
            console.warn('Failed to sync hotels.photo_url:', error.message);
        }
    }

    static async getImagesForHotel(hotelId: string): Promise<HotelImageDTO[]> {
        const db = this.db();
        const { data, error } = await db
            .from('hotel_images')
            .select('id, hotel_id, image_url, is_primary, sort_order')
            .eq('hotel_id', hotelId)
            .order('is_primary', { ascending: false })
            .order('sort_order', { ascending: true });

        if (!error && data && data.length > 0) {
            return data.map((r: any, idx: number) => ({
                id: r.id,
                hotel_id: r.hotel_id,
                image_url: r.image_url,
                is_primary: Boolean(r.is_primary),
                sort_order: Number(r.sort_order ?? idx + 1),
            }));
        }

        // Fallback to hotels.photo_url if hotel_images has no rows yet (or before migration)
        const { data: hotel } = await db
            .from('hotels')
            .select('id, photo_url')
            .eq('id', hotelId)
            .maybeSingle();

        if (hotel?.photo_url) {
            return [
                {
                    id: `master-${hotel.id}`,
                    hotel_id: hotel.id,
                    image_url: hotel.photo_url,
                    is_primary: true,
                    sort_order: 1,
                },
            ];
        }

        return [];
    }

    static async getImagesForHotels(hotelIds: string[]): Promise<Record<string, HotelImageDTO[]>> {
        const uniq = Array.from(new Set(hotelIds.filter(Boolean)));
        if (uniq.length === 0) return {};

        const db = this.db();
        const [{ data: imgRows, error: imgErr }, { data: hotelRows }] = await Promise.all([
            db
                .from('hotel_images')
                .select('id, hotel_id, image_url, is_primary, sort_order')
                .in('hotel_id', uniq)
                .order('is_primary', { ascending: false })
                .order('sort_order', { ascending: true }),
            db.from('hotels').select('id, photo_url').in('id', uniq),
        ]);

        const map: Record<string, HotelImageDTO[]> = {};
        uniq.forEach((id) => {
            map[id] = [];
        });

        if (!imgErr && imgRows) {
            imgRows.forEach((r: any) => {
                if (!map[r.hotel_id]) map[r.hotel_id] = [];
                map[r.hotel_id].push({
                    id: r.id,
                    hotel_id: r.hotel_id,
                    image_url: r.image_url,
                    is_primary: Boolean(r.is_primary),
                    sort_order: Number(r.sort_order || map[r.hotel_id].length + 1),
                });
            });
        }

        // Fallback to hotels.photo_url for any hotel with no rows in hotel_images yet
        (hotelRows || []).forEach((h: any) => {
            if ((!map[h.id] || map[h.id].length === 0) && h.photo_url) {
                map[h.id] = [
                    {
                        id: `master-${h.id}`,
                        hotel_id: h.id,
                        image_url: h.photo_url,
                        is_primary: true,
                        sort_order: 1,
                    },
                ];
            }
        });

        return map;
    }

    static async addHotelImage(hotelId: string, imageUrl: string): Promise<HotelImageDTO[]> {
        const db = this.db();

        // Check existing rows in hotel_images
        const { data: existingRows, error: fetchErr } = await db
            .from('hotel_images')
            .select('id, hotel_id, image_url, is_primary, sort_order')
            .eq('hotel_id', hotelId)
            .order('sort_order', { ascending: true });

        if (fetchErr) throw fetchErr;

        let current = existingRows || [];

        // If hotel_images is empty, preserve any existing hotels.photo_url as #1 primary first
        if (current.length === 0) {
            const { data: hotel } = await db
                .from('hotels')
                .select('photo_url')
                .eq('id', hotelId)
                .maybeSingle();

            if (hotel?.photo_url && hotel.photo_url !== imageUrl) {
                const { data: seeded } = await db
                    .from('hotel_images')
                    .insert({
                        hotel_id: hotelId,
                        image_url: hotel.photo_url,
                        is_primary: true,
                        sort_order: 1,
                    })
                    .select('id, hotel_id, image_url, is_primary, sort_order')
                    .single();
                if (seeded) current = [seeded];
            }
        }

        if (current.length >= MAX_HOTEL_IMAGES) {
            throw new Error(`Maximum of ${MAX_HOTEL_IMAGES} images allowed per hotel. Delete an existing image first.`);
        }

        const isFirst = current.length === 0;
        const nextOrder = current.length + 1;

        const { error: insErr } = await db.from('hotel_images').insert({
            hotel_id: hotelId,
            image_url: imageUrl,
            is_primary: isFirst,
            sort_order: nextOrder,
        });

        if (insErr) throw insErr;

        const updated = await this.getImagesForHotel(hotelId);
        await this.syncMasterPhotoUrl(hotelId, updated);
        return updated;
    }

    static async deleteHotelImage(hotelId: string, imageId: string): Promise<HotelImageDTO[]> {
        const db = this.db();

        // Handle virtual fallback ID when hotels.photo_url wasn't in hotel_images yet
        if (imageId.startsWith('master-')) {
            await db.from('hotels').update({ photo_url: null }).eq('id', hotelId);
            return [];
        }

        const { error: delErr } = await db
            .from('hotel_images')
            .delete()
            .eq('id', imageId)
            .eq('hotel_id', hotelId);

        if (delErr) throw delErr;

        const { data: remaining, error: remErr } = await db
            .from('hotel_images')
            .select('id, hotel_id, image_url, is_primary, sort_order')
            .eq('hotel_id', hotelId)
            .order('is_primary', { ascending: false })
            .order('sort_order', { ascending: true });

        if (remErr) throw remErr;

        const list = remaining || [];
        const hasPrimary = list.some((r: any) => r.is_primary);

        // Re-pack sort_order 1..N and ensure one image is primary if any remain
        for (let i = 0; i < list.length; i++) {
            const shouldBePrimary = hasPrimary ? Boolean(list[i].is_primary) : i === 0;
            await db
                .from('hotel_images')
                .update({ sort_order: i + 1, is_primary: shouldBePrimary })
                .eq('id', list[i].id);
            list[i].sort_order = i + 1;
            list[i].is_primary = shouldBePrimary;
        }

        const normalized: HotelImageDTO[] = list.map((r: any) => ({
            id: r.id,
            hotel_id: r.hotel_id,
            image_url: r.image_url,
            is_primary: Boolean(r.is_primary),
            sort_order: Number(r.sort_order),
        }));

        await this.syncMasterPhotoUrl(hotelId, normalized);
        return normalized;
    }

    static async setPrimaryHotelImage(hotelId: string, imageId: string): Promise<HotelImageDTO[]> {
        const db = this.db();

        if (imageId.startsWith('master-')) {
            return this.getImagesForHotel(hotelId);
        }

        const { data: rows, error: fetchErr } = await db
            .from('hotel_images')
            .select('id, hotel_id, image_url, is_primary, sort_order')
            .eq('hotel_id', hotelId)
            .order('sort_order', { ascending: true });

        if (fetchErr) throw fetchErr;

        const target = (rows || []).find((r: any) => r.id === imageId);
        if (!target) return this.getImagesForHotel(hotelId);

        const reordered = [target, ...(rows || []).filter((r: any) => r.id !== imageId)];
        for (let i = 0; i < reordered.length; i++) {
            await db
                .from('hotel_images')
                .update({ is_primary: i === 0, sort_order: i + 1 })
                .eq('id', reordered[i].id);
        }

        const updated = await this.getImagesForHotel(hotelId);
        await this.syncMasterPhotoUrl(hotelId, updated);
        return updated;
    }

    /**
     * Replaces all hotel_images rows for a hotel from an ordered list of URLs (max 3).
     * Useful when creating a brand-new hotel that had pending uploaded URLs before getting an ID.
     */
    static async saveHotelImageUrls(hotelId: string, urls: string[]): Promise<HotelImageDTO[]> {
        const db = this.db();
        const clean = Array.from(new Set(urls.map((u) => u.trim()).filter(Boolean))).slice(0, MAX_HOTEL_IMAGES);

        await db.from('hotel_images').delete().eq('hotel_id', hotelId);

        if (clean.length > 0) {
            const rows = clean.map((url, idx) => ({
                hotel_id: hotelId,
                image_url: url,
                is_primary: idx === 0,
                sort_order: idx + 1,
            }));
            const { error } = await db.from('hotel_images').insert(rows);
            if (error) throw error;
        }

        const updated = await this.getImagesForHotel(hotelId);
        await this.syncMasterPhotoUrl(hotelId, updated);
        return updated;
    }
}
