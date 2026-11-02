import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { TaskService } from '@/services/task.service';
import StandupBoard from './StandupBoard';

export const metadata = { title: 'Daily Standup | Tasks', description: 'Morning standup board for tour tasks.' };

export default async function StandupPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    const { data: role } = await supabase.rpc('get_user_role', { user_id: user.id });
    const isAdmin = role === 'admin';
    const [tasks, leaderboard] = await Promise.all([
        TaskService.listTasks(isAdmin ? {} : { assignedTo: user.id }),
        TaskService.getLeaderboard(),
    ]);
    return <StandupBoard tasks={tasks} leaderboard={leaderboard} />;
}
