"use client";

import MainLayout from "@/components/layout/MainLayout";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin, Check, Sparkles, Navigation, CalendarDays,
    Compass, Utensils, BedDouble, Sun, Clock, Plus, AlertCircle,
    Train, Info, AlertTriangle, ChevronDown, ChevronUp, BrainCircuit
} from "lucide-react";
import { activities, Activity } from "@/data/activities";
// Updated Import: Ensure this matches your export name from the engine
import { generateRoutePlan, ItineraryEvent, RoutePlan, GeoLocation } from "@/lib/route-engine";

export default function CustomPlanPage() {
    const [step, setStep] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState<string>("Adventure");
    const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
    const [selectedOptionalLocations, setSelectedOptionalLocations] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [showAllConflicts, setShowAllConflicts] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [travelers, setTravelers] = useState("2");

    const [routeResult, setRouteResult] = useState<RoutePlan | null>(null);

    // ... (toggleActivity and locations logic remains the same) ...
    const categories = useMemo(() => Array.from(new Set(activities.map(a => a.category))), []);
    const toggleActivity = (id: number) => {
        setSelectedActivities(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const mandatoryLocationsMap = useMemo(() => {
        const locations = new Map<string, GeoLocation>(); // Use GeoLocation here
        selectedActivities.forEach(id => {
            const act = activities.find(a => a.id === id);
            if (act && act.lat && act.lng) {
                const key = `${act.lat.toFixed(3)},${act.lng.toFixed(3)}`;
                if (!locations.has(key)) {
                    locations.set(key, {
                        lat: act.lat,
                        lng: act.lng,
                        name: `${act.location_name}, ${act.district}`
                    });
                }
            }
        });
        return locations;
    }, [selectedActivities]);

    const mandatoryLocations = Array.from(mandatoryLocationsMap.values());

    const allLocationsMap = useMemo(() => {
        const locations = new Map<string, GeoLocation>(); // Use GeoLocation here
        activities.forEach(act => {
            if (act.lat && act.lng) {
                const key = `${act.lat.toFixed(3)},${act.lng.toFixed(3)}`;
                locations.set(key, {
                    lat: act.lat,
                    lng: act.lng,
                    name: `${act.location_name}, ${act.district}`
                });
            }
        });
        return locations;
    }, []);

    const optionalLocations = useMemo(() => {
        return Array.from(allLocationsMap.entries())
            .filter(([key]) => !mandatoryLocationsMap.has(key))
            .map(([_, loc]) => loc)
            .slice(0, 12); // Limit for neatness
    }, [allLocationsMap, mandatoryLocationsMap]);

    const toggleOptionalLocation = (key: string) => {
        setSelectedOptionalLocations(prev =>
            prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]
        );
    };

    const [totalDays, setTotalDays] = useState(0);
    /**
     * UPDATED: Asynchronous Generation Logic
     * Support for the new AI-based routing engine
     */
    const generatePlan = async () => {
        setIsGenerating(true);
        setGenerationError(null);
        setShowAllConflicts(false);

        try {
            const chosenActivities = activities.filter(a => selectedActivities.includes(a.id));
            const optionalLocationsList = optionalLocations.filter(loc =>
                selectedOptionalLocations.includes(`${loc.lat.toFixed(3)},${loc.lng.toFixed(3)}`)
            );

            // AWAIT the engine: The new engine is asynchronous
            const result = await generateRoutePlan(chosenActivities, optionalLocationsList);

            setRouteResult(result);
            setStep(3);
        } catch (error) {
            setGenerationError(error instanceof Error ? error.message : "Failed to generate optimized plan");
            console.error("Route generation error:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Helper for icons based on event types in the new engine
    const getEventIcon = (type: string) => {
        switch (type) {
            case 'activity': return <Sun size={18} />;
            case 'train': return <Train size={18} />;
            case 'meal': return <Utensils size={18} />;
            case 'travel': return <Navigation size={18} />;
            case 'sleep': return <BedDouble size={18} />;
            default: return <Info size={18} />;
        }
    };

    return (
        <MainLayout>
            <section className="pt-32 pb-24 px-6 md:px-12 bg-neutral-50 min-h-screen">
                <div className="max-w-6xl mx-auto">
                    {/* ... (Header logic) ... */}
                    <div className="text-center mb-16 space-y-4">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 bg-brand-gold/10 text-brand-gold rounded-full text-xs uppercase tracking-widest font-semibold border border-brand-gold/20">
                            <Sparkles size={14} /> AI Trip Planner
                        </motion.div>
                        <h1 className="text-4xl md:text-5xl font-serif text-brand-green">Design Your Perfect Journey</h1>
                        <p className="text-neutral-500 max-w-2xl mx-auto font-light leading-relaxed">
                            Discover Sri Lanka your way. Select what you love to do, and our intelligent planner will craft the ultimate itinerary, balancing mandatory highlights with seamless logistics.
                        </p>
                    </div>
                    <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-neutral-100">
                        {/* Steps UI (Same as before) */}
                        <div className="flex justify-between items-center mb-12 relative w-full h-8 px-4">
                            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-neutral-100 -z-10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-brand-gold"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${(step / 3) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                            {['Preferences', 'Locations', 'Itinerary'].map((label, index) => {
                                const s = index + 1;
                                const isActive = step >= s;
                                return (
                                    <div key={s} className="flex flex-col items-center gap-2">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-serif text-sm transition-all duration-500 ${isActive ? 'bg-brand-green text-white shadow-lg' : 'bg-white text-neutral-400 border border-neutral-200'}`}>
                                            {s}
                                        </div>
                                        <span className={`text-xs uppercase tracking-wider font-semibold ${isActive ? 'text-brand-green' : 'text-neutral-400'}`}>{label}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                    <div className="text-center">
                                        <h3 className="text-2xl font-serif text-brand-green mb-2">What do you love to do?</h3>
                                        <p className="text-sm text-neutral-500">Select the experiences that call to you.</p>
                                    </div>

                                    {/* Categories */}
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${selectedCategory === cat ? 'bg-brand-green text-white shadow-md scale-105' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {activities.filter(a => a.category === selectedCategory).map(act => {
                                            const isSelected = selectedActivities.includes(act.id);
                                            return (
                                                <div
                                                    key={act.id}
                                                    onClick={() => toggleActivity(act.id)}
                                                    className={`group relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${isSelected ? 'border-brand-gold bg-brand-gold/5 shadow-[0_8px_30px_rgba(212,175,55,0.12)] -translate-y-1' : 'border-neutral-200 bg-white hover:border-brand-gold/50 hover:shadow-md'}`}
                                                >
                                                    <div className="absolute top-4 right-4 z-10">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${isSelected ? 'bg-brand-gold border-brand-gold text-white' : 'border-neutral-300 text-transparent group-hover:border-brand-gold/50'}`}>
                                                            <Check size={14} />
                                                        </div>
                                                    </div>
                                                    <h4 className={`font-serif text-lg mb-2 pr-8 ${isSelected ? 'text-brand-green' : 'text-neutral-800'}`}>{act.activity_name}</h4>
                                                    <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed mb-4">{act.description}</p>
                                                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
                                                        <span className="flex items-center gap-1 bg-neutral-100 px-2 py-1 rounded-md"><Clock size={12} /> {act.duration_hours}h</span>
                                                        <span className="flex items-center gap-1 bg-neutral-100 px-2 py-1 rounded-md"><MapPin size={12} /> {act.location_name}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex justify-end pt-8">
                                        <button
                                            onClick={() => setStep(2)}
                                            disabled={selectedActivities.length === 0}
                                            className="bg-brand-green text-white px-8 py-3 rounded-full text-sm uppercase tracking-wider font-semibold shadow-lg hover:shadow-xl hover:bg-brand-charcoal transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center gap-2"
                                        >
                                            Continue to Locations <Navigation size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                    <div className="text-center">
                                        <h3 className="text-2xl font-serif text-brand-green mb-2">Curating Your Destinations</h3>
                                        <p className="text-sm text-neutral-500">Based on your choices, we've identified must-visit locations. Feel free to add more.</p>
                                    </div>

                                    <div className="space-y-8">
                                        <div>
                                            <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-gold mb-4 flex items-center gap-2"><MapPin size={16} /> Mandatory Stops</h4>
                                            <div className="flex flex-wrap gap-3">
                                                {mandatoryLocations.length > 0 ? mandatoryLocations.map((loc, i) => (
                                                    <div key={i} className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm flex items-center gap-2 shadow-md">
                                                        <Check size={14} className="text-brand-gold" /> {loc.name}
                                                    </div>
                                                )) : (
                                                    <p className="text-sm text-neutral-400 italic">No specific location bound to selected activities.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="h-px bg-neutral-100 w-full" />

                                        <div>
                                            <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4 flex items-center gap-2"><Compass size={16} /> Optional Experiences </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {optionalLocations.map(loc => {
                                                    const key = `${loc.lat.toFixed(3)},${loc.lng.toFixed(3)}`;
                                                    const isSelected = selectedOptionalLocations.includes(key);
                                                    return (
                                                        <button
                                                            key={key}
                                                            onClick={() => toggleOptionalLocation(key)}
                                                            className={`px-4 py-3 text-left text-sm rounded-xl border transition-all ${isSelected ? 'border-brand-green bg-brand-green/5 text-brand-green font-medium' : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-600'}`}
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <span className="truncate">{loc.name}</span>
                                                                {isSelected ? <Check size={14} /> : <Plus size={14} className="text-neutral-400" />}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-8 border-t border-neutral-100">
                                        <button onClick={() => setStep(1)} className="...">Back</button>
                                        <button
                                            onClick={generatePlan}
                                            disabled={isGenerating}
                                            className="bg-brand-gold text-white px-8 py-3 rounded-full flex items-center gap-2"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <BrainCircuit className="animate-pulse" size={18} />
                                                    AI Optimizing...
                                                </>
                                            ) : (
                                                <><Sparkles size={16} /> Generate AI Plan</>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && routeResult && (
                                <motion.div key="step3" className="space-y-12">
                                    {/* Optimization Score Badge */}
                                    <div className="flex justify-center">
                                        <div className="px-4 py-2 bg-brand-green/10 text-brand-green rounded-full text-sm font-semibold flex items-center gap-2">
                                            <BrainCircuit size={16} />
                                            Optimization Score: {routeResult.optimizationScore}%
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <h3 className="text-3xl font-serif text-brand-green">
                                            Your Bespoke {routeResult.totalDays}-Day Itinerary
                                        </h3>
                                        <p className="text-sm text-neutral-500 mt-2">
                                            Total travel: {routeResult.totalDistance}km |
                                            Est. Cost: Rs. {routeResult.totalCost.toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Itinerary Display */}
                                    <div className="space-y-8 max-h-[700px] overflow-y-auto pr-2">
                                        {routeResult.plan.map(day => (
                                            <div key={day.day} className="border border-neutral-200 rounded-3xl overflow-hidden bg-white shadow-sm">
                                                <div className="bg-neutral-50 px-6 py-4 flex justify-between items-center border-b border-neutral-200">
                                                    <div>
                                                        <h4 className="font-serif text-xl">Day {day.day}</h4>
                                                        <p className="text-xs text-neutral-400">{day.weather || "Clear skies"}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs font-medium text-brand-gold bg-brand-gold/10 px-2 py-1 rounded">
                                                            {day.utilization * 100}% Day Efficiency
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="divide-y divide-neutral-100">
                                                    {day.events.map((ev, i) => (
                                                        <div key={i} className="p-6 flex flex-col md:flex-row gap-4 hover:bg-neutral-50/50 transition-colors">
                                                            <div className="w-32 flex-shrink-0 text-sm font-medium text-neutral-400">
                                                                {ev.startTime} - {ev.endTime}
                                                            </div>
                                                            <div className="flex items-center gap-4 flex-1">
                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ev.type === 'activity' ? 'bg-brand-gold/10 text-brand-gold' : 'bg-neutral-100'}`}>
                                                                    {getEventIcon(ev.type)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-brand-charcoal">{ev.name}</p>
                                                                    {ev.locationName && (
                                                                        <p className="text-xs text-neutral-400 flex items-center gap-1">
                                                                            <MapPin size={12} /> {ev.locationName}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* AI Recommendation Box */}
                                                {day.recommendation && (
                                                    <div className="p-4 bg-blue-50/50 border-t border-blue-100 text-blue-700 text-sm italic">
                                                        " {day.recommendation} "
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* ... (Final Approval inputs name/email) ... */}
                                    <div className="p-8 bg-brand-green/5 rounded-3xl border border-brand-green/10 space-y-6">
                                        <h4 className="font-serif text-xl text-brand-green text-center">Ready to Make It Reality?</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <input
                                                type="text"
                                                placeholder="Your Name"
                                                className="bg-white border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-gold"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                            />
                                            <input
                                                type="email"
                                                placeholder="Email Address"
                                                className="bg-white border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-gold"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Travelers (e.g. 2)"
                                                className="bg-white border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-gold"
                                                value={travelers}
                                                onChange={e => setTravelers(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-8 border-t border-neutral-100">
                                        <button
                                            onClick={() => setStep(2)}
                                            className="px-6 py-3 text-sm font-medium text-neutral-500 bg-white border border-neutral-200 rounded-full hover:bg-neutral-50 transition-colors"
                                        >
                                            Adjust Locations
                                        </button>
                                        <button
                                            className="bg-brand-green text-white px-8 py-3 rounded-full text-sm uppercase tracking-wider font-semibold shadow-xl hover:bg-brand-charcoal transition-all flex items-center gap-2"
                                            onClick={() => alert('Plan Approved! Our specialists will contact you shortly to finalize details.')}
                                        >
                                            Approve Plan <Check size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}