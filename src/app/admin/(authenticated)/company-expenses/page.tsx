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
    let categories: string[] = [];
    let initialError: string | null = null;

    const [expensesResult, loadedCategories] = await Promise.all([
        CompanyExpenseService.listExpenses().catch((e: any) => {
            initialError = e?.message || 'Failed to load company expenses.';
            return [] as CompanyExpenseDTO[];
        }),
        CompanyExpenseService.getCategories(),
    ]);
    initialExpenses = expensesResult;
    categories = loadedCategories;

    return (
        <CompanyExpensesClient
            initialExpenses={initialExpenses}
            categories={categories}
            initialError={initialError}
            isAdmin={isAdmin}
        />
    );
}
