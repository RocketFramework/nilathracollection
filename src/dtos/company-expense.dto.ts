import { CompanyExpenseCategory, CompanyExpensePaymentMethod } from '@/types/types';

export interface CompanyExpenseDTO {
    id?: string;
    category: CompanyExpenseCategory;
    description: string;
    vendor_or_payee?: string | null;
    voucher_number?: string | null;
    amount: number;
    currency: string;
    exchange_rate: number;
    expense_date: string;
    payment_method: CompanyExpensePaymentMethod | string;
    payment_reference?: string | null;
    bill_voucher_url?: string | null;
    bank_transfer_slip_url?: string | null;
    signed_voucher_url?: string | null;
    notes?: string | null;
    recorded_by?: string | null;
    recorded_by_name?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface CompanyExpenseFilterDTO {
    category?: string;
    month?: string; // YYYY-MM
    search?: string;
}
