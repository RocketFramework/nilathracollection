'use client';

import { useState, useTransition } from 'react';
import { saveTaskTemplateAction, deleteTaskTemplateAction, listTaskTemplatesAction } from '@/actions/task.actions';
import type { TaskTemplateDTO, TaskTemplateInputDTO, TaskCategoryDTO } from '@/dtos/task.dto';
import { TASK_STEPS } from '@/types/types';

const blank: TaskTemplateInputDTO = {
    title: '', description: '', stepKey: 'general', categoryId: null, defaultPriority: 'medium',
    dueOffsetDays: null, dueOffsetBasis: 'creation', requiresReview: false, autoCreateOnStep: false, points: 10, isActive: true,
};

export default function TaskTemplatesManager({ initialTemplates, categories }: { initialTemplates: TaskTemplateDTO[]; categories: TaskCategoryDTO[] }) {
    const [templates, setTemplates] = useState(initialTemplates);
    const [editing, setEditing] = useState<TaskTemplateInputDTO | null>(null);
    const [error, setError] = useState('');
    const [pending, start] = useTransition();

    const reload = async () => setTemplates(await listTaskTemplatesAction());
    const save = () => start(async () => {
        try { setError(''); await saveTaskTemplateAction(editing!); setEditing(null); await reload(); }
        catch (e: any) { setError(e.message); }
    });
    const remove = (id: string) => confirm('Delete this template?') && start(async () => { await deleteTaskTemplateAction(id); await reload(); });
    const edit = (t: TaskTemplateDTO) => setEditing({ ...t });
    const input = 'w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm';

    return (
        <div className="p-8 max-w-6xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-[#2B2B2B]">Task Templates</h1>
                    <p className="text-sm text-[#6B7280]">Default tasks offered at each tour planning step.</p>
                </div>
                <button id="new-task-template-btn" onClick={() => setEditing({ ...blank })} className="bg-[#D4AF37] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">+ New template</button>
            </div>

            {TASK_STEPS.map(step => {
                const list = templates.filter(t => t.stepKey === step.key);
                if (!list.length) return null;
                return (
                    <section key={step.key} className="mb-6">
                        <h2 className="text-xs uppercase tracking-wider text-[#6B7280] mb-2">{step.label}</h2>
                        <div className="bg-white rounded-xl border border-[#E5E7EB] divide-y divide-[#F3F4F6]">
                            {list.map(t => (
                                <div key={t.id} className="flex items-center gap-4 px-4 py-3">
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-medium text-sm ${t.isActive ? '' : 'line-through text-[#9CA3AF]'}`}>{t.title}</div>
                                        <div className="text-xs text-[#6B7280] truncate">{t.description}</div>
                                    </div>
                                    {t.categoryName && <span className="text-xs bg-[#F5F3EF] rounded-full px-2 py-1">{t.categoryName}</span>}
                                    <span className="text-xs text-[#6B7280] w-28">{t.dueOffsetDays == null ? 'No due date' : `${t.dueOffsetDays}d ${t.dueOffsetBasis === 'tour_start' ? 'from tour start' : 'after creation'}`}</span>
                                    <span className="text-xs w-14">{t.points} pts</span>
                                    {t.requiresReview && <span className="text-xs text-amber-600">Review</span>}
                                    <button onClick={() => edit(t)} className="text-xs text-[#D4AF37]">Edit</button>
                                    <button onClick={() => remove(t.id)} className="text-xs text-red-500">Delete</button>
                                </div>
                            ))}
                        </div>
                    </section>
                );
            })}

            {editing && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-[520px] space-y-3 max-h-[90vh] overflow-auto">
                        <h3 className="font-semibold">{editing.id ? 'Edit' : 'New'} template</h3>
                        <input id="tpl-title" className={input} placeholder="Title" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} />
                        <textarea id="tpl-desc" className={input} placeholder="Description" value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} />
                        <div className="grid grid-cols-2 gap-3">
                            <select id="tpl-step" className={input} value={editing.stepKey} onChange={e => setEditing({ ...editing, stepKey: e.target.value })}>
                                {TASK_STEPS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>
                            <select id="tpl-category" className={input} value={editing.categoryId || ''} onChange={e => setEditing({ ...editing, categoryId: e.target.value || null })}>
                                <option value="">No category</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select id="tpl-priority" className={input} value={editing.defaultPriority} onChange={e => setEditing({ ...editing, defaultPriority: e.target.value as any })}>
                                {['low', 'medium', 'high', 'urgent'].map(p => <option key={p}>{p}</option>)}
                            </select>
                            <input id="tpl-points" type="number" className={input} value={editing.points} onChange={e => setEditing({ ...editing, points: Number(e.target.value) })} />
                            <input id="tpl-offset" type="number" className={input} placeholder="Due offset (days, negative = before)" value={editing.dueOffsetDays ?? ''} onChange={e => setEditing({ ...editing, dueOffsetDays: e.target.value === '' ? null : Number(e.target.value) })} />
                            <select id="tpl-basis" className={input} value={editing.dueOffsetBasis} onChange={e => setEditing({ ...editing, dueOffsetBasis: e.target.value as any })}>
                                <option value="creation">From task creation</option>
                                <option value="tour_start">From tour start</option>
                            </select>
                        </div>
                        <label className="flex gap-2 text-sm"><input type="checkbox" checked={editing.requiresReview} onChange={e => setEditing({ ...editing, requiresReview: e.target.checked })} /> Requires admin review</label>
                        <label className="flex gap-2 text-sm"><input type="checkbox" checked={editing.autoCreateOnStep} onChange={e => setEditing({ ...editing, autoCreateOnStep: e.target.checked })} /> Auto-create for the tour SPOC when the tour reaches this step</label>
                        <label className="flex gap-2 text-sm"><input type="checkbox" checked={editing.isActive} onChange={e => setEditing({ ...editing, isActive: e.target.checked })} /> Active</label>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm">Cancel</button>
                            <button id="tpl-save" disabled={pending || !editing.title.trim()} onClick={save} className="bg-[#D4AF37] text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
