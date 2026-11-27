import { redirect } from 'next/navigation';
import { CompanyExpenseService } from '@/services/company-expense.service';
import { CompanyExpenseDTO } from '@/dtos/company-expense.dto';
import CompanyExpensesClient from './CompanyExpensesClient';

export const metadata = {
    title: 'Company Expenses | Nilathra Admin',
    description: 'Record and manage general company operating expenses, bills, bank transfer slips, and signed vouchers.',
};

export const dynamic = 'force-dynamic';

export default async function CompanyExpensesPage() {
    let isAdmin = false;
    try {
        const access = await CompanyExpenseService.assertAdminOrFinanceAccess();
        isAdmin = access.isAdmin;
    } catch {
        redirect('/admin');
    }

    let initialExpenses: CompanyExpenseDTO[] = [];
    let initialError: string | null = null;

    try {
        initialExpenses = await CompanyExpenseService.listExpenses();
    } catch (e: any) {
        initialError = e?.message || 'Failed to load company expenses.';
    }

    return <CompanyExpensesClient initialExpenses={initialExpenses} initialError={initialError} isAdmin={isAdmin} />;
}
