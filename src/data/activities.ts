import { createClient } from '@/utils/supabase/client';

export interface Activity {
    id: number;
    category: string;
    activity_name: string;
    location_name: string;
    district: string;
    lat: number | null;
    lng: number | null;
    description: string;
    duration_hours: number;
    optimal_start_time: string | null;
    optimal_end_time: string | null;
    time_flexible: boolean;
}

export async function fetchActivities(): Promise<Activity[]> {
    const supabase = createClient();
    
    // Log to verify client is created
    console.log('Supabase client created');
    
    const { data, error, status, statusText } = await supabase
        .from('activities')
        .select('*');
    
    // Detailed logging
    console.log('Status:', status);
    console.log('StatusText:', statusText);
    console.log('Data:', data);
    console.log('Error:', error);
    
    if (error) {
        console.error('Error fetching activities:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        return [];
    }

    if (!data || data.length === 0) {
        console.log('No data returned from Supabase');
        return [];
    }

    return data as Activity[];
}