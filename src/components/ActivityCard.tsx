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
    const [weatherInfo, setWeatherInfo] = useState<{
        temp: number;
        condition: string;
        bestTime: string;
    } | null>(null);

    // Fetch location images when popup opens, but fetch weather immediately
    useEffect(() => {
        if (!weatherInfo) {
            fetchWeatherInfo();
        }
        if (showPopup && images.length === 0) {
            fetchLocationImages();
        }
    }, [showPopup, images.length, weatherInfo]);

    const fetchLocationImages = async () => {
        setIsLoadingImages(true);
        setImageError(null);

        try {
            // Check if activity has images from the database
            if (activity.images && activity.images.length > 0) {
                const dbImages: LocationImage[] = activity.images.map(url => ({
                    url,
                    alt: activity.activity_name,
                    source: "Nilathra Collection"
                }));
                setImages(dbImages);
                return;
            }

            // Fallback: Using multiple image sources for redundancy
            const searchQuery = encodeURIComponent(`${activity.location_name} Sri Lanka landmark`);
            const demoImages = getDemoImages(activity.location_name);
            setImages(demoImages);
        } catch (error) {
            console.error("Error fetching images:", error);
            setImageError("Unable to load location images");
            // Fallback to placeholder images
            setImages(getFallbackImages(activity));
        } finally {
            setIsLoadingImages(false);
        }
    };

    const fetchWeatherInfo = async () => {
        try {
            // In production, use OpenWeatherMap API
            // const response = await fetch(
            //   `https://api.openweathermap.org/data/2.5/weather?lat=${activity.lat}&lon=${activity.lng}&appid=${process.env.WEATHER_API_KEY}&units=metric`
            // );
            // const data = await response.json();

            // Demo weather data
            const demoWeather = getDemoWeather(activity.location_name);
            setWeatherInfo(demoWeather);
        } catch (error) {
            console.error("Error fetching weather:", error);
        }
    };

    const getDemoImages = (location: string): LocationImage[] => {
        // Curated images for popular locations
        const imageMap: Record<string, LocationImage[]> = {
            "Sigiriya": [
                { url: "https://images.unsplash.com/photo-1589621316382-008455b857cd?w=800", alt: "Sigiriya Rock Fortress", source: "Unsplash" },
                { url: "https://images.unsplash.com/photo-1544731612-36b6c8a7b3e8?w=800", alt: "Sigiriya Frescoes", source: "Unsplash" },
                { url: "https://images.unsplash.com/photo-1566671018-7f7b2a0b8f0e?w=800", alt: "Sigiriya Lion Gate", source: "Unsplash" }
            ],
            "Kandy": [
                { url: "https://images.unsplash.com/photo-1590212894113-5c31f7c7f5f0?w=800", alt: "Temple of the Tooth", source: "Unsplash" },
                { url: "https://images.unsplash.com/photo-1566671018-7f7b2a0b8f0e?w=800", alt: "Kandy Lake", source: "Unsplash" },
                { url: "https://images.unsplash.com/photo-1589621316382-008455b857cd?w=800", alt: "Kandy Cultural Dance", source: "Unsplash" }
            ],
            "Ella": [
                { url: "https://images.unsplash.com/photo-1590212894113-5c31f7c7f5f0?w=800", alt: "Ella Gap", source: "Unsplash" },
                { url: "https://images.unsplash.com/photo-1589621316382-008455b857cd?w=800", alt: "Nine Arch Bridge", source: "Unsplash" },
                { url: "https://images.unsplash.com/photo-1566671018-7f7b2a0b8f0e?w=800", alt: "Little Adam's Peak", source: "Unsplash" }
            ],
            "Galle": [
                { url: "https://images.unsplash.com/photo-1590212894113-5c31f7c7f5f0?w=800", alt: "Galle Fort", source: "Unsplash" },
                { url: "https://images.unsplash.com/photo-1589621316382-008455b857cd?w=800", alt: "Galle Lighthouse", source: "Unsplash" },
                { url: "https://images.unsplash.com/photo-1566671018-7f7b2a0b8f0e?w=800", alt: "Dutch Colonial Architecture", source: "Unsplash" }
            ],
            "Mirissa": [
                { url: "https://images.unsplash.com/photo-1590212894113-5c31f7c7f5f0?w=800", alt: "Mirissa Beach", source: "Unsplash" },
                { url: "https://images.unsplash.com/photo-1589621316382-008455b857cd?w=800", alt: "Whale Watching Mirissa", source: "Unsplash" },
                { url: "https://images.unsplash.com/photo-1566671018-7f7b2a0b8f0e?w=800", alt: "Mirissa Sunset", source: "Unsplash" }
            ],
            "Colombo": [
                { url: "https://images.unsplash.com/photo-1590212894113-5c31f7c7f5f0?w=800", alt: "Colombo Skyline", source: "Unsplash" },
                { url: "https://images.unsplash.com/photo-1589621316382-008455b857cd?w=800", alt: "Galle Face Green", source: "Unsplash" },
                { url: "https://images.unsplash.com/photo-1566671018-7f7b2a0b8f0e?w=800", alt: "Colombo Fort", source: "Unsplash" }
            ],
            "Nuwara Eliya": [
                { url: "https://images.unsplash.com/photo-1590212894113-5c31f7c7f5f0?w=800", alt: "Nuwara Eliya Tea Plantations", source: "Unsplash" },
                { url: "https://images.unsplash.com/photo-1589621316382-008455b857cd?w=800", alt: "Gregory Lake", source: "Unsplash" },
                { url: "https://images.unsplash.com/photo-1566671018-7f7b2a0b8f0e?w=800", alt: "Nuwara Eliya Golf Club", source: "Unsplash" }
            ],
            "Anuradhapura": [
                { url: "https://images.unsplash.com/photo-1590212894113-5c31f7c7f5f0?w=800", alt: "Ruwanwelisaya Stupa", source: "Unsplash" },
                { url: "https://images.unsplash.com/photo-1589621316382-008455b857cd?w=800", alt: "Sri Maha Bodhi", source: "Unsplash" },
                { url: "https://images.unsplash.com/photo-1566671018-7f7b2a0b8f0e?w=800", alt: "Jetavanaramaya", source: "Unsplash" }
            ],
            "Polonnaruwa": [
                { url: "https://images.unsplash.com/photo-1590212894113-5c31f7c7f5f0?w=800", alt: "Gal Vihara", source: "Unsplash" },
                { url: "https://images.unsplash.com/photo-1589621316382-008455b857cd?w=800", alt: "Royal Palace", source: "Unsplash" },
                { url: "https://images.unsplash.com/photo-1566671018-7f7b2a0b8f0e?w=800", alt: "Polonnaruwa Ruins", source: "Unsplash" }
            ],
            "Yala": [
                { url: "https://images.unsplash.com/photo-1590212894113-5c31f7c7f5f0?w=800", alt: "Yala Leopard", source: "Unsplash" },
                { url: "https://images.unsplash.com/photo-1589621316382-008455b857cd?w=800", alt: "Yala Elephant", source: "Unsplash" },
                { url: "https://images.unsplash.com/photo-1566671018-7f7b2a0b8f0e?w=800", alt: "Yala Safari", source: "Unsplash" }
            ]
        };

        // Try to find images for this location
        for (const [key, value] of Object.entries(imageMap)) {
            if (location.includes(key) || activity.district.includes(key)) {
                return value;
            }
        }

        // Return generic Sri Lanka images if no specific match
        return [
            { url: "https://images.unsplash.com/photo-1590212894113-5c31f7c7f5f0?w=800", alt: "Sri Lanka Landscape", source: "Unsplash" },
            { url: "https://images.unsplash.com/photo-1589621316382-008455b857cd?w=800", alt: "Sri Lanka Nature", source: "Unsplash" },
            { url: "https://images.unsplash.com/photo-1566671018-7f7b2a0b8f0e?w=800", alt: "Sri Lanka Culture", source: "Unsplash" }
        ];
    };

    const getFallbackImages = (activity: Activity): LocationImage[] => {
        return [
            { url: `https://via.placeholder.com/800x600?text=${encodeURIComponent(activity.location_name)}`, alt: activity.location_name, source: "Placeholder" },
            { url: `https://via.placeholder.com/800x600?text=Sri+Lanka`, alt: "Sri Lanka", source: "Placeholder" }
        ];
    };

    const getDemoWeather = (location: string) => {
        const weatherMap: Record<string, { temp: number; condition: string; bestTime: string }> = {
            "Sigiriya": { temp: 28, condition: "Sunny", bestTime: "early morning (6:30-9:00 AM)" },
            "Kandy": { temp: 24, condition: "Partly Cloudy", bestTime: "morning (7:00-10:00 AM)" },
            "Ella": { temp: 22, condition: "Misty", bestTime: "sunrise (5:30-7:30 AM)" },
            "Galle": { temp: 29, condition: "Sunny", bestTime: "late afternoon (4:00-6:00 PM)" },
            "Mirissa": { temp: 30, condition: "Sunny", bestTime: "morning (6:00-9:00 AM)" },
            "Colombo": { temp: 31, condition: "Humid", bestTime: "evening (5:00-7:00 PM)" },
            "Nuwara Eliya": { temp: 18, condition: "Misty", bestTime: "morning (8:00-11:00 AM)" },
            "Anuradhapura": { temp: 32, condition: "Sunny", bestTime: "early morning (6:00-9:00 AM)" },
            "Polonnaruwa": { temp: 33, condition: "Sunny", bestTime: "early morning (6:30-10:00 AM)" },
            "Yala": { temp: 34, condition: "Sunny", bestTime: "early morning (5:30-9:00 AM)" }
        };

        for (const [key, value] of Object.entries(weatherMap)) {
            if (location.includes(key)) return value;
        }

        return { temp: 27, condition: "Sunny", bestTime: "morning (7:00-11:00 AM)" };
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const getWeatherIcon = (condition: string) => {
        switch (condition.toLowerCase()) {
            case 'sunny': return <Sun className="text-yellow-500" size={20} />;
            case 'partly cloudy': return <Cloud className="text-gray-500" size={20} />;
            case 'misty': return <Cloud className="text-gray-400" size={20} />;
            case 'humid': return <Cloud className="text-blue-400" size={20} />;
            case 'rainy': return <Umbrella className="text-blue-500" size={20} />;
            default: return <Sun className="text-yellow-500" size={20} />;
        }
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
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-brand-gold border-brand-gold text-white' : 'border-neutral-400'
                        }`}>
                        {isSelected && <Check size={12} />}
                    </div>
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
                            weatherInfo={weatherInfo}
                            onClose={() => setShowPopup(false)}
                            onNextImage={nextImage}
                            onPrevImage={prevImage}
                            getWeatherIcon={getWeatherIcon}
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
                className={`group relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full ${isSelected
                    ? 'border-brand-gold bg-brand-gold/5 shadow-[0_8px_30px_rgba(212,175,55,0.12)] -translate-y-1'
                    : 'border-neutral-200 bg-white hover:border-brand-gold/50 hover:shadow-md'
                    }`}
            >
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${isSelected
                        ? 'bg-brand-gold border-brand-gold text-white'
                        : 'border-neutral-300 text-transparent group-hover:border-brand-gold/50'
                        }`}>
                        <Check size={14} />
                    </div>
                </div>

                <h4 className={`font-serif text-lg mb-2 pr-16 ${isSelected ? 'text-brand-green' : 'text-neutral-800'
                    }`}>
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

                {/* Quick weather indicator */}
                {weatherInfo && (
                    <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center gap-1.5 text-xs text-neutral-400">
                        {getWeatherIcon(weatherInfo.condition)}
                        <span>{weatherInfo.temp}°C {weatherInfo.condition}</span>
                    </div>
                )}
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
                        weatherInfo={weatherInfo}
                        onClose={() => setShowPopup(false)}
                        onNextImage={nextImage}
                        onPrevImage={prevImage}
                        getWeatherIcon={getWeatherIcon}
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
    weatherInfo,
    onClose,
    onNextImage,
    onPrevImage,
    getWeatherIcon
}: {
    activity: Activity;
    isSelected: boolean;
    onToggle: (id: number) => void;
    images: LocationImage[];
    currentImageIndex: number;
    isLoadingImages: boolean;
    imageError: string | null;
    weatherInfo: { temp: number; condition: string; bestTime: string } | null;
    onClose: () => void;
    onNextImage: () => void;
    onPrevImage: () => void;
    getWeatherIcon: (condition: string) => React.JSX.Element;
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

                        {weatherInfo && (
                            <div className="bg-neutral-50 p-3 rounded-xl">
                                {getWeatherIcon(weatherInfo.condition)}
                                <p className="text-xs text-neutral-500 mt-1">Weather</p>
                                <p className="font-medium text-sm">{weatherInfo.temp}°C · {weatherInfo.condition}</p>
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

                    {/* Best time advice */}
                    {weatherInfo?.bestTime && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-blue-800 mb-1 flex items-center gap-2">
                                <Info size={16} />
                                Pro Tip
                            </h3>
                            <p className="text-sm text-blue-600">
                                Best experienced {weatherInfo.bestTime} for optimal conditions.
                            </p>
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