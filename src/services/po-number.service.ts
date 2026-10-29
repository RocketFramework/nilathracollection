import { createAdminClient } from '@/utils/supabase/admin';

export class PoNumberService {
    /**
     * Maps a vendor type to the PO number prefix (same mapping the PO modal has always used).
     */
    static getPrefix(vendorType?: string | null): string {
        switch (vendorType) {
            case 'hotel': return 'HOT';
            case 'restaurant': return 'RES';
            case 'tour_guide':
            case 'guide': return 'GUI';
            case 'driver': return 'DRI';
            case 'transport_provider':
            case 'transport': return 'TRA';
            default: return 'ACT';
        }
    }

    /**
     * Reserves the next sequential number (PO-<PREFIX>-<YYYY>-<0001>) from the database.
     */
    static async getNextPoNumber(vendorType?: string | null): Promise<string> {
        const supabase = createAdminClient();
        const { data, error } = await supabase.rpc('next_po_number', { p_prefix: PoNumberService.getPrefix(vendorType) });
        if (error) throw error;
        return data as string;
    }

    /**
     * Returns the readable tour code (TR-YYYY-NNNN) for a tour, or null if it has none yet.
     */
    static async getTourCode(tourId: string): Promise<string | null> {
        const supabase = createAdminClient();
        const { data, error } = await supabase.from('tours').select('tour_code').eq('id', tourId).maybeSingle();
        if (error) throw error;
        return data?.tour_code || null;
    }
}
