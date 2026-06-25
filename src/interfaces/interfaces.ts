import { ItineraryBlockType } from '../types/types';

export interface POBlock {
    id: string;
    tour_id: string;
    name: string;
    block_type: 'accommodation' | 'sleep' | 'travel' | 'meal' | 'restaurant' | 'activity';
    block_number: number;
    created_at?: string;
    updated_at?: string;
    // Client-side joins
    daily_activities?: any[];
    daily_activity_vendors?: any[];
}

export interface POBlockDailyActivity {
    id: string;
    po_block_id: string;
    daily_activity_id: string;
    created_at?: string;
    updated_at?: string;
}
