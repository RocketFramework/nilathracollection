import { createClient } from '@supabase/supabase-js';
import { CreateTourDTO, UpdateTourDTO, AddActivityDTO } from '../dtos/tour.dto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class TourService {
    static async createTour(dto: CreateTourDTO) {
        const { data, error } = await supabase
            .from('tours')
            .insert({
                request_id: dto.request_id,
                tourist_id: dto.tourist_id,
                agent_id: dto.agent_id,
                title: dto.title,
                start_date: dto.start_date,
                end_date: dto.end_date,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async updateTourStatus(tourId: string, status: string, userId: string) {
        // Logic to update tour and record history
        const { data: tour, error: tourErr } = await supabase
            .from('tours')
            .update({ status })
            .eq('id', tourId)
            .select()
            .single();
        if (tourErr) throw tourErr;

        await supabase.from('tour_status_history').insert({
            tour_id: tourId,
            status,
            changed_by: userId
        });

        return tour;
    }

    static async addActivity(dto: AddActivityDTO) {
        const { data, error } = await supabase
            .from('daily_activities')
            .insert(dto)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
