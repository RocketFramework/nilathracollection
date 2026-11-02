'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { addTaskCommentAction, listTaskCommentsAction, listTaskEventsAction, uploadTaskProofAction } from '@/actions/task.actions';
import type { TaskDTO, TaskCommentDTO, TaskEventDTO } from '@/dtos/task.dto';

export default function TaskDetailPanel({ task, onClose }: { task: TaskDTO; onClose: () => void }) {
    const [comments, setComments] = useState<TaskCommentDTO[]>([]);
    const [events, setEvents] = useState<TaskEventDTO[]>([]);
    const [body, setBody] = useState('');
    const [error, setError] = useState('');
    const [pending, start] = useTransition();
    const fileRef = useRef<HTMLInputElement>(null);

    const load = async () => {
        const [c, e] = await Promise.all([listTaskCommentsAction(task.id), listTaskEventsAction(task.id)]);
        setComments(c); setEvents(e);
    };
    useEffect(() => { load(); }, [task.id]);

    const send = (file?: File) => start(async () => {
        try {
            setError('');
            let url: string | null = null;
            if (file) { const fd = new FormData(); fd.append('file', file); url = await uploadTaskProofAction(fd); }
            if (!body.trim() && !url) return;
            await addTaskCommentAction(task.id, body.trim() || null, url);
            setBody(''); if (fileRef.current) fileRef.current.value = '';
            await load();
        } catch (e: any) { setError(e.message); }
    });

    return (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/30" onClick={onClose}>
            <div className="bg-white w-full sm:w-[440px] h-full p-5 overflow-y-auto space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between gap-3">
                    <div>
                        <h3 className="font-semibold text-neutral-800">{task.title}</h3>
                        <p className="text-xs text-neutral-500">#{task.taskNo} · {task.tourCode || 'General'} · {task.assignedToName} · <span className="capitalize">{task.status.replace('_', ' ')}</span></p>
                    </div>
                    <button onClick={onClose} className="text-neutral-400">✕</button>
                </div>
                {task.description && <p className="text-sm text-neutral-600">{task.description}</p>}
                {task.holdNote && task.status === 'on_hold' && <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-2">On hold: {task.holdNote}</p>}

                <section>
                    <h4 className="text-xs uppercase tracking-wider text-neutral-400 mb-2">Comments & proof</h4>
                    <div className="space-y-2">
                        {comments.length === 0 && <p className="text-xs text-neutral-400">No comments yet.</p>}
                        {comments.map(c => (
                            <div key={c.id} className="bg-neutral-50 rounded-lg p-3 text-sm">
                                <div className="text-xs text-neutral-500">{c.authorName} · {new Date(c.createdAt).toLocaleString()}</div>
                                {c.body && <p className="mt-1">{c.body}</p>}
                                {c.attachmentUrl && (/\.(png|jpe?g|webp|gif)$/i.test(c.attachmentUrl)
                                    ? <a href={c.attachmentUrl} target="_blank" rel="noreferrer"><img src={c.attachmentUrl} alt="Proof" className="mt-2 rounded-lg max-h-48" /></a>
                                    : <a href={c.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">Open attachment</a>)}
                            </div>
                        ))}
                    </div>
                    <textarea id="task-comment-body" className="w-full border border-neutral-200 rounded-lg p-2 text-sm mt-3" rows={2} placeholder="Add a comment…" value={body} onChange={e => setBody(e.target.value)} />
                    {error && <p className="text-xs text-red-600">{error}</p>}
                    <div className="flex gap-2 mt-2">
                        <input ref={fileRef} id="task-proof-file" type="file" accept="image/*,application/pdf" capture="environment" className="hidden"
                            onChange={e => e.target.files?.[0] && send(e.target.files[0])} />
                        <button type="button" disabled={pending} onClick={() => fileRef.current?.click()} className="flex-1 py-2 rounded-lg bg-neutral-100 text-xs font-medium">📷 Attach photo / file</button>
                        <button id="task-comment-send" disabled={pending || !body.trim()} onClick={() => send()} className="flex-1 py-2 rounded-lg bg-emerald-800 text-white text-xs font-medium disabled:opacity-50">Post</button>
                    </div>
                </section>

                <section>
                    <h4 className="text-xs uppercase tracking-wider text-neutral-400 mb-2">History</h4>
                    <ul className="space-y-1 text-xs text-neutral-600">
                        {events.map(e => (
                            <li key={e.id}>{new Date(e.createdAt).toLocaleString()} · {e.actorName} · {e.eventType.replace('_', ' ')}
                                {e.fromValue && e.toValue ? ` (${e.fromValue} → ${e.toValue})` : ''}{e.note ? ` — “${e.note}”` : ''}</li>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    );
}
