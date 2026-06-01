"use client";

import { TripData, InternalItineraryBlock } from "../types";
import { Handshake, Building2, Utensils, Car, Compass, UserCheck, RefreshCw, AlertTriangle, Info, FileText, Mail, Code, CheckCircle2, X } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import {
    getHotelsListAction,
    getVendorsAction,
    getTransportProvidersAction,
    getTourGuidesAction,
    getRestaurantsAction,
    updateHotelContactInfoAction,
    updateTransportProviderContactInfoAction,
    sendCustomEmailAction,
    finalizeActivityPricesAction,
    getFinalizedActivitiesAction,
    getDailyActivitiesAction,
    savePlannerDataAction,
    saveTourAction,
    createQuotationRequestAction,
    getQuotationRequestsForActivityAction,
    updateQuotationAction,
    selectQuotationAction,
    createVendorBookingAction,
    getVendorBookingsAction
} from "@/actions/admin.actions";
import { getMyNotificationsAction, logQuoteRequestAction } from "@/actions/notification.actions";

const HotelContactForm = ({ hotelId, initialName, initialContact, initialEmail }: any) => {
    const [name, setName] = useState(initialName || '');
    const [contact, setContact] = useState(initialContact || '');
    const [email, setEmail] = useState(initialEmail || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setName(initialName || '');
        setContact(initialContact || '');
        setEmail(initialEmail || '');
    }, [initialName, initialContact, initialEmail]);

    const handleSave = async () => {
        setIsSaving(true);
        const res = await updateHotelContactInfoAction(hotelId, name, contact, email);
        setIsSaving(false);
        if (res.success) {
            alert('Hotel contacts updated successfully!');
        } else {
            alert(res.error || 'Failed to update hotel contacts');
        }
    };

    return (
        <div className="flex flex-wrap items-end gap-3 mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
            <div className="flex-1 min-w-[150px]">
                <label className="block text-[10px] text-neutral-500 uppercase font-bold tracking-wider mb-1">Reservation Agent</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg outline-none focus:border-brand-gold shadow-sm" placeholder="Agent Name" />
            </div>
            <div className="flex-1 min-w-[150px]">
                <label className="block text-[10px] text-neutral-500 uppercase font-bold tracking-wider mb-1">Contact No</label>
                <input type="text" value={contact} onChange={e => setContact(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg outline-none focus:border-brand-gold shadow-sm" placeholder="Phone Number" />
            </div>
            <div className="flex-1 min-w-[150px]">
                <label className="block text-[10px] text-neutral-500 uppercase font-bold tracking-wider mb-1">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg outline-none focus:border-brand-gold shadow-sm" placeholder="Email" />
            </div>
            <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 h-[38px] bg-brand-charcoal text-white text-xs font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50 shadow-sm whitespace-nowrap">
                {isSaving ? 'Saving...' : 'Update Records'}
            </button>
        </div>
    );
};

const TransportProviderContactForm = ({ providerId, initialPhone, initialEmail }: any) => {
    const [phone, setPhone] = useState(initialPhone || '');
    const [email, setEmail] = useState(initialEmail || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setPhone(initialPhone || '');
        setEmail(initialEmail || '');
    }, [initialPhone, initialEmail]);

    const handleSave = async () => {
        setIsSaving(true);
        const res = await updateTransportProviderContactInfoAction(providerId, phone, email);
        setIsSaving(false);
        if (res.success) {
            alert('Transport provider contacts updated successfully!');
        } else {
            alert(res.error || 'Failed to update transport provider contacts');
        }
    };

    return (
        <div className="flex flex-wrap items-end gap-3 mt-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
            <div className="flex-1 min-w-[150px]">
                <label className="block text-[10px] text-neutral-500 uppercase font-bold tracking-wider mb-1">Phone Number</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg outline-none focus:border-brand-gold shadow-sm" placeholder="Phone Number" />
            </div>
            <div className="flex-1 min-w-[150px]">
                <label className="block text-[10px] text-neutral-500 uppercase font-bold tracking-wider mb-1">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg outline-none focus:border-brand-gold shadow-sm" placeholder="Email" />
            </div>
            <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 h-[38px] bg-brand-charcoal text-white text-xs font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50 shadow-sm whitespace-nowrap">
                {isSaving ? 'Saving...' : 'Update Records'}
            </button>
        </div>
    );
};

export function PriceNegotiationStep({ tripData, updateData, setIsDirty }: { tripData: TripData, updateData: (d: Partial<TripData>) => void, setIsDirty?: (dirty: boolean) => void }) {
    const [isLoading, setIsLoading] = useState(true);

    const [masterHotels, setMasterHotels] = useState<any[]>([]);
    const [masterVendors, setMasterVendors] = useState<any[]>([]);
    const [masterTransports, setMasterTransports] = useState<any[]>([]);
    const [masterGuides, setMasterGuides] = useState<any[]>([]);
    const [masterRestaurants, setMasterRestaurants] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [finalizedIds, setFinalizedIds] = useState<Set<string>>(new Set());
    const [dbActivities, setDbActivities] = useState<any[]>([]);

    const [overrideNegotiation, setOverrideNegotiation] = useState<Record<string, boolean>>({});
    const [quotations, setQuotations] = useState<Record<string, any[]>>({});
    const [selectedAlternativeVendors, setSelectedAlternativeVendors] = useState<Record<string, string[]>>({});
    const [editingQuotePrice, setEditingQuotePrice] = useState<Record<string, string>>({});
    const [editingQuoteNotes, setEditingQuoteNotes] = useState<Record<string, string>>({});
    const [updatingQuoteId, setUpdatingQuoteId] = useState<string | null>(null);

    // Booking flow states
    const [bookings, setBookings] = useState<any[]>([]);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedQuoteForBooking, setSelectedQuoteForBooking] = useState<any | null>(null);
    const [selectedGroupItemsForBooking, setSelectedGroupItemsForBooking] = useState<any[]>([]);
    const [bookingCancellationDeadline, setBookingCancellationDeadline] = useState('');
    const [bookingCancellationPolicy, setBookingCancellationPolicy] = useState('');
    const [isCreatingBooking, setIsCreatingBooking] = useState(false);

    const fetchBookings = async () => {
        if (!tripData.id) return;
        const res = await getVendorBookingsAction(tripData.id);
        if (res.success) {
            setBookings(res.bookings || []);
        }
    };

    useEffect(() => {
        const fetchMasterData = async () => {
            setIsLoading(true);
            try {
                const [hotelsRes, vendorsRes, transportsRes, guidesRes, restRes, nRes, finalRes, dbActivitiesRes, bookingsRes] = await Promise.all([
                    getHotelsListAction(),
                    getVendorsAction(),
                    getTransportProvidersAction(),
                    getTourGuidesAction(),
                    getRestaurantsAction(),
                    getMyNotificationsAction(),
                    getFinalizedActivitiesAction(tripData.id || ''),
                    getDailyActivitiesAction(tripData.id || ''),
                    getVendorBookingsAction(tripData.id || '')
                ]);

                if (hotelsRes.success) setMasterHotels(hotelsRes.hotels || []);
                if (vendorsRes.success) setMasterVendors(vendorsRes.vendors || []);
                if (transportsRes.success) setMasterTransports(transportsRes.providers || []);
                if (guidesRes.success) setMasterGuides(guidesRes.guides || []);
                if (restRes.success) setMasterRestaurants(restRes.restaurants || []);
                if (nRes.success) setNotifications(nRes.data || []);
                if (bookingsRes.success) setBookings(bookingsRes.bookings || []);
                if (finalRes.success && finalRes.activities) {
                    setFinalizedIds(new Set(finalRes.activities.map((a: any) => a.id)));
                }
                if (dbActivitiesRes.success) {
                    const acts = dbActivitiesRes.activities || [];
                    setDbActivities(acts);
                    
                    // Fetch quotations for each daily activity
                    const quotesMap: Record<string, any[]> = {};
                    await Promise.all(
                        acts.map(async (act: any) => {
                            const res = await getQuotationRequestsForActivityAction(act.id);
                            if (res.success && res.quotes) {
                                quotesMap[act.id] = res.quotes;
                            }
                        })
                    );
                    setQuotations(quotesMap);
                }
            } catch (err) {
                console.error("Failed to fetch initial data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMasterData();
    }, []);

    const getCategorySuppliers = (blockType: string, block?: any) => {
        if (blockType === 'sleep') {
            if (!block) return masterHotels;
            let sleepCity = '';
            if (block.hotelId) {
                const currentHotel = masterHotels.find(h => h.id === block.hotelId);
                if (currentHotel && currentHotel.closest_city) {
                    sleepCity = currentHotel.closest_city.trim();
                }
            }
            if (!sleepCity && block.locationName) {
                sleepCity = block.locationName.split(',')[0].trim();
            }
            if (!sleepCity) return masterHotels;
            const cleanCity = sleepCity.toLowerCase().trim();
            return masterHotels.filter(h => {
                const hotelCity = (h.closest_city || '').toLowerCase().trim();
                const hotelAddress = (h.location_address || '').toLowerCase().trim();
                return hotelCity === cleanCity || hotelCity.includes(cleanCity) || cleanCity.includes(hotelCity) || hotelAddress.includes(cleanCity);
            });
        }
        if (blockType === 'travel') return masterTransports;
        if (blockType === 'guide') return masterGuides;
        if (blockType === 'meal') return masterRestaurants;
        if (blockType === 'activity') return masterVendors;
        return [];
    };

    const negotiableItems = useMemo(() => {
        let items: any[] = [];
        tripData.itinerary.forEach(rawBlock => {
            const b = { ...rawBlock, priceFinalized: rawBlock.priceFinalized || finalizedIds.has(rawBlock.id) };
            
            let vendorName = "Unknown Vendor";
            let unitPrice = 0;
            let quantity = 1;
            let referenceTotal = 0;
            let icon: React.ReactNode = <Compass size={18} />;
            let isHotelWithRooms = false;
            let accIndex = -1;
            let rooms: any[] = [];
            let mealPlan = "";

            const act = dbActivities.find(a => a.id === b.id);
            
            let isBound = false;
            
            if (b.type === 'sleep' && b.hotelId) {
                isBound = true;
                const hId = b.hotelId;
                const hotel = masterHotels.find(h => h.id === hId);
                if (hotel) vendorName = hotel.name;
                accIndex = tripData.accommodations?.findIndex(a => a.nightIndex === b.dayNumber && (a.hotelId === hId || a.hotelName === hotel?.name)) ?? -1;
                const acc = accIndex !== -1 ? tripData.accommodations![accIndex] : null;
                if (acc) {
                    if (acc.selectedRooms && acc.selectedRooms.length > 0) {
                        isHotelWithRooms = true;
                        rooms = acc.selectedRooms;
                    } else {
                        quantity = acc.numberOfRooms || 1;
                        mealPlan = acc.mealPlan || 'BB';
                    }
                }
                icon = <Building2 size={18} className="text-blue-500" />;
            } else if (b.type === 'meal' && b.restaurantId) {
                isBound = true;
                const rId = b.restaurantId;
                const rest = masterRestaurants.find(r => r.id === rId);
                if (rest) vendorName = rest.name;
                quantity = b.restaurantQuantity || (tripData.profile?.adults || 1) + (tripData.profile?.children || 0);
                icon = <Utensils size={18} className="text-orange-500" />;
            } else if (b.type === 'travel' && (b.transportId || tripData.defaultTransportId)) {
                isBound = true;
                const tId = b.transportId || tripData.defaultTransportId;
                const trans = masterTransports.find(t => t.id === tId);
                if (trans) vendorName = trans.name;
                if (b.contractedPrice !== undefined) {
                    quantity = b.transportQuantity || 1;
                } else {
                    const parsedDistance = parseFloat(b.distance?.replace(/[^0-9.]/g, '') || '0');
                    quantity = parsedDistance > 0 ? parsedDistance : 1;
                }
                icon = <Car size={18} className="text-indigo-500" />;
            } else if (b.type === 'guide' && (b.guideId || tripData.defaultGuideId)) {
                isBound = true;
                const gId = b.guideId || tripData.defaultGuideId;
                const guide = masterGuides.find(g => g.id === gId);
                if (guide) vendorName = `${guide.first_name} ${guide.last_name || ''}`.trim();
                quantity = 1;
                icon = <UserCheck size={18} className="text-purple-500" />;
            } else if (b.type === 'activity' && (b.vendorId || b.vendorActivityId)) {
                isBound = true;
                const vId = b.vendorId;
                const vend = masterVendors.find(v => v.id === vId);
                if (vend) vendorName = vend.name;
                quantity = b.transportQuantity || ((tripData.profile?.adults || 1) + (tripData.profile?.children || 0));
                icon = <Compass size={18} className="text-green-500" />;
            }

            if (!isBound) return;

            if (act && act.quantity != null) {
                quantity = act.quantity;
            }

            if (act) {
                unitPrice = act.charged_unit_price ?? 0;
                referenceTotal = act.charged_total_price ?? (unitPrice * quantity);
            } else {
                if (b.type === 'sleep') {
                    const acc = accIndex !== -1 ? tripData.accommodations![accIndex] : null;
                    unitPrice = b.agreedPrice !== undefined ? (quantity > 0 ? b.agreedPrice / quantity : b.agreedPrice) : (acc?.pricePerNight ?? 0);
                    referenceTotal = b.agreedPrice !== undefined ? b.agreedPrice : unitPrice * quantity;
                } else if (b.type === 'meal') {
                    const rest = masterRestaurants.find(r => r.id === b.restaurantId);
                    unitPrice = b.agreedPrice !== undefined ? b.agreedPrice : (rest?.lunch_rate_per_head || 0);
                    referenceTotal = unitPrice * quantity;
                } else if (b.type === 'travel') {
                    const trans = masterTransports.find(t => t.id === (b.transportId || tripData.defaultTransportId));
                    const vId = b.vehicleId || tripData.defaultVehicleId;
                    const veh = trans?.transport_vehicles?.find((v: any) => v.id === vId);
                    unitPrice = b.agreedPrice !== undefined ? (quantity > 0 ? b.agreedPrice / quantity : b.agreedPrice) : (veh?.per_km_rate || veh?.day_rate || 0);
                    referenceTotal = b.agreedPrice !== undefined ? b.agreedPrice : unitPrice * quantity;
                } else if (b.type === 'guide') {
                    const guide = masterGuides.find(g => g.id === (b.guideId || tripData.defaultGuideId));
                    unitPrice = b.agreedPrice !== undefined ? (quantity > 0 ? b.agreedPrice / quantity : b.agreedPrice) : (guide?.per_day_rate || 0);
                    referenceTotal = b.agreedPrice !== undefined ? b.agreedPrice : unitPrice * quantity;
                } else if (b.type === 'activity') {
                    const actBooking = tripData.activities.find(a => a.activityId === b.activityId);
                    const actPrice = (actBooking?.activityData as any)?.price || 0;
                    unitPrice = b.agreedPrice !== undefined ? b.agreedPrice : actPrice;
                    referenceTotal = unitPrice * quantity;
                }
            }

            let agreedPrice = undefined;
            if (b.priceFinalized) {
                agreedPrice = b.agreedPrice;
            } else {
                const isAgreedEdited = b.agreedPrice !== undefined && b.agreedPrice !== referenceTotal;
                if (isAgreedEdited) {
                    agreedPrice = b.agreedPrice;
                } else {
                    const baseContracted = act?.contracted_price ?? b.contractedPrice ?? 0;
                    agreedPrice = ['meal', 'activity'].includes(b.type) ? baseContracted : baseContracted * quantity;
                }
            }

            if (isHotelWithRooms) {
                items.push({
                    id: b.id,
                    block: b,
                    title: b.name,
                    vendorName,
                    icon,
                    isHotelWithRooms: true,
                    accIndex,
                    rooms
                });
            } else {
                items.push({
                    id: b.id,
                    block: b,
                    title: b.name,
                    vendorName,
                    icon,
                    unitPrice,
                    quantity,
                    referenceTotal,
                    agreedPrice,
                    mealPlan
                });
            }
        });
        return items;
    }, [tripData.itinerary, tripData.accommodations, tripData.activities, tripData.defaultDriverId, tripData.defaultGuideId, tripData.defaultTransportId, tripData.defaultVehicleId, masterHotels, masterRestaurants, masterTransports, masterGuides, masterVendors, dbActivities, finalizedIds]);

    const handleBlockUpdate = (blockId: string, updates: Partial<InternalItineraryBlock>, quantity = 1) => {
        const updatedItinerary = tripData.itinerary.map(b => {
            if (b.id === blockId) {
                const nextBlock = { ...b, ...updates };
                if (updates.agreedPrice !== undefined) {
                    const val = updates.agreedPrice;
                    nextBlock.contractedPrice = ['meal', 'activity'].includes(b.type) ? val : (quantity > 0 ? val / quantity : val);
                }
                return nextBlock;
            }
            return b;
        });
        updateData({ itinerary: updatedItinerary });
    };

    const handleRoomUpdate = (accIndex: number, roomIndex: number, agreedTotal: number | undefined) => {
        if (!tripData.accommodations) return;
        const updatedAccs = [...tripData.accommodations];
        const acc = updatedAccs[accIndex];
        if (acc && acc.selectedRooms) {
            const rooms = [...acc.selectedRooms];
            const room = rooms[roomIndex];
            const qty = room.quantity || 1;
            const contractedPrice = agreedTotal !== undefined ? (qty > 0 ? agreedTotal / qty : agreedTotal) : undefined;
            rooms[roomIndex] = { ...room, agreedTotal, contractedPrice };
            updatedAccs[accIndex] = { ...acc, selectedRooms: rooms };
            updateData({ accommodations: updatedAccs });
        }
    };

    const fetchQuotationsForActivity = async (activityId: string) => {
        const res = await getQuotationRequestsForActivityAction(activityId);
        if (res.success && res.quotes) {
            setQuotations(prev => ({ ...prev, [activityId]: res.quotes }));
        }
    };

    const handleUpdateQuotation = async (quoteId: string, activityId: string, currentStatus?: string) => {
        setUpdatingQuoteId(quoteId);
        try {
            const updates: any = {};
            const price = editingQuotePrice[quoteId];
            if (price !== undefined && price !== '') {
                updates.quoted_price = parseFloat(price);
            }
            const notes = editingQuoteNotes[quoteId];
            if (notes !== undefined) {
                updates.notes = notes;
            }
            if (currentStatus) {
                updates.status = currentStatus;
            }
            
            if (updates.status === 'Replied') {
                updates.replied_date = new Date().toISOString();
            }

            const res = await updateQuotationAction(quoteId, updates);
            if (res.success) {
                await fetchQuotationsForActivity(activityId);
            } else {
                alert("Failed to update quotation: " + res.error);
            }
        } catch (err: any) {
            console.error("Error updating quotation:", err);
            alert("An error occurred: " + err.message);
        } finally {
            setUpdatingQuoteId(null);
        }
    };

    const handleSelectQuotation = async (quote: any, groupItems: any[]) => {
        try {
            const firstItemId = groupItems[0]?.block?.id;
            if (!firstItemId) return;
            const res = await selectQuotationAction(quote.id, firstItemId);
            if (!res.success) {
                alert("Failed to select quotation: " + res.error);
                return;
            }
            
            // Proportional distribution ratio based on reference totals
            const totalRefAmount = groupItems.reduce((sum, item) => {
                let itemRef = item.referenceTotal || 0;
                if (item.isHotelWithRooms && item.rooms) {
                    itemRef = item.rooms.reduce((rSum: number, r: any) => rSum + ((r.pricePerNight ?? r.contractedPrice ?? 0) * (r.quantity || 1)), 0);
                }
                return sum + itemRef;
            }, 0);
            
            const ratio = totalRefAmount > 0 ? (quote.quoted_price / totalRefAmount) : 1;

            // Update local itinerary blocks
            const blockIds = groupItems.map(i => i.block?.id).filter(Boolean);
            let updatedAccommodations = tripData.accommodations ? [...tripData.accommodations] : undefined;

            const updatedItinerary = tripData.itinerary.map(b => {
                if (blockIds.includes(b.id)) {
                    const nextBlock = { ...b };
                    const matchingItem = groupItems.find(i => i.block?.id === b.id);
                    
                    if (b.type === 'sleep') {
                        nextBlock.hotelId = quote.vendor_id;
                        nextBlock.name = quote.vendor_name;
                    } else if (b.type === 'meal') {
                        nextBlock.restaurantId = quote.vendor_id;
                        nextBlock.name = quote.vendor_name;
                    } else if (b.type === 'travel') {
                        nextBlock.transportId = quote.vendor_id;
                        nextBlock.name = quote.vendor_name;
                    } else if (b.type === 'guide') {
                        nextBlock.guideId = quote.vendor_id;
                        nextBlock.name = quote.vendor_name;
                    } else if (b.type === 'activity') {
                        nextBlock.vendorId = quote.vendor_id;
                        nextBlock.name = quote.vendor_name;
                    }
                    
                    const itemRef = matchingItem?.isHotelWithRooms && matchingItem.rooms
                        ? matchingItem.rooms.reduce((rSum: number, r: any) => rSum + ((r.pricePerNight ?? r.contractedPrice ?? 0) * (r.quantity || 1)), 0)
                        : (matchingItem?.referenceTotal || 0);

                    const itemAgreed = itemRef * ratio;
                    nextBlock.agreedPrice = itemAgreed;
                    nextBlock.contractedPrice = ['meal', 'activity'].includes(b.type) 
                        ? itemAgreed 
                        : (matchingItem?.quantity > 0 ? itemAgreed / matchingItem.quantity : itemAgreed);
                    
                    // If it is a hotel with rooms, update the selected rooms rates in the accommodation object
                    if (matchingItem?.isHotelWithRooms && updatedAccommodations && matchingItem.accIndex !== -1) {
                        const acc = { ...updatedAccommodations[matchingItem.accIndex] };
                        if (acc.selectedRooms) {
                            acc.selectedRooms = acc.selectedRooms.map((room: any) => {
                                const roomRefTotal = (room.pricePerNight ?? room.contractedPrice ?? 0) * (room.quantity || 1);
                                return {
                                    ...room,
                                    agreedTotal: roomRefTotal * ratio
                                };
                            });
                            updatedAccommodations[matchingItem.accIndex] = acc;
                        }
                    }

                    return nextBlock;
                }
                return b;
            });
            
            const nextTripData = { 
                ...tripData, 
                itinerary: updatedItinerary,
                ...(updatedAccommodations ? { accommodations: updatedAccommodations } : {})
            };
            
            updateData({ 
                itinerary: updatedItinerary,
                ...(updatedAccommodations ? { accommodations: updatedAccommodations } : {})
            });
            
            // Sync with relational tables immediately
            const saveRes = await saveTourAction(tripData.id || '', nextTripData);
            if (!saveRes.success) {
                console.error("Failed to sync tour tables", saveRes.error);
            }
            
            await fetchQuotationsForActivity(firstItemId);
            alert(`Quotation from ${quote.vendor_name} applied successfully!`);
        } catch (err: any) {
            console.error("Error selecting quotation:", err);
            alert("An error occurred: " + err.message);
        }
    };

    const handleProceedToBooking = (quote: any, groupItems: any[]) => {
        setSelectedQuoteForBooking(quote);
        setSelectedGroupItemsForBooking(groupItems);
        setBookingCancellationDeadline('');
        setBookingCancellationPolicy('');
        setShowBookingModal(true);
    };

    const handleCreateBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedQuoteForBooking || !tripData.id) return;
        setIsCreatingBooking(true);
        try {
            const actIds = selectedGroupItemsForBooking.map(i => i.block?.id).filter(Boolean);
            const res = await createVendorBookingAction({
                tour_id: tripData.id,
                quotation_request_id: selectedQuoteForBooking.id,
                vendor_type: selectedQuoteForBooking.activity_type === 'sleep' ? 'hotel' : 
                             (selectedQuoteForBooking.activity_type === 'travel' ? 'transport_provider' :
                              (selectedQuoteForBooking.activity_type === 'guide' ? 'tour_guide' :
                               (selectedQuoteForBooking.activity_type === 'meal' ? 'restaurant' : 
                                (selectedQuoteForBooking.activity_type === 'driver' ? 'driver' : 'vendor')))),
                vendor_id: selectedQuoteForBooking.vendor_id,
                vendor_name: selectedQuoteForBooking.vendor_name,
                agreed_price: selectedQuoteForBooking.quoted_price || 0,
                currency: selectedQuoteForBooking.currency || 'USD',
                cancellation_deadline: bookingCancellationDeadline ? new Date(bookingCancellationDeadline).toISOString() : null,
                cancellation_policy: bookingCancellationPolicy || null,
                notes: selectedQuoteForBooking.notes || null,
                daily_activity_ids: actIds
            });

            if (res.success) {
                alert(`Booking request created successfully for ${selectedQuoteForBooking.vendor_name}! A Draft Purchase Order has been raised in parallel.`);
                setShowBookingModal(false);
                await fetchBookings();
                // Refresh quotations since the quote status changed to 'Selected'
                const firstItemId = selectedGroupItemsForBooking[0]?.block?.id;
                if (firstItemId) {
                    await fetchQuotationsForActivity(firstItemId);
                }
            } else {
                alert(`Failed to create booking: ${res.error}`);
            }
        } catch (error: any) {
            console.error("Error creating booking:", error);
            alert(`An error occurred: ${error.message || error}`);
        } finally {
            setIsCreatingBooking(false);
        }
    };

    const handleGenerateMultiQuoteEmail = (groupItems: any[], selectedSuppliers: any[]) => {
        if (selectedSuppliers.length === 0) return;
        if (!groupItems || groupItems.length === 0) return;
        
        const first = selectedSuppliers[0];
        const firstEmail = first.email || first.reservation_email || "";
        const firstName = first.name || `${first.first_name || ''} ${first.last_name || ''}`.trim();
        
        const recipients = selectedSuppliers.map(s => ({
            id: s.id,
            name: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim(),
            email: s.email || s.reservation_email || "info@nilathra.com"
        }));

        const getMealPlanName = (mp: string) => {
            const m = mp?.toUpperCase() || 'BB';
            if (m === 'HB') return 'Half Board';
            if (m === 'FB') return 'Full Board';
            if (m === 'AI') return 'All Inclusive';
            if (m === 'BB') return 'Bed & Breakfast';
            return m;
        };

        const servicesHtml = groupItems.map(item => {
            let exactDateStr = "TBD";
            if (tripData.profile?.arrivalDate && item.block?.dayNumber) {
                const dateObj = new Date(tripData.profile.arrivalDate);
                dateObj.setDate(dateObj.getDate() + (item.block.dayNumber - 1));
                exactDateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }

            let details = '';
            if (item.isHotelWithRooms) {
                details = item.rooms.map((r: any) => {
                    const roomType = r.reqId ? `[${r.reqId}] ` : '';
                    return `${r.quantity || 1}x ${roomType}${r.roomName} (${getMealPlanName(r.mealPlan)})`;
                }).join('<br/>');
            } else if (item.block?.type === 'sleep') {
                details = `Quantity: ${item.quantity || 1} (${getMealPlanName(item.mealPlan)})`;
            } else if (item.block?.type === 'travel') {
                details = `Quantity: ${item.quantity || 1} km (+/- 10%)`;
            } else {
                details = `Quantity: ${item.quantity || 1}`;
            }

            return `<li style="margin-bottom:8px;"><strong>${item.title || 'Service'}</strong><br/><span style="color:#666;">Date: ${exactDateStr} (Day ${item.block?.dayNumber || 1})</span><br/>${details}</li>`;
        }).join('');

        const adults = tripData.profile?.adults || 0;
        const children = tripData.profile?.children || 0;
        const totalPax = adults + children;
        const paxInfo = `${totalPax} Pax (${adults} Adults, ${children} Children)`;
        const guestOrigin = tripData.travelers?.[0]?.nationality || tripData.profile?.departureCountry || 'Not Specified';

        const isTransportVendor = groupItems.some(item => item.block?.type === 'travel');
        const isHotelVendor = groupItems.some(item => item.block?.type === 'sleep');
        const isLuxury = tripData.profile?.travelStyle === 'Luxury' || tripData.profile?.travelStyle === 'Ultra VIP';
        
        let additionalInfoHtml = `<li style="margin-bottom:4px;">Confirmation of availability for the dates mentioned.</li><li style="margin-bottom:4px;">Best available B2B/Net Rates.</li><li style="margin-bottom:4px;">Any special long-stay, VIP, or corporate rates if applicable.</li><li style="margin-bottom:4px;">Your standard Cancellation Policy.</li><li style="margin-bottom:4px;">Clear inclusions and exclusions for the quoted rates.</li>`;

        if (isHotelVendor) {
            additionalInfoHtml += `<li style="margin-bottom:4px;">Is Driver Accommodation (FOC) provided?</li><li style="margin-bottom:4px;">Are Driver Meals included?</li><li style="margin-bottom:4px;">Is on-site Parking included?</li><li style="margin-bottom:4px;">What are the Guide Room options (Free, Half Price, or None)?</li>`;
        }

        if (isTransportVendor) {
            additionalInfoHtml += `<li style="margin-bottom:4px;">Please include rates for the vehicle with driver and without driver.</li><li style="margin-bottom:4px;">Max km included for the day.</li><li style="margin-bottom:4px;">Vehicle details: Make, model, year of manufacture, and color.</li>`;
            if (isLuxury) {
                additionalInfoHtml += `<li style="margin-bottom:4px;">Minimum vehicle condition requirements: As this is a ${tripData.profile?.travelStyle} trip, please ensure pristine condition, leather interiors, recent models, working AC, bottled water provided, and professional driver.</li>`;
            }
        }

        const isSingleRecipient = selectedSuppliers.length === 1;
        const displayName = isSingleRecipient ? firstName : "[Supplier Name]";

        const subject = `Quotation Request & Availability Check - ${displayName}`;
        
        const bodyHtml = `
<p style="margin:0 0 16px;">Dear ${displayName},</p>
<p style="margin:0 0 16px;">Greetings from Nilathra Collection.</p>
<p style="margin:0 0 16px;">Nilathra Collection is a luxury and ultra-VIP travel concierge specializing in curated Sri Lankan journeys and hospitality experiences.</p>
<p style="margin:0 0 16px;">We are currently organizing an itinerary for our valued clients and would appreciate it if you could provide your best available net rates along with availability confirmation for the following requirements:</p>
<hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0;" />
<h4 style="margin:0 0 12px;color:#2B2B2B;font-family:serif;">SERVICE DETAILS</h4>
<ul style="margin:0 0 12px;padding-left:20px;">
    ${servicesHtml}
</ul>
<h4 style="margin:0 0 12px;color:#2B2B2B;font-family:serif;">TOUR INFORMATION</h4>
<ul style="margin:0 0 12px;padding-left:20px;">
    <li style="margin-bottom:4px;"><strong>Pax count:</strong> ${paxInfo}</li>
    <li style="margin-bottom:4px;"><strong>Client Nationality/Origin:</strong> ${guestOrigin}</li>
    <li style="margin-bottom:4px;"><strong>Travel Style / Tier:</strong> ${tripData.profile?.travelStyle || 'Standard'}</li>
</ul>
<h4 style="margin:0 0 12px;color:#2B2B2B;font-family:serif;">REQUESTED DETAILS</h4>
<ul style="margin:0;padding-left:20px;">
    ${additionalInfoHtml}
</ul>
<hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0;" />
<p style="margin:0 0 16px;">Please send your response back to us as soon as possible. Thank you very much for your cooperation.</p>
<p style="margin:0;">Best Regards,<br/><strong>Operations Team</strong><br/>Nilathra Collection</p>
`.replace(/\n/g, '');

        setEmailDraft({
            vendorGroup: first.name ? "Alternative Suppliers" : firstName,
            to: firstEmail,
            subject,
            body: bodyHtml,
            referenceType: 'daily_activity',
            referenceId: groupItems[0]?.block?.id || tripData.id || '',
            activityType: groupItems[0]?.block?.type || '',
            allDailyActivityIds: groupItems.map(i => i.block?.id).filter(Boolean),
            recipients
        });
    };

    const [sendingQuote, setSendingQuote] = useState<string | null>(null);
    const [finalizingGroup, setFinalizingGroup] = useState<string | null>(null);
    const [emailDraft, setEmailDraft] = useState<{
        vendorGroup: string;
        to: string;
        subject: string;
        body: string;
        referenceType: string;
        referenceId: string;
        activityType?: string;
        allDailyActivityIds?: string[];
        recipients?: { id: string; name: string; email: string }[];
    } | null>(null);
    const [showHtml, setShowHtml] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

    const handleInput = () => {
        if (editorRef.current && emailDraft) {
            setEmailDraft({ ...emailDraft, body: editorRef.current.innerHTML });
        }
    };

    // Initialize contentEditable when draft opens
    useEffect(() => {
        if (emailDraft && editorRef.current && !showHtml) {
            if (editorRef.current.innerHTML !== emailDraft.body) {
                editorRef.current.innerHTML = emailDraft.body;
            }
        }
    }, [emailDraft, showHtml]);

    const generateQuotationRequestEmail = async (vendorGroup: string, items: any[]) => {
        const hotelItem = items.find((i: any) => i.block?.type === 'sleep' && i.block?.hotelId);
        const hotelId = hotelItem?.block?.hotelId;
        const masterHotel = hotelId ? masterHotels.find((h: any) => h.id === hotelId) : null;
        
        let toEmail = "";
        let agentName = "Reservation / Sales Team";
        
        if (masterHotel) {
            if (masterHotel.reservation_email) toEmail = masterHotel.reservation_email;
            if (masterHotel.reservation_agent_name) agentName = masterHotel.reservation_agent_name;
        } else {
            const masterTransport = masterTransports.find((t: any) => t.name === vendorGroup);
            if (masterTransport) {
                if (masterTransport.email) toEmail = masterTransport.email;
                agentName = "Transport Operations Team";
            }
        }

        if (!toEmail) {
            alert(`No email address found for ${vendorGroup}. Please update their contact details first.`);
            return;
        }

        let servicesHtml = '';
        if (items && items.length > 0) {
            servicesHtml = items.map(item => {
                let exactDateStr = "TBD";
                if (tripData.profile?.arrivalDate && item.block?.dayNumber) {
                    const dateObj = new Date(tripData.profile.arrivalDate);
                    dateObj.setDate(dateObj.getDate() + (item.block.dayNumber - 1));
                    exactDateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                }

                const getMealPlanName = (mp: string) => {
                    const m = mp?.toUpperCase() || 'BB';
                    if (m === 'HB') return 'Half Board';
                    if (m === 'FB') return 'Full Board';
                    if (m === 'AI') return 'All Inclusive';
                    if (m === 'BB') return 'Bed & Breakfast';
                    return m;
                };

                let details = '';
                if (item.isHotelWithRooms) {
                    details = item.rooms.map((r: any) => {
                        const roomType = r.reqId ? `[${r.reqId}] ` : '';
                        return `${r.quantity || 1}x ${roomType}${r.roomName} (${getMealPlanName(r.mealPlan)})`;
                    }).join('<br/>');
                } else if (item.block?.type === 'sleep') {
                    details = `Quantity: ${item.quantity || 1} (${getMealPlanName(item.mealPlan)})`;
                } else if (item.block?.type === 'travel') {
                    details = `Quantity: ${item.quantity || 1} km (+/- 10%)`;
                } else {
                    details = `Quantity: ${item.quantity || 1}`;
                }

                return `<li style="margin-bottom:8px;"><strong>${item.title || 'Service'}</strong><br/><span style="color:#666;">Date: ${exactDateStr} (Day ${item.block?.dayNumber || 1})</span><br/>${details}</li>`;
            }).join('');
        }

        const adults = tripData.profile?.adults || 0;
        const children = tripData.profile?.children || 0;
        const totalPax = adults + children;
        const paxInfo = `${totalPax} Pax (${adults} Adults, ${children} Children)`;
        const guestOrigin = tripData.travelers?.[0]?.nationality || tripData.profile?.departureCountry || 'Not Specified';

        const isTransportVendor = items.some(item => item.block?.type === 'travel');
        const isHotelVendor = items.some(item => item.block?.type === 'sleep');
        const isLuxury = tripData.profile?.travelStyle === 'Luxury' || tripData.profile?.travelStyle === 'Ultra VIP';
        
        let additionalInfoHtml = `<li style="margin-bottom:4px;">Confirmation of availability for the dates mentioned.</li><li style="margin-bottom:4px;">Best available B2B/Net Rates.</li><li style="margin-bottom:4px;">Any special long-stay, VIP, or corporate rates if applicable.</li><li style="margin-bottom:4px;">Your standard Cancellation Policy.</li><li style="margin-bottom:4px;">Clear inclusions and exclusions for the quoted rates.</li>`;

        if (isHotelVendor) {
            additionalInfoHtml += `<li style="margin-bottom:4px;">Is Driver Accommodation (FOC) provided?</li><li style="margin-bottom:4px;">Are Driver Meals included?</li><li style="margin-bottom:4px;">Is on-site Parking included?</li><li style="margin-bottom:4px;">What are the Guide Room options (Free, Half Price, or None)?</li>`;
        }

        if (isTransportVendor) {
            additionalInfoHtml += `<li style="margin-bottom:4px;">Please include rates for the vehicle with driver and without driver.</li><li style="margin-bottom:4px;">Max km included for the day.</li><li style="margin-bottom:4px;">Vehicle details: Make, model, year of manufacture, and color.</li>`;
            if (isLuxury) {
                additionalInfoHtml += `<li style="margin-bottom:4px;">Minimum vehicle condition requirements: As this is a ${tripData.profile?.travelStyle} trip, please ensure pristine condition, leather interiors, recent models, working AC, bottled water provided, and professional driver.</li>`;
            }
        }

        const subject = `Quotation Request & Availability Check - ${vendorGroup}`;
        
        const bodyHtml = `
<p style="margin:0 0 16px;">Dear ${agentName},</p>
<p style="margin:0 0 16px;">Greetings from Nilathra Collection.</p>
<p style="margin:0 0 16px;">Nilathra Collection is a luxury and ultra-VIP travel concierge specializing in curated Sri Lankan journeys and bespoke hospitality experiences for discerning travelers from around the world.</p>
<p style="margin:0 0 16px;">We are currently organizing an itinerary for our valued clients and would appreciate it if you could provide your best available net rates along with availability confirmation for the following requirements:</p>
<hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0;" />
<h4 style="margin:0 0 12px;color:#333;">GUEST & BOOKING DETAILS</h4>
<p style="margin:0 0 24px;"><strong>Group Size:</strong> ${paxInfo}<br/><strong>Country of Origin:</strong> ${guestOrigin}</p>
<h4 style="margin:0 0 12px;color:#333;">SERVICES REQUESTED</h4>
<ul style="margin:0 0 24px;padding-left:20px;">${servicesHtml}</ul>
<hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0;" />
<h4 style="margin:0 0 12px;color:#333;">ADDITIONAL REQUIREMENTS</h4>
<ul style="margin:0 0 24px;padding-left:20px;">${additionalInfoHtml}</ul>
<p style="margin:0 0 16px;">We value our partnership and are looking forward to securing this booking. We anticipate bringing potential future business to your esteemed property/service as we continue to grow our operations.</p>
<p style="margin:0 0 16px;">Thank you for your prompt assistance. We await your timely response.</p>
<p style="margin:0;">Best Regards,<br/><strong>Operations Team</strong><br/>Nilathra Collection</p>
`.replace(/\n/g, '');

        setEmailDraft({
            vendorGroup,
            to: toEmail,
            subject,
            body: bodyHtml,
            referenceType: 'daily_activity',
            referenceId: items[0]?.block?.id || tripData.id || '',
            activityType: items[0]?.block?.type || '',
            allDailyActivityIds: items.map(i => i.block?.id).filter(Boolean)
        });
    };

    const handleSendDraft = async () => {
        if (!emailDraft) return;
        setSendingQuote(emailDraft.vendorGroup);
        try {
            const targets = emailDraft.recipients || [{
                id: undefined,
                name: emailDraft.vendorGroup,
                email: emailDraft.to
            }];

            for (const target of targets) {
                const formData = new FormData();
                formData.append('from', 'concierge@nilathra.com');
                formData.append('to', target.email);
                
                let subject = emailDraft.subject;
                subject = subject.replace(/__VENDOR_NAME__/gi, target.name);
                subject = subject.replace(/\[Supplier Name\]/gi, target.name);
                subject = subject.replace(/\[Vendor Name\]/gi, target.name);
                if (emailDraft.vendorGroup && emailDraft.vendorGroup !== "Alternative Suppliers") {
                    subject = subject.split(emailDraft.vendorGroup).join(target.name);
                }

                let body = emailDraft.body;
                body = body.replace(/__VENDOR_NAME__/gi, target.name);
                body = body.replace(/\[Supplier Name\]/gi, target.name);
                body = body.replace(/\[Vendor Name\]/gi, target.name);
                if (emailDraft.vendorGroup && emailDraft.vendorGroup !== "Alternative Suppliers") {
                    body = body.split(emailDraft.vendorGroup).join(target.name);
                }
                
                formData.append('subject', subject);
                formData.append('body', body);

                const res = await sendCustomEmailAction(formData);
                if (res.success) {
                    const activityBlock = tripData.itinerary.find(b => b.id === emailDraft.referenceId);
                    
                    await createQuotationRequestAction({
                        vendor_id: target.id,
                        vendor_name: target.name,
                        to_email: target.email,
                        from_email: 'concierge@nilathra.com',
                        subject: subject,
                        email_content: body,
                        daily_activity_id: emailDraft.referenceId,
                        daily_activity_ids: emailDraft.allDailyActivityIds,
                        tour_id: tripData.id || '',
                        itinerary_id: dbActivities.find(a => a.id === emailDraft.referenceId)?.itinerary_id || '',
                        activity_type: emailDraft.activityType || activityBlock?.type || ''
                    });

                    await logQuoteRequestAction(target.name, target.email, window.location.href, emailDraft.referenceId, emailDraft.referenceType);
                } else {
                    console.error(`Failed to send email to ${target.name}: ${res.error}`);
                    alert(`Failed to send email to ${target.name}: ${res.error}`);
                }
            }
            
            await fetchQuotationsForActivity(emailDraft.referenceId);
            const notifRes = await getMyNotificationsAction();
            if (notifRes.success) setNotifications(notifRes.data || []);
            
            alert(`Quotation request(s) sent successfully!`);
            setEmailDraft(null);
        } catch (error: any) {
            alert(`Error sending email: ${error.message || error}`);
        } finally {
            setSendingQuote(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-neutral-200">
                <RefreshCw className="animate-spin text-brand-gold w-8 h-8 mb-4" />
                <p className="text-neutral-500 text-sm">Loading Vendor Master Data...</p>
            </div>
        );
    }

    const guestBreakdown = `${tripData.profile?.adults || 0} Adults` +
        (tripData.profile?.children ? `, ${tripData.profile.children} Children` : '') +
        (tripData.profile?.infants ? `, ${tripData.profile.infants} Infants` : '');

    const guestOrigin = tripData.travelers?.[0]?.nationality || tripData.profile?.departureCountry || 'Origin Not Specified';

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-2xl font-serif text-brand-green flex items-center gap-2">
                        <Handshake className="text-brand-gold" /> Price Negotiation
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">Review reference prices, lock in negotiated supplier rates, and request driver/guide benefits.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="bg-neutral-50 p-6 border-b border-neutral-200 flex justify-between items-center">
                    <h4 className="font-semibold text-neutral-800 text-sm uppercase tracking-wide">Assigned Services</h4>
                    <span className="text-xs font-bold bg-brand-gold/10 text-brand-gold px-3 py-1 rounded-full uppercase tracking-widest">{negotiableItems.length} Items</span>
                </div>

                <div className="flex flex-col gap-6 p-6 bg-neutral-50/30">
                    {negotiableItems.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center opacity-70">
                            <AlertTriangle className="text-neutral-400 w-12 h-12 mb-4" />
                            <p className="text-neutral-500 font-medium">No assigned vendors found.</p>
                            <p className="text-sm text-neutral-400 mt-1">Assign vendors in the Itinerary Builder first.</p>
                        </div>
                    ) : (
                        (Object.entries(
                            negotiableItems.reduce((acc, item) => {
                                const vendor = item.vendorName || "Unknown Vendor";
                                if (!acc[vendor]) acc[vendor] = [];
                                acc[vendor].push(item);
                                return acc;
                            }, {} as Record<string, any[]>)
                        ) as [string, any[]][]).map(([vendorGroup, items]) => {
                            const hotelItem = items.find((i: any) => i.block?.type === 'sleep' && i.block?.hotelId);
                            const hotelId = hotelItem?.block?.hotelId;
                            const masterHotel = hotelId ? masterHotels.find((h: any) => h.id === hotelId) : null;
                            const masterTransport = masterTransports.find((t: any) => t.name === vendorGroup);

                            let assignedVendor: any = null;
                            if (hotelItem && masterHotel) {
                                assignedVendor = masterHotel;
                            } else if (masterTransport) {
                                assignedVendor = masterTransport;
                            } else {
                                const guideItem = items.find((i: any) => i.block?.type === 'guide');
                                const guideId = guideItem?.block?.guideId || tripData.defaultGuideId;
                                const masterGuide = guideId ? masterGuides.find((g: any) => g.id === guideId) : null;
                                
                                const restaurantItem = items.find((i: any) => i.block?.type === 'meal');
                                const restaurantId = restaurantItem?.block?.restaurantId;
                                const masterRestaurant = restaurantId ? masterRestaurants.find((r: any) => r.id === restaurantId) : null;

                                const activityItem = items.find((i: any) => i.block?.type === 'activity');
                                const vendorId = activityItem?.block?.vendorId;
                                const masterVendor = vendorId ? masterVendors.find((v: any) => v.id === vendorId) : null;

                                if (masterGuide && `${masterGuide.first_name} ${masterGuide.last_name || ''}`.trim() === vendorGroup) {
                                    assignedVendor = masterGuide;
                                } else if (masterRestaurant && masterRestaurant.name === vendorGroup) {
                                    assignedVendor = masterRestaurant;
                                } else if (masterVendor && masterVendor.name === vendorGroup) {
                                    assignedVendor = masterVendor;
                                }
                            }
                            
                            const hasContractedPrice = assignedVendor ? (assignedVendor.has_contracted_price !== false) : true;
                            const forceNegotiation = !!overrideNegotiation[vendorGroup];
                            const hasAlternativeSection = !hasContractedPrice || forceNegotiation;

                            return (
                            <div key={vendorGroup} className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            <Building2 className="text-brand-gold w-5 h-5" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-brand-charcoal text-lg leading-none">{vendorGroup}</h5>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2.5 text-xs text-neutral-500">
                                                <span className="flex items-center gap-1.5 font-bold bg-white px-2.5 py-1 rounded-md border border-neutral-200 shadow-sm uppercase tracking-wide">
                                                    <UserCheck size={12} className="text-brand-gold" />
                                                    {guestBreakdown}
                                                </span>
                                                <span className="flex items-center gap-1.5 font-bold bg-white px-2.5 py-1 rounded-md border border-neutral-200 shadow-sm uppercase tracking-wide">
                                                    <Compass size={12} className="text-brand-gold" />
                                                    {guestOrigin}
                                                </span>
                                                <span className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-md border shadow-sm uppercase tracking-wide ${hasContractedPrice ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                    {hasContractedPrice ? 'Contracted Rate' : 'Requires Quotation'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3 self-end md:self-auto w-full md:w-auto">
                                        <div className="flex items-center gap-3 flex-wrap justify-end">
                                            {(() => {
                                                const itemBlockIds = items.map(i => i.block?.id).filter(Boolean);
                                                const vendorNotif = notifications.find(n => 
                                                    n.reference_type === 'daily_activity' && 
                                                    itemBlockIds.includes(n.reference_id) && 
                                                    n.action_description === `Quotation request sent to ${vendorGroup}`
                                                );
                                                if (!vendorNotif) return null;
                                                const actionDate = new Date(vendorNotif.action_date);
                                                const dueDate = new Date(actionDate);
                                                dueDate.setDate(dueDate.getDate() + (vendorNotif.action_duration || 3));
                                                const isOverdue = new Date() > dueDate;
                                                return (
                                                    <div 
                                                        className={`w-3 h-3 rounded-full shadow-sm cursor-help ${isOverdue ? 'bg-red-500' : 'bg-green-500'}`}
                                                        title={`Status: ${vendorNotif.status} | Waiting: ${vendorNotif.action_waiting} | Sent: ${actionDate.toLocaleDateString()}`}
                                                    />
                                                );
                                            })()}
                                            <span className="text-xs font-bold bg-white border border-neutral-200 text-neutral-500 px-3 py-1.5 rounded-full shadow-sm">
                                                {items.length} {items.length === 1 ? 'Service' : 'Services'}
                                            </span>
                                            {hasContractedPrice && (
                                                <label className="flex items-center gap-2 text-xs font-bold text-neutral-600 bg-white px-3 py-1.5 rounded-full border border-neutral-200 shadow-sm cursor-pointer hover:bg-neutral-50 transition-colors">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={forceNegotiation} 
                                                        onChange={(e) => setOverrideNegotiation(prev => ({ ...prev, [vendorGroup]: e.target.checked }))} 
                                                        className="rounded border-neutral-300 text-brand-green focus:ring-brand-green w-3.5 h-3.5"
                                                    />
                                                    <span>Negotiate Rate</span>
                                                </label>
                                            )}
                                            {(!hasContractedPrice || forceNegotiation) && (
                                                <button
                                                    onClick={() => generateQuotationRequestEmail(vendorGroup, items)}
                                                    disabled={sendingQuote === vendorGroup}
                                                    className={`flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm transition-colors ${sendingQuote === vendorGroup ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                                >
                                                    {sendingQuote === vendorGroup ? (
                                                        <>
                                                            <RefreshCw size={14} className="animate-spin" />
                                                            Sending...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Mail size={14} />
                                                            Request Quote
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                            {(() => {
                                                const allFinalized = items.every((i: any) => i.block?.priceFinalized);
                                                const isFinalizing = finalizingGroup === vendorGroup;
                                                return (
                                                    <button
                                                        onClick={async () => {
                                                            setFinalizingGroup(vendorGroup);
                                                            try {
                                                                const blockIds = items.map((i: any) => i.block?.id).filter(Boolean);
                                                                const isFinalizing = !allFinalized;
                                                                const dbUpdates = items.map((item: any) => {
                                                                    if (!item.block?.id) return null;
                                                                    
                                                                    let finalTotal = 0;
                                                                    let quantity = 1;
                                                                    
                                                                    if (item.isHotelWithRooms && item.rooms) {
                                                                        quantity = item.rooms.reduce((sum: number, r: any) => sum + (r.quantity || 0), 0);
                                                                        finalTotal = item.rooms.reduce((sum: number, r: any) => {
                                                                            const rQty = r.quantity || 1;
                                                                            const rRef = (r.contractedPrice ?? r.pricePerNight ?? 0) * rQty;
                                                                            const rAgreed = r.agreedTotal !== undefined ? r.agreedTotal : rRef;
                                                                            return sum + rAgreed;
                                                                        }, 0);
                                                                    } else {
                                                                        quantity = item.quantity || 1;
                                                                        let enteredVal = item.agreedPrice;
                                                                        if (enteredVal === undefined) {
                                                                            const baseContractedPrice = item.block.contractedPrice ?? 0;
                                                                            enteredVal = ['meal', 'activity'].includes(item.block.type)
                                                                                ? baseContractedPrice
                                                                                : baseContractedPrice * quantity;
                                                                        }
                                                                        
                                                                        finalTotal = ['meal', 'activity'].includes(item.block?.type)
                                                                            ? (enteredVal * quantity)
                                                                            : enteredVal;
                                                                    }
                                                                    
                                                                    return {
                                                                        id: item.block.id,
                                                                        price_finalized: isFinalizing,
                                                                        contracted_price: quantity > 0 ? finalTotal / quantity : finalTotal,
                                                                        contracted_total_price: finalTotal
                                                                    };
                                                                }).filter(Boolean);

                                                                if (dbUpdates.length > 0) {
                                                                    const res = await finalizeActivityPricesAction(dbUpdates as any);
                                                                    if (!res.success) {
                                                                        alert("Failed to update prices: " + res.error);
                                                                        return;
                                                                    }
                                                                }
                                                                
                                                                const updatedItinerary = [...tripData.itinerary];
                                                                let updatedAccommodations = tripData.accommodations ? [...tripData.accommodations] : undefined;
                                                                const isFinalizingState = !allFinalized;

                                                                items.forEach((item: any) => {
                                                                    const idx = updatedItinerary.findIndex(b => b.id === item.block?.id);
                                                                    if (idx !== -1) {
                                                                        const block = updatedItinerary[idx];
                                                                        let newAgreed = block.agreedPrice;
                                                                        if (isFinalizing && !block.priceFinalized) {
                                                                            if (item.isHotelWithRooms && updatedAccommodations && item.accIndex !== -1) {
                                                                                const acc = { ...updatedAccommodations[item.accIndex] };
                                                                                if (acc.selectedRooms) {
                                                                                    acc.selectedRooms = acc.selectedRooms.map((room: any) => {
                                                                                        const roomRefPrice = room.pricePerNight ?? room.contractedPrice ?? 0;
                                                                                        const roomRefTotal = roomRefPrice * (room.quantity || 1);
                                                                                        const isRoomAgreedEdited = room.agreedTotal !== undefined && room.agreedTotal !== roomRefTotal;
                                                                                        if (!isRoomAgreedEdited) {
                                                                                            return { ...room, agreedTotal: (room.contractedPrice ?? room.pricePerNight ?? 0) * (room.quantity || 1) };
                                                                                        }
                                                                                        return room;
                                                                                    });
                                                                                    updatedAccommodations[item.accIndex] = acc;
                                                                                }
                                                                            } else {
                                                                                const isAgreedEdited = block.agreedPrice !== undefined && block.agreedPrice !== item.referenceTotal;
                                                                                if (!isAgreedEdited) {
                                                                                    const baseContractedPrice = block.contractedPrice ?? 0;
                                                                                    if (['meal', 'activity'].includes(block.type)) {
                                                                                        newAgreed = baseContractedPrice;
                                                                                    } else {
                                                                                        newAgreed = baseContractedPrice * item.quantity;
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                        updatedItinerary[idx] = { ...block, priceFinalized: isFinalizing, agreedPrice: newAgreed };
                                                                    }
                                                                });

                                                                if (isFinalizing) {
                                                                    setFinalizedIds(prev => {
                                                                        const next = new Set(prev);
                                                                        blockIds.forEach(id => next.add(id));
                                                                        return next;
                                                                    });
                                                                } else {
                                                                    setFinalizedIds(prev => {
                                                                        const next = new Set(prev);
                                                                        blockIds.forEach(id => next.delete(id));
                                                                        return next;
                                                                    });
                                                                }

                                                                const updates: any = { itinerary: updatedItinerary };
                                                                if (updatedAccommodations) {
                                                                    updates.accommodations = updatedAccommodations;
                                                                }
                                                                updateData(updates);

                                                                const nextTripData = { ...tripData, ...updates };
                                                                const saveRes = await savePlannerDataAction(tripData.id || '', nextTripData);
                                                                if (saveRes.success) {
                                                                    if (setIsDirty) setIsDirty(false);
                                                                } else {
                                                                    alert("Failed to save planner state: " + saveRes.error);
                                                                }
                                                            } catch (error) {
                                                                console.error("Error updating prices:", error);
                                                                alert("An error occurred while updating prices.");
                                                            } finally {
                                                                setFinalizingGroup(null);
                                                            }
                                                        }}
                                                        disabled={isFinalizing}
                                                        className={`flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm transition-colors ${
                                                            allFinalized 
                                                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                                                            : isFinalizing
                                                            ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                                                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                        }`}
                                                    >
                                                        {isFinalizing ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                        {allFinalized ? 'Price Open' : isFinalizing ? 'Updating...' : 'Finalize Price'}
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                
                                {masterHotel && (
                                    <div className="px-6 pb-4 bg-neutral-50 border-b border-neutral-200">
                                        <HotelContactForm 
                                            hotelId={masterHotel.id} 
                                            initialName={masterHotel.reservation_agent_name} 
                                            initialContact={masterHotel.reservation_agent_contact} 
                                            initialEmail={masterHotel.reservation_email} 
                                        />
                                    </div>
                                )}
                                
                                {masterTransport && !masterHotel && (
                                    <div className="px-6 pb-4 bg-neutral-50 border-b border-neutral-200">
                                        <TransportProviderContactForm 
                                            providerId={masterTransport.id} 
                                            initialPhone={masterTransport.phone} 
                                            initialEmail={masterTransport.email} 
                                        />
                                    </div>
                                )}

                                <div className="divide-y divide-neutral-100">
                                    {items.map(item => {
                                        const { id, block: b, title, vendorName, unitPrice, quantity, referenceTotal, icon, isHotelWithRooms, accIndex, rooms, agreedPrice, mealPlan } = item;

                                        let exactDateStr = "";
                                        if (tripData.profile?.arrivalDate) {
                                            const dateObj = new Date(tripData.profile.arrivalDate);
                                            dateObj.setDate(dateObj.getDate() + (b.dayNumber - 1));
                                            exactDateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                        }

                                        return (
                                            <div key={id} className="p-6 hover:bg-neutral-50/50 transition-colors">
                                                <div className="flex flex-col lg:flex-row gap-6 justify-between">

                                                    {/* Left: Info */}
                                                    <div className="flex gap-4 w-full lg:w-1/4 shrink-0">
                                                        <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center shrink-0">
                                                            {icon}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded uppercase tracking-wider">
                                                                    Day {b.dayNumber} {exactDateStr && `• ${exactDateStr}`}
                                                                </span>
                                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded uppercase tracking-wider">{b.type}</span>
                                                            </div>
                                                            <h5 className="font-bold text-brand-charcoal text-base">{title}</h5>
                                                        </div>
                                                    </div>

                                                    {/* Center/Right: Pricing & Negotiation */}
                                                    <div className="flex flex-col flex-1 shrink-0 gap-4">
                                                        {isHotelWithRooms ? (
                                                            <div className="space-y-4">
                                                                {rooms.map((room: any, rIdx: number) => {
                                                                    const roomRefPrice = room.pricePerNight ?? room.contractedPrice ?? 0;
                                                                    const roomRefTotal = roomRefPrice * (room.quantity || 1);
                                                                    let roomAgreedPrice = undefined;
                                                                    if (b.priceFinalized) {
                                                                        roomAgreedPrice = room.agreedTotal;
                                                                    } else {
                                                                        const isRoomAgreedEdited = room.agreedTotal !== undefined && room.agreedTotal !== roomRefTotal;
                                                                        if (isRoomAgreedEdited) {
                                                                            roomAgreedPrice = room.agreedTotal;
                                                                        } else {
                                                                            roomAgreedPrice = (room.contractedPrice ?? room.pricePerNight ?? 0) * (room.quantity || 1);
                                                                        }
                                                                    }
                                                                    const parsedReqType = room.reqId?.split('-')[0] || '';
                                                                    return (
                                                                        <div key={rIdx} className="flex flex-col md:flex-row flex-wrap items-stretch md:items-end gap-4 pb-4 border-b border-neutral-100 last:border-0 last:pb-0">
                                                                            <div className="flex-1 min-w-[120px]">
                                                                                <span className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1">Room Setup</span>
                                                                                <span className="block font-mono font-bold text-neutral-700 text-sm">
                                                                                    {parsedReqType} ({room.roomName})
                                                                                    <span className="text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded text-[10px] ml-2 tracking-wider">{room.mealPlan || 'BB'}</span>
                                                                                </span>
                                                                            </div>

                                                                            <div className="flex flex-col justify-center bg-neutral-50 px-4 py-2 rounded-xl border border-neutral-100 min-w-[180px] shrink-0">
                                                                                <span className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1">Reference Pricing</span>
                                                                                <div className="flex items-center gap-2 text-sm justify-between w-full">
                                                                                    <span className="font-mono text-neutral-500">{roomRefPrice > 0 ? `$${roomRefPrice.toLocaleString()}` : '-'}</span>
                                                                                    <span className="text-neutral-400 text-xs font-bold">× {room.quantity}</span>
                                                                                    <span className="text-neutral-300 font-bold">=</span>
                                                                                    <span className="font-mono font-bold text-brand-charcoal">{roomRefTotal > 0 ? `$${roomRefTotal.toLocaleString()}` : '-'}</span>
                                                                                </div>
                                                                            </div>

                                                                            <div className="w-[140px] shrink-0">
                                                                                <label className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1">Final Price</label>
                                                                                <div className="relative">
                                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-sm">$</span>
                                                                                    <input
                                                                                        type="number"
                                                                                        value={roomAgreedPrice || ''}
                                                                                        disabled={item.block?.priceFinalized}
                                                                                        onChange={(e) => handleRoomUpdate(accIndex, rIdx, e.target.value ? Number(e.target.value) : undefined)}
                                                                                        className="w-full pl-12 pr-4 py-2.5 bg-white border border-brand-gold/50 rounded-xl text-sm font-bold text-brand-charcoal outline-none transition-all shadow-sm disabled:bg-neutral-50 disabled:text-neutral-400 disabled:border-neutral-200"
                                                                                        placeholder="Total agreed..."
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            {/* Discount Delta per Room */}
                                                                            {roomAgreedPrice && roomAgreedPrice < roomRefTotal ? (
                                                                                <div className="bg-green-50 px-4 py-2.5 rounded-xl border border-green-200 text-center shrink-0 w-full md:w-auto flex flex-col justify-center">
                                                                                    <span className="block text-[10px] text-green-600 uppercase font-bold tracking-wider mb-1">Discount</span>
                                                                                    <span className="block font-mono font-bold text-green-700">-$ {(roomRefTotal - roomAgreedPrice).toLocaleString()}</span>
                                                                                </div>
                                                                            ) : roomAgreedPrice && roomAgreedPrice > roomRefTotal ? (
                                                                                <div className="bg-red-50 px-4 py-2.5 rounded-xl border border-red-200 text-center shrink-0 w-full md:w-auto flex flex-col justify-center">
                                                                                    <span className="block text-[10px] text-red-600 uppercase font-bold tracking-wider mb-1">Markup</span>
                                                                                    <span className="block font-mono font-bold text-red-700">+$ {(roomAgreedPrice - roomRefTotal).toLocaleString()}</span>
                                                                                </div>
                                                                            ) : null}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col md:flex-row flex-wrap items-stretch md:items-end gap-4 pb-2">
                                                                {mealPlan && b.type === 'sleep' && (
                                                                    <div className="flex flex-col justify-center bg-brand-gold/5 px-4 py-2 rounded-xl border border-brand-gold/20 shrink-0">
                                                                        <span className="block text-[10px] text-brand-gold uppercase font-bold tracking-wider mb-1">Meal Plan</span>
                                                                        <span className="font-mono font-bold text-brand-charcoal text-sm">{mealPlan}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-col justify-center bg-neutral-50 px-4 py-2 rounded-xl border border-neutral-100 min-w-[180px] shrink-0">
                                                                    <span className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1">Reference Pricing</span>
                                                                    <div className="flex items-center gap-2 text-sm justify-between w-full">
                                                                        <span className="font-mono text-neutral-500">{unitPrice === 'Mixed' ? 'Mixed' : (unitPrice > 0 ? `$${unitPrice.toLocaleString()}` : '-')}</span>
                                                                        <span className="text-neutral-400 text-xs font-bold">× {quantity}</span>
                                                                        <span className="text-neutral-300 font-bold">=</span>
                                                                        <span className="font-mono font-bold text-brand-charcoal">{referenceTotal > 0 ? `$${referenceTotal.toLocaleString()}` : '-'}</span>
                                                                    </div>
                                                                </div>

                                                                {/* Negotiated Price Input */}
                                                                <div className="w-[140px] shrink-0">
                                                                    <label className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1">Final Price</label>
                                                                    <div className="relative">
                                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-sm">$</span>
                                                                        <input
                                                                            type="number"
                                                                            value={agreedPrice || ''}
                                                                            disabled={b.priceFinalized}
                                                                            onChange={(e) => handleBlockUpdate(b.id, { agreedPrice: e.target.value ? Number(e.target.value) : undefined }, quantity)}
                                                                            className="w-full pl-12 pr-4 py-2.5 bg-white border border-brand-gold/50 rounded-xl text-sm font-bold text-brand-charcoal focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold outline-none transition-all shadow-sm disabled:bg-neutral-50 disabled:text-neutral-400 disabled:border-neutral-200"
                                                                            placeholder="Enter total agreed..."
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Discount Delta */}
                                                                {(() => {
                                                                    if (agreedPrice === undefined) return null;
                                                                    const agreedTotal = ['meal', 'activity'].includes(b.type) ? (agreedPrice * quantity) : agreedPrice;
                                                                    if (agreedTotal < referenceTotal) {
                                                                        return (
                                                                            <div className="bg-green-50 px-4 py-2.5 rounded-xl border border-green-200 text-center shrink-0 flex flex-col justify-center">
                                                                                <span className="block text-[10px] text-green-600 uppercase font-bold tracking-wider mb-1">Discount</span>
                                                                                <span className="block font-mono font-bold text-green-700">
                                                                                    -$ {(referenceTotal - agreedTotal).toLocaleString()}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    } else if (agreedTotal > referenceTotal) {
                                                                        return (
                                                                            <div className="bg-red-50 px-4 py-2.5 rounded-xl border border-red-200 text-center shrink-0 flex flex-col justify-center">
                                                                                <span className="block text-[10px] text-red-600 uppercase font-bold tracking-wider mb-1">Markup</span>
                                                                                <span className="block font-mono font-bold text-red-700">
                                                                                    +$ {(agreedTotal - referenceTotal).toLocaleString()}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })()}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Specialized Flags */}
                                                    <div className="w-full lg:w-[250px] shrink-0 flex flex-col gap-2 lg:border-l border-neutral-200 lg:pl-6">
                                                        {/* Meal Flags */}
                                                        {(b.type === 'meal' || b.type === 'sleep' || b.type === 'activity') && (
                                                            <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer hover:text-brand-green transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!b.driverMealIncluded}
                                                                    disabled={b.priceFinalized}
                                                                    onChange={(e) => handleBlockUpdate(b.id, { driverMealIncluded: e.target.checked })}
                                                                    className="rounded border-neutral-300 text-brand-green focus:ring-brand-green w-4 h-4 disabled:opacity-50"
                                                                />
                                                                <span className="font-medium">Driver Meal Included</span>
                                                            </label>
                                                        )}

                                                        {/* Sleep/Hotel Flags */}
                                                        {b.type === 'sleep' && (
                                                            <>
                                                                <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer hover:text-brand-green transition-colors">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!b.driverAccIncluded}
                                                                        disabled={b.priceFinalized}
                                                                        onChange={(e) => handleBlockUpdate(b.id, { driverAccIncluded: e.target.checked })}
                                                                        className="rounded border-neutral-300 text-brand-green focus:ring-brand-green w-4 h-4 disabled:opacity-50"
                                                                    />
                                                                    <span className="font-medium">Driver Accom. (FOC)</span>
                                                                </label>

                                                                <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer hover:text-brand-green transition-colors">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!b.parkingIncluded}
                                                                        disabled={b.priceFinalized}
                                                                        onChange={(e) => handleBlockUpdate(b.id, { parkingIncluded: e.target.checked })}
                                                                        className="rounded border-neutral-300 text-brand-green focus:ring-brand-green w-4 h-4 disabled:opacity-50"
                                                                    />
                                                                    <span className="font-medium">Parking Included</span>
                                                                </label>

                                                                <div className="mt-1 pt-2 border-t border-neutral-100">
                                                                    <span className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1.5">Guide Room Option</span>
                                                                    <div className="flex gap-2">
                                                                        {['Free', 'Half Price', 'None'].map(opt => (
                                                                            <button
                                                                                key={opt}
                                                                                disabled={b.priceFinalized}
                                                                                onClick={() => handleBlockUpdate(b.id, { guideRoomDiscount: opt as any })}
                                                                                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${b.guideRoomDiscount === opt ? 'bg-brand-gold text-white border-brand-gold' : 'bg-white text-neutral-500 border-neutral-200 hover:border-brand-gold/50'}`}
                                                                            >
                                                                                {opt}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}

                                                        {b.type !== 'meal' && b.type !== 'sleep' && b.type !== 'activity' && (
                                                            <span className="text-xs text-neutral-400 italic flex items-center gap-1">
                                                                <Info size={12} /> No specialized flags for this category.
                                                            </span>
                                                        )}
                                                    </div>

                                                </div>

                                            </div>
                                        );
                                    })}
                                </div>

                                {hasAlternativeSection && (
                                    <div className="p-6 bg-neutral-50 border-t border-neutral-200 space-y-6">
                                        {/* Alternative Supplier Selector */}
                                        {(() => {
                                            const mainItem = items[0];
                                            const firstId = mainItem?.id;
                                            const mainType = mainItem?.block?.type || 'sleep';
                                            const altSuppliers = getCategorySuppliers(mainType, mainItem?.block);
                                            if (altSuppliers.length === 0) return null;
                                            return (
                                                <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
                                                    <span className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Request quotations from other suppliers for the entire block:</span>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-40 overflow-y-auto mb-4">
                                                        {altSuppliers.map(s => {
                                                            const sId = s.id;
                                                            const sName = s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim();
                                                            const isChecked = (selectedAlternativeVendors[vendorGroup] || []).includes(sId);
                                                            return (
                                                                <label key={sId} className="flex items-center gap-2 text-xs font-medium text-neutral-600 cursor-pointer hover:text-neutral-900">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={(e) => {
                                                                            const current = selectedAlternativeVendors[vendorGroup] || [];
                                                                            if (e.target.checked) {
                                                                                setSelectedAlternativeVendors(prev => ({ ...prev, [vendorGroup]: [...current, sId] }));
                                                                            } else {
                                                                                setSelectedAlternativeVendors(prev => ({ ...prev, [vendorGroup]: current.filter(x => x !== sId) }));
                                                                            }
                                                                        }}
                                                                        className="rounded border-neutral-300 text-brand-green focus:ring-brand-green w-3.5 h-3.5"
                                                                    />
                                                                    <span>{sName}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                    <button
                                                        onClick={() => handleGenerateMultiQuoteEmail(items, altSuppliers.filter(s => (selectedAlternativeVendors[vendorGroup] || []).includes(s.id)))}
                                                        disabled={(selectedAlternativeVendors[vendorGroup] || []).length === 0}
                                                        className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:bg-neutral-100 disabled:text-neutral-400 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                                                    >
                                                        <Mail size={14} /> Request Quotations ({(selectedAlternativeVendors[vendorGroup] || []).length})
                                                    </button>
                                                </div>
                                            );
                                        })()}
                                        
                                        {/* Negotiation Dashboard comparison table */}
                                        {(() => {
                                            const firstId = items[0]?.id;
                                            if (!firstId) return null;
                                            const groupQuotes = quotations[firstId] || [];
                                            if (groupQuotes.length === 0) return null;
                                            return (
                                                <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                                    <div className="bg-neutral-50 px-4 py-2.5 border-b border-neutral-200">
                                                        <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Negotiation Dashboard ({groupQuotes.length} Requests for entire block)</span>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left text-xs border-collapse">
                                                            <thead>
                                                                <tr className="bg-neutral-50/50 border-b border-neutral-200 text-neutral-400 font-bold uppercase text-[9px] tracking-wider">
                                                                    <th className="p-3">Vendor</th>
                                                                    <th className="p-3">Sent Date</th>
                                                                    <th className="p-3 w-32">Status</th>
                                                                    <th className="p-3 w-28">Quote ($)</th>
                                                                    <th className="p-3">Notes</th>
                                                                    <th className="p-3 text-right">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-neutral-100">
                                                                {groupQuotes.map((q: any) => {
                                                                    const qId = q.id;
                                                                    const isQuoteSelected = q.selected_vendor;
                                                                    const linkedBooking = bookings.find(b => b.quotation_request_id === qId);
                                                                    
                                                                    const currentPrice = editingQuotePrice[qId] !== undefined ? editingQuotePrice[qId] : (q.quoted_price || '');
                                                                    const currentNotes = editingQuoteNotes[qId] !== undefined ? editingQuoteNotes[qId] : (q.notes || '');

                                                                    return (
                                                                        <tr key={qId} className={`hover:bg-neutral-50/30 transition-colors ${isQuoteSelected ? 'bg-green-50/30 font-semibold' : ''}`}>
                                                                            <td className="p-3 flex items-center gap-1.5 font-bold text-brand-charcoal">
                                                                                {isQuoteSelected && <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />}
                                                                                <span>{q.vendor_name}</span>
                                                                            </td>
                                                                            <td className="p-3 text-neutral-500">
                                                                                <div>{new Date(q.sent_date).toLocaleDateString()}</div>
                                                                                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">{q.to_email}</div>
                                                                            </td>
                                                                            <td className="p-3">
                                                                                <select
                                                                                    value={q.status}
                                                                                    onChange={(e) => handleUpdateQuotation(qId, firstId, e.target.value)}
                                                                                    className="bg-transparent border border-neutral-200 rounded px-2 py-1 text-xs outline-none focus:border-brand-gold bg-white"
                                                                                >
                                                                                    {['Sent', 'Replied', 'Declined', 'Expired', 'Selected'].map(st => (
                                                                                        <option key={st} value={st}>{st}</option>
                                                                                    ))}
                                                                                </select>
                                                                            </td>
                                                                            <td className="p-3">
                                                                                <div className="relative">
                                                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400">$</span>
                                                                                    <input
                                                                                        type="number"
                                                                                        value={currentPrice}
                                                                                        onChange={(e) => setEditingQuotePrice(prev => ({ ...prev, [qId]: e.target.value }))}
                                                                                        onBlur={() => handleUpdateQuotation(qId, firstId)}
                                                                                        placeholder="Price"
                                                                                        className="w-full pl-5 pr-2 py-1 border border-neutral-200 rounded text-xs outline-none focus:border-brand-gold bg-white font-bold"
                                                                                    />
                                                                                </div>
                                                                            </td>
                                                                            <td className="p-3">
                                                                                <input
                                                                                    type="text"
                                                                                    value={currentNotes}
                                                                                    onChange={(e) => setEditingQuoteNotes(prev => ({ ...prev, [qId]: e.target.value }))}
                                                                                    onBlur={() => handleUpdateQuotation(qId, firstId)}
                                                                                    placeholder="Add remarks..."
                                                                                    className="w-full px-2 py-1 border border-neutral-200 rounded text-xs outline-none focus:border-brand-gold bg-white"
                                                                                />
                                                                            </td>
                                                                            <td className="p-3 text-right">
                                                                                <div className="flex items-center justify-end gap-2">
                                                                                    {linkedBooking ? (
                                                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                                                                                            linkedBooking.status === 'Went Ahead' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                                            linkedBooking.status === 'Confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                                            linkedBooking.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200 line-through' :
                                                                                            'bg-amber-50 text-amber-700 border-amber-200'
                                                                                        }`}>
                                                                                            Booking: {linkedBooking.status}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <button
                                                                                            onClick={() => handleProceedToBooking(q, items)}
                                                                                            disabled={!q.quoted_price || updatingQuoteId === qId}
                                                                                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded transition-colors disabled:opacity-50"
                                                                                        >
                                                                                            Book Service
                                                                                        </button>
                                                                                    )}
                                                                                    <button
                                                                                        onClick={() => handleSelectQuotation(q, items)}
                                                                                        disabled={isQuoteSelected || !q.quoted_price || updatingQuoteId === qId}
                                                                                        className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors ${isQuoteSelected ? 'bg-green-100 text-green-700 cursor-default border border-green-200' : 'bg-brand-charcoal text-white hover:bg-black disabled:bg-neutral-100 disabled:text-neutral-400'}`}
                                                                                    >
                                                                                        {isQuoteSelected ? 'Selected' : 'Apply Quote'}
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        );
                    })
                    )}
                </div>
            </div>
            {emailDraft && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-brand-charcoal text-white">
                            <h3 className="text-lg font-bold font-playfair tracking-wide flex items-center gap-2">
                                <Mail size={18} className="text-brand-gold" />
                                Review Quotation Request: {emailDraft.vendorGroup}
                            </h3>
                            <button onClick={() => setEmailDraft(null)} className="text-neutral-400 hover:text-white transition-colors text-xl leading-none">
                                &times;
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">To</label>
                                    <input 
                                        type="email" 
                                        value={emailDraft.to} 
                                        onChange={e => setEmailDraft({...emailDraft, to: e.target.value})} 
                                        className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-brand-gold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Subject</label>
                                    <input 
                                        type="text" 
                                        value={emailDraft.subject} 
                                        onChange={e => setEmailDraft({...emailDraft, subject: e.target.value})} 
                                        className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-brand-gold"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col flex-1 min-h-[300px]">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Message Body</label>
                                    <button type="button" onClick={() => setShowHtml(!showHtml)} className="text-xs flex items-center gap-1 text-neutral-500 hover:text-brand-charcoal transition-colors">
                                        <Code size={14} /> {showHtml ? "View Formatted" : "View HTML Source"}
                                    </button>
                                </div>
                                {showHtml ? (
                                    <textarea
                                        value={emailDraft.body}
                                        onChange={e => {
                                            setEmailDraft({...emailDraft, body: e.target.value});
                                            if (editorRef.current) {
                                                editorRef.current.innerHTML = e.target.value;
                                            }
                                        }}
                                        className="w-full flex-1 px-4 py-3 text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-brand-gold resize-none"
                                    />
                                ) : (
                                    <div
                                        ref={editorRef}
                                        contentEditable
                                        onInput={handleInput}
                                        onBlur={handleInput}
                                        className="w-full flex-1 bg-neutral-50 border border-neutral-200 text-brand-charcoal rounded-xl p-4 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all overflow-y-auto prose prose-sm max-w-none"
                                    />
                                )}
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3">
                            <button 
                                onClick={() => setEmailDraft(null)}
                                className="px-5 py-2 rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSendDraft}
                                disabled={sendingQuote === emailDraft.vendorGroup}
                                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-colors ${
                                    sendingQuote === emailDraft.vendorGroup 
                                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' 
                                    : 'bg-brand-charcoal text-white hover:bg-black shadow-lg hover:shadow-xl'
                                }`}
                            >
                                {sendingQuote === emailDraft.vendorGroup ? (
                                    <>
                                        <RefreshCw size={16} className="animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail size={16} />
                                        Send Email
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showBookingModal && selectedQuoteForBooking && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] border border-neutral-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="bg-brand-charcoal p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Building2 className="text-brand-gold" size={24} />
                                <div>
                                    <h3 className="text-lg font-bold font-serif">Create Service Booking</h3>
                                    <p className="text-xs text-neutral-400">Lock in rates and terms with {selectedQuoteForBooking.vendor_name}</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setShowBookingModal(false)} className="text-neutral-400 hover:text-white transition-colors">
                                <X size={20} className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleCreateBooking} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 font-semibold">Vendor Name</label>
                                    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm font-semibold text-brand-charcoal">{selectedQuoteForBooking.vendor_name}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 font-semibold">Agreed Price</label>
                                    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm font-bold text-brand-charcoal">${(selectedQuoteForBooking.quoted_price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} {selectedQuoteForBooking.currency || 'USD'}</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 font-semibold">Cancellation Free Deadline</label>
                                <input
                                    type="datetime-local"
                                    value={bookingCancellationDeadline}
                                    onChange={(e) => setBookingCancellationDeadline(e.target.value)}
                                    className="w-full bg-neutral-50 border border-neutral-200 text-brand-charcoal rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all"
                                />
                                <span className="text-[10px] text-neutral-400 block mt-1">Critical: Enter date before which cancellation can be made without contract penalty.</span>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1 font-semibold">Cancellation Policy Summary</label>
                                <textarea
                                    rows={3}
                                    value={bookingCancellationPolicy}
                                    onChange={(e) => setBookingCancellationPolicy(e.target.value)}
                                    placeholder="e.g. Free cancellation up to 72 hours before check-in. 100% charge applies thereafter."
                                    className="w-full bg-neutral-50 border border-neutral-200 text-brand-charcoal rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none transition-all"
                                />
                            </div>

                            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-xs text-neutral-600 space-y-2">
                                <div className="font-semibold text-neutral-800">Linked Itinerary Activities:</div>
                                <ul className="list-disc list-inside space-y-1">
                                    {selectedGroupItemsForBooking.map((item, idx) => (
                                        <li key={idx}>Day {item.block?.dayNumber || 1}: {item.title || 'Service'}</li>
                                    ))}
                                </ul>
                            </div>

                            {/* Footer Buttons */}
                            <div className="pt-4 border-t border-neutral-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowBookingModal(false)}
                                    className="px-5 py-2 rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreatingBooking}
                                    className="flex items-center gap-2 px-6 py-2 bg-brand-gold hover:bg-yellow-600 disabled:bg-neutral-200 text-white rounded-xl text-sm font-bold transition-all shadow-md"
                                >
                                    {isCreatingBooking ? (
                                        <>
                                            <RefreshCw size={16} className="animate-spin" />
                                            Booking...
                                        </>
                                    ) : (
                                        <>
                                            <FileText size={16} />
                                            Book & Raise PO
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
