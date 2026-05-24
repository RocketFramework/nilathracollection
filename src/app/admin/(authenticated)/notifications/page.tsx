'use client'

import { useState, useEffect } from 'react';
import { getMyNotificationsAction, markNotificationAsReadAction, deleteNotificationAction } from '@/actions/notification.actions';
import { Bell, Check, Clock, ExternalLink, Trash2 } from 'lucide-react';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');
    const [maxExpectedDays, setMaxExpectedDays] = useState<string>('');
    const [showOverdue, setShowOverdue] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const res = await getMyNotificationsAction();
            if (res.success) {
                setNotifications(res.data || []);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await markNotificationAsReadAction(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    };

    const deleteNotification = async (id: string) => {
        if (!confirm('Are you sure you want to delete this notification?')) return;
        try {
            await deleteNotificationAction(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Failed to delete notification', err);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filterStatus !== 'all' && n.status !== filterStatus) return false;

        const actionDate = new Date(n.action_date);
        const dueDate = new Date(actionDate);
        dueDate.setDate(dueDate.getDate() + (n.action_duration || 0));
        
        const now = new Date();
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (showOverdue && diffDays >= 0) return false; // Show only overdue (diffDays < 0)
        
        if (maxExpectedDays !== '') {
            const maxDays = parseInt(maxExpectedDays, 10);
            if (!isNaN(maxDays) && diffDays > maxDays) return false;
        }

        return true;
    });

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-3 border-b border-neutral-200 pb-4">
                <Bell size={28} className="text-brand-gold" />
                <h1 className="text-3xl font-serif text-brand-charcoal">Notification Center</h1>
            </div>

            <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm items-end">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Status Filter</label>
                    <select 
                        value={filterStatus} 
                        onChange={(e: any) => setFilterStatus(e.target.value)}
                        className="text-sm bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 outline-none"
                    >
                        <option value="all">All Notifications</option>
                        <option value="unread">Unread Only</option>
                        <option value="read">Read Only</option>
                    </select>
                </div>
                
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Expected in (Days)</label>
                    <input 
                        type="number" 
                        placeholder="Max days..." 
                        value={maxExpectedDays}
                        onChange={e => setMaxExpectedDays(e.target.value)}
                        className="text-sm w-32 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 pb-2">
                    <input 
                        type="checkbox" 
                        id="overdue" 
                        checked={showOverdue} 
                        onChange={e => setShowOverdue(e.target.checked)} 
                        className="w-4 h-4 rounded text-brand-gold focus:ring-brand-gold"
                    />
                    <label htmlFor="overdue" className="text-sm font-bold text-red-600 cursor-pointer">Overdue Only</label>
                </div>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-12 text-neutral-500">Loading notifications...</div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500 bg-white rounded-xl border border-neutral-200 border-dashed">
                        No notifications match your filters.
                    </div>
                ) : (
                    filteredNotifications.map((n) => {
                        const actionDate = new Date(n.action_date);
                        const dueDate = new Date(actionDate);
                        dueDate.setDate(dueDate.getDate() + (n.action_duration || 0));
                        const isOverdue = new Date() > dueDate;

                        return (
                            <div key={n.id} className={`p-4 md:p-6 bg-white rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-all ${n.status === 'unread' ? 'border-brand-gold/50 bg-brand-gold/5' : 'border-neutral-200'}`}>
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-3">
                                        {n.status === 'unread' && <div className="w-2 h-2 rounded-full bg-brand-gold" />}
                                        <h3 className="font-bold text-brand-charcoal text-base">{n.action_description}</h3>
                                        {isOverdue ? (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 uppercase tracking-wide">Overdue</span>
                                        ) : (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700 uppercase tracking-wide">On Track</span>
                                        )}
                                    </div>
                                    {n.action_waiting && (
                                        <div className="flex items-start gap-2 text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                                            <Clock size={16} className="mt-0.5 shrink-0 text-brand-gold" />
                                            <span><strong>Waiting on:</strong> {n.action_waiting}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-neutral-400 font-medium pt-1">
                                        <span>Sent: {actionDate.toLocaleString()}</span>
                                        <span>Due: {dueDate.toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    {n.action_page && (
                                        <a href={n.action_page} className="flex items-center gap-1.5 px-4 py-2 bg-neutral-100 text-neutral-600 hover:bg-neutral-200 text-xs font-bold rounded-lg transition-colors">
                                            <ExternalLink size={14} />
                                            View Details
                                        </a>
                                    )}
                                    {n.status === 'unread' && (
                                        <button 
                                            onClick={() => markAsRead(n.id)}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-brand-charcoal text-white hover:bg-black text-xs font-bold rounded-lg transition-colors"
                                        >
                                            <Check size={14} />
                                            Mark as Read
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => deleteNotification(n.id)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold rounded-lg transition-colors"
                                        title="Delete Notification"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
