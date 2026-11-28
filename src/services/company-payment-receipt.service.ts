import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { UserService } from '@/services/user.service';
import { AppSettingsService } from '@/services/app-settings.service';
import { CompanyPaymentReceiptDTO, CompanyPaymentReceiptFilterDTO } from '@/dtos/company-payment-receipt.dto';
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

export class CompanyPaymentReceiptService {
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
            throw new Error('Forbidden: Payment Receive is restricted to Admin and Finance users.');
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
            const raw = await AppSettingsService.getSettingValue(Settings.Company_Payment_Receive_Categories);
            return this.parseCategoriesSetting(raw);
        } catch (err) {
            console.error('Error loading payment receive categories from app_settings:', err);
            return [];
        }
    }

    static async listReceipts(filters?: CompanyPaymentReceiptFilterDTO): Promise<CompanyPaymentReceiptDTO[]> {
        await this.assertAdminOrFinanceAccess();
        const db = createAdminClient();

        let query = db
            .from('company_payment_receipts')
            .select('*')
            .order('received_date', { ascending: false })
            .order('created_at', { ascending: false });

        if (filters?.category && filters.category !== 'All') {
            query = query.eq('category', filters.category);
        }

        if (filters?.month) {
            const [yStr, mStr] = filters.month.split('-');
            const y = Number(yStr);
            const m = Number(mStr);
            if (y && m >= 1 && m <= 12) {
                const startDate = `${yStr}-${mStr}-01`;
                const lastDay = new Date(y, m, 0).getDate();
                const endDate = `${yStr}-${mStr}-${String(lastDay).padStart(2, '0')}`;
                query = query.gte('received_date', startDate).lte('received_date', endDate);
            }
        }

        const { data, error } = await query;
        if (error) {
            if (error.code === '42P01') {
                throw new Error('The company_payment_receipts table does not exist yet. Please run data/migrations/create_company_payment_receipts_table.sql in Supabase.');
            }
            throw new Error(error.message);
        }

        let rows = (data || []).map((row: any): CompanyPaymentReceiptDTO => ({
            id: row.id,
            category: row.category,
            description: row.description,
            received_from: row.received_from ?? null,
            receipt_number: row.receipt_number ?? null,
            tour_code: row.tour_code ?? null,
            amount: Number(row.amount || 0),
            currency: row.currency || 'LKR',
            exchange_rate: Number(row.exchange_rate || 1),
            received_date: row.received_date,
            payment_method: row.payment_method || 'Bank Transfer',
            payment_reference: row.payment_reference ?? null,
            bank_account: row.bank_account ?? null,
            bank_slip_url: row.bank_slip_url ?? null,
            receipt_voucher_url: row.receipt_voucher_url ?? null,
            signed_document_url: row.signed_document_url ?? null,
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
                (r.received_from || '').toLowerCase().includes(q) ||
                (r.receipt_number || '').toLowerCase().includes(q) ||
                (r.tour_code || '').toLowerCase().includes(q) ||
                (r.payment_reference || '').toLowerCase().includes(q) ||
                (r.bank_account || '').toLowerCase().includes(q) ||
                r.category.toLowerCase().includes(q) ||
                (r.notes || '').toLowerCase().includes(q)
            );
        }

        return rows;
    }

    static async saveReceipt(dto: CompanyPaymentReceiptDTO): Promise<CompanyPaymentReceiptDTO> {
        const caller = await this.assertAdminOrFinanceAccess();
        const db = createAdminClient();

        const description = (dto.description || '').trim();
        if (!description) throw new Error('Description is required.');
        const amount = Number(dto.amount);
        if (Number.isNaN(amount) || amount < 0) throw new Error('Amount must be a valid non-negative number.');
        if (!dto.received_date) throw new Error('Received date is required.');

        const currency = (dto.currency || 'LKR').toUpperCase();
        const exchangeRate = currency === 'LKR' ? 1 : (Number(dto.exchange_rate) > 0 ? Number(dto.exchange_rate) : 1);

        const payload = {
            category: dto.category,
            description,
            received_from: dto.received_from?.trim() || null,
            receipt_number: dto.receipt_number?.trim() || null,
            tour_code: dto.tour_code?.trim() || null,
            amount,
            currency,
            exchange_rate: exchangeRate,
            received_date: dto.received_date,
            payment_method: dto.payment_method || 'Bank Transfer',
            payment_reference: dto.payment_reference?.trim() || null,
            bank_account: dto.bank_account?.trim() || null,
            bank_slip_url: dto.bank_slip_url || null,
            receipt_voucher_url: dto.receipt_voucher_url || null,
            signed_document_url: dto.signed_document_url || null,
            notes: dto.notes?.trim() || null,
            updated_at: new Date().toISOString(),
        };

        if (dto.id) {
            if (!caller.isAdmin) {
                throw new Error('Forbidden: Only Admin users can edit existing payment receipt records.');
            }
            const { data, error } = await db
                .from('company_payment_receipts')
                .update(payload)
                .eq('id', dto.id)
                .select('*')
                .single();
            if (error) throw new Error(error.message);
            return { ...data, amount: Number(data.amount), exchange_rate: Number(data.exchange_rate) };
        }

        const { data, error } = await db
            .from('company_payment_receipts')
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

    static async deleteReceipt(id: string): Promise<void> {
        const caller = await this.assertAdminOrFinanceAccess();
        if (!caller.isAdmin) {
            throw new Error('Forbidden: Only Admin users can delete payment receipt records.');
        }
        const db = createAdminClient();

        const { error } = await db.from('company_payment_receipts').delete().eq('id', id);
        if (error) throw new Error(error.message);
    }

    static async uploadDocument(file: File, docKind: 'slip' | 'receipt' | 'signed'): Promise<{ path: string }> {
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
        const filePath = `company-payment-receipts/${docKind}/${Date.now()}_${safeRand}.${ext}`;

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
