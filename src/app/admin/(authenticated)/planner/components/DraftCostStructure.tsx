import React, { useEffect, useState } from 'react';
import { TripData, DraftCostItem } from '../types';
import { Plus, Trash2, Edit2, Check, RefreshCw } from 'lucide-react';

interface Props {
    tripData: TripData;
    updateData: (data: Partial<TripData>) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export function DraftCostStructure({ tripData, updateData }: Props) {
    const [costs, setCosts] = useState<DraftCostItem[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<DraftCostItem>>({});

    useEffect(() => {
        if (tripData.financials?.draftCosts && tripData.financials.draftCosts.length > 0) {
            setCosts(tripData.financials.draftCosts);
        } else {
            generateAndSaveDefaults();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tripData.financials?.draftCosts]);

    const generateAndSaveDefaults = () => {
        const defaults = generateDefaultCosts(tripData);
        setCosts(defaults);
        saveToTripData(defaults);
    };

    const generateDefaultCosts = (data: TripData): DraftCostItem[] => {
        const items: DraftCostItem[] = [];

        const getDayDate = (dayNumber: number) => {
            if (!data.profile?.arrivalDate) return `Day ${dayNumber}`;
            const d = new Date(data.profile.arrivalDate);
            d.setDate(d.getDate() + (dayNumber - 1));
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        };

        // Accommodation - purely from daily_activities (itinerary state)
        const accommodations = data.itinerary.filter(i => i.type === 'sleep' && i.hotelId);
        const groupedAcc: Record<string, { quantity: number, total: number, dates: Set<string> }> = {};
        
        accommodations.forEach(acc => {
            // Retrieve names and counts from the accommodations JSON mapping using the day index
            const booking = data.accommodations?.find(a => a.nightIndex === acc.dayNumber);
            
            let vendorName = acc.serviceProvider || 'Accommodation Provider';
            let roomDetails = acc.name || 'Room/Board';
            let roomsPerNight = 1; // Default to 1 if we can't find room counts
            
            if (booking) {
                if (booking.hotelName) {
                    vendorName = booking.hotelName;
                }
                
                if (booking.selectedRooms && booking.selectedRooms.length > 0) {
                    roomDetails = booking.selectedRooms.map(r => `${r.quantity}x ${r.roomName} ${r.mealPlan ? `(${r.mealPlan})` : ''}`).join(', ');
                    roomsPerNight = booking.selectedRooms.reduce((sum, r) => sum + (r.quantity || 1), 0);
                } else if (booking.roomName) {
                    roomDetails = `${booking.numberOfRooms || 1}x ${booking.roomName} ${booking.mealPlan ? `(${booking.mealPlan})` : ''}`;
                    roomsPerNight = booking.numberOfRooms || 1;
                }
            }
            
            if (acc.locationName) {
                vendorName = `${acc.locationName} - ${vendorName}`;
            }
            
            const groupKey = `${vendorName}|${roomDetails}`;

            if (!groupedAcc[groupKey]) {
                groupedAcc[groupKey] = { quantity: 0, total: 0, dates: new Set() };
            }
            
            groupedAcc[groupKey].dates.add(getDayDate(acc.dayNumber));
            
            // Increment by total rooms for that night. Price accumulates from charged total (agreedPrice) for that day.
            groupedAcc[groupKey].quantity += roomsPerNight;
            groupedAcc[groupKey].total += (acc.agreedPrice || 0);
        });

        Object.keys(groupedAcc).forEach(key => {
            const vendorName = key.substring(0, key.indexOf('|'));
            const roomDetails = key.substring(key.indexOf('|') + 1);
            const total = groupedAcc[key].total;
            const quantity = groupedAcc[key].quantity;
            const datesArr = Array.from(groupedAcc[key].dates);
            const dateStr = datesArr.length > 0 ? ` [${datesArr.join(', ')}]` : '';
            
            items.push({
                id: generateId(),
                category: 'Accommodation',
                vendorName: vendorName,
                serviceName: roomDetails + dateStr,
                quantity: quantity,
                unitPrice: quantity > 0 ? Number((total / quantity).toFixed(2)) : 0,
                totalPrice: Number(total.toFixed(2))
            });
        });

        // Transportation - requires block-level binding OR a trip-level default binding
        const hasGlobalTransport = data.defaultTransportId || data.defaultVehicleId || data.defaultDriverId;
        const transports = data.itinerary.filter(i => i.type === 'travel' && (i.transportId || i.vehicleId || i.driverId || hasGlobalTransport));
        let transportTotal = 0;
        let totalKm = 0;
        const transportDates = new Set<string>();
        
        transports.forEach(t => {
            transportDates.add(getDayDate(t.dayNumber));
            transportTotal += (t.agreedPrice || 0);
            if (t.distance) {
                // Extract numeric value from "120 km"
                const distNum = parseFloat(t.distance.replace(/[^\d.]/g, ''));
                if (!isNaN(distNum)) totalKm += distNum;
            }
        });

        // Fallback to summary total distance if individual blocks didn't have distance parsed properly
        if (totalKm === 0 && data.summary?.totalDistanceKm) {
            totalKm = data.summary.totalDistanceKm;
        }

        if (transports.length > 0) {
            let vehicleDetails = 'Vehicle with Chauffeur';
            let vendorName = 'Transport Provider';
            
            // Attempt to get vehicle details from transport bookings
            if (data.transports && data.transports.length > 0) {
                const primaryTransport = data.transports[0];
                vendorName = primaryTransport.supplier || 'Transport Provider';
                
                // Format mode text (e.g., SMALL_PREMIUM_SEDAN -> Premium Sedan)
                if (primaryTransport.mode) {
                    const modeParts = primaryTransport.mode.split('_');
                    // Skip size descriptor like 'SMALL', 'MEDIUM', 'LARGE'
                    const displayParts = modeParts.length > 1 ? modeParts.slice(1) : modeParts;
                    const modeText = displayParts.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                    vehicleDetails = `${modeText} with Chauffeur`;
                }
            }

            // The original unit price (rate per km) derived from the exact charged totals vs original km
            let originalQuantity = totalKm > 0 ? Math.round(totalKm) : transports.length;
            let derivedUnitPrice = originalQuantity > 0 ? transportTotal / originalQuantity : 0;
            
            // Apply the rounding rule for transportation
            let roundedQuantity = originalQuantity;
            if (totalKm > 0) {
                roundedQuantity = Math.ceil(originalQuantity / 500) * 500;
            }
            
            // Calculate the new total based on the rounded quantity
            const calculatedTotal = derivedUnitPrice * roundedQuantity;
            
            const tDatesArr = Array.from(transportDates);
            const tDateStr = tDatesArr.length > 0 ? ` [${tDatesArr.join(', ')}]` : '';
            
            items.push({
                id: generateId(),
                category: 'Transportation',
                vendorName: vendorName,
                serviceName: vehicleDetails + tDateStr,
                quantity: roundedQuantity,
                unitPrice: Number(derivedUnitPrice.toFixed(2)),
                totalPrice: Number(calculatedTotal.toFixed(2))
            });
        }

        // Activities - requires vendorId, activityId, or vendorActivityId
        const activities = data.itinerary.filter(i => i.type === 'activity' && (i.vendorId || i.activityId || i.vendorActivityId));
        const groupedAct: Record<string, { quantity: number, total: number, dates: Set<string> }> = {};
        
        // Calculate total tourists for activities
        const totalTourists = (data.profile?.adults || 0) + (data.profile?.children || 0);

        activities.forEach(act => {
            let vendorName = act.serviceProvider || 'Activity Provider';
            if (act.locationName) {
                vendorName = `${act.locationName} - ${vendorName}`;
            }
            const serviceName = act.name || 'Activity';
            const key = `${vendorName}|${serviceName}`;
            if (!groupedAct[key]) {
                groupedAct[key] = { quantity: 0, total: 0, dates: new Set() };
            }
            
            groupedAct[key].dates.add(getDayDate(act.dayNumber));
            
            // Quantity is based on the number of tourists in the group per occurrence
            const qtyForThisActivity = totalTourists > 0 ? totalTourists : 1;
            groupedAct[key].quantity += qtyForThisActivity;
            
            // Determine Unit Price based on Travel Style
            let activityUnitPrice = act.agreedPrice || 0;
            const style = data.profile?.travelStyle;
            if (style === 'Ultra VIP') activityUnitPrice = 150;
            else if (style === 'Luxury') activityUnitPrice = 100;
            else if (style === 'Premium') activityUnitPrice = 50;

            groupedAct[key].total += (activityUnitPrice * qtyForThisActivity);
        });

        Object.keys(groupedAct).forEach(key => {
            const [vendor, service] = key.split('|');
            const total = groupedAct[key].total;
            const quantity = groupedAct[key].quantity;
            const actDatesArr = Array.from(groupedAct[key].dates);
            const actDateStr = actDatesArr.length > 0 ? ` [${actDatesArr.join(', ')}]` : '';
            
            items.push({
                id: generateId(),
                category: 'Activities & Experiences',
                vendorName: vendor,
                serviceName: service + actDateStr,
                quantity: quantity,
                unitPrice: quantity > 0 ? Number((total / quantity).toFixed(2)) : 0,
                totalPrice: Number(total.toFixed(2))
            });
        });

        // Service & Support - requires guideId
        const guides = data.itinerary.filter(i => i.type === 'guide' && i.guideId);
        let guideTotal = 0;
        const guideDates = new Set<string>();
        
        guides.forEach(g => {
            guideDates.add(getDayDate(g.dayNumber));
            guideTotal += (g.agreedPrice || 0);
        });
        
        if (guides.length > 0) {
            const gDatesArr = Array.from(guideDates);
            const gDateStr = gDatesArr.length > 0 ? ` [${gDatesArr.join(', ')}]` : '';
            
             items.push({
                id: generateId(),
                category: 'Service and Support',
                vendorName: 'Service Provider',
                serviceName: 'Guiding & Support Services' + gDateStr,
                quantity: guides.length,
                unitPrice: guides.length > 0 ? Number((guideTotal / guides.length).toFixed(2)) : 0,
                totalPrice: Number(guideTotal.toFixed(2))
            });
        }

        // Meals - requires restaurantId
        const meals = data.itinerary.filter(i => i.type === 'meal' && i.restaurantId);
        let mealTotal = 0;
        const mealDates = new Set<string>();
        
        meals.forEach(m => {
            mealDates.add(getDayDate(m.dayNumber));
            const qty = m.restaurantQuantity || data.profile?.adults || 1;
            mealTotal += (m.agreedPrice || 0) * qty;
        });
        
        if (meals.length > 0) {
            const mDatesArr = Array.from(mealDates);
            const mDateStr = mDatesArr.length > 0 ? ` [${mDatesArr.join(', ')}]` : '';
            const roundedMealTotal = Math.ceil(mealTotal / 100) * 100;
            
             items.push({
                id: generateId(),
                category: 'Other',
                vendorName: 'Various Restaurants',
                serviceName: 'Additional Meals' + mDateStr,
                quantity: meals.length,
                unitPrice: meals.length > 0 ? Number((roundedMealTotal / meals.length).toFixed(2)) : 0,
                totalPrice: Number(roundedMealTotal.toFixed(2))
            });
        }

        // Add 20% Service Fee
        const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
        const serviceFee = subtotal * 0.20;
        if (serviceFee > 0) {
            items.push({
                id: generateId(),
                category: 'Service and Support',
                vendorName: 'Agency',
                serviceName: 'Tax, Service and Support Fee (20%)',
                quantity: 1,
                unitPrice: Number(serviceFee.toFixed(2)),
                totalPrice: Number(serviceFee.toFixed(2))
            });
        }

        return items;
    };

    const saveToTripData = (updatedCosts: DraftCostItem[]) => {
        updateData({
            financials: {
                ...tripData.financials,
                draftCosts: updatedCosts
            }
        });
    };

    const handleAdd = () => {
        const newItem: DraftCostItem = {
            id: generateId(),
            category: 'Other',
            vendorName: 'New Vendor',
            serviceName: 'New Service',
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0
        };
        const newCosts = [...costs, newItem];
        setCosts(newCosts);
        saveToTripData(newCosts);
        setEditingId(newItem.id);
        setEditForm(newItem);
    };

    const handleEdit = (item: DraftCostItem) => {
        setEditingId(item.id);
        setEditForm(item);
    };

    const handleSave = () => {
        if (!editingId) return;
        
        // Auto calculate total if unit and quantity are present
        const q = Number(editForm.quantity) || 0;
        const u = Number(editForm.unitPrice) || 0;
        let t = Number(editForm.totalPrice) || 0;
        
        if (q > 0 && u > 0 && t === 0) {
            t = q * u;
        }

        const updatedCosts = costs.map(c => 
            c.id === editingId ? { ...c, ...editForm, totalPrice: t } as DraftCostItem : c
        );
        
        setCosts(updatedCosts);
        saveToTripData(updatedCosts);
        setEditingId(null);
        setEditForm({});
    };

    const handleDelete = (id: string) => {
        const updatedCosts = costs.filter(c => c.id !== id);
        setCosts(updatedCosts);
        saveToTripData(updatedCosts);
    };

    const getCategories = () => ['Accommodation', 'Transportation', 'Activities & Experiences', 'Service and Support', 'Other'];

    const renderEditableCell = (item: DraftCostItem, field: keyof DraftCostItem, type: 'text' | 'number' = 'text', width?: string) => {
        if (editingId === item.id) {
            return (
                <input
                    type={type}
                    value={editForm[field] as string | number}
                    onChange={e => {
                        const val = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
                        
                        // Auto-update total price if quantity or unit price changes
                        let newForm = { ...editForm, [field]: val };
                        if (field === 'quantity' || field === 'unitPrice') {
                            const q = field === 'quantity' ? Number(val) : Number(editForm.quantity || 0);
                            const u = field === 'unitPrice' ? Number(val) : Number(editForm.unitPrice || 0);
                            newForm.totalPrice = q * u;
                        }
                        
                        setEditForm(newForm);
                    }}
                    className={`border border-neutral-300 rounded px-2 py-1 text-sm ${width || 'w-full'}`}
                />
            );
        }
        
        if (type === 'number') {
            if (field === 'quantity') return item[field];
            return `$${Number(item[field]).toFixed(2)}`;
        }
        return item[field];
    };

    return (
        <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-serif text-brand-green">Draft Cost Structure</h3>
                    <p className="text-sm text-neutral-500 mt-1">Consolidated editable line items for customer view based on daily activities.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={generateAndSaveDefaults}
                        className="flex items-center gap-1.5 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition-colors font-medium text-sm"
                    >
                        <RefreshCw size={16} /> Sync from Itinerary
                    </button>
                    <button 
                        onClick={handleAdd}
                        className="flex items-center gap-1.5 px-4 py-2 bg-brand-charcoal text-white hover:bg-black rounded-xl transition-colors font-medium text-sm"
                    >
                        <Plus size={16} /> Add Custom Line
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200">
                            <th className="px-4 py-3 text-sm font-semibold text-neutral-600">Category</th>
                            <th className="px-4 py-3 text-sm font-semibold text-neutral-600">Vendor / Service</th>
                            <th className="px-4 py-3 text-sm font-semibold text-neutral-600 text-center w-24">Qty</th>
                            <th className="px-4 py-3 text-sm font-semibold text-neutral-600 text-right w-32">Unit Price</th>
                            <th className="px-4 py-3 text-sm font-semibold text-neutral-600 text-right w-32">Total Price</th>
                            <th className="px-4 py-3 text-sm font-semibold text-neutral-600 text-center w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {costs.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                                    No draft cost items available. Sync from itinerary or add one manually.
                                </td>
                            </tr>
                        )}
                        {costs.map(item => (
                            <tr key={item.id} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                                <td className="px-4 py-3">
                                    {editingId === item.id ? (
                                        <select 
                                            value={editForm.category as string}
                                            onChange={e => setEditForm({...editForm, category: e.target.value as any})}
                                            className="border border-neutral-300 rounded px-2 py-1 text-sm w-full"
                                        >
                                            {getCategories().map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className="inline-block px-2.5 py-1 bg-neutral-100 rounded text-xs font-semibold text-neutral-600">
                                            {item.category}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-1">
                                        <div className="font-semibold text-neutral-800 text-sm">
                                            {renderEditableCell(item, 'vendorName')}
                                        </div>
                                        <div className="text-xs text-neutral-500">
                                            {renderEditableCell(item, 'serviceName')}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center text-sm font-medium">
                                    {renderEditableCell(item, 'quantity', 'number', 'w-16 text-center')}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-medium">
                                    {renderEditableCell(item, 'unitPrice', 'number', 'w-24 text-right')}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-bold text-brand-green">
                                    {renderEditableCell(item, 'totalPrice', 'number', 'w-24 text-right')}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-2">
                                        {editingId === item.id ? (
                                            <button onClick={handleSave} className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors">
                                                <Check size={16} />
                                            </button>
                                        ) : (
                                            <button onClick={() => handleEdit(item)} className="p-1.5 bg-neutral-100 text-neutral-600 hover:bg-neutral-200 rounded transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {costs.length > 0 && (
                            <>
                                <tr className="bg-neutral-50 border-t-2 border-neutral-200 font-bold">
                                    <td colSpan={4} className="px-4 py-4 text-right text-neutral-800">
                                        Estimated Total Cost
                                    </td>
                                    <td className="px-4 py-4 text-right text-brand-green text-lg">
                                        ${costs.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0).toFixed(2)}
                                    </td>
                                    <td></td>
                                </tr>
                                <tr className="bg-white border-t border-neutral-100 font-medium text-sm">
                                    <td colSpan={4} className="px-4 py-3 text-right text-neutral-500">
                                        Per Head Per Day Cost ({(tripData.profile?.adults || 0) + (tripData.profile?.children || 0)} Pax / {tripData.profile?.durationDays || 1} Days)
                                    </td>
                                    <td className="px-4 py-3 text-right text-neutral-700">
                                        ${((costs.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0)) / (Math.max(1, ((tripData.profile?.adults || 0) + (tripData.profile?.children || 0)) * (tripData.profile?.durationDays || 1)))).toFixed(2)}
                                    </td>
                                    <td></td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
