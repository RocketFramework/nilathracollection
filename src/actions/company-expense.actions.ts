'use server';

import { CompanyExpenseService } from '@/services/company-expense.service';
import { CompanyExpenseDTO, CompanyExpenseFilterDTO } from '@/dtos/company-expense.dto';

export async function listCompanyExpensesAction(filters?: CompanyExpenseFilterDTO) {
    try {
        const expenses = await CompanyExpenseService.listExpenses(filters);
        return { success: true, expenses };
    } catch (error: any) {
        return { success: false, error: error?.message || 'Failed to load company expenses.', expenses: [] as CompanyExpenseDTO[] };
    }
}

export async function saveCompanyExpenseAction(dto: CompanyExpenseDTO) {
    try {
        const expense = await CompanyExpenseService.saveExpense(dto);
        return { success: true, expense };
    } catch (error: any) {
        return { success: false, error: error?.message || 'Failed to save company expense.' };
    }
}

export async function deleteCompanyExpenseAction(id: string) {
    try {
        await CompanyExpenseService.deleteExpense(id);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error?.message || 'Failed to delete company expense.' };
    }
}

export async function uploadCompanyExpenseDocumentAction(formData: FormData) {
    try {
        const file = formData.get('file') as File | null;
        const docKindRaw = String(formData.get('docKind') || 'bill');
        const docKind = (docKindRaw === 'slip' || docKindRaw === 'signed' ? docKindRaw : 'bill') as 'bill' | 'slip' | 'signed';

        if (!file) {
            return { success: false, error: 'No file selected.' };
        }

        const { path } = await CompanyExpenseService.uploadDocument(file, docKind);
        return { success: true, path };
    } catch (error: any) {
        return { success: false, error: error?.message || 'Failed to upload document.' };
    }
}

export async function getCompanyExpenseDocumentUrlAction(filePath: string) {
    try {
        const url = await CompanyExpenseService.getSignedDocumentUrl(filePath);
        return { success: true, url };
    } catch (error: any) {
        return { success: false, error: error?.message || 'Failed to open document.' };
    }
}
