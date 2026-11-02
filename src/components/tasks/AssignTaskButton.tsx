'use client';

import { useEffect, useState, useTransition } from 'react';
import { ListChecks } from 'lucide-react';
import { createTaskAction, ensureStepTasksAction, listAssignableUsersAction, listTaskTemplatesAction, listTasksAction } from '@/actions/task.actions';
import type { TaskTemplateDTO, TaskUserOptionDTO, TaskDTO } from '@/dtos/task.dto';
import { TASK_STEPS, PLANNER_STEP_TO_TASK_STEP } from '@/types/types';

export default function AssignTaskButton({ tourId, plannerStepId }: { tourId: string | null; plannerStepId: string }) {
    const stepKey = PLANNER_STEP_TO_TASK_STEP[plannerStepId] || 'general';
    const stepLabel = TASK_STEPS.find(s => s.key === stepKey)?.label;
    const [open, setOpen] = useState(false);
    const [users, setUsers] = useState<TaskUserOptionDTO[]>([]);
    const [templates, setTemplates] = useState<TaskTemplateDTO[]>([]);
    const [existing, setExisting] = useState<TaskDTO[]>([]);
    const [form, setForm] = useState({ templateId: '', title: '', description: '', assignedTo: '', priority: 'medium', dueAt: '' });
    const [error, setError] = useState('');
    const [pending, start] = useTransition();

    const [openCountLive, setOpenCountLive] = useState(0);
    useEffect(() => {
        if (!tourId) return;
        let alive = true;
        ensureStepTasksAction(tourId, stepKey)
            .then(() => listTasksAction({ tourId, stepKey }))
            .then(t => { if (alive) { setExisting(t); setOpenCountLive(t.length); } })
            .catch(() => {});
        return () => { alive = false; };
    }, [tourId, stepKey]);

    const load = async () => {
        const [u, t, e] = await Promise.all([
            listAssignableUsersAction(), listTaskTemplatesAction(stepKey, true),
            tourId ? listTasksAction({ tourId, stepKey }) : Promise.resolve([] as TaskDTO[]),
        ]);
        setUsers(u); setTemplates(t); setExisting(e);
    };
    const openPanel = () => { setOpen(true); setError(''); load(); };
    const openCount = existing.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
    const pick = (id: string) => {
        const t = templates.find(x => x.id === id);
        setForm(f => t ? { ...f, templateId: id, title: t.title, description: t.description || '', priority: t.defaultPriority } : { ...f, templateId: '' });
    };
    const save = () => start(async () => {
        try {
            const tpl = templates.find(x => x.id === form.templateId);
            await createTaskAction({
                tourId, templateId: form.templateId || null, title: form.title, description: form.description || null,
                stepKey, priority: form.priority as any, assignedTo: form.assignedTo,
                dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
                dueOffsetDays: !form.dueAt && tpl ? tpl.dueOffsetDays : null, dueOffsetBasis: tpl?.dueOffsetBasis ?? null,
                requiresReview: tpl?.requiresReview ?? false, points: tpl?.points,
            });
            setForm({ templateId: '', title: '', description: '', assignedTo: '', priority: 'medium', dueAt: '' });
            await load();
        } catch (e: any) { setError(e.message); }
    });

    const inp = 'w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm';
    return (
        <>
            <button id="assign-task-btn" type="button" onClick={openPanel}
                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-neutral-200 text-xs font-bold text-emerald-800 hover:bg-emerald-50 shadow-sm">
                <ListChecks className="w-4 h-4" /> Assign Task
                {openCount > 0 && <span className="bg-amber-500 text-white rounded-full px-2 py-0.5 text-[10px]">{openCount}</span>}
            </button>
            {open && (
                <div className="fixed inset-0 z-[100] flex justify-end bg-black/30" onClick={() => setOpen(false)}>
                    <div className="bg-white w-[420px] h-full p-6 overflow-y-auto space-y-3 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-neutral-800">Assign task · {stepLabel}</h3>
                            <button onClick={() => setOpen(false)} className="text-neutral-400">✕</button>
                        </div>
                        {!tourId && <p className="text-xs text-amber-700">No tour selected — task will not be linked to a tour.</p>}
                        {existing.length > 0 && (
                            <div className="text-xs space-y-1 bg-neutral-50 rounded-lg p-3">
                                <div className="font-semibold text-neutral-500 uppercase tracking-wider">Existing for this step</div>
                                {existing.map(t => <div key={t.id} className="flex justify-between"><span>{t.title} <em className="text-neutral-400">({t.assignedToName})</em></span><span className="capitalize">{t.status.replace('_', ' ')}</span></div>)}
                            </div>
                        )}
                        <select id="assign-template" className={inp} value={form.templateId} onChange={e => pick(e.target.value)}>
                            <option value="">Custom task…</option>
                            {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                        </select>
                        <input id="assign-title" className={inp} placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                        <textarea className={inp} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                        <select id="assign-user" className={inp} value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                            <option value="">Assign to…</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}{u.role ? ` (${u.role})` : ''}</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-3">
                            <select className={inp} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                {['low', 'medium', 'high', 'urgent'].map(p => <option key={p}>{p}</option>)}
                            </select>
                            <input type="date" className={inp} value={form.dueAt} onChange={e => setForm({ ...form, dueAt: e.target.value })} />
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <button id="assign-save" disabled={pending || !form.title.trim() || !form.assignedTo} onClick={save}
                            className="w-full bg-emerald-800 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">Assign task</button>
                    </div>
                </div>
            )}
        </>
    );
}
