"use client";

import { TripData, InternalItineraryBlock } from "../types";
import { Handshake, Building2, Utensils, Car, Compass, UserCheck, RefreshCw, AlertTriangle, Info, FileText, Mail, Code, CheckCircle2 } from "lucide-react";
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
    finalizeActivityPricesAction
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

export function PriceNegotiationStep({ tripData, updateData }: { tripData: TripData, updateData: (d: Partial<TripData>) => void }) {
    const [isLoading, setIsLoading] = useState(true);

    const [masterHotels, setMasterHotels] = useState<any[]>([]);
    const [masterVendors, setMasterVendors] = useState<any[]>([]);
    const [masterTransports, setMasterTransports] = useState<any[]>([]);
    const [masterGuides, setMasterGuides] = useState<any[]>([]);
    const [masterRestaurants, setMasterRestaurants] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        const fetchMasterData = async () => {
            setIsLoading(true);
            try {
                const [hotelsRes, vendorsRes, transportsRes, guidesRes, restRes, nRes] = await Promise.all([
                    getHotelsListAction(),
                    getVendorsAction(),
                    getTransportProvidersAction(),
                    getTourGuidesAction(),
                    getRestaurantsAction(),
                    getMyNotificationsAction()
                ]);

                if (hotelsRes.success) setMasterHotels(hotelsRes.hotels || []);
                if (vendorsRes.success) setMasterVendors(vendorsRes.vendors || []);
                if (transportsRes.success) setMasterTransports(transportsRes.providers || []);
                if (guidesRes.success) setMasterGuides(guidesRes.guides || []);
                if (restRes.success) setMasterRestaurants(restRes.restaurants || []);
                if (nRes.success) setNotifications(nRes.data || []);
            } catch (err) {
                console.error("Failed to fetch initial data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMasterData();
    }, []);

    const negotiableItems = useMemo(() => {
        let items: any[] = [];
        tripData.itinerary.forEach(b => {
            let vendorName = "Unknown Vendor";
            let unitPrice = b.contractedPrice ?? 0;
            let quantity = 1;
            let referenceTotal = 0;
            let icon: React.ReactNode = <Compass size={18} />;

            if (b.type === 'sleep' && b.hotelId) {
                const hId = b.hotelId;
                const hotel = masterHotels.find(h => h.id === hId);
                if (hotel) vendorName = hotel.name;
                const accIndex = tripData.accommodations?.findIndex(a => a.nightIndex === b.dayNumber && (a.hotelId === hId || a.hotelName === hotel?.name)) ?? -1;
                const acc = accIndex !== -1 ? tripData.accommodations![accIndex] : null;

                if (acc && acc.selectedRooms && acc.selectedRooms.length > 0) {
                    items.push({
                        id: b.id,
                        block: b,
                        title: b.name,
                        vendorName,
                        icon: <Building2 size={18} className="text-blue-500" />,
                        isHotelWithRooms: true,
                        accIndex,
                        rooms: acc.selectedRooms
                    });
                    return; // Skip normal block push
                } else if (acc) {
                    if (unitPrice === 0) unitPrice = acc.pricePerNight || 0;
                    quantity = acc.numberOfRooms || 1;
                    referenceTotal = unitPrice * quantity;
                    items.push({
                        id: b.id, block: b, title: b.name, vendorName, icon: <Building2 size={18} className="text-blue-500" />, unitPrice, quantity, referenceTotal, agreedPrice: b.agreedPrice, mealPlan: acc.mealPlan || 'BB'
                    });
                    return;
                }
            } else if (b.type === 'meal' && b.restaurantId) {
                const rId = b.restaurantId;
                const rest = masterRestaurants.find(r => r.id === rId);
                if (rest) {
                    vendorName = rest.name;
                    if (unitPrice === 0) unitPrice = rest.lunch_rate_per_head || 0;
                }
                quantity = b.restaurantQuantity || (tripData.profile?.adults || 1) + (tripData.profile?.children || 0);
                referenceTotal = unitPrice * quantity;
                items.push({ id: b.id, block: b, title: b.name, vendorName, icon: <Utensils size={18} className="text-orange-500" />, unitPrice, quantity, referenceTotal, agreedPrice: b.agreedPrice });
            } else if (b.type === 'travel' && (b.transportId || b.vehicleId || b.driverId || tripData.defaultTransportId || tripData.defaultVehicleId || tripData.defaultDriverId)) {
                const tId = b.transportId || tripData.defaultTransportId;
                const trans = masterTransports.find(t => t.id === tId);
                if (trans) {
                    vendorName = trans.name;
                    const vId = b.vehicleId || tripData.defaultVehicleId;
                    const veh = trans.transport_vehicles?.find((v: any) => v.id === vId);
                    if (veh && unitPrice === 0) unitPrice = veh.per_km_rate || veh.day_rate || 0;
                }
                if (b.contractedPrice !== undefined) {
                    quantity = b.transportQuantity || 1;
                } else {
                    const parsedDistance = parseFloat(b.distance?.replace(/[^0-9.]/g, '') || '0');
                    quantity = parsedDistance > 0 ? parsedDistance : 1;
                }
                referenceTotal = unitPrice * quantity;
                items.push({ id: b.id, block: b, title: b.name, vendorName, icon: <Car size={18} className="text-indigo-500" />, unitPrice, quantity, referenceTotal, agreedPrice: b.agreedPrice });
            } else if (b.type === 'guide' && (b.guideId || tripData.defaultGuideId)) {
                const gId = b.guideId || tripData.defaultGuideId;
                const guide = masterGuides.find(g => g.id === gId);
                if (guide) {
                    vendorName = `${guide.first_name} ${guide.last_name || ''}`.trim();
                    if (unitPrice === 0) unitPrice = guide.per_day_rate || 0;
                }
                quantity = 1;
                referenceTotal = unitPrice * quantity;
                items.push({ id: b.id, block: b, title: b.name, vendorName, icon: <UserCheck size={18} className="text-purple-500" />, unitPrice, quantity, referenceTotal, agreedPrice: b.agreedPrice });
            } else if (b.type === 'activity' && (b.vendorId || b.vendorActivityId)) {
                const vId = b.vendorId;
                const vend = masterVendors.find(v => v.id === vId);
                if (vend) vendorName = vend.name;
                const actBooking = tripData.activities.find(a => a.activityId === b.activityId);
                if (actBooking && (actBooking.activityData as any).price && unitPrice === 0) {
                    unitPrice = (actBooking.activityData as any).price;
                }
                quantity = b.transportQuantity || ((tripData.profile?.adults || 1) + (tripData.profile?.children || 0));
                referenceTotal = unitPrice * quantity;
                items.push({ id: b.id, block: b, title: b.name, vendorName, icon: <Compass size={18} className="text-green-500" />, unitPrice, quantity, referenceTotal, agreedPrice: b.agreedPrice });
            }
        });
        return items;
    }, [tripData.itinerary, tripData.accommodations, tripData.activities, tripData.defaultDriverId, tripData.defaultGuideId, tripData.defaultTransportId, tripData.defaultVehicleId, masterHotels, masterRestaurants, masterTransports, masterGuides, masterVendors]);

    const handleBlockUpdate = (blockId: string, updates: Partial<InternalItineraryBlock>) => {
        const updatedItinerary = tripData.itinerary.map(b =>
            b.id === blockId ? { ...b, ...updates } : b
        );
        updateData({ itinerary: updatedItinerary });
    };

    const handleRoomUpdate = (accIndex: number, roomIndex: number, agreedTotal: number | undefined) => {
        if (!tripData.accommodations) return;
        const updatedAccs = [...tripData.accommodations];
        const acc = updatedAccs[accIndex];
        if (acc && acc.selectedRooms) {
            const rooms = [...acc.selectedRooms];
            rooms[roomIndex] = { ...rooms[roomIndex], agreedTotal };
            updatedAccs[accIndex] = { ...acc, selectedRooms: rooms };
            updateData({ accommodations: updatedAccs });
        }
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
            referenceId: items[0]?.block?.id || tripData.id || ''
        });
    };

    const handleSendDraft = async () => {
        if (!emailDraft) return;
        setSendingQuote(emailDraft.vendorGroup);
        try {
            const formData = new FormData();
            formData.append('from', 'concierge@nilathra.com');
            formData.append('to', emailDraft.to);
            formData.append('subject', emailDraft.subject);
            
            // Pass the HTML directly as the body
            formData.append('body', emailDraft.body);

            const res = await sendCustomEmailAction(formData);
            if (res.success) {
                await logQuoteRequestAction(emailDraft.vendorGroup, emailDraft.to, window.location.href, emailDraft.referenceId, emailDraft.referenceType);
                const notifRes = await getMyNotificationsAction();
                if (notifRes.success) setNotifications(notifRes.data || []);
                
                alert(`Quotation request sent successfully to ${emailDraft.vendorGroup} (${emailDraft.to})!`);
                setEmailDraft(null);
            } else {
                alert(`Failed to send email: ${res.error}`);
            }
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
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3 self-end md:self-auto w-full md:w-auto">
                                        <div className="flex items-center gap-3">
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
                                            {(() => {
                                                const allFinalized = items.every((i: any) => i.block?.priceFinalized);
                                                const isFinalizing = finalizingGroup === vendorGroup;
                                                return (
                                                    <button
                                                        onClick={async () => {
                                                            setFinalizingGroup(vendorGroup);
                                                            try {
                                                                const blockIds = items.map((i: any) => i.block?.id).filter(Boolean);
                                                                if (blockIds.length > 0) {
                                                                    const res = await finalizeActivityPricesAction(blockIds);
                                                                    if (!res.success) {
                                                                        alert("Failed to finalize prices: " + res.error);
                                                                        return;
                                                                    }
                                                                }
                                                                const updatedItinerary = [...tripData.itinerary];
                                                                items.forEach((item: any) => {
                                                                    const idx = updatedItinerary.findIndex(b => b.id === item.block?.id);
                                                                    if (idx !== -1) {
                                                                        updatedItinerary[idx] = { ...updatedItinerary[idx], priceFinalized: true };
                                                                    }
                                                                });
                                                                updateData({ itinerary: updatedItinerary });
                                                            } catch (error) {
                                                                console.error("Error finalizing prices:", error);
                                                                alert("An error occurred while finalizing prices.");
                                                            } finally {
                                                                setFinalizingGroup(null);
                                                            }
                                                        }}
                                                        disabled={allFinalized || isFinalizing}
                                                        className={`flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm transition-colors ${
                                                            allFinalized 
                                                            ? 'bg-green-100 text-green-700 cursor-not-allowed' 
                                                            : isFinalizing
                                                            ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                                                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                        }`}
                                                    >
                                                        {isFinalizing ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                        {allFinalized ? 'Price Finalized' : isFinalizing ? 'Finalizing...' : 'Finalize Price'}
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
                                                                    const roomRefPrice = room.contractedPrice ?? room.pricePerNight ?? 0;
                                                                    const roomRefTotal = roomRefPrice * (room.quantity || 1);
                                                                    const roomAgreedPrice = room.agreedTotal !== undefined ? room.agreedTotal : ((room.pricePerNight ?? room.contractedPrice ?? 0) * (room.quantity || 1));
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
                                                                                        onChange={(e) => handleRoomUpdate(accIndex, rIdx, e.target.value ? Number(e.target.value) : undefined)}
                                                                                        className="w-full pl-12 pr-4 py-2.5 bg-white border border-brand-gold/50 rounded-xl text-sm font-bold text-brand-charcoal outline-none transition-all shadow-sm"
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
                                                                            onChange={(e) => handleBlockUpdate(b.id, { agreedPrice: e.target.value ? Number(e.target.value) : undefined })}
                                                                            className="w-full pl-12 pr-4 py-2.5 bg-white border border-brand-gold/50 rounded-xl text-sm font-bold text-brand-charcoal focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold outline-none transition-all shadow-sm"
                                                                            placeholder="Enter total agreed..."
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Discount Delta */}
                                                                {agreedPrice && agreedPrice < referenceTotal ? (
                                                                    <div className="bg-green-50 px-4 py-2.5 rounded-xl border border-green-200 text-center shrink-0 flex flex-col justify-center">
                                                                        <span className="block text-[10px] text-green-600 uppercase font-bold tracking-wider mb-1">Discount</span>
                                                                        <span className="block font-mono font-bold text-green-700">
                                                                            -$ {(referenceTotal - agreedPrice).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                ) : agreedPrice && agreedPrice > referenceTotal ? (
                                                                    <div className="bg-red-50 px-4 py-2.5 rounded-xl border border-red-200 text-center shrink-0 flex flex-col justify-center">
                                                                        <span className="block text-[10px] text-red-600 uppercase font-bold tracking-wider mb-1">Markup</span>
                                                                        <span className="block font-mono font-bold text-red-700">
                                                                            +$ {(agreedPrice - referenceTotal).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                ) : null}
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
                                                                    onChange={(e) => handleBlockUpdate(b.id, { driverMealIncluded: e.target.checked })}
                                                                    className="rounded border-neutral-300 text-brand-green focus:ring-brand-green w-4 h-4"
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
                                                                        onChange={(e) => handleBlockUpdate(b.id, { driverAccIncluded: e.target.checked })}
                                                                        className="rounded border-neutral-300 text-brand-green focus:ring-brand-green w-4 h-4"
                                                                    />
                                                                    <span className="font-medium">Driver Accom. (FOC)</span>
                                                                </label>

                                                                <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer hover:text-brand-green transition-colors">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!b.parkingIncluded}
                                                                        onChange={(e) => handleBlockUpdate(b.id, { parkingIncluded: e.target.checked })}
                                                                        className="rounded border-neutral-300 text-brand-green focus:ring-brand-green w-4 h-4"
                                                                    />
                                                                    <span className="font-medium">Parking Included</span>
                                                                </label>

                                                                <div className="mt-1 pt-2 border-t border-neutral-100">
                                                                    <span className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1.5">Guide Room Option</span>
                                                                    <div className="flex gap-2">
                                                                        {['Free', 'Half Price', 'None'].map(opt => (
                                                                            <button
                                                                                key={opt}
                                                                                onClick={() => handleBlockUpdate(b.id, { guideRoomDiscount: opt as any })}
                                                                                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${b.guideRoomDiscount === opt ? 'bg-brand-gold text-white border-brand-gold' : 'bg-white text-neutral-500 border-neutral-200 hover:border-brand-gold/50'}`}
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
        </div>
    );
}
