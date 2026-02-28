import { createClient } from '@supabase/supabase-js';
import { CreateInvoiceDTO, PaymentDTO } from '../dtos/finance.dto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class InvoiceService {
    static async createInvoice(dto: CreateInvoiceDTO) {
        const { items, ...invoiceData } = dto;

        const { data: invoice, error: invError } = await supabase
            .from('invoices')
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
                .from('invoice_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;
        }

        return invoice;
    }

    static async registerPayment(dto: PaymentDTO) {
        const { data: payment, error: payError } = await supabase
            .from('payments')
            .insert(dto)
            .select()
            .single();

        if (payError) throw payError;

        // Check if fully paid
        const { data: invoice } = await supabase.from('invoices').select('amount').eq('id', dto.invoice_id).single();
        if (invoice && invoice.amount <= dto.amount) {
            await supabase.from('invoices').update({ status: 'Paid' }).eq('id', dto.invoice_id);
        }

        return payment;
    }
}
