import { CustomerInvoiceService } from '../src/services/customer-invoice.service.ts';

async function test() {
    const tourId = 'c0569dc7-0eb6-4362-a071-668b643f3b54';
    const items = await CustomerInvoiceService.previewInvoiceItems(tourId, {});
    console.log("=== INVOICE PREVIEW ITEMS ===");
    items.forEach(item => {
        console.log(`- ${item.description}: $${item.amount}`);
    });
}

test().catch(console.error);
