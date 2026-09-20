"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Clock, Users, CheckCircle2, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { submitActivityBookingAction } from "@/actions/activity-booking.actions";
import { CreateActivityBookingItemDTO } from "@/dtos/activity-booking.dto";

interface SelectedActivityItem {
    id: number;
    activity_name: string;
    category: string;
    location_name: string;
    district: string;
    duration_hours: number;
}

interface MultiActivityBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedActivities: SelectedActivityItem[];
    onClearSelection?: () => void;
}

export default function MultiActivityBookingModal({
    isOpen,
    onClose,
    selectedActivities,
    onClearSelection
}: MultiActivityBookingModalProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingRef, setBookingRef] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // User auth state
    const [currentUser, setCurrentUser] = useState<any | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Item Session configurations (one config per selected activity)
    const [itemConfigs, setItemConfigs] = useState<Record<number, {
        booking_date: string;
        preferred_time_slot: string;
        adults: number;
        children: number;
        infants: number;
    }>>({});

    // Tourist Personal Information Form
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        country: "",
        passport_number: "",
        departure_country: "",
        arrival_date: "",
        departure_date: "",
        medical_conditions: "",
        language_preference: "English",
        special_notes: ""
    });

    useEffect(() => {
        // Initialize default session configs for selected activities
        const initialConfigs: Record<number, any> = {};
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        const dateStr = tomorrow.toISOString().split('T')[0];

        selectedActivities.forEach(act => {
            initialConfigs[act.id] = {
                booking_date: dateStr,
                preferred_time_slot: "Morning",
                adults: 2,
                children: 0,
                infants: 0
            };
        });
        setItemConfigs(initialConfigs);
    }, [selectedActivities]);

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUser(user);
                setIsLoggedIn(true);
                setFormData(prev => ({
                    ...prev,
                    email: user.email || ""
                }));

                // Fetch existing tourist profile
                const { data: profile } = await supabase
                    .from('tourist_profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profile) {
                    setFormData(prev => ({
                        ...prev,
                        first_name: profile.first_name || "",
                        last_name: profile.last_name || "",
                        phone: profile.phone || "",
                        country: profile.country || "",
                        passport_number: profile.passport_number || "",
                        departure_country: profile.departure_country || "",
                        arrival_date: profile.arrival_date || "",
                        departure_date: profile.departure_date || "",
                        medical_conditions: profile.medical_conditions || "",
                        language_preference: profile.language_preference || "English",
                        special_notes: profile.special_notes || ""
                    }));
                }
            }
        };
        if (isOpen) {
            checkAuth();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfigChange = (actId: number, field: string, value: any) => {
        setItemConfigs(prev => ({
            ...prev,
            [actId]: {
                ...prev[actId],
                [field]: value
            }
        }));
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmitBooking = async () => {
        setErrorMessage(null);
        if (!formData.email || !formData.email.includes("@")) {
            setErrorMessage("Please enter a valid email address.");
            setStep(2);
            return;
        }

        setIsSubmitting(true);
        try {
            const items: CreateActivityBookingItemDTO[] = selectedActivities.map(act => {
                const config = itemConfigs[act.id] || {
                    booking_date: new Date().toISOString().split('T')[0],
                    preferred_time_slot: 'Morning',
                    adults: 2,
                    children: 0,
                    infants: 0
                };
                return {
                    activity_id: act.id,
                    booking_date: config.booking_date,
                    preferred_time_slot: config.preferred_time_slot,
                    adults: config.adults,
                    children: config.children,
                    infants: config.infants
                };
            });

            const res = await submitActivityBookingAction({
                items,
                email: formData.email,
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone,
                country: formData.country,
                passport_number: formData.passport_number,
                departure_country: formData.departure_country,
                arrival_date: formData.arrival_date || undefined,
                departure_date: formData.departure_date || undefined,
                medical_conditions: formData.medical_conditions,
                language_preference: formData.language_preference,
                special_notes: formData.special_notes
            }, currentUser?.id);

            if (res.success && res.data) {
                setBookingRef(res.data.booking_number);
                setStep(3);
                if (onClearSelection) onClearSelection();
            } else {
                setErrorMessage(res.error || "Failed to submit booking request.");
            }
        } catch (err: any) {
            setErrorMessage(err.message || "An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-neutral-100 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-brand-green text-white p-6 sm:p-8 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-brand-gold/20 text-brand-gold font-bold text-xs uppercase tracking-widest rounded-full border border-brand-gold/30">
                            Activity Booking Request
                        </span>
                        {isLoggedIn && (
                            <span className="px-3 py-1 bg-white/10 text-white/90 text-xs font-medium rounded-full">
                                Logged In as {formData.first_name || currentUser?.email?.split('@')[0]}
                            </span>
                        )}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold">
                        {step === 1 && "Customize Your Activity Sessions"}
                        {step === 2 && "Personal & Travel Information"}
                        {step === 3 && "Booking Request Submitted"}
                    </h2>
                    <p className="text-white/80 text-sm mt-1">
                        {step === 1 && "Configure preferred dates, time slots, and guest counts for your selected experiences."}
                        {step === 2 && "Enter your details. We will confirm availability and email you the official price quote."}
                        {step === 3 && "Your request has been sent to our concierge team."}
                    </p>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 mt-6">
                        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-brand-gold' : 'bg-white/20'}`} />
                        <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-brand-gold' : 'bg-white/20'}`} />
                        <div className={`h-1.5 flex-1 rounded-full ${step === 3 ? 'bg-brand-gold' : 'bg-white/20'}`} />
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">

                    {errorMessage && (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-center gap-3">
                            <AlertCircle size={18} className="flex-shrink-0 text-red-600" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* STEP 1: Customizing session per activity */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="text-xs uppercase tracking-widest text-neutral-400 font-bold">
                                Selected Activities ({selectedActivities.length})
                            </div>

                            <div className="space-y-4">
                                {selectedActivities.map((act, index) => {
                                    const config = itemConfigs[act.id] || {
                                        booking_date: '',
                                        preferred_time_slot: 'Morning',
                                        adults: 2,
                                        children: 0,
                                        infants: 0
                                    };

                                    return (
                                        <div key={act.id} className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-4 hover:border-brand-gold/40 transition-colors">
                                            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-3">
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">
                                                        Experience #{index + 1} · {act.category}
                                                    </span>
                                                    <h4 className="text-base font-bold text-brand-charcoal font-serif">{act.activity_name}</h4>
                                                    <p className="text-xs text-neutral-500 mt-0.5">{act.location_name}, {act.district} · {act.duration_hours} Hours</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                                                {/* Date */}
                                                <div>
                                                    <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center gap-1">
                                                        <Calendar size={13} className="text-brand-gold" /> Session Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={config.booking_date}
                                                        onChange={(e) => handleConfigChange(act.id, 'booking_date', e.target.value)}
                                                        className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-brand-gold"
                                                    />
                                                </div>

                                                {/* Preferred Time Slot */}
                                                <div>
                                                    <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center gap-1">
                                                        <Clock size={13} className="text-brand-gold" /> Preferred Time
                                                    </label>
                                                    <select
                                                        value={config.preferred_time_slot}
                                                        onChange={(e) => handleConfigChange(act.id, 'preferred_time_slot', e.target.value)}
                                                        className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-brand-gold bg-white"
                                                    >
                                                        <option value="Morning">Morning (8:00 AM - 12:00 PM)</option>
                                                        <option value="Afternoon">Afternoon (12:00 PM - 4:00 PM)</option>
                                                        <option value="Evening">Evening (4:00 PM - 7:00 PM)</option>
                                                        <option value="Flexible">Time Flexible</option>
                                                    </select>
                                                </div>

                                                {/* Adults */}
                                                <div>
                                                    <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center gap-1">
                                                        <Users size={13} className="text-brand-gold" /> Adults (12+)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="30"
                                                        value={config.adults}
                                                        onChange={(e) => handleConfigChange(act.id, 'adults', parseInt(e.target.value) || 1)}
                                                        className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-brand-gold"
                                                    />
                                                </div>

                                                {/* Children & Infants */}
                                                <div>
                                                    <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center gap-1">
                                                        <Users size={13} className="text-brand-gold" /> Children & Infants
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="15"
                                                            placeholder="Children"
                                                            value={config.children}
                                                            onChange={(e) => handleConfigChange(act.id, 'children', parseInt(e.target.value) || 0)}
                                                            className="w-1/2 px-2 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:border-brand-gold"
                                                            title="Children (Age 3-11)"
                                                        />
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="10"
                                                            placeholder="Infants"
                                                            value={config.infants}
                                                            onChange={(e) => handleConfigChange(act.id, 'infants', parseInt(e.target.value) || 0)}
                                                            className="w-1/2 px-2 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:border-brand-gold"
                                                            title="Infants (Age 0-2)"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Tourist Information */}
                    {step === 2 && (
                        <div className="space-y-6">
                            {isLoggedIn && (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center justify-between">
                                    <span>Profile info auto-filled from your Tourist Account. You can update details below if needed.</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 mb-1">First Name *</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        required
                                        value={formData.first_name}
                                        onChange={handleFormChange}
                                        placeholder="e.g. Alexander"
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-brand-gold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 mb-1">Last Name *</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        required
                                        value={formData.last_name}
                                        onChange={handleFormChange}
                                        placeholder="e.g. Wright"
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-brand-gold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 mb-1">Email Address *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleFormChange}
                                        placeholder="alexander@example.com"
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-brand-gold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 mb-1">Phone / WhatsApp Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleFormChange}
                                        placeholder="+44 7700 900077"
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-brand-gold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 mb-1">Country of Residence</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleFormChange}
                                        placeholder="United Kingdom"
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-brand-gold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 mb-1">Passport Number</label>
                                    <input
                                        type="text"
                                        name="passport_number"
                                        value={formData.passport_number}
                                        onChange={handleFormChange}
                                        placeholder="G9876543"
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-brand-gold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 mb-1">Arrival Date to Sri Lanka</label>
                                    <input
                                        type="date"
                                        name="arrival_date"
                                        value={formData.arrival_date}
                                        onChange={handleFormChange}
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-brand-gold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 mb-1">Departure Date from Sri Lanka</label>
                                    <input
                                        type="date"
                                        name="departure_date"
                                        value={formData.departure_date}
                                        onChange={handleFormChange}
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-brand-gold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-2 border-t border-neutral-200">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 mb-1">Language Preference</label>
                                    <select
                                        name="language_preference"
                                        value={formData.language_preference}
                                        onChange={handleFormChange}
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-brand-gold bg-white"
                                    >
                                        <option value="English">English</option>
                                        <option value="German">German (Deutsch)</option>
                                        <option value="French">French (Français)</option>
                                        <option value="Russian">Russian (Русский)</option>
                                        <option value="Spanish">Spanish (Español)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 mb-1">Medical Conditions or Special Requirements</label>
                                    <textarea
                                        name="medical_conditions"
                                        rows={2}
                                        value={formData.medical_conditions}
                                        onChange={handleFormChange}
                                        placeholder="Any mobility requirements, allergies, or physical restrictions..."
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-brand-gold resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-700 mb-1">Special Notes for Concierge</label>
                                    <textarea
                                        name="special_notes"
                                        rows={2}
                                        value={formData.special_notes}
                                        onChange={handleFormChange}
                                        placeholder="Preferred start times, pickup locations, or specific requests..."
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-brand-gold resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Success Confirmation */}
                    {step === 3 && (
                        <div className="py-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                <CheckCircle2 size={36} />
                            </div>

                            <div>
                                <h3 className="text-2xl font-serif font-bold text-brand-charcoal">Booking Request Submitted!</h3>
                                <p className="text-neutral-600 text-sm mt-2 max-w-md mx-auto">
                                    We have received your multi-activity booking request. Our concierge team is reviewing availability and will email your confirmed price quote.
                                </p>
                            </div>

                            {bookingRef && (
                                <div className="inline-block p-4 bg-brand-gold/10 border border-brand-gold/30 rounded-2xl">
                                    <p className="text-xs uppercase tracking-widest font-bold text-brand-gold mb-1">Your Booking Reference</p>
                                    <p className="text-xl font-mono font-bold text-brand-charcoal">{bookingRef}</p>
                                </div>
                            )}

                            <div className="p-4 bg-neutral-50 rounded-2xl max-w-md mx-auto border border-neutral-200 text-xs text-left space-y-2">
                                <p className="font-bold text-brand-charcoal">What happens next?</p>
                                <ul className="list-disc list-inside text-neutral-600 space-y-1">
                                    <li>Confirmation receipt sent to <strong>{formData.email}</strong>.</li>
                                    <li>Our specialist confirms sessions & assigns registered activity vendors.</li>
                                    <li>You will receive your confirmed price response & offline payment instructions.</li>
                                    <li>You can track this booking anytime in your <strong className="text-brand-green">Tourist Portal</strong>.</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-6 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
                    {step === 1 && (
                        <>
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setStep(2)}
                                className="px-6 py-2.5 bg-brand-green text-white font-semibold text-sm rounded-xl hover:bg-brand-green/90 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                            >
                                Next: Tourist Info <ChevronRight size={16} />
                            </button>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <button
                                onClick={() => setStep(1)}
                                className="px-5 py-2.5 text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
                            >
                                Back to Sessions
                            </button>
                            <button
                                onClick={handleSubmitBooking}
                                disabled={isSubmitting}
                                className="px-8 py-2.5 bg-brand-gold text-white font-bold text-sm rounded-xl hover:bg-brand-gold/90 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" /> Submitting Request...
                                    </>
                                ) : (
                                    "Submit Booking Request"
                                )}
                            </button>
                        </>
                    )}

                    {step === 3 && (
                        <div className="w-full flex justify-center">
                            <button
                                onClick={onClose}
                                className="px-8 py-3 bg-brand-green text-white font-bold text-sm rounded-xl hover:bg-brand-green/90 transition-colors shadow-md"
                            >
                                Done & Return
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
