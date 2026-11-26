import { createAdminClient } from '@/utils/supabase/admin';
import type {
    ProposedHotelOptionDTO,
    TourActivitySelectionDTO,
    TourPlanningScheduleDTO,
    TourProposedHotelDTO,
    TourRouteStopDTO,
} from '@/dtos/tour-planning.dto';

export class TourPlanningService {
    private static db() {
        return createAdminClient();
    }

    static async getRouteStops(tourId: string): Promise<TourRouteStopDTO[]> {
        const { data, error } = await this.db()
            .from('tour_route_stops')
            .select('*')
            .eq('tour_id', tourId)
            .order('stop_order', { ascending: true });

        if (error) {
            console.warn('getRouteStops warning (table may not be migrated yet):', error.message);
            return [];
        }

        return (data || []).map((row: any, idx: number) => ({
            id: row.id,
            stop_order: Number(row.stop_order ?? idx + 1),
            location_name: row.location_name || '',
            tour_date: row.tour_date ? String(row.tour_date).slice(0, 10) : '',
            day_number: row.day_number ?? null,
            notes: row.notes ?? null,
        }));
    }

    static async saveRouteStops(tourId: string, stops: TourRouteStopDTO[]): Promise<void> {
        const db = this.db();
        const { error: delErr } = await db
            .from('tour_route_stops')
            .delete()
            .eq('tour_id', tourId);

        if (delErr) throw delErr;

        if (!stops || stops.length === 0) return;

        const rows = stops.map((s, idx) => ({
            tour_id: tourId,
            stop_order: idx + 1,
            location_name: s.location_name,
            tour_date: s.tour_date ? String(s.tour_date).slice(0, 10) : null,
            day_number: s.day_number ?? idx + 1,
            notes: s.notes ?? null,
            updated_at: new Date().toISOString(),
        }));

        const { error: insErr } = await db.from('tour_route_stops').insert(rows);
        if (insErr) throw insErr;
    }

    static async getActivitySelections(tourId: string): Promise<TourActivitySelectionDTO[]> {
        const { data, error } = await this.db()
            .from('tour_activity_selections')
            .select('*')
            .eq('tour_id', tourId)
            .order('sort_order', { ascending: true });

        if (error) {
            console.warn('getActivitySelections warning (table may not be migrated yet):', error.message);
            return [];
        }

        return (data || []).map((row: any, idx: number) => ({
            id: row.id,
            activity_id: Number(row.activity_id),
            tour_date: row.tour_date ? String(row.tour_date).slice(0, 10) : '',
            day_number: row.day_number ?? null,
            sort_order: Number(row.sort_order ?? idx + 1),
        }));
    }

    static async saveActivitySelections(
        tourId: string,
        selections: TourActivitySelectionDTO[]
    ): Promise<void> {
        const db = this.db();
        const { error: delErr } = await db
            .from('tour_activity_selections')
            .delete()
            .eq('tour_id', tourId);

        if (delErr) throw delErr;

        if (!selections || selections.length === 0) return;

        // Deduplicate by activity_id preserving order
        const seen = new Set<number>();
        const rows: any[] = [];
        selections.forEach((s, idx) => {
            const actId = Number(s.activity_id);
            if (!actId || seen.has(actId)) return;
            seen.add(actId);
            rows.push({
                tour_id: tourId,
                activity_id: actId,
                tour_date: s.tour_date ? String(s.tour_date).slice(0, 10) : null,
                day_number: s.day_number ?? null,
                sort_order: idx + 1,
                updated_at: new Date().toISOString(),
            });
        });

        if (rows.length > 0) {
            const { error: insErr } = await db.from('tour_activity_selections').insert(rows);
            if (insErr) throw insErr;
        }
    }

    static async getProposedHotels(tourId: string): Promise<TourProposedHotelDTO[]> {
        const { data, error } = await this.db()
            .from('tour_proposed_hotels')
            .select('*')
            .eq('tour_id', tourId)
            .order('tour_date', { ascending: true })
            .order('option_rank', { ascending: true });

        if (error) {
            console.warn('getProposedHotels warning (table may not be migrated yet):', error.message);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            tour_date: String(row.tour_date).slice(0, 10),
            day_number: row.day_number ?? null,
            location_name: row.location_name || '',
            hotel_id: row.hotel_id,
            option_rank: Number(row.option_rank || 1),
            is_selected: Boolean(row.is_selected),
            notes: row.notes ?? null,
        }));
    }

    static async saveProposedHotels(
        tourId: string,
        proposedHotels: TourProposedHotelDTO[]
    ): Promise<void> {
        const db = this.db();
        const { error: delErr } = await db
            .from('tour_proposed_hotels')
            .delete()
            .eq('tour_id', tourId);

        if (delErr) throw delErr;

        if (!proposedHotels || proposedHotels.length === 0) return;

        // Enforce at most 5 unique hotel options per tour_date
        const perDateSeen: Record<string, Set<string>> = {};
        const rows: any[] = [];

        for (const item of proposedHotels) {
            const dateKey = item.tour_date ? String(item.tour_date).slice(0, 10) : '';
            if (!dateKey || !item.hotel_id) continue;
            if (!perDateSeen[dateKey]) perDateSeen[dateKey] = new Set();
            if (perDateSeen[dateKey].has(item.hotel_id) || perDateSeen[dateKey].size >= 5) continue;
            perDateSeen[dateKey].add(item.hotel_id);

            rows.push({
                tour_id: tourId,
                tour_date: dateKey,
                day_number: item.day_number ?? null,
                location_name: item.location_name || null,
                hotel_id: item.hotel_id,
                option_rank: Math.min(Math.max(Number(item.option_rank || perDateSeen[dateKey].size), 1), 5),
                is_selected: Boolean(item.is_selected),
                notes: item.notes ?? null,
                updated_at: new Date().toISOString(),
            });
        }

        if (rows.length > 0) {
            const { error: insErr } = await db.from('tour_proposed_hotels').insert(rows);
            if (insErr) throw insErr;
        }
    }

    static async getSchedule(tourId: string): Promise<TourPlanningScheduleDTO> {
        const [routeStops, activitySelections, proposedHotels] = await Promise.all([
            this.getRouteStops(tourId),
            this.getActivitySelections(tourId),
            this.getProposedHotels(tourId),
        ]);
        return { routeStops, activitySelections, proposedHotels };
    }

    /**
     * Fetches ALL hotels from public.hotels independently (paginated in 1000-row batches)
     * so the Proposed Hotels searchable dropdown always has the complete hotel catalog.
     */
    static async listAllHotels(): Promise<ProposedHotelOptionDTO[]> {
        const db = this.db();
        const pageSize = 1000;
        let from = 0;
        const all: ProposedHotelOptionDTO[] = [];

        while (true) {
            const { data, error } = await db
                .from('hotels')
                .select('id, name, closest_city, location_address, hotel_class, photo_url, is_suspended')
                .order('name', { ascending: true })
                .range(from, from + pageSize - 1);

            if (error) throw error;
            const batch = (data || []) as ProposedHotelOptionDTO[];
            all.push(...batch);
            if (batch.length < pageSize) break;
            from += pageSize;
        }

        return all;
    }
}
