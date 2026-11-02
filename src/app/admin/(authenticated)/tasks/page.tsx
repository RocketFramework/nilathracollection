import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { TaskService } from '@/services/task.service';
import TaskBoard from './TaskBoard';

export const metadata = { title: 'Tasks | Admin', description: 'Assign, track and complete tour tasks.' };

export default async function TasksPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    const { data: role } = await supabase.rpc('get_user_role', { user_id: user.id });
    const isAdmin = role === 'admin';
    const [tasks, users, templates, tourOptions] = await Promise.all([
        TaskService.listTasks(isAdmin ? {} : { assignedTo: user.id }),
        TaskService.listAssignableUsers(),
        TaskService.listTemplates(undefined, true),
        TaskService.listTourOptions(),
    ]);
    return <TaskBoard initialTasks={tasks} users={users} templates={templates} tourOptions={tourOptions} currentUserId={user.id} isAdmin={isAdmin} />;
}
