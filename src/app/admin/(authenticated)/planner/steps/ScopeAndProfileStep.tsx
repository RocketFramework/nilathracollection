"use client";

import { TripProfile, ServiceScope, TripData, Traveler } from "../types";
import { Users, Calendar, Wallet, CheckSquare, Check, AlertTriangle, Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";

const allScopes: ServiceScope[] = [
    'Book International Flights',
    'Plan Activities & Experiences',
    'Visa Assistance'
];

const styles = ['Regular', 'Premium', 'Luxury', 'Ultra VIP', 'Mixed'] as const;

const STANDARD_DEFINITIONS: Record<string, {
    hotels: string;
    vehicle: string;
    service: string;
    inclusions: string[];
}> = {
    'Regular': {
        hotels: '3-Star / Comfortable Guest Houses ($50 - $100/day)',
        vehicle: 'Compact Sedan / Shared Shuttle (Japanese/Indian)',
        service: 'Self-managed with 24/7 Remote Support',
        inclusions: ['Driver-cum-Guide', 'Essential Entrance Tickets', 'Standard Activity Bookings']
    },
    'Premium': {
        hotels: '4-Star / Boutique Collection ($150 - $400/day)',
        vehicle: 'Luxury Sedan / SUV (Toyota Premio/Allion/X-Trail)',
        service: 'Professional English Speaking Chauffeur Guide',
        inclusions: ['All Entrance Tickets', 'Curated Activity Bookings', 'Welcome Gift Pack', 'Bottled Water daily']
    },
    'Luxury': {
        hotels: '5-Star / Signature Luxury Resorts ($500 - $1000/day)',
        vehicle: 'Premium SUV / Luxury Van (Land Cruiser/Prado/KDH Luxury)',
        service: 'Expert Naturalist/National Guide & Dedicated Chauffeur',
        inclusions: ['VIP Fast-track Arrival', 'All Activities & Gear', 'Daily Spa/Wellness Session', 'Premium Dining Reservations', 'Personalized Itinerary Manager']
    },
    'Ultra VIP': {
        hotels: 'Ultra-Luxury Villas / Presidential Suites ($5000 - $10000/day)',
        vehicle: 'Luxury Limousine / Private Helicopter Transfers',
        service: 'Private Butler, Concierge & Elite Guide Team',
        inclusions: ['Private Jet/Heli Charters', 'Exclusive "Money-can\'t-buy" Experiences', 'Daily Spa & Holistic Wellness', 'Personal Chef & Waitstaff', 'Full End-to-End White Glove Handling']
    }
};

export function ScopeAndProfileStep({ tripData, updateData }: { tripData: TripData, updateData: (d: Partial<TripData>) => void }) {

    const profile = tripData.profile;
    const [durationError, setDurationError] = useState('');

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const XLSX = await import('xlsx');
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                // Name(0), Passport(1), Nationality(2), Dietary(3), Room(4), Medical(5), Gender(6), DOB(7), MealPref(8), Sharing(9)
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                const newTravelers: Traveler[] = [];
                // Store sharing relationships as string names temporarily
                const sharingMap = new Map<string, string[]>();

                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0 || !row[0]) continue;

                    const id = crypto.randomUUID();
                    const fullName = row[0] ? String(row[0]).trim() : '';

                    if (row[9]) {
                        const shares = String(row[9]).split(',').map(s => s.trim()).filter(Boolean);
                        if (shares.length > 0) {
                            sharingMap.set(id, shares);
                        }
                    }

                    newTravelers.push({
                        id,
                        fullName,
                        passportNumber: row[1] ? String(row[1]) : '',
                        nationality: row[2] ? String(row[2]) : '',
                        dietaryPreferences: row[3] ? String(row[3]) : '',
                        roomPreference: (row[4] === 'Single' || row[4] === 'Twin' || row[4] === 'Triple' || row[4] === 'Family') ? row[4] : 'Double',
                        medicalNotes: row[5] ? String(row[5]) : '',
                        gender: (row[6] === 'Male' || row[6] === 'Female' || row[6] === 'Other') ? row[6] : undefined,
                        dateOfBirth: row[7] ? String(row[7]) : '',
                        mealPreference: row[8] ? String(row[8]) : 'Standard',
                        sharedWithIds: []
                    });
                }

                // Resolve "Sharing With" references (can link to existing travelers or newly imported ones)
                const allTravelers = [...(tripData.travelers || []), ...newTravelers];

                for (const t of newTravelers) {
                    const namesToLink = sharingMap.get(t.id);
                    if (namesToLink && namesToLink.length > 0) {
                        for (const name of namesToLink) {
                            // Find traveler by exact name (case-insensitive)
                            const matchedTraveler = allTravelers.find(at => at.id !== t.id && at.fullName.toLowerCase() === name.toLowerCase());
                            if (matchedTraveler && !t.sharedWithIds!.includes(matchedTraveler.id)) {
                                t.sharedWithIds!.push(matchedTraveler.id);
                                // Bidirectional insert
                                if (!matchedTraveler.sharedWithIds) matchedTraveler.sharedWithIds = [];
                                if (!matchedTraveler.sharedWithIds.includes(t.id)) matchedTraveler.sharedWithIds.push(t.id);
                            }
                        }
                    }
                }

                if (newTravelers.length > 0) {
                    updateData({ travelers: allTravelers });
                    alert(`Successfully imported ${newTravelers.length} travelers!`);
                } else {
                    alert("No valid travelers found in the Excel file. Please ensure the first column (Full Name) is not empty on data rows. (Row 1 is skipped to account for headers).");
                }
            } catch (err) {
                console.error(err);
                alert("Failed to parse Excel file. Please ensure it's a valid clear format.");
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = ''; // Reset input to allow re-selection
    };

    const toggleScope = (scope: ServiceScope) => {
        const isAdding = !tripData.serviceScopes.includes(scope);
        const newScopes = isAdding
            ? [...tripData.serviceScopes, scope]
            : tripData.serviceScopes.filter(s => s !== scope);

        const updates: Partial<TripData> = { serviceScopes: newScopes };

        // Automatically include a single international flight if added
        if (isAdding && scope === 'Book International Flights' && tripData.flights.length === 0) {
            updates.flights = [{
                id: crypto.randomUUID(),
                numberOfSeats: profile.adults + profile.children,
                departureCountry: profile.departureCountry || '',
                preferredAirlines: '',
                travelClass: profile.travelStyle === 'Ultra VIP' ? 'First Class' : profile.travelStyle === 'Luxury' ? 'Business' : profile.travelStyle === 'Premium' ? 'Premium Economy' : 'Economy',
                mealPreference: 'Standard',
                baggage: '20kg',
                dateFlexibility: 'Flexible (+/- 2 Days)',
                airlineSelected: '',
                pnr: '',
                ticketNumber: '',
                bookingConfirmationUrl: '',
                paymentConfirmationUrl: '',
                ticketIssued: false,
                customerConfirmed: false,
                paymentReceived: false,
                refundableStatus: 'Non-Refundable'
            }];
        }

        updateData(updates);
    };

    const updateProfile = (field: keyof TripProfile, value: string | number | boolean | object) => {
        const newProfile = { ...profile, [field]: value };

        // Auto-calculate duration logic
        if (field === 'arrivalDate' || field === 'departureDate') {
            const arr = new Date(newProfile.arrivalDate);
            const dep = new Date(newProfile.departureDate);
            if (arr && dep && arr <= dep) {
                const diffTime = Math.abs(dep.getTime() - arr.getTime());
                newProfile.durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive days
                setDurationError('');
            } else if (arr > dep) {
                setDurationError('Departure date must be after arrival date');
            }
        }

        // Auto-calculate budget per person
        if (field === 'budgetTotal' || field === 'adults' || field === 'children') {
            const totalPax = (Number(newProfile.adults) || 0) + (Number(newProfile.children) || 0);
            if (totalPax > 0 && newProfile.budgetTotal > 0) {
                newProfile.budgetPerPerson = Math.round(newProfile.budgetTotal / totalPax);
            } else {
                newProfile.budgetPerPerson = 0;
            }
        }

        updateData({ profile: newProfile });
    };

    return (
        <div className="space-y-12">

            {/* Service Scope Selection */}
            <section className="bg-white p-6 md:p-8 rounded-3xl border border-neutral-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 w-40 h-40 opacity-5 -z-10 pointer-events-none">
                    <CheckSquare className="w-full h-full text-brand-gold" />
                </div>
                <h3 className="text-xl font-serif text-brand-green mb-2 flex items-center gap-2">
                    <CheckSquare size={20} className="text-brand-gold" /> Step 1: Service Scope Selection
                </h3>
                <p className="text-neutral-500 text-sm mb-6 pb-4 border-b">What exactly are we handling for this client? Select all that apply.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {allScopes.map(scope => {
                        const isSelected = tripData.serviceScopes.includes(scope);
                        return (
                            <button
                                key={scope}
                                onClick={() => toggleScope(scope)}
                                className={`text-left text-sm p-4 rounded-xl border-2 transition-all flex items-start gap-3 justify-between ${isSelected ? 'border-brand-green bg-brand-green/5' : 'border-neutral-100 bg-neutral-50 hover:border-neutral-200 hover:bg-neutral-100'}`}
                            >
                                <span className={`font-medium ${isSelected ? 'text-brand-green' : 'text-neutral-700'}`}>{scope}</span>
                                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border mt-0.5 ${isSelected ? 'bg-brand-green border-brand-green text-white' : 'border-neutral-300'}`}>
                                    {isSelected && <Check size={12} />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Trip Profile Module */}
            <section className="bg-white p-6 md:p-8 rounded-3xl border border-neutral-200 shadow-sm">
                <h3 className="text-xl font-serif text-brand-green mb-2 flex items-center gap-2">
                    <Users size={20} className="text-brand-gold" /> Step 2: Client Trip Profile
                </h3>
                <p className="text-neutral-500 text-sm mb-8 pb-4 border-b">Basic constraints, timing, and specific client conditions to structure the itinerary.</p>

                {/* Client Identity Details */}
                <div className="mb-8 pb-8 border-b border-neutral-100 space-y-4">
                    <h4 className="font-semibold text-neutral-800 text-sm flex items-center gap-2 uppercase tracking-wide">
                        <Users size={14} className="text-brand-gold" /> Client Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Full Name / Company Name</label>
                            <input type="text" value={tripData.clientName} onChange={e => updateData({ clientName: e.target.value })} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-brand-gold" placeholder="Mr. John Doe" />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Passport Number</label>
                            <input type="text" value={tripData.clientPassport || ''} onChange={e => updateData({ clientPassport: e.target.value })} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-brand-gold" placeholder="A1234567" />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Email Address</label>
                            <input type="email" value={tripData.clientEmail || ''} onChange={e => updateData({ clientEmail: e.target.value })} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-brand-gold" placeholder="john@example.com" />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Phone Number</label>
                            <input type="tel" value={tripData.clientPhone || ''} onChange={e => updateData({ clientPhone: e.target.value })} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-brand-gold" placeholder="+1 234 567 890" />
                        </div>
                        <div className="lg:col-span-3">
                            <label className="text-xs text-neutral-500 mb-1 block">Residential / Billing Address</label>
                            <input type="text" value={tripData.clientAddress || ''} onChange={e => updateData({ clientAddress: e.target.value })} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-brand-gold" placeholder="123 Example Street, City, Country" />
                        </div>
                        <div>
                            <label className="text-xs text-neutral-500 mb-1 block">Departure Country</label>
                            <input type="text" value={profile.departureCountry || ''} onChange={e => updateProfile('departureCountry', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-brand-gold" placeholder="Ex: United Kingdom" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* PAX */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-neutral-800 text-sm flex items-center gap-2 uppercase tracking-wide">
                            <Users size={14} className="text-brand-gold" /> Party Composition
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-xs text-neutral-500 mb-1 block">Adults</label>
                                <input type="number" min="1" value={profile.adults} onChange={e => updateProfile('adults', Number(e.target.value))} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-brand-gold" />
                            </div>
                            <div>
                                <label className="text-xs text-neutral-500 mb-1 block">Children</label>
                                <input type="number" min="0" value={profile.children} onChange={e => updateProfile('children', Number(e.target.value))} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-brand-gold" />
                            </div>
                            <div>
                                <label className="text-xs text-neutral-500 mb-1 block">Infants</label>
                                <input type="number" min="0" value={profile.infants} onChange={e => updateProfile('infants', Number(e.target.value))} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-brand-gold" />
                            </div>
                        </div>
                    </div>

                    {/* Dates & Duration */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-neutral-800 text-sm flex items-center gap-2 uppercase tracking-wide">
                            <Calendar size={14} className="text-brand-gold" /> Travel Dates
                        </h4>
                        <div className="grid grid-cols-2 gap-3 relative">
                            <div>
                                <label className="text-xs text-neutral-500 mb-1 block">Arrival</label>
                                <input type="date" value={profile.arrivalDate} onChange={e => updateProfile('arrivalDate', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-brand-gold" />
                            </div>
                            <div>
                                <label className="text-xs text-neutral-500 mb-1 block">Departure</label>
                                <input type="date" value={profile.departureDate} onChange={e => updateProfile('departureDate', e.target.value)} className={`w-full px-3 py-2 border ${durationError ? 'border-red-400' : 'border-neutral-300'} rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-brand-gold`} />
                            </div>
                            {durationError && <div className="absolute -bottom-5 left-0 text-xs text-red-500">{durationError}</div>}
                        </div>
                        <div className="mt-3 flex items-center justify-between p-3 bg-brand-gold/5 rounded-lg border border-brand-gold/20">
                            <span className="text-sm font-medium text-brand-charcoal">Calculated Duration:</span>
                            <span className="font-bold text-brand-gold">{profile.durationDays > 0 ? `${profile.durationDays} Days` : '-'}</span>
                        </div>
                    </div>

                    {/* Budget & Style */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-neutral-800 text-sm flex items-center gap-2 uppercase tracking-wide">
                            <Wallet size={14} className="text-brand-gold" /> Budget Target
                        </h4>
                        <div className="space-y-3">
                            <div className="relative">
                                <label className="text-xs text-neutral-500 mb-1 block">Total Budget Estimate (LKR / USD)</label>
                                <input type="number" min="0" value={profile.budgetTotal || ''} placeholder="Ex: 500000" onChange={e => updateProfile('budgetTotal', Number(e.target.value))} className="w-full pl-8 pr-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-brand-gold" />
                                <span className="absolute left-3 top-[25px] text-neutral-400 font-medium text-sm">$</span>
                            </div>
                            {profile.budgetPerPerson > 0 && (
                                (() => {
                                    const totalPax = (Number(profile.adults) || 0) + (Number(profile.children) || 0);
                                    let budgetPerDay = 0;
                                    if (profile.durationDays > 0) {
                                        budgetPerDay = Math.round(Number(profile.budgetTotal) / (totalPax * profile.durationDays));
                                    }

                                    let alertMsg = '';
                                    if (budgetPerDay > 0) {
                                        if (profile.travelStyle === 'Regular' && budgetPerDay < 50) alertMsg = 'Below minimum for Regular ($50/day/pax)';
                                        else if (profile.travelStyle === 'Premium' && budgetPerDay < 150) alertMsg = 'Below minimum for Premium ($150/day/pax)';
                                        else if (profile.travelStyle === 'Luxury' && budgetPerDay < 500) alertMsg = 'Below minimum for Luxury ($500/day/pax)';
                                        else if (profile.travelStyle === 'Ultra VIP' && budgetPerDay < 5000) alertMsg = 'Below minimum for Ultra VIP ($5000/day/pax)';
                                    }

                                    return (
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-brand-green bg-brand-green/10 p-2 rounded">
                                                ~ ${profile.budgetPerPerson.toLocaleString()} per person {budgetPerDay > 0 ? `($${budgetPerDay.toLocaleString()} per day)` : ''} automatically inferred.
                                            </p>
                                            {alertMsg && (
                                                <p className="text-xs font-semibold text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 flex items-center gap-1">
                                                    <AlertTriangle size={14} className="shrink-0" /> {alertMsg}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })()
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-neutral-100 gap-8 grid grid-cols-1 md:grid-cols-2">
                    <div className="space-y-4">
                        <label className="text-sm font-semibold uppercase tracking-wide block">Preferred Standard (Travel, Accommodation, Transport)</label>
                        <div className="flex flex-wrap gap-2">
                            {styles.map(style => (
                                <button
                                    key={style}
                                    onClick={() => updateProfile('travelStyle', style)}
                                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${profile.travelStyle === style ? 'bg-brand-gold text-white shadow-md' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>

                        {profile.travelStyle && profile.travelStyle !== 'Mixed' && (
                            <div className="mt-4 p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Accommodation</span>
                                        <p className="text-xs font-medium text-brand-charcoal">{STANDARD_DEFINITIONS[profile.travelStyle].hotels}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Transport</span>
                                        <p className="text-xs font-medium text-brand-charcoal">{STANDARD_DEFINITIONS[profile.travelStyle].vehicle}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Service Level</span>
                                        <p className="text-xs font-medium text-brand-charcoal">{STANDARD_DEFINITIONS[profile.travelStyle].service}</p>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-neutral-200">
                                    <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block mb-2">Key Inclusions</span>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                                        {STANDARD_DEFINITIONS[profile.travelStyle].inclusions.map((inc, i) => (
                                            <div key={i} className="flex items-center gap-1.5">
                                                <div className="w-1 h-1 rounded-full bg-brand-gold" />
                                                <span className="text-[11px] text-neutral-600 font-medium">{inc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="space-y-4">
                        <label className="text-sm font-semibold uppercase tracking-wide block">Special Client Conditions Note</label>
                        <textarea
                            rows={4}
                            placeholder="Note any dietary requirements (vegan/halal), medical limitations (wheelchair), special occasion details (honeymoon)..."
                            className="w-full p-3 border border-neutral-300 rounded-xl text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-brand-gold  resize-none"
                            value={profile.specialConditions.occasion} // simplistic mapping here, can expand
                            onChange={e => updateProfile('specialConditions', { ...profile.specialConditions, occasion: e.target.value })}
                        />
                    </div>
                </div>

            </section>

            {/* Traveler Details Module */}
            <section className="bg-white p-6 md:p-8 rounded-3xl border border-neutral-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 w-40 h-40 opacity-5 -z-10 pointer-events-none">
                    <Users className="w-full h-full text-brand-gold" />
                </div>
                <h3 className="text-xl font-serif text-brand-green mb-2 flex items-center gap-2">
                    <Users size={20} className="text-brand-gold" /> Step 3: Individual Travelers
                </h3>
                <p className="text-neutral-500 text-sm mb-6 pb-4 border-b">Capture detailed passport, rooming, and medical notes for each passenger.</p>

                <div className="space-y-6">
                    {(tripData.travelers || []).map((t, index) => (
                        <div key={t.id} className="p-6 bg-neutral-50 border border-neutral-200 rounded-2xl relative">
                            <button onClick={() => updateData({ travelers: (tripData.travelers || []).filter(tv => tv.id !== t.id) })} className="absolute top-4 right-4 text-neutral-400 hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                            </button>
                            <h4 className="font-bold text-brand-charcoal text-sm mb-4">Traveler {index + 1}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs text-neutral-500 mb-1 block">Full Name</label>
                                    <input type="text" value={t.fullName} onChange={e => updateData({ travelers: (tripData.travelers || []).map(tv => tv.id === t.id ? { ...tv, fullName: e.target.value } : tv) })} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-1 focus:ring-brand-gold" placeholder="Jane Doe" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-neutral-500 mb-1 block">Gender</label>
                                        <select value={t.gender || ''} onChange={e => updateData({ travelers: (tripData.travelers || []).map(tv => tv.id === t.id ? { ...tv, gender: (e.target.value || undefined) as any } : tv) })} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-1 focus:ring-brand-gold outline-none">
                                            <option value="">N/A</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-neutral-500 mb-1 block">Date of Birth</label>
                                        <input type="date" value={t.dateOfBirth || ''} onChange={e => updateData({ travelers: (tripData.travelers || []).map(tv => tv.id === t.id ? { ...tv, dateOfBirth: e.target.value } : tv) })} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-1 focus:ring-brand-gold" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-neutral-500 mb-1 block">Passport Number</label>
                                        <input type="text" value={t.passportNumber || ''} onChange={e => updateData({ travelers: (tripData.travelers || []).map(tv => tv.id === t.id ? { ...tv, passportNumber: e.target.value } : tv) })} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-1 focus:ring-brand-gold" placeholder="P12345678" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-neutral-500 mb-1 block">Nationality</label>
                                        <input type="text" value={t.nationality || ''} onChange={e => updateData({ travelers: (tripData.travelers || []).map(tv => tv.id === t.id ? { ...tv, nationality: e.target.value } : tv) })} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-1 focus:ring-brand-gold" placeholder="British" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-neutral-500 mb-1 block">Meal Pref</label>
                                        <select value={t.mealPreference || ''} onChange={e => updateData({ travelers: (tripData.travelers || []).map(tv => tv.id === t.id ? { ...tv, mealPreference: e.target.value } : tv) })} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-1 focus:ring-brand-gold outline-none">
                                            <option value="Standard">Standard</option>
                                            <option value="Vegetarian">Vegetarian</option>
                                            <option value="Vegan">Vegan</option>
                                            <option value="Halal">Halal</option>
                                            <option value="Kosher">Kosher</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-neutral-500 mb-1 block">Dietary Options</label>
                                        <input type="text" value={t.dietaryPreferences || ''} onChange={e => updateData({ travelers: (tripData.travelers || []).map(tv => tv.id === t.id ? { ...tv, dietaryPreferences: e.target.value } : tv) })} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-1 focus:ring-brand-gold" placeholder="Nut allergy..." />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-neutral-500 mb-1 block">Medical / Special Notes</label>
                                    <input type="text" value={t.medicalNotes || ''} onChange={e => updateData({ travelers: (tripData.travelers || []).map(tv => tv.id === t.id ? { ...tv, medicalNotes: e.target.value } : tv) })} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white focus:ring-1 focus:ring-brand-gold" placeholder="Wheelchair access needed..." />
                                </div>
                                <div className="sm:col-span-2 lg:col-span-1">
                                    <label className="text-xs text-neutral-500 mb-1 block">Room Preference</label>
                                    <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                                        {['Single', 'Double', 'Twin', 'Triple', 'Family'].map(r => (
                                            <button
                                                key={r}
                                                onClick={() => updateData({ travelers: (tripData.travelers || []).map(tv => tv.id === t.id ? { ...tv, roomPreference: r as any } : tv) })}
                                                className={`flex-1 text-[10px] sm:text-xs font-semibold py-1.5 rounded-md transition-colors ${t.roomPreference === r || (!t.roomPreference && r === 'Double') ? 'bg-white text-brand-green shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {t.roomPreference !== 'Single' && (
                                    <div className="md:col-span-2 lg:col-span-3 pt-2 border-t border-neutral-200/60 mt-1">
                                        <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-2 block">Sharing Room With:</label>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            {(tripData.travelers || []).filter(other => other.id !== t.id).map(other => {
                                                const isShared = (t.sharedWithIds || []).includes(other.id);
                                                return (
                                                    <button
                                                        key={other.id}
                                                        onClick={() => {
                                                            let newShared = [...(t.sharedWithIds || [])];
                                                            if (isShared) {
                                                                newShared = newShared.filter(id => id !== other.id);
                                                            } else {
                                                                newShared.push(other.id);
                                                            }
                                                            // Bidirectional binding
                                                            const newTravelers = (tripData.travelers || []).map(tv => {
                                                                if (tv.id === t.id) return { ...tv, sharedWithIds: newShared };
                                                                if (tv.id === other.id) {
                                                                    let otherShared = [...(tv.sharedWithIds || [])];
                                                                    if (isShared) {
                                                                        otherShared = otherShared.filter(id => id !== t.id);
                                                                    } else {
                                                                        if (!otherShared.includes(t.id)) otherShared.push(t.id);
                                                                    }
                                                                    return { ...tv, sharedWithIds: otherShared };
                                                                }
                                                                return tv;
                                                            });
                                                            updateData({ travelers: newTravelers });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${isShared ? 'bg-brand-gold/10 text-brand-gold border-brand-gold shadow-sm' : 'bg-white text-neutral-600 border-neutral-200 hover:border-brand-gold/50'}`}
                                                    >
                                                        <div className={`w-2 h-2 rounded-full ${isShared ? 'bg-brand-gold' : 'bg-neutral-300'}`} />
                                                        {other.fullName || 'Unnamed'}
                                                    </button>
                                                )
                                            })}
                                            {(tripData.travelers || []).length <= 1 && (
                                                <span className="text-xs text-neutral-400 italic">Add more travelers to group</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => {
                                const newTraveler = {
                                    id: crypto.randomUUID(),
                                    fullName: '',
                                    passportNumber: '',
                                    nationality: '',
                                    dateOfBirth: '',
                                    dietaryPreferences: '',
                                    mealPreference: 'Standard',
                                    roomPreference: 'Double' as const,
                                    sharedWithIds: [],
                                    gender: undefined,
                                    medicalNotes: ''
                                };
                                updateData({ travelers: [...(tripData.travelers || []), newTraveler as any] });
                            }}
                            className="flex items-center gap-2 text-brand-gold font-bold hover:text-brand-green transition-colors text-sm px-5 py-3 bg-brand-gold/10 hover:bg-brand-green/10 rounded-xl"
                        >
                            <Plus size={16} /> Add Traveler Profile
                        </button>

                        <div className="relative group">
                            <input
                                type="file"
                                id="excel-upload"
                                className="hidden"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileUpload}
                            />
                            <label
                                htmlFor="excel-upload"
                                className="flex items-center gap-2 text-neutral-600 font-bold hover:text-brand-green transition-colors text-sm px-5 py-3 bg-neutral-100 hover:bg-brand-green/10 rounded-xl cursor-pointer"
                            >
                                <Upload size={16} /> Import via Excel
                            </label>

                            {/* Hover tooltip for Excel format */}
                            <div className="absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 bottom-full left-1/2 -translate-x-1/2 mb-3 w-[450px] bg-[#1E293B] text-white text-xs p-4 rounded-xl shadow-xl z-50">
                                <h5 className="font-bold text-brand-gold mb-2 uppercase tracking-wide">Excel Column Format (A to J):</h5>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-white/80">
                                    <span>A) Name</span>
                                    <span>B) Passport</span>
                                    <span>C) Nationality</span>
                                    <span>D) Dietary/Allergies</span>
                                    <span>E) Room (Single/Twin/Triple/Family)</span>
                                    <span>F) Medical Notes</span>
                                    <span>G) Gender (Male/Female/Other)</span>
                                    <span>H) DOB (YYYY-MM-DD || MM/DD/YYYY)</span>
                                    <span>I) Meal (Vegetarian/Halal/Vegan/Standard)</span>
                                    <span>J) Sharing With (Comma separated names)</span>
                                </div>
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1E293B] rotate-45" />
                            </div>
                        </div>
                    </div>

                    {/* Summary Block */}
                    {(tripData.travelers || []).length > 0 && (
                        <div className="mt-8 p-6 bg-brand-gold/5 rounded-2xl border border-brand-gold/20">
                            <h4 className="font-serif text-brand-green text-lg mb-4">Traveler Summary</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h5 className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-3 border-b border-brand-gold/20 pb-2">Room Requirements (Estimated by Links)</h5>
                                    <div className="space-y-2">
                                        {['Single', 'Double', 'Twin', 'Triple', 'Family'].map(rType => {
                                            const matchTravelers = (tripData.travelers || []).filter(t => t.roomPreference === rType);
                                            if (matchTravelers.length === 0) return null;

                                            // Calculate rooms
                                            const roomCount = matchTravelers.reduce((acc, t) => {
                                                const validLinks = (t.sharedWithIds || []).filter(id => matchTravelers.some(mt => mt.id === id));
                                                return acc + (1 / (1 + validLinks.length));
                                            }, 0);

                                            return (
                                                <div key={rType} className="flex justify-between items-center bg-white px-3 py-2 rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-brand-gold/10">
                                                    <span className="text-sm font-medium text-brand-charcoal">{rType} Rooms</span>
                                                    <span className="font-bold text-brand-green text-lg">{Math.ceil(roomCount)}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <h5 className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-3 border-b border-brand-gold/20 pb-2">Meal Preferences</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries((tripData.travelers || []).reduce((acc: any, t) => {
                                            const mp = t.mealPreference || 'Standard';
                                            acc[mp] = (acc[mp] || 0) + 1;
                                            return acc;
                                        }, {})).map(([meal, count]) => (
                                            <div key={meal} className="bg-white px-3 py-1.5 rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-brand-gold/10 flex items-center gap-2">
                                                <span className="text-sm font-medium text-brand-charcoal">{meal}</span>
                                                <span className="bg-brand-gold text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{count as number}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
