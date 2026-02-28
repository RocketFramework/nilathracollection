"use client";

import { TripProfile, ServiceScope, TripData } from "../types";
import { Users, Calendar, Wallet, CheckSquare, Plus, Check } from "lucide-react";
import { ChangeEvent, useState } from "react";

const allScopes: ServiceScope[] = [
    'Book International Flights',
    'Book Accommodation',
    'Arrange Transport',
    'Plan Activities & Experiences',
    'Arrange Dining / Culinary Experiences',
    'Book Event / Entry Tickets',
    'Visa Assistance',
    'Full End-to-End Luxury Handling'
];

const styles = ['Budget', 'Premium', 'Luxury', 'Ultra Luxury VIP', 'Mixed'] as const;

export function ScopeAndProfileStep({ tripData, updateData }: { tripData: TripData, updateData: (d: Partial<TripData>) => void }) {

    const profile = tripData.profile;
    const [durationError, setDurationError] = useState('');

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
                departureCountry: '',
                preferredAirlines: '',
                travelClass: profile.travelStyle === 'Ultra Luxury VIP' ? 'First Class' : profile.travelStyle === 'Luxury' ? 'Business' : profile.travelStyle === 'Premium' ? 'Premium Economy' : 'Economy',
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

    const updateProfile = (field: keyof TripProfile, value: any) => {
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
                        <div className="lg:col-span-4">
                            <label className="text-xs text-neutral-500 mb-1 block">Residential / Billing Address</label>
                            <input type="text" value={tripData.clientAddress || ''} onChange={e => updateData({ clientAddress: e.target.value })} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-brand-gold" placeholder="123 Example Street, City, Country" />
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
                                <p className="text-xs font-semibold text-brand-green bg-brand-green/10 p-2 rounded">
                                    ~ ${profile.budgetPerPerson.toLocaleString()} per person automatically inferred.
                                </p>
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
        </div>
    );
}
