import { createClient } from '@supabase/supabase-js';
import { CreateRequestDTO, UpdateRequestDTO } from '../dtos/request.dto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class RequestService {
    static async createRequest(dto: CreateRequestDTO, touristId?: string) {
        // Generate ID ahead of time so we don't need .select() (which fails RLS for anonymous users trying to read)
        const requestId = crypto.randomUUID();

        const requestData = {
            id: requestId,
            tourist_id: touristId || null, // Handle anonymous initially if needed
            email: dto.email, // Save the email explicitly
            request_type: dto.request_type,
        };

        const { error: reqError } = await supabase
            .from('requests')
            .insert(requestData);

        if (reqError) throw reqError;

        if (dto.request_type === 'custom-plan' || dto.request_type === 'package') {
            const detailsData = {
                request_id: requestId,
                package_name: dto.package_name,
                nights: dto.nights,
                estimated_price: dto.estimated_price,
                destinations: dto.destinations,
                start_date: dto.start_date,
                end_date: dto.end_date,
                adults: dto.adults,
                children: dto.children,
                budget_tier: dto.budget_tier,
                special_requirements: dto.special_requirements,
            };

            const { error: detailsError } = await supabase
                .from('request_details')
                .insert(detailsData);

            if (detailsError) {
                // Rollback request ideally, or return error
                await supabase.from('requests').delete().eq('id', requestId);
                throw detailsError;
            }
            return { id: requestId, details: detailsData };
        }

        return { id: requestId };
    }

    static async updateRequestStatus(requestId: string, dto: UpdateRequestDTO) {
        const { data, error } = await supabase
            .from('requests')
            .update({ status: dto.status })
            .eq('id', requestId)
            .select();

        if (error) throw error;
        return data;
    }

    static async getAllRequests(page: number = 1, pageSize: number = 10) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, count, error } = await supabase
            .from('requests')
            .select(`
                id,
                email,
                request_type,
                status,
                created_at,
                admin_assigned_to,
                tourist:users!requests_tourist_id_fkey(
                    email,
                    tourist_profile:tourist_profiles(first_name, last_name)
                ),
                details:request_details(package_name, destinations, start_date, nights)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return { data, count };
    }

    static async getRequestsWithFilters(filters: {
        status?: string;
        dateFrom?: string;
        dateTo?: string;
        email?: string;
        adminAssignedTo?: string;
        nightsOperator?: 'Higher than' | 'Lower than';
        nightsValue?: number;
    }, page: number = 1, pageSize: number = 10) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('requests')
            .select(`
                id,
                email,
                request_type,
                status,
                created_at,
                admin_assigned_to,
                tourist:users!requests_tourist_id_fkey(
                    email,
                    tourist_profile:tourist_profiles(first_name, last_name)
                ),
                details:request_details!inner(package_name, destinations, start_date, nights)
            `, { count: 'exact' })
            .order('created_at', { ascending: false });

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        if (filters.dateFrom) {
            query = query.gte('created_at', filters.dateFrom);
        }

        if (filters.dateTo) {
            // Add 1 day to the dateTo to include the whole day
            const nextDay = new Date(filters.dateTo);
            nextDay.setDate(nextDay.getDate() + 1);
            query = query.lt('created_at', nextDay.toISOString().split('T')[0]);
        }

        if (filters.email) {
            query = query.ilike('email', `%${filters.email}%`);
        }

        if (filters.adminAssignedTo) {
            if (filters.adminAssignedTo === 'unassigned') {
                query = query.is('admin_assigned_to', null);
            } else {
                query = query.eq('admin_assigned_to', filters.adminAssignedTo);
            }
        }

        if (filters.nightsValue !== undefined) {
            if (filters.nightsOperator === 'Higher than') {
                query = query.gte('details.nights', filters.nightsValue);
            } else if (filters.nightsOperator === 'Lower than') {
                query = query.lte('details.nights', filters.nightsValue);
            }
        }

        query = query.range(from, to);

        const { data, count, error } = await query;
        if (error) throw error;
        return { data, count };
    }
}
