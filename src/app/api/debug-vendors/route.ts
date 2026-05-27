import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET() {
    try {
        const supabase = createAdminClient();
        
        // Fetch vendors
        const { data: vendors, error: vError } = await supabase
            .from('vendors')
            .select('id, name');
            
        if (vError) throw vError;
        
        const vendorIds = vendors.map(v => v.id);

        // Fetch vendor activities using the exact query from getVendors
        const { data: vendorActivities, error: vaError } = await supabase
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

        return NextResponse.json({
            success: true,
            vendorsCount: vendors.length,
            vendorActivitiesCount: vendorActivities?.length || 0,
            error: vaError,
            vendorActivitiesSample: vendorActivities?.slice(0, 5)
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
