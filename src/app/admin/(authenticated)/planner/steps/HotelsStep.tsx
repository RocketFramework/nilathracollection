"use client";

import { TripData, AccommodationBooking } from "../types";
import { BedDouble, Plus, Trash2, CheckCircle2, AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getHotelsListAction } from "@/actions/admin.actions";

export function HotelsStep({ tripData, updateHotels }: { tripData: TripData, updateHotels: (h: AccommodationBooking[]) => void }) {

    const [availableHotels, setAvailableHotels] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHotels = async () => {
            setIsLoading(true);
            const res = await getHotelsListAction();
            if (res.success && res.hotels) {
                setAvailableHotels(res.hotels);
            }
            setIsLoading(false);
        };
        fetchHotels();
    }, []);

    if (!tripData.serviceScopes.includes('Book Accommodation')) {
        return (
            <div className="bg-neutral-50 p-12 text-center rounded-3xl border border-dashed border-neutral-300">
                <BedDouble className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-600">Accommodation Module Disabled</h3>
                <p className="text-sm text-neutral-400 mt-2">To plan hotels and stays, enable "Book Accommodation" in Step 1.</p>
            </div>
        );
    }

    const { accommodations } = tripData;

    // Helper to calculate the exact stay date for a specific night index
    const getStayDate = (nightIndex: number): string => {
        const arrival = new Date(tripData.profile.arrivalDate);
        arrival.setDate(arrival.getDate() + (nightIndex - 1));
        return arrival.toISOString().split('T')[0];
    };

    // Helper to calculate rate based on season and meal plan
    const calculateStayRate = (room: any, mealPlan: string, stayDate: string): number => {
        if (!room) return 0;

        const d = new Date(stayDate);

        // Define seasons
        const isSummer = (room.summer_start_date && room.summer_end_date &&
            d >= new Date(room.summer_start_date) && d <= new Date(room.summer_end_date));

        const isWinter = (room.winter_start_date && room.winter_end_date &&
            d >= new Date(room.winter_start_date) && d <= new Date(room.winter_end_date));

        let rate = 0;
        if (isSummer) {
            if (mealPlan === 'BB') rate = room.summer_bb_rate || 0;
            else if (mealPlan === 'HB') rate = room.summer_hb_rate || 0;
            else if (mealPlan === 'FB') rate = room.summer_fb_rate || 0;
            else if (mealPlan === 'AI') rate = room.summer_fb_rate || 0;
        } else if (isWinter) {
            if (mealPlan === 'BB') rate = room.winter_bb_rate || 0;
            else if (mealPlan === 'HB') rate = room.winter_hb_rate || 0;
            else if (mealPlan === 'FB') rate = room.winter_fb_rate || 0;
            else if (mealPlan === 'AI') rate = room.winter_fb_rate || 0;
        } else {
            rate = room.summer_bb_rate || room.winter_bb_rate || 0;
        }

        return rate;
    };

    const addHotel = () => {
        const newHotel: AccommodationBooking = {
            id: crypto.randomUUID(),
            nightIndex: accommodations.length > 0 ? Math.max(...accommodations.map(a => a.nightIndex)) + 1 : 1,
            hotelName: '',
            stayClass: 'Luxury',
            address: '',
            mapLink: '',
            contactPerson: '',
            contactNumber: '',
            email: '',
            rateCardUrl: '',
            roomStandard: '',
            numberOfRooms: Math.ceil((tripData.profile.adults + tripData.profile.children) / 2) || 1,
            numberOfGuests: tripData.profile.adults + tripData.profile.children + tripData.profile.infants,
            pricePerNight: 0,
            mealPlan: 'BB',
            status: 'Tentative',
            confirmationReference: '',
            paymentStatus: 'Pending',
            cancellationDeadline: '',
            beddingConfiguration: '',
            specialRequests: ''
        };
        updateHotels([...accommodations, newHotel].sort((a, b) => a.nightIndex - b.nightIndex));
    };

    const removeHotel = (id: string) => {
        updateHotels(accommodations.filter(h => h.id !== id));
    };

    const updateHotelField = (id: string, field: keyof AccommodationBooking, value: any) => {
        const updated = accommodations.map(h => {
            if (h.id === id) {
                const newData = { ...h, [field]: value };

                if (field === 'hotelName') {
                    const match = availableHotels.find(db => db.name === value);
                    if (match) {
                        newData.hotelId = match.id;
                        newData.address = match.location_address || '';
                        newData.stayClass = match.hotel_class || 'Standard 3*';
                        if (match.location_coordinates) {
                            newData.mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.location_coordinates)}`;
                        }
                        newData.roomStandard = '';
                        newData.pricePerNight = 0;
                        newData.beddingConfiguration = '';
                    } else {
                        newData.hotelId = undefined;
                    }
                }

                if (field === 'roomStandard' || field === 'mealPlan' || field === 'nightIndex') {
                    if (newData.hotelId) {
                        const hotel = availableHotels.find(db => db.id === newData.hotelId);
                        const rooms = hotel?.hotel_rooms || [];
                        if (field === 'roomStandard') {
                            const roomMatch = rooms.find((r: any) => r.room_standard === value);
                            if (roomMatch) newData.beddingConfiguration = roomMatch.room_name;
                        }
                        const currentRoom = rooms.find((r: any) => r.room_standard === newData.roomStandard);
                        if (currentRoom) {
                            const stayDate = getStayDate(newData.nightIndex);
                            newData.pricePerNight = calculateStayRate(currentRoom, newData.mealPlan, stayDate);
                        }
                    }
                }

                return newData;
            }
            return h;
        });
        updateHotels(updated.sort((a, b) => a.nightIndex - b.nightIndex));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-serif text-brand-green flex items-center gap-2">
                        <BedDouble size={20} className="text-brand-gold" /> Accommodation Planning
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">Manage night-by-night stays, verify room blocks, and control supplier payments.</p>
                </div>
                <button
                    onClick={addHotel}
                    className="flex items-center gap-2 bg-brand-gold text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors shadow-sm text-sm font-medium"
                >
                    <Plus size={16} /> Add Hotel Stay
                </button>
            </div>

            {accommodations.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200 shadow-sm">
                    <p className="text-neutral-400 text-sm">No properties added yet. Ensure your nights match the total Trip Duration ({tripData.profile.durationDays} Days).</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {accommodations.map((hotel, idx) => (
                        <div key={hotel.id} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">

                            {/* Header row */}
                            <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex justify-between items-center text-sm">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-neutral-700 uppercase tracking-wide">Night</span>
                                        <input
                                            type="number"
                                            min="1"
                                            value={hotel.nightIndex}
                                            onChange={e => updateHotelField(hotel.id, 'nightIndex', Number(e.target.value))}
                                            className="w-16 px-2 py-1 border border-neutral-300 rounded text-center text-brand-green font-bold focus:ring-1 focus:ring-brand-gold"
                                        />
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                         ${hotel.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {hotel.status}
                                    </div>
                                </div>
                                <button onClick={() => removeHotel(hotel.id)} className="text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                                    <Trash2 size={14} /> Remove Property
                                </button>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-6">

                                {/* Column 1: Property Details */}
                                <div className="md:col-span-5 space-y-4">
                                    <h4 className="font-medium text-brand-green/80 uppercase text-xs tracking-wider border-b pb-2">Property Profile</h4>

                                    <div className="space-y-3">
                                        <div className="grid grid-cols-[1fr_100px] gap-2">
                                            <div className="relative">
                                                <label className="text-xs text-neutral-500 mb-1 flex items-center gap-2">
                                                    Property Name / Resort
                                                    {isLoading && <Loader2 size={10} className="animate-spin text-brand-gold" />}
                                                </label>
                                                <select
                                                    value={hotel.hotelName}
                                                    onChange={e => updateHotelField(hotel.id, 'hotelName', e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg text-sm bg-neutral-50 focus:bg-white border-brand-gold/50 font-semibold focus:ring-1 focus:ring-brand-gold"
                                                >
                                                    <option value="" disabled>Select Property / Resort</option>
                                                    {availableHotels.map(dbH => (
                                                        <option key={dbH.id} value={dbH.name}>{dbH.name} ({dbH.closest_city || 'No Location'})</option>
                                                    ))}
                                                </select>
                                                {hotel.hotelId && (
                                                    <span className="absolute right-8 top-1.5 text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 border border-green-200 rounded">Linked</span>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-xs text-neutral-500 mb-1 block">Hotel Class</label>
                                                <select value={hotel.stayClass} onChange={e => updateHotelField(hotel.id, 'stayClass', e.target.value)} className="w-full px-2 py-2 border border-neutral-300 rounded-lg text-xs bg-neutral-50 focus:bg-white">
                                                    <option>Standard 3*</option>
                                                    <option>Premium 4*</option>
                                                    <option>Luxury 5*</option>
                                                    <option>Boutique</option>
                                                    <option>Villas</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs text-neutral-500 mb-1 block">Property Address/City</label>
                                                <textarea rows={2} value={hotel.address} onChange={e => updateHotelField(hotel.id, 'address', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs bg-neutral-50 focus:bg-white" placeholder="Dambulla, Cultural Triangle..." />
                                            </div>
                                            <div>
                                                <label className="text-xs text-neutral-500 mb-1 block">Google Maps Link</label>
                                                <div className="relative">
                                                    <input type="url" value={hotel.mapLink} onChange={e => updateHotelField(hotel.id, 'mapLink', e.target.value)} className="w-full pl-3 pr-8 py-2 border rounded-lg text-xs bg-neutral-50 focus:bg-white border-neutral-300" placeholder="https://maps.app.goo.gl/..." />
                                                    {hotel.mapLink && (
                                                        <a href={hotel.mapLink} target="_blank" rel="noopener noreferrer" className="absolute right-2 top-[9px] text-brand-gold hover:text-brand-green">
                                                            <ExternalLink size={14} />
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="mt-2 text-xs flex items-center gap-1 text-neutral-500">
                                                    <AlertTriangle size={10} className="text-yellow-500" /> Upload rates locally to attachments
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2: Rooms & Composition */}
                                <div className="md:col-span-4 space-y-4">
                                    <h4 className="font-medium text-brand-gold/80 uppercase text-xs tracking-wider border-b pb-2">Room & Board Block</h4>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <label className="text-xs text-neutral-500 mb-1 block">Room Standard</label>
                                            <select
                                                value={hotel.roomStandard}
                                                onChange={e => updateHotelField(hotel.id, 'roomStandard', e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg text-sm bg-neutral-50 border-neutral-300 focus:bg-white"
                                            >
                                                <option value="" disabled>Select Room Standard</option>
                                                {hotel.hotelId ? (
                                                    Array.from(new Set(availableHotels.find(h => h.id === hotel.hotelId)?.hotel_rooms?.map((r: any) => r.room_standard) || []))
                                                        .filter(Boolean)
                                                        .map((standard: any) => (
                                                            <option key={standard} value={standard}>{standard}</option>
                                                        ))
                                                ) : (
                                                    <option value="" disabled>Select Property First</option>
                                                )}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-neutral-600 block mb-1">Total Rooms</label>
                                            <input type="number" min="1" value={hotel.numberOfRooms} onChange={e => updateHotelField(hotel.id, 'numberOfRooms', Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm bg-neutral-50 font-bold text-center border-neutral-300 focus:bg-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-neutral-600 block mb-1">Total Guests</label>
                                            <input type="number" min="1" value={hotel.numberOfGuests || 1} onChange={e => updateHotelField(hotel.id, 'numberOfGuests', Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm bg-neutral-50 font-bold text-center border-neutral-300 focus:bg-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-neutral-600 block mb-1">Rate Per Night ($)</label>
                                            <input type="number" min="0" value={hotel.pricePerNight} onChange={e => updateHotelField(hotel.id, 'pricePerNight', Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm bg-neutral-50 font-bold text-center border-neutral-300 focus:bg-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-neutral-600 block mb-1">Meal Plan</label>
                                            <select value={hotel.mealPlan} onChange={e => updateHotelField(hotel.id, 'mealPlan', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-bold bg-neutral-50 focus:bg-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold">
                                                <option title="Bed & Breakfast" value="BB">BB (Breakfast)</option>
                                                <option title="Half Board" value="HB">HB (Breakfast+Dinner)</option>
                                                <option title="Full Board" value="FB">FB (All 3 Meals)</option>
                                                <option title="All Inclusive" value="AI">AI (All Inclusive)</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs text-neutral-500 mb-1 block">Bedding Setup / Room Name</label>
                                            <input type="text" value={hotel.beddingConfiguration} onChange={e => updateHotelField(hotel.id, 'beddingConfiguration', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs bg-neutral-50 border-neutral-300 focus:bg-white font-medium" placeholder="E.g. Deluxe Double Room..." />
                                        </div>
                                    </div>
                                </div>

                                {/* Column 3: Logistics & Control */}
                                <div className="md:col-span-3 space-y-4">
                                    <h4 className="font-medium text-red-400 uppercase text-xs tracking-wider border-b pb-2">Supplier Control</h4>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-bold text-neutral-600 block mb-1">Vendor Booking Status</label>
                                            <select
                                                value={hotel.status}
                                                onChange={e => updateHotelField(hotel.id, 'status', e.target.value)}
                                                className={`w-full px-3 py-2 border rounded-lg text-sm font-bold focus:ring-1 
                                                    ${hotel.status === 'Confirmed' ? 'bg-green-50 text-green-700 border-green-300 focus:ring-green-500' : 'bg-yellow-50 text-yellow-700 border-yellow-300 focus:ring-yellow-500'}`}
                                            >
                                                <option value="Tentative">Tentative Hold</option>
                                                <option value="Confirmed">Vendor Confirmed</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="col-span-2 relative">
                                                <label className="text-xs text-neutral-500 mb-1 block">Confirmation Ref #</label>
                                                <input type="text" value={hotel.confirmationReference} onChange={e => updateHotelField(hotel.id, 'confirmationReference', e.target.value)} className={`w-full px-3 py-2 border rounded-lg text-sm font-mono ${hotel.status === 'Confirmed' && !hotel.confirmationReference ? 'border-red-300 bg-red-50' : 'bg-neutral-50 border-neutral-300'}`} placeholder="BKG-889922..." />
                                                {hotel.status === 'Confirmed' && !hotel.confirmationReference && (
                                                    <AlertTriangle size={12} className="text-red-500 absolute top-2 right-2" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 p-2 bg-neutral-50 border border-neutral-200 rounded-lg">
                                            <label className="text-xs text-neutral-600 font-medium whitespace-nowrap">Payment Stage</label>
                                            <select
                                                value={hotel.paymentStatus}
                                                onChange={e => updateHotelField(hotel.id, 'paymentStatus', e.target.value)}
                                                className={`w-full p-1 border rounded text-xs font-bold
                                                     ${hotel.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                                            >
                                                <option value="Pending">Pending / Unpaid</option>
                                                <option value="Paid">Fully Settled</option>
                                            </select>
                                            {hotel.paymentStatus === 'Paid' && <CheckCircle2 size={16} className="text-green-600 shrink-0" />}
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-red-500 mb-1 block">Cancellation Cut-off</label>
                                            <input type="date" value={hotel.cancellationDeadline} onChange={e => updateHotelField(hotel.id, 'cancellationDeadline', e.target.value)} className="w-full px-3 py-1.5 border border-red-200 rounded-lg text-xs bg-red-50/50 focus:bg-white text-red-700 font-medium" />
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-12">
                                    <div className="mt-2 pt-4 border-t border-neutral-100 flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-[10px] text-neutral-400 mb-1 uppercase tracking-wider block">Internal Contact Notes (Private)</label>
                                            <div className="flex gap-2">
                                                <input type="text" placeholder="Contact Person (e.g. Ruwan - GM)" value={hotel.contactPerson} onChange={e => updateHotelField(hotel.id, 'contactPerson', e.target.value)} className="w-1/3 px-3 py-1.5 border border-neutral-200 rounded text-xs bg-neutral-50" />
                                                <input type="text" placeholder="Direct Number" value={hotel.contactNumber} onChange={e => updateHotelField(hotel.id, 'contactNumber', e.target.value)} className="w-1/3 px-3 py-1.5 border border-neutral-200 rounded text-xs bg-neutral-50" />
                                                <input type="email" placeholder="Reservation Email" value={hotel.email} onChange={e => updateHotelField(hotel.id, 'email', e.target.value)} className="w-1/3 px-3 py-1.5 border border-neutral-200 rounded text-xs bg-neutral-50" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <label className="text-[10px] text-neutral-400 mb-1 uppercase tracking-wider block">Special Client Requests Sent to Hotel</label>
                                        <textarea rows={1} value={hotel.specialRequests} onChange={e => updateHotelField(hotel.id, 'specialRequests', e.target.value)} className="w-full px-3 py-1.5 border border-neutral-200 rounded text-xs bg-neutral-50 focus:bg-white" placeholder="Honeymoon setup, dietary notes for the chef..." />
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
