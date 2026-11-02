import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { TaskService } from '@/services/task.service';
import MobileTasks from './MobileTasks';

export const metadata = {
    title: 'My Tasks | Nilathra',
    description: 'Mobile task list for tour team members.',
    manifest: '/tasks-manifest.webmanifest',
    themeColor: '#D4AF37',
};

export default async function MobileTasksPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/admin/login');
    const [tasks, tourOptions, userName] = await Promise.all([TaskService.listTasks({ assignedTo: user.id }), TaskService.listTourOptions(), TaskService.getUserName(user.id)]);
    return <MobileTasks initialTasks={tasks} tourOptions={tourOptions} userName={userName} />;
}
