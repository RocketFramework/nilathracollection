import { TourExpenseCategory } from '../types/types';

export interface TourExpenseDTO {
    id?: string;
    tour_id: string;
    category: TourExpenseCategory;
    description: string;
    paid_to?: string | null;
    amount: number;
    currency: string;
    exchange_rate: number;
    expense_date: string;
    payment_method?: string | null;
    payment_reference?: string | null;
    receipt_url?: string | null;
    notes?: string | null;
    created_at?: string;
}
