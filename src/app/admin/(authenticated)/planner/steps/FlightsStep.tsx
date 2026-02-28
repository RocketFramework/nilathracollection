"use client";

import { TripData, FlightBooking } from "../types";
import { Plane, Plus, Trash2, CheckCircle2 } from "lucide-react";

export function FlightsStep({ tripData, updateFlights }: { tripData: TripData, updateFlights: (f: FlightBooking[]) => void }) {

    if (!tripData.serviceScopes.includes('Book International Flights')) {
        return (
            <div className="bg-neutral-50 p-12 text-center rounded-3xl border border-dashed border-neutral-300">
                <Plane className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-600">Flights Module Disabled</h3>
                <p className="text-sm text-neutral-400 mt-2">To plan international flights, enable "Book International Flights" in Step 1.</p>
            </div>
        );
    }

    const { flights } = tripData;

    const addFlight = () => {
        const newFlight: FlightBooking = {
            id: crypto.randomUUID(),
            numberOfSeats: tripData.profile.adults + tripData.profile.children,
            departureCountry: '',
            preferredAirlines: '',
            travelClass: tripData.profile.travelStyle === 'Ultra Luxury VIP' ? 'First Class' : tripData.profile.travelStyle === 'Luxury' ? 'Business' : tripData.profile.travelStyle === 'Premium' ? 'Premium Economy' : 'Economy',
            mealPreference: 'Standard',
            baggage: 'Standard 20kg',
            dateFlexibility: 'Fixed Dates',

            airlineSelected: '',
            pnr: '',
            ticketNumber: '',
            bookingConfirmationUrl: '',
            paymentConfirmationUrl: '',
            ticketIssued: false,
            customerConfirmed: false,
            paymentReceived: false,
            refundableStatus: 'Non-Refundable'
        };
        updateFlights([...flights, newFlight]);
    };

    const removeFlight = (id: string) => {
        updateFlights(flights.filter(f => f.id !== id));
    };

    const updateFlightField = (id: string, field: keyof FlightBooking, value: any) => {
        const updated = flights.map(f => {
            if (f.id === id) {
                return { ...f, [field]: value };
            }
            return f;
        });
        updateFlights(updated);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-serif text-brand-green flex items-center gap-2">
                        <Plane size={20} className="text-brand-gold" /> International Flight Planning
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">Manage flight preferences and track operational issuing status.</p>
                </div>
                <button
                    onClick={addFlight}
                    className="flex items-center gap-2 bg-brand-gold text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors shadow-sm text-sm font-medium"
                >
                    <Plus size={16} /> Add Flight Record
                </button>
            </div>

            {flights.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200 shadow-sm">
                    <p className="text-neutral-400 text-sm">No flight records added yet. Click above to start planning.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {flights.map((flight, idx) => (
                        <div key={flight.id} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                            <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex justify-between items-center text-sm">
                                <span className="font-semibold text-neutral-700 uppercase tracking-wide">Flight Segment {idx + 1}</span>
                                <button onClick={() => removeFlight(flight.id)} className="text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                                    <Trash2 size={14} /> Remove
                                </button>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {/* Initial Request Data */}
                                <div className="space-y-4">
                                    <h4 className="font-medium text-brand-green/80 uppercase text-xs tracking-wider border-b pb-2">Client Request & Preferences</h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-neutral-500 mb-1 block">Number of Seats</label>
                                            <input type="number" min="1" value={flight.numberOfSeats} onChange={e => updateFlightField(flight.id, 'numberOfSeats', Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm bg-neutral-50 focus:bg-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500 mb-1 block">Dep. Country/City</label>
                                            <input type="text" value={flight.departureCountry} onChange={e => updateFlightField(flight.id, 'departureCountry', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-neutral-50 focus:bg-white" placeholder="Ex: London (LHR)" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500 mb-1 block">Preferred Airline(s)</label>
                                            <input type="text" value={flight.preferredAirlines} onChange={e => updateFlightField(flight.id, 'preferredAirlines', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-neutral-50 focus:bg-white" placeholder="Ex: Emirates, Qatar" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500 mb-1 block">Travel Class</label>
                                            <select value={flight.travelClass} onChange={e => updateFlightField(flight.id, 'travelClass', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-neutral-50 focus:bg-white">
                                                <option>Economy</option>
                                                <option>Premium Economy</option>
                                                <option>Business</option>
                                                <option>First Class</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500 mb-1 block">Flexibility</label>
                                            <input type="text" value={flight.dateFlexibility} onChange={e => updateFlightField(flight.id, 'dateFlexibility', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-neutral-50 focus:bg-white" placeholder="Ex: +/- 2 Days" />
                                        </div>
                                    </div>
                                </div>

                                {/* Operational Tracking */}
                                <div className="space-y-4">
                                    <h4 className="font-medium text-brand-gold/80 uppercase text-xs tracking-wider border-b pb-2">Operational Tracking</h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-neutral-500 mb-1 block">Airline Selected</label>
                                            <input type="text" value={flight.airlineSelected} onChange={e => updateFlightField(flight.id, 'airlineSelected', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-brand-gold/30 focus:ring-1 focus:ring-brand-gold" placeholder="Actual booked airline" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500 mb-1 block">PNR Reference</label>
                                            <input type="text" value={flight.pnr} onChange={e => updateFlightField(flight.id, 'pnr', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-brand-gold/30 focus:ring-1 focus:ring-brand-gold" placeholder="e.g. XY89Z1" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 bg-brand-gold/5 p-4 rounded-xl border border-brand-gold/20 mt-2">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer font-medium text-neutral-700">
                                            <input type="checkbox" checked={flight.customerConfirmed} onChange={e => updateFlightField(flight.id, 'customerConfirmed', e.target.checked)} className="h-4 w-4 text-brand-gold rounded focus:ring-brand-gold" />
                                            Client Confirmed Route
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer font-medium text-neutral-700">
                                            <input type="checkbox" checked={flight.paymentReceived} onChange={e => updateFlightField(flight.id, 'paymentReceived', e.target.checked)} className="h-4 w-4 text-brand-gold rounded focus:ring-brand-gold" />
                                            Payment Settled
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer font-bold text-brand-green">
                                            <input type="checkbox" checked={flight.ticketIssued} onChange={e => updateFlightField(flight.id, 'ticketIssued', e.target.checked)} className="h-4 w-4 text-brand-green rounded outline-none border-brand-green" />
                                            E-Ticket Issued
                                            {flight.ticketIssued && <CheckCircle2 size={16} />}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
