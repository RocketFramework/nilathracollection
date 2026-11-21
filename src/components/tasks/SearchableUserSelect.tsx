'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import type { TaskUserOptionDTO } from '@/dtos/task.dto';

interface SearchableUserSelectProps {
    id?: string;
    users: TaskUserOptionDTO[];
    value: string;
    onChange: (userId: string) => void;
    placeholder?: string;
    allowEmpty?: boolean;
    emptyLabel?: string;
    className?: string;
}

export default function SearchableUserSelect({
    id,
    users,
    value,
    onChange,
    placeholder = 'Select user…',
    allowEmpty = false,
    emptyLabel = 'Everyone',
    className = 'w-full',
}: SearchableUserSelectProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selected = useMemo(
        () => users.find((u) => u.id === value) ?? null,
        [users, value]
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return users;
        return users.filter((u) =>
            u.name.toLowerCase().includes(q) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (u.role && u.role.toLowerCase().includes(q))
        );
    }, [users, query]);

    useEffect(() => {
        if (!open) return;
        const onMouseDown = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    useEffect(() => {
        if (open) {
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [open]);

    const selectUser = (userId: string) => {
        onChange(userId);
        setOpen(false);
        setQuery('');
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <button
                id={id}
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="w-full flex items-center justify-between gap-2 border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm bg-white text-left hover:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
            >
                <span className={`truncate ${selected ? 'text-[#2B2B2B]' : 'text-[#6B7280]'}`}>
                    {selected
                        ? `${selected.name}${selected.role ? ` (${selected.role})` : ''}`
                        : allowEmpty
                            ? emptyLabel
                            : placeholder}
                </span>
                <span className="flex items-center gap-1 shrink-0 text-[#6B7280]">
                    {allowEmpty && value && (
                        <span
                            role="button"
                            tabIndex={0}
                            aria-label="Clear selection"
                            onClick={(e) => {
                                e.stopPropagation();
                                selectUser('');
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    selectUser('');
                                }
                            }}
                            className="p-0.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700"
                        >
                            <X className="w-3.5 h-3.5" />
                        </span>
                    )}
                    <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                </span>
            </button>

            {open && (
                <div className="absolute left-0 right-0 mt-1 z-50 bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-hidden min-w-[240px]">
                    <div className="p-2 border-b border-[#E5E7EB] flex items-center gap-2 bg-[#FAF9F6]">
                        <Search className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search name, email, or role…"
                            className="w-full text-sm bg-transparent focus:outline-none text-[#2B2B2B] placeholder:text-[#9CA3AF]"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="text-neutral-400 hover:text-neutral-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                        {allowEmpty && !query.trim() && (
                            <button
                                type="button"
                                onClick={() => selectUser('')}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-[#FAF9F6] ${
                                    !value ? 'bg-[#FAF9F6] font-medium text-[#2B2B2B]' : 'text-[#6B7280]'
                                }`}
                            >
                                <span>{emptyLabel}</span>
                                {!value && <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />}
                            </button>
                        )}
                        {filtered.length === 0 ? (
                            <div className="px-3 py-4 text-xs text-center text-[#6B7280]">
                                No matching users
                            </div>
                        ) : (
                            filtered.map((u) => {
                                const isSelected = u.id === value;
                                const showEmail = u.email && u.email.toLowerCase() !== u.name.toLowerCase();
                                return (
                                    <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => selectUser(u.id)}
                                        className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between gap-2 hover:bg-[#FAF9F6] ${
                                            isSelected ? 'bg-[#FAF9F6]' : ''
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className={`truncate ${isSelected ? 'font-medium text-[#2B2B2B]' : 'text-[#2B2B2B]'}`}>
                                                    {u.name}
                                                </span>
                                                {u.role && (
                                                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 shrink-0">
                                                        {u.role}
                                                    </span>
                                                )}
                                            </div>
                                            {showEmail && (
                                                <div className="text-xs text-[#6B7280] truncate">{u.email}</div>
                                            )}
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
