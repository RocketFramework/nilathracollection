"use client";

import { TripData, Financials } from "../types";
import { useState } from "react";
import { Calculator, RefreshCw } from "lucide-react";

import { getFinalizedActivitiesAction, savePurchaseOrderAction, getPurchaseOrdersAction, deleteDraftPurchaseOrdersAction, getTransportProvidersAction, getHotelsListAction, getRestaurantsAction } from "@/actions/admin.actions";
import { useEffect } from "react";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";

export function FinanceAndBookingStep({
    tripData,
    updateFinancials
}: {
    tripData: TripData,
    updateFinancials: (f: Financials) => void
}) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [finalizedActivities, setFinalizedActivities] = useState<any[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
    const [isLoadingPOs, setIsLoadingPOs] = useState(false);
    const [expandedPO, setExpandedPO] = useState<string | null>(null);
    const tourId = tripData.id;

    const fetchPurchaseOrders = async () => {
        if (!tourId) return;
        setIsLoadingPOs(true);
        try {
            const res = await getPurchaseOrdersAction(tourId);
            if (res.success) {
                setPurchaseOrders(res.pos || []);
            }
        } catch (error) {
            console.error("Failed to fetch POs:", error);
        } finally {
            setIsLoadingPOs(false);
        }
    };

    useEffect(() => {
        fetchPurchaseOrders();
    }, [tourId]);

    const syncWithItinerary = async () => {
        if (!tourId) {
            alert("Tour must be saved before generating POs.");
            return;
        }

        setIsSyncing(true);
        try {
            const result = await getFinalizedActivitiesAction(tourId);
            const transportRes = await getTransportProvidersAction();
            const allTransportProviders = transportRes.success ? transportRes.providers || [] : [];
            const hotelsRes = await getHotelsListAction();
            const allHotels = hotelsRes.success ? hotelsRes.hotels || [] : [];
            const restRes = await getRestaurantsAction();
            const allRestaurants = restRes.success ? restRes.restaurants || [] : [];

            if (!result.success) {
                alert("Failed to fetch daily activities: " + result.error);
                return;
            }

            const activities = result.activities || [];

            if (activities.length === 0) {
                alert("There are no finalized items to generate PO, please go back to negotiation step and finalize price");
                return;
            }

            // Keep valid records under the else part for the next step
            setFinalizedActivities(activities);

            // Filter for hotel activities
            const hotelActivities = activities.filter(a => 
                a.hotel_id && 
                a.charged_total_price != null && 
                a.charged_unit_price != null
            );

            // Generate shared guest details for PO vendor notes
            const guestCountry = tripData.profile?.departureCountry || tripData.travelers?.[0]?.nationality || 'Not Specified';
            const guestName = tripData.clientName || 'Not Specified';
            const totalKids = tripData.profile?.children || 0;
            const totalGuestCount = (tripData.profile?.adults || 0) + totalKids + (tripData.profile?.infants || 0);

            const guestDetails = `Guest Name: ${guestName}
Guest Country: ${guestCountry}
Total Guests: ${totalGuestCount} (${totalKids} Kids)`;

            // Clear old Draft POs before generating new ones
            await deleteDraftPurchaseOrdersAction(tourId);

            if (hotelActivities.length > 0) {
                // Group by hotel_id
                const hotelGroups = hotelActivities.reduce((acc, a) => {
                    if (!acc[a.hotel_id]) acc[a.hotel_id] = [];
                    acc[a.hotel_id].push(a);
                    return acc;
                }, {} as Record<string, any[]>);

                for (const [hotelId, _hotelActs] of Object.entries(hotelGroups)) {
                    const hotelActs = _hotelActs as any[];
                    const poId = crypto.randomUUID();
                    const poNumber = `PO-HOT-${Date.now().toString().slice(-6)}`;
                    
                    const firstAct = hotelActs[0];
                    const masterHotel = allHotels.find((h: any) => h.id === hotelId);
                    const hotelName = masterHotel?.name || firstAct.title || 'Unknown Hotel';
                    const locationName = firstAct.location_name || '';

                    let calculatedSubtotal = 0;
                    let actualTotal = 0;
                    const poItems: any[] = [];

                    for (const act of hotelActs) {
                        actualTotal += act.charged_total_price || 0;
                        
                        const roomTypes = [
                            { type: 'Single', count: act.single_room_count || 0, roomId: act.single_room_id },
                            { type: 'Double', count: act.double_room_count || 0, roomId: act.double_room_id },
                            { type: 'Twin', count: act.twin_room_count || 0, roomId: act.twin_room_id },
                            { type: 'Triple', count: act.triple_room_count || 0, roomId: act.triple_room_id },
                            { type: 'Family', count: act.family_room_count || 0, roomId: act.family_room_id }
                        ].filter(rt => rt.count > 0);

                        if (roomTypes.length === 0) {
                            roomTypes.push({ type: 'Standard Room', count: act.quantity || 1 });
                        }

                        const driverAcc = act.driver_acc_included ? 'Yes' : 'No';
                        const parkingInc = act.parking_included ? 'Yes' : 'No';
                        const guideDisc = act.guide_room_discount || 'None';
                        
                        let specialNotes = `Driver accommodation include: ${driverAcc}\nParking Included: ${parkingInc}\nGuide Room discount: ${guideDisc}`;

                        let serviceDate = '';
                        if (tripData.profile?.arrivalDate) {
                            const matchingBlock = tripData.itinerary.find(b => b.id === act.id);
                            if (matchingBlock && matchingBlock.dayNumber) {
                                const dateObj = new Date(tripData.profile.arrivalDate);
                                dateObj.setDate(dateObj.getDate() + (matchingBlock.dayNumber - 1));
                                serviceDate = dateObj.toISOString().split('T')[0];
                            }
                        }

                        let actCalculatedTotal = 0;
                        const actPoItems: any[] = [];

                        roomTypes.forEach((rt) => {
                            const itemQty = rt.count;
                            const itemUnitPrice = act.charged_unit_price || 0;
                            const itemCalculatedTotal = itemQty * itemUnitPrice;

                            let actualRoomName = rt.type;
                            if (rt.roomId && masterHotel && masterHotel.hotel_rooms) {
                                const matchedRoom = masterHotel.hotel_rooms.find((hr: any) => hr.id === rt.roomId);
                                if (matchedRoom && matchedRoom.room_name) {
                                    actualRoomName = matchedRoom.room_name;
                                }
                            }

                            actCalculatedTotal += itemCalculatedTotal;
                            calculatedSubtotal += itemCalculatedTotal;

                            actPoItems.push({
                                id: crypto.randomUUID(),
                                purchase_order_id: poId,
                                description: `${hotelName} - ${actualRoomName} (${rt.type})`,
                                service_date: serviceDate,
                                quantity: itemQty,
                                unit_price: itemUnitPrice,
                                total_price: itemCalculatedTotal,
                                room_type: actualRoomName,
                                meal_plan: act.meal_plan || 'BB',
                                special_notes: specialNotes
                            });
                        });

                        // Add difference note to the first room type of this block if there's a markup/discount
                        if (actCalculatedTotal !== act.charged_total_price && actPoItems.length > 0) {
                            const diff = (act.charged_total_price || 0) - actCalculatedTotal;
                            const diffNote = diff > 0 
                                ? `Includes Markup: $${diff.toLocaleString(undefined, {minimumFractionDigits: 2})}`
                                : `Includes Discount: $${Math.abs(diff).toLocaleString(undefined, {minimumFractionDigits: 2})}`;
                            actPoItems[0].special_notes += `\n\n${diffNote}`;
                        }

                        poItems.push(...actPoItems);
                    }

                    let discount = 0;
                    let serviceCharge = 0;
                    if (actualTotal < calculatedSubtotal) {
                        discount = calculatedSubtotal - actualTotal;
                    } else if (actualTotal > calculatedSubtotal) {
                        serviceCharge = actualTotal - calculatedSubtotal;
                    }

                    const poPayload = {
                        id: poId,
                        tour_id: tourId,
                        po_number: poNumber,
                        po_date: new Date().toISOString().split('T')[0],
                        vendor_type: 'hotel' as const,
                        vendor_name: hotelName,
                        hotel_id: hotelId,
                        vendor_address: allHotels.find((h: any) => h.id === hotelId)?.location_address || locationName,
                        vendor_phone: allHotels.find((h: any) => h.id === hotelId)?.reservation_agent_contact || undefined,
                        vendor_email: allHotels.find((h: any) => h.id === hotelId)?.reservation_email || undefined,
                        currency: 'USD' as const,
                        status: 'Draft' as const,
                        subtotal: calculatedSubtotal,
                        total_amount: actualTotal,
                        discount: discount,
                        tax: 0,
                        service_charge: serviceCharge,
                        advance_paid: 0,
                        balance_payable: actualTotal,
                        vendor_notes: guestDetails
                    };

                    await savePurchaseOrderAction(poPayload, poItems);
                }
            }

            // Filter for transport activities
            const transportActivities = activities.filter(a => 
                a.distance &&
                a.transport_id &&
                a.charged_total_price != null && 
                a.charged_unit_price != null
            );

            if (transportActivities.length > 0) {
                // Group by transport_id AND vehicle_id
                const transportGroups = transportActivities.reduce((acc, a) => {
                    const groupKey = `${a.transport_id}_${a.vehicle_id || 'unassigned'}`;
                    if (!acc[groupKey]) acc[groupKey] = [];
                    acc[groupKey].push(a);
                    return acc;
                }, {} as Record<string, any[]>);

                for (const [groupKey, _transActs] of Object.entries(transportGroups)) {
                    const transportActs = _transActs as any[];
                    const poId = crypto.randomUUID();
                    const poNumber = `PO-TRN-${Date.now().toString().slice(-6)}`;
                    
                    const firstAct = transportActs[0];
                    const transportId = firstAct.transport_id;
                    const providerData = allTransportProviders.find((p: any) => p.id === transportId);
                    const vendorName = providerData ? providerData.name : 'Transport Provider';

                    let calculatedSubtotal = 0;
                    let actualTotal = 0;
                    const poItems: any[] = [];

                    for (const act of transportActs) {
                        const itemQty = act.quantity || 1;
                        const itemUnitPrice = act.charged_unit_price || 0;
                        const itemCalculatedTotal = itemQty * itemUnitPrice;

                        calculatedSubtotal += itemCalculatedTotal;
                        actualTotal += act.charged_total_price || 0;
                        
                        let serviceDate = '';
                        if (tripData.profile?.arrivalDate) {
                            const matchingBlock = tripData.itinerary.find(b => b.id === act.id);
                            if (matchingBlock && matchingBlock.dayNumber) {
                                const dateObj = new Date(tripData.profile.arrivalDate);
                                dateObj.setDate(dateObj.getDate() + (matchingBlock.dayNumber - 1));
                                serviceDate = dateObj.toISOString().split('T')[0];
                            }
                        }

                        const distanceStr = act.distance ? ` (${act.distance})` : '';
                        const description = `${act.title || 'Transport Segment'}${distanceStr}`;

                        let specialNotes = '';
                        if (providerData && providerData.transport_vehicles && act.vehicle_id) {
                            const vehicleData = providerData.transport_vehicles.find((v: any) => v.id === act.vehicle_id);
                            if (vehicleData) {
                                const type = vehicleData.vehicle_type || '';
                                const brandModel = vehicleData.make_and_model || '';
                                const plate = vehicleData.vehicle_number ? `(Plate: ${vehicleData.vehicle_number})` : '';
                                specialNotes = `Assigned Vehicle: ${type} ${brandModel} ${plate}`.trim();
                            }
                        }

                        poItems.push({
                            id: crypto.randomUUID(),
                            purchase_order_id: poId,
                            description: description,
                            service_date: serviceDate,
                            quantity: itemQty,
                            unit_price: itemUnitPrice,
                            total_price: itemCalculatedTotal,
                            vehicle_type: firstAct.vehicle_id || undefined,
                            special_notes: specialNotes || undefined
                        });
                    }

                    let discount = 0;
                    let serviceCharge = 0;
                    if (actualTotal < calculatedSubtotal) {
                        discount = calculatedSubtotal - actualTotal;
                    } else if (actualTotal > calculatedSubtotal) {
                        serviceCharge = actualTotal - calculatedSubtotal;
                    }

                    const poPayload = {
                        id: poId,
                        tour_id: tourId,
                        po_number: poNumber,
                        po_date: new Date().toISOString().split('T')[0],
                        vendor_type: 'transport' as const,
                        vendor_name: vendorName,
                        transport_provider_id: transportId,
                        vendor_address: providerData?.address || undefined,
                        vendor_phone: providerData?.phone || undefined,
                        vendor_email: providerData?.email || undefined,
                        currency: 'USD' as const,
                        status: 'Draft' as const,
                        subtotal: calculatedSubtotal,
                        total_amount: actualTotal,
                        discount: discount,
                        tax: 0,
                        service_charge: serviceCharge,
                        advance_paid: 0,
                        balance_payable: actualTotal,
                        vendor_notes: guestDetails
                    };

                    await savePurchaseOrderAction(poPayload, poItems);
                }
            }
            // Filter for restaurant activities
            const restaurantActivities = activities.filter(a => 
                a.restaurant_id &&
                a.charged_total_price != null && 
                a.charged_unit_price != null
            );

            if (restaurantActivities.length > 0) {
                // Group by restaurant_id
                const restaurantGroups = restaurantActivities.reduce((acc, a) => {
                    if (!acc[a.restaurant_id]) acc[a.restaurant_id] = [];
                    acc[a.restaurant_id].push(a);
                    return acc;
                }, {} as Record<string, any[]>);

                for (const [restaurantId, _restActs] of Object.entries(restaurantGroups)) {
                    const restaurantActs = _restActs as any[];
                    const poId = crypto.randomUUID();
                    const poNumber = `PO-RES-${Date.now().toString().slice(-6)}`;
                    
                    const firstAct = restaurantActs[0];
                    const providerData = allRestaurants.find((r: any) => r.id === restaurantId);
                    const vendorName = providerData ? providerData.name : firstAct.title || 'Restaurant';

                    let calculatedSubtotal = 0;
                    let actualTotal = 0;
                    const poItems: any[] = [];

                    for (const act of restaurantActs) {
                        const itemQty = act.quantity || 1;
                        const itemUnitPrice = act.charged_unit_price || 0;
                        const itemCalculatedTotal = itemQty * itemUnitPrice;

                        calculatedSubtotal += itemCalculatedTotal;
                        actualTotal += act.charged_total_price || 0;
                        
                        let serviceDate = '';
                        if (tripData.profile?.arrivalDate) {
                            const matchingBlock = tripData.itinerary.find(b => b.id === act.id);
                            if (matchingBlock && matchingBlock.dayNumber) {
                                const dateObj = new Date(tripData.profile.arrivalDate);
                                dateObj.setDate(dateObj.getDate() + (matchingBlock.dayNumber - 1));
                                serviceDate = dateObj.toISOString().split('T')[0];
                            }
                        }

                        const mealPlanStr = act.meal_plan ? ` (${act.meal_plan})` : '';
                        const description = `${act.title || 'Meal'}${mealPlanStr}`;

                        let specialNotes = `Location: ${act.location_name || providerData?.location_address || 'Unknown'}`;
                        if (act.driver_meal_included) {
                            specialNotes += `\nDriver Meal Included: Yes`;
                        }

                        poItems.push({
                            id: crypto.randomUUID(),
                            purchase_order_id: poId,
                            description: description,
                            service_date: serviceDate,
                            quantity: itemQty,
                            unit_price: itemUnitPrice,
                            total_price: itemCalculatedTotal,
                            meal_plan: act.meal_plan || undefined,
                            special_notes: specialNotes
                        });
                    }

                    let discount = 0;
                    let serviceCharge = 0;
                    if (actualTotal < calculatedSubtotal) {
                        discount = calculatedSubtotal - actualTotal;
                    } else if (actualTotal > calculatedSubtotal) {
                        serviceCharge = actualTotal - calculatedSubtotal;
                    }

                    const poPayload = {
                        id: poId,
                        tour_id: tourId,
                        po_number: poNumber,
                        po_date: new Date().toISOString().split('T')[0],
                        vendor_type: 'restaurant' as const,
                        vendor_name: vendorName,
                        vendor_address: providerData?.location_address || undefined,
                        vendor_phone: providerData?.contact_number || undefined,
                        vendor_email: providerData?.email || undefined,
                        currency: 'USD' as const,
                        status: 'Draft' as const,
                        subtotal: calculatedSubtotal,
                        total_amount: actualTotal,
                        discount: discount,
                        tax: 0,
                        service_charge: serviceCharge,
                        advance_paid: 0,
                        balance_payable: actualTotal,
                        vendor_notes: guestDetails
                    };

                    await savePurchaseOrderAction(poPayload, poItems);
                }
            }


            alert(`Generated POs successfully for finalized items.`);
            await fetchPurchaseOrders();
        } catch (error) {
            console.error("Error syncing with itinerary:", error);
            alert("An error occurred while syncing with the itinerary.");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-serif text-brand-green flex items-center gap-2">
                        <Calculator className="text-brand-gold" /> Finance & Supplier Control
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">Manage vendor payments, reconcile POs, and verify supplier invoices.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={syncWithItinerary}
                        disabled={isSyncing}
                        className="flex items-center gap-2 bg-brand-gold text-white px-5 py-2.5 rounded-2xl hover:bg-yellow-600 transition-all shadow-lg shadow-yellow-200/50 font-bold text-sm disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'Syncing...' : 'Sync with Itinerary'}
                    </button>
                </div>
            </div>

            {isLoadingPOs ? (
                <div className="bg-white p-12 rounded-[40px] border border-neutral-200 shadow-sm text-center">
                    <RefreshCw className="animate-spin mx-auto text-neutral-300 mb-2" />
                    <p className="text-neutral-400 italic">Loading Purchase Orders...</p>
                </div>
            ) : purchaseOrders.length === 0 ? (
                <div className="bg-white p-12 rounded-[40px] border border-neutral-200 shadow-sm text-center">
                    <p className="text-neutral-400 italic">No Purchase Orders generated yet. Click "Sync with Itinerary" to generate them.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {purchaseOrders.map((po) => (
                        <div key={po.id} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                            <div 
                                className="px-6 py-4 flex items-center justify-between cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition-colors"
                                onClick={() => setExpandedPO(expandedPO === po.id ? null : po.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl ${po.vendor_type === 'hotel' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-neutral-800">{po.vendor_name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                                            <span className="font-mono bg-neutral-200 px-2 py-0.5 rounded-md">{po.po_number}</span>
                                            <span>•</span>
                                            <span className="capitalize">{po.vendor_type}</span>
                                            <span>•</span>
                                            <span>{new Date(po.po_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-neutral-800">${(po.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        <div className={`text-xs font-bold mt-1 ${po.status === 'Draft' ? 'text-amber-500' : 'text-green-500'}`}>
                                            {po.status}
                                        </div>
                                    </div>
                                    <div className="text-neutral-400">
                                        {expandedPO === po.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>
                            </div>
                            
                            {expandedPO === po.id && po.items && po.items.length > 0 && (
                                <div className="px-6 py-4 border-t border-neutral-100">
                                    {(po.vendor_address || po.vendor_phone || po.vendor_email) && (
                                        <div className="mb-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-xs text-neutral-600 space-y-1">
                                            {po.vendor_address && <div><span className="font-semibold">Address:</span> {po.vendor_address}</div>}
                                            {po.vendor_phone && <div><span className="font-semibold">Phone:</span> {po.vendor_phone}</div>}
                                            {po.vendor_email && <div><span className="font-semibold">Email:</span> {po.vendor_email}</div>}
                                        </div>
                                    )}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-neutral-400 border-b border-neutral-100">
                                                    <th className="pb-2 font-medium">Description</th>
                                                    <th className="pb-2 font-medium">Service Date</th>
                                                    <th className="pb-2 font-medium text-center">Qty</th>
                                                    <th className="pb-2 font-medium text-right">Unit Price</th>
                                                    <th className="pb-2 font-medium text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-50">
                                                {[...po.items].sort((a: any, b: any) => {
                                                    if (!a.service_date) return 1;
                                                    if (!b.service_date) return -1;
                                                    return new Date(a.service_date).getTime() - new Date(b.service_date).getTime();
                                                }).map((item: any) => (
                                                    <tr key={item.id} className="text-neutral-700">
                                                        <td className="py-3">
                                                            <div className="font-medium">{item.description}</div>
                                                            {item.special_notes && (
                                                                <div className="text-xs text-orange-500 mt-1 whitespace-pre-line">{item.special_notes}</div>
                                                            )}
                                                        </td>
                                                        <td className="py-3">{item.service_date ? new Date(item.service_date).toLocaleDateString() : '-'}</td>
                                                        <td className="py-3 text-center">{item.quantity}</td>
                                                        <td className="py-3 text-right">${(item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                        <td className="py-3 text-right font-bold">${(item.total_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="border-t border-neutral-200 text-neutral-700">
                                                {po.discount > 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="py-2 text-right text-green-600 font-medium">Discount</td>
                                                        <td className="py-2 text-right text-green-600 font-bold">-${(po.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    </tr>
                                                )}
                                                {po.service_charge > 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="py-2 text-right text-orange-600 font-medium">Markup / Service Charge</td>
                                                        <td className="py-2 text-right text-orange-600 font-bold">+${(po.service_charge || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <td colSpan={4} className="py-3 text-right text-neutral-800 font-bold text-base">Total Amount</td>
                                                    <td className="py-3 text-right text-neutral-800 font-black text-base">${(po.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                    
                                    {po.vendor_notes && (
                                        <div className="mt-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-xs text-neutral-600 whitespace-pre-line">
                                            <span className="font-bold text-neutral-800 block mb-1">Vendor Notes / Guest Details:</span>
                                            {po.vendor_notes}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
