import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET() {
    try {
        const supabase = createAdminClient();
        
        // Fetch tours and their planner_data
        const { data: tours, error } = await supabase
            .from('tours')
            .select('id, planner_data');
            
        if (error) throw error;

        const tourSamples = tours?.map(t => {
            const itinerary = (t.planner_data as any)?.itinerary || [];
            return {
                id: t.id,
                hasPlannerData: !!t.planner_data,
                itineraryBlocksCount: itinerary.length,
                activityBlocks: itinerary
                    .filter((b: any) => b.type === 'activity')
                    .map((b: any) => ({
                        id: b.id,
                        name: b.name,
                        activityId: b.activityId,
                        vendorId: b.vendorId,
                        vendorActivityId: b.vendorActivityId
                    }))
            };
        });

        return NextResponse.json({
            success: true,
            toursCount: tours?.length || 0,
            tours: tourSamples
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
