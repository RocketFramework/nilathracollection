'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Building2, ChevronLeft, ChevronRight, Loader2, Plus, Star, Trash2, X } from 'lucide-react';
import type { HotelImageDTO } from '@/dtos/tour-planning.dto';
import {
    deleteHotelImageAction,
    setPrimaryHotelImageAction,
    uploadAndAddHotelImageAction,
} from '@/actions/hotel-image.actions';

interface HotelImagesManagerProps {
    hotelId: string;
    hotelName?: string;
    images: HotelImageDTO[];
    onChange: (nextImages: HotelImageDTO[]) => void;
    editable?: boolean;
    compact?: boolean;
}

const MAX_IMAGES = 3;

export default function HotelImagesManager({
    hotelId,
    hotelName,
    images,
    onChange,
    editable = true,
    compact = false,
}: HotelImagesManagerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const remainingSlots = Math.max(MAX_IMAGES - images.length, 0);

    useEffect(() => {
        if (lightboxIndex === null) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setLightboxIndex(null);
            } else if (e.key === 'ArrowRight' && images.length > 1) {
                setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % images.length));
            } else if (e.key === 'ArrowLeft' && images.length > 1) {
                setLightboxIndex((prev) => (prev === null ? null : (prev - 1 + images.length) % images.length));
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [lightboxIndex, images.length]);

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
    const activeLightboxImg = lightboxIndex !== null ? images[lightboxIndex] : null;

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
                {images.map((img, idx) => (
                    <div
                        key={img.id}
                        className={`relative ${thumbClass} rounded-xl overflow-hidden border bg-neutral-100 shrink-0 group ${
                            img.is_primary ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-neutral-200'
                        }`}
                    >
                        <button
                            type="button"
                            onClick={() => setLightboxIndex(idx)}
                            className="w-full h-full block focus:outline-none cursor-zoom-in"
                            title="Click to enlarge"
                        >
                            <img
                                src={img.image_url}
                                alt={hotelName ? `${hotelName} photo ${idx + 1}` : `Hotel photo ${idx + 1}`}
                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                        </button>
                        {img.is_primary && (
                            <span className="pointer-events-none absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-emerald-800/90 text-white text-[8px] font-bold uppercase tracking-wider">
                                Primary
                            </span>
                        )}
                        {editable && (
                            <div className="absolute top-1 right-1 flex items-center gap-1">
                                {!img.is_primary && (
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSetPrimary(img.id);
                                        }}
                                        title="Set as Primary Image"
                                        className="p-1 rounded-full bg-black/60 hover:bg-amber-500 text-white transition-colors"
                                    >
                                        <Star className="w-3 h-3" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(img.id);
                                    }}
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

            {/* Enlarged Lightbox Gallery Modal (view all up to 3 images) */}
            {activeLightboxImg && lightboxIndex !== null && (
                <div
                    className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-150"
                    onClick={() => setLightboxIndex(null)}
                >
                    {/* Top Bar */}
                    <div
                        className="w-full max-w-4xl flex items-center justify-between gap-3 text-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="min-w-0">
                            <h4 className="text-sm sm:text-base font-serif font-bold truncate">
                                {hotelName || 'Hotel Gallery'}
                            </h4>
                            <p className="text-[11px] text-white/70 font-medium">
                                Photo {lightboxIndex + 1} of {images.length}
                                {activeLightboxImg.is_primary ? ' · Primary Photo' : ''}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setLightboxIndex(null)}
                            aria-label="Close image viewer"
                            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Main Enlarged Image + Prev/Next */}
                    <div
                        className="relative w-full max-w-4xl flex-1 flex items-center justify-center my-3 min-h-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {images.length > 1 && (
                            <button
                                type="button"
                                onClick={() => setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)}
                                aria-label="Previous image"
                                className="absolute left-1 sm:left-3 z-10 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/20 transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        )}

                        <img
                            src={activeLightboxImg.image_url}
                            alt={hotelName ? `${hotelName} photo ${lightboxIndex + 1}` : `Hotel photo ${lightboxIndex + 1}`}
                            className="max-h-[68vh] max-w-full object-contain rounded-2xl shadow-2xl"
                        />

                        {images.length > 1 && (
                            <button
                                type="button"
                                onClick={() => setLightboxIndex((lightboxIndex + 1) % images.length)}
                                aria-label="Next image"
                                className="absolute right-1 sm:right-3 z-10 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/20 transition-colors"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        )}
                    </div>

                    {/* Bottom Thumbnail Strip (all up to 3 images) */}
                    {images.length > 1 && (
                        <div
                            className="flex items-center justify-center gap-2.5 pb-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {images.map((thumb, idx) => (
                                <button
                                    key={thumb.id}
                                    type="button"
                                    onClick={() => setLightboxIndex(idx)}
                                    className={`relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden border-2 transition-all ${
                                        idx === lightboxIndex
                                            ? 'border-amber-400 scale-105 shadow-lg'
                                            : 'border-white/20 opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    <img
                                        src={thumb.image_url}
                                        alt={`Thumbnail ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
