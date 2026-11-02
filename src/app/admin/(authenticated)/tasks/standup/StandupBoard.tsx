'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { TaskDTO, LeaderboardEntryDTO } from '@/dtos/task.dto';

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export default function StandupBoard({ tasks, leaderboard }: { tasks: TaskDTO[]; leaderboard: LeaderboardEntryDTO[] }) {
    const [person, setPerson] = useState('');
    const [tour, setTour] = useState('');

    const people = useMemo(() => Array.from(new Map(tasks.map(t => [t.assignedTo, t.assignedToName])).entries()), [tasks]);
    const tours = useMemo(() => Array.from(new Map(tasks.filter(t => t.tourId).map(t => [t.tourId!, t.tourCode || t.tourTitle || t.tourId!])).entries()), [tasks]);
    const list = tasks.filter(t => (!person || t.assignedTo === person) && (!tour || t.tourId === tour));

    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    const open = list.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
    const columns: { title: string; color: string; items: TaskDTO[] }[] = [
        { title: 'Overdue', color: '#EF4444', items: open.filter(t => t.isOverdue && t.status !== 'on_hold') },
        { title: 'Due today', color: '#F59E0B', items: open.filter(t => !t.isOverdue && t.dueAt && sameDay(new Date(t.dueAt), today) && t.status !== 'on_hold') },
        { title: 'On hold', color: '#6B7280', items: open.filter(t => t.status === 'on_hold') },
        { title: 'Awaiting review', color: '#8B5CF6', items: open.filter(t => t.status === 'in_review') },
        { title: 'Completed yesterday', color: '#10B981', items: list.filter(t => t.status === 'completed' && t.completedAt && sameDay(new Date(t.completedAt), yesterday)) },
    ];
    const workload = people.map(([id, name]) => ({ id, name, count: open.filter(t => t.assignedTo === id).length })).sort((a, b) => b.count - a.count);
    const sel = 'border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm bg-white';

    return (
        <div className="p-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <h1 className="text-2xl font-semibold text-[#2B2B2B] mr-auto">Daily Standup · {today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</h1>
                <select id="standup-person" className={sel} value={person} onChange={e => setPerson(e.target.value)}>
                    <option value="">Everyone</option>{people.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
                </select>
                <select id="standup-tour" className={sel} value={tour} onChange={e => setTour(e.target.value)}>
                    <option value="">All tours</option>{tours.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
                </select>
                <Link href="/admin/tasks" className="text-sm text-[#D4AF37]">Task board →</Link>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {workload.map(w => (
                    <button key={w.id} onClick={() => setPerson(person === w.id ? '' : w.id)}
                        className={`px-3 py-1.5 rounded-full text-xs border ${person === w.id ? 'bg-[#D4AF37] text-white border-[#D4AF37]' : 'bg-white border-[#E5E7EB]'}`}>
                        {w.name} · {w.count} open
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-5 gap-4 mb-10">
                {columns.map(c => (
                    <div key={c.title} className="bg-[#FAF9F6] rounded-xl p-3 min-h-[240px]">
                        <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                            <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />{c.title}
                            <span className="ml-auto text-xs text-[#6B7280]">{c.items.length}</span>
                        </div>
                        <div className="space-y-2">
                            {c.items.map(t => (
                                <div key={t.id} className="bg-white rounded-lg border border-[#E5E7EB] p-3 text-sm">
                                    <div className="font-medium">{t.title}</div>
                                    <div className="text-xs text-[#6B7280]">{t.assignedToName} · {t.tourCode || 'General'}</div>
                                    {t.holdNote && t.status === 'on_hold' && <div className="text-xs text-amber-700 mt-1">“{t.holdNote}”</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <h2 className="text-lg font-semibold mb-3">Leaderboard</h2>
            <div className="bg-white rounded-xl border border-[#E5E7EB] divide-y divide-[#F3F4F6] max-w-2xl">
                {leaderboard.length === 0 && <div className="p-4 text-sm text-[#6B7280]">No completed tasks yet.</div>}
                {leaderboard.map((l, i) => (
                    <div key={l.userId} className="flex items-center gap-4 px-4 py-3 text-sm">
                        <span className="w-6 text-[#9CA3AF]">{i + 1}</span>
                        <span className="flex-1 font-medium">{l.userName}</span>
                        <span className="text-xs text-[#6B7280]">{l.tasksCompleted} done</span>
                        <span className="text-xs w-20 text-right">{l.pointsWeek} wk</span>
                        <span className="text-xs w-20 text-right font-semibold">{l.pointsMonth} mo</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
