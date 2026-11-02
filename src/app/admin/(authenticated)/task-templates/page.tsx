import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { TaskService } from '@/services/task.service';
import TaskTemplatesManager from './TaskTemplatesManager';

export const metadata = { title: 'Task Templates | Admin', description: 'Manage default tasks for each tour planning step.' };

export default async function TaskTemplatesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    const { data: role } = await supabase.rpc('get_user_role', { user_id: user.id });
    if (role && role !== 'admin') redirect('/admin');
    const [templates, categories] = await Promise.all([TaskService.listTemplates(), TaskService.listCategories()]);
    return <TaskTemplatesManager initialTemplates={templates} categories={categories} />;
}
