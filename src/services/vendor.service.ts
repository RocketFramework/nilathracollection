import { createClient } from '@supabase/supabase-js';
import { VendorDTO } from '../dtos/user-vendor.dto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class VendorService {
    static async getActiveVendors(type: 'hotel' | 'activity_vendor' | 'transport_provider' | 'driver' | 'guide') {
        let tableName = '';
        switch (type) {
            case 'hotel': tableName = 'hotels'; break;
            case 'activity_vendor': tableName = 'activity_vendors'; break;
            case 'transport_provider': tableName = 'transport_providers'; break;
            case 'driver': tableName = 'drivers'; break;
            case 'guide': tableName = 'tour_guides'; break;
        }

        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('is_suspended', false);

        if (error) throw error;
        return data;
    }
}
