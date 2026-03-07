"use client";

import { TripData, DBPurchaseOrder, DBPurchaseOrderItem, DBVendorInvoice, Financials, POStatus } from "../types";
import { Calculator, Receipt, Send, CheckCircle2, AlertTriangle, RefreshCw, Plus, FileText, ChevronRight, Check, X, ShieldCheck, Trash2, Search, Settings } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    getHotelsListAction,
    getVendorsAction,
    getTransportProvidersAction,
    getTourGuidesAction,
    getRestaurantsAction,
    saveTourAction,
    getPurchaseOrdersAction,
    savePurchaseOrderAction,
    deletePurchaseOrderAction,
    deleteDraftPurchaseOrdersAction,
    saveVendorInvoiceAction,
    saveVendorPaymentAction,
    getExchangeRateAction
} from "@/actions/admin.actions";

export function FinanceAndBookingStep({
    tripData,
    updateFinancials
}: {
    tripData: TripData,
    updateFinancials: (f: Financials) => void
}) {

    const [activePOId, setActivePOId] = useState<string | null>(null);
    const [editingPO, setEditingPO] = useState<DBPurchaseOrder | null>(null);
    const [isSavingPO, setIsSavingPO] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [dbPOs, setDbPOs] = useState<DBPurchaseOrder[]>([]);
    const [isLoadingPOs, setIsLoadingPOs] = useState(false);
    const [exchangeRate, setExchangeRate] = useState(300);
    const [isLoadingRate, setIsLoadingRate] = useState(false);
    const [previewPO, setPreviewPO] = useState<DBPurchaseOrder | null>(null);
    const [activeStatusTab, setActiveStatusTab] = useState<'All' | POStatus>('All');
    const [poSearchTerm, setPoSearchTerm] = useState("");
    const [selectedPOIds, setSelectedPOIds] = useState<string[]>([]);
    const [isCreatingManual, setIsCreatingManual] = useState(false);

    // Master Data State for Manual POs
    const [masterHotels, setMasterHotels] = useState<any[]>([]);
    const [masterVendors, setMasterVendors] = useState<any[]>([]);
    const [masterTransports, setMasterTransports] = useState<any[]>([]);
    const [masterGuides, setMasterGuides] = useState<any[]>([]);
    const [masterRestaurants, setMasterRestaurants] = useState<any[]>([]);

    const manualPOTypes: { label: string, type: string, vendorType: DBPurchaseOrder['vendor_type'] }[] = [
        { label: 'Activity', type: 'activity', vendorType: 'vendor' },
        { label: 'Travel', type: 'travel', vendorType: 'transport' },
        { label: 'Meal', type: 'meal', vendorType: 'restaurant' },
        { label: 'Sleep', type: 'sleep', vendorType: 'hotel' },
        { label: 'Train', type: 'train', vendorType: 'transport' },
        { label: 'Buffer', type: 'buffer', vendorType: 'other' },
        { label: 'Wait', type: 'wait', vendorType: 'other' },
        { label: 'Guide', type: 'guide', vendorType: 'guide' },
        { label: 'Custom', type: 'custom', vendorType: 'other' },
    ];

    const tourId = tripData.id;

    const loadPOs = async () => {
        if (!tourId) {
            console.warn("loadPOs called but tourId is missing", { tripDataId: tripData.id });
            return;
        }
        setIsLoadingPOs(true);
        try {
            console.log("Fetching POs for tourId:", tourId);
            const res = await getPurchaseOrdersAction(tourId);
            if (res.success && res.pos) {
                console.log("Successfully loaded POs:", res.pos.length);
                setDbPOs(res.pos);
            } else if (res.error) {
                console.error("Server action failed to load POs:", res.error);
            }
        } catch (error) {
            console.error("Failed to load POs", error);
        } finally {
            setIsLoadingPOs(false);
        }
    };

    useEffect(() => {
        loadPOs();
        const fetchRateAndMasterData = async () => {
            setIsLoadingRate(true);
            try {
                const [rateRes, hotelsRes, vendorsRes, transportsRes, guidesRes, restRes] = await Promise.all([
                    getExchangeRateAction(),
                    getHotelsListAction(),
                    getVendorsAction(),
                    getTransportProvidersAction(),
                    getTourGuidesAction(),
                    getRestaurantsAction()
                ]);

                if (rateRes.success && rateRes.rate) setExchangeRate(rateRes.rate);
                if (hotelsRes.success) setMasterHotels(hotelsRes.hotels || []);
                if (vendorsRes.success) setMasterVendors(vendorsRes.vendors || []);
                if (transportsRes.success) setMasterTransports(transportsRes.providers || []);
                if (guidesRes.success) setMasterGuides(guidesRes.guides || []);
                if (restRes.success) setMasterRestaurants(restRes.restaurants || []);

            } catch (err) {
                console.error("Failed to fetch initial data", err);
            } finally {
                setIsLoadingRate(false);
            }
        };
        fetchRateAndMasterData();
    }, [tourId]);

    // AGGREGATION ENGINE: Scans trip data to build recommended POs
    const syncWithItinerary = async () => {
        if (!tourId) {
            alert("Tour must be saved before generating POs.");
            return;
        }
        setIsSyncing(true);
        try {
            // 0. Automatically save the workflow first to ensure itinerary blocks exist in DB with stable IDs
            const saveRes = await saveTourAction(tourId, tripData);
            if (!saveRes.success) {
                throw new Error("Failed to save itinerary before sync: " + saveRes.error);
            }

            // 1. Delete all existing Draft and Pending Confirmation POs for a fresh start
            const delRes = await deleteDraftPurchaseOrdersAction(tourId);
            if (!delRes.success) {
                throw new Error("Failed to clear existing draft POs: " + delRes.error);
            }

            // Immediately clear local PO state to avoid stale references in preservedLinkedBlockIds
            setDbPOs(prev => prev.filter(po => po.status !== 'Draft' && po.status !== 'Pending Confirmation'));

            const [hotelsRes, vendorsRes, transportsRes, guidesRes, restRes] = await Promise.all([
                getHotelsListAction(),
                getVendorsAction(),
                getTransportProvidersAction(),
                getTourGuidesAction(),
                getRestaurantsAction()
            ]);

            const hotels = hotelsRes.success ? (hotelsRes.hotels || []) : [];
            const vendors = vendorsRes.success ? (vendorsRes.vendors || []) : [];
            const transports = transportsRes.success ? (transportsRes.providers || []) : [];
            const guides = guidesRes.success ? (guidesRes.guides || []) : [];
            const restaurants = restRes.success ? (restRes.restaurants || []) : [];

            // Identify blocks that are already in a confirmed/sent PO to avoid duplicate generated items
            const preservedLinkedBlockIds = new Set<string>();
            dbPOs.forEach(po => {
                // Only preserve IDs from POs that are NOT the ones we just deleted
                if (po.status !== 'Draft' && po.status !== 'Pending Confirmation') {
                    po.items?.forEach(item => {
                        if (item.tour_itinerary_id) {
                            preservedLinkedBlockIds.add(item.tour_itinerary_id);
                        }
                    });
                }
            });

            const newPOs: Partial<DBPurchaseOrder>[] = [];
            const dayServiceMap = new Map<number, Set<string>>();

            // We process EVERYTHING from Itinerary now, grouping by vendorId or generic type
            const vendorMap = new Map<string, {
                name: string,
                type: DBPurchaseOrder['vendor_type'],
                address?: string,
                phone?: string,
                email?: string,
                vendorRef: { hotel_id?: string, activity_vendor_id?: string, transport_provider_id?: string, guide_id?: string, restaurant_id?: string },
                items: Partial<DBPurchaseOrderItem>[]
            }>();

            tripData.itinerary.forEach(block => {
                // Safeguard: Ensure block has a valid ID and isn't already preserved
                if (!block.id || preservedLinkedBlockIds.has(block.id)) return;

                // Ensure it's a UUID to prevent foreign key errors if any legacy bad data exists
                if (typeof block.id !== 'string' || !block.id.includes('-')) {
                    console.warn("Skipping itinerary block with invalid ID:", block.id, block.name);
                    return;
                }

                const totalPax = (tripData.profile.adults || 0) + (tripData.profile.children || 0);

                let vendorId = '';
                let vendorName = '';
                let vendorType: DBPurchaseOrder['vendor_type'] = 'other';
                let vendorAddress = '';
                let vendorPhone = '';
                let vendorEmail = '';
                let vendorRef: any = {};

                let price = block.agreedPrice || 0;
                let qty = 1;
                let roomConfig = '';
                let mlPlan = '';
                let vhType = '';

                if (block.type === 'sleep' && block.hotelId) {
                    const hotel = hotels.find((h: any) => h.id === block.hotelId);
                    vendorId = block.hotelId;
                    vendorRef = { hotel_id: block.hotelId };
                    vendorName = hotel ? hotel.name : (block.name || 'Selected Hotel');
                    vendorAddress = hotel?.location_address || '';
                    vendorPhone = hotel?.reservation_agent_contact || hotel?.gm_contact || '';
                    vendorEmail = hotel?.sales_agent_name || '';
                    vendorType = 'hotel';
                    const acc = tripData.accommodations?.find(a => a.nightIndex === block.dayNumber && (a.hotelId === block.hotelId || a.hotelName === hotel?.name));
                    roomConfig = acc?.beddingConfiguration || acc?.roomStandard || 'Standard Room';
                    mlPlan = acc?.mealPlan || 'BB';
                    price = acc?.pricePerNight || 0;
                    qty = acc?.numberOfRooms || 1;

                    // Smart Room Count: If totalPax is high and user hasn't explicitly set more rooms, 
                    // calculate based on capacity (Double=2, Triple=3, Single=1)
                    if (totalPax > 1 && qty <= 1) {
                        let capacity = 2; // Default to Double/Twin
                        const cfg = roomConfig.toLowerCase();
                        if (cfg.includes('triple')) capacity = 3;
                        else if (cfg.includes('single')) capacity = 1;
                        else if (cfg.includes('quad')) capacity = 4;

                        const suggestedRooms = Math.ceil(totalPax / capacity);
                        if (suggestedRooms > qty) {
                            qty = suggestedRooms;
                        }
                    }
                } else if (block.type === 'activity' && (block.vendorId || block.vendorActivityId)) {
                    const vendor = vendors.find((v: any) => v.id === block.vendorId);
                    vendorId = block.vendorId || '';
                    vendorRef = { activity_vendor_id: block.vendorId };
                    vendorName = vendor ? vendor.name : (block.serviceProvider || block.name);
                    vendorAddress = vendor?.address || '';
                    vendorPhone = vendor?.phone || '';
                    vendorEmail = vendor?.email || '';
                    vendorType = 'vendor';
                    qty = totalPax;
                    price = block.agreedPrice || 0;

                    // If we have a guide assigned to an activity, track it
                    if (block.guideId || tripData.defaultGuideId) {
                        if (!dayServiceMap.has(block.dayNumber)) dayServiceMap.set(block.dayNumber, new Set());
                        dayServiceMap.get(block.dayNumber)!.add('guide');
                    }
                } else if (block.type === 'travel') {
                    const effectiveTransportId = block.transportId || tripData.defaultTransportId;
                    if (effectiveTransportId) {
                        const provider = transports.find((t: any) => t.id === effectiveTransportId);
                        vendorId = effectiveTransportId;
                        vendorRef = { transport_provider_id: effectiveTransportId };
                        vendorName = provider ? provider.name : (block.serviceProvider || 'Transport Provider');
                        vendorAddress = provider?.address || '';
                        vendorPhone = provider?.phone || '';
                        vendorEmail = provider?.email || '';
                        vendorType = 'transport';

                        const effectiveVehicleId = block.vehicleId || tripData.defaultVehicleId;
                        const vehicleMatch = provider?.transport_vehicles?.find((v: any) => v.id === effectiveVehicleId);
                        vhType = vehicleMatch ? (vehicleMatch.make_and_model || vehicleMatch.vehicle_type) : (tripData.transports?.[0]?.mode || 'Standard Vehicle');
                        price = vehicleMatch?.day_rate || 0;

                        if (!dayServiceMap.has(block.dayNumber)) dayServiceMap.set(block.dayNumber, new Set());
                        dayServiceMap.get(block.dayNumber)!.add('transport');
                    }
                } else if (block.type === 'guide') {
                    const effectiveGuideId = block.guideId || tripData.defaultGuideId;
                    if (effectiveGuideId) {
                        const guide = guides.find((g: any) => g.id === effectiveGuideId);
                        vendorId = effectiveGuideId;
                        vendorRef = { guide_id: effectiveGuideId };
                        vendorName = guide ? `${guide.first_name} ${guide.last_name || ''}`.trim() : (block.serviceProvider || block.name);
                        vendorPhone = guide?.phone || '';
                        vendorType = 'guide';
                        price = guide?.per_day_rate || 0;

                        if (!dayServiceMap.has(block.dayNumber)) dayServiceMap.set(block.dayNumber, new Set());
                        dayServiceMap.get(block.dayNumber)!.add('guide');
                    }
                } else if (block.type === 'meal' && block.restaurantId) {
                    const rest = restaurants.find((r: any) => r.id === block.restaurantId);
                    vendorId = block.restaurantId;
                    vendorRef = { restaurant_id: block.restaurantId };
                    vendorName = rest ? rest.name : (block.serviceProvider || block.name);
                    vendorAddress = rest?.address || '';

                    // Use the specifically selected meal price, or fallback to lunch rate
                    price = block.agreedPrice || rest?.lunch_rate_per_head || 0;
                    qty = totalPax;

                    vendorPhone = rest?.contact_number || '';
                    vendorEmail = rest?.email || '';
                    vendorType = 'vendor';
                }

                if (!vendorId) return;

                let calculatedDate = '';
                if (tripData.profile.arrivalDate) {
                    const dateObj = new Date(tripData.profile.arrivalDate);
                    dateObj.setDate(dateObj.getDate() + (block.dayNumber - 1));
                    calculatedDate = dateObj.toISOString().split('T')[0];
                }

                const item: Partial<DBPurchaseOrderItem> = {
                    id: crypto.randomUUID(),
                    description: block.mealType ? `${block.name} - ${block.mealType}` : block.name,
                    service_date: calculatedDate, // Must be YYYY-MM-DD
                    quantity: qty,
                    total_price: (price * exchangeRate) * qty,
                    tour_itinerary_id: block.id,
                    day_number: block.dayNumber,
                    room_type: roomConfig,
                    meal_plan: mlPlan,
                    unit_price: price * exchangeRate,
                    vehicle_type: vhType,
                    number_of_guests: totalPax
                };

                // Add hotel specific dates if applicable
                if (block.type === 'sleep' && calculatedDate) {
                    item.check_in_date = calculatedDate;
                    const outDate = new Date(calculatedDate);
                    outDate.setDate(outDate.getDate() + 1);
                    item.check_out_date = outDate.toISOString().split('T')[0];
                    item.number_of_nights = 1;
                }

                if (!vendorMap.has(vendorId)) {
                    vendorMap.set(vendorId, {
                        name: vendorName,
                        type: vendorType,
                        address: vendorAddress,
                        phone: vendorPhone,
                        email: vendorEmail,
                        vendorRef,
                        items: []
                    });
                }
                vendorMap.get(vendorId)!.items.push(item);
            });

            // 2. Global Assignment Injector: Catch days where no blocks triggered a PO for global services
            for (let day = 1; day <= (tripData.profile.durationDays || 1); day++) {
                const totalPax = (tripData.profile.adults || 0) + (tripData.profile.children || 0);

                let calculatedDate = '';
                if (tripData.profile.arrivalDate) {
                    const dateObj = new Date(tripData.profile.arrivalDate);
                    dateObj.setDate(dateObj.getDate() + (day - 1));
                    calculatedDate = dateObj.toISOString().split('T')[0];
                }

                // Global Guide Synthesis
                if (tripData.defaultGuideId && !dayServiceMap.get(day)?.has('guide')) {
                    const guide = guides.find((g: any) => g.id === tripData.defaultGuideId);
                    if (guide) {
                        const price = guide.per_day_rate || 0;
                        const item: Partial<DBPurchaseOrderItem> = {
                            id: crypto.randomUUID(),
                            description: `Guide Service - Day ${day}`,
                            service_date: calculatedDate,
                            quantity: 1,
                            unit_price: price * exchangeRate,
                            total_price: price * exchangeRate,
                            day_number: day,
                            number_of_guests: totalPax
                        };

                        if (!vendorMap.has(tripData.defaultGuideId)) {
                            vendorMap.set(tripData.defaultGuideId, {
                                name: `${guide.first_name} ${guide.last_name || ''}`.trim(),
                                type: 'guide',
                                phone: guide.phone || '',
                                vendorRef: { guide_id: tripData.defaultGuideId },
                                items: []
                            });
                        }
                        vendorMap.get(tripData.defaultGuideId)!.items.push(item);
                    }
                }

                // Global Transport Synthesis
                if (tripData.defaultTransportId && !dayServiceMap.get(day)?.has('transport')) {
                    const provider = transports.find((t: any) => t.id === tripData.defaultTransportId);
                    if (provider) {
                        const effectiveVehicleId = tripData.defaultVehicleId;
                        const vehicleMatch = provider.transport_vehicles?.find((v: any) => v.id === effectiveVehicleId);
                        const price = vehicleMatch?.day_rate || 0;
                        const item: Partial<DBPurchaseOrderItem> = {
                            id: crypto.randomUUID(),
                            description: `Transport Service - Day ${day}`,
                            service_date: calculatedDate,
                            quantity: 1,
                            unit_price: price * exchangeRate,
                            total_price: price * exchangeRate,
                            day_number: day,
                            vehicle_type: vehicleMatch ? (vehicleMatch.make_and_model || vehicleMatch.vehicle_type) : 'Standard Vehicle',
                            number_of_guests: totalPax
                        };

                        if (!vendorMap.has(tripData.defaultTransportId)) {
                            vendorMap.set(tripData.defaultTransportId, {
                                name: provider.name,
                                type: 'transport',
                                address: provider.address || '',
                                phone: provider.phone || '',
                                email: provider.email || '',
                                vendorRef: { transport_provider_id: tripData.defaultTransportId },
                                items: []
                            });
                        }
                        vendorMap.get(tripData.defaultTransportId)!.items.push(item);
                    }
                }
            }

            const syncPromises: Promise<any>[] = [];

            vendorMap.forEach((data, vendorId) => {
                const total = data.items.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);

                const poData: Partial<DBPurchaseOrder> = {
                    tour_id: tourId,
                    vendor_type: data.type,
                    vendor_name: data.name,
                    vendor_address: data.address,
                    vendor_phone: data.phone,
                    vendor_email: data.email,
                    currency: 'LKR',
                    po_date: new Date().toISOString().split('T')[0],
                    status: 'Draft',
                    subtotal: total,
                    total_amount: total,
                    internal_notes: `Synced from Itinerary on ${new Date().toLocaleDateString()}`,
                    ...data.vendorRef
                };
                syncPromises.push(savePurchaseOrderAction(poData, data.items));
            });

            const results = await Promise.all(syncPromises);
            const errors = results.filter(r => r.error);

            if (errors.length > 0) {
                console.error("Some POs failed to save:", errors);
                alert(`Sync failed for ${errors.length} vendors. Error: ${errors[0].error}`);
            } else {
                await loadPOs();
                alert("Sync complete. Purchase Orders generated in DB.");
            }

        } catch (error) {
            console.error("Failed to sync with itinerary", error);
            alert("An error occurred while fetching supplier details for the Purchase Orders.");
        } finally {
            setIsSyncing(false);
        }
    };


    const openPODrawer = (poId: string, poObj?: any) => {
        setActivePOId(poId);
        if (poObj) {
            setEditingPO(JSON.parse(JSON.stringify(poObj)));
        } else {
            const po = dbPOs.find(p => p.id === poId);
            if (po) setEditingPO(JSON.parse(JSON.stringify(po)));
        }
    };

    const closePODrawer = () => {
        setActivePOId(null);
        setEditingPO(null);
    };

    const saveEditedPO = async () => {
        if (!editingPO) return;
        setIsSavingPO(true);
        try {
            await savePurchaseOrderAction(editingPO, editingPO.items || []);
            await loadPOs();
            alert("Purchase Order Saved Successfully.");
        } catch (error) {
            console.error("Failed to save PO", error);
            alert("Failed to save Purchase Order.");
        } finally {
            setIsSavingPO(false);
        }
    };

    const updateLocalPOStatus = async (newStatus: POStatus) => {
        if (!editingPO) return;
        const updated = { ...editingPO, status: newStatus };
        setEditingPO(updated);
        setIsSavingPO(true);
        try {
            await savePurchaseOrderAction(updated, updated.items || []);
            await loadPOs();
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setIsSavingPO(false);
        }
    };

    const updatePOStatus = async (po: DBPurchaseOrder, newStatus: POStatus) => {
        try {
            await savePurchaseOrderAction({ ...po, status: newStatus }, po.items || []);
            await loadPOs();
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const createManualPO = async (typeInfo: typeof manualPOTypes[0]) => {
        if (!tourId) {
            alert("Tour must be saved before creating POs.");
            return;
        }
        setIsCreatingManual(true);
        try {
            const nextNum = dbPOs.length + 1;
            const newPO: any = {
                id: crypto.randomUUID(),
                tour_id: tourId,
                po_number: `PO-MAN-${nextNum}-${Date.now().toString().slice(-3)}`,
                po_date: new Date().toISOString().split('T')[0],
                status: 'Draft',
                total_amount: 0,
                subtotal: 0,
                vendor_name: `Manual ${typeInfo.label} Vendor`,
                vendor_type: typeInfo.vendorType,
                items: []
            };
            await savePurchaseOrderAction(newPO, []);
            await loadPOs();
            openPODrawer(newPO.id, newPO);
            setIsCreatingManual(false);
        } catch (error) {
            console.error("Failed to create manual PO", error);
            setIsCreatingManual(false);
        }
    };

    const deletePO = async (id: string) => {
        if (!confirm("Delete this PO permanently?")) return;
        try {
            await deletePurchaseOrderAction(id);
            await loadPOs();
            if (activePOId === id) closePODrawer();
        } catch (error) {
            console.error("Failed to delete PO", error);
        }
    };

    const addPOItem = async (po: DBPurchaseOrder) => {
        const newItem: Partial<DBPurchaseOrderItem> = {
            id: crypto.randomUUID(),
            description: 'New Service Item',
            unit_price: 0,
            quantity: 1,
            total_price: 0
        };
        const updatedItems = [...(po.items || []), newItem];
        const newTotal = updatedItems.reduce((sum, i: any) => sum + (i.total_price || 0), 0);
        await savePurchaseOrderAction({ ...po, total_amount: newTotal, subtotal: newTotal }, updatedItems as DBPurchaseOrderItem[]);
        await loadPOs();
    };

    const deletePOItem = async (po: DBPurchaseOrder, itemId: string) => {
        const updatedItems = (po.items || []).filter(item => item.id !== itemId);
        const newTotal = updatedItems.reduce((sum, i) => sum + i.total_price, 0);
        await savePurchaseOrderAction({ ...po, total_amount: newTotal, subtotal: newTotal }, updatedItems);
        await loadPOs();
    };

    const updatePOItem = async (po: DBPurchaseOrder, itemId: string, updates: Partial<DBPurchaseOrderItem>) => {
        const updatedItems = (po.items || []).map(item => {
            if (item.id === itemId) {
                const refreshed = { ...item, ...updates };
                refreshed.total_price = (refreshed.unit_price || 0) * (refreshed.quantity || 1);
                return refreshed;
            }
            return item;
        });
        const newTotal = updatedItems.reduce((sum, i) => sum + i.total_price, 0);
        await savePurchaseOrderAction({ ...po, total_amount: newTotal, subtotal: newTotal }, updatedItems);
        await loadPOs();
    };


    const addLocalPOItem = () => {
        setEditingPO(prev => {
            if (!prev) return null;
            const newItem: Partial<DBPurchaseOrderItem> = {
                id: crypto.randomUUID(),
                description: 'New Service Item',
                unit_price: 0,
                quantity: 1,
                total_price: 0
            };
            const updatedItems = [...(prev.items || []), newItem];
            const newTotal = updatedItems.reduce((sum, i: any) => sum + (i.total_price || 0), 0);
            return { ...prev, items: updatedItems as DBPurchaseOrderItem[], total_amount: newTotal, subtotal: newTotal };
        });
    };

    const deleteLocalPOItem = (itemId: string) => {
        setEditingPO(prev => {
            if (!prev) return null;
            const updatedItems = (prev.items || []).filter(item => item.id !== itemId);
            const newTotal = updatedItems.reduce((sum, i) => sum + (i.total_price || 0), 0);
            return { ...prev, items: updatedItems, total_amount: newTotal, subtotal: newTotal };
        });
    };

    const updateLocalPOItem = (itemId: string, updates: Partial<DBPurchaseOrderItem>) => {
        setEditingPO(prev => {
            if (!prev) return null;
            const updatedItems = (prev.items || []).map(item => {
                if (item.id === itemId) {
                    const refreshed = { ...item, ...updates };
                    refreshed.total_price = (refreshed.unit_price || 0) * (refreshed.quantity || 1);
                    return refreshed;
                }
                return item;
            });
            const newTotal = updatedItems.reduce((sum, i) => sum + (i.total_price || 0), 0);
            return { ...prev, items: updatedItems, total_amount: newTotal, subtotal: newTotal };
        });
    };

    const activePO = useMemo(() => dbPOs.find(po => po.id === activePOId), [dbPOs, activePOId]);
    const summaryData = useMemo(() => {
        const totalSent = dbPOs.filter(p => p.status !== 'Draft' && p.status !== 'Pending Confirmation').reduce((sum, p) => sum + p.total_amount, 0);
        const totalPending = dbPOs.filter(p => p.status === 'Draft' || p.status === 'Pending Confirmation').reduce((sum, p) => sum + p.total_amount, 0);
        return { totalSent, totalPending, count: dbPOs.length };
    }, [dbPOs]);

    const filteredPOs = useMemo(() => {
        return dbPOs.filter(po => {
            const matchesStatus = activeStatusTab === 'All' || po.status === activeStatusTab;
            const matchesSearch = po.vendor_name?.toLowerCase().includes(poSearchTerm.toLowerCase()) ||
                po.po_number?.toLowerCase().includes(poSearchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [dbPOs, activeStatusTab, poSearchTerm]);

    const togglePOSelection = (id: string) => {
        setSelectedPOIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAllSelection = () => {
        if (selectedPOIds.length === filteredPOs.length) {
            setSelectedPOIds([]);
        } else {
            setSelectedPOIds(filteredPOs.map(po => po.id));
        }
    };

    const generateInvoice = async (po: DBPurchaseOrder) => {
        // Check if invoice already exists
        if (po.invoices && po.invoices.length > 0) {
            alert("A supplier invoice already exists for this PO.");
            return;
        }

        const newInvoice: Partial<DBVendorInvoice> = {
            purchase_order_id: po.id,
            invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
            amount: po.total_amount,
            status: 'Pending',
            invoice_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days later
        };

        try {
            await saveVendorInvoiceAction(newInvoice);
            await loadPOs();
        } catch (error) {
            console.error("Failed to generate invoice", error);
        }
    };


    const generateInvoiceLocal = async (po: DBPurchaseOrder) => {
        if (po.invoices && po.invoices.length > 0) {
            alert("A supplier invoice already exists for this PO.");
            return;
        }
        setIsSavingPO(true);
        try {
            await savePurchaseOrderAction(po, po.items || []);
            const newInvoice: Partial<DBVendorInvoice> = {
                purchase_order_id: po.id,
                invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
                amount: po.total_amount,
                status: 'Pending',
                invoice_date: new Date().toISOString().split('T')[0],
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            };
            await saveVendorInvoiceAction(newInvoice);
            setEditingPO(prev => prev ? { ...prev, invoices: [...(prev.invoices || []), newInvoice as any] } : null);
            await loadPOs();
        } catch (error) {
            console.error("Failed to generate invoice", error);
        } finally {
            setIsSavingPO(false);
        }
    };

    const updateInvoiceStatusLocal = async (invoice: DBVendorInvoice, newStatus: DBVendorInvoice['status']) => {
        try {
            await saveVendorInvoiceAction({ ...invoice, status: newStatus });
            setEditingPO(prev => {
                if (!prev) return null;
                const updatedInvoices = (prev.invoices || []).map(i => i.id === invoice.id ? { ...i, status: newStatus } : i);
                return { ...prev, invoices: updatedInvoices };
            });
            await loadPOs();
        } catch (error) {
            console.error("Failed to update invoice status", error);
        }
    };

    const updateInvoiceStatus = async (invoice: DBVendorInvoice, newStatus: DBVendorInvoice['status']) => {
        try {
            await saveVendorInvoiceAction({ ...invoice, status: newStatus });
            await loadPOs();
        } catch (error) {
            console.error("Failed to update invoice status", error);
        }
    };

    const totalInternalCost = useMemo(() => {
        return dbPOs.reduce((sum, po) => sum + po.total_amount, 0);
    }, [dbPOs]);

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
                    <div className="flex flex-col items-end">
                        <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight">Exchange Rate (USD → LKR)</label>
                        <div className="flex items-center gap-2">
                            {isLoadingRate && <RefreshCw size={12} className="animate-spin text-brand-gold" />}
                            <input
                                type="number"
                                value={exchangeRate}
                                onChange={(e) => setExchangeRate(Number(e.target.value))}
                                className="w-20 text-right bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-sm font-bold focus:ring-1 focus:ring-brand-gold outline-none"
                            />
                        </div>
                    </div>
                    <div className="relative group">
                        <button
                            disabled={isCreatingManual}
                            className={`flex items-center gap-2 bg-white text-brand-gold border border-brand-gold/20 px-5 py-2.5 rounded-2xl hover:bg-neutral-50 transition-all font-bold text-sm ${isCreatingManual ? 'opacity-50' : ''}`}
                        >
                            {isCreatingManual ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                            Manual PO
                            <ChevronRight size={14} className="rotate-90 text-brand-gold/40" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-neutral-100 rounded-2xl shadow-xl py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                            {manualPOTypes.map(t => (
                                <button
                                    key={t.type}
                                    onClick={() => createManualPO(t)}
                                    className="w-full text-left px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-brand-gold/5 hover:text-brand-gold transition-colors"
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={syncWithItinerary}
                        disabled={isSyncing}
                        className="flex items-center gap-2 bg-brand-gold text-white px-5 py-2.5 rounded-2xl hover:bg-yellow-600 transition-all shadow-lg shadow-yellow-200/50 font-bold text-sm disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'Syncing...' : 'Sync with Itinerary'}
                    </button>
                </div>
            </div>

            {/* Financial Summary Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-[32px] border border-neutral-100 shadow-sm">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">Total Commitments</p>
                    <p className="text-2xl font-bold text-neutral-800">Rs. {totalInternalCost.toLocaleString()}</p>
                </div>
                <div className="bg-white p-5 rounded-[32px] border border-neutral-100 shadow-sm">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">POs Issued</p>
                    <p className="text-2xl font-bold text-brand-gold">{dbPOs.length}</p>
                </div>
                <div className="bg-white p-5 rounded-[32px] border border-neutral-100 shadow-sm">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">Paid to Suppliers</p>
                    <p className="text-2xl font-bold text-green-600">
                        Rs. {dbPOs.flatMap(po => po.invoices || []).filter(i => i.status === 'Paid' || i.status === 'Confirmed').reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-brand-green p-5 rounded-[32px] shadow-lg shadow-brand-green/20">
                    <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-1">Invoiced to Client</p>
                    <p className="text-2xl font-bold text-white">Rs. {tripData.financials.sellingPrice.toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Purchase Orders List */}
                <div className="lg:col-span-12 space-y-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-neutral-200 shadow-sm overflow-x-auto max-w-full">
                            {['All', 'Draft', 'Sent', 'Accepted', 'Completed'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveStatusTab(tab as any)}
                                    className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeStatusTab === tab
                                        ? 'bg-brand-gold text-white shadow-md'
                                        : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-2.5 text-neutral-300" size={16} />
                            <input
                                type="text"
                                placeholder="Search by Vendor or PO #"
                                value={poSearchTerm}
                                onChange={(e) => setPoSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-2xl text-xs focus:ring-1 focus:ring-brand-gold outline-none shadow-sm transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="text-brand-gold" size={20} />
                        <h4 className="text-lg font-serif font-bold text-brand-charcoal">Supplier Purchase Orders</h4>
                    </div>

                    {isLoadingPOs ? (
                        <div className="flex items-center justify-center p-12 bg-neutral-50 rounded-[40px] border border-dashed border-neutral-200">
                            <RefreshCw className="animate-spin text-neutral-400" size={32} />
                        </div>
                    ) : dbPOs.length === 0 ? (
                        <div className="bg-neutral-50 p-12 text-center rounded-[40px] border border-dashed border-neutral-200">
                            <p className="text-neutral-400 italic">No POs generated yet. Click "Sync with Itinerary" to aggregate costs.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[40px] border border-neutral-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-neutral-50 border-b border-neutral-200">
                                        <th className="p-4 pl-6 w-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedPOIds.length === filteredPOs.length && filteredPOs.length > 0}
                                                onChange={toggleAllSelection}
                                                className="w-4 h-4 rounded border-neutral-300 text-brand-gold focus:ring-brand-gold"
                                            />
                                        </th>
                                        <th className="p-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">PO Details</th>
                                        <th className="p-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest hidden md:table-cell">Vendor</th>
                                        <th className="p-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Service Dates</th>
                                        <th className="p-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Status</th>
                                        <th className="p-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Amount</th>
                                        <th className="p-4 pr-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {filteredPOs.map((po) => {
                                        const invoice = po.invoices?.[0];
                                        return (
                                            <tr key={po.id} className={`hover:bg-neutral-50 transition-colors group ${activePOId === po.id ? 'bg-brand-gold/5' : ''}`}>
                                                <td className="p-4 pl-6">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPOIds.includes(po.id)}
                                                        onChange={() => togglePOSelection(po.id)}
                                                        className="w-4 h-4 rounded border-neutral-300 text-brand-gold focus:ring-brand-gold"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-mono font-bold text-neutral-800">{po.po_number}</span>
                                                        <span className="text-[10px] text-neutral-400">{po.po_date}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 hidden md:table-cell">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-neutral-700">{po.vendor_name || 'Generic Vendor'}</span>
                                                        <span className="text-[10px] text-brand-gold font-bold uppercase">{po.vendor_type}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        {(() => {
                                                            const items = po.items || [];
                                                            const days = items.map(i => i.day_number).filter((d): d is number => d != null);
                                                            const dates = items.map(i => i.service_date).filter((d): d is string => !!d);

                                                            if (days.length === 0 && dates.length === 0) return <span className="text-[10px] text-neutral-300 italic">No schedules</span>;

                                                            const minDay = days.length > 0 ? Math.min(...days) : null;
                                                            const maxDay = days.length > 0 ? Math.max(...days) : null;
                                                            const sortedDates = [...new Set(dates)].sort();
                                                            const minDate = sortedDates[0];
                                                            const maxDate = sortedDates[sortedDates.length - 1];

                                                            const dateTooltip = sortedDates.join('\n');

                                                            return (
                                                                <div title={sortedDates.length > 1 ? `Service Dates:\n${dateTooltip}` : undefined}>
                                                                    <span className="text-[10px] font-black text-neutral-700">
                                                                        {minDay != null ? (minDay === maxDay ? `Day ${minDay}` : `Day ${minDay}-${maxDay}`) : 'Manual Entry'}
                                                                    </span>
                                                                    <span className="text-[9px] text-neutral-400 font-medium block">
                                                                        {minDate ? (minDate === maxDate ? minDate : `${minDate} ... ${maxDate}`) : 'Dates TBD'}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full tracking-tighter inline-block
                                                        ${po.status === 'Draft' ? 'bg-neutral-100 text-neutral-500' :
                                                            po.status === 'Sent' ? 'bg-blue-100 text-blue-600' :
                                                                po.status === 'Accepted' ? 'bg-green-100 text-green-600' : 'bg-brand-gold/20 text-brand-gold'}`}>
                                                        {po.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <p className="text-sm font-bold text-brand-green">Rs. {po.total_amount.toLocaleString()}</p>
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setPreviewPO(po); }}
                                                            className="p-2 hover:bg-brand-gold/10 text-brand-gold rounded-lg transition-all"
                                                            title="Preview & Print"
                                                        >
                                                            <FileText size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (confirm(`Delete PO ${po.po_number}?`)) {
                                                                    deletePO(po.id);
                                                                    if (activePOId === po.id) closePODrawer();
                                                                }
                                                            }}
                                                            className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-all"
                                                            title="Delete PO"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); if (activePOId === po.id) closePODrawer(); else openPODrawer(po.id); }}
                                                            className={`p-2 rounded-lg transition-all ${activePOId === po.id ? 'bg-brand-gold text-white shadow-md' : 'hover:bg-neutral-100 text-neutral-400'}`}
                                                            title="Manage Details"
                                                        >
                                                            <Settings size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredPOs.length === 0 && (
                                <div className="p-12 text-center text-neutral-400 italic">
                                    No POs found matching your filters.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bulk Selection Action Bar */}
                    {selectedPOIds.length > 0 && (
                        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-brand-charcoal text-white px-8 py-4 rounded-[32px] shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom duration-500">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-black text-brand-gold tracking-widest leading-none mb-1">Bulk Actions</span>
                                <span className="text-sm font-bold">{selectedPOIds.length} POs Selected</span>
                            </div>
                            <div className="h-8 w-[1px] bg-white/10"></div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        if (confirm(`Confirm status update for ${selectedPOIds.length} POs?`)) {
                                            selectedPOIds.forEach(id => {
                                                const po = dbPOs.find(p => p.id === id);
                                                if (po && po.status === 'Draft') updatePOStatus(po, 'Sent');
                                            });
                                            setSelectedPOIds([]);
                                        }
                                    }}
                                    className="px-6 py-2 bg-brand-gold text-white rounded-xl text-xs font-bold uppercase transition-all hover:bg-yellow-600 flex items-center gap-2"
                                >
                                    <Send size={14} /> Issue Selected
                                </button>
                                <button
                                    onClick={() => setSelectedPOIds([])}
                                    className="text-xs font-bold text-white/60 hover:text-white transition-colors"
                                >
                                    Clear Selection
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* PO Detail Side Drawer */}
                {activePOId && editingPO && (
                    <div className="fixed inset-0 z-50 flex items-center justify-end bg-brand-charcoal/20 backdrop-blur-sm no-print">
                        <div className="w-full max-w-2xl h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden flex flex-col">
                            <div className="p-8 border-b flex items-center justify-between bg-neutral-50">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-2xl">
                                        <Settings size={24} />
                                    </div>
                                    <div className="flex-1 min-w-[300px]">
                                        <input
                                            value={editingPO?.vendor_name || ""}
                                            onChange={(e) => setEditingPO(prev => prev ? { ...prev, vendor_name: e.target.value } : null)}
                                            placeholder="Enter Vendor Name"
                                            className="text-xl font-serif font-bold text-brand-green bg-transparent border-none p-0 focus:ring-0 w-full placeholder:text-neutral-300"
                                        />
                                        <p className="text-xs text-neutral-400 font-mono font-bold uppercase tracking-widest">{editingPO?.po_number}</p>
                                    </div>
                                </div>
                                <button onClick={() => closePODrawer()} className="p-3 hover:bg-white rounded-full transition-colors border border-transparent hover:border-neutral-200">
                                    <X size={24} className="text-neutral-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-10">
                                {/* Vendor Details & Category */}
                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">Vendor Details & Category</h5>
                                    <div className="bg-neutral-50 p-6 rounded-[32px] border border-neutral-100 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[9px] text-neutral-400 uppercase font-black">Category (Type)</label>
                                                <select
                                                    value={editingPO?.vendor_type}
                                                    onChange={(e) => {
                                                        if (!editingPO) return;
                                                        // Reset provider references when category changes
                                                        const updates: Partial<DBPurchaseOrder> = {
                                                            vendor_type: e.target.value as any,
                                                            hotel_id: null as any,
                                                            activity_vendor_id: null as any,
                                                            transport_provider_id: null as any,
                                                            guide_id: null as any,
                                                            restaurant_id: null as any
                                                        };
                                                        setEditingPO(prev => prev ? { ...prev, ...updates } : null);
                                                    }}
                                                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2 text-xs font-bold focus:ring-1 focus:ring-brand-gold"
                                                >
                                                    <option value="vendor">Activity / Experience</option>
                                                    <option value="transport">Transport / Travel</option>
                                                    <option value="hotel">Accommodation / Sleep</option>
                                                    <option value="restaurant">Restaurant / Meal</option>
                                                    <option value="guide">Guide Service</option>
                                                    <option value="other">Buffer / Wait / Custom</option>
                                                </select>
                                            </div>

                                            {/* Dynamic Provider Selection based on Category */}
                                            {editingPO?.vendor_type !== 'other' && (
                                                <div className="space-y-1">
                                                    <label className="text-[9px] text-neutral-400 uppercase font-black">Select Provider (Master Data)</label>
                                                    <select
                                                        value={
                                                            editingPO?.vendor_type === 'hotel' ? editingPO.hotel_id || "" :
                                                                editingPO?.vendor_type === 'vendor' ? editingPO.activity_vendor_id || "" :
                                                                    editingPO?.vendor_type === 'transport' ? editingPO.transport_provider_id || "" :
                                                                        editingPO?.vendor_type === 'guide' ? editingPO.guide_id || "" :
                                                                            editingPO?.vendor_type === 'restaurant' ? editingPO.restaurant_id || "" : ""
                                                        }
                                                        onChange={(e) => {
                                                            if (!editingPO) return;
                                                            const val = e.target.value;
                                                            let updates: Partial<DBPurchaseOrder> = {};
                                                            let selectedProvider: any = null;

                                                            if (editingPO.vendor_type === 'hotel') {
                                                                updates.hotel_id = val;
                                                                selectedProvider = masterHotels.find(h => h.id === val);
                                                                if (selectedProvider) {
                                                                    updates.vendor_name = selectedProvider.name;
                                                                    updates.vendor_phone = selectedProvider.reservation_agent_contact || selectedProvider.gm_contact || '';
                                                                    updates.vendor_email = selectedProvider.sales_agent_name || ''; // Should ideally be email, mapping from existing logic
                                                                    updates.vendor_address = selectedProvider.location_address || '';
                                                                }
                                                            } else if (editingPO.vendor_type === 'vendor') {
                                                                updates.activity_vendor_id = val;
                                                                selectedProvider = masterVendors.find(v => v.id === val);
                                                                if (selectedProvider) {
                                                                    updates.vendor_name = selectedProvider.name;
                                                                    updates.vendor_phone = selectedProvider.phone || '';
                                                                    updates.vendor_email = selectedProvider.email || '';
                                                                    updates.vendor_address = selectedProvider.address || '';
                                                                }
                                                            } else if (editingPO.vendor_type === 'transport') {
                                                                updates.transport_provider_id = val;
                                                                selectedProvider = masterTransports.find(t => t.id === val);
                                                                if (selectedProvider) {
                                                                    updates.vendor_name = selectedProvider.name;
                                                                    updates.vendor_phone = selectedProvider.phone || '';
                                                                    updates.vendor_email = selectedProvider.email || '';
                                                                    updates.vendor_address = selectedProvider.address || '';
                                                                }
                                                            } else if (editingPO.vendor_type === 'guide') {
                                                                updates.guide_id = val;
                                                                selectedProvider = masterGuides.find(g => g.id === val);
                                                                if (selectedProvider) {
                                                                    updates.vendor_name = `${selectedProvider.first_name} ${selectedProvider.last_name || ''}`.trim();
                                                                    updates.vendor_phone = selectedProvider.phone || '';
                                                                    updates.vendor_email = '';
                                                                    updates.vendor_address = '';
                                                                }
                                                            } else if (editingPO.vendor_type === 'restaurant') {
                                                                updates.restaurant_id = val;
                                                                selectedProvider = masterRestaurants.find(r => r.id === val);
                                                                if (selectedProvider) {
                                                                    updates.vendor_name = selectedProvider.name;
                                                                    updates.vendor_phone = selectedProvider.contact_number || '';
                                                                    updates.vendor_email = selectedProvider.email || '';
                                                                    updates.vendor_address = selectedProvider.address || '';
                                                                }
                                                            }

                                                            setEditingPO(prev => prev ? { ...prev, ...updates } : null);
                                                        }}
                                                        className="w-full bg-white border border-brand-gold/30 rounded-xl px-4 py-2 text-xs font-bold text-brand-green focus:ring-1 focus:ring-brand-gold"
                                                    >
                                                        <option value="">-- Custom / Unlinked --</option>
                                                        {editingPO?.vendor_type === 'hotel' && masterHotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                                        {editingPO?.vendor_type === 'vendor' && masterVendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                                        {editingPO?.vendor_type === 'transport' && masterTransports.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                        {editingPO?.vendor_type === 'guide' && masterGuides.map(g => <option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>)}
                                                        {editingPO?.vendor_type === 'restaurant' && masterRestaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[9px] text-neutral-400 uppercase font-black">Phone Number</label>
                                                <input
                                                    value={editingPO?.vendor_phone || ""}
                                                    onChange={(e) => setEditingPO(prev => prev ? { ...prev, vendor_phone: e.target.value } : null)}
                                                    placeholder="T: +94 ..."
                                                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2 text-xs font-bold focus:ring-1 focus:ring-brand-gold"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-neutral-400 uppercase font-black">Email Address</label>
                                            <input
                                                value={editingPO?.vendor_email || ""}
                                                onChange={(e) => setEditingPO(prev => prev ? { ...prev, vendor_email: e.target.value } : null)}
                                                placeholder="E: bookings@..."
                                                className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2 text-xs font-bold focus:ring-1 focus:ring-brand-gold"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-neutral-400 uppercase font-black">Physical Address</label>
                                            <textarea
                                                rows={2}
                                                value={editingPO?.vendor_address || ""}
                                                onChange={(e) => setEditingPO(prev => prev ? { ...prev, vendor_address: e.target.value } : null)}
                                                placeholder="Street, City, Country"
                                                className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2 text-xs font-bold focus:ring-1 focus:ring-brand-gold resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Status Control */}
                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">Management Actions</h5>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-neutral-50 rounded-[24px] border border-neutral-100">
                                            <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-tight mb-2">PO Status</p>
                                            <div className="flex flex-wrap gap-2">
                                                {editingPO?.status === 'Draft' && (
                                                    <button onClick={() => editingPO && updateLocalPOStatus('Sent')} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold uppercase hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                                                        <Send size={12} /> Issue PO
                                                    </button>
                                                )}
                                                {editingPO?.status === 'Sent' && (
                                                    <button onClick={() => editingPO && updateLocalPOStatus('Accepted')} className="flex-1 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-bold uppercase hover:bg-green-100 transition-colors flex items-center justify-center gap-2">
                                                        <Check size={12} /> Confirm Accept
                                                    </button>
                                                )}
                                                {editingPO?.status === 'Accepted' && !editingPO.invoices?.length && (
                                                    <button onClick={() => editingPO && generateInvoiceLocal(editingPO)} className="flex-1 py-2 bg-brand-gold text-white rounded-xl text-[10px] font-bold uppercase hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2">
                                                        <Receipt size={12} /> Generate INV
                                                    </button>
                                                )}
                                                {editingPO?.status !== 'Draft' && (
                                                    <p className="text-xs font-bold text-neutral-700 w-full text-center py-2">{editingPO?.status}</p>
                                                )}
                                            </div>

                                            {/* Tracking Fields based on Status */}
                                            {editingPO?.status === 'Sent' && (
                                                <div className="mt-4 space-y-2 border-t border-neutral-200/60 pt-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] text-neutral-400 uppercase font-black">Sent To Name</label>
                                                        <input
                                                            value={editingPO?.sent_to_name || ""}
                                                            onChange={(e) => setEditingPO(prev => prev ? { ...prev, sent_to_name: e.target.value } : null)}
                                                            className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-[10px] font-bold focus:ring-1 focus:ring-brand-gold"
                                                            placeholder="Contact Person"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] text-neutral-400 uppercase font-black">Sent Email</label>
                                                        <input
                                                            value={editingPO?.sent_email || ""}
                                                            onChange={(e) => setEditingPO(prev => prev ? { ...prev, sent_email: e.target.value } : null)}
                                                            className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-[10px] font-bold focus:ring-1 focus:ring-brand-gold"
                                                            placeholder="example@vendor.com"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {editingPO?.status === 'Accepted' && (
                                                <div className="mt-4 space-y-2 border-t border-neutral-200/60 pt-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] text-neutral-400 uppercase font-black">Accepted By Name</label>
                                                        <input
                                                            value={editingPO?.accepted_by_name || ""}
                                                            onChange={(e) => setEditingPO(prev => prev ? { ...prev, accepted_by_name: e.target.value } : null)}
                                                            className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-[10px] font-bold focus:ring-1 focus:ring-brand-gold"
                                                            placeholder="Vendor Representative"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] text-neutral-400 uppercase font-black">Accepted Date</label>
                                                        <input
                                                            type="date"
                                                            value={editingPO?.accepted_date ? editingPO.accepted_date.split('T')[0] : ""}
                                                            onChange={(e) => setEditingPO(prev => prev ? { ...prev, accepted_date: e.target.value ? new Date(e.target.value).toISOString() : undefined } : null)}
                                                            className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-[10px] font-bold focus:ring-1 focus:ring-brand-gold"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 bg-neutral-50 rounded-[24px] border border-neutral-100 flex items-center justify-center">
                                            <button onClick={() => editingPO && setPreviewPO(editingPO)} className="w-full h-full flex flex-col items-center justify-center gap-2 text-brand-gold hover:text-yellow-600 transition-colors">
                                                <FileText size={20} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Main Preview</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Line Items */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h5 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">Purchase Order Items</h5>
                                        <button onClick={() => editingPO && addLocalPOItem()} className="px-4 py-1.5 bg-brand-gold/10 text-brand-gold rounded-full text-[10px] font-bold uppercase transition-all hover:bg-brand-gold hover:text-white flex items-center gap-1.5">
                                            <Plus size={12} /> Add Item
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {(editingPO?.items || []).map(item => (
                                            <div key={item.id} className="p-5 bg-white rounded-[24px] border border-neutral-100 shadow-sm relative group/item">
                                                <button
                                                    onClick={() => editingPO && deleteLocalPOItem(item.id)}
                                                    className="absolute -top-2 -right-2 p-1.5 bg-red-50 text-red-500 border border-red-100 rounded-full hover:bg-red-100 transition-all opacity-0 group-hover/item:opacity-100"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                                <div className="grid grid-cols-12 gap-4">
                                                    <div className="col-span-12 md:col-span-8">
                                                        <label className="text-[9px] text-neutral-400 uppercase font-black mb-1 block">Description</label>

                                                        {editingPO?.vendor_type === 'transport' && editingPO?.transport_provider_id ? (
                                                            <div className="space-y-2">
                                                                <input
                                                                    value={item.description}
                                                                    onChange={(e) => editingPO && updateLocalPOItem(item.id, { description: e.target.value })}
                                                                    className="w-full text-sm font-bold bg-neutral-50 border-none rounded-xl px-4 py-2 focus:ring-1 focus:ring-brand-gold"
                                                                    placeholder="Custom transport description"
                                                                />
                                                                <select
                                                                    value={item.vehicle_type || ''}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        const provider = masterTransports.find(t => t.id === editingPO?.transport_provider_id);
                                                                        const vehicle = provider?.vehicles?.find((v: any) => v.type === val);
                                                                        if (vehicle && editingPO) {
                                                                            updateLocalPOItem(item.id, {
                                                                                vehicle_type: vehicle.type,
                                                                                unit_price: vehicle.day_rate,
                                                                                description: `${vehicle.type} - Daily Rate`
                                                                            });
                                                                        } else if (val === '' && editingPO) {
                                                                            updateLocalPOItem(item.id, { vehicle_type: '' });
                                                                        }
                                                                    }}
                                                                    className="w-full text-xs font-bold bg-white border border-brand-gold/30 rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-brand-gold text-brand-green"
                                                                >
                                                                    <option value="">-- Select Vehicle from Provider --</option>
                                                                    {masterTransports.find(t => t.id === editingPO?.transport_provider_id)?.vehicles?.map((v: any, i: number) => (
                                                                        <option key={i} value={v.type}>{v.type} (LKR {v.day_rate.toLocaleString()}/day)</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ) : editingPO?.vendor_type === 'hotel' && editingPO?.hotel_id ? (
                                                            <div className="space-y-2">
                                                                <input
                                                                    value={item.description}
                                                                    onChange={(e) => editingPO && updateLocalPOItem(item.id, { description: e.target.value })}
                                                                    className="w-full text-sm font-bold bg-neutral-50 border-none rounded-xl px-4 py-2 focus:ring-1 focus:ring-brand-gold"
                                                                    placeholder="Custom room description"
                                                                />
                                                                <select
                                                                    value={item.room_type || ''}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        const provider = masterHotels.find(h => h.id === editingPO?.hotel_id);
                                                                        const room = provider?.rooms?.find((r: any) => r.type === val);
                                                                        if (room && editingPO) {
                                                                            updateLocalPOItem(item.id, {
                                                                                room_type: room.type,
                                                                                unit_price: room.price_per_night,
                                                                                description: `1x ${room.type}`
                                                                            });
                                                                        } else if (val === '' && editingPO) {
                                                                            updateLocalPOItem(item.id, { room_type: '' });
                                                                        }
                                                                    }}
                                                                    className="w-full text-xs font-bold bg-white border border-brand-gold/30 rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-brand-gold text-brand-green"
                                                                >
                                                                    <option value="">-- Select Room from Hotel --</option>
                                                                    {masterHotels.find(h => h.id === editingPO?.hotel_id)?.rooms?.map((r: any, i: number) => (
                                                                        <option key={i} value={r.type}>{r.type} (LKR {r.price_per_night.toLocaleString()}/night)</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ) : editingPO?.vendor_type === 'guide' && editingPO?.guide_id ? (
                                                            <div className="space-y-2">
                                                                <input
                                                                    value={item.description}
                                                                    onChange={(e) => editingPO && updateLocalPOItem(item.id, { description: e.target.value })}
                                                                    className="w-full text-sm font-bold bg-neutral-50 border-none rounded-xl px-4 py-2 focus:ring-1 focus:ring-brand-gold"
                                                                    placeholder="Custom guide description"
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        const provider = masterGuides.find(g => g.id === editingPO?.guide_id);
                                                                        if (provider && provider.per_day_rate && editingPO) {
                                                                            updateLocalPOItem(item.id, {
                                                                                unit_price: provider.per_day_rate,
                                                                                description: 'Guide Services - Daily Rate'
                                                                            });
                                                                        }
                                                                    }}
                                                                    className="w-full text-xs font-bold bg-brand-gold/10 text-brand-gold border border-brand-gold/30 rounded-xl px-3 py-1.5 hover:bg-brand-gold hover:text-white transition-colors"
                                                                >
                                                                    Apply Guide Daily Rate (LKR {masterGuides.find(g => g.id === editingPO?.guide_id)?.per_day_rate?.toLocaleString() || '0'})
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <input
                                                                value={item.description}
                                                                onChange={(e) => updateLocalPOItem(item.id, { description: e.target.value })}
                                                                className="w-full text-sm font-bold bg-neutral-50 border-none rounded-xl px-4 py-2 focus:ring-1 focus:ring-brand-gold"
                                                                placeholder="Item Description"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="col-span-12 md:col-span-4">
                                                        <label className="text-[9px] text-neutral-400 uppercase font-black mb-1 block">Service Date</label>
                                                        <input
                                                            type="date"
                                                            value={item.service_date || ""}
                                                            onChange={(e) => updateLocalPOItem(item.id, { service_date: e.target.value })}
                                                            className="w-full text-sm font-bold bg-neutral-50 border-none rounded-xl px-4 py-2 focus:ring-1 focus:ring-brand-gold"
                                                        />
                                                    </div>
                                                    <div className="col-span-4">
                                                        <label className="text-[9px] text-neutral-400 uppercase font-black mb-1 block">Qty</label>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateLocalPOItem(item.id, { quantity: Number(e.target.value) })}
                                                            className="w-full text-sm font-bold bg-neutral-50 border-none rounded-xl px-4 py-2 focus:ring-1 focus:ring-brand-gold text-center"
                                                        />
                                                    </div>
                                                    <div className="col-span-8">
                                                        <label className="text-[9px] text-neutral-400 uppercase font-black mb-1 block">Unit Price (LKR)</label>
                                                        <input
                                                            type="number"
                                                            value={item.unit_price}
                                                            onChange={(e) => updateLocalPOItem(item.id, { unit_price: Number(e.target.value) })}
                                                            className="w-full text-sm font-bold bg-neutral-50 border-none rounded-xl px-4 py-2 focus:ring-1 focus:ring-brand-gold text-right"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Invoice Section */}
                                {editingPO?.invoices?.map(inv => (
                                    <div key={inv.id} className="space-y-4">
                                        <h5 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">Supplier Invoice Control</h5>
                                        <div className="p-6 bg-brand-green/5 rounded-[32px] border border-brand-green/10 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-brand-green/10 text-brand-green rounded-xl">
                                                        <Receipt size={18} />
                                                    </div>
                                                    <span className="text-sm font-bold text-brand-charcoal">{inv.invoice_number}</span>
                                                </div>
                                                <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${inv.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                                                    }`}>
                                                    {inv.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] text-neutral-400 uppercase font-black">Payment Status</label>
                                                    <select
                                                        value={inv.status}
                                                        onChange={(e) => updateInvoiceStatusLocal(inv, e.target.value as any)}
                                                        className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-1 focus:ring-brand-gold"
                                                    >
                                                        <option value="Pending">Pending Audit</option>
                                                        <option value="Received">Invoice Received</option>
                                                        <option value="Paid">Processed (Bank Wire)</option>
                                                        <option value="Confirmed">Supplier Confirmed</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] text-neutral-400 uppercase font-black">Due Date</label>
                                                    <p className="px-4 py-2.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
                                                        {inv.due_date}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-8 border-t bg-neutral-50 flex items-center justify-between">
                                <button
                                    onClick={saveEditedPO}
                                    disabled={isSavingPO}
                                    className="px-8 py-3 bg-brand-gold text-white font-bold rounded-2xl hover:bg-yellow-600 transition-all flex items-center gap-2 shadow-lg"
                                >
                                    {isSavingPO ? <RefreshCw size={18} className="animate-spin" /> : <Check size={18} />}
                                    {isSavingPO ? 'Saving...' : 'Save PO Changes'}
                                </button>
                                <div className="flex flex-col text-right">
                                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Total Commitment</span>
                                    <span className="text-2xl font-serif font-black text-brand-green">Rs. {editingPO?.total_amount.toLocaleString()}</span>
                                </div>
                                <button onClick={() => {
                                    if (editingPO && confirm("Delete this PO?")) {
                                        deletePO(editingPO.id);
                                        closePODrawer();
                                    }
                                }} className="p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Legacy Cost Breakdown (Optional - and Selling Price Control) */}
                <div className="lg:col-span-12 mt-8">
                    <div className="bg-white p-8 rounded-[40px] border border-neutral-200 shadow-xl overflow-hidden relative">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-brand-gold/5 rounded-full -mr-16 -mt-16"></div>

                        <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
                            <div className="flex-1 space-y-6">
                                <div>
                                    <h4 className="text-xl font-serif font-bold text-brand-green">Total Project P&L</h4>
                                    <p className="text-sm text-neutral-500">Consolidated margin analysis after all vendor bookings.</p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div>
                                        <p className="text-[10px] text-neutral-400 font-bold uppercase mb-1">Commitments</p>
                                        <p className="text-xl font-bold text-neutral-800">Rs. {totalInternalCost.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-neutral-400 font-bold uppercase mb-1">Commission/Markup</p>
                                        <p className="text-xl font-bold text-blue-600">Rs. {(tripData.financials.sellingPrice - totalInternalCost).toLocaleString()}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] text-brand-gold font-bold uppercase tracking-widest block mb-2">Final Quote to Guest</label>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl font-serif text-neutral-400">Rs.</span>
                                            <input
                                                type="number"
                                                value={tripData.financials.sellingPrice}
                                                onChange={(e) => updateFinancials({ ...tripData.financials, sellingPrice: Number(e.target.value) })}
                                                className="w-full text-4xl font-serif font-bold bg-transparent border-none p-0 focus:ring-0 text-brand-green"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-8 rounded-[32px] border-2 flex flex-col items-center justify-center w-full md:w-64 transition-all
                                ${(tripData.financials.sellingPrice - totalInternalCost) > 0 ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Project Margin</p>
                                <p className={`text-5xl font-serif font-bold ${(tripData.financials.sellingPrice - totalInternalCost) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {tripData.financials.sellingPrice > 0 ? (((tripData.financials.sellingPrice - totalInternalCost) / tripData.financials.sellingPrice) * 100).toFixed(1) : 0}%
                                </p>
                                <div className="mt-4 flex items-center gap-2">
                                    {(tripData.financials.sellingPrice - totalInternalCost) > 1000 ? (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200">
                                            <ShieldCheck size={12} /> PROFITABLE
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full border border-red-200">
                                            <AlertTriangle size={12} /> LOSS RISK
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Professional PO Preview Modal */}
            {previewPO && (
                <div id="po-modal-overlay" className="fixed inset-0 z-[100] bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
                    <div id="po-modal-content" className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[40px] shadow-2xl relative flex flex-col">
                        <button
                            onClick={() => setPreviewPO(null)}
                            className="absolute top-6 right-8 p-3 bg-neutral-100 text-neutral-500 rounded-full hover:bg-red-50 hover:text-red-500 transition-all z-20 no-print"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-12 md:p-16 space-y-12">
                            {renderPOContent(previewPO as DBPurchaseOrder & { items: DBPurchaseOrderItem[] })}
                        </div>

                        {/* Sticky Action Footer */}
                        <div className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-neutral-100 p-8 flex items-center justify-center gap-4 no-print">
                            <button
                                onClick={() => window.print()}
                                className="px-8 py-3 bg-brand-charcoal text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl flex items-center gap-3"
                            >
                                <Send size={18} /> Download / Print PDF
                            </button>
                            <button
                                onClick={() => setPreviewPO(null)}
                                className="px-8 py-3 bg-neutral-100 text-neutral-500 font-bold rounded-2xl hover:bg-neutral-200 transition-all font-mono text-sm uppercase tracking-widest"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Injections Section: This is rendered OUTSIDE all modals and overlays for 100% clean PDF generation */}
            {(previewPO && typeof document !== 'undefined') && createPortal(
                <div id="po-print-only">
                    <div className="p-12 md:p-16 space-y-12 bg-white">
                        {renderPOContent(previewPO as DBPurchaseOrder & { items: DBPurchaseOrderItem[] })}
                    </div>
                </div>,
                document.body
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    /* Hide everything that is a direct child of body except our print section */
                    body > *:not(#po-print-only) { display: none !important; }
                    
                    /* Show ONLY the dedicated print section */
                    #po-print-only { 
                        display: block !important; 
                        visibility: visible !important;
                        position: absolute !important; 
                        top: 0 !important; 
                        left: 0 !important; 
                        width: 100% !important; 
                        height: auto !important;
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        font-size: 9pt !important;
                        line-height: 1.2 !important;
                    }

                    /* Shrink specific elements for print */
                    #po-print-only h1 { font-size: 9pt !important; line-height: 1 !important; }
                    #po-print-only h2 { font-size: 9pt !important; line-height: 1 !important; }
                    #po-print-only h3 { font-size: 7pt !important; margin-bottom: 0.1rem !important; }
                    #po-print-only .p-12, #po-print-only .p-16 { padding: 1rem !important; }
                    #po-print-only .gap-12 { gap: 1rem !important; }
                    #po-print-only .gap-4 { gap: 0.5rem !important; }
                    #po-print-only .py-12 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
                    #po-print-only .pt-16 { padding-top: 0.5rem !important; }
                    #po-print-only .py-6 { padding-top: 0.2rem !important; padding-bottom: 0.2rem !important; }
                    #po-print-only .space-y-12 > * + * { margin-top: 1rem !important; }
                    #po-print-only .space-y-4 > * + * { margin-top: 0.1rem !important; }
                    #po-print-only .rounded-[32px], #po-print-only .rounded-[40px], #po-print-only .rounded-3xl { border-radius: 2px !important; }
                    #po-print-only table { font-size: 7pt !important; }
                    #po-print-only .w-10 { width: 1.5rem !important; height: 1.5rem !important; }
                    #po-print-only .w-14 { width: 2rem !important; height: 2rem !important; }
                    
                    /* Force strict horizontal header and columns */
                    #po-print-only .grid { grid-template-columns: 1fr 1fr !important; gap: 1rem !important; }
                    #po-print-only .flex-col, #po-print-only .flex-row { flex-direction: row !important; align-items: center !important; }
                    #po-print-only .items-start { align-items: center !important; }
                    #po-print-only .min-w-[280px], #po-print-only .min-w-[200px] { min-width: 0 !important; width: auto !important; }
                    #po-print-only .gap-4, #po-print-only .gap-2, #po-print-only .gap-3 { gap: 0.25rem !important; }
                    
                    /* Force color printing and clean layout */
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    tr { page-break-inside: avoid !important; }
                    @page { margin: 0.5cm; size: auto; }
                }

                @media screen {
                    #po-print-only { display: none !important; }
                }
            `}} />
        </div>
    );
}

// Helper: Common PO Content Renderer
function renderPOContent(po: DBPurchaseOrder & { items: DBPurchaseOrderItem[] }) {
    return (
        <>
            {/* Document Header */}
            <div className="flex flex-row justify-between items-center gap-2 border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-3">
                    <img src="/images/nilathra_travels_logo.jpeg" alt="Nilathra Travels" className="w-10 h-10 object-contain rounded-lg" />
                    <div className="space-y-4">
                        <div className="space-y-0 text-left">
                            <h1 className="text-sm font-serif font-black text-brand-charcoal tracking-tight leading-none uppercase">Nilathra Travels</h1>
                            <p className="text-[7px] font-bold text-brand-gold uppercase tracking-tight leading-none">By Nilathra Hotel Management (Pvt) Ltd</p>
                        </div>
                        <div className="text-sm text-neutral-500 leading-relaxed font-medium">
                            <p>145, Wajira Road, Colombo 05,</p>
                            <p>Sri Lanka.</p>
                            <p className="mt-2 text-brand-charcoal font-bold">T: +94 77 727 8282 | E: bookings@nilathra.com</p>
                        </div>
                    </div>
                </div>
                <div className="bg-neutral-50 p-4 md:p-6 rounded-lg border border-neutral-100 min-w-[200px]">
                    <h2 className="text-xl font-serif font-bold text-brand-charcoal mb-2">Purchase Order</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[8px]">
                            <span className="text-neutral-400 font-bold uppercase tracking-widest">PO Number</span>
                            <span className="font-mono font-bold text-brand-charcoal">{po.po_number}</span>
                        </div>
                        <div className="flex justify-between text-[8px] border-t border-neutral-200 pt-2">
                            <span className="text-neutral-400 font-bold uppercase tracking-widest">Issue Date</span>
                            <span className="font-bold text-brand-charcoal">{po.po_date}</span>
                        </div>
                        <div className="flex justify-between text-[8px] border-t border-neutral-200 pt-2">
                            <span className="text-neutral-400 font-bold uppercase tracking-widest">Status</span>
                            <span className={`px-1.5 py-0.5 rounded-full font-black uppercase text-[7px] tracking-tighter
                                ${po.status === 'Draft' ? 'bg-neutral-100 text-neutral-500' :
                                    po.status === 'Sent' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                {po.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vendor & Trip Reference */}
            <div className="grid grid-cols-2 gap-6 border-t border-b border-neutral-100 py-6">
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">Supplier Information</h3>
                    <div className="space-y-1">
                        <p className="text-xl font-bold text-brand-charcoal">{po.vendor_name}</p>
                        <div className="text-sm text-neutral-500 space-y-1">
                            {po.vendor_address && <p>{po.vendor_address}</p>}
                            {po.vendor_phone && <p>T: {po.vendor_phone}</p>}
                            {po.vendor_email && <p>E: {po.vendor_email}</p>}
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">Trip Information</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-neutral-50 rounded-full flex items-center justify-center text-brand-gold">
                                <Calculator size={14} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-brand-charcoal">Reference Booking</p>
                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter">Please quote PO with Invoice</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-neutral-50 rounded-full flex items-center justify-center text-brand-gold">
                                <RefreshCw size={14} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-brand-charcoal">{po.items?.[0]?.service_date} Start</p>
                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter">Tour Schedule Reference</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Itemized Table */}
            <div className="space-y-6">
                <h3 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">Service Details</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-neutral-100 text-left">
                                <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-2">Date</th>
                                <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-2">Description</th>
                                <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">Qty</th>
                                <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right whitespace-nowrap">Unit Price (LKR)</th>
                                <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right pr-2">Total (LKR)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                            {(po.items || []).map((item: DBPurchaseOrderItem, idx: number) => (
                                <tr key={item.id} className="text-sm">
                                    <td className="py-6 text-neutral-500 pl-2 align-top">{item.service_date}</td>
                                    <td className="py-6 pr-4 align-top">
                                        <div className="space-y-1">
                                            <p className="font-bold text-brand-charcoal">{item.description}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {item.room_type && <span className="text-[9px] bg-neutral-50 text-neutral-500 font-bold uppercase px-1.5 py-0.5 rounded tracking-tighter">Room: {item.room_type}</span>}
                                                {item.meal_plan && <span className="text-[9px] bg-neutral-50 text-neutral-500 font-bold uppercase px-1.5 py-0.5 rounded tracking-tighter">Meal: {item.meal_plan}</span>}
                                                {item.vehicle_type && <span className="text-[9px] bg-neutral-50 text-neutral-500 font-bold uppercase px-1.5 py-0.5 rounded tracking-tighter">Vehicle: {item.vehicle_type}</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 text-center text-brand-charcoal font-bold align-top">{item.quantity}</td>
                                    <td className="py-6 text-right text-neutral-500 align-top">{(item.unit_price || 0).toLocaleString()}</td>
                                    <td className="py-6 text-right text-brand-charcoal font-bold pr-2 align-top">{(item.total_price || 0).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary & Totals */}
            <div className="flex flex-col md:flex-row justify-between gap-12 pt-8 border-t border-neutral-100">
                <div className="flex-1 space-y-6">
                    <div className="p-8 bg-neutral-50 rounded-[32px] border border-neutral-100">
                        <h4 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] mb-4">Notes & Remarks</h4>
                        <p className="text-xs text-neutral-500 leading-relaxed italic">
                            {po.vendor_notes || "All bookings are subject to our standard terms and conditions. Please confirm acceptance of this purchase order within 48 hours of issuance."}
                        </p>
                    </div>
                </div>
                <div className="w-full md:w-80 space-y-4">
                    <div className="flex justify-between text-sm py-2">
                        <span className="text-neutral-400 font-bold uppercase tracking-widest">Subtotal</span>
                        <span className="font-bold text-brand-charcoal">LKR {po.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-t border-neutral-50">
                        <span className="text-neutral-400 font-bold uppercase tracking-widest">Tax (VAT)</span>
                        <span className="font-bold text-brand-charcoal">LKR {(po.tax || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-6 bg-brand-charcoal text-white rounded-3xl mt-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total Amount</span>
                        <span className="text-2xl font-serif font-black">LKR {po.total_amount.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Footnote */}
            <div className="text-center pt-16">
                <p className="text-[10px] text-neutral-300 font-bold uppercase tracking-[0.4em] mb-4">Digitally Generated Document • Nilathra Travels Official PO</p>
                <div className="flex justify-center flex-wrap gap-8 grayscale opacity-30">
                    <div className="text-[10px] font-black p-2 border border-neutral-200 uppercase tracking-widest">Confirmed Excellence</div>
                    <div className="text-[10px] font-black p-2 border border-neutral-200 uppercase tracking-widest">Sustainable Sri Lanka</div>
                </div>
            </div>
        </>
    );
}
