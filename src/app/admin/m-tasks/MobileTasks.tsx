'use client';

import { useEffect, useState, useTransition } from 'react';
import { listMyTasksAction, updateTaskStatusAction, savePushSubscriptionAction } from '@/actions/task.actions';
import TaskDetailPanel from '@/components/tasks/TaskDetailPanel';
import type { TaskDTO, TaskTourOptionDTO } from '@/dtos/task.dto';
import type { TaskStatus } from '@/types/types';

type Tab = 'pending' | 'hold' | 'done';

export default function MobileTasks({ initialTasks, tourOptions }: { initialTasks: TaskDTO[]; tourOptions: TaskTourOptionDTO[] }) {
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
        pending: inTour.filter(t => ['pending', 'in_progress', 'in_review'].includes(t.status)),
        hold: inTour.filter(t => t.status === 'on_hold'),
        done: inTour.filter(t => t.status === 'completed'),
    };
    const usedTours = tourOptions.filter(o => tasks.some(t => t.tourId === o.id));

    return (
        <div className="min-h-screen bg-[#F8F6F2] pb-8">
            <header className="sticky top-0 z-10 bg-[#D4AF37] text-white px-4 pt-5 pb-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold">My Tasks</h1>
                    {pushState === 'off' && <button id="m-enable-push" onClick={enablePush} className="text-xs bg-white/20 rounded-full px-3 py-1">Enable alerts</button>}
                    {pushState === 'on' && <span className="text-xs opacity-80">Alerts on</span>}
                </div>
                <div className="flex gap-2 mt-3 overflow-x-auto">
                    <button onClick={() => setTour('')} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${!tour ? 'bg-white text-[#8a6d12]' : 'bg-white/20'}`}>All tours</button>
                    {usedTours.map(o => (
                        <button key={o.id} onClick={() => setTour(o.id)} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${tour === o.id ? 'bg-white text-[#8a6d12]' : 'bg-white/20'}`}>{o.label}</button>
                    ))}
                </div>
                <div className="flex mt-3 text-sm">
                    {(['pending', 'hold', 'done'] as Tab[]).map(k => (
                        <button key={k} id={`m-tab-${k}`} onClick={() => setTab(k)} className={`flex-1 py-2 border-b-2 ${tab === k ? 'border-white font-semibold' : 'border-transparent opacity-70'}`}>
                            {k === 'pending' ? 'Pending' : k === 'hold' ? 'On hold' : 'Completed'} ({groups[k].length})
                        </button>
                    ))}
                </div>
            </header>

            <main className="p-4 space-y-3">
                {groups[tab].length === 0 && <p className="text-center text-sm text-neutral-500 pt-10">Nothing here.</p>}
                {groups[tab].map(t => (
                    <article key={t.id} className={`bg-white rounded-2xl p-4 shadow-sm border ${t.isOverdue ? 'border-red-300' : 'border-transparent'}`}>
                        <div className="flex justify-between gap-2">
                            <h2 className="font-medium text-sm" onClick={() => setDetail(t)}>{t.title} <span className="text-xs text-neutral-400">›</span></h2>
                            <span className="text-[10px] uppercase text-neutral-400">{t.priority}</span>
                        </div>
                        {t.description && <p className="text-xs text-neutral-500 mt-1">{t.description}</p>}
                        <p className="text-xs text-neutral-400 mt-1">{t.tourCode || 'General'}{t.dueAt && <span className={t.isOverdue ? 'text-red-600' : ''}> · due {new Date(t.dueAt).toLocaleDateString()}</span>}</p>
                        {t.status === 'on_hold' && t.holdNote && <p className="text-xs text-amber-700 mt-1">“{t.holdNote}”</p>}
                        {t.status !== 'completed' && (
                            <div className="flex gap-2 mt-3">
                                {t.status === 'pending' && <button disabled={pending} onClick={() => act(t, 'in_progress')} className="flex-1 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-medium">Start</button>}
                                {t.status !== 'on_hold' && <button onClick={() => setHoldFor(t)} className="flex-1 py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-medium">Hold</button>}
                                {t.status === 'on_hold' && <button disabled={pending} onClick={() => act(t, 'in_progress')} className="flex-1 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-medium">Resume</button>}
                                {t.requiresReview && t.status !== 'in_review'
                                    ? <button disabled={pending} onClick={() => act(t, 'in_review')} className="flex-1 py-2 rounded-xl bg-purple-50 text-purple-700 text-xs font-medium">Send for review</button>
                                    : !t.requiresReview && <button disabled={pending} onClick={() => act(t, 'completed')} className="flex-1 py-2 rounded-xl bg-green-600 text-white text-xs font-medium">Done</button>}
                            </div>
                        )}
                    </article>
                ))}
            </main>

            {detail && <TaskDetailPanel task={detail} onClose={() => setDetail(null)} />}

            {holdFor && (
                <div className="fixed inset-0 bg-black/40 flex items-end z-20" onClick={() => setHoldFor(null)}>
                    <div className="bg-white w-full rounded-t-3xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
                        <h3 className="font-semibold text-sm">Put on hold: {holdFor.title}</h3>
                        <textarea id="m-hold-note" className="w-full border rounded-xl p-3 text-sm" rows={3} placeholder="Reason (required)" value={note} onChange={e => setNote(e.target.value)} />
                        <button disabled={pending || !note.trim()} onClick={() => act(holdFor, 'on_hold', note)} className="w-full py-3 rounded-xl bg-amber-500 text-white text-sm font-medium disabled:opacity-50">Confirm hold</button>
                    </div>
                </div>
            )}
        </div>
    );
}
