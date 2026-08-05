import { CustomerInvoiceService } from '../src/services/customer-invoice.service';

async function main() {
    const tourId = '091f11d4-56fb-4ee3-8684-3d529fada565';
    const items = await CustomerInvoiceService.previewInvoiceItems(tourId, {});
    console.log("Preview Invoice Items:", items);
}

main().catch(console.error);
