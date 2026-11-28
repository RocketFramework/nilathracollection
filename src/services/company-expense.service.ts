import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { UserService } from '@/services/user.service';
import { AppSettingsService } from '@/services/app-settings.service';
import { CompanyExpenseDTO, CompanyExpenseFilterDTO } from '@/dtos/company-expense.dto';
import { Settings } from '@/types/types';

const STORAGE_BUCKET = 'payslips';
const ALLOWED_MIME_TYPES: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export class CompanyExpenseService {
    static async assertAdminOrFinanceAccess(): Promise<{ userId: string; displayName: string; isAdmin: boolean; isFinance: boolean }> {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Unauthorized: Please sign in.');
        }

        const roles = await UserService.resolveUserRoles(user.id);
        const isAdmin = roles.includes('admin');
        const isFinance = roles.includes('finance');
        if (!isAdmin && !isFinance) {
            throw new Error('Forbidden: Company Expenses is restricted to Admin and Finance users.');
        }

        const profile = await UserService.getCurrentUserProfile().catch(() => null);
        const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
        const displayName = fullName || user.email || (isAdmin ? 'Admin' : 'Finance');

        return { userId: user.id, displayName, isAdmin, isFinance };
    }

    static parseCategoriesSetting(raw?: string | null): string[] {
        if (!raw || !raw.trim()) {
            return [];
        }
        return Array.from(
            new Set(
                raw
                    .split(/[\r\n,]+/)
                    .map((s) => s.trim())
                    .filter(Boolean)
            )
        );
    }

    static async getCategories(): Promise<string[]> {
        try {
            const raw = await AppSettingsService.getSettingValue(Settings.Company_Expense_Categories);
            return this.parseCategoriesSetting(raw);
        } catch (err) {
            console.error('Error loading company expense categories from app_settings:', err);
            return [];
        }
    }

    static async listExpenses(filters?: CompanyExpenseFilterDTO): Promise<CompanyExpenseDTO[]> {
        await this.assertAdminOrFinanceAccess();
        const db = createAdminClient();

        let query = db
            .from('company_expenses')
            .select('*')
            .order('expense_date', { ascending: false })
            .order('created_at', { ascending: false });

        if (filters?.category && filters.category !== 'All') {
            query = query.eq('category', filters.category);
        }

        if (filters?.month) {
            // YYYY-MM -> first day to last day of month
            const [yStr, mStr] = filters.month.split('-');
            const y = Number(yStr);
            const m = Number(mStr);
            if (y && m >= 1 && m <= 12) {
                const startDate = `${yStr}-${mStr}-01`;
                const lastDay = new Date(y, m, 0).getDate();
                const endDate = `${yStr}-${mStr}-${String(lastDay).padStart(2, '0')}`;
                query = query.gte('expense_date', startDate).lte('expense_date', endDate);
            }
        }

        const { data, error } = await query;
        if (error) {
            if (error.code === '42P01') {
                throw new Error('The company_expenses table does not exist yet. Please run data/migrations/create_company_expenses_table.sql in Supabase.');
            }
            throw new Error(error.message);
        }

        let rows = (data || []).map((row: any): CompanyExpenseDTO => ({
            id: row.id,
            category: row.category,
            description: row.description,
            vendor_or_payee: row.vendor_or_payee ?? null,
            voucher_number: row.voucher_number ?? null,
            amount: Number(row.amount || 0),
            currency: row.currency || 'LKR',
            exchange_rate: Number(row.exchange_rate || 1),
            expense_date: row.expense_date,
            payment_method: row.payment_method || 'Bank Transfer',
            payment_reference: row.payment_reference ?? null,
            bill_voucher_url: row.bill_voucher_url ?? null,
            bank_transfer_slip_url: row.bank_transfer_slip_url ?? null,
            signed_voucher_url: row.signed_voucher_url ?? null,
            notes: row.notes ?? null,
            recorded_by: row.recorded_by ?? null,
            recorded_by_name: row.recorded_by_name ?? null,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }));

        if (filters?.search && filters.search.trim()) {
            const q = filters.search.trim().toLowerCase();
            rows = rows.filter((r) =>
                r.description.toLowerCase().includes(q) ||
                (r.vendor_or_payee || '').toLowerCase().includes(q) ||
                (r.voucher_number || '').toLowerCase().includes(q) ||
                (r.payment_reference || '').toLowerCase().includes(q) ||
                r.category.toLowerCase().includes(q) ||
                (r.notes || '').toLowerCase().includes(q)
            );
        }

        return rows;
    }

    static async saveExpense(dto: CompanyExpenseDTO): Promise<CompanyExpenseDTO> {
        const caller = await this.assertAdminOrFinanceAccess();
        const db = createAdminClient();

        const description = (dto.description || '').trim();
        if (!description) throw new Error('Description is required.');
        const amount = Number(dto.amount);
        if (Number.isNaN(amount) || amount < 0) throw new Error('Amount must be a valid non-negative number.');
        if (!dto.expense_date) throw new Error('Expense date is required.');

        const currency = (dto.currency || 'LKR').toUpperCase();
        const exchangeRate = currency === 'LKR' ? 1 : (Number(dto.exchange_rate) > 0 ? Number(dto.exchange_rate) : 1);

        const payload = {
            category: dto.category,
            description,
            vendor_or_payee: dto.vendor_or_payee?.trim() || null,
            voucher_number: dto.voucher_number?.trim() || null,
            amount,
            currency,
            exchange_rate: exchangeRate,
            expense_date: dto.expense_date,
            payment_method: dto.payment_method || 'Bank Transfer',
            payment_reference: dto.payment_reference?.trim() || null,
            bill_voucher_url: dto.bill_voucher_url || null,
            bank_transfer_slip_url: dto.bank_transfer_slip_url || null,
            signed_voucher_url: dto.signed_voucher_url || null,
            notes: dto.notes?.trim() || null,
            updated_at: new Date().toISOString(),
        };

        if (dto.id) {
            if (!caller.isAdmin) {
                throw new Error('Forbidden: Only Admin users can edit existing company expense records.');
            }
            const { data, error } = await db
                .from('company_expenses')
                .update(payload)
                .eq('id', dto.id)
                .select('*')
                .single();
            if (error) throw new Error(error.message);
            return { ...data, amount: Number(data.amount), exchange_rate: Number(data.exchange_rate) };
        }

        const { data, error } = await db
            .from('company_expenses')
            .insert({
                ...payload,
                recorded_by: caller.userId,
                recorded_by_name: caller.displayName,
            })
            .select('*')
            .single();

        if (error) throw new Error(error.message);
        return { ...data, amount: Number(data.amount), exchange_rate: Number(data.exchange_rate) };
    }

    static async deleteExpense(id: string): Promise<void> {
        const caller = await this.assertAdminOrFinanceAccess();
        if (!caller.isAdmin) {
            throw new Error('Forbidden: Only Admin users can delete company expense records.');
        }
        const db = createAdminClient();

        const { error } = await db.from('company_expenses').delete().eq('id', id);
        if (error) throw new Error(error.message);
    }

    static async uploadDocument(file: File, docKind: 'bill' | 'slip' | 'signed'): Promise<{ path: string }> {
        await this.assertAdminOrFinanceAccess();

        const ext = ALLOWED_MIME_TYPES[file.type];
        if (!ext) {
            throw new Error('Unsupported file type. Please upload a PDF, JPG, PNG, or WebP file.');
        }
        if (file.size > MAX_FILE_BYTES) {
            throw new Error('File is too large (maximum 10 MB).');
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const db = createAdminClient();
        const safeRand = Math.random().toString(36).substring(2, 12);
        const filePath = `company-expenses/${docKind}/${Date.now()}_${safeRand}.${ext}`;

        const { error: uploadError } = await db.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) throw new Error(uploadError.message);
        return { path: filePath };
    }

    static async getSignedDocumentUrl(filePath: string): Promise<string> {
        await this.assertAdminOrFinanceAccess();
        if (!filePath) throw new Error('Document path is required.');
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return filePath;
        }

        const db = createAdminClient();
        const { data, error } = await db.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(filePath, 3600);

        if (error || !data?.signedUrl) {
            throw new Error(error?.message || 'Failed to generate signed document URL.');
        }
        return data.signedUrl;
    }
}
