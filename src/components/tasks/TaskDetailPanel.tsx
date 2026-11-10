'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { addTaskCommentAction, listTaskCommentsAction, listTaskEventsAction, uploadTaskProofAction } from '@/actions/task.actions';
import type { TaskDTO, TaskCommentDTO, TaskEventDTO } from '@/dtos/task.dto';
import { TASK_STEPS } from '@/types/types';
import {
    X,
    Calendar,
    User,
    Briefcase,
    Award,
    AlertTriangle,
    Camera,
    Send,
    Clock,
    MessageSquare,
    History,
    ExternalLink,
    CheckCircle2,
    PauseCircle,
} from 'lucide-react';

const PRIORITY_STYLES: Record<string, string> = {
    urgent: 'bg-rose-100 text-rose-800 border-rose-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-amber-50 text-amber-800 border-amber-200',
    low: 'bg-slate-100 text-slate-700 border-slate-200',
};

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-700 border-slate-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    on_hold: 'bg-amber-50 text-amber-800 border-amber-200',
    in_review: 'bg-purple-50 text-purple-700 border-purple-200',
    completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

export default function TaskDetailPanel({ task, onClose }: { task: TaskDTO; onClose: () => void }) {
    const [comments, setComments] = useState<TaskCommentDTO[]>([]);
    const [events, setEvents] = useState<TaskEventDTO[]>([]);
    const [body, setBody] = useState('');
    const [error, setError] = useState('');
    const [pending, start] = useTransition();
    const fileRef = useRef<HTMLInputElement>(null);

    const load = async () => {
        const [c, e] = await Promise.all([listTaskCommentsAction(task.id), listTaskEventsAction(task.id)]);
        setComments(c);
        setEvents(e);
    };
    useEffect(() => {
        load();
    }, [task.id]);

    const send = (file?: File) =>
        start(async () => {
            try {
                setError('');
                let url: string | null = null;
                if (file) {
                    const fd = new FormData();
                    fd.append('file', file);
                    url = await uploadTaskProofAction(fd);
                }
                if (!body.trim() && !url) return;
                await addTaskCommentAction(task.id, body.trim() || null, url);
                setBody('');
                if (fileRef.current) fileRef.current.value = '';
                await load();
            } catch (e: any) {
                setError(e.message);
            }
        });

    const stepLabel = TASK_STEPS.find(s => s.key === task.stepKey)?.label || task.stepKey;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-stretch justify-end bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onClose}
        >
            <div
                className="bg-[#FAF9F6] w-full sm:w-[480px] h-[90vh] sm:h-full rounded-t-3xl sm:rounded-none flex flex-col shadow-2xl border-l border-[#E5E7EB] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#2B2B2B] to-[#3A3528] text-white px-6 py-5 shrink-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-white/15 text-[#D4AF37] font-mono text-xs font-bold">
                                    #{task.taskNo}
                                </span>
                                <span
                                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${
                                        STATUS_STYLES[task.status] || STATUS_STYLES.pending
                                    }`}
                                >
                                    {task.status.replace('_', ' ')}
                                </span>
                                <span
                                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${
                                        PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
                                    }`}
                                >
                                    {task.priority}
                                </span>
                                {task.points > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#F5D76E] text-[11px] font-semibold">
                                        <Award className="w-3 h-3" /> +{task.points} pts
                                    </span>
                                )}
                            </div>
                            <h3 className="font-semibold text-base sm:text-lg leading-snug text-white">{task.title}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition"
                            aria-label="Close panel"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Task Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3 bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs">
                        <div className="flex items-start gap-2.5">
                            <div className="p-2 rounded-xl bg-[#FAF9F6] text-[#8A6D12]">
                                <Briefcase className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">Tour / Scope</span>
                                <span className="text-xs font-semibold text-[#2B2B2B] truncate block">
                                    {task.tourCode ? `${task.tourCode}${task.tourTitle ? ` · ${task.tourTitle}` : ''}` : 'General Operations'}
                                </span>
                                <span className="text-[11px] text-neutral-500">{stepLabel}</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                            <div className="p-2 rounded-xl bg-[#FAF9F6] text-[#8A6D12]">
                                <User className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">Assigned To</span>
                                <span className="text-xs font-semibold text-[#2B2B2B] truncate block">{task.assignedToName}</span>
                                <span className="text-[11px] text-neutral-500 truncate block">By {task.assignedByName}</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5 col-span-2 pt-2 border-t border-neutral-100">
                            <div className={`p-2 rounded-xl ${task.isOverdue ? 'bg-rose-50 text-rose-600' : 'bg-[#FAF9F6] text-[#8A6D12]'}`}>
                                <Calendar className="w-4 h-4" />
                            </div>
                            <div className="flex-1 flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">Due Date</span>
                                    <span className={`text-xs font-semibold ${task.isOverdue ? 'text-rose-600' : 'text-[#2B2B2B]'}`}>
                                        {task.dueAt
                                            ? new Date(task.dueAt).toLocaleDateString('en-GB', {
                                                  day: '2-digit',
                                                  month: 'short',
                                                  year: 'numeric',
                                              })
                                            : 'No due date set'}
                                    </span>
                                </div>
                                {task.isOverdue && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold">
                                        <AlertTriangle className="w-3.5 h-3.5" /> Overdue
                                    </span>
                                )}
                                {task.completedAt && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Done {new Date(task.completedAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description & Hold Notice */}
                    {task.description && (
                        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB]">
                            <h4 className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1.5">Task Instructions</h4>
                            <p className="text-sm text-neutral-700 whitespace-pre-line leading-relaxed">{task.description}</p>
                        </div>
                    )}

                    {task.holdNote && task.status === 'on_hold' && (
                        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
                            <PauseCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-semibold block text-xs uppercase tracking-wider text-amber-800">Task On Hold</span>
                                <p className="mt-0.5">{task.holdNote}</p>
                            </div>
                        </div>
                    )}

                    {/* Comments & Proof Section */}
                    <section className="bg-white rounded-2xl p-4 border border-[#E5E7EB] space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs uppercase tracking-wider text-neutral-500 font-bold flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" /> Comments &amp; Proof ({comments.length})
                            </h4>
                        </div>

                        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                            {comments.length === 0 && (
                                <p className="text-xs text-neutral-400 text-center py-4 bg-[#FAF9F6] rounded-xl">
                                    No comments or proof files uploaded yet.
                                </p>
                            )}
                            {comments.map(c => (
                                <div key={c.id} className="bg-[#FAF9F6] border border-[#E5E7EB] rounded-xl p-3 text-sm space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                                        <span className="font-semibold text-[#2B2B2B]">{c.authorName}</span>
                                        <span>{new Date(c.createdAt).toLocaleString()}</span>
                                    </div>
                                    {c.body && <p className="text-neutral-700 leading-snug">{c.body}</p>}
                                    {c.attachmentUrl &&
                                        (/\.(png|jpe?g|webp|gif)$/i.test(c.attachmentUrl) ? (
                                            <a href={c.attachmentUrl} target="_blank" rel="noreferrer" className="block pt-1">
                                                <img
                                                    src={c.attachmentUrl}
                                                    alt="Proof"
                                                    className="rounded-lg max-h-48 border border-neutral-200 object-cover"
                                                />
                                            </a>
                                        ) : (
                                            <a
                                                href={c.attachmentUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-xs font-medium text-[#8A6D12] hover:underline pt-1"
                                            >
                                                <ExternalLink className="w-3 h-3" /> Open uploaded document
                                            </a>
                                        ))}
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 border-t border-neutral-100 space-y-2">
                            <textarea
                                id="task-comment-body"
                                className="w-full border border-[#E5E7EB] bg-[#FAF9F6] focus:bg-white rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#D4AF37]/40 transition"
                                rows={2}
                                placeholder="Write an update or note…"
                                value={body}
                                onChange={e => setBody(e.target.value)}
                            />
                            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
                            <div className="flex gap-2">
                                <input
                                    ref={fileRef}
                                    id="task-proof-file"
                                    type="file"
                                    accept="image/*,application/pdf"
                                    capture="environment"
                                    className="hidden"
                                    onChange={e => e.target.files?.[0] && send(e.target.files[0])}
                                />
                                <button
                                    type="button"
                                    disabled={pending}
                                    onClick={() => fileRef.current?.click()}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#E5E7EB] bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition"
                                >
                                    <Camera className="w-3.5 h-3.5 text-[#D4AF37]" /> Attach Proof
                                </button>
                                <button
                                    id="task-comment-send"
                                    disabled={pending || !body.trim()}
                                    onClick={() => send()}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#2B2B2B] hover:bg-black text-white text-xs font-semibold disabled:opacity-40 transition"
                                >
                                    <Send className="w-3.5 h-3.5 text-[#D4AF37]" /> Post Update
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Activity History */}
                    <section className="bg-white rounded-2xl p-4 border border-[#E5E7EB]">
                        <h4 className="text-xs uppercase tracking-wider text-neutral-500 font-bold mb-3 flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-[#D4AF37]" /> Activity Log
                        </h4>
                        {events.length === 0 ? (
                            <p className="text-xs text-neutral-400">No events recorded yet.</p>
                        ) : (
                            <ul className="relative border-l-2 border-[#E5E7EB] ml-2 space-y-3">
                                {events.map(e => (
                                    <li key={e.id} className="pl-4 relative text-xs text-neutral-600">
                                        <span className="w-2 h-2 rounded-full bg-[#D4AF37] absolute -left-[5px] top-1.5" />
                                        <div className="font-medium text-[#2B2B2B]">
                                            {e.actorName} <span className="font-normal text-neutral-500">&middot; {e.eventType.replace('_', ' ')}</span>
                                            {e.fromValue && e.toValue ? (
                                                <span className="font-mono text-[11px] text-[#8A6D12]">
                                                    {' '}
                                                    ({e.fromValue} &rarr; {e.toValue})
                                                </span>
                                            ) : (
                                                ''
                                            )}
                                        </div>
                                        {e.note && <p className="text-amber-800 italic mt-0.5">“{e.note}”</p>}
                                        <span className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                                            <Clock className="w-2.5 h-2.5" /> {new Date(e.createdAt).toLocaleString()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
