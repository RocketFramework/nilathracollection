import { CompanyPaymentReceiveCategory, CompanyPaymentReceiveMethod } from '@/types/types';

export interface CompanyPaymentReceiptDTO {
    id?: string;
    category: CompanyPaymentReceiveCategory;
    description: string;
    received_from?: string | null;
    receipt_number?: string | null;
    tour_code?: string | null;
    amount: number;
    currency: string;
    exchange_rate: number;
    received_date: string;
    payment_method: CompanyPaymentReceiveMethod | string;
    payment_reference?: string | null;
    bank_account?: string | null;
    bank_slip_url?: string | null;
    receipt_voucher_url?: string | null;
    signed_document_url?: string | null;
    notes?: string | null;
    recorded_by?: string | null;
    recorded_by_name?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface CompanyPaymentReceiptFilterDTO {
    category?: string;
    month?: string; // YYYY-MM
    search?: string;
}
