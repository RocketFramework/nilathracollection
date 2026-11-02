"use server";

import { createClient } from '@/utils/supabase/server';
import { TaskService } from '@/services/task.service';
import { PushService } from '@/services/push.service';
import type { CreateTaskDTO, TaskFiltersDTO, TaskTemplateInputDTO } from '@/dtos/task.dto';
import type { TaskStatus } from '@/types/types';

async function me(): Promise<string> {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error('Not authenticated');
    return data.user.id;
}

export async function listTasksAction(f: TaskFiltersDTO = {}) { await me(); return TaskService.listTasks(f); }
export async function listMyTasksAction(f: TaskFiltersDTO = {}) { const id = await me(); return TaskService.listTasks({ ...f, assignedTo: id }); }
export async function createTaskAction(i: CreateTaskDTO) {
    const actor = await me();
    const task = await TaskService.createTask(i, actor);
    if (i.assignedTo !== actor) {
        await PushService.sendToUser(i.assignedTo, { title: 'New task assigned', body: task.title, url: '/admin/m-tasks' });
    }
    return task;
}
export async function savePushSubscriptionAction(sub: { endpoint: string; p256dh: string; auth: string }, userAgent?: string) {
    return PushService.saveSubscription(await me(), sub, userAgent);
}
export async function updateTaskStatusAction(id: string, s: TaskStatus, note?: string, resumeOn?: string) { return TaskService.updateStatus(id, s, await me(), note, resumeOn); }
export async function reassignTaskAction(id: string, to: string) { return TaskService.reassign(id, to, await me()); }
export async function updateTaskDueAction(id: string, due: string | null) { return TaskService.updateDue(id, due, await me()); }
export async function addTaskCommentAction(id: string, body: string | null, url?: string | null) { return TaskService.addComment(id, await me(), body, url); }
export async function listTaskCommentsAction(id: string) { await me(); return TaskService.listComments(id); }
export async function listTaskEventsAction(id: string) { await me(); return TaskService.listEvents(id); }
export async function listTaskTemplatesAction(step?: string, activeOnly = false) { await me(); return TaskService.listTemplates(step, activeOnly); }
export async function listTaskCategoriesAction() { await me(); return TaskService.listCategories(); }
export async function saveTaskTemplateAction(i: TaskTemplateInputDTO) { return TaskService.saveTemplate(i, await me()); }
export async function deleteTaskTemplateAction(id: string) { await me(); return TaskService.deleteTemplate(id); }
export async function listAssignableUsersAction() { await me(); return TaskService.listAssignableUsers(); }
export async function getTaskLeaderboardAction() { await me(); return TaskService.getLeaderboard(); }
export async function listTourOptionsAction() { await me(); return TaskService.listTourOptions(); }
export async function ensureStepTasksAction(tourId: string, stepKey: string) {
    const actor = await me();
    const n = await TaskService.autoCreateForStep(tourId, stepKey, actor);
    return { created: n };
}
export async function uploadTaskProofAction(formData: FormData) {
    await me();
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');
    return TaskService.uploadProof(file);
}
