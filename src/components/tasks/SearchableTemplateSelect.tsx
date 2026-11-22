'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import type { TaskTemplateDTO } from '@/dtos/task.dto';
import { TASK_STEPS } from '@/types/types';

interface SearchableTemplateSelectProps {
    id?: string;
    templates: TaskTemplateDTO[];
    value: string;
    onChange: (templateId: string) => void;
    emptyLabel?: string;
    className?: string;
}

export default function SearchableTemplateSelect({
    id,
    templates,
    value,
    onChange,
    emptyLabel = 'Custom task…',
    className = 'w-full',
}: SearchableTemplateSelectProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const stepLabelByKey = useMemo(() => {
        const map: Record<string, string> = {};
        TASK_STEPS.forEach((s) => {
            map[s.key] = s.label;
        });
        return map;
    }, []);

    const selected = useMemo(
        () => templates.find((t) => t.id === value) ?? null,
        [templates, value]
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return templates;
        return templates.filter((t) => {
            const stepLabel = stepLabelByKey[t.stepKey] || t.stepKey;
            return (
                t.title.toLowerCase().includes(q) ||
                stepLabel.toLowerCase().includes(q) ||
                t.stepKey.toLowerCase().includes(q) ||
                (t.categoryName && t.categoryName.toLowerCase().includes(q)) ||
                (t.description && t.description.toLowerCase().includes(q))
            );
        });
    }, [templates, query, stepLabelByKey]);

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

    const selectTemplate = (templateId: string) => {
        onChange(templateId);
        setOpen(false);
        setQuery('');
    };

    const selectedLabel = selected
        ? `${stepLabelByKey[selected.stepKey] || selected.stepKey} — ${selected.title}`
        : emptyLabel;

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <button
                id={id}
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="w-full flex items-center justify-between gap-2 border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm bg-white text-left hover:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
            >
                <span className={`truncate ${selected ? 'text-[#2B2B2B]' : 'text-[#6B7280]'}`}>
                    {selectedLabel}
                </span>
                <span className="flex items-center gap-1 shrink-0 text-[#6B7280]">
                    {value && (
                        <span
                            role="button"
                            tabIndex={0}
                            aria-label="Clear task template"
                            onClick={(e) => {
                                e.stopPropagation();
                                selectTemplate('');
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    selectTemplate('');
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
                <div className="absolute left-0 right-0 mt-1 z-50 bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-[#E5E7EB] flex items-center gap-2 bg-[#FAF9F6]">
                        <Search className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search precoded tasks, steps, or categories…"
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
                    <div className="max-h-64 overflow-y-auto py-1">
                        {!query.trim() && (
                            <button
                                type="button"
                                onClick={() => selectTemplate('')}
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
                                No matching precoded tasks
                            </div>
                        ) : (
                            filtered.map((t) => {
                                const isSelected = t.id === value;
                                const stepLabel = stepLabelByKey[t.stepKey] || t.stepKey;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => selectTemplate(t.id)}
                                        className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between gap-2 hover:bg-[#FAF9F6] ${
                                            isSelected ? 'bg-[#FAF9F6]' : ''
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 shrink-0">
                                                    {stepLabel}
                                                </span>
                                                {t.categoryName && (
                                                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 shrink-0">
                                                        {t.categoryName}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`mt-0.5 truncate ${isSelected ? 'font-medium text-[#2B2B2B]' : 'text-[#2B2B2B]'}`}>
                                                {t.title}
                                            </div>
                                            {t.description && (
                                                <div className="text-xs text-[#6B7280] truncate">{t.description}</div>
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
