import { redirect } from 'next/navigation';
import { CompanyPaymentReceiptService } from '@/services/company-payment-receipt.service';
import { CompanyPaymentReceiptDTO } from '@/dtos/company-payment-receipt.dto';
import PaymentReceiveClient from './PaymentReceiveClient';

export const metadata = {
    title: 'Payment Receive | Nilathra Admin',
    description: 'Record and audit incoming company payments, bank transfer slips, receipts, and signed documents.',
};

export const dynamic = 'force-dynamic';

export default async function PaymentReceivePage() {
    let isAdmin = false;
    try {
        const access = await CompanyPaymentReceiptService.assertAdminOrFinanceAccess();
        isAdmin = access.isAdmin;
    } catch {
        redirect('/admin');
    }

    let initialError: string | null = null;
    const [initialReceipts, categories] = await Promise.all([
        CompanyPaymentReceiptService.listReceipts().catch((e: any) => {
            initialError = e?.message || 'Failed to load payment receipts.';
            return [] as CompanyPaymentReceiptDTO[];
        }),
        CompanyPaymentReceiptService.getCategories(),
    ]);

    return (
        <PaymentReceiveClient
            initialReceipts={initialReceipts}
            categories={categories}
            initialError={initialError}
            isAdmin={isAdmin}
        />
    );
}
