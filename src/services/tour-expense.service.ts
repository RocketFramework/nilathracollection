import { createAdminClient } from '@/utils/supabase/admin';
import { TourExpenseDTO } from '../dtos/tour-expense.dto';

export class TourExpenseService {
    static async getExpensesForTour(tourId: string): Promise<TourExpenseDTO[]> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('tour_expenses')
            .select('*')
            .eq('tour_id', tourId)
            .order('expense_date', { ascending: false })
            .order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []) as TourExpenseDTO[];
    }

    static async saveExpense(expense: TourExpenseDTO): Promise<string> {
        const supabase = createAdminClient();
        const { id, created_at: _createdAt, ...payload } = expense;
        if (id) {
            const { error } = await supabase.from('tour_expenses').update(payload).eq('id', id);
            if (error) throw error;
            return id;
        }
        const { data, error } = await supabase.from('tour_expenses').insert([payload]).select('id').single();
        if (error) throw error;
        return data.id;
    }

    static async deleteExpense(id: string): Promise<boolean> {
        const supabase = createAdminClient();
        const { error } = await supabase.from('tour_expenses').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
}
