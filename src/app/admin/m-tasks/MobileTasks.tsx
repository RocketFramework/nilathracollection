'use client';

import { useEffect, useState, useTransition } from 'react';
import { listMyTasksAction, updateTaskStatusAction, savePushSubscriptionAction } from '@/actions/task.actions';
import { logoutAction } from '@/app/actions/auth';
import TaskDetailPanel from '@/components/tasks/TaskDetailPanel';
import type { TaskDTO, TaskTourOptionDTO } from '@/dtos/task.dto';
import type { TaskStatus } from '@/types/types';

type Tab = 'pending' | 'hold' | 'delayed' | 'done';

const TAB_CONFIG: Record<Tab, { label: string; active: string; inactive: string; activeCount: string; inactiveCount: string }> = {
    pending: {
        label: 'Pending',
        active: 'bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-300/60 font-semibold',
        inactive: 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/25 hover:bg-emerald-500/25',
        activeCount: 'bg-emerald-950/25 text-white',
        inactiveCount: 'bg-emerald-500/25 text-emerald-100',
    },
    hold: {
        label: 'On hold',
        active: 'bg-amber-400 text-slate-950 shadow-sm ring-1 ring-amber-200/80 font-semibold',
        inactive: 'bg-amber-400/15 text-amber-200 border border-amber-300/25 hover:bg-amber-400/25',
        activeCount: 'bg-slate-950/15 text-slate-950',
        inactiveCount: 'bg-amber-400/25 text-amber-100',
    },
    delayed: {
        label: 'Delayed',
        active: 'bg-red-600 text-white shadow-sm ring-1 ring-red-300/80 font-semibold',
        inactive: 'bg-red-600/25 text-red-200 border border-red-400/40 hover:bg-red-600/35',
        activeCount: 'bg-red-950/30 text-white',
        inactiveCount: 'bg-red-600/40 text-red-100',
    },
    done: {
        label: 'Completed',
        active: 'bg-slate-400 text-slate-950 shadow-sm ring-1 ring-slate-200/70 font-semibold',
        inactive: 'bg-slate-400/15 text-slate-300 border border-slate-300/25 hover:bg-slate-400/25',
        activeCount: 'bg-slate-950/15 text-slate-950',
        inactiveCount: 'bg-slate-400/25 text-slate-200',
    },
};

const PRIORITY_STYLES: Record<string, string> = {
    urgent: 'bg-rose-100 text-rose-700 border border-rose-200',
    high: 'bg-orange-100 text-orange-700 border border-orange-200',
    medium: 'bg-amber-100 text-amber-800 border border-amber-200',
    low: 'bg-slate-100 text-slate-600 border border-slate-200',
};

const STATUS_META: Record<TaskStatus, { label: string; badge: string; accent: string }> = {
    pending: {
        label: 'Pending',
        badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        accent: 'border-l-emerald-500 border-emerald-100 bg-white',
    },
    in_progress: {
        label: 'In progress',
        badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        accent: 'border-l-emerald-500 border-emerald-100 bg-white',
    },
    in_review: {
        label: 'In review',
        badge: 'bg-violet-100 text-violet-700 border border-violet-200',
        accent: 'border-l-emerald-500 border-violet-100 bg-white',
    },
    on_hold: {
        label: 'On hold',
        badge: 'bg-amber-100 text-amber-800 border border-amber-200',
        accent: 'border-l-amber-400 border-amber-200/80 bg-amber-50/25',
    },
    completed: {
        label: 'Completed',
        badge: 'bg-slate-200 text-slate-700 border border-slate-300',
        accent: 'border-l-slate-400 border-slate-200 bg-slate-50/70',
    },
    cancelled: {
        label: 'Cancelled',
        badge: 'bg-slate-100 text-slate-500 border border-slate-200',
        accent: 'border-l-slate-300 border-slate-200 bg-slate-50/50',
    },
};

export default function MobileTasks({ initialTasks, tourOptions, userName }: { initialTasks: TaskDTO[]; tourOptions: TaskTourOptionDTO[]; userName: string }) {
    const [tasks, setTasks] = useState(initialTasks);
    const [tab, setTab] = useState<Tab>('pending');
    const [tour, setTour] = useState('');
    const [holdFor, setHoldFor] = useState<TaskDTO | null>(null);
    const [note, setNote] = useState('');
    const [detail, setDetail] = useState<TaskDTO | null>(null);
    const [pending, start] = useTransition();

    useEffect(() => { if ('serviceWorker' in navigator) navigator.serviceWorker.register('/tasks-sw.js').catch(() => {}); }, []);

    const [pushState, setPushState] = useState<'unknown' | 'on' | 'off' | 'unsupported'>('unknown');
    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) { setPushState('unsupported'); return; }
        navigator.serviceWorker.ready.then(r => r.pushManager.getSubscription()).then(s => setPushState(s ? 'on' : 'off'));
    }, []);
    const enablePush = async () => {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') return;
        const reg = await navigator.serviceWorker.ready;
        const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
        const pad = '='.repeat((4 - (key.length % 4)) % 4);
        const raw = atob((key + pad).replace(/-/g, '+').replace(/_/g, '/'));
        const appKey = Uint8Array.from(raw, c => c.charCodeAt(0));
        const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey });
        const j = sub.toJSON();
        await savePushSubscriptionAction({ endpoint: sub.endpoint, p256dh: j.keys!.p256dh, auth: j.keys!.auth }, navigator.userAgent);
        setPushState('on');
    };

    const reload = async () => setTasks(await listMyTasksAction());
    const act = (t: TaskDTO, s: TaskStatus, n?: string) => start(async () => {
        try { await updateTaskStatusAction(t.id, s, n); setHoldFor(null); setNote(''); await reload(); } catch (e: any) { alert(e.message); }
    });

    const inTour = tasks.filter(t => !tour || t.tourId === tour);
    const groups: Record<Tab, TaskDTO[]> = {
        pending: inTour.filter(t => ['pending', 'in_progress', 'in_review'].includes(t.status) && !t.isOverdue),
        hold: inTour.filter(t => t.status === 'on_hold'),
        delayed: inTour.filter(t => t.isOverdue && t.status !== 'completed' && t.status !== 'cancelled'),
        done: inTour.filter(t => t.status === 'completed'),
    };
    const usedTours = tourOptions.filter(o => tasks.some(t => t.tourId === o.id));

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#F5F2EB] to-[#ECEAE2] pb-10 text-slate-800">
            <header className="sticky top-0 z-10 bg-gradient-to-br from-[#0F2421] via-[#13302B] to-[#1B3F37] text-white px-4 pt-5 pb-3 shadow-lg">
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="inline-block h-2 w-2 rounded-full bg-[#E8C868] shadow-[0_0_8px_rgba(232,200,104,0.8)]" />
                            <h1 className="text-lg font-semibold tracking-tight text-white">My Tasks</h1>
                        </div>
                        <p id="m-user-name" className="text-xs text-[#E8C868] font-medium truncate mt-0.5">{userName}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {pushState === 'off' && (
                            <button id="m-enable-push" onClick={enablePush} className="text-xs bg-[#D4AF37]/20 text-[#F4DC8B] border border-[#D4AF37]/40 hover:bg-[#D4AF37]/30 transition-colors rounded-full px-3 py-1 font-medium">
                                Enable alerts
                            </button>
                        )}
                        {pushState === 'on' && (
                            <span className="text-xs bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-full px-2.5 py-1 font-medium">
                                Alerts on
                            </span>
                        )}
                        <form action={logoutAction}>
                            <button id="m-logout" type="submit" className="text-xs bg-white/10 hover:bg-white/20 text-white/90 border border-white/15 transition-colors rounded-full px-3 py-1 font-medium">
                                Log out
                            </button>
                        </form>
                    </div>
                </div>
                <div className="flex gap-2 mt-3.5 overflow-x-auto pb-1 no-scrollbar">
                    <button
                        onClick={() => setTour('')}
                        className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all ${!tour ? 'bg-[#D4AF37] text-[#102420] font-semibold shadow-sm' : 'bg-white/10 text-white/85 border border-white/10 hover:bg-white/15'}`}
                    >
                        All tours
                    </button>
                    {usedTours.map(o => (
                        <button
                            key={o.id}
                            onClick={() => setTour(o.id)}
                            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all ${tour === o.id ? 'bg-[#D4AF37] text-[#102420] font-semibold shadow-sm' : 'bg-white/10 text-white/85 border border-white/10 hover:bg-white/15'}`}
                        >
                            {o.label}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-4 gap-1.5 mt-3 text-xs">
                    {(['pending', 'hold', 'delayed', 'done'] as Tab[]).map(k => {
                        const cfg = TAB_CONFIG[k];
                        const isActive = tab === k;
                        return (
                            <button
                                key={k}
                                id={`m-tab-${k}`}
                                onClick={() => setTab(k)}
                                className={`py-2 px-1.5 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${isActive ? cfg.active : cfg.inactive}`}
                            >
                                <span className="truncate">{cfg.label}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none font-semibold ${isActive ? cfg.activeCount : cfg.inactiveCount}`}>
                                    {groups[k].length}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </header>

            <main className="p-4 space-y-3 max-w-2xl mx-auto">
                {groups[tab].length === 0 && (
                    <div className="text-center py-12 px-6 bg-white/70 rounded-2xl border border-stone-200/70">
                        <p className="text-sm font-medium text-stone-500">Nothing here.</p>
                    </div>
                )}
                {groups[tab].map(t => {
                    const statusStyle = STATUS_META[t.status] ?? STATUS_META.pending;
                    const priorityStyle = PRIORITY_STYLES[t.priority] ?? PRIORITY_STYLES.low;
                    const isDelayed = t.isOverdue && t.status !== 'completed' && t.status !== 'cancelled';
                    const cardAccent = isDelayed
                        ? 'border-l-red-600 border-red-300 bg-red-50/50'
                        : statusStyle.accent;

                    return (
                        <article key={t.id} className={`rounded-2xl p-4 shadow-sm border border-l-4 transition-shadow hover:shadow-md ${cardAccent}`}>
                            <div className="flex items-start justify-between gap-2">
                                <h2 className="font-semibold text-sm text-slate-900 leading-snug cursor-pointer hover:text-[#13302B]" onClick={() => setDetail(t)}>
                                    {t.title} <span className="text-xs text-[#B68F1E] ml-0.5">›</span>
                                </h2>
                                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${priorityStyle}`}>
                                    {t.priority}
                                </span>
                            </div>
                            {t.description && <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{t.description}</p>}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px]">
                                <span className="bg-[#13302B]/10 text-[#13302B] font-medium px-2 py-0.5 rounded-md">
                                    {t.tourCode || 'General'}
                                </span>
                                {isDelayed ? (
                                    <span className="px-2 py-0.5 rounded-md font-semibold bg-red-600 text-white">
                                        Delayed
                                    </span>
                                ) : (
                                    <span className={`px-2 py-0.5 rounded-md font-medium ${statusStyle.badge}`}>
                                        {statusStyle.label}
                                    </span>
                                )}
                                {t.dueAt && (
                                    <span className={isDelayed
                                        ? 'bg-red-100 text-red-700 border border-red-200 font-semibold px-2 py-0.5 rounded-md'
                                        : 'text-slate-500 px-1'}>
                                        due {new Date(t.dueAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            {t.status === 'on_hold' && t.holdNote && (
                                <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-2 mt-2.5">
                                    “{t.holdNote}”
                                </p>
                            )}
                            {t.status !== 'completed' && (
                                <div className="flex gap-2 mt-3.5">
                                    {t.status === 'pending' && (
                                        <button disabled={pending} onClick={() => act(t, 'in_progress')} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50">
                                            Start
                                        </button>
                                    )}
                                    {t.status !== 'on_hold' && (
                                        <button onClick={() => setHoldFor(t)} className="flex-1 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-colors">
                                            Hold
                                        </button>
                                    )}
                                    {t.status === 'on_hold' && (
                                        <button disabled={pending} onClick={() => act(t, 'in_progress')} className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50">
                                            Resume
                                        </button>
                                    )}
                                    {t.requiresReview && t.status !== 'in_review'
                                        ? (
                                            <button disabled={pending} onClick={() => act(t, 'in_review')} className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50">
                                                Send for review
                                            </button>
                                        )
                                        : !t.requiresReview && (
                                            <button disabled={pending} onClick={() => act(t, 'completed')} className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50">
                                                Done
                                            </button>
                                        )}
                                </div>
                            )}
                        </article>
                    );
                })}
            </main>

            {detail && <TaskDetailPanel task={detail} onClose={() => setDetail(null)} />}

            {holdFor && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px] flex items-end z-20" onClick={() => setHoldFor(null)}>
                    <div className="bg-white w-full rounded-t-3xl p-5 space-y-3 shadow-2xl border-t border-amber-200/70" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                            <h3 className="font-semibold text-sm text-slate-900">Put on hold: {holdFor.title}</h3>
                        </div>
                        <textarea
                            id="m-hold-note"
                            className="w-full border border-stone-200 rounded-xl p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                            rows={3}
                            placeholder="Reason (required)"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                        />
                        <button
                            disabled={pending || !note.trim()}
                            onClick={() => act(holdFor, 'on_hold', note)}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-semibold shadow-md transition-all disabled:opacity-50"
                        >
                            Confirm hold
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
