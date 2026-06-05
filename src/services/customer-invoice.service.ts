import { createClient } from '@supabase/supabase-js';
import { CreateCustomerInvoiceDTO, CustomerPaymentDTO } from '../dtos/finance.dto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class CustomerInvoiceService {
    static async createCustomerInvoice(dto: CreateCustomerInvoiceDTO) {
        const { items, ...invoiceData } = dto;

        const { data: invoice, error: invError } = await supabase
            .from('customer_invoices')
            .insert(invoiceData)
            .select()
            .single();

        if (invError) throw invError;

        if (items && items.length > 0) {
            const itemsToInsert = items.map(item => ({
                ...item,
                invoice_id: invoice.id
            }));

            const { error: itemsError } = await supabase
                .from('customer_invoice_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;
        }

        return invoice;
    }

    static async registerCustomerPayment(dto: CustomerPaymentDTO) {
        const { data: payment, error: payError } = await supabase
            .from('customer_payments')
            .insert(dto)
            .select()
            .single();

        if (payError) throw payError;

        // Check if fully paid
        const { data: invoice } = await supabase.from('customer_invoices').select('amount').eq('id', dto.invoice_id).single();
        if (invoice && invoice.amount <= dto.amount) {
            await supabase.from('customer_invoices').update({ status: 'Paid' }).eq('id', dto.invoice_id);
        }

        return payment;
    }
}
