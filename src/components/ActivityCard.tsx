// components/ActivityCard.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock,
    MapPin,
    Info,
    X,
    ImageIcon,
    ExternalLink,
    Sun,
    Cloud,
    Umbrella,
    Star,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Check  // ← This was missing!
} from "lucide-react";
import { Activity } from "@/data/activities";

interface ActivityCardProps {
    activity: Activity;
    isSelected: boolean;
    onToggle: (id: number) => void;
    variant?: 'grid' | 'list' | 'compact';
}

interface LocationImage {
    url: string;
    alt: string;
    source: string;
    credit?: string;
}

export default function ActivityCard({
    activity,
    isSelected,
    onToggle,
    variant = 'grid'
}: ActivityCardProps) {
    const [showPopup, setShowPopup] = useState(false);
    const [images, setImages] = useState<LocationImage[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLoadingImages, setIsLoadingImages] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);

    // Fetch location images when popup opens
    useEffect(() => {
        if (showPopup && images.length === 0) {
            fetchLocationImages();
        }
    }, [showPopup, images.length]);

    const fetchLocationImages = async () => {
        setIsLoadingImages(true);
        setImageError(null);

        try {
            if (activity.images && activity.images.length > 0) {
                const dbImages: LocationImage[] = activity.images.map((url, i) => ({
                    url,
                    alt: `${activity.activity_name} - Image ${i + 1}`,
                    source: "Nilathra Collection"
                }));
                setImages(dbImages);
                return;
            }

            setImageError("No images available for this activity.");
        } catch (error) {
            console.error("Error formatting images:", error);
            setImageError("Unable to load location images.");
        } finally {
            setIsLoadingImages(false);
        }
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    // Card variants
    if (variant === 'compact') {
        return (
            <div className="relative">
                <button
                    onClick={() => onToggle(activity.id)}
                    className={`w-full p-3 rounded-lg border transition-all flex items-center gap-3 ${isSelected
                        ? 'border-brand-gold bg-brand-gold/5'
                        : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                >
                    <div className={`w-5 h-5 flex-shrink-0 rounded-full border flex items-center justify-center ${isSelected ? 'bg-brand-gold border-brand-gold text-white' : 'border-neutral-400'
                        }`}>
                        {isSelected && <Check size={12} />}
                    </div>
                    {activity.images && activity.images.length > 0 && (
                        <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-neutral-100">
                            <img src={activity.images[0]} alt={activity.activity_name} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <span className="text-sm truncate flex-1 text-left">{activity.activity_name}</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowPopup(true);
                        }}
                        className="text-neutral-400 hover:text-brand-gold transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-neutral-50"
                        title="View more details about this activity"
                    >
                        <Info size={14} />
                        <span className="text-xs font-medium">Details</span>
                    </button>
                </button>

                {/* Popup modal */}
                <AnimatePresence>
                    {showPopup && (
                        <PopupContent
                            activity={activity}
                            isSelected={isSelected}
                            onToggle={onToggle}
                            images={images}
                            currentImageIndex={currentImageIndex}
                            isLoadingImages={isLoadingImages}
                            imageError={imageError}
                            onClose={() => setShowPopup(false)}
                            onNextImage={nextImage}
                            onPrevImage={prevImage}
                        />
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Default grid view
    return (
        <>
            <div
                onClick={() => onToggle(activity.id)}
                className={`group relative rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full bg-white ${isSelected
                    ? 'border-brand-gold shadow-[0_8px_30px_rgba(212,175,55,0.12)] -translate-y-1'
                    : 'border-neutral-200 hover:border-brand-gold/50 hover:shadow-md'
                    }`}
            >
                {activity.images && activity.images.length > 0 ? (
                    <div className="relative h-48 w-full overflow-hidden bg-neutral-100 flex-shrink-0">
                        <img src={activity.images[0]} alt={activity.activity_name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                        <div className="absolute top-4 left-4 px-2.5 py-1 bg-black/40 backdrop-blur-md rounded text-white text-[10px] font-medium uppercase tracking-wider">
                            {activity.category}
                        </div>
                    </div>
                ) : (
                    <div className="relative h-12 w-full bg-brand-green/5 flex items-end px-5 pb-2 flex-shrink-0">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-brand-green/60">{activity.category}</span>
                    </div>
                )}

                <div className={`absolute top-4 right-4 z-10 flex items-center gap-2 ${activity.images && activity.images.length > 0 ? '' : 'top-3 right-3'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors shadow-sm ${isSelected
                        ? 'bg-brand-gold border-brand-gold text-white'
                        : activity.images && activity.images.length > 0
                            ? 'bg-white/20 border-white/50 text-transparent backdrop-blur-md group-hover:border-white/80'
                            : 'border-neutral-300 bg-white text-transparent group-hover:border-brand-gold/50'
                        }`}>
                        <Check size={14} />
                    </div>
                </div>

                <div className={`p-5 flex flex-col flex-1 ${isSelected && (!activity.images || activity.images.length === 0) ? 'bg-brand-gold/5' : ''}`}>
                    <h4 className={`font-serif text-lg mb-2 pr-8 ${isSelected ? 'text-brand-green' : 'text-neutral-800'}`}>
                        {activity.activity_name}
                    </h4>

                    <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed mb-4">
                        {activity.description}
                    </p>

                    <div className="flex items-center justify-between gap-1.5 mt-auto">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowPopup(true);
                            }}
                            className="px-3 py-1.5 rounded-full bg-brand-green/5 hover:bg-brand-green/10 border border-brand-green/20 text-brand-green flex items-center gap-1.5 text-xs font-semibold transition-all flex-shrink-0 shadow-sm"
                            title="View more details about this activity"
                        >
                            <Info size={14} />
                            <span>Details</span>
                        </button>

                        <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 overflow-hidden justify-end">
                            <span className="flex items-center gap-1 bg-neutral-100 px-1.5 py-1 rounded-md whitespace-nowrap flex-shrink-0">
                                <Clock size={12} /> {activity.duration_hours}h
                            </span>
                            <span className="flex items-center gap-1 bg-neutral-100 px-1.5 py-1 rounded-md max-w-[85px] w-[85px] line-clamp-1" title={activity.location_name}>
                                <MapPin size={12} className="flex-shrink-0" />
                                <span className="truncate">{activity.location_name}</span>
                            </span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Popup modal for grid view */}
            <AnimatePresence>
                {showPopup && (
                    <PopupContent
                        activity={activity}
                        isSelected={isSelected}
                        onToggle={onToggle}
                        images={images}
                        currentImageIndex={currentImageIndex}
                        isLoadingImages={isLoadingImages}
                        imageError={imageError}
                        onClose={() => setShowPopup(false)}
                        onNextImage={nextImage}
                        onPrevImage={prevImage}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

// Popup Content Component
function PopupContent({
    activity,
    isSelected,
    onToggle,
    images,
    currentImageIndex,
    isLoadingImages,
    imageError,
    onClose,
    onNextImage,
    onPrevImage
}: {
    activity: Activity;
    isSelected: boolean;
    onToggle: (id: number) => void;
    images: LocationImage[];
    currentImageIndex: number;
    isLoadingImages: boolean;
    imageError: string | null;
    onClose: () => void;
    onNextImage: () => void;
    onPrevImage: () => void;
}) {
    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Prevent body scroll when popup is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Image Gallery Section */}
                <div className="relative h-72 md:h-96 bg-neutral-900">
                    {isLoadingImages ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
                            <div className="text-center">
                                <Loader2 className="animate-spin mx-auto mb-3 text-brand-gold" size={32} />
                                <p className="text-sm text-neutral-500">Loading location images...</p>
                            </div>
                        </div>
                    ) : imageError ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
                            <div className="text-center text-neutral-400">
                                <ImageIcon size={40} className="mx-auto mb-3 opacity-50" />
                                <p className="text-sm">{imageError}</p>
                            </div>
                        </div>
                    ) : images.length > 0 ? (
                        <>
                            <img
                                src={images[currentImageIndex].url}
                                alt={images[currentImageIndex].alt}
                                className="w-full h-full object-cover"
                            />

                            {/* Image navigation */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={onPrevImage}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={onNextImage}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </>
                            )}

                            {/* Image counter and source */}
                            <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                                {currentImageIndex + 1} / {images.length} · {images[currentImageIndex].source}
                            </div>

                            {/* Attribution if needed */}
                            {images[currentImageIndex].credit && (
                                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                                    Photo: {images[currentImageIndex].credit}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
                            <div className="text-center text-neutral-400">
                                <ImageIcon size={40} className="mx-auto mb-3 opacity-50" />
                                <p className="text-sm">No images available</p>
                            </div>
                        </div>
                    )}

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors backdrop-blur-sm"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content Section */}
                <div className="p-6">
                    {/* Title and category */}
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-serif text-brand-green mb-1">
                                {activity.activity_name}
                            </h2>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="px-2 py-1 bg-brand-gold/10 text-brand-gold rounded-full text-xs">
                                    {activity.category}
                                </span>
                                <span className="text-neutral-400">·</span>
                                <span className="text-neutral-500">{activity.district}</span>
                            </div>
                        </div>

                        {/* Rating placeholder */}
                        <div className="flex items-center gap-1 text-yellow-500">
                            <Star size={16} fill="currentColor" />
                            <Star size={16} fill="currentColor" />
                            <Star size={16} fill="currentColor" />
                            <Star size={16} fill="currentColor" />
                            <Star size={16} fill="currentColor" className="text-neutral-300" />
                            <span className="text-sm text-neutral-500 ml-1">4.0</span>
                        </div>
                    </div>

                    {/* Quick info grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <div className="bg-neutral-50 p-3 rounded-xl">
                            <Clock size={16} className="text-brand-gold mb-1" />
                            <p className="text-xs text-neutral-500">Duration</p>
                            <p className="font-medium">{activity.duration_hours} hours</p>
                        </div>

                        <div className="bg-neutral-50 p-3 rounded-xl">
                            <MapPin size={16} className="text-brand-gold mb-1" />
                            <p className="text-xs text-neutral-500">Location</p>
                            <p className="font-medium text-sm truncate">{activity.location_name}</p>
                        </div>

                        {activity.optimal_start_time && (
                            <div className="bg-neutral-50 p-3 rounded-xl">
                                <Clock size={16} className="text-green-600 mb-1" />
                                <p className="text-xs text-neutral-500">Best Time</p>
                                <p className="font-medium text-sm">{activity.optimal_start_time}</p>
                            </div>
                        )}

                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-neutral-700 mb-2">About this experience</h3>
                        <p className="text-sm text-neutral-600 leading-relaxed">
                            {activity.description}
                        </p>
                    </div>

                    {/* Location info */}
                    {activity.lat && activity.lng && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-neutral-700 mb-2">Location</h3>
                            <div className="bg-neutral-50 p-3 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-neutral-400" />
                                    <span className="text-sm text-neutral-600">
                                        {activity.lat.toFixed(4)}°, {activity.lng.toFixed(4)}°
                                    </span>
                                </div>
                                <a
                                    href={`https://www.google.com/maps?q=${activity.lat},${activity.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-brand-gold hover:text-brand-gold/80 text-sm flex items-center gap-1"
                                >
                                    View on Maps <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3 mt-6 pt-4 border-t border-neutral-100">
                        <button
                            onClick={() => {
                                onClose();
                                onToggle(activity.id);
                            }}
                            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${isSelected
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-brand-gold hover:bg-brand-gold/90 text-white'
                                }`}
                        >
                            {isSelected ? 'Remove from Itinerary' : 'Add to Itinerary'}
                        </button>
                        <button
                            onClick={() => {
                                // Share functionality
                                if (navigator.share) {
                                    navigator.share({
                                        title: activity.activity_name,
                                        text: activity.description,
                                        url: window.location.href,
                                    });
                                } else {
                                    // Fallback - copy to clipboard
                                    navigator.clipboard.writeText(
                                        `${activity.activity_name}\n${activity.description}`
                                    );
                                    alert('Link copied to clipboard!');
                                }
                            }}
                            className="px-4 py-3 border border-neutral-200 rounded-xl text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
                        >
                            Share
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}