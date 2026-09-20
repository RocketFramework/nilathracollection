"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, MapPin, Clock, Calendar, Check, Plus, Trash2, ArrowRight, Compass, Sparkles, Filter } from "lucide-react";
import MultiActivityBookingModal from "./components/MultiActivityBookingModal";

interface Activity {
    id: number;
    activity_name: string;
    category: string;
    location_name: string;
    district: string;
    lat?: number | null;
    lng?: number | null;
    description: string;
    duration_hours: number;
    optimal_start_time?: string | null;
    optimal_end_time?: string | null;
    time_flexible?: boolean;
}

interface ActivitiesCatalogClientProps {
    initialActivities: Activity[];
}

export default function ActivitiesCatalogClient({ initialActivities }: ActivitiesCatalogClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedDistrict, setSelectedDistrict] = useState("all");

    // Basket state
    const [selectedActivities, setSelectedActivities] = useState<Activity[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Extract unique categories and districts for filtering
    const categories = useMemo(() => {
        const set = new Set<string>();
        initialActivities.forEach(a => {
            if (a.category) set.add(a.category.trim());
        });
        return Array.from(set).sort();
    }, [initialActivities]);

    const districts = useMemo(() => {
        const set = new Set<string>();
        initialActivities.forEach(a => {
            if (a.district) set.add(a.district.trim());
        });
        return Array.from(set).sort();
    }, [initialActivities]);

    // Filter activities
    const filteredActivities = useMemo(() => {
        return initialActivities.filter(act => {
            const matchesCategory = selectedCategory === "all" || act.category.toLowerCase().includes(selectedCategory.toLowerCase());
            const matchesDistrict = selectedDistrict === "all" || act.district === selectedDistrict;

            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q || (
                act.activity_name.toLowerCase().includes(q) ||
                act.location_name.toLowerCase().includes(q) ||
                act.description.toLowerCase().includes(q) ||
                act.district.toLowerCase().includes(q) ||
                act.category.toLowerCase().includes(q)
            );

            return matchesCategory && matchesDistrict && matchesSearch;
        });
    }, [initialActivities, selectedCategory, selectedDistrict, searchQuery]);

    const toggleSelectActivity = (act: Activity) => {
        setSelectedActivities(prev => {
            const exists = prev.some(a => a.id === act.id);
            if (exists) {
                return prev.filter(a => a.id !== act.id);
            } else {
                return [...prev, act];
            }
        });
    };

    const isSelected = (actId: number) => {
        return selectedActivities.some(a => a.id === actId);
    };

    return (
        <div className="min-h-screen bg-[#FAF8F5] pb-24">

            {/* Hero Header */}
            <header className="relative bg-brand-green text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="max-w-7xl mx-auto relative z-10">

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="max-w-3xl">
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-brand-gold/20 text-brand-gold border border-brand-gold/30 mb-4">
                                <Sparkles size={14} /> Handpicked Sri Lankan Experiences
                            </span>
                            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white leading-tight">
                                Curated Activity Collection
                            </h1>
                            <p className="mt-4 text-base sm:text-lg text-white/80 max-w-2xl leading-relaxed">
                                Select one or multiple experiences from across Sri Lanka. Submit your booking request directly online and our specialist team will confirm availability and your final price quote.
                            </p>
                        </div>

                        <Link
                            href="/tourist"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium text-sm transition-all border border-white/20 self-start md:self-auto"
                        >
                            <span>Go to Tourist Portal</span> <ArrowRight size={16} />
                        </Link>
                    </div>

                    {/* Filter & Search Controls */}
                    <div className="mt-10 bg-white rounded-3xl p-4 sm:p-6 shadow-xl border border-neutral-100 text-brand-charcoal grid grid-cols-1 md:grid-cols-12 gap-4 items-center">

                        {/* Search Input */}
                        <div className="md:col-span-5 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search activities, wildlife, location, or district..."
                                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-brand-gold text-sm"
                            />
                        </div>

                        {/* Category Dropdown */}
                        <div className="md:col-span-4 relative">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-brand-gold text-sm appearance-none cursor-pointer"
                            >
                                <option value="all">All Categories ({categories.length})</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={16} />
                        </div>

                        {/* District Dropdown */}
                        <div className="md:col-span-3 relative">
                            <select
                                value={selectedDistrict}
                                onChange={(e) => setSelectedDistrict(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-brand-gold text-sm appearance-none cursor-pointer"
                            >
                                <option value="all">All Districts ({districts.length})</option>
                                {districts.map(dist => (
                                    <option key={dist} value={dist}>{dist}</option>
                                ))}
                            </select>
                            <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={16} />
                        </div>

                    </div>
                </div>
            </header>

            {/* Catalog Grid Section */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Category Pills Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
                    <button
                        onClick={() => setSelectedCategory("all")}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${selectedCategory === "all"
                            ? "bg-brand-green text-white shadow-md"
                            : "bg-white text-neutral-600 border border-neutral-200 hover:border-brand-gold"
                            }`}
                    >
                        All Experiences ({initialActivities.length})
                    </button>
                    {categories.slice(0, 8).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${selectedCategory === cat
                                ? "bg-brand-green text-white shadow-md"
                                : "bg-white text-neutral-600 border border-neutral-200 hover:border-brand-gold"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Results Count Bar */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-sm font-medium text-neutral-500">
                        Showing <strong className="text-brand-charcoal">{filteredActivities.length}</strong> activity experiences
                    </p>
                    {selectedActivities.length > 0 && (
                        <button
                            onClick={() => setSelectedActivities([])}
                            className="text-xs text-red-600 hover:underline flex items-center gap-1 font-medium"
                        >
                            <Trash2 size={13} /> Clear Basket ({selectedActivities.length})
                        </button>
                    )}
                </div>

                {/* Empty State */}
                {filteredActivities.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-neutral-200 max-w-lg mx-auto my-12 shadow-sm">
                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400 mb-4">
                            <Compass size={32} />
                        </div>
                        <h3 className="text-xl font-bold font-serif text-brand-charcoal mb-2">No matching activities found</h3>
                        <p className="text-neutral-500 text-sm mb-6">
                            Try adjusting your search filters, selecting a different district, or searching for broader terms.
                        </p>
                        <button
                            onClick={() => { setSearchQuery(""); setSelectedCategory("all"); setSelectedDistrict("all"); }}
                            className="px-6 py-2.5 bg-brand-gold text-white font-bold text-xs rounded-xl hover:bg-brand-gold/90 transition-colors"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    /* Grid of Cards */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredActivities.map(act => {
                            const active = isSelected(act.id);

                            return (
                                <div
                                    key={act.id}
                                    className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between group ${active
                                        ? "border-brand-gold shadow-lg ring-2 ring-brand-gold/20"
                                        : "border-neutral-200 hover:border-brand-gold/50 hover:shadow-md"
                                        }`}
                                >
                                    {/* Card Header Content */}
                                    <div className="p-6 sm:p-7">
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <span className="px-3 py-1 bg-brand-gold/10 text-brand-gold font-bold text-[10px] uppercase tracking-widest rounded-full border border-brand-gold/20">
                                                {act.category}
                                            </span>
                                            <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1">
                                                <MapPin size={13} className="text-brand-gold" /> {act.district}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-serif font-bold text-brand-charcoal group-hover:text-brand-green transition-colors leading-snug">
                                            {act.activity_name}
                                        </h3>

                                        <p className="text-xs font-medium text-neutral-400 mt-1 mb-4 flex items-center gap-1">
                                            <span>{act.location_name}</span>
                                        </p>

                                        <p className="text-sm text-neutral-600 line-clamp-3 leading-relaxed mb-6">
                                            {act.description}
                                        </p>

                                        {/* Metadata Badges */}
                                        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-neutral-100 text-xs font-medium text-neutral-500">
                                            <span className="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1 rounded-lg border border-neutral-100">
                                                <Clock size={13} className="text-brand-gold" /> {act.duration_hours} Hours
                                            </span>
                                            {act.optimal_start_time && (
                                                <span className="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1 rounded-lg border border-neutral-100">
                                                    <Calendar size={13} className="text-brand-gold" /> Start: {act.optimal_start_time}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Action Footer */}
                                    <div className="p-6 pt-0">
                                        <button
                                            onClick={() => toggleSelectActivity(act)}
                                            className={`w-full py-3 px-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${active
                                                ? "bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
                                                : "bg-brand-green text-white hover:bg-brand-green/90 shadow-sm hover:shadow"
                                                }`}
                                        >
                                            {active ? (
                                                <>
                                                    <Check size={16} /> Selected in Request Basket
                                                </>
                                            ) : (
                                                <>
                                                    <Plus size={16} /> Add to Booking Request
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Floating Selection Basket Drawer Bar */}
            {selectedActivities.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4 animate-in slide-in-from-bottom-6 duration-300">
                    <div className="bg-brand-green text-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-brand-gold/30 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="w-11 h-11 rounded-2xl bg-brand-gold text-white font-bold flex items-center justify-center text-lg shadow-md flex-shrink-0">
                                {selectedActivities.length}
                            </div>
                            <div className="overflow-hidden">
                                <h4 className="font-serif font-bold text-base leading-tight">
                                    {selectedActivities.length} Activity Experience{selectedActivities.length > 1 ? 's' : ''} Selected
                                </h4>
                                <p className="text-xs text-white/70 truncate max-w-md">
                                    {selectedActivities.map(a => a.activity_name).join(', ')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <button
                                onClick={() => setSelectedActivities([])}
                                className="px-4 py-2.5 text-xs font-semibold text-white/70 hover:text-white transition-colors"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-6 py-3 bg-brand-gold text-white font-bold text-sm rounded-2xl hover:bg-brand-gold/90 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 whitespace-nowrap"
                            >
                                Configure & Submit Request <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Multi-Activity Booking Modal */}
            <MultiActivityBookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedActivities={selectedActivities}
                onClearSelection={() => setSelectedActivities([])}
            />
        </div>
    );
}
