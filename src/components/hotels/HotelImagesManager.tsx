'use client';

import React, { useRef, useState } from 'react';
import { Building2, Loader2, Plus, Star, Trash2 } from 'lucide-react';
import type { HotelImageDTO } from '@/dtos/tour-planning.dto';
import {
    deleteHotelImageAction,
    setPrimaryHotelImageAction,
    uploadAndAddHotelImageAction,
} from '@/actions/hotel-image.actions';

interface HotelImagesManagerProps {
    hotelId: string;
    images: HotelImageDTO[];
    onChange: (nextImages: HotelImageDTO[]) => void;
    editable?: boolean;
    compact?: boolean;
}

const MAX_IMAGES = 3;

export default function HotelImagesManager({
    hotelId,
    images,
    onChange,
    editable = true,
    compact = false,
}: HotelImagesManagerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const remainingSlots = Math.max(MAX_IMAGES - images.length, 0);

    const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if (files.length === 0) return;

        setError('');
        setBusy(true);
        try {
            let latest = images;
            const toUpload = files.slice(0, remainingSlots);
            for (const file of toUpload) {
                const fd = new FormData();
                fd.append('file', file);
                const res = await uploadAndAddHotelImageAction(hotelId, fd);
                if (!res.success || !res.data) {
                    setError(res.error || 'Failed to upload image.');
                    break;
                }
                latest = res.data;
                onChange(latest);
            }
        } catch (err: any) {
            setError(err?.message || 'Error uploading image.');
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async (imageId: string) => {
        setError('');
        setBusy(true);
        try {
            const res = await deleteHotelImageAction(hotelId, imageId);
            if (res.success && res.data) {
                onChange(res.data);
            } else {
                setError(res.error || 'Failed to delete image.');
            }
        } finally {
            setBusy(false);
        }
    };

    const handleSetPrimary = async (imageId: string) => {
        setError('');
        setBusy(true);
        try {
            const res = await setPrimaryHotelImageAction(hotelId, imageId);
            if (res.success && res.data) {
                onChange(res.data);
            } else {
                setError(res.error || 'Failed to update primary image.');
            }
        } finally {
            setBusy(false);
        }
    };

    const thumbClass = compact ? 'w-20 h-16' : 'w-28 h-22 sm:w-32 sm:h-24';

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
                {images.map((img) => (
                    <div
                        key={img.id}
                        className={`relative ${thumbClass} rounded-xl overflow-hidden border bg-neutral-100 shrink-0 group ${
                            img.is_primary ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-neutral-200'
                        }`}
                    >
                        <img
                            src={img.image_url}
                            alt="Hotel"
                            className="w-full h-full object-cover"
                        />
                        {img.is_primary && (
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-emerald-800/90 text-white text-[8px] font-bold uppercase tracking-wider">
                                Primary
                            </span>
                        )}
                        {editable && (
                            <div className="absolute top-1 right-1 flex items-center gap-1">
                                {!img.is_primary && (
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => handleSetPrimary(img.id)}
                                        title="Set as Primary Image"
                                        className="p-1 rounded-full bg-black/60 hover:bg-amber-500 text-white transition-colors"
                                    >
                                        <Star className="w-3 h-3" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => handleDelete(img.id)}
                                    title="Remove Image"
                                    className="p-1 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {images.length === 0 && !editable && (
                    <div className={`${thumbClass} rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-300`}>
                        <Building2 className="w-5 h-5" />
                    </div>
                )}

                {editable && remainingSlots > 0 && (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple={remainingSlots > 1}
                            onChange={handleFilesSelected}
                            className="hidden"
                        />
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => fileInputRef.current?.click()}
                            className={`${thumbClass} rounded-xl border border-dashed border-neutral-300 hover:border-emerald-700 hover:bg-emerald-50/40 flex flex-col items-center justify-center gap-1 text-neutral-500 hover:text-emerald-800 transition-colors shrink-0 disabled:opacity-50`}
                            title="Upload hotel photo (auto-converted to WebP, up to 3 images)"
                        >
                            {busy ? (
                                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    <span className="text-[9px] font-bold uppercase tracking-wide">
                                        Add ({images.length}/{MAX_IMAGES})
                                    </span>
                                </>
                            )}
                        </button>
                    </>
                )}
            </div>

            {error && (
                <p className="text-[11px] font-semibold text-rose-600">{error}</p>
            )}
        </div>
    );
}
