import { createAdminClient } from '@/utils/supabase/admin';
import type {
    TaskDTO, CreateTaskDTO, TaskTemplateDTO, TaskTemplateInputDTO, TaskCategoryDTO,
    TaskCommentDTO, TaskEventDTO, TaskUserOptionDTO, TaskFiltersDTO, LeaderboardEntryDTO, TaskTourOptionDTO,
} from '@/dtos/task.dto';
import type { TaskStatus } from '@/types/types';

const TASK_SELECT = `*, tour:tours(tour_code, title, start_date)`;

export class TaskService {
    private static db() { return createAdminClient(); }

    private static async names(ids: string[]): Promise<Record<string, string>> {
        const uniq = Array.from(new Set(ids.filter(Boolean)));
        if (!uniq.length) return {};
        const db = this.db();
        const [{ data: users }, { data: agents }, { data: admins }] = await Promise.all([
            db.from('users').select('id, email').in('id', uniq),
            db.from('agent_profiles').select('id, first_name, last_name').in('id', uniq),
            db.from('admin_profiles').select('id, first_name, last_name').in('id', uniq),
        ]);
        const map: Record<string, string> = {};
        (users || []).forEach((u: any) => { map[u.id] = u.email; });
        [...(agents || []), ...(admins || [])].forEach((p: any) => {
            const n = `${p.first_name || ''} ${p.last_name || ''}`.trim();
            if (n) map[p.id] = n;
        });
        return map;
    }

    private static toDTO(r: any, names: Record<string, string>): TaskDTO {
        const open = r.status !== 'completed' && r.status !== 'cancelled';
        return {
            id: r.id, taskNo: Number(r.task_no), tourId: r.tour_id,
            tourCode: r.tour?.tour_code ?? null, tourTitle: r.tour?.title ?? null,
            templateId: r.template_id, title: r.title, description: r.description,
            stepKey: r.step_key, priority: r.priority, status: r.status, dueAt: r.due_at,
            assignedTo: r.assigned_to, assignedToName: names[r.assigned_to] || 'Unknown',
            assignedBy: r.assigned_by, assignedByName: names[r.assigned_by] || 'Unknown',
            holdNote: r.hold_note, resumeOn: r.resume_on, reviewNote: r.review_note,
            requiresReview: !!r.requires_review, points: Number(r.points || 0),
            completedAt: r.completed_at, createdAt: r.created_at,
            isOverdue: open && !!r.due_at && new Date(r.due_at).getTime() < Date.now(),
        };
    }

    private static async hydrate(rows: any[]): Promise<TaskDTO[]> {
        const names = await this.names(rows.flatMap(r => [r.assigned_to, r.assigned_by]));
        return rows.map(r => this.toDTO(r, names));
    }

    private static async logEvent(taskId: string, actorId: string, type: string, from?: string | null, to?: string | null, note?: string | null) {
        await this.db().from('tour_task_events').insert({
            task_id: taskId, actor_id: actorId, event_type: type, from_value: from ?? null, to_value: to ?? null, note: note ?? null,
        });
    }

    // ---------- Tasks ----------
    static async listTasks(f: TaskFiltersDTO = {}): Promise<TaskDTO[]> {
        let q = this.db().from('tour_tasks').select(TASK_SELECT).order('due_at', { ascending: true, nullsFirst: false });
        if (f.tourId) q = q.eq('tour_id', f.tourId);
        if (f.assignedTo) q = q.eq('assigned_to', f.assignedTo);
        if (f.stepKey) q = q.eq('step_key', f.stepKey);
        if (f.statuses?.length) q = q.in('status', f.statuses);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return this.hydrate(data || []);
    }

    static async createTask(input: CreateTaskDTO, actorId: string): Promise<TaskDTO> {
        const db = this.db();
        let dueAt = input.dueAt ?? null;
        if (!dueAt && input.dueOffsetDays != null) {
            let base = new Date();
            if (input.dueOffsetBasis === 'tour_start' && input.tourId) {
                const { data: t } = await db.from('tours').select('start_date').eq('id', input.tourId).single();
                if (t?.start_date) base = new Date(t.start_date);
            }
            base.setDate(base.getDate() + input.dueOffsetDays);
            dueAt = base.toISOString();
        }
        const { data, error } = await db.from('tour_tasks').insert({
            tour_id: input.tourId ?? null, template_id: input.templateId ?? null,
            title: input.title, description: input.description ?? null, step_key: input.stepKey || 'general',
            priority: input.priority, assigned_to: input.assignedTo, assigned_by: actorId, due_at: dueAt,
            due_offset_days: input.dueOffsetDays ?? null, due_offset_basis: input.dueOffsetBasis ?? null,
            requires_review: input.requiresReview ?? false, points: input.points ?? 10,
        }).select(TASK_SELECT).single();
        if (error) throw new Error(error.message);
        await this.logEvent(data.id, actorId, 'created', null, input.assignedTo);
        return (await this.hydrate([data]))[0];
    }

    static async updateStatus(taskId: string, status: TaskStatus, actorId: string, note?: string, resumeOn?: string): Promise<void> {
        const db = this.db();
        const { data: cur, error: e0 } = await db.from('tour_tasks').select('*').eq('id', taskId).single();
        if (e0 || !cur) throw new Error('Task not found');
        if (status === 'on_hold' && !note?.trim()) throw new Error('A note is required to put a task on hold');
        const patch: Record<string, any> = { status, updated_at: new Date().toISOString() };
        if (status === 'on_hold') { patch.hold_note = note!.trim(); patch.resume_on = resumeOn || null; }
        if (status === 'in_progress' && !cur.started_at) patch.started_at = new Date().toISOString();
        if (status === 'in_review' && note) patch.review_note = note;
        if (status === 'completed') {
            // review-flagged tasks can only be completed by someone other than the assignee (admin/SPOC)
            if (cur.requires_review && cur.status !== 'in_review') throw new Error('This task must be submitted for review first');
            patch.completed_at = new Date().toISOString();
            if (cur.requires_review) { patch.approved_by = actorId; patch.approved_at = patch.completed_at; }
        }
        const { error } = await db.from('tour_tasks').update(patch).eq('id', taskId);
        if (error) throw new Error(error.message);
        await this.logEvent(taskId, actorId, 'status_changed', cur.status, status, note);
        if (status === 'completed') await this.awardPoints({ ...cur, ...patch });
    }

    static async reassign(taskId: string, newAssignee: string, actorId: string): Promise<void> {
        const db = this.db();
        const { data: cur } = await db.from('tour_tasks').select('assigned_to').eq('id', taskId).single();
        const { error } = await db.from('tour_tasks').update({ assigned_to: newAssignee, updated_at: new Date().toISOString() }).eq('id', taskId);
        if (error) throw new Error(error.message);
        await this.logEvent(taskId, actorId, 'reassigned', cur?.assigned_to, newAssignee);
    }

    static async updateDue(taskId: string, dueAt: string | null, actorId: string): Promise<void> {
        const { error } = await this.db().from('tour_tasks').update({ due_at: dueAt, updated_at: new Date().toISOString() }).eq('id', taskId);
        if (error) throw new Error(error.message);
        await this.logEvent(taskId, actorId, 'due_changed', null, dueAt);
    }

    // ---------- Comments / events ----------
    static async listComments(taskId: string): Promise<TaskCommentDTO[]> {
        const { data } = await this.db().from('tour_task_comments').select('*').eq('task_id', taskId).order('created_at');
        const names = await this.names((data || []).map((c: any) => c.author_id));
        return (data || []).map((c: any) => ({
            id: c.id, taskId: c.task_id, authorId: c.author_id, authorName: names[c.author_id] || 'Unknown',
            body: c.body, attachmentUrl: c.attachment_url, createdAt: c.created_at,
        }));
    }

    static async addComment(taskId: string, authorId: string, body: string | null, attachmentUrl?: string | null): Promise<void> {
        const { error } = await this.db().from('tour_task_comments').insert({
            task_id: taskId, author_id: authorId, body, attachment_url: attachmentUrl ?? null,
        });
        if (error) throw new Error(error.message);
    }

    static async listEvents(taskId: string): Promise<TaskEventDTO[]> {
        const { data } = await this.db().from('tour_task_events').select('*').eq('task_id', taskId).order('created_at');
        const names = await this.names((data || []).map((e: any) => e.actor_id));
        return (data || []).map((e: any) => ({
            id: e.id, eventType: e.event_type, fromValue: e.from_value, toValue: e.to_value,
            note: e.note, actorName: names[e.actor_id] || 'System', createdAt: e.created_at,
        }));
    }

    /** Creates tasks from templates flagged auto_create_on_step the first time a tour reaches a step. Assignee = tour SPOC (agent), else actor. */
    static async autoCreateForStep(tourId: string, stepKey: string, actorId: string): Promise<number> {
        const db = this.db();
        const { data: tpls } = await db.from('task_templates').select('*').eq('step_key', stepKey).eq('is_active', true).eq('auto_create_on_step', true);
        if (!tpls?.length) return 0;
        const { data: existing } = await db.from('tour_tasks').select('template_id').eq('tour_id', tourId).in('template_id', tpls.map((t: any) => t.id));
        const have = new Set((existing || []).map((e: any) => e.template_id));
        const { data: tour } = await db.from('tours').select('agent_id').eq('id', tourId).single();
        const assignee = tour?.agent_id || actorId;
        let n = 0;
        for (const t of tpls.filter((x: any) => !have.has(x.id))) {
            await this.createTask({
                tourId, templateId: t.id, title: t.title, description: t.description, stepKey, priority: t.default_priority,
                assignedTo: assignee, dueOffsetDays: t.due_offset_days, dueOffsetBasis: t.due_offset_basis,
                requiresReview: t.requires_review, points: t.points,
            }, actorId);
            n++;
        }
        return n;
    }

    /** Stores proof photos/files in the existing payment-proofs bucket under task-proofs/. */
    static async uploadProof(file: File): Promise<string> {
        const db = this.db();
        const ext = file.name.split('.').pop() || 'bin';
        const path = `task-proofs/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;
        const { error } = await db.storage.from('payment-proofs').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type || undefined });
        if (error) throw new Error(error.message);
        return db.storage.from('payment-proofs').getPublicUrl(path).data.publicUrl;
    }

    // ---------- Templates & categories ----------
    static async listCategories(): Promise<TaskCategoryDTO[]> {
        const { data } = await this.db().from('task_categories').select('*').order('sort_order');
        return (data || []).map((c: any) => ({ id: c.id, name: c.name, color: c.color, sortOrder: c.sort_order, isActive: c.is_active }));
    }

    static async listTemplates(stepKey?: string, activeOnly = false): Promise<TaskTemplateDTO[]> {
        let q = this.db().from('task_templates').select('*, category:task_categories(name)').order('step_key').order('title');
        if (stepKey) q = q.eq('step_key', stepKey);
        if (activeOnly) q = q.eq('is_active', true);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return (data || []).map((t: any) => ({
            id: t.id, title: t.title, description: t.description, stepKey: t.step_key,
            categoryId: t.category_id, categoryName: t.category?.name ?? null,
            defaultPriority: t.default_priority, dueOffsetDays: t.due_offset_days,
            dueOffsetBasis: t.due_offset_basis, requiresReview: t.requires_review, autoCreateOnStep: !!t.auto_create_on_step,
            points: t.points, isActive: t.is_active,
        }));
    }

    static async saveTemplate(i: TaskTemplateInputDTO, actorId: string): Promise<void> {
        const row = {
            title: i.title, description: i.description ?? null, step_key: i.stepKey, category_id: i.categoryId ?? null,
            default_priority: i.defaultPriority, due_offset_days: i.dueOffsetDays ?? null, due_offset_basis: i.dueOffsetBasis,
            requires_review: i.requiresReview, auto_create_on_step: i.autoCreateOnStep, points: i.points, is_active: i.isActive, updated_at: new Date().toISOString(),
        };
        const db = this.db();
        const { error } = i.id
            ? await db.from('task_templates').update(row).eq('id', i.id)
            : await db.from('task_templates').insert({ ...row, created_by: actorId });
        if (error) throw new Error(error.message);
    }

    static async deleteTemplate(id: string): Promise<void> {
        const { error } = await this.db().from('task_templates').delete().eq('id', id);
        if (error) throw new Error(error.message);
    }

    static async listTourOptions(): Promise<TaskTourOptionDTO[]> {
        const { data } = await this.db().from('tours').select('id, tour_code, title').order('created_at', { ascending: false });
        return (data || []).map((t: any) => ({ id: t.id, label: [t.tour_code, t.title].filter(Boolean).join(' · ') || t.id }));
    }

    // ---------- Users ----------
    static async listAssignableUsers(): Promise<TaskUserOptionDTO[]> {
        const db = this.db();
        const { data: users } = await db.from('users').select('id, email');
        const names = await this.names((users || []).map((u: any) => u.id));
        const { data: ur } = await db.from('user_roles').select('user_id, roles(name)');
        const roleOf: Record<string, string> = {};
        (ur || []).forEach((r: any) => { roleOf[r.user_id] = r.roles?.name ?? null; });
        return (users || [])
            .filter((u: any) => roleOf[u.id] !== 'tourist')
            .map((u: any) => ({ id: u.id, name: names[u.id] || u.email, role: roleOf[u.id] ?? null }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    // ---------- Gamification ----------
    private static async awardPoints(task: any): Promise<void> {
        const db = this.db();
        const uid = task.assigned_to;
        const rows: any[] = [{ user_id: uid, task_id: task.id, tour_id: task.tour_id, points: task.points, reason: 'completed' }];
        if (task.due_at && new Date(task.completed_at) <= new Date(task.due_at)) {
            rows.push({ user_id: uid, task_id: task.id, tour_id: task.tour_id, points: Math.ceil(task.points / 2), reason: 'on_time_bonus' });
        }
        await db.from('task_points_ledger').upsert(rows, { onConflict: 'task_id,user_id,reason', ignoreDuplicates: true });
        await this.awardBadges(uid);
    }

    private static async awardBadges(userId: string): Promise<void> {
        const db = this.db();
        const { data: done } = await db.from('tour_tasks').select('completed_at, due_at').eq('assigned_to', userId).eq('status', 'completed');
        const completed = done || [];
        const onTime = completed.filter((t: any) => t.due_at && new Date(t.completed_at) <= new Date(t.due_at)).length;
        const days = new Set(completed.map((t: any) => String(t.completed_at).slice(0, 10)));
        let streak = 0;
        for (let d = new Date(); days.has(d.toISOString().slice(0, 10)) || (streak === 0 && (d.setDate(d.getDate() - 1), days.has(d.toISOString().slice(0, 10)))); d.setDate(d.getDate() - 1)) streak++;
        const { data: badges } = await db.from('task_badges').select('*').eq('is_active', true);
        const earned = (badges || []).filter((b: any) =>
            (b.criteria_type === 'tasks_completed' && completed.length >= b.criteria_value) ||
            (b.criteria_type === 'on_time_count' && onTime >= b.criteria_value) ||
            (b.criteria_type === 'streak_days' && streak >= b.criteria_value));
        if (earned.length) {
            await db.from('user_task_badges').upsert(earned.map((b: any) => ({ user_id: userId, badge_id: b.id })), { onConflict: 'user_id,badge_id', ignoreDuplicates: true });
        }
    }

    static async getLeaderboard(): Promise<LeaderboardEntryDTO[]> {
        const { data } = await this.db().from('v_task_leaderboard').select('*').order('points_month', { ascending: false });
        return (data || []).map((r: any) => ({
            userId: r.user_id, userName: r.user_name, pointsWeek: Number(r.points_week || 0),
            pointsMonth: Number(r.points_month || 0), pointsTotal: Number(r.points_total || 0), tasksCompleted: Number(r.tasks_completed || 0),
        }));
    }
}
