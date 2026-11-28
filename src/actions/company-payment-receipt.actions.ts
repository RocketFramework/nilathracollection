'use server';

import { CompanyPaymentReceiptService } from '@/services/company-payment-receipt.service';
import { CompanyPaymentReceiptDTO, CompanyPaymentReceiptFilterDTO } from '@/dtos/company-payment-receipt.dto';

export async function listCompanyPaymentReceiptsAction(filters?: CompanyPaymentReceiptFilterDTO) {
    try {
        const receipts = await CompanyPaymentReceiptService.listReceipts(filters);
        return { success: true, receipts };
    } catch (error: any) {
        return { success: false, error: error?.message || 'Failed to load payment receipts.', receipts: [] as CompanyPaymentReceiptDTO[] };
    }
}

export async function saveCompanyPaymentReceiptAction(dto: CompanyPaymentReceiptDTO) {
    try {
        const receipt = await CompanyPaymentReceiptService.saveReceipt(dto);
        return { success: true, receipt };
    } catch (error: any) {
        return { success: false, error: error?.message || 'Failed to save payment receipt.' };
    }
}

export async function deleteCompanyPaymentReceiptAction(id: string) {
    try {
        await CompanyPaymentReceiptService.deleteReceipt(id);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error?.message || 'Failed to delete payment receipt.' };
    }
}

export async function uploadCompanyPaymentReceiptDocumentAction(formData: FormData) {
    try {
        const file = formData.get('file') as File | null;
        const docKindRaw = String(formData.get('docKind') || 'slip');
        const docKind = (docKindRaw === 'receipt' || docKindRaw === 'signed' ? docKindRaw : 'slip') as 'slip' | 'receipt' | 'signed';

        if (!file) {
            return { success: false, error: 'No file selected.' };
        }

        const { path } = await CompanyPaymentReceiptService.uploadDocument(file, docKind);
        return { success: true, path };
    } catch (error: any) {
        return { success: false, error: error?.message || 'Failed to upload document.' };
    }
}

export async function getCompanyPaymentReceiptDocumentUrlAction(filePath: string) {
    try {
        const url = await CompanyPaymentReceiptService.getSignedDocumentUrl(filePath);
        return { success: true, url };
    } catch (error: any) {
        return { success: false, error: error?.message || 'Failed to open document.' };
    }
}
