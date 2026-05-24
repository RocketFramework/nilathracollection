'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { getMyNotificationsAction } from '@/actions/notification.actions';

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const res = await getMyNotificationsAction();
                if (res.success && res.data) {
                    const count = res.data.filter((n: any) => n.status === 'unread').length;
                    setUnreadCount(count);
                }
            } catch (err) {
                console.error('Failed to fetch notifications', err);
            }
        };
        fetchNotifs();
        // Optional: Polling every 60s
        const interval = setInterval(fetchNotifs, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Link href="/admin/notifications" className="relative p-2 text-[#4B5563] hover:text-[#2B2B2B] transition-colors rounded-full hover:bg-[#F5F3EF]">
            <Bell size={20} />
            {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </Link>
    );
}
