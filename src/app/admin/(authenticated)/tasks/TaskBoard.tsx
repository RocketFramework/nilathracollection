'use client';

import { useMemo, useState, useTransition } from 'react';
import { deleteTaskAction, createTaskAction, listTasksAction, updateTaskStatusAction } from '@/actions/task.actions';
import TaskDetailPanel from '@/components/tasks/TaskDetailPanel';
import type { TaskDTO, TaskUserOptionDTO, TaskTemplateDTO, TaskTourOptionDTO } from '@/dtos/task.dto';
import { TASK_STEPS, type TaskStatus } from '@/types/types';

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'pending', label: 'Pending', color: '#6B7280' },
    { status: 'in_progress', label: 'In Progress', color: '#3B82F6' },
    { status: 'on_hold', label: 'On Hold', color: '#F59E0B' },
    { status: 'in_review', label: 'In Review', color: '#8B5CF6' },
    { status: 'completed', label: 'Completed', color: '#10B981' },
];

export default function TaskBoard({ initialTasks, users, templates, tourOptions, currentUserId, isAdmin }: {
    initialTasks: TaskDTO[]; users: TaskUserOptionDTO[]; templates: TaskTemplateDTO[]; tourOptions: TaskTourOptionDTO[]; currentUserId: string; isAdmin: boolean;
}) {
    const [tasks, setTasks] = useState(initialTasks);
    const [tourFilter, setTourFilter] = useState('');
    const [userFilter, setUserFilter] = useState(isAdmin ? '' : currentUserId);
    const [creating, setCreating] = useState(false);
    const [detail, setDetail] = useState<TaskDTO | null>(null);
    const [error, setError] = useState('');
    const [pending, start] = useTransition();
    const [form, setForm] = useState({ title: '', description: '', stepKey: 'general', priority: 'medium', assignedTo: currentUserId, dueAt: '', tourId: '', templateId: '' });

    const tours = useMemo(() => tourOptions.map(t => [t.id, t.label] as [string, string]), [tourOptions]);

    const visible = tasks.filter(t => (!tourFilter || t.tourId === tourFilter) && (!userFilter || t.assignedTo === userFilter) && t.status !== 'cancelled');
    const reload = async () => setTasks(await listTasksAction(isAdmin ? {} : { assignedTo: currentUserId }));

    const move = (t: TaskDTO, status: TaskStatus) => {
        let note: string | undefined;
        if (status === 'on_hold') { note = prompt('Why is this task on hold? (required)') || undefined; if (!note) return; }
        start(async () => { try { await updateTaskStatusAction(t.id, status, note); await reload(); } catch (e: any) { alert(e.message); } });
    };

    const remove = (t: TaskDTO) => {
        if (!confirm(`Delete task "${t.title}"? This also removes its comments and history.`)) return;
        start(async () => { try { await deleteTaskAction(t.id); await reload(); } catch (e: any) { alert(e.message); } });
    };

    const pickTemplate = (id: string) => {
        const tpl = templates.find(x => x.id === id);
        setForm(f => tpl ? { ...f, templateId: id, title: tpl.title, description: tpl.description || '', stepKey: tpl.stepKey, priority: tpl.defaultPriority } : { ...f, templateId: '' });
    };

    const create = () => start(async () => {
        try {
            setError('');
            const tpl = templates.find(x => x.id === form.templateId);
            await createTaskAction({
                title: form.title, description: form.description || null, stepKey: form.stepKey, priority: form.priority as any,
                assignedTo: form.assignedTo, tourId: form.tourId || null, templateId: form.templateId || null,
                dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
                dueOffsetDays: !form.dueAt && tpl ? tpl.dueOffsetDays : null, dueOffsetBasis: tpl?.dueOffsetBasis ?? null,
                requiresReview: tpl?.requiresReview ?? false, points: tpl?.points,
            });
            setCreating(false); await reload();
        } catch (e: any) { setError(e.message); }
    });

    const inp = 'w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm';
    return (
        <div className="p-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <h1 className="text-2xl font-semibold text-[#2B2B2B] mr-auto">Tasks</h1>
                <select id="task-filter-tour" className={inp + ' !w-48'} value={tourFilter} onChange={e => setTourFilter(e.target.value)}>
                    <option value="">All tours</option>
                    {tours.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
                {isAdmin && (
                    <select id="task-filter-user" className={inp + ' !w-48'} value={userFilter} onChange={e => setUserFilter(e.target.value)}>
                        <option value="">Everyone</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                )}
                <a href="/admin/tasks/standup" className="text-sm text-[#D4AF37]">Daily standup</a>
                <button id="new-task-btn" onClick={() => setCreating(true)} className="bg-[#D4AF37] text-white px-4 py-2 rounded-lg text-sm font-medium">+ New task</button>
            </div>

            <div className="grid grid-cols-5 gap-4">
                {COLUMNS.map(col => {
                    const items = visible.filter(t => t.status === col.status);
                    return (
                        <div key={col.status} className="bg-[#FAF9F6] rounded-xl p-3 min-h-[300px]">
                            <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                                <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />{col.label}
                                <span className="ml-auto text-xs text-[#6B7280]">{items.length}</span>
                            </div>
                            <div className="space-y-2">
                                {items.map(t => (
                                    <div key={t.id} className={`bg-white rounded-lg border p-3 text-sm ${t.isOverdue ? 'border-red-300' : 'border-[#E5E7EB]'}`}>
                                        <div className="font-medium cursor-pointer hover:underline" onClick={() => setDetail(t)}>{t.title}</div>
                                        <div className="text-xs text-[#6B7280] mt-1">{t.tourCode || 'General'} · {TASK_STEPS.find(s => s.key === t.stepKey)?.label}</div>
                                        <div className="text-xs text-[#6B7280]">{t.assignedToName}</div>
                                        {t.dueAt && <div className={`text-xs ${t.isOverdue ? 'text-red-600' : 'text-[#6B7280]'}`}>Due {new Date(t.dueAt).toLocaleDateString()}</div>}
                                        {t.holdNote && t.status === 'on_hold' && <div className="text-xs text-amber-700 mt-1">“{t.holdNote}”</div>}
                                        {isAdmin && <button disabled={pending} onClick={() => remove(t)} className="text-xs text-red-500 mt-2 block">Delete</button>}
                                        {t.status !== 'completed' && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {t.status !== 'in_progress' && <button disabled={pending} onClick={() => move(t, 'in_progress')} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600">Start</button>}
                                                {t.status !== 'on_hold' && <button disabled={pending} onClick={() => move(t, 'on_hold')} className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700">Hold</button>}
                                                {t.requiresReview && t.status !== 'in_review' && <button disabled={pending} onClick={() => move(t, 'in_review')} className="text-xs px-2 py-1 rounded bg-purple-50 text-purple-600">Review</button>}
                                                {(!t.requiresReview || t.status === 'in_review') && <button disabled={pending} onClick={() => move(t, 'completed')} className="text-xs px-2 py-1 rounded bg-green-50 text-green-700">Done</button>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {detail && <TaskDetailPanel task={detail} onClose={() => setDetail(null)} />}

            {creating && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-[480px] space-y-3">
                        <h3 className="font-semibold">New task</h3>
                        <select id="new-task-template" className={inp} value={form.templateId} onChange={e => pickTemplate(e.target.value)}>
                            <option value="">Custom task…</option>
                            {templates.map(t => <option key={t.id} value={t.id}>{TASK_STEPS.find(s => s.key === t.stepKey)?.label} — {t.title}</option>)}
                        </select>
                        <input id="new-task-title" className={inp} placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                        <textarea className={inp} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                        <div className="grid grid-cols-2 gap-3">
                            <select id="new-task-assignee" className={inp} value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                            <select className={inp} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                {['low', 'medium', 'high', 'urgent'].map(p => <option key={p}>{p}</option>)}
                            </select>
                            <input type="date" className={inp} value={form.dueAt} onChange={e => setForm({ ...form, dueAt: e.target.value })} />
                            <select className={inp} value={form.tourId} onChange={e => setForm({ ...form, tourId: e.target.value })}>
                                <option value="">No tour</option>
                                {tours.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                            </select>
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setCreating(false)} className="px-4 py-2 text-sm">Cancel</button>
                            <button id="new-task-save" disabled={pending || !form.title.trim()} onClick={create} className="bg-[#D4AF37] text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">Assign</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
